<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class MoyasarPay
{
    private $apiKey;
    private $baseUrl = 'https://api.moyasar.com/v1';

    public function __construct()
    {
        $this->apiKey = config('moyasar.api_key');
        
        if (!$this->apiKey) {
            throw new Exception('Moyasar API key is not configured');
        }
    }

    /**
     * Create a new payment
     * 
     * @param array $data Payment data including:
     *   - given_id: UUID for idempotency
     *   - amount: Amount in smallest currency unit
     *   - currency: ISO-4217 currency code
     *   - description: Human readable description
     *   - callback_url: URL for card payment callback
     *   - source: Payment source (creditcard, apple_pay, samsung_pay, stc_pay)
     *   - metadata: Additional metadata (customer_email, customer_id, etc.)
     * 
     * @return array Payment response
     * @throws Exception
     */
    public function createPayment(array $data): array
    {
        try {
            // IMPORTANT: Moyasar expects amount in halala (smallest currency unit)
            // SAR 200.00 = 20000 halala
            // If amount is NOT already in halala (e.g., received as 200), multiply by 100
            $amount = $data['amount'] ?? 0;
            
            // Check if amount needs conversion
            // If amount is decimal (e.g., 200.50) or small (< 100), assume it's in SAR
            if ($amount < 100 || (is_float($amount) && fmod($amount, 1) > 0)) {
                $data['amount'] = intval($amount * 100);
            } else {
                // Already in halala format or very large, keep as is
                $data['amount'] = intval($amount);
            }

            Log::info('Moyasar: Creating payment', [
                'given_id' => $data['given_id'] ?? null,
                'amount' => $data['amount'] . ' halala',
                'currency' => $data['currency'] ?? null,
            ]);

            // Validate required fields
            $this->validateCreatePaymentData($data);

            $response = Http::withBasicAuth($this->apiKey, '')
                ->post("{$this->baseUrl}/payments", $data);

            if (!$response->successful()) {
                $error = $response->json();
                Log::error('Moyasar: Payment creation failed', [
                    'status' => $response->status(),
                    'error' => $error,
                    'data' => $data,
                ]);

                throw new Exception(
                    $error['message'] ?? "Payment creation failed: {$response->status()}",
                    $response->status()
                );
            }

            $paymentData = $response->json();
            Log::info('Moyasar: Payment created successfully', [
                'payment_id' => $paymentData['id'] ?? null,
                'status' => $paymentData['status'] ?? null,
            ]);

            return $paymentData;
        } catch (Exception $e) {
            Log::error('Moyasar: Payment creation exception', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            throw $e;
        }
    }

    /**
     * Create a new invoice (hosted checkout)
     * 
     * @param array $data Invoice data including:
     *   - amount: Amount in smallest currency unit
     *   - currency: ISO-4217 currency code
     *   - description: Human readable description
     *   - callback_url: URL for redirection after payment
     *   - metadata: Additional metadata
     * 
     * @return array Invoice response
     * @throws Exception
     */
    public function createInvoice(array $data): array
    {
        try {
            // IMPORTANT: Moyasar expects amount in halala (smallest currency unit)
            // SAR 200.00 = 20000 halala
            // If amount is NOT already in halala (e.g., received as 200), multiply by 100
            $amount = $data['amount'] ?? 0;
            
            // Check if amount needs conversion
            // If amount is decimal (e.g., 200.50) or small (< 100), assume it's in SAR
            if ($amount < 100 || (is_float($amount) && fmod($amount, 1) > 0)) {
                $data['amount'] = intval($amount * 100);
            } else {
                // Already in halala format or very large, keep as is
                $data['amount'] = intval($amount);
            }

            Log::info('Moyasar: Creating invoice', [
                'amount' => $data['amount'] . ' halala',
                'currency' => $data['currency'] ?? null,
            ]);

            $response = Http::withBasicAuth($this->apiKey, '')
                ->post("{$this->baseUrl}/invoices", $data);

            if (!$response->successful()) {
                $error = $response->json();
                Log::error('Moyasar: Invoice creation failed', [
                    'status' => $response->status(),
                    'error' => $error,
                    'data' => $data,
                ]);

                throw new Exception(
                    $error['message'] ?? "Invoice creation failed: {$response->status()}",
                    $response->status()
                );
            }

            $invoiceData = $response->json();
            Log::info('Moyasar: Invoice created successfully', [
                'invoice_id' => $invoiceData['id'] ?? null,
                'url' => $invoiceData['url'] ?? null,
            ]);

            return $invoiceData;
        } catch (Exception $e) {
            Log::error('Moyasar: Invoice creation exception', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            throw $e;
        }
    }

    /**
     * Fetch payment details by ID
     * 
     * @param string $paymentId Payment ID (starts with pay_)
     * @return array Payment details
     * @throws Exception
     */
    public function fetchPayment(string $paymentId): array
    {
        try {
            Log::info('Moyasar: Fetching payment', ['payment_id' => $paymentId]);

            if (empty($paymentId)) {
                throw new Exception('Payment ID is required');
            }

            $response = Http::withBasicAuth($this->apiKey, '')
                ->get("{$this->baseUrl}/payments/{$paymentId}");

            if (!$response->successful()) {
                $error = $response->json();
                Log::error('Moyasar: Fetch payment failed', [
                    'status' => $response->status(),
                    'payment_id' => $paymentId,
                    'error' => $error,
                ]);

                throw new Exception(
                    $error['message'] ?? "Failed to fetch payment: {$response->status()}",
                    $response->status()
                );
            }

            $paymentData = $response->json();
            Log::info('Moyasar: Payment fetched successfully', [
                'payment_id' => $paymentData['id'] ?? null,
                'status' => $paymentData['status'] ?? null,
            ]);

            return $paymentData;
        } catch (Exception $e) {
            Log::error('Moyasar: Fetch payment exception', [
                'payment_id' => $paymentId,
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            throw $e;
        }
    }

    /**
     * Fetch invoice details by ID
     * 
     * @param string $invoiceId Invoice ID
     * @return array Invoice details
     * @throws Exception
     */
    public function fetchInvoice(string $invoiceId): array
    {
        try {
            Log::info('Moyasar: Fetching invoice', ['invoice_id' => $invoiceId]);

            if (empty($invoiceId)) {
                throw new Exception('Invoice ID is required');
            }

            $response = Http::withBasicAuth($this->apiKey, '')
                ->get("{$this->baseUrl}/invoices/{$invoiceId}");

            if (!$response->successful()) {
                $error = $response->json();
                Log::error('Moyasar: Fetch invoice failed', [
                    'status' => $response->status(),
                    'invoice_id' => $invoiceId,
                    'error' => $error,
                ]);

                throw new Exception(
                    $error['message'] ?? "Failed to fetch invoice: {$response->status()}",
                    $response->status()
                );
            }

            $invoiceData = $response->json();
            Log::info('Moyasar: Invoice fetched successfully', [
                'invoice_id' => $invoiceData['id'] ?? null,
                'status' => $invoiceData['status'] ?? null,
            ]);

            return $invoiceData;
        } catch (Exception $e) {
            Log::error('Moyasar: Fetch invoice exception', [
                'invoice_id' => $invoiceId,
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            throw $e;
        }
    }

    /**
     * Refund a payment (full or partial)
     * 
     * @param string $paymentId Payment ID to refund
     * @param int|null $amount Amount to refund (in smallest currency unit). If null, refund full amount
     * @return array Refund response
     * @throws Exception
     */
    public function refundPayment(string $paymentId, ?int $amount = null): array
    {
        try {
            Log::info('Moyasar: Processing refund', [
                'payment_id' => $paymentId,
                'amount' => $amount,
            ]);

            if (empty($paymentId)) {
                throw new Exception('Payment ID is required');
            }

            $payload = [];
            if ($amount !== null) {
                $payload['amount'] = $amount;
            }

            $response = Http::withBasicAuth($this->apiKey, '')
                ->post("{$this->baseUrl}/payments/{$paymentId}/refund", $payload);

            if (!$response->successful()) {
                $error = $response->json();
                Log::error('Moyasar: Refund failed', [
                    'status' => $response->status(),
                    'payment_id' => $paymentId,
                    'error' => $error,
                ]);

                throw new Exception(
                    $error['message'] ?? "Refund failed: {$response->status()}",
                    $response->status()
                );
            }

            $refundData = $response->json();
            Log::info('Moyasar: Refund processed successfully', [
                'payment_id' => $paymentData['id'] ?? null,
                'refunded_amount' => $refundData['refunded'] ?? null,
            ]);

            return $refundData;
        } catch (Exception $e) {
            Log::error('Moyasar: Refund exception', [
                'payment_id' => $paymentId,
                'amount' => $amount,
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            throw $e;
        }
    }

    /**
     * List payments with optional filters
     * 
     * @param array $filters Optional filters:
     *   - limit: Number of records (default 10, max 100)
     *   - skip: Number of records to skip for pagination
     *   - created[gte]: Filter by creation date (greater than or equal)
     *   - created[lte]: Filter by creation date (less than or equal)
     *   - status: Filter by status (initiated, paid, failed)
     *   - amount: Filter by amount
     * 
     * @return array Payments list with metadata
     * @throws Exception
     */
    public function listPayments(array $filters = []): array
    {
        try {
            // Set default limit
            if (!isset($filters['limit'])) {
                $filters['limit'] = 10;
            }

            // Validate limit (max 100)
            if ($filters['limit'] > 100) {
                $filters['limit'] = 100;
            }

            Log::info('Moyasar: Listing payments', ['filters' => $filters]);

            $response = Http::withBasicAuth($this->apiKey, '')
                ->get("{$this->baseUrl}/payments", $filters);

            if (!$response->successful()) {
                $error = $response->json();
                Log::error('Moyasar: List payments failed', [
                    'status' => $response->status(),
                    'filters' => $filters,
                    'error' => $error,
                ]);

                throw new Exception(
                    $error['message'] ?? "Failed to list payments: {$response->status()}",
                    $response->status()
                );
            }

            $paymentsData = $response->json();
            Log::info('Moyasar: Payments listed successfully', [
                'count' => count($paymentsData['data'] ?? []),
                'total' => $paymentsData['meta']['total'] ?? null,
            ]);

            return $paymentsData;
        } catch (Exception $e) {
            Log::error('Moyasar: List payments exception', [
                'filters' => $filters,
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            throw $e;
        }
    }

    /**
     * Validate create payment data
     * 
     * @param array $data
     * @throws Exception
     */
    private function validateCreatePaymentData(array $data): void
    {
        $required = ['amount', 'currency', 'source'];

        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("Field '{$field}' is required for payment creation");
            }
        }

        if (!is_int($data['amount']) || $data['amount'] <= 0) {
            throw new Exception('Amount must be a positive integer');
        }

        if (empty($data['source']['type'])) {
            throw new Exception('Source type is required');
        }

        if (in_array($data['source']['type'], ['creditcard', 'token']) && empty($data['callback_url'])) {
            throw new Exception('callback_url is required for credit card or token payments');
        }
    }

    /**
     * Check if a payment is paid
     * 
     * @param string $paymentId
     * @return bool
     */
    public function isPaid(string $paymentId): bool
    {
        try {
            $payment = $this->fetchPayment($paymentId);
            return $payment['status'] === 'paid';
        } catch (Exception $e) {
            Log::error('Moyasar: Error checking payment status', [
                'payment_id' => $paymentId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get payment status
     * 
     * @param string $paymentId
     * @return string|null Status: initiated, paid, or failed
     */
    public function getPaymentStatus(string $paymentId): ?string
    {
        try {
            $payment = $this->fetchPayment($paymentId);
            return $payment['status'] ?? null;
        } catch (Exception $e) {
            Log::error('Moyasar: Error getting payment status', [
                'payment_id' => $paymentId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    // ========================================================================
    // TOKEN MANAGEMENT - Save cards for future payments
    // ========================================================================

    /**
     * Create a tokenized card (for saving cards)
     * 
     * This creates a token that can be used for future payments without
     * requiring the customer to enter card details again.
     *
     * @param array $data Card data including:
     *   - name: Cardholder name (e.g., "Mohammed Ali")
     *   - number: Card number (e.g., "4111111111111111")
     *   - month: Expiry month (e.g., "09")
     *   - year: Expiry year (e.g., "27")
     *   - cvc: Security code (e.g., "911")
     *   - callback_url: URL for 3D verification callback (optional)
     *   - metadata: Additional metadata (optional)
     *
     * @return array Token response with:
     *   - id: Token ID (e.g., "token_x6okRgkZJrhgDHyqJ9zztW2X1k")
     *   - status: "initiated"
     *   - brand: Card brand (visa, mastercard, etc.)
     *   - last_four: Last 4 digits
     *   - name: Cardholder name
     *   - month: Expiry month
     *   - year: Expiry year
     *
     * @throws Exception
     */
    public function createToken(array $data): array
    {
        try {
            Log::info('Moyasar: Creating token for card', [
                'name' => $data['name'] ?? null,
                'last_four' => substr($data['number'] ?? '', -4),
            ]);

            // Validate required fields
            $required = ['name', 'number', 'month', 'year', 'cvc'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new Exception("Token creation requires: {$field}");
                }
            }

            $response = Http::withBasicAuth($this->apiKey, '')
                ->post("{$this->baseUrl}/tokens", $data);

            if (!$response->successful()) {
                $error = $response->json();
                Log::error('Moyasar: Token creation failed', [
                    'status' => $response->status(),
                    'error' => $error,
                ]);

                throw new Exception(
                    $error['message'] ?? "Token creation failed: {$response->status()}",
                    $response->status()
                );
            }

            $tokenData = $response->json();
            Log::info('Moyasar: Token created successfully', [
                'token_id' => $tokenData['id'] ?? null,
                'brand' => $tokenData['brand'] ?? null,
                'last_four' => $tokenData['last_four'] ?? null,
            ]);

            return $tokenData;
        } catch (Exception $e) {
            Log::error('Moyasar: Token creation exception', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            throw $e;
        }
    }

    /**
     * Fetch token details by ID
     * 
     * Used to verify token status before charging
     *
     * @param string $tokenId Token ID (e.g., "token_x6okRgkZJrhgDHyqJ9zztW2X1k")
     * @return array Token details
     * @throws Exception
     */
    public function fetchToken(string $tokenId): array
    {
        try {
            Log::info('Moyasar: Fetching token', ['token_id' => $tokenId]);

            if (empty($tokenId)) {
                throw new Exception('Token ID is required');
            }

            $response = Http::withBasicAuth($this->apiKey, '')
                ->get("{$this->baseUrl}/tokens/{$tokenId}");

            if (!$response->successful()) {
                $error = $response->json();
                Log::error('Moyasar: Fetch token failed', [
                    'status' => $response->status(),
                    'token_id' => $tokenId,
                    'error' => $error,
                ]);

                throw new Exception(
                    $error['message'] ?? "Failed to fetch token: {$response->status()}",
                    $response->status()
                );
            }

            $tokenData = $response->json();
            Log::info('Moyasar: Token fetched successfully', [
                'token_id' => $tokenData['id'] ?? null,
                'status' => $tokenData['status'] ?? null,
            ]);

            return $tokenData;
        } catch (Exception $e) {
            Log::error('Moyasar: Fetch token exception', [
                'token_id' => $tokenId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Delete a token (remove saved card)
     * 
     * Revokes the token so it can no longer be used for payments
     *
     * @param string $tokenId Token ID to delete
     * @return bool Success status
     * @throws Exception
     */
    public function deleteToken(string $tokenId): bool
    {
        try {
            Log::info('Moyasar: Deleting token', ['token_id' => $tokenId]);

            if (empty($tokenId)) {
                throw new Exception('Token ID is required');
            }

            $response = Http::withBasicAuth($this->apiKey, '')
                ->delete("{$this->baseUrl}/tokens/{$tokenId}");

            if (!$response->successful()) {
                $error = $response->json();
                Log::error('Moyasar: Delete token failed', [
                    'status' => $response->status(),
                    'token_id' => $tokenId,
                    'error' => $error,
                ]);

                throw new Exception(
                    $error['message'] ?? "Delete token failed: {$response->status()}",
                    $response->status()
                );
            }

            Log::info('Moyasar: Token deleted successfully', ['token_id' => $tokenId]);
            return true;
        } catch (Exception $e) {
            Log::error('Moyasar: Delete token exception', [
                'token_id' => $tokenId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
