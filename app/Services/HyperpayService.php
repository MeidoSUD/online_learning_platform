<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

/**
 * ============================================================================
 * HyperPay Copy & Pay Integration - PCI-DSS Compliant
 * ============================================================================
 * 
 * IMPORTANT CHANGES FROM PREVIOUS VERSION:
 * 
 * ❌ REMOVED:
 *    - directPayment() method - Server never receives card data
 *    - Card field handling (card.number, card.cvv, etc)
 *    - All server-side card processing logic
 * 
 * ✅ ADDED:
 *    - createCheckout() - Only backend creates checkout sessions
 *    - Tokenization support for saved payment methods
 *    - registrationId handling for saved cards
 * 
 * WHY THIS IS COMPLIANT:
 * - Checkout widget is hosted on HyperPay (PCI-DSS certified)
 * - Customer enters card details ONLY in the HyperPay widget
 * - Backend NEVER receives card details
 * - Backend only receives registrationId (token) for saved cards
 * - No PCI-DSS certification required for backend
 * 
 * FLOW:
 * 1. App calls backend: createCheckout() → returns checkoutId
 * 2. App loads HyperPay Copy & Pay widget with checkoutId
 * 3. Customer enters card details IN THE WIDGET (secure, PCI-compliant)
 * 4. HyperPay processes payment
 * 5. App calls backend: paymentStatus(checkoutId) to confirm
 * 6. If successful, backend receives registrationId for future use
 * 
 * ============================================================================
 */
class HyperpayService
{
    protected string $base;
    protected ?string $entityId;
    protected ?string $authHeader;
    protected int $timeout;

    public function __construct()
    {
        $this->base = rtrim(config('hyperpay.base_url'), '/');
        $this->entityId = config('hyperpay.entity_id');
        $this->authHeader = config('hyperpay.authorization');
        $this->timeout = intval(config('hyperpay.timeout', 30));

        if (empty($this->authHeader)) {
            Log::warning('HyperpayService missing authorization configuration', [
                'authorization_set' => !empty($this->authHeader)
            ]);
        }
    }

    protected function headers(): array
    {
        $headers = [
            'Accept' => 'application/json',
        ];
        if (!empty($this->authHeader)) {
            $headers['Authorization'] = $this->authHeader;
        }
        return $headers;
    }

    /**
     * ========================================================================
     * CREATE CHECKOUT - PCI-DSS Compliant
     * ========================================================================
     * 
     * Creates a HyperPay checkout session for the Copy & Pay widget.
     * This endpoint does NOT receive card details - only creates the session.
     * 
     * Backend never touches card data. Customer enters details in HyperPay widget.
     * 
     * @param array $payload {
     *     'amount'          => '100.00',        // Required: Amount in decimal format
     *     'currency'        => 'SAR',           // Required: 3-letter currency code
     *     'paymentBrand'    => 'VISA',          // Optional: VISA|MASTER|MADA
     *     'merchantTransactionId' => 'txn_123', // Optional: Your transaction ID
     *     'customer_email'  => 'user@example.com', // Optional: For receipt
     *     'customer_id'     => 'cust_123',      // Optional: Customer reference
     *     'registrationId'  => 'reg_token',     // Optional: For saved card payment
     *     'platform'        => 'iOS|Android',   // Optional: Mobile platform for deep linking
     * }
     * 
     * @return \Illuminate\Http\Client\Response
     * @throws Exception
     */
    public function createCheckout(array $payload)
    {
        // Validate required fields
        if (empty($payload['amount'])) {
            throw new Exception('Amount is required for checkout');
        }
        if (empty($payload['currency'])) {
            throw new Exception('Currency is required for checkout');
        }

        // Select entity ID based on payment brand
        $brand = strtoupper($payload['paymentBrand'] ?? '');
        $entityId = $this->selectEntityIdByBrand($brand);

        // Build HyperPay checkout request
        // See: https://developers.hyper-pay.com/docs/copy-pay
        $checkoutPayload = [
            'entityId' => $entityId,
            'amount' => number_format((float)$payload['amount'], 2, '.', ''),
            'currency' => strtoupper($payload['currency']),
            'paymentType' => 'DB', // Debit - immediate capture
            'integrity' => 'true', // Request checksum validation for security
        ];

        // Add optional fields if provided
        if (!empty($payload['merchantTransactionId'])) {
            $checkoutPayload['merchantTransactionId'] = $payload['merchantTransactionId'];
        }

        // NOTE: Removed customer.email and customer.id as HyperPay reports them as "not allowed parameters"
        // These can be stored in your local database instead if needed

        // If using saved card (registrationId), add it for tokenized payment
        if (!empty($payload['registrationId'])) {
            $checkoutPayload['registrationId'] = $payload['registrationId'];
        }

        // Enable 3D Secure for added security
        $checkoutPayload['customParameters[3DS2_enrolled]'] = 'true';

        // ========================================================================
        // DYNAMIC SHOPPER RESULT URL - Platform-Specific Deep Linking
        // ========================================================================
        // After payment, HyperPay redirects to this URL with the checkout ID
        // This allows the app to intercept the response via deep linking
        // 
        // iOS: com.ewangeniuses.ewanapp.payments://checkout/{checkoutId}
        // Android: com.ewan_mobile_app.payments://checkout/{checkoutId}
        // Web/Browser fallback: https://api.example.com/payment-callback
        // ========================================================================
        $shopperResultUrl = $this->generateShopperResultUrl($payload['platform'] ?? null);
        if (!empty($shopperResultUrl)) {
            $checkoutPayload['shopperResultUrl'] = $shopperResultUrl;
        }

        Log::info('HyperPay Copy & Pay Checkout Created', [
            'amount' => $checkoutPayload['amount'],
            'currency' => $checkoutPayload['currency'],
            'brand' => $brand,
            'entityId' => $entityId,
            'has_registration_id' => !empty($payload['registrationId']),
            'platform' => $payload['platform'] ?? 'unknown',
            'shopper_result_url' => $shopperResultUrl ?? 'not_set',
        ]);

        // NOTE: HyperPay doesn't return redirectUrl in the response.
        // The checkout ID is returned and we construct the URL on the client:
        // Format: {base_url}/v1/checkouts/{checkoutId}/payment.html
        $url = $this->base . '/v1/checkouts';
        $response = Http::withHeaders($this->headers())
                        ->timeout($this->timeout)
                        ->asForm()
                        ->post($url, $checkoutPayload);

        if (!$response->successful()) {
            Log::error('HyperPay checkout creation failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'amount' => $checkoutPayload['amount'],
            ]);
        }

