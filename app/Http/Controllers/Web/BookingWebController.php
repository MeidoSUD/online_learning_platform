<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Course;
use App\Models\AvailabilitySlot;
use App\Models\Payment;
use App\Models\Sessions;
use App\Models\User;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\HyperpayService;
use App\Services\NotificationService;
use App\Models\Notification as DbNotification;
use Illuminate\Support\Facades\Mail;

class BookingWebController extends Controller
{
    /**
     * Display student's bookings list
     */
    public function index(Request $request)
    {
        $studentId = auth()->id();
        $status = $request->get('status', 'all');

        $query = Booking::with([
            'course.subject',
            'course.service',
            'teacher:id,first_name,last_name,email,phone',
            'payment'
        ])->where('student_id', $studentId);

        // Filter by status
        switch ($status) {
            case 'upcoming':
                $query->whereIn('status', ['confirmed', 'pending_payment'])
                      ->where('first_session_date', '>=', now()->format('Y-m-d'));
                break;
            case 'completed':
                $query->where('status', 'completed');
                break;
            case 'cancelled':
                $query->where('status', 'cancelled');
                break;
            case 'active':
                $query->whereIn('status', ['confirmed', 'in_progress']);
                break;
        }

        $bookings = $query->orderByDesc('created_at')->paginate(12);

        return view('bookings.index', compact('bookings', 'status'));
    }

    /**
     * Show booking details and payment form
     */
    public function show($id)
    {
        $studentId = auth()->id();
        
        $booking = Booking::with([
            'course.subject',
            'course.service',
            'course.educationLevel',
            'course.classLevel',
            'teacher',
            'payment',
            'sessions' => function($query) {
                $query->orderBy('session_date')->orderBy('start_time');
            }
        ])->where('student_id', $studentId)
          ->findOrFail($id);

        // Get student's saved payment methods
        $student = auth()->user();
        $paymentMethods = $student->paymentMethods ?? collect();

        return view('student.bookings.show', compact('booking', 'paymentMethods'));
    }

    /**
     * Show payment form for the booking
     */
    public function payment($id)
    {
        $studentId = auth()->id();
        
        $booking = Booking::with([
            'course',
            'teacher'
        ])->where('student_id', $studentId)
          ->where('status', 'pending_payment')
          ->findOrFail($id);

        // Get student's saved payment methods
        $student = auth()->user();
        $paymentMethods = $student->paymentMethods ?? collect();

        return view('student.bookings.payment', compact('booking', 'paymentMethods', 'student'));
    }

