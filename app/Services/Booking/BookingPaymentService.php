<?php

namespace App\Services\Booking;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\Sessions;
use App\Services\HyperpayService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BookingPaymentService
{
    protected HyperpayService $hyperpayService;
    protected NotificationService $notificationService;

    public function __construct(HyperpayService $hyperpayService, NotificationService $notificationService)
    {
        $this->hyperpayService = $hyperpayService;
        $this->notificationService = $notificationService;
    }

    /**
     * Process payment callback from HyperPay (3DS/OTP verification).
     */
    public function paymentCallback(Request $request): array
    {
        $resourcePath = $request->get('resourcePath');
        $checkoutId = $request->get('checkoutId');

        if (!$resourcePath && !$checkoutId) {
            return [
                'success' => false,
                'status_code' => 400,
                'message' => 'Missing resourcePath or checkoutId',
            ];
        }

        DB::beginTransaction();
        try {
            if ($checkoutId) {
                $statusResponse = $this->hyperpayService->getPaymentStatus($checkoutId);
            } else {
                $baseUrl = config('hyperpay.base_url');
                $statusResponse = Http::withHeaders([
                    'Authorization' => config('hyperpay.authorization'),
                    'Accept' => 'application/json',
                ])->get($baseUrl . $resourcePath);
            }

            $statusData = $statusResponse->json();

            Log::info('Payment verification response', [
                'status_code' => $statusResponse->status(),
                'checkout_id' => $checkoutId,
                'response_code' => $statusData['result']['code'] ?? 'unknown',
                'description' => $statusData['result']['description'] ?? 'unknown',
            ]);

            $merchantTransactionId = $statusData['merchantTransactionId'] ?? null;

            if (!$merchantTransactionId) {
                DB::rollBack();
                return [
                    'success' => false,
                    'status_code' => 400,
                    'message' => 'Cannot find transaction reference in response',
                ];
            }

            $payment = Payment::where('transaction_reference', $merchantTransactionId)
                ->with('booking')
                ->firstOrFail();

            $booking = $payment->booking;

            $payment->update([
                'gateway_response' => json_encode($statusData),
            ]);

            $resultCode = $statusData['result']['code'] ?? '';
            $resultDescription = $statusData['result']['description'] ?? 'Unknown error';

            if (str_starts_with($resultCode, '000.')) {
                $payment->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);

                $booking->update(['status' => Booking::STATUS_CONFIRMED]);
                Sessions::createForBooking($booking, $booking->sessions_per_slot);
                $this->scheduleSessionMeetingJobs($booking);

                DB::commit();

                Log::info('Payment verified successfully after OTP', [
                    'booking_id' => $booking->id,
                    'payment_id' => $payment->id,
                ]);

                $this->sendPaymentSuccessNotifications($booking, $payment);

                return [
                    'success' => true,
                    'status_code' => 200,
                    'message' => 'Payment verified successfully',
                    'data' => [
                        'payment_id' => $payment->id,
                        'booking_id' => $booking->id,
                        'status' => 'confirmed',
                        'result_code' => $resultCode,
                        'result_description' => $resultDescription,
                    ],
                ];
            } else {
                $payment->update(['status' => 'failed']);
                DB::commit();

                Log::warning('Payment failed verification', [
                    'booking_id' => $booking->id,
                    'payment_id' => $payment->id,
                    'result_code' => $resultCode,
                ]);

                return [
                    'success' => false,
                    'status_code' => 400,
                    'message' => 'Payment verification failed',
                    'error' => $resultDescription,
                    'error_code' => $resultCode,
                    'data' => [
                        'payment_id' => $payment->id,
                        'booking_id' => $booking->id,
                    ],
                ];
            }
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return [
                'success' => false,
                'status_code' => 404,
                'message' => 'Payment record not found',
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment verification callback failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'status_code' => 500,
                'message' => 'Internal server error during verification',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Pay booking via direct card details.
     */
    public function payBooking(Request $request, int $studentId): array
    {
        $bookingId = $request->booking_id;
        DB::beginTransaction();
        try {
            $booking = Booking::where('id', $bookingId)
                ->where('student_id', $studentId)
                ->with('teacher')
                ->firstOrFail();

            if ($booking->status !== Booking::STATUS_PENDING_PAYMENT) {
                DB::rollBack();
                return [
                    'success' => false,
                    'status_code' => 400,
                    'message' => 'Booking is not awaiting payment',
                    'current_status' => $booking->status,
                ];
            }

            $payment = Payment::create([
                'booking_id' => $bookingId,
                'student_id' => $studentId,
                'teacher_id' => $booking->teacher_id,
                'amount' => $booking->total_amount,
                'currency' => $booking->currency,
                'payment_method' => $request->payment_brand,
                'status' => 'pending',
                'transaction_reference' => 'TXN' . now()->format('YmdHis') . rand(1000, 9999),
                'gateway_reference' => null,
                'gateway_response' => null,
                'paid_at' => null,
            ]);

            $payload = [
                'amount' => number_format($booking->total_amount, 2, '.', ''),
                'currency' => strtoupper($booking->currency),
                'paymentType' => 'DB',
                'paymentBrand' => $request->payment_brand,
                'merchantTransactionId' => $payment->transaction_reference,
                'shopperResultUrl' => route('api.payment.result'),
                'card.number' => $request->card_number,
                'card.holder' => $request->card_holder,
                'card.expiryMonth' => str_pad($request->expiry_month, 2, '0', STR_PAD_LEFT),
                'card.expiryYear' => $request->expiry_year,
                'card.cvv' => $request->cvv,
                'customer.email' => $booking->student ? $booking->student->email : 'student@ewan.com',
                'customer.givenName' => $booking->student ? $booking->student->first_name : 'Student',
                'customer.surname' => $booking->student ? $booking->student->last_name : 'User',
                'billing.city' => 'Riyadh',
                'billing.country' => 'SA',
                'customParameters[booking_id]' => $bookingId,
                'customParameters[payment_id]' => $payment->id,
            ];

            $hyperpayResponse = $this->hyperpayService->directPayment($payload);
            $responseData = $hyperpayResponse->json();

            $payment->update([
                'gateway_reference' => $responseData['id'] ?? null,
                'gateway_response' => json_encode($responseData),
            ]);

            $resultCode = $responseData['result']['code'] ?? '';
            $resultDescription = $responseData['result']['description'] ?? 'Unknown error';
            $checkoutId = $responseData['id'] ?? null;

            if (str_starts_with($resultCode, '000.000.') || str_starts_with($resultCode, '000.100.')) {
                $payment->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);

                $booking->update(['status' => Booking::STATUS_CONFIRMED]);
                Sessions::createForBooking($booking, $booking->sessions_per_slot);
                $this->scheduleSessionMeetingJobs($booking);
                DB::commit();

                $this->sendPaymentSuccessNotifications($booking, $payment);

                return [
                    'success' => true,
                    'status_code' => 200,
                    'message' => 'Payment successful. Booking confirmed.',
                    'requires_3ds' => false,
                    'data' => [
                        'booking_id' => $booking->id,
                        'booking_reference' => $booking->booking_reference,
                        'payment_id' => $payment->id,
                        'transaction_reference' => $payment->transaction_reference,
                        'status' => 'confirmed',
                        'amount_paid' => $booking->total_amount,
                        'currency' => $booking->currency,
                        'payment_method' => $request->payment_brand,
                        'first_session_date' => $booking->first_session_date,
                    ],
                ];
            } elseif (str_starts_with($resultCode, '000.200.') || str_starts_with($resultCode, '000.400.')) {
                DB::commit();

                return [
                    'success' => true,
                    'status_code' => 200,
                    'message' => 'Checkout created. 3DS verification required.',
                    'requires_3ds' => true,
                    'data' => [
                        'payment_id' => $payment->id,
                        'checkout_id' => $checkoutId,
                        'transaction_reference' => $payment->transaction_reference,
                        'booking_id' => $booking->id,
                        'amount' => $booking->total_amount,
                        'currency' => $booking->currency,
                        'redirect_url' => $responseData['redirect'] ?? null,
                    ],
                ];
            } else {
                $payment->update(['status' => 'failed']);
                DB::commit();

                return [
                    'success' => false,
                    'status_code' => 400,
                    'message' => 'Payment failed',
                    'error' => $resultDescription,
                    'error_code' => $resultCode,
                    'data' => [
                        'payment_id' => $payment->id,
                        'transaction_reference' => $payment->transaction_reference,
                        'booking_id' => $bookingId,
                    ],
                ];
            }
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return [
                'success' => false,
                'status_code' => 404,
                'message' => 'Booking not found',
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Direct payment processing error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'status_code' => 500,
                'message' => 'Payment processing failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Initiate 3DS Payment.
     */
    public function payBooking3DS(Request $request, int $studentId): array
    {
        $bookingId = $request->booking_id;
        DB::beginTransaction();
        try {
            $booking = Booking::where('id', $bookingId)
                ->where('student_id', $studentId)
                ->with('teacher')
                ->firstOrFail();

            if ($booking->status !== Booking::STATUS_PENDING_PAYMENT) {
                DB::rollBack();
                return [
                    'success' => false,
                    'status_code' => 400,
                    'message' => 'Booking is not awaiting payment',
                    'current_status' => $booking->status,
                ];
            }

            $payment = Payment::create([
                'booking_id' => $bookingId,
                'student_id' => $studentId,
                'teacher_id' => $booking->teacher_id,
                'amount' => $booking->total_amount,
                'currency' => $booking->currency,
                'payment_method' => $request->payment_brand,
                'status' => 'pending',
                'transaction_reference' => 'TXN' . now()->format('YmdHis') . rand(1000, 9999),
            ]);

            $callbackUrl = route('api.payment.callback');

            $payload = [
                'amount' => number_format($booking->total_amount, 2, '.', ''),
                'currency' => strtoupper($booking->currency),
                'paymentType' => 'DB',
                'paymentBrand' => $request->payment_brand,
                'merchantTransactionId' => $payment->transaction_reference,
                'shopperResultUrl' => $callbackUrl,
                'customer.email' => $booking->student?->email ?? 'student@ewan.com',
                'customer.givenName' => $booking->student?->first_name ?? 'Student',
                'customer.surname' => $booking->student?->last_name ?? 'User',
                'billing.city' => 'Riyadh',
                'billing.country' => 'SA',
                'customParameters[booking_id]' => $bookingId,
                'customParameters[payment_id]' => $payment->id,
            ];

            $checkoutResponse = $this->hyperpayService->create3DSCheckout($payload);
            $responseData = $checkoutResponse->json();

            $payment->update([
                'gateway_reference' => $responseData['id'] ?? null,
                'gateway_response' => json_encode($responseData),
            ]);

            $resultCode = $responseData['result']['code'] ?? '';

            if ($checkoutResponse->successful() && isset($responseData['id'])) {
                DB::commit();

                return [
                    'success' => true,
                    'status_code' => 200,
                    'message' => 'Checkout created. Complete payment using checkout_id.',
                    'requires_3ds' => true,
                    'data' => [
                        'payment_id' => $payment->id,
                        'checkout_id' => $responseData['id'],
                        'transaction_reference' => $payment->transaction_reference,
                        'booking_id' => $booking->id,
                        'amount' => $booking->total_amount,
                        'currency' => $booking->currency,
                    ],
                ];
            } else {
                $payment->update(['status' => 'failed']);
                DB::commit();

                return [
                    'success' => false,
                    'status_code' => 400,
                    'message' => 'Failed to create checkout',
                    'error_code' => $resultCode,
                ];
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('3DS payment initiation error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'status_code' => 500,
                'message' => 'Payment initiation failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Handle payment callback.
     */
    public function handlePaymentCallback(Request $request): array
    {
        $checkoutId = $request->query('id');
        $resourcePath = $request->query('resourcePath');

        if (!$checkoutId && $resourcePath) {
            $parts = explode('/', trim($resourcePath, '/'));
            $checkoutId = end($parts);
        }

        if (!$checkoutId) {
            return [
                'success' => false,
                'status_code' => 400,
                'message' => 'Missing checkout ID or resourcePath',
            ];
        }

        try {
            $statusResponse = $this->hyperpayService->getPaymentStatus($checkoutId);
            $statusData = $statusResponse->json();
        } catch (\Exception $e) {
            Log::error('Failed to fetch payment status from HyperPay', ['checkout_id' => $checkoutId, 'error' => $e->getMessage()]);
            return [
                'success' => false,
                'status_code' => 500,
                'message' => 'Failed to fetch status from gateway',
            ];
        }

        $merchantTxnId = $statusData['merchantTransactionId'] ?? null;
        if (!$merchantTxnId && isset($statusData['transaction']) && is_array($statusData['transaction'])) {
            $merchantTxnId = $statusData['transaction']['merchantTransactionId'] ?? null;
        }
        if (!$merchantTxnId && isset($statusData['result']['merchantTransactionId'])) {
            $merchantTxnId = $statusData['result']['merchantTransactionId'];
        }

        $payment = null;
        if ($merchantTxnId) {
            $payment = Payment::where('transaction_reference', $merchantTxnId)->first();
        }
        if (!$payment && isset($statusData['id'])) {
            $payment = Payment::where('gateway_reference', $statusData['id'])->first();
        }
        if (!$payment) {
            $payment = Payment::where('gateway_reference', $checkoutId)->first();
        }
        if (!$payment) {
            $payment = Payment::where('transaction_reference', $checkoutId)->first();
        }

        if (!$payment) {
            return [
                'success' => false,
                'status_code' => 404,
                'message' => 'Cannot find transaction reference in response',
            ];
        }

        $resultCode = $statusData['result']['code'] ?? $statusData['paymentResult']['code'] ?? '';

        if (preg_match('/^(000\.000\.|000\.100\.1|000\.[36])/', $resultCode)) {
            $payment->update([
                'status' => 'paid',
                'paid_at' => now(),
                'gateway_response' => json_encode($statusData),
            ]);

            $booking = $payment->booking;
            if ($booking) {
                $booking->update(['status' => Booking::STATUS_CONFIRMED]);
                Sessions::createForBooking($booking, $booking->sessions_per_slot);
                $this->scheduleSessionMeetingJobs($booking);
            }

            if ($booking) {
                $this->sendPaymentSuccessNotifications($booking, $payment);
            }

            return [
                'success' => true,
                'status_code' => 200,
                'message' => 'Payment successful',
                'data' => [
                    'payment_id' => $payment->id,
                    'booking_id' => $booking?->id,
                    'status' => 'confirmed',
                ],
            ];
        } else {
            $payment->update([
                'status' => 'failed',
                'gateway_response' => json_encode($statusData),
            ]);

            return [
                'success' => false,
                'status_code' => 400,
                'message' => 'Payment failed',
                'error_code' => $resultCode,
            ];
        }
    }

    /**
     * Check payment status by Payment ID.
     */
    public function checkPaymentStatus($paymentId): array
    {
        try {
            $payment = Payment::with('booking')->findOrFail($paymentId);

            if ($payment->status === 'pending' && $payment->gateway_reference) {
                $statusResponse = $this->hyperpayService->getPaymentStatus($payment->gateway_reference);
                $statusData = $statusResponse->json();
                $resultCode = $statusData['result']['code'] ?? '';

                if (preg_match('/^(000\.000\.|000\.100\.1|000\.[36])/', $resultCode)) {
                    $payment->update([
                        'status' => 'paid',
                        'paid_at' => now(),
                        'gateway_response' => json_encode($statusData),
                    ]);

                    $booking = $payment->booking;
                    if ($booking) {
                        $booking->update(['status' => Booking::STATUS_CONFIRMED]);
                        Sessions::createForBooking($booking, $booking->sessions_per_slot);
                        $this->scheduleSessionMeetingJobs($booking);
                    }
                }
            }

            return [
                'success' => true,
                'status_code' => 200,
                'data' => [
                    'payment_id' => $payment->id,
                    'status' => $payment->status,
                    'booking_status' => $payment->booking?->status,
                    'amount' => $payment->amount,
                    'paid_at' => $payment->paid_at,
                ],
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'status_code' => 404,
                'message' => 'Payment not found',
            ];
        }
    }

    /**
     * Schedule meeting generation jobs for all sessions in a booking.
     */
    public function scheduleSessionMeetingJobs(Booking $booking): void
    {
        $booking->load('sessions');
        $sessions = $booking->sessions;

        foreach ($sessions as $session) {
            try {
                if (empty($session->meeting_id) || empty($session->join_url)) {
                    $session->createMeeting();
                }

                if (!empty($session->join_url)) {
                    $ns = $this->notificationService;

                    $titleStudent = app()->getLocale() == 'ar' ? 'رابط الحصة جاهز' : 'Lesson Link Ready';
                    $msgStudent = app()->getLocale() == 'ar'
                        ? "رابط الجلسة جاهز للحصة ({$session->booking->booking_reference}). يمكنك الانضمام عبر: {$session->join_url}"
                        : "Your session link is ready for booking ({$session->booking->booking_reference}). Join here: {$session->join_url}";

                    $ns->send($session->student, 'session_link_ready', $titleStudent, $msgStudent, [
                        'session_id' => $session->id,
                        'join_url' => $session->join_url,
                        'session_date' => $session->session_date,
                        'session_time' => $session->start_time,
                    ]);

                    $titleTeacher = app()->getLocale() == 'ar' ? 'رابط الحصة جاهز' : 'Lesson Link Ready';
                    $msgTeacher = app()->getLocale() == 'ar'
                        ? "رابط الجلسة جاهز للحصة ({$session->booking->booking_reference}). ابدأ الجلسة عبر: {$session->host_url}"
                        : "Your session link is ready for booking ({$session->booking->booking_reference}). Start session here: {$session->host_url}";

                    $ns->send($session->teacher, 'session_link_ready', $titleTeacher, $msgTeacher, [
                        'session_id' => $session->id,
                        'start_url' => $session->host_url,
                        'session_date' => $session->session_date,
                        'session_time' => $session->start_time,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to create session meeting', ['session_id' => $session->id, 'error' => $e->getMessage()]);
            }
        }
    }

    /**
     * Send payment success notifications to student & teacher.
     */
    private function sendPaymentSuccessNotifications(Booking $booking, Payment $payment): void
    {
        try {
            $ns = $this->notificationService;
            $firstSessionStart = Carbon::parse($booking->first_session_date . ' ' . $booking->first_session_start_time)->format('Y-m-d H:i');

            $titleStudent = app()->getLocale() == 'ar' ? 'تم الدفع بنجاح' : 'Payment successful';
            $msgStudent = app()->getLocale() == 'ar'
                ? "نجاح! لقد حجزت {$booking->sessions_count} جلسات مع المعلم. تبدأ جلستك الأولى في {$firstSessionStart}."
                : "Success! You have booked {$booking->sessions_count} sessions with your teacher. Your first session starts on {$firstSessionStart}.";

            if ($booking->student) {
                $ns->send($booking->student, 'payment_success', $titleStudent, $msgStudent, [
                    'booking_id' => $booking->id,
                    'payment_id' => $payment->id,
                    'amount' => $booking->total_amount,
                ]);

                if ($booking->student->phone_number) {
                    $smsMsgStudent = app()->getLocale() == 'ar'
                        ? "نجاح! لقد حجزت {$booking->sessions_count} جلسات. الجلسة الأولى في {$firstSessionStart}. / Success! You booked {$booking->sessions_count} sessions. First session is at {$firstSessionStart}."
                        : "Success! You booked {$booking->sessions_count} sessions. First session is at {$firstSessionStart}. / نجاح! لقد حجزت {$booking->sessions_count} جلسات. الجلسة الأولى في {$firstSessionStart}.";
                    $ns->sendBilingualSMS($booking->student->phone_number, $smsMsgStudent);
                }
            }

            $titleTeacher = app()->getLocale() == 'ar' ? 'حجز جديد' : 'New booking';
            $msgTeacher = app()->getLocale() == 'ar'
                ? "لديك حجز جديد (#{$booking->booking_reference}) من {$booking->student?->first_name} لعدد {$booking->sessions_count} جلسات. تبدأ يوم {$firstSessionStart}."
                : "You have a new booking (#{$booking->booking_reference}) from {$booking->student?->first_name} for {$booking->sessions_count} sessions starting on {$firstSessionStart}.";

            if ($booking->teacher) {
                $ns->send($booking->teacher, 'booking_received', $titleTeacher, $msgTeacher, [
                    'booking_id' => $booking->id,
                    'student_id' => $booking->student_id,
                ]);

                if ($booking->teacher->phone_number) {
                    $smsMsgTeacher = app()->getLocale() == 'ar'
                        ? "لديك حجز جديد من {$booking->student?->first_name} لعدد {$booking->sessions_count} جلسات تبدأ في {$firstSessionStart}. / You have a new booking from {$booking->student?->first_name} for {$booking->sessions_count} sessions starting on {$firstSessionStart}."
                        : "You have a new booking from {$booking->student?->first_name} for {$booking->sessions_count} sessions starting on {$firstSessionStart}. / لديك حجز جديد من {$booking->student?->first_name} لعدد {$booking->sessions_count} جلسات تبدأ في {$firstSessionStart}.";
                    $ns->sendBilingualSMS($booking->teacher->phone_number, $smsMsgTeacher);
                }
            }
        } catch (\Exception $e) {
            Log::error('Payment success notifications failed', ['error' => $e->getMessage()]);
        }
    }
}