        return $response;
    }

    /**
     * ========================================================================
     * GET PAYMENT STATUS - Check if payment succeeded
     * ========================================================================
     * 
     * Polls HyperPay for the payment status using the checkout ID.
     * 
     * This is called after the Copy & Pay widget completes to verify payment.
     * If successful and customer wanted to save the card, registrationId is returned.
     * 
     * @param string $checkoutId HyperPay checkout ID
     * @return \Illuminate\Http\Client\Response
     * @throws Exception
     */
    public function getPaymentStatus(string $checkoutId)
    {
        if (empty($checkoutId)) {
            throw new Exception('Checkout ID is required');
        }

        Log::info('Checking HyperPay payment status', ['checkoutId' => $checkoutId]);

        $url = $this->base . '/v1/checkouts/' . $checkoutId;
        $response = Http::withHeaders($this->headers())
                        ->timeout($this->timeout)
                        ->get($url);

        if ($response->successful()) {
            $data = $response->json();
            $resultCode = $data['result']['code'] ?? null;
            $resultStatus = $data['result']['description'] ?? null;

            // Log payment result
            Log::info('HyperPay payment status retrieved', [
                'checkoutId' => $checkoutId,
                'code' => $resultCode,
                'status' => $resultStatus,
                'has_registration_id' => !empty($data['registrationId']),
            ]);
        } else {
            Log::error('HyperPay payment status check failed', [
                'checkoutId' => $checkoutId,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        }

        return $response;
    }

    /**
     * ========================================================================
     * SAVE PAYMENT METHOD (TOKENIZATION)
     * ========================================================================
     * 
     * After a successful payment with "save card" option, HyperPay returns
     * a registrationId. This method doesn't call HyperPay - it's just a helper
     * to understand the flow.
     * 
     * The PaymentController handles extracting registrationId from the response
     * and storing it in the SavedCard model.
     * 
     * @return void - See PaymentController::savePaymentMethod()
     */

    /**
     * ========================================================================
     * HELPER METHODS
     * ========================================================================
     */

    /**
     * Select HyperPay entity ID based on payment brand
     * Different entity IDs are used for VISA, MASTERCARD, and MADA
     * If no brand is provided or no specific entity ID is configured, 
     * falls back to the default entity ID.
     * 
     * @param string $brand VISA|MASTER|MADA or empty string
     * @return string Entity ID for the brand
     * @throws Exception
     */
    private function selectEntityIdByBrand(string $brand): string
    {
        // Normalize brand to uppercase and trim whitespace
        $brand = strtoupper(trim($brand ?? ''));

        if ($brand === 'VISA' && config('hyperpay.visa_entity_id')) {
            return config('hyperpay.visa_entity_id');
        }

        if ($brand === 'MASTER' && config('hyperpay.master_entity_id')) {
            return config('hyperpay.master_entity_id');
        }

        if ($brand === 'MADA' && config('hyperpay.mada_entity_id')) {
            return config('hyperpay.mada_entity_id');
        }

        // Fallback to default entity ID if available
        if ($this->entityId) {
            return $this->entityId;
        }

        throw new Exception('HyperPay entity_id not configured for brand: ' . ($brand ?: 'default'));
    }

    /**
     * ========================================================================
     * GENERATE SHOPPER RESULT URL - Platform-Specific Deep Linking
     * ========================================================================
     * 
     * Creates a platform-specific deep link URL that HyperPay will redirect to
     * after payment completion. This allows the mobile app to intercept the
     * payment result and handle it natively.
     * 
     * The actual checkoutId will be appended by the caller.
     * 
     * Supported platforms:
     * - iOS: com.ewangeniuses.ewanapp.payments://checkout?id={checkoutId}
     * - Android: com.ewan_mobile_app.payments://checkout?id={checkoutId}
     * - Web/Browser: https://api.example.com/payment-callback?id={checkoutId}
     * 
     * @param string|null $platform Platform identifier: 'iOS', 'Android', or null
     * @return string|null Deep link URL or null if no platform specified
     */
    private function generateShopperResultUrl(?string $platform): ?string
    {
        if (empty($platform)) {
            return null;
        }

        // Normalize platform identifier (case-insensitive)
        $platform = strtolower(trim($platform));

        // iOS deep link scheme
        if ($platform === 'ios') {
            return 'com.ewangeniuses.ewanapp.payments://checkout';
        }

        // Android deep link scheme
        if ($platform === 'android') {
            return 'com.ewan_mobile_app.payments://checkout';
        }

        // Unknown platform - return null to skip setting shopperResultUrl
        Log::warning('Unknown platform for HyperPay shopperResultUrl', ['platform' => $platform]);
        return null;
    }
}