    /**
     * Process direct payment through HyperPay
     */
    public function processDirectPayment(Request $request, $bookingId)
    {
        try {
            $validated = $request->validate([
                'payment_method_type' => 'required|in:new_card,saved_card',
                'saved_payment_id'    => 'required_if:payment_method_type,saved_card|integer',
                'card_number'         => 'required_if:payment_method_type,new_card|string',
                'card_holder'         => 'required_if:payment_method_type,new_card|string',
                // accept two-digit month (e.g. 07) or 1-12
                'expiry_month'        => ['required_if:payment_method_type,new_card','regex:/^(0[1-9]|1[0-2])$/'],
                'expiry_year'         => ['required_if:payment_method_type,new_card','regex:/^[0-9]{4}$/'],
                'cvv'                 => 'required_if:payment_method_type,new_card|digits_between:3,4',
                'save_card'           => 'sometimes|boolean',
                // billing/customer keys (bracket names in form become these keys)
                'billing.street1'     => 'sometimes|required|string',
                'billing.city'        => 'sometimes|required|string',
                'billing.state'       => 'sometimes|required|string',
                'billing.postcode'    => 'sometimes|required|string',
                'billing.country'     => 'sometimes|required|string|size:2',
                'customer.email'      => 'sometimes|required|email',
                'customer.givenName'  => 'sometimes|required|string',
                'customer.surname'    => 'sometimes|required|string',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Payment validation failed', [
                'errors' => $e->errors(),
                'request' => $request->except('card_number','cvv')
            ]);
            return response()->json([
                'success' => false,
                'message' => 'validation_error',
                'errors'  => $e->errors()
            ], 422);
        }

        $studentId = auth()->id();
        $booking = Booking::with(['course','teacher','payment'])->where('student_id', $studentId)
                          ->where('status', 'pending_payment')->findOrFail($bookingId);
        $student = User::find($studentId);

        DB::beginTransaction();
        try {
            // prepare card data
            if ($validated['payment_method_type'] === 'saved_card') {
                $saved = $student->paymentMethods()->findOrFail($validated['saved_payment_id']);
                $cardNumber = preg_replace('/\s+/', '', $saved->card_number);
                $cardHolder = $saved->card_holder;
                $expiryMonth = $saved->expiry_month;
                $expiryYear = $saved->expiry_year;
                $cvv = $saved->cvv;
            } else {
                $cardNumber = preg_replace('/\s+/', '', $validated['card_number']);
                $cardHolder = $validated['card_holder'];
                $expiryMonth = $validated['expiry_month'];
                $expiryYear = $validated['expiry_year'];
                $cvv = $validated['cvv'];
                if (!empty($validated['save_card'])) {
                    $student->paymentMethods()->create([
                        'card_number' => $cardNumber,
                        'card_holder' => $cardHolder,
                        'expiry_month' => $expiryMonth,
                        'expiry_year' => $expiryYear,
                        'cvv' => $cvv,
                        'is_default' => false,
                    ]);
                }
            }

            // merchantTransactionId: alphanumeric, max 32 chars
            $merchantTxnId = 'BK' . $booking->id . '_' . strtoupper(Str::random(12));
            $merchantTxnId = preg_replace('/[^A-Z0-9_]/', '', $merchantTxnId);
            $merchantTxnId = substr($merchantTxnId, 0, 32);

            // billing / customer fallback values
            $billingStreet = $validated['billing.street1'] ?? ($student->address ?? 'N/A');
            $billingCity   = $validated['billing.city'] ?? ($student->city ?? 'Riyadh');
            $billingState  = $validated['billing.state'] ?? ($student->state ?? 'Riyadh');
            $billingPost   = $validated['billing.postcode'] ?? ($student->postcode ?? '00000');
            $billingCountry= strtoupper($validated['billing.country'] ?? ($student->country ?? 'SA'));

            // detect brand (MADA handling may require showing MADA first on checkout)
            $paymentBrand = $this->detectPaymentBrand($cardNumber);

            // prepare payload according to HyperPay required params
            $customerGiven = $validated['customer']['givenName'] ?? $student->first_name ?? $student->name ?? '';
            $customerSurname = $validated['customer']['surname'] ?? $student->last_name ?? '';
            $payload = [
                'entityId' => config('hyperpay.entity_id'),
                'amount' => number_format($booking->total_amount, 2, '.', ''),
                'shopperResultUrl' => route('bookings.payment.result'),
                'shopperResultUrl' => route('bookings.payment.result', [], true),
                'currency' => 'SAR',
                'paymentType' => 'DB',
                'merchantTransactionId' => $merchantTxnId,
                'customer.email' => $validated['customer']['email'] ?? $student->email,
                'customer.givenName' => $customerGiven,
                'customer.surname' => $customerSurname,
                'billing.street1' => $validated['billing']['street1'] ?? ($student->address ?? 'N/A'),
                'billing.city' => $validated['billing']['city'] ?? ($student->city ?? 'Riyadh'),
                'billing.state' => $validated['billing']['state'] ?? ($student->state ?? 'Riyadh'),
                'billing.country' => strtoupper($validated['billing']['country'] ?? ($student->country ?? 'SA')),
                'billing.postcode' => $validated['billing']['postcode'] ?? ($student->postcode ?? '00000'),
                'customParameters[3DS2_enrolled]' => 'true',
                'customParameters[booking_id]' => $booking->id,
                // card
                'card.number' => $cardNumber,
                'card.holder' => $cardHolder,
                'card.expiryMonth' => $expiryMonth,
                'card.expiryYear' => $expiryYear,
                'card.cvv' => $cvv,
                'paymentBrand' => $paymentBrand,
                'shopperResultUrl' => route('bookings.payment.result'),
            ];

            // log payload (avoid logging full card number in prod)
            Log::info('Hyperpay request payload', array_merge($payload, ['card.number' => '***REDACTED***']));

            // call Hyperpay via service
            $hyperpay = new HyperpayService();
            $hyperpayResponse = $hyperpay->prepareCheckout($payload);
            $responseData = $hyperpayResponse->json();

            Log::info('Hyperpay response', ['response' => $responseData, 'booking_id' => $booking->id]);

            // update payment record with gateway data
            $payment = $booking->payment;
            $payment->update([
                'transaction_reference' => $merchantTxnId,
                'gateway_response' => json_encode($responseData),
                'payment_method' => $paymentBrand,
                'gateway_reference' => $responseData['id'] ?? null,
            ]);

            DB::commit();

            // handle response: if redirect required for 3DS or checkout, return redirect_url
            $redirectUrl = $responseData['redirect']['url'] ?? $responseData['result']['redirect'] ?? null;
            if ($redirectUrl) {
                return response()->json([
                    'success' => true,
                    'requires_3ds' => true,
                    'redirect_url' => $redirectUrl,
                ]);
            }

            $resultCode = $responseData['result']['code'] ?? null;
            if ($resultCode && str_starts_with($resultCode, '000.')) {
                // success
                $payment->update(['status' => 'paid', 'paid_at' => now()]);
                $booking->update(['status' => 'confirmed']);

                // create sessions
                Sessions::createForBooking($booking);
                Log::info('Sessions created for booking '.$booking->id);

                // schedule GenerateZoomMeetingJob for each session to run 2 hours before session start
                $booking->refresh()->load('sessions');
                foreach ($booking->sessions as $session) {
                    // compute run time: session_date + start_time minus 2 hours
                    try {
                        $sessionDate = is_object($session->session_date) ? $session->session_date->format('Y-m-d') : substr((string)$session->session_date,0,10);
                        $startTime = is_object($session->start_time) ? $session->start_time->format('H:i:s') : (string)$session->start_time;
                        $runAt = \Carbon\Carbon::parse($sessionDate . ' ' . $startTime)->subHours(2);
                        if ($runAt->lessThan(now())) {
                            // if run time already passed, dispatch immediately
                            \App\Jobs\GenerateZoomMeetingJob::dispatch($session->id)->delay(now()->addMinutes(5));
                        } else {
                            \App\Jobs\GenerateZoomMeetingJob::dispatch($session->id)->delay($runAt);
                        }
                        Log::info('GenerateZoomMeetingJob dispatched for session '.$session->id, ['run_at' => $runAt->toDateTimeString()]);
                    } catch (\Exception $e) {
                        Log::error('Failed to schedule GenerateZoomMeetingJob for session '.$session->id.': '.$e->getMessage());
                        // optionally dispatch immediately to ensure meeting exists
                        \App\Jobs\GenerateZoomMeetingJob::dispatch($session->id);
                    }
                }

                // record notification in DB and send via NotificationService
                $title = app()->getLocale() == 'ar' ? 'تم تأكيد الحجز' : 'Booking confirmed';
                $message = app()->getLocale() == 'ar'
                    ? "تم تأكيد حجزك (#{$booking->booking_reference}). سيتم إرسال روابط الجلسات قبل كل موعد."
                    : "Your booking ({$booking->booking_reference}) is confirmed. Session links will be sent prior to start time.";

                // save DB notification
                $dbNotif = DbNotification::create([
                    'user_id' => $booking->student_id,
                    'type' => 'payment_completed',
                    'title' => $title,
                    'message' => $message,
                    'data' => ['booking_id' => $booking->id],
                ]);
                Log::info('DB notification created', ['id' => $dbNotif->id, 'booking_id' => $booking->id]);

                // send push/email/sms using NotificationService (log before/after and fallback to email)
                $ns = new NotificationService();
                try {
                    Log::info('Sending notifications via NotificationService', ['booking_id' => $booking->id]);
                    $ns->send($booking->student, 'payment_completed', $title, $message, ['booking_id' => $booking->id]);
                    $ns->send($booking->teacher, 'booking_received', $title, "New booking: {$booking->booking_reference}", ['booking_id' => $booking->id]);
                    Log::info('NotificationService send completed', ['booking_id' => $booking->id]);
                } catch (\Exception $e) {
                    Log::error('NotificationService failed: '.$e->getMessage(), ['booking_id' => $booking->id]);
                    // fallback: simple email so student receives at least an email
                    try {
                        Mail::raw($message, function ($m) use ($booking, $title) {
                            $m->to($booking->student->email)->subject($title);
                        });
                        Log::info('Fallback email sent to student', ['email' => $booking->student->email, 'booking_id' => $booking->id]);
                    } catch (\Exception $mailEx) {
                        Log::error('Fallback email failed: ' . $mailEx->getMessage(), ['booking_id' => $booking->id]);
                    }
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Payment successful',
                    'redirect_url' => route('bookings.success', $booking->id),
                ]);
            }

            // otherwise failure
            $payment->update(['status' => 'failed']);
            return response()->json([
                'success' => false,
                'message' => $responseData['result']['description'] ?? 'Payment failed',
                'error_code' => $resultCode,
                'response' => $responseData,
            ], 400);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment processing exception: '.$e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'Payment processing error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle payment result after 3D Secure redirect
     */
    public function paymentResult(Request $request)
    {
        $resourcePath = $request->get('resourcePath');

        if (!$resourcePath) {
            return redirect()->route('bookings.index')
                ->with('error', app()->getLocale() == 'ar' ? 'مسار المورد مفقود في نتيجة الدفع' : 'Missing resourcePath in payment result');
        }

        try {
            $result = $this->checkHyperPayStatus($resourcePath);
            $resultCode = $result['result']['code'] ?? null;
            $merchantTxnId = $result['merchantTransactionId'] ?? null;

            if (str_starts_with($resultCode, '000.')) {
                // Extract booking ID from merchant transaction ID
                preg_match('/BK(\d+)_/', $merchantTxnId, $matches);
                $bookingId = $matches[1] ?? null;

                if ($bookingId) {
                    $booking = Booking::findOrFail($bookingId);
                    $payment = $booking->payment;

                    // Update payment
                    $payment->update([
                        'status' => 'paid',
                        'paid_at' => now(),
                        'gateway_response' => json_encode($result),
                    ]);

                    // Update booking
                    $booking->update([
                        'status' => 'confirmed',
                    ]);

                    // Create sessions
                    Sessions::createForBooking($booking);

                    return redirect()->route('bookings.success', $bookingId)
                        ->with('success', __('Payment successful!'));
                }
            } else {
                // Payment failed
                preg_match('/BK(\d+)_/', $merchantTxnId, $matches);
                $bookingId = $matches[1] ?? null;

                if ($bookingId) {
                    $payment = Payment::where('booking_id', $bookingId)->first();
                    if ($payment) {
                        $payment->update([
                            'status' => 'failed',
                            'gateway_response' => json_encode($result),
                        ]);
                    }

                    return redirect()->route('bookings.payment', $bookingId)
                        ->with('error', $result['result']['description'] ?? __('Payment failed'));
                }
            }

            return redirect()->route('bookings.index')
                ->with('error', __('Payment result processing error'));

        } catch (\Exception $e) {
            return redirect()->route('bookings.index')
                ->with('error', app()->getLocale() == 'ar' ? 'خطأ في معالجة نتيجة الدفع: ' . $e->getMessage() : 'Error processing payment result: ' . $e->getMessage());
        }
    }

    /**
     * Show success page
     */
    public function paymentSuccess($id)
    {
        $studentId = auth()->id();
        
        $booking = Booking::with([
            'course',
            'teacher',
            'payment',
            'sessions'
        ])->where('student_id', $studentId)
          ->findOrFail($id);

        if ($booking->status !== 'confirmed') {
            return redirect()->route('bookings.show', $id)
                ->with('error', __('Booking not confirmed'));
        }

        return view('student.bookings.success', compact('booking'));
    }

    /**
     * Cancel a booking
     */
    public function cancel($id)
    {
        $studentId = auth()->id();
        
        $booking = Booking::where('student_id', $studentId)
                         ->findOrFail($id);

        if (!$this->canCancelBooking($booking)) {
            return redirect()->back()
                ->with('error', app()->getLocale() == 'ar' ? 'لا يمكن إلغاء هذا الحجز الآن' : 'This booking cannot be cancelled at this time.');
        }

        DB::beginTransaction();
        try {
            // Calculate refund
            $refundInfo = $this->calculateRefund($booking);
            
            // Update booking
            $booking->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancellation_reason' => 'Cancelled by student',
                'refund_amount' => $refundInfo['refund_amount'],
                'refund_percentage' => $refundInfo['refund_percentage'],
            ]);

            // Cancel sessions
            $booking->sessions()
                   ->where('status', 'scheduled')
                   ->update(['status' => 'cancelled']);

            // Process refund if applicable
            if ($refundInfo['refund_amount'] > 0) {
                $this->processRefund($booking, $refundInfo['refund_amount']);
            }

            DB::commit();

            return redirect()->route('bookings.index')
                ->with('success', app()->getLocale() == 'ar' ? 'تم إلغاء الحجز بنجاح' : 'Booking cancelled successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', app()->getLocale() == 'ar' ? 'فشل إلغاء الحجز: ' . $e->getMessage() : 'Failed to cancel booking: ' . $e->getMessage());
        }
    }

    /**
     * Store a new booking
     */
    public function store(Request $request)
    {
        //dd($request->all());
        $request->validate([
            'teacher_id'   => 'required|integer|exists:users,id',
            'lesson_type'  => 'required|in:individual,group',
            'day_number'   => 'required|integer|between:1,7',
            'slot_id'      => 'required|integer|exists:availability_slots,id',
            'duration'     => 'required|numeric|min:0.5',
        ]);

        $studentId = auth()->id();
        $teacherId = (int)$request->input('teacher_id');
        if ($studentId == $teacherId) {
            return redirect()->back()->with('error', app()->getLocale() == 'ar' ? 'لا يمكنك حجز دروس لنفسك' : 'You cannot book lessons with yourself.');
        }
        Log::info("Storing booking for student $studentId with teacher $teacherId");
        DB::beginTransaction();
        Log::info("Transaction started for booking");
        try {
            // load slot and lock to avoid race conditions
            $slot = AvailabilitySlot::where('id', $request->slot_id)->lockForUpdate()->firstOrFail();
            Log::info("Selected slot: ".json_encode($slot));
            if (! $slot->is_available || $slot->is_booked) {
                DB::rollBack();
                Log::warning("Slot is no longer available: ".json_encode($slot));
                return redirect()->back()->with('error', app()->getLocale() == 'ar' ? 'هذه الفترة غير متاحة للحجز' : 'This slot is no longer available.');
            }
            Log::info("Slot is available");

            // determine base price from teacher info where possible
            $teacher = User::with('teacherInfo')->findOrFail($teacherId);
            Log::info("Loaded teacher info: ".json_encode($teacher->teacherInfo));
            $basePrice = 0;
            if ($request->lesson_type === 'individual') {
                $basePrice = optional($teacher->teacherInfo)->individual_hour_price ?? ($slot->price ?? 0);
            } else {
                $basePrice = optional($teacher->teacherInfo)->group_hour_price ?? ($slot->price ?? 0);
            }

            $duration = (float) $request->duration;
            $total = $basePrice * $duration;
            Log::info("Calculated total price: $total (Base: $basePrice, Duration: $duration)");
            // create booking
            $booking = Booking::create([
                'student_id' => $studentId,
                'teacher_id' => $teacherId,
                'course_id' => $slot->course_id ?? null,
                'lesson_type' => $request->lesson_type,
                'slot_id' => $slot->id,
                'first_session_date' => $slot->date, // if you store date or day_number mapping
                'first_session_start_time' => $slot->start_time,
                'first_session_end_time' => $slot->end_time,
                'duration' => $duration,
                'booking_date' => now()->format('Y-m-d'),
                'first_session_date' => $slot->date,
                'sessions_count' => (int) ceil($duration), // adjust if needed
                'sessions_completed' => 0,
                'total_amount' => $total,
                'currency' => 'SAR',
                'status' => 'pending_payment',
                'booking_reference' => 'BK' . now()->format('YmdHis') . '_' . Str::upper(Str::random(6)),
            ]);

            // create payment record
            $payment = Payment::create([
                'booking_id' => $booking->id,
                'amount' => $total,
                'currency' => 'SAR',
                'status' => 'pending_payment',
                'payment_method' => null,
            ]);

            // mark slot booked
            $slot->fill([
                'is_available' => false,
                'is_booked'    => true,
                'booking_id'   => $booking->id,
            ])->saveQuietly();

            DB::commit();

            // redirect to booking detail page where student can review and pay
            return redirect()->route('student.bookings.show', $booking->id)
                             ->with('success', app()->getLocale() == 'ar' ? 'تم إنشاء الحجز بنجاح. يرجى إكمال الدفع.' : 'Booking created successfully. Please proceed to payment.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Booking store error: '.$e->getMessage(), ['trace'=>$e->getTraceAsString()]);
            return redirect()->back()->with('error', app()->getLocale() == 'ar' ? 'فشل إنشاء الحجز: ' . $e->getMessage() : 'Failed to create booking: ' . $e->getMessage());
        }
    }

    /**
     * Helper Methods
     */

    private function detectPaymentBrand($cardNumber): string
    {
        $cardNumber = preg_replace('/\D/', '', $cardNumber);
        
        if (preg_match('/^4/', $cardNumber)) {
            return 'VISA';
        } elseif (preg_match('/^5[1-5]/', $cardNumber)) {
            return 'MASTER';
        } elseif (preg_match('/^6(?:011|5)/', $cardNumber)) {
            return 'DISCOVER';
        } elseif (preg_match('/^3[47]/', $cardNumber)) {
            return 'AMEX';
        } elseif (preg_match('/^(6|9)/', $cardNumber)) {
            return 'MADA';
        }
        
        return 'VISA'; // Default
    }

    private function callHyperPayAPI($payload): \Illuminate\Http\Client\Response
    {
        $baseUrl = config('hyperpay.base_url', 'https://eu-test.oppwa.com');
        $accessToken = config('hyperpay.access_token');

        return Http::withHeaders([
            'Authorization' => 'Bearer ' . $accessToken,
        ])->asForm()->post($baseUrl . '/v1/checkouts', $payload);
    }

    private function checkHyperPayStatus($resourcePath): array
    {
        $baseUrl = config('hyperpay.base_url', 'https://eu-test.oppwa.com');
        $accessToken = config('hyperpay.access_token');
        $url = $baseUrl . $resourcePath;

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $accessToken,
        ])->get($url);

        return $response->json();
    }

    private function canCancelBooking($booking): bool
    {
        if (in_array($booking->status, ['cancelled', 'completed'])) {
            return false;
        }

        $firstSessionDateTime = Carbon::parse(
            $booking->first_session_date . ' ' . $booking->first_session_start_time
        );

        return $firstSessionDateTime->subHours(24)->isFuture();
    }

    private function calculateRefund($booking): array
    {
        $firstSessionDateTime = Carbon::parse(
            $booking->first_session_date . ' ' . $booking->first_session_start_time
        );
        $hoursUntilSession = now()->diffInHours($firstSessionDateTime);

        if ($hoursUntilSession >= 48) {
            $refundPercentage = 100;
        } elseif ($hoursUntilSession >= 24) {
            $refundPercentage = 80;
        } elseif ($hoursUntilSession >= 4) {
            $refundPercentage = 50;
        } else {
            $refundPercentage = 0;
        }

        $refundAmount = ($booking->total_amount * $refundPercentage) / 100;

        return [
            'refund_percentage' => $refundPercentage,
            'refund_amount' => $refundAmount,
        ];
    }

    private function processRefund($booking, $refundAmount): void
    {
        // Implement refund processing with HyperPay
        $booking->payment->update([
            'refund_amount' => $refundAmount,
            'refund_status' => 'processing',
            'refund_processed_at' => now(),
        ]);
    }
}