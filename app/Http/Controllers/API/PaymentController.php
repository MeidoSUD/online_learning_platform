<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use App\Services\HyperpayService;
use App\Models\Payment;
use App\Models\SavedCard;
use App\Models\User;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Exception;

/**
 * ============================================================================
 * PaymentController - PCI-DSS Compliant
 * ============================================================================
 * 
 * IMPORTANT CHANGES FROM PREVIOUS VERSION:
 * 
 * ❌ REMOVED:
 *    - directPayment() method - Backend NO LONGER receives card data
 *    - Card validation rules (card.number, card.cvv, etc.)
 *    - Server-side card processing
 * 
 * ✅ ADDED:
 *    - createCheckout() - Creates checkout session for Copy & Pay widget
 *    - paymentStatus() - Polls payment status and stores registrationId
 *    - listSavedCards() - Get user's saved payment methods
 *    - deleteSavedCard() - Remove a saved card
 *    - savePaymentMethod() - Store registrationId after successful payment
 * 
 * WHY THIS IS BETTER:
 * - Backend NEVER receives card details
 * - No PCI-DSS certification needed
 * - Copy & Pay widget is PCI-certified by HyperPay
 * - Tokenization support for saved cards
 * - Supports 3D Secure natively
 * - Lower liability for data breaches
 * 
 * ============================================================================
 */
class PaymentController extends Controller
{
    use ApiResponse;

    protected HyperpayService $hyperpay;

    public function __construct(HyperpayService $hyperpay)
    {
        $this->hyperpay = $hyperpay;
        $this->middleware('auth:sanctum', ['except' => ['paymentStatus']]);
    }

    // ========================================================================
    // CREATE CHECKOUT - Initiate payment with Copy & Pay widget
    // ========================================================================

