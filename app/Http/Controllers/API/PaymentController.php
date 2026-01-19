<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use App\Services\MoyasarPay;
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

    protected MoyasarPay $moyasar;

    public function __construct(MoyasarPay $moyasar)
    {
        $this->moyasar = $moyasar;
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
                'payment_brand' => 'nullable|string',
                'saved_card_id' => 'nullable|integer|exists:saved_cards,id',
                'description' => 'nullable|string',
                'callback_url' => 'nullable|url',
            ]);

            $user = auth()->user();
            $amount = (int)($request->amount * 100);
            $callbackUrl = $request->callback_url ?? route('api.payment.callback');

            if ($request->filled('saved_card_id')) {
                $savedCard = SavedCard::where('id', $request->saved_card_id)
                                      ->where('user_id', $user->id)
                                      ->firstOrFail();

                if ($savedCard->isExpired()) {
                    return $this->conflictError('Saved card has expired. Please use a different payment method.');
                }

                $payload = [
                    'amount' => $amount,
                    'currency' => strtoupper($request->currency),
                    'description' => $request->description ?? "Payment for user {$user->id}",
                    'callback_url' => $callbackUrl,
                    'source' => [
                        'type' => 'token',
                        'token' => $savedCard->registration_id,
                    ],
                ];

                $data = $this->moyasar->createPayment($payload);

                $payment = Payment::create([
                    'student_id' => $user->id,
                    'amount' => $request->amount,
                    'currency' => strtoupper($request->currency),
                    'payment_method' => 'MOYASAR_TOKEN',
                    'status' => $data['status'],
                    'transaction_reference' => $data['id'],
                    'gateway_reference' => $data['id'],
                    'gateway_response' => json_encode($data),
                ]);

                return $this->success([
                    'checkout_id' => $data['id'],
                    'payment_id' => $payment->id,
                    'redirect_url' => $data['source']['transaction_url'] ?? '',
                    'amount' => $request->amount,
                    'currency' => $request->currency,
                ], 'Payment initiated successfully');
            } else {
                $payload = [
                    'amount' => $amount,
                    'currency' => strtoupper($request->currency),
                    'description' => $request->description ?? "Payment for user {$user->id}",
                    'callback_url' => $callbackUrl,
                    'metadata' => [
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                    ]
                ];

                $data = $this->moyasar->createInvoice($payload);

                $payment = Payment::create([
                    'student_id' => $user->id,
                    'amount' => $request->amount,
                    'currency' => strtoupper($request->currency),
                    'payment_method' => 'MOYASAR_HOSTED',
                    'status' => $data['status'],
                    'transaction_reference' => $data['id'],
                    'gateway_reference' => $data['id'],
                    'gateway_response' => json_encode($data),
                ]);

                return $this->success([
                    'checkout_id' => $data['id'],
                    'payment_id' => $payment->id,
                    'redirect_url' => $data['url'] ?? '',
                    'amount' => $request->amount,
                    'currency' => $request->currency,
                ], 'Payment initiated successfully');
            }

        } catch (ValidationException $e) {
            return $this->validationError($e, 'Validation failed');
        } catch (Exception $e) {
            Log::error('Payment creation error: ' . $e->getMessage());
            return $this->serverError($e, 'Failed to create payment');
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
                'payment_id' => 'required|string',
                'save_card' => 'nullable|boolean',
            ]);

            $paymentId = $request->payment_id;
            
            // 1. Find the local payment record first to know how it was initiated
            $payment = Payment::where('gateway_reference', $paymentId)->first();
            if (!$payment) {
                // If not found by gateway_reference, try by id just in case
                $payment = Payment::find($paymentId);
            }

            if (!$payment) {
                return $this->notFoundError('Payment record not found localy for reference: ' . $paymentId);
            }

            // 2. Fetch data from Moyasar using the appropriate method
            if ($payment->payment_method === 'MOYASAR_HOSTED') {
                $invoice = $this->moyasar->fetchInvoice($paymentId);
                
                // For invoices, if paid, the actual payment details are in the payments array
                if ($invoice['status'] === 'paid' && !empty($invoice['payments'])) {
                    $data = $invoice['payments'][0];
                } else {
                    $data = $invoice;
                }
            } else {
                $data = $this->moyasar->fetchPayment($paymentId);
            }

            if ($data['status'] === 'paid') {
                $payment->update([
                    'status' => 'completed', // Using local constant STATUS_COMPLETED or 'completed'
                    'gateway_response' => json_encode($data),
                    'paid_at' => now(),
                ]);

                if ($request->save_card && !empty($data['source']['token'])) {
                    $this->savePaymentMethod(
                        $payment->student_id,
                        $data,
                        $data['source']['company'] ?? 'UNKNOWN'
                    );
                }

                return $this->success([
                    'payment_id' => $payment->id,
                    'status' => 'paid',
                    'amount' => $payment->amount,
                    'currency' => $payment->currency,
                    'transaction_id' => $data['id'],
                ], 'Payment successful');

            } else {
                $payment->update([
                    'status' => $data['status'],
                    'gateway_response' => json_encode($data),
                ]);

                return $this->conflictError('Payment status: ' . $data['status'], [
                    'payment_id' => $payment->id,
                    'message' => $data['source']['message'] ?? $data['message'] ?? 'Unknown error',
                ]);
            }

        } catch (ValidationException $e) {
            return $this->validationError($e, 'Validation failed');
        } catch (Exception $e) {
            Log::error('Payment status check error: ' . $e->getMessage());
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
    private function savePaymentMethod(int $userId, array $moyasarResponse, string $cardBrand): ?SavedCard
    {
        try {
            $token = $moyasarResponse['source']['token'] ?? null;
            if (!$token) {
                return null;
            }

            $source = $moyasarResponse['source'];
            $last4 = substr($source['number'] ?? '****', -4);

            $existingCard = SavedCard::where('registration_id', $token)
                                     ->where('user_id', $userId)
                                     ->first();

            if ($existingCard) {
                return $existingCard;
            }

            $savedCard = SavedCard::create([
                'user_id' => $userId,
                'registration_id' => $token,
                'card_brand' => strtoupper($cardBrand),
                'last4' => $last4,
                'expiry_month' => $source['month'] ?? null,
                'expiry_year' => $source['year'] ?? null,
                'is_default' => false,
            ]);

            return $savedCard;

        } catch (Exception $e) {
            Log::error('Failed to save payment method: ' . $e->getMessage());
            return null;
        }
    }
}

