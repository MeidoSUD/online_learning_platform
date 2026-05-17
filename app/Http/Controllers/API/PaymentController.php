<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use App\Services\MoyasarPay;
use App\Models\Payment;
use App\Models\SavedCard;
use App\Models\User;
use App\Models\AvailabilitySlot;
use App\Models\Sessions;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Exception;
use  App\Models\Booking;
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
            // ✅ SECURITY: booking_id is now REQUIRED to prevent manual amount manipulation
            $request->validate([
                'booking_id' => 'required|integer|exists:bookings,id',
                'currency' => 'nullable|string|size:3',
                'payment_brand' => 'nullable|string',
                'saved_card_id' => 'nullable|integer|exists:saved_cards,id',
                'teacher_id' => 'nullable|integer|exists:users,id',
                'merchant_transaction_id' => 'nullable|string',
                'description' => 'nullable|string',
                'callback_url' => 'nullable|url',
            ]);

            $user = auth()->user();
            $callbackUrl = $request->callback_url ?? route('api.payment.callback');
            
            // ✅ Get booking - this is now REQUIRED
            $bookingId = $request->booking_id;
            $booking = Booking::findOrFail($bookingId);
            
            // Verify the booking belongs to the authenticated student
            if ($booking->student_id !== $user->id) {
                return $this->authorizationError('This booking does not belong to you');
            }
            
            // ✅ CALCULATE AMOUNT FROM BOOKING - NOT FROM USER INPUT
            // Total amount is already stored in booking.total_amount
            // If multiple sessions, the amount is already calculated during booking creation
            $amount = (int)($booking->total_amount * 100); // Convert to cents
            $currency = $request->currency ?? $booking->currency ?? 'SAR';
            
            // Extract teacher_id from booking
            $teacherId = $booking->teacher_id;
            
            if (!$teacherId && $request->filled('teacher_id')) {
                $teacherId = $request->teacher_id;
            }

            if ($request->filled('saved_card_id')) {
                $savedCard = SavedCard::where('id', $request->saved_card_id)
                                      ->where('user_id', $user->id)
                                      ->firstOrFail();

                if ($savedCard->isExpired()) {
                    return $this->conflictError('Saved card has expired. Please use a different payment method.');
                }

                $payload = [
                    'amount' => $amount,
                    'currency' => strtoupper($currency),
                    'description' => $request->description ?? "Payment for booking #{$booking->booking_reference}",
                    'callback_url' => $callbackUrl,
                    'source' => [
                        'type' => 'token',
                        'token' => $savedCard->registration_id,
                    ],
                    'metadata' => [
                        'user_id' => $user->id,
                        'booking_id' => $bookingId,
                        'teacher_id' => $teacherId,
                        'sessions_count' => $booking->sessions_count,
                    ]
                ];

                $data = $this->moyasar->createPayment($payload);

                $payment = Payment::create([
                    'booking_id' => $bookingId,
                    'student_id' => $user->id,
                    'teacher_id' => $teacherId,
                    'amount' => $booking->total_amount,
                    'currency' => $currency,
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
                    'amount' => $booking->total_amount,
                    'currency' => $currency,
                    'sessions' => $booking->sessions_count,
                ], 'Payment initiated successfully');
            } else {
                $payload = [
                    'amount' => $amount,
                    'currency' => strtoupper($currency),
                    'description' => $request->description ?? "Payment for booking #{$booking->booking_reference}",
                    'callback_url' => $callbackUrl,
                    'metadata' => [
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'booking_id' => $bookingId,
                        'teacher_id' => $teacherId,
                        'sessions_count' => $booking->sessions_count,
                    ]
                ];

                $data = $this->moyasar->createInvoice($payload);

                $payment = Payment::create([
                    'booking_id' => $bookingId,
                    'student_id' => $user->id,
                    'teacher_id' => $teacherId,
                    'amount' => $booking->total_amount,
                    'currency' => $currency,
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
                    'amount' => $booking->total_amount,
                    'currency' => $currency,
                    'sessions' => $booking->sessions_count,
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

                // ⭐ IMPORTANT: Mark slot as booked and create sessions ONLY after payment success
                // This ensures slots don't get locked if payment fails
                try {
                    $booking = $payment->booking;
                    
                    if ($booking) {
                        // 1. Lock the slot with pessimistic locking to prevent race conditions
                        $slot = AvailabilitySlot::where('id', $booking->timeslot_id)
                            ->lockForUpdate()
                            ->first();
                        
                        if ($slot) {
                            if ($slot->is_booked || !$slot->is_available) {
                                Log::warning('Slot already booked by another student', [
                                    'slot_id' => $slot->id,
                                    'payment_id' => $payment->id,
                                    'booking_id' => $booking->id,
                                ]);
                                
                                $payment->update(['status' => 'completed']);
                                
                                return $this->conflictError('Slot was booked by another student', [
                                    'payment_id' => $payment->id,
                                    'message' => 'Payment received but slot is no longer available. Refund will be processed.',
                                ]);
                            }
                            
                            $slot->update([
                                'is_available' => false,
                                'is_booked' => true,
                                'booking_id' => $booking->id,
                            ]);
                            
                            Log::info('Slot booked after payment', [
                                'slot_id' => $slot->id,
                                'booking_id' => $booking->id,
                                'payment_id' => $payment->id,
                            ]);
                            
                            Sessions::createForBooking($booking);
                            
                            $booking->update(['status' => 'confirmed']);
                            
                            $this->scheduleMeetingJobs($booking);
                            
                            $this->sendPaymentNotifications($booking);
                            
                            Log::info('Booking confirmed after payment', [
                                'booking_id' => $booking->id,
                                'payment_id' => $payment->id,
                            ]);
                        } else if ($booking->course_group_id) {
                            Log::info('Group course booking - creating sessions after payment', [
                                'booking_id' => $booking->id,
                                'course_group_id' => $booking->course_group_id,
                                'payment_id' => $payment->id,
                            ]);

                            $courseGroup = \App\Models\CourseGroup::find($booking->course_group_id);
                            if ($courseGroup) {
                                Sessions::createForBooking($booking);
                                $booking->update(['status' => 'confirmed']);
                                $this->scheduleMeetingJobs($booking);
                                $this->sendPaymentNotifications($booking);
                            }
                        } else {
                            Log::warning('Slot not found for booking during payment confirmation. Processing payment and booking confirmation anyway.', [
                                'booking_id' => $booking->id,
                                'payment_id' => $payment->id,
                                'availability_slot_id' => $booking->availability_slot_id
                            ]);

                            // Create sessions
                            Sessions::createForBooking($booking);
                            
                            // Update booking status to confirmed
                            $booking->update(['status' => 'confirmed']);
                            
                            // Schedule meeting generation jobs (Agora/Zoom)
                            $this->scheduleMeetingJobs($booking);
                            
                            // Send notifications
                            $this->sendPaymentNotifications($booking);
                        }
                    }
                } catch (\Exception $e) {
                    Log::error('Error processing post-payment actions', [
                        'payment_id' => $payment->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                    // Don't fail the payment response - it was already marked as paid at Moyasar
                    // The slots/sessions/notifications can be reconciled later
                }

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

    /**
     * Schedule meeting generation jobs for all sessions in a booking
     * 
     * @param Booking $booking
     * @return void
     */
    private function scheduleMeetingJobs(Booking $booking): void
    {
        $booking = $booking->load('sessions');
        $sessions = $booking->sessions ?? [];
        
        foreach ($sessions as $session) {
            try {
                Log::info('Session meeting generation processing', ['session_id' => $session->id]);

                // If session already has a meeting/join URL, skip creation
                if (empty($session->meeting_id) || empty($session->join_url)) {
                    $created = $session->createMeeting();
                    Log::info('Session createMeeting() result', ['session_id' => $session->id, 'created' => $created]);
                } else {
                    Log::info('Session already has meeting info', ['session_id' => $session->id]);
                }

            } catch (\Exception $e) {
                Log::error('Failed to create session meeting', ['session_id' => $session->id, 'error' => $e->getMessage()]);
                // Continue with other sessions
            }
        }
    }

    /**
     * Send payment success notifications to student and teacher
     * 
     * @param Booking $booking
     * @return void
     */
    private function sendPaymentNotifications(Booking $booking): void
    {
        try {
            $ns = new \App\Services\NotificationService();
            
            // ✅ Safely parse date and time
            try {
                $firstSessionDate = $booking->first_session_date;
                $firstSessionTime = $booking->first_session_start_time;
                
                // Handle different date formats
                if ($firstSessionDate instanceof \DateTime) {
                    $firstSessionDate = $firstSessionDate->format('Y-m-d');
                }
                if ($firstSessionTime instanceof \DateTime) {
                    $firstSessionTime = $firstSessionTime->format('H:i');
                }
                
                $firstSessionStart = \Carbon\Carbon::parse($firstSessionDate . ' ' . $firstSessionTime)->format('Y-m-d H:i');
            } catch (\Exception $e) {
                Log::warning('Could not parse session date/time', [
                    'first_session_date' => $booking->first_session_date,
                    'first_session_start_time' => $booking->first_session_start_time,
                    'error' => $e->getMessage()
                ]);
                $firstSessionStart = 'upcoming';
            }
            
            // ✅ Get appropriate title based on service type
            $titleStudent = $this->getTitleForBooking($booking);
            
            // ============================================================
            // STUDENT NOTIFICATIONS
            // ============================================================
            $msgStudent = app()->getLocale() == 'ar'
                ? "نجاح! لقد حجزت {$booking->sessions_count} جلسات. تبدأ جلستك الأولى في {$firstSessionStart}."
                : "Success! You have booked {$booking->sessions_count} sessions. Your first session starts on {$firstSessionStart}.";
            if ($booking->student) {
                // Send push and email notifications
                $ns->send($booking->student, 'payment_success', $titleStudent, $msgStudent, [
                    'booking_id' => $booking->id,
                    'amount' => $booking->total_amount,
                ]);
                
                // Send SMS notification to student
                if ($booking->student->phone_number) {
                    $smsMsgStudent = app()->getLocale() == 'ar'
                        ? "نجاح! لقد حجزت {$booking->sessions_count} جلسات. الجلسة الأولى في {$firstSessionStart}. / Success! You booked {$booking->sessions_count} sessions. First session is at {$firstSessionStart}."
                        : "Success! You booked {$booking->sessions_count} sessions. First session is at {$firstSessionStart}. / نجاح! لقد حجزت {$booking->sessions_count} جلسات. الجلسة الأولى في {$firstSessionStart}.";
                    $ns->sendBilingualSMS($booking->student->phone_number, $smsMsgStudent);
                }
            }

            // ============================================================
            // TEACHER NOTIFICATIONS
            // ============================================================
            $titleTeacher = app()->getLocale() == 'ar' ? 'حجز جديد' : 'New booking';
            $msgTeacher = app()->getLocale() == 'ar'
                ? "لديك حجز جديد (#{$booking->booking_reference}) من {$booking->student?->first_name} لعدد {$booking->sessions_count} جلسات. تبدأ يوم {$firstSessionStart}."
                : "You have a new booking (#{$booking->booking_reference}) from {$booking->student?->first_name} for {$booking->sessions_count} sessions starting on {$firstSessionStart}.";
            if ($booking->teacher) {
                // Send push and email notifications
                $ns->send($booking->teacher, 'booking_received', $titleTeacher, $msgTeacher, [
                    'booking_id' => $booking->id,
                    'student_id' => $booking->student_id,
                ]);
                
                // Send SMS notification to teacher
                if ($booking->teacher->phone_number) {
                    $smsMsgTeacher = app()->getLocale() == 'ar'
                        ? "لديك حجز جديد من {$booking->student?->first_name} لعدد {$booking->sessions_count} جلسات تبدأ في {$firstSessionStart}. / You have a new booking from {$booking->student?->first_name} for {$booking->sessions_count} sessions starting on {$firstSessionStart}."
                        : "You have a new booking from {$booking->student?->first_name} for {$booking->sessions_count} sessions starting on {$firstSessionStart}. / لديك حجز جديد من {$booking->student?->first_name} لعدد {$booking->sessions_count} جلسات تبدأ في {$firstSessionStart}.";
                    $ns->sendBilingualSMS($booking->teacher->phone_number, $smsMsgTeacher);
                }
            }

        } catch (\Exception $e) {
            Log::error('Failed to send payment notifications', ['booking_id' => $booking->id, 'error' => $e->getMessage()]);
            // Don't throw - payment is already confirmed
        }
    }

    /**
     * Get appropriate title for booking based on service type
     * - Private Lessons: Subject name
     * - Language Learning: Language name
     * - Courses: Course name
     */
    private function getTitleForBooking(Booking $booking): string
    {
        try {
            // Load relationships if not already loaded
            if (!$booking->relationLoaded('course') || !$booking->relationLoaded('subject')) {
                $booking->load(['course', 'subject']);
            }

            // Check service type from booking
            if ($booking->course_id && $booking->course) {
                // ✅ Courses service - use course name
                $courseName = $booking->course->name ?? 'Course';
                return app()->getLocale() == 'ar' 
                    ? "تم حجز الكورس: {$courseName}" 
                    : "Course booked: {$courseName}";
            } 
            elseif ($booking->service_id) {
                // Load service to check type
                $service = $booking->service;
                
                if ($service && $service->key_name === 'private_lesson') {
                    // ✅ Private Lessons service - use subject name
                    $subjectName = $booking->subject?->name_en ?? 'Lesson';
                    $subjectNameAr = $booking->subject?->name_ar ?? $subjectName;
                    return app()->getLocale() == 'ar' 
                        ? "درس خصوصي في: {$subjectNameAr}" 
                        : "Private lesson: {$subjectName}";
                } 
                elseif ($service && $service->key_name === 'language_learning') {
                    // ✅ Language Learning service - use language name
                    $language = $booking->languages()->first();
                    $languageName = $language?->name ?? 'Language';
                    return app()->getLocale() == 'ar' 
                        ? "دراسة لغة: {$languageName}" 
                        : "Language: {$languageName}";
                }
            }

            // ✅ Default fallback if service type not determined
            return app()->getLocale() == 'ar' ? 'تم الدفع بنجاح' : 'Payment successful';
            
        } catch (\Exception $e) {
            Log::warning('Could not determine booking title', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage()
            ]);
            return app()->getLocale() == 'ar' ? 'تم الدفع بنجاح' : 'Payment successful';
        }
    }
}