    /**
     * POST /api/payments/checkout
     * 
     * Create a HyperPay checkout session for the Copy & Pay widget.
     * Customer will enter card details IN THE WIDGET (not sent to backend).
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createCheckout(Request $request)
    {
        try {
            $request->validate([
                'amount' => 'required|numeric|min:1',
                'currency' => 'required|string|size:3',
                'payment_brand' => 'nullable|string|in:VISA,MASTER,MADA',
                'saved_card_id' => 'nullable|integer|exists:saved_cards,id',
                'customer_id' => 'nullable|string',
                'merchant_transaction_id' => 'nullable|string',
                'platform' => 'nullable|string|in:iOS,Android',
            ]);

            $user = auth()->user();

            // If using a saved card, get the registrationId
            $registrationId = null;
            if ($request->filled('saved_card_id')) {
                $savedCard = SavedCard::where('id', $request->saved_card_id)
                                      ->where('user_id', $user->id)
                                      ->firstOrFail();

                // Check if card is expired
                if ($savedCard->isExpired()) {
                    return $this->conflictError('Saved card has expired. Please use a different payment method.');
                }

                $registrationId = $savedCard->registration_id;
            }

            // Create checkout payload
            // NOTE: Only send amount, currency, and paymentBrand as required by HyperPay
            // customer.email and customer.id are not allowed by HyperPay API
            // Default payment_brand to VISA if not provided by Flutter app
            $paymentBrand = $request->payment_brand ?? 'VISA';
            
            $payload = [
                'amount' => $request->amount,
                'currency' => $request->currency,
                'paymentBrand' => $paymentBrand,
                'merchantTransactionId' => $request->merchant_transaction_id ?? 'txn_' . Str::random(16),
                'registrationId' => $registrationId, // Will be null if new card
                'platform' => $request->platform, // iOS or Android for platform-specific deep linking
            ];

            // Call HyperPay to create checkout
            $response = $this->hyperpay->createCheckout($payload);

            if (!$response->successful()) {
                Log::error('HyperPay checkout creation failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                throw new Exception('Failed to create payment session. HyperPay returned: ' . $response->status());
            }

            $data = $response->json();

            if (empty($data['id'])) {
                Log::warning('HyperPay checkout created but missing checkout ID', ['response' => $data]);
                throw new Exception('Invalid payment session response from HyperPay');
            }

            // Create payment record (status: pending until confirmed)
            $payment = Payment::create([
                'student_id' => $user->id,
                'booking_id' => null,
                'teacher_id' => null,
                'amount' => $request->amount,
                'currency' => strtoupper($request->currency),
                'payment_method' => 'HYPERPAY_COPYPAY',
                'status' => 'pending',
                'transaction_reference' => $data['id'],
                'gateway_reference' => $data['id'],
                'gateway_response' => json_encode($data),
            ]);

            // Construct the HyperPay Copy & Pay widget URL
            // Format: {base_url}/v1/checkouts/{checkoutId}/payment.html
            $checkoutId = $data['id'];
            $hyperpayBase = rtrim(config('hyperpay.base_url'), '/');
            $redirectUrl = $hyperpayBase . '/v1/checkouts/' . $checkoutId . '/payment.html';

            return $this->success([
                'checkout_id' => $checkoutId,
                'payment_id' => $payment->id,
                'redirect_url' => $redirectUrl,
                'amount' => $request->amount,
                'currency' => $request->currency,
            ], 'Checkout session created successfully');

        } catch (ValidationException $e) {
            return $this->validationError($e, 'Validation failed');
        } catch (Exception $e) {
            Log::error('Payment checkout error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return $this->serverError($e, 'Failed to create checkout');
        }
    }

    // ========================================================================
    // CHECK PAYMENT STATUS - Verify payment & save card
    // ========================================================================

    /**
     * POST /api/payments/status
     * 
     * Check the status of a payment after Copy & Pay widget completes.
     * If payment successful and customer saved card, registrationId is stored.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function paymentStatus(Request $request)
    {
        try {
            $request->validate([
                'checkout_id' => 'required|string',
                'save_card' => 'nullable|boolean',
            ]);

            $checkoutId = $request->checkout_id;

            // Get payment status from HyperPay
            $response = $this->hyperpay->getPaymentStatus($checkoutId);

            if (!$response->successful()) {
                Log::error('HyperPay status check failed', [
                    'checkoutId' => $checkoutId,
                    'status' => $response->status(),
                ]);

                throw new Exception('Failed to check payment status. HyperPay returned: ' . $response->status());
            }

            $data = $response->json();
            $resultCode = $data['result']['code'] ?? null;
            $resultDescription = $data['result']['description'] ?? 'Unknown error';

            // Update payment record with response
            $payment = Payment::where('gateway_reference', $checkoutId)->first();
            if (!$payment) {
                return $this->notFoundError('Payment record not found');
            }

            // Check if payment succeeded
            $isSuccessful = preg_match('/^(000\.000\.|000\.100\.1|000\.[36])/', $resultCode ?? '');

            if ($isSuccessful) {
                $payment->update([
                    'status' => 'paid',
                    'gateway_response' => json_encode($data),
                    'paid_at' => now(),
                ]);

                // Save card if requested and payment successful
                if ($request->save_card && !empty($data['registrationId'])) {
                    $this->savePaymentMethod(
                        $payment->student_id,
                        $data,
                        $request->card_brand ?? 'UNKNOWN'
                    );
                }

                return $this->success([
                    'payment_id' => $payment->id,
                    'status' => 'paid',
                    'amount' => $payment->amount,
                    'currency' => $payment->currency,
                    'transaction_id' => $data['id'] ?? $checkoutId,
                ], 'Payment successful');

            } else {
                $payment->update([
                    'status' => 'failed',
                    'gateway_response' => json_encode($data),
                ]);

                return $this->conflictError('Payment failed: ' . $resultDescription, [
                    'payment_id' => $payment->id,
                    'error_code' => $resultCode,
                ]);
            }

        } catch (ValidationException $e) {
            return $this->validationError($e, 'Validation failed');
        } catch (Exception $e) {
            Log::error('Payment status check error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return $this->serverError($e, 'Error checking payment status');
        }
    }

    // ========================================================================
    // SAVED CARDS - List and manage tokenized payment methods
    // ========================================================================

    /**
     * GET /api/payments/saved-cards
     * 
     * List all saved payment methods for the authenticated user.
     * Shows card display info (brand, last4, expiry) but never sensitive data.
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function listSavedCards()
    {
        try {
            $user = auth()->user();

            $savedCards = SavedCard::forUser($user->id)
                                   ->orderBy('is_default', 'desc')
                                   ->orderBy('created_at', 'desc')
                                   ->get()
                                   ->map(function ($card) {
                                       return [
                                           'id' => $card->id,
                                           'card_display' => $card->card_display,
                                           'card_brand' => $card->card_brand,
                                           'last4' => $card->last4,
                                           'expiry' => $card->expiry_display,
                                           'is_expired' => $card->isExpired(),
                                           'is_default' => $card->is_default,
                                           'nickname' => $card->nickname,
                                           'created_at' => $card->created_at,
                                       ];
                                   });

            return $this->success([
                'saved_cards' => $savedCards,
                'count' => count($savedCards),
            ], 'Saved cards retrieved successfully');

        } catch (Exception $e) {
            Log::error('List saved cards error: ' . $e->getMessage());
            return $this->serverError($e, 'Failed to retrieve saved cards');
        }
    }

    /**
     * POST /api/payments/saved-cards/{id}/default
     * 
     * Set a saved card as the default payment method.
     * 
     * @param SavedCard $savedCard
     * @return \Illuminate\Http\JsonResponse
     */
    public function setDefaultSavedCard(SavedCard $savedCard)
    {
        try {
            $user = auth()->user();

            if ($savedCard->user_id !== $user->id) {
                return $this->authorizationError('Unauthorized to modify this saved card');
            }

            $savedCard->setAsDefault();

            return $this->success([
                'id' => $savedCard->id,
                'is_default' => true,
            ], 'Default payment method updated');

        } catch (Exception $e) {
            Log::error('Set default card error: ' . $e->getMessage());
            return $this->serverError($e, 'Failed to set default card');
        }
    }

    /**
     * DELETE /api/payments/saved-cards/{id}
     * 
     * Delete a saved payment method.
     * Note: registrationId is not revoked from HyperPay (tokens can remain valid)
     * but is soft-deleted and won't appear in the app.
     * 
     * @param SavedCard $savedCard
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteSavedCard(SavedCard $savedCard)
    {
        try {
            $user = auth()->user();

            if ($savedCard->user_id !== $user->id) {
                return $this->authorizationError('Unauthorized to delete this saved card');
            }

            $cardDisplay = $savedCard->card_display;
            $savedCard->delete();

            return $this->success([], 'Saved card "' . $cardDisplay . '" has been removed');

        } catch (Exception $e) {
            Log::error('Delete saved card error: ' . $e->getMessage());
            return $this->serverError($e, 'Failed to delete saved card');
        }
    }

    // ========================================================================
    // PRIVATE HELPERS
    // ========================================================================

    /**
     * Save a payment method after successful payment with registration token.
     * 
     * This is called internally after successful payment if customer
     * selected "Save this card" option.
     * 
     * SECURITY: Only registrationId and display info stored - never card number/CVV
     * 
     * @param int $userId
     * @param array $hyperpayResponse HyperPay response containing registrationId
     * @param string $cardBrand VISA, MASTERCARD, MADA
     * @return SavedCard|null
     */
    private function savePaymentMethod(int $userId, array $hyperpayResponse, string $cardBrand): ?SavedCard
    {
        try {
            // Extract necessary fields from HyperPay response
            $registrationId = $hyperpayResponse['registrationId'] ?? null;
            if (!$registrationId) {
                Log::warning('No registrationId in HyperPay response for card saving');
                return null;
            }

            // Extract card details from response (if available)
            // Note: HyperPay may not return full details - use what's available
            $cardData = $hyperpayResponse['card'] ?? [];
            $last4 = substr($cardData['number'] ?? $hyperpayResponse['last4Digits'] ?? '****', -4);
            $expiryMonth = $cardData['expiryMonth'] ?? null;
            $expiryYear = $cardData['expiryYear'] ?? null;

            // Check if this registration ID already exists
            $existingCard = SavedCard::where('registration_id', $registrationId)
                                     ->where('user_id', $userId)
                                     ->first();

            if ($existingCard) {
                Log::info('Card registration already saved', ['registration_id' => $registrationId]);
                return $existingCard;
            }

            // Create new saved card record
            $savedCard = SavedCard::create([
                'user_id' => $userId,
                'registration_id' => $registrationId,
                'card_brand' => strtoupper($cardBrand),
                'last4' => $last4,
                'expiry_month' => $expiryMonth,
                'expiry_year' => $expiryYear,
                'is_default' => false, // First card won't be set as default yet
            ]);

            Log::info('Payment method saved', [
                'user_id' => $userId,
                'saved_card_id' => $savedCard->id,
                'card_brand' => strtoupper($cardBrand),
            ]);

            return $savedCard;

        } catch (Exception $e) {
            Log::error('Failed to save payment method: ' . $e->getMessage(), [
                'user_id' => $userId,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return null;
        }
    }
}

