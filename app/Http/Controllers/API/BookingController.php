<?php

/**
 * @OA\Info(
 *   version="1.0.0",
 *   title="Ewan Online Learning Platform API",
 *   description="API documentation generated from controller annotations"
 * )
 *
 * @OA\Server(
 *     url="/api",
 *     description="API server"
 * )
 */

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Course;
use App\Models\AvailabilitySlot;
use App\Models\Payment;
use App\Models\Sessions;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class BookingController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/",
     *     summary="Get all ",
     *     tags={""},
     *     @OA\Response(
     *         response=200,
     *         description="List of "
     *     )
     * )
     */
    /**
     * Create a new booking
     */
    /**
     * @OA\Post(
     *     path="/api/student/booking",
     *     summary="Create a new booking",
     *     tags={"Booking"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(type="object",
     *             @OA\Property(property="course_id", type="integer"),
     *             @OA\Property(property="service_id", type="integer"),
     *             @OA\Property(property="type", type="string", example="single")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Booking created successfully")
     * )
     */
    public function createBooking(Request $request): JsonResponse
    {
        // Unified booking handler: supports course bookings (existing flow) and service bookings.
        $request->validate([
            // Either course_id OR service_id must be provided
            'course_id' => 'nullable|exists:courses,id',
            'service_id' => 'nullable|exists:services,id',
            'teacher_id' => 'nullable|integer|exists:users,id',
            'subject_id' => 'nullable|integer',
            'availability_slot_id' => 'nullable|exists:availability_slots,id',
            'timeslot_id' => 'nullable|exists:availability_slots,id',
            'type' => 'required|in:single,package',
            'sessions_count' => 'required_if:type,package|integer|min:1|max:50',
            'special_requests' => 'nullable|string|max:500',
        ]);

        // Determine mode
        $isCourse = $request->filled('course_id');
        $isService = $request->filled('service_id');

        if (! $isCourse && ! $isService) {
            return response()->json([
                'success' => false,
                'message' => 'Either course_id or service_id is required'
            ], 422);
        }

        DB::beginTransaction();
        try {
            $studentId = auth()->id();

            if ($isCourse) {
                // Existing course booking flow
                $course = Course::with('teacher')->findOrFail($request->course_id);
                $slotId = $request->availability_slot_id;
                // lock the slot row to avoid race conditions
                $slot = AvailabilitySlot::where('id', $slotId)->lockForUpdate()->firstOrFail();
               

                // Validate slot ownership and state with detailed reasons
                $reasons = [];
                if (! $slot->is_available) $reasons[] = 'slot_not_available';
                if ($slot->is_booked) $reasons[] = 'slot_already_booked';
                if ($slot->teacher_id !== $course->teacher_id) $reasons[] = 'slot_teacher_mismatch';
                if ($slot->course_id !== $course->id) $reasons[] = 'slot_course_mismatch';
                if (count($reasons) > 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot book unavailable slot',
                        'reasons' => $reasons,
                        'slot' => [
                            'id' => $slot->id,
                            'is_available' => (bool)$slot->is_available,
                            'is_booked' => (bool)$slot->is_booked,
                            'teacher_id' => $slot->teacher_id,
                            'course_id' => $slot->course_id,
                        ]
                    ], 400);
                }

                $teacherId = $course->teacher_id;
                $sessionDuration = $course->session_duration ?? ($slot->duration ?? 60);
                $basePrice = $course->price_per_hour ?? 0;
                $currency = $course->currency ?? 'SAR';
            } else {
                // Service booking flow (no course record)
                $teacherId = $request->teacher_id;
                $slotId = $request->timeslot_id;
                // lock slot to avoid race conditions
                $slot = AvailabilitySlot::where('id', $slotId)->lockForUpdate()->firstOrFail();

                $reasons = [];
                if (! $slot->is_available) $reasons[] = 'slot_not_available';
                if ($slot->is_booked) $reasons[] = 'slot_already_booked';
                if ($slot->teacher_id != $teacherId) $reasons[] = 'slot_teacher_mismatch';
                if (count($reasons) > 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cannot book unavailable slot',
                        'reasons' => $reasons,
                        'slot' => [
                            'id' => $slot->id,
                            'is_available' => (bool)$slot->is_available,
                            'is_booked' => (bool)$slot->is_booked,
                            'teacher_id' => $slot->teacher_id,
                        ]
                    ], 400);
                }

                // Grab teacher pricing from TeacherInfo
                $teacherInfo = \App\Models\TeacherInfo::where('teacher_id', $teacherId)->first();
                $sessionDuration = $slot->duration ?? 60;
                $basePrice = ($request->type === 'single') ? ($teacherInfo->individual_hour_price ?? 0) : ($teacherInfo->group_hour_price ?? 0);
                $currency = 'SAR';
            }

            // Determine a concrete first session date for this slot.
            // Slots may be recurring (use day_number) or have a specific date.
            // Note: Empty string is falsy, so check it explicitly
            $slotDate = null;
            

            if ($slot->date && trim((string)$slot->date) !== '') {
                $slotDate = $slot->date instanceof \Carbon\Carbon ? $slot->date->format('Y-m-d') : (string) $slot->date;
            } elseif ($slot->day_number !== null) {
                // Compute next occurrence of the weekday (0=Sunday .. 6=Saturday)
                $today = Carbon::today();
                $targetDay = (int) $slot->day_number;
                $todayDow = $today->dayOfWeek; // 0 (Sunday) .. 6 (Saturday)
                $delta = ($targetDay - $todayDow + 7) % 7;
                $candidate = $today->copy()->addDays($delta);

                               // If the slot time is earlier or equal to now for the same day, schedule next week
                $slotStart = $this->extractTimeOnly($slot->start_time);
                $candidateDateTime = Carbon::parse($candidate->format('Y-m-d') . ' ' . $slotStart);
                
                

                if ($candidateDateTime->lessThanOrEqualTo(now())) {
                    $candidate->addDays(7);
                    Log::info('Slot time is in past, moved to next week', ['candidate_after' => $candidate->format('Y-m-d')]);
                }

                $slotDate = $candidate->format('Y-m-d');
            } else {
                // Fallback: use today's date
                $slotDate = Carbon::today()->format('Y-m-d');
                Log::info('Using fallback date (today)', ['slotDate' => $slotDate]);
            }

            $date = $slotDate;
            Log::info('Final slot date determined', ['date' => $date]);

            $startTime = $this->extractTimeOnly($slot->start_time);
            $endTime = $this->extractTimeOnly($slot->end_time);
          
            try {
                $slotDateTime = Carbon::parse($date . ' ' . $startTime);
                $slotEndDateTime = Carbon::parse($date . ' ' . $endTime);
                Log::info('DateTime parsing successful', [
                    'slotDateTime' => $slotDateTime->format('Y-m-d H:i:s'),
                    'slotEndDateTime' => $slotEndDateTime->format('Y-m-d H:i:s'),
                ]);
            } catch (\Exception $e) {
               return response()->json(['success' => false, 'message' => 'Failed to parse slot datetime', 'error' => $e->getMessage()], 500);
            }

            // Sessions count
            $sessionsCount = $request->type === 'package' ? (int)$request->sessions_count : 1;

            // Price calculations
            $pricePerSession = ($basePrice * ($sessionDuration ?? 60)) / 60;
            $discount = $sessionsCount > 1 ? $this->calculatePackageDiscount($sessionsCount) : 0;
            $subtotal = $pricePerSession * $sessionsCount;
            $discountAmount = $subtotal * ($discount / 100);
            $total = $subtotal - $discountAmount;

            // Create booking record
            $booking = Booking::create([
                'student_id' => $studentId,
                'teacher_id' => $teacherId,
                'course_id' => $isCourse ? $course->id : null,
                'subject_id' => !$isCourse ? $request->subject_id : null,
                'language_id' => !$isCourse && $request->filled('language_id') ? $request->language_id : null,
                'booking_reference' => $this->generateBookingReference(),
                'session_type' => $request->type,
                'sessions_count' => $sessionsCount,
                'sessions_completed' => 0,
                // store concrete datetimes/strings so Sessions::createForBooking gets valid values
                'first_session_date' => $slotDateTime,
                'first_session_start_time' => $slotDateTime->format('H:i:s'),
                'first_session_end_time' => $slotEndDateTime->format('H:i:s'),
                'session_duration' => $sessionDuration,
                'price_per_session' => $pricePerSession,
                'subtotal' => $subtotal,
                'discount_percentage' => $discount,
                'discount_amount' => $discountAmount,
                'total_amount' => $total,
                'currency' => $currency,
                'special_requests' => $request->special_requests,
                'status' => Booking::STATUS_PENDING_PAYMENT,
                'booking_date' => now(),
            ]);

            // NOTE: Slot is NOT marked as booked here
            // IMPORTANT: Slot will ONLY be marked booked (is_booked=true, is_available=false) AFTER successful payment
            // Sessions will ONLY be created AFTER payment succeeds
            // This ensures slot remains available if payment fails, preventing customer confusion
            // Slot locking happens in PaymentController.paymentStatus() when payment is confirmed

            DB::commit();
            Log::info('Booking created (pending payment, slot still available)', [
                'booking_id' => $booking->id, 
                'slot_id' => $slotId,
                'slot_status' => 'still_available',
                'next_step' => 'payment_via_PaymentController'
            ]);

            // Let frontend know whether student has saved payment methods
            $hasSavedMethods = \App\Models\UserPaymentMethod::where('user_id', $studentId)->exists();

            // Load teacher with full data
            $teacher = \App\Models\User::findOrFail($teacherId);
            $teacherData = $this->getFullTeacherData($teacher);

            // Get subject data: from course name if course booking, or from Subject model if service booking
            $subjectData = null;
            if ($isCourse && $booking->course) {
                // Course booking: return course name info (no subjects in courses)
                $subjectData = [
                    'id' => $booking->course->id,
                    'name' => $booking->course->name ?? null,
                    'name_en' => $booking->course->name ?? null,
                ];
            } elseif (!$isCourse && $request->filled('subject_id')) {
                // Service booking: fetch from Subject model
                $subject = Subject::find($request->subject_id);
                $subjectData = $subject ? [
                    'id' => $subject->id,
                    'name_en' => $subject->name_en,
                    'name_ar' => $subject->name_ar,
                ] : null;
            }

            // Get service data if service booking
            $serviceData = null;
            if ($isService) {
                $service = \App\Models\Services::find($request->service_id);
                $serviceData = $service ? [
                    'id' => $service->id,
                    'name' => $service->name,
                    'description' => $service->description ?? null,
                ] : null;
            }

            // Get timeslot with day and time info
            $timeslotData = [
                'id' => $slot->id,
                'day_number' => $slot->day_number,
                'day_name' => $this->getDayName($slot->day_number ?? 0),
                'start_time' => $slot->start_time instanceof \Carbon\Carbon ? $slot->start_time->format('H:i:s') : $slot->start_time,
                'end_time' => $slot->end_time instanceof \Carbon\Carbon ? $slot->end_time->format('H:i:s') : $slot->end_time,
                'duration' => $slot->duration,
            ];

            // Build response object for frontend (no payment created here)
            $responseData = [
                'booking' => [
                    'id' => $booking->id,
                    'reference' => $booking->booking_reference,
                    'status' => $booking->status,
                    'total_amount' => $booking->total_amount,
                    'currency' => $booking->currency,
                    'teacher' => $teacherData,
                    'student_id' => $booking->student_id,
                    'first_session_date' => $booking->first_session_date,
                    'first_session_start_time' => $booking->first_session_start_time,
                    'session_type' => $booking->session_type,
                    'sessions_count' => $booking->sessions_count,
                ],
                'requires_payment_method' => ! $hasSavedMethods,
                'meta' => [
                    'service' => $serviceData,
                    'subject' => $subjectData,
                    'timeslot' => $timeslotData,
                ]
            ];

            return response()->json(['success' => true, 'message' => 'Booking created successfully', 'data' => $responseData]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Booking creation failed', [
                'student_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['success' => false, 'message' => 'Failed to create booking', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Payment callback - verify payment after OTP/3DS redirect
     * GET /api/student/booking/payment-callback?resourcePath=xxx
     * 
     * HyperPay redirects here after user completes OTP
     */
    /**
     * @OA\Get(
     *     path="/api/student/booking/payment-callback",
     *     summary="Payment callback endpoint for 3DS/OTP verification",
     *     tags={"Payment"},
     *     @OA\Parameter(name="resourcePath", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="checkoutId", in="query", @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Payment verified or failed")
     * )
     */
    public function paymentCallback(Request $request): JsonResponse
    {
        $resourcePath = $request->get('resourcePath');
        $checkoutId = $request->get('checkoutId');

        if (!$resourcePath && !$checkoutId) {
            return response()->json([
                'success' => false,
                'message' => 'Missing resourcePath or checkoutId'
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Get payment status from HyperPay
            $hyperpayService = app(\App\Services\HyperpayService::class);
            
            if ($checkoutId) {
                $statusResponse = $hyperpayService->getPaymentStatus($checkoutId);
            } else {
                // If using resourcePath, construct full URL
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

            // Extract merchant transaction ID to find payment
            $merchantTransactionId = $statusData['merchantTransactionId'] ?? null;
            
            if (!$merchantTransactionId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot find transaction reference in response'
                ], 400);
            }

            // Find payment by transaction reference
            $payment = Payment::where('transaction_reference', $merchantTransactionId)
                             ->with('booking')
                             ->firstOrFail();

            $booking = $payment->booking;

            // Update payment with gateway response
            $payment->update([
                'gateway_response' => json_encode($statusData),
            ]);

            // Check result code
            $resultCode = $statusData['result']['code'] ?? '';
            $resultDescription = $statusData['result']['description'] ?? 'Unknown error';

            // Success codes start with 000
            if (str_starts_with($resultCode, '000.')) {
                // Payment successful after OTP
                $payment->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);

                // Update booking status to confirmed
                $booking->update(['status' => Booking::STATUS_CONFIRMED]);

                // Create sessions for the booking
                Sessions::createForBooking($booking);

                // Schedule meeting generation jobs
                $this->scheduleSessionMeetingJobs($booking);

                DB::commit();

                Log::info('Payment verified successfully after OTP', [
                    'booking_id' => $booking->id,
                    'payment_id' => $payment->id,
                ]);

                // Send success notification
                try {
                    $ns = new \App\Services\NotificationService();
                    $title = app()->getLocale() == 'ar' ? 'تم الدفع بنجاح' : 'Payment successful';
                    $msg = app()->getLocale() == 'ar'
                        ? "تم استلام دفعتك للحجز ({$booking->booking_reference}). شكراً."
                        : "Your payment for booking ({$booking->booking_reference}) was successful.";

                    $ns->send($booking->student, 'payment_success', $title, $msg, [
                        'booking_id' => $booking->id,
                        'payment_id' => $payment->id,
                        'amount' => $booking->total_amount,
                    ]);
                } catch (\Exception $e) {
                    Log::error('Payment success notification failed', ['error' => $e->getMessage()]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Payment verified and confirmed',
                    'data' => [
                        'booking_id' => $booking->id,
                        'booking_reference' => $booking->booking_reference,
                        'payment_id' => $payment->id,
                        'transaction_reference' => $payment->transaction_reference,
                        'status' => 'confirmed',
                        'amount_paid' => $booking->total_amount,
                        'currency' => $booking->currency,
                    ]
                ], 200);
            } else {
                // Payment failed
                $payment->update(['status' => 'failed']);
                DB::commit();

                Log::warning('Payment verification failed', [
                    'booking_id' => $booking->id,
                    'payment_id' => $payment->id,
                    'error_code' => $resultCode,
                    'error_description' => $resultDescription,
                ]);

                // Send failure notification
                try {
                    $ns = new \App\Services\NotificationService();
                    $title = app()->getLocale() == 'ar' ? 'فشل الدفع' : 'Payment failed';
                    $msg = app()->getLocale() == 'ar'
                        ? "فشلت دفعتك للحجز ({$booking->booking_reference}). الرجاء المحاولة مرة أخرى."
                        : "Your payment for booking ({$booking->booking_reference}) failed. Please try again.";

                    $ns->send($booking->student, 'payment_failed', $title, $msg, [
                        'booking_id' => $booking->id,
                        'payment_id' => $payment->id,
                    ]);
                } catch (\Exception $e) {
                    Log::error('Payment failure notification failed', ['error' => $e->getMessage()]);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Payment verification failed',
                    'error' => $resultDescription,
                    'error_code' => $resultCode,
                    'data' => [
                        'payment_id' => $payment->id,
                        'booking_id' => $booking->id,
                    ]
                ], 400);
            }

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Payment record not found'
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment callback error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Pay for a pending booking using 3DS checkout
     * POST /api/student/booking/{bookingId}/pay-3ds
     */
    /**
     * @OA\Post(
     *     path="/api/student/booking/{bookingId}/pay-3ds",
     *     summary="Initiate 3DS payment for a booking",
     *     tags={"Payment"},
     *     @OA\Parameter(name="bookingId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(@OA\JsonContent(type="object")),
     *     @OA\Response(response=200, description="3DS checkout created")
     * )
     */
    // public function payBooking3DS(Request $request): JsonResponse
    // {
    //     $studentId = auth()->id();
        
    //     $request->validate([
    //         'booking_id' => 'required|exists:bookings,id',
    //         'payment_brand' => 'required|in:VISA,MASTER,MADA',
    //         'return_url' => 'nullable|url', // Frontend callback URL
    //     ]);

    //     $bookingId = $request->booking_id;
    //     DB::beginTransaction();
    //     try {
    //         // Fetch booking with validation
    //         $booking = Booking::where('id', $bookingId)
    //                          ->where('student_id', $studentId)
    //                          ->with('teacher')
    //                          ->firstOrFail();

    //         // Check booking status
    //         if ($booking->status !== Booking::STATUS_PENDING_PAYMENT) {
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Booking is not awaiting payment',
    //                 'current_status' => $booking->status
    //             ], 400);
    //         }

    //         Log::info('3DS payment initiation', [
    //             'booking_id' => $bookingId,
    //             'student_id' => $studentId,
    //             'amount' => $booking->total_amount,
    //             'currency' => $booking->currency,
    //         ]);

    //         // Create payment record
    //         $payment = Payment::create([
    //             'booking_id' => $bookingId,
    //             'student_id' => $studentId,
    //             'teacher_id' => $booking->teacher_id,
    //             'amount' => $booking->total_amount,
    //             'currency' => $booking->currency,
    //             'payment_method' => $request->payment_brand,
    //             'status' => 'pending',
    //             'transaction_reference' => $this->generateTransactionReference(),
    //             'gateway_reference' => null,
    //             'gateway_response' => null,
    //             'paid_at' => null,
    //         ]);

    //         Log::info('Payment record created', [
    //             'payment_id' => $payment->id,
    //             'transaction_reference' => $payment->transaction_reference,
    //         ]);

    //         // Prepare 3DS checkout payload
    //         $hyperpayService = app(\App\Services\HyperpayService::class);
            
    //         $callbackUrl = $request->return_url ?? route('api.payment.callback');

    //         $payload = [
    //             'amount' => number_format($booking->total_amount, 2, '.', ''),
    //             'currency' => strtoupper($booking->currency),
    //             'paymentType' => 'DB', // Debit (direct charge)
    //             'paymentBrand' => $request->payment_brand,
    //             'merchantTransactionId' => $payment->transaction_reference,
    //             'shopperResultUrl' => $callbackUrl,
    //             'customer.email' => $booking->student ? $booking->student->email : 'student@ewan.com',
    //             'customer.givenName' => $booking->student ? $booking->student->first_name : 'Student',
    //             'customer.surname' => $booking->student ? $booking->student->last_name : 'User',
    //             'billing.city' => 'Riyadh',
    //             'billing.country' => 'SA',
    //             'customParameters[booking_id]' => $bookingId,
    //             'customParameters[payment_id]' => $payment->id,
    //         ];

    //         Log::info('3DS checkout payload prepared', [
    //             'payment_id' => $payment->id,
    //             'amount' => $payload['amount'],
    //             'currency' => $payload['currency'],
    //             'brand' => $payload['paymentBrand'],
    //         ]);

    //         // Call HyperPay 3DS checkout
    //         $checkoutResponse = $hyperpayService->create3DSCheckout($payload);
    //         $responseData = $checkoutResponse->json();

    //         Log::info('3DS checkout response', [
    //             'payment_id' => $payment->id,
    //             'status_code' => $checkoutResponse->status(),
    //             'checkout_id' => $responseData['id'] ?? 'unknown',
    //             'redirect_url' => $responseData['redirectUrl'] ?? 'none',
    //         ]);

    //         // Update payment with gateway reference
    //         $payment->update([
    //             'gateway_reference' => $responseData['id'] ?? null,
    //             'gateway_response' => json_encode($responseData),
    //         ]);

    //         // Check if checkout was successful
    //         if ($checkoutResponse->successful() && isset($responseData['redirectUrl'])) {
    //             DB::commit();

    //             return response()->json([
    //                 'success' => true,
    //                 'message' => 'Checkout created. Redirect to payment page.',
    //                 'data' => [
    //                     'payment_id' => $payment->id,
    //                     'checkout_id' => $responseData['id'],
    //                     'redirect_url' => $responseData['redirectUrl'], // Frontend should redirect here
    //                     'transaction_reference' => $payment->transaction_reference,
    //                     'booking_id' => $booking->id,
    //                 ]
    //             ], 200);
    //         } else {
    //             $payment->update(['status' => 'failed']);
    //             DB::commit();

    //             $resultCode = $responseData['result']['code'] ?? 'unknown';
    //             $resultDescription = $responseData['result']['description'] ?? 'Failed to create checkout';

    //             Log::error('3DS checkout failed', [
    //                 'payment_id' => $payment->id,
    //                 'error_code' => $resultCode,
    //                 'error_description' => $resultDescription,
    //             ]);

    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Failed to create checkout',
    //                 'error' => $resultDescription,
    //                 'error_code' => $resultCode,
    //                 'data' => [
    //                     'payment_id' => $payment->id,
    //                     'booking_id' => $bookingId,
    //                 ]
    //             ], 400);
    //         }

    //     } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
    //         DB::rollBack();
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Booking not found'
    //         ], 404);
    //     } catch (\Exception $e) {
    //         DB::rollBack();
    //         Log::error('3DS payment initiation error', [
    //             'booking_id' => $bookingId ?? null,
    //             'student_id' => $studentId,
    //             'error' => $e->getMessage(),
    //             'trace' => $e->getTraceAsString(),
    //         ]);
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Payment initiation failed',
    //             'error' => $e->getMessage()
    //         ], 500);
    //     }
    // }
    public function payBooking3DS(Request $request): JsonResponse
{
    $studentId = auth()->id();
    
    $request->validate([
        'booking_id' => 'required|exists:bookings,id',
        'payment_brand' => 'required|in:VISA,MASTER,MADA',
    ]);

    $bookingId = $request->booking_id;
    DB::beginTransaction();
    try {
        $booking = Booking::where('id', $bookingId)
                         ->where('student_id', $studentId)
                         ->with('teacher')
                         ->firstOrFail();

        if ($booking->status !== Booking::STATUS_PENDING_PAYMENT) {
            return response()->json([
                'success' => false,
                'message' => 'Booking is not awaiting payment',
                'current_status' => $booking->status
            ], 400);
        }

        Log::info('3DS payment initiation', [
            'booking_id' => $bookingId,
            'student_id' => $studentId,
            'amount' => $booking->total_amount,
        ]);

        // Create payment record
        $payment = Payment::create([
            'booking_id' => $bookingId,
            'student_id' => $studentId,
            'teacher_id' => $booking->teacher_id,
            'amount' => $booking->total_amount,
            'currency' => $booking->currency,
            'payment_method' => $request->payment_brand,
            'status' => 'pending',
            'transaction_reference' => $this->generateTransactionReference(),
        ]);

        // Prepare 3DS checkout payload
        $hyperpayService = app(\App\Services\HyperpayService::class);
        
        // IMPORTANT: This callback URL is where HyperPay redirects after 3DS
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

        // Call HyperPay 3DS checkout
        $checkoutResponse = $hyperpayService->create3DSCheckout($payload);
        $responseData = $checkoutResponse->json();

        Log::info('3DS checkout response', [
            'payment_id' => $payment->id,
            'checkout_id' => $responseData['id'] ?? 'unknown',
        ]);

        // Update payment with checkout ID
        $payment->update([
            'gateway_reference' => $responseData['id'] ?? null,
            'gateway_response' => json_encode($responseData),
        ]);

        $resultCode = $responseData['result']['code'] ?? '';

        // Check if checkout was created successfully
        if ($checkoutResponse->successful() && isset($responseData['id'])) {
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Checkout created. Complete payment using checkout_id.',
                'requires_3ds' => true,
                'data' => [
                    'payment_id' => $payment->id,
                    'checkout_id' => $responseData['id'],
                    'transaction_reference' => $payment->transaction_reference,
                    'booking_id' => $booking->id,
                    'amount' => $booking->total_amount,
                    'currency' => $booking->currency,
                    // Mobile app uses this checkout_id with HyperPay SDK
                ]
            ], 200);
        } else {
            $payment->update(['status' => 'failed']);
            DB::commit();

            Log::error('3DS checkout failed', [
                'payment_id' => $payment->id,
                'error_code' => $resultCode,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create checkout',
                'error_code' => $resultCode,
            ], 400);
        }

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('3DS payment initiation error', [
            'error' => $e->getMessage(),
        ]);
        return response()->json([
            'success' => false,
            'message' => 'Payment initiation failed',
        ], 500);
    }
}
    /**
     * Pay for a pending booking using card (Direct Payment with OTP redirect)
     * POST /api/student/booking/{bookingId}/pay
     * 
     * Request: card details + booking info
     * Response: redirect URL for OTP/3DS or success if already verified
     */
    /**
     * @OA\Post(
     *     path="/api/student/booking/pay",
     *     summary="Pay for a booking (card)",
     *     tags={"Payment"},
     *     @OA\RequestBody(@OA\JsonContent(type="object")),
     *     @OA\Response(response=200, description="Payment processed or OTP required")
     * )
     */
    // public function payBooking(Request $request): JsonResponse
    // {
    //     $studentId = auth()->id();
        
    //     // Validate card payment details
    //     $currentYear = Carbon::now()->year;
    //     $request->validate([
    //         'booking_id' => 'required|exists:bookings,id',
    //         'card_number' => 'required|regex:/^\d{13,19}$/',
    //         'card_holder' => 'required|string|max:100',
    //         'expiry_month' => 'required|integer|between:1,12',
    //         'expiry_year' => 'required|integer|min:' . $currentYear,
    //         'cvv' => 'required|regex:/^\d{3,4}$/',
    //         'payment_brand' => 'required|in:VISA,MASTER,MADA',
    //     ]);
        
    //     $bookingId = $request->booking_id;
    //     DB::beginTransaction();
    //     try {
    //         // Fetch booking with validation
    //         $booking = Booking::where('id', $bookingId)
    //                          ->where('student_id', $studentId)
    //                          ->with('teacher')
    //                          ->firstOrFail();

    //         // Check booking status
    //         if ($booking->status !== Booking::STATUS_PENDING_PAYMENT) {
    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Booking is not awaiting payment',
    //                 'current_status' => $booking->status
    //             ], 400);
    //         }

    //         Log::info('Direct payment attempt for booking', [
    //             'booking_id' => $bookingId,
    //             'student_id' => $studentId,
    //             'amount' => $booking->total_amount,
    //             'currency' => $booking->currency,
    //             'payment_brand' => $request->payment_brand,
    //         ]);

    //         // Create payment record (initial state)
    //         $payment = Payment::create([
    //             'booking_id' => $bookingId,
    //             'student_id' => $studentId,
    //             'teacher_id' => $booking->teacher_id,
    //             'amount' => $booking->total_amount,
    //             'currency' => $booking->currency,
    //             'payment_method' => $request->payment_brand,
    //             'status' => 'pending',
    //             'transaction_reference' => $this->generateTransactionReference(),
    //             'gateway_reference' => null,
    //             'gateway_response' => null,
    //             'paid_at' => null,
    //         ]);

    //         Log::info('Payment record created', [
    //             'payment_id' => $payment->id,
    //             'transaction_reference' => $payment->transaction_reference,
    //         ]);

    //         // Prepare HyperPay payload with card details
    //         $hyperpayService = app(\App\Services\HyperpayService::class);
            
    //         $payload = [
    //             'amount' => number_format($booking->total_amount, 2, '.', ''),
    //             'currency' => strtoupper($booking->currency),
    //             'paymentType' => 'DB', // Debit (direct charge)
    //             'paymentBrand' => $request->payment_brand,
    //             'merchantTransactionId' => $payment->transaction_reference,
    //             'shopperResultUrl' => route('api.payment.result'),
    //             'card.number' => $request->card_number,
    //             'card.holder' => $request->card_holder,
    //             'card.expiryMonth' => str_pad($request->expiry_month, 2, '0', STR_PAD_LEFT),
    //             'card.expiryYear' => $request->expiry_year,
    //             'card.cvv' => $request->cvv,
    //             'customer.email' => $booking->student ? $booking->student->email : 'student@ewan.com',
    //             'customer.givenName' => $booking->student ? $booking->student->first_name : 'Student',
    //             'customer.surname' => $booking->student ? $booking->student->last_name : 'User',
    //             'billing.city' => 'Riyadh',
    //             'billing.country' => 'SA',
    //             'customParameters[booking_id]' => $bookingId,
    //         ];

    //         Log::info('HyperPay payment request prepared', [
    //             'payment_id' => $payment->id,
    //             'amount' => $payload['amount'],
    //             'currency' => $payload['currency'],
    //             'brand' => $payload['paymentBrand'],
    //         ]);

    //         // Call HyperPay API (prepareCheckout handles the POST)
    //         $hyperpayResponse = $hyperpayService->prepareCheckout($payload);
    //         $responseData = $hyperpayResponse->json();

    //         Log::info('HyperPay response received', [
    //             'payment_id' => $payment->id,
    //             'status_code' => $hyperpayResponse->status(),
    //             'response_id' => $responseData['id'] ?? 'unknown',
    //             'response_code' => $responseData['result']['code'] ?? 'unknown',
    //             'response_description' => $responseData['result']['description'] ?? 'unknown',
    //             'full_response' => json_encode($responseData), // Log full response for debugging
    //         ]);

    //         // Update payment with gateway response
    //         $payment->update([
    //             'gateway_reference' => $responseData['id'] ?? null,
    //             'gateway_response' => json_encode($responseData),
    //         ]);

    //         // Check the response code
    //         $resultCode = $responseData['result']['code'] ?? '';
    //         $resultDescription = $responseData['result']['description'] ?? 'Unknown error';

    //         // Continue processing the HyperPay response (removed debug early-return)
    //         // The payment record was already updated with gateway_reference/gateway_response above.

    //         // Success codes start with 000
    //         if (str_starts_with($resultCode, '000.')) {
    //             // Check if there's a redirect URL for OTP/3DS
    //             $redirectUrl = $responseData['redirect']['url'] ?? 
    //                           $responseData['redirectUrl'] ?? 
    //                           null;

    //             if ($redirectUrl) {
    //                 // Payment requires OTP/3DS verification
    //                 DB::commit();

    //                 Log::info('OTP/3DS redirect required', [
    //                     'payment_id' => $payment->id,
    //                     'redirect_url' => $redirectUrl,
    //                 ]);

    //                 return response()->json([
    //                     'success' => true,
    //                     'message' => 'Card validated. OTP/3DS verification required.',
    //                     'requires_otp' => true,
    //                     'redirect_url' => $redirectUrl,
    //                     'data' => [
    //                         'payment_id' => $payment->id,
    //                         'transaction_reference' => $payment->transaction_reference,
    //                         'booking_id' => $booking->id,
    //                         'gateway_reference' => $responseData['id'],
    //                     ]
    //                 ], 200);
    //             } else {
    //                 // No redirect URL returned. There are two common cases:
    //                 // 1) The gateway returned a checkout id (created) but payment is still pending and requires client-side widget or later callback.
    //                 // 2) The gateway returned an immediate success (rare) and the response is already final.

    //                 $checkoutId = $responseData['id'] ?? null;

    //                 if ($checkoutId) {
    //                     // Try to fetch the immediate status for the checkout id to avoid marking paid prematurely.
    //                     try {
    //                         $statusResp = $hyperpayService->getPaymentStatus($checkoutId);
    //                         $statusData = $statusResp->json();
    //                         $statusCode = $statusData['result']['code'] ?? '';

    //                         // If final success reported by status endpoint, treat as paid
    //                         if (str_starts_with($statusCode, '000.')) {
    //                             $payment->update([
    //                                 'status' => 'paid',
    //                                 'paid_at' => now(),
    //                                 'gateway_response' => json_encode(array_merge($responseData, ['status_check' => $statusData])),
    //                             ]);

    //                             // Update booking and sessions
    //                             $booking->update(['status' => Booking::STATUS_CONFIRMED]);
    //                             Sessions::createForBooking($booking);
    //                             $this->scheduleSessionMeetingJobs($booking);
    //                             DB::commit();

    //                             Log::info('Payment confirmed by status check', ['payment_id' => $payment->id, 'checkout_id' => $checkoutId]);

    //                             // Send notification
    //                             try {
    //                                 $ns = new \App\Services\NotificationService();
    //                                 $title = app()->getLocale() == 'ar' ? 'تم الدفع بنجاح' : 'Payment successful';
    //                                 $msg = app()->getLocale() == 'ar'
    //                                     ? "تم استلام دفعتك للحجز ({$booking->booking_reference}). شكراً."
    //                                     : "Your payment for booking ({$booking->booking_reference}) was successful.";

    //                                 $ns->send($booking->student, 'payment_success', $title, $msg, [
    //                                     'booking_id' => $booking->id,
    //                                     'payment_id' => $payment->id,
    //                                     'amount' => $booking->total_amount,
    //                                 ]);
    //                             } catch (\Exception $e) {
    //                                 Log::error('Payment success notification failed', ['error' => $e->getMessage()]);
    //                             }

    //                             return response()->json([
    //                                 'success' => true,
    //                                 'message' => 'Payment successful. Booking confirmed.',
    //                                 'data' => [
    //                                     'booking_id' => $booking->id,
    //                                     'booking_reference' => $booking->booking_reference,
    //                                     'payment_id' => $payment->id,
    //                                     'transaction_reference' => $payment->transaction_reference,
    //                                     'status' => 'confirmed',
    //                                     'amount_paid' => $booking->total_amount,
    //                                     'currency' => $booking->currency,
    //                                     'payment_method' => $request->payment_brand,
    //                                     'first_session_date' => $booking->first_session_date,
    //                                 ]
    //                             ], 200);
    //                         }
    //                     } catch (\Exception $e) {
    //                         Log::warning('Payment status check failed', ['checkout_id' => $checkoutId, 'error' => $e->getMessage()]);
    //                         // fall-through to return checkout id (pending)
    //                     }

    //                     // Still pending: return checkout id so frontend can render widget or poll status
    //                     DB::commit();
    //                     return response()->json([
    //                         'success' => true,
    //                         'message' => 'Checkout created — payment pending. Use checkout id with the payment widget or wait for callback.',
    //                         'data' => [
    //                             'payment_id' => $payment->id,
    //                             'checkout_id' => $checkoutId,
    //                             'gateway_response' => $responseData,
    //                         ]
    //                     ], 200);
    //                 }

    //                 // Fallback: if no checkout id, but gateway returned success code, treat as immediate success
    //                 $payment->update([
    //                     'status' => 'paid',
    //                     'paid_at' => now(),
    //                 ]);

    //                 $booking->update(['status' => Booking::STATUS_CONFIRMED]);
    //                 Sessions::createForBooking($booking);
    //                 $this->scheduleSessionMeetingJobs($booking);
    //                 DB::commit();

    //                 Log::info('Payment successful without OTP (fallback)', [
    //                     'booking_id' => $bookingId,
    //                     'payment_id' => $payment->id,
    //                     'transaction_reference' => $payment->transaction_reference,
    //                 ]);

    //                 try {
    //                     $ns = new \App\Services\NotificationService();
    //                     $title = app()->getLocale() == 'ar' ? 'تم الدفع بنجاح' : 'Payment successful';
    //                     $msg = app()->getLocale() == 'ar'
    //                         ? "تم استلام دفعتك للحجز ({$booking->booking_reference}). شكراً."
    //                         : "Your payment for booking ({$booking->booking_reference}) was successful.";

    //                     $ns->send($booking->student, 'payment_success', $title, $msg, [
    //                         'booking_id' => $booking->id,
    //                         'payment_id' => $payment->id,
    //                         'amount' => $booking->total_amount,
    //                     ]);
    //                 } catch (\Exception $e) {
    //                     Log::error('Payment success notification failed', ['error' => $e->getMessage()]);
    //                 }

    //                 return response()->json([
    //                     'success' => true,
    //                     'message' => 'Payment successful. Booking confirmed.',
    //                     'data' => [
    //                         'booking_id' => $booking->id,
    //                         'booking_reference' => $booking->booking_reference,
    //                         'payment_id' => $payment->id,
    //                         'transaction_reference' => $payment->transaction_reference,
    //                         'status' => 'confirmed',
    //                         'amount_paid' => $booking->total_amount,
    //                         'currency' => $booking->currency,
    //                         'payment_method' => $request->payment_brand,
    //                         'first_session_date' => $booking->first_session_date,
    //                     ]
    //                 ], 200);
    //             }
    //         } else {
    //             // Payment failed or card rejected
    //             $payment->update(['status' => 'failed']);
    //             DB::commit();

    //             Log::warning('Payment failed at HyperPay', [
    //                 'booking_id' => $bookingId,
    //                 'payment_id' => $payment->id,
    //                 'error_code' => $resultCode,
    //                 'error_description' => $resultDescription,
    //             ]);

    //             return response()->json([
    //                 'success' => false,
    //                 'message' => 'Payment failed',
    //                 'error' => $resultDescription,
    //                 'error_code' => $resultCode,
    //                 'data' => [
    //                     'payment_id' => $payment->id,
    //                     'transaction_reference' => $payment->transaction_reference,
    //                     'booking_id' => $bookingId,
    //                 ]
    //             ], 400);
    //         }

    //     } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
    //         DB::rollBack();
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Booking not found'
    //         ], 404);
    //     } catch (\Exception $e) {
    //         DB::rollBack();
    //         Log::error('Payment processing error', [
    //             'booking_id' => $bookingId ?? null,
    //             'student_id' => $studentId,
    //             'error' => $e->getMessage(),
    //             'trace' => $e->getTraceAsString(),
    //         ]);
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Payment processing failed',
    //             'error' => $e->getMessage()
    //         ], 500);
    //     }
    // }
    public function payBooking(Request $request): JsonResponse
{
    $studentId = auth()->id();
    
    // Validate card payment details
    $currentYear = Carbon::now()->year;
    $request->validate([
        'booking_id' => 'required|exists:bookings,id',
        'card_number' => 'required|regex:/^\d{13,19}$/',
        'card_holder' => 'required|string|max:100',
        'expiry_month' => 'required|integer|between:1,12',
        'expiry_year' => 'required|integer|min:' . $currentYear,
        'cvv' => 'required|regex:/^\d{3,4}$/',
        'payment_brand' => 'required|in:VISA,MASTER,MADA',
    ]);
    
    $bookingId = $request->booking_id;
    DB::beginTransaction();
    try {
        // Fetch booking with validation
        $booking = Booking::where('id', $bookingId)
                         ->where('student_id', $studentId)
                         ->with('teacher')
                         ->firstOrFail();

        // Check booking status
        if ($booking->status !== Booking::STATUS_PENDING_PAYMENT) {
            return response()->json([
                'success' => false,
                'message' => 'Booking is not awaiting payment',
                'current_status' => $booking->status
            ], 400);
        }

        Log::info('Direct payment attempt for booking', [
            'booking_id' => $bookingId,
            'student_id' => $studentId,
            'amount' => $booking->total_amount,
            'currency' => $booking->currency,
            'payment_brand' => $request->payment_brand,
        ]);

        // Create payment record (initial state)
        $payment = Payment::create([
            'booking_id' => $bookingId,
            'student_id' => $studentId,
            'teacher_id' => $booking->teacher_id,
            'amount' => $booking->total_amount,
            'currency' => $booking->currency,
            'payment_method' => $request->payment_brand,
            'status' => 'pending',
            'transaction_reference' => $this->generateTransactionReference(),
            'gateway_reference' => null,
            'gateway_response' => null,
            'paid_at' => null,
        ]);

        Log::info('Payment record created', [
            'payment_id' => $payment->id,
            'transaction_reference' => $payment->transaction_reference,
        ]);

        // Prepare HyperPay payload with card details
        $hyperpayService = app(\App\Services\HyperpayService::class);
        
        $payload = [
            'amount' => number_format($booking->total_amount, 2, '.', ''),
            'currency' => strtoupper($booking->currency),
            'paymentType' => 'DB', // Debit (direct charge)
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

        Log::info('HyperPay payment request prepared', [
            'payment_id' => $payment->id,
            'amount' => $payload['amount'],
            'currency' => $payload['currency'],
            'brand' => $payload['paymentBrand'],
        ]);

        // Call HyperPay API
        $hyperpayResponse = $hyperpayService->directPayment($payload);
        $responseData = $hyperpayResponse->json();

        Log::info('HyperPay response received', $responseData);

        // Update payment with gateway response
        $payment->update([
            'gateway_reference' => $responseData['id'] ?? null,
            'gateway_response' => json_encode($responseData),
        ]);

        // Check the response code
        $resultCode = $responseData['result']['code'] ?? '';
        $resultDescription = $responseData['result']['description'] ?? 'Unknown error';
        $checkoutId = $responseData['id'] ?? null;
        
        // IMPORTANT: HyperPay codes meaning:
        // 000.000.xxx or 000.100.xxx = Transaction successfully processed (FINAL SUCCESS)
        // 000.200.xxx = Transaction pending (checkout created, needs 3DS/OTP)
        // 000.400.xxx = Transaction pending, waiting for customer action
        // Other codes = Error/Rejection

        // Success codes - but need to distinguish between FINAL success and PENDING
        if (str_starts_with($resultCode, '000.000.') || str_starts_with($resultCode, '000.100.')) {
            // FINAL SUCCESS - Rare case where no 3DS is required
            $payment->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            $booking->update(['status' => Booking::STATUS_CONFIRMED]);
            Sessions::createForBooking($booking);
            $this->scheduleSessionMeetingJobs($booking);
            DB::commit();

            Log::info('Payment successful without 3DS', [
                'booking_id' => $bookingId,
                'payment_id' => $payment->id,
            ]);

            // Send notification
            try {
                $ns = new \App\Services\NotificationService();
                $title = app()->getLocale() == 'ar' ? 'تم الدفع بنجاح' : 'Payment successful';
                $msg = app()->getLocale() == 'ar'
                    ? "تم استلام دفعتك للحجز ({$booking->booking_reference}). شكراً."
                    : "Your payment for booking ({$booking->booking_reference}) was successful.";

                $ns->send($booking->student, 'payment_success', $title, $msg, [
                    'booking_id' => $booking->id,
                    'payment_id' => $payment->id,
                    'amount' => $booking->total_amount,
                ]);
            } catch (\Exception $e) {
                Log::error('Payment success notification failed', ['error' => $e->getMessage()]);
            }

            return response()->json([
                'success' => true,
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
                ]
            ], 200);
        } 
        elseif (str_starts_with($resultCode, '000.200.') || str_starts_with($resultCode, '000.400.')) {
            // PENDING - Checkout created, needs 3DS/OTP verification
            DB::commit();

            Log::info('Checkout created - 3DS verification required', [
                'payment_id' => $payment->id,
                'checkout_id' => $checkoutId,
                'result_code' => $resultCode,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Checkout created. 3DS verification required.',
                'requires_3ds' => true,
                'data' => [
                    'payment_id' => $payment->id,
                    'checkout_id' => $checkoutId,
                    'transaction_reference' => $payment->transaction_reference,
                    'booking_id' => $booking->id,
                    'amount' => $booking->total_amount,
                    'currency' => $booking->currency,
                    // Mobile app should use this checkout_id with HyperPay mobile SDK
                    // or redirect user to HyperPay's payment form
                    'redirect_url' => $responseData['redirect'] ?? null,
                ]
            ], 200);
        } 
        else {
            // Payment failed or rejected
            $payment->update(['status' => 'failed']);
            DB::commit();

            Log::warning('Payment failed at HyperPay', [
                'booking_id' => $bookingId,
                'payment_id' => $payment->id,
                'error_code' => $resultCode,
                'error_description' => $resultDescription,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment failed',
                'error' => $resultDescription,
                'error_code' => $resultCode,
                'data' => [
                    'payment_id' => $payment->id,
                    'transaction_reference' => $payment->transaction_reference,
                    'booking_id' => $bookingId,
                ]
            ], 400);
        }

    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'message' => 'Booking not found'
        ], 404);
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Payment processing error', [
            'booking_id' => $bookingId ?? null,
            'student_id' => $studentId,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
        return response()->json([
            'success' => false,
            'message' => 'Payment processing failed',
            'error' => $e->getMessage()
        ], 500);
    }
}

    /**
     * Schedule meeting generation jobs for all sessions in a booking
     */
    private function scheduleSessionMeetingJobs(Booking $booking): void
    {
        // If using Zoom or Agora, schedule meeting generation for each session
        $sessions = $booking->sessions;
        
        foreach ($sessions as $session) {
            Log::info('Session meeting generation processing', ['session_id' => $session->id]);

            try {
                // If session already has a meeting/join URL, skip creation
                if (empty($session->meeting_id) || empty($session->join_url)) {
                    $created = $session->createMeeting();
                    Log::info('Session createMeeting() result', ['session_id' => $session->id, 'created' => $created]);
                } else {
                    Log::info('Session already has meeting info', ['session_id' => $session->id]);
                }

                // Notify participants if join_url is present
                if (! empty($session->join_url)) {
                    $ns = new \App\Services\NotificationService();

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
                // continue with other sessions
            }
        }
    }

    /**
     * Get student's bookings
     */
    /**
     * @OA\Get(
     *     path="/api/student/booking",
     *     summary="Get bookings for authenticated student",
     *     tags={"Booking"},
     *     @OA\Parameter(name="status", in="query", @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="List of bookings")
     * )
     */
    public function getStudentBookings(Request $request): JsonResponse
    {
        $studentId = auth()->id();
        $status = $request->get('status', 'all'); // all, upcoming, completed, cancelled
        $perPage = $request->get('per_page', 10);

        $query = Booking::with([
            'subject',
            'courses',
            'course.service',
            'teacher.profile'
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

        $bookings = $query->orderByDesc('created_at')->paginate($perPage);

        $transformedBookings = $bookings->through(function ($booking) {
            // Load teacher with full data
            $teacherData = $this->getFullTeacherData($booking->teacher);

            // Get subject data if course booking
            $courseData = null;
            if ($booking->course) {
                $courseData = Course::find($booking->course_id);
            } else {
                $subjectData = Subject::find($booking->subject_id);
            }

            return [
                'id' => $booking->id,
                'reference' => $booking->booking_reference,
                'teacher' => $teacherData,
                'course' =>  $courseData,
                'subject' => $subjectData,
                'session_info' => [
                    'type' => $booking->session_type,
                    'total_sessions' => $booking->sessions_count,
                    'completed_sessions' => $booking->sessions_completed,
                    'remaining_sessions' => $booking->sessions_count - $booking->sessions_completed,
                    'duration' => $booking->session_duration . ' minutes',
                    'join_url' => ($booking->status === 'confirmed' && Route::has('sessions.join')) ? route('sessions.join', ['booking_id' => $booking->id]) : null,
                    'host_url' => ($booking->status === 'confirmed' && Route::has('sessions.host')) ? route('sessions.host', ['booking_id' => $booking->id]) : null,
                ],
                'schedule' => [
                    'first_session_date' => $booking->first_session_date,
                    'first_session_time' => $booking->first_session_start_time,
                    'next_session_date' => $this->getNextSessionDate($booking),
                ],
                'pricing' => [
                    'total_amount' => $booking->total_amount,
                    'currency' => $booking->currency,
                    'discount_applied' => $booking->discount_percentage > 0,
                ],
                'status' => $booking->status,
                'booking_date' => $booking->booking_date->format('Y-m-d H:i'),
                'can_cancel' => $this->canCancelBooking($booking),
                'can_reschedule' => $this->canRescheduleBooking($booking),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $transformedBookings,
            'pagination' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ]
        ]);
    }

    /**
     * Get detailed booking information
     */
    /**
     * @OA\Get(
     *     path="/api/student/booking/{bookingId}",
     *     summary="Get booking details",
     *     tags={"Booking"},
     *     @OA\Parameter(name="bookingId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Booking details")
     * )
     */
    public function getBookingDetails($bookingId): JsonResponse
    {
        $studentId = auth()->id();
        
        $booking = Booking::with([
            'course.subject',
            'course.service',
            'course.educationLevel',
            'course.classLevel',
            'teacher.profile',
            'payment',
            'sessions' => function($query) {
                $query->orderBy('session_date')->orderBy('start_time');
            }
        ])->where('student_id', $studentId)
          ->findOrFail($bookingId);

        $date = $booking->first_session_date instanceof \Carbon\Carbon
            ? $booking->first_session_date->format('Y-m-d')
            : substr($booking->first_session_date, 0, 10);

        $startTime = $booking->first_session_start_time instanceof \Carbon\Carbon
            ? $booking->first_session_start_time->format('H:i:s')
            : (strlen($booking->first_session_start_time) > 8
                ? Carbon::parse($booking->first_session_start_time)->format('H:i:s')
                : $booking->first_session_start_time);

        $debugString = "date: " . var_export($date, true) . ", startTime: " . var_export($startTime, true);

        try {
            $firstSessionDateTime = Carbon::parse($date . ' ' . $startTime);
        } catch (\Exception $e) {
            // Log or return the debug info
            throw new \Exception('Failed to parse session datetime. Debug: ' . $debugString . ' Error: ' . $e->getMessage());
        }

        // Guard course access — service bookings may not have courses
        $courseData = null;
        if ($booking->course) {
            $courseData = [
                'id' => $booking->course->id,
                'name' => $booking->course->name ?? null,
                'education_level' => $booking->course->educationLevel->name_en ?? null,
                'class_level' => $booking->course->classLevel->name_en ?? null,
                'description' => $booking->course->description ?? null,
            ];
        }

        $bookingDetails = [
            'id' => $booking->id,
            'reference' => $booking->booking_reference,
            'status' => $booking->status,
            'booking_date' => $booking->booking_date->format('Y-m-d H:i'),
            
            'teacher' => [
                'id' => $booking->teacher->id,
                'name' => $booking->teacher->first_name.' '.$booking->teacher->last_name,
                'avatar' => $booking->teacher->getProfilePhotoPathAttribute ?? null,
                'gender' => $booking->teacher->profile->gender ?? null,
                'nationality' => $booking->teacher->profile->nationality ?? null,
                'phone' => $booking->status === 'confirmed' ? $booking->teacher->phone : null,
                'email' => $booking->status === 'confirmed' ? $booking->teacher->email : null,
            ],
            
            'course' => $courseData,
            
            'session_info' => [
                'type' => $booking->session_type,
                'total_sessions' => $booking->sessions_count,
                'completed_sessions' => $booking->sessions_completed,
                'remaining_sessions' => $booking->sessions_count - $booking->sessions_completed,
                'session_duration' => $booking->session_duration,
                'first_session_date' => $booking->first_session_date,
                'first_session_start_time' => $booking->first_session_start_time,
                'first_session_end_time' => $booking->first_session_end_time,
            ],
            
            'pricing' => [
                'price_per_session' => $booking->price_per_session,
                'subtotal' => $booking->subtotal,
                'discount_percentage' => $booking->discount_percentage,
                'discount_amount' => $booking->discount_amount,
                'total_amount' => $booking->total_amount,
                'currency' => $booking->currency,
            ],
            
            'payment' => $booking->payment ? [
                'id' => $booking->payment->id,
                'status' => $booking->payment->status,
                'method' => $booking->payment->payment_method,
                'transaction_reference' => $booking->payment->transaction_reference,
                'paid_at' => $booking->payment->paid_at?->format('Y-m-d H:i'),
            ] : null,
            
            'sessions' => $booking->sessions->map(function ($session) {
                return [
                    'id' => $session->id,
                    'session_number' => $session->session_number,
                    'session_date' => $session->session_date,
                    'start_time' => $session->start_time,
                    'end_time' => $session->end_time,
                    'status' => $session->status,
                    'join_url' => $session->join_url,
                    'notes' => $session->teacher_notes,
                    'homework' => $session->homework,
                ];
            }),
            
            'special_requests' => $booking->special_requests,
            'cancellation_reason' => $booking->cancellation_reason,
            'cancelled_at' => $booking->cancelled_at?->format('Y-m-d H:i'),
            
            'actions' => [
                'can_cancel' => $this->canCancelBooking($booking),
                'can_reschedule' => $this->canRescheduleBooking($booking),
                'can_review' => $this->canReviewBooking($booking),
                'can_join_session' => $this->canJoinSession($booking),
            ]
        ];

        return response()->json([
            'success' => true,
            'data' => $bookingDetails
        ]);
    }

    /**
     * Cancel a booking
     */
    /**
     * @OA\Put(
     *     path="/api/student/booking/{bookingId}/cancel",
     *     summary="Cancel a booking",
     *     tags={"Booking"},
     *     @OA\Parameter(name="bookingId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Booking cancelled")
     * )
     */
    public function cancelBooking($bookingId): JsonResponse
    {
        $studentId = auth()->id();
        
        $booking = Booking::where('student_id', $studentId)
                         ->findOrFail($bookingId);

        if (!$this->canCancelBooking($booking)) {
            return response()->json([
                'success' => false,
                'message' => 'This booking cannot be cancelled'
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Calculate refund amount based on cancellation policy
            $refundInfo = $this->calculateRefund($booking);
            
            // Update booking status
            $booking->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancellation_reason' => 'Cancelled by student',
                'refund_amount' => $refundInfo['refund_amount'],
                'refund_percentage' => $refundInfo['refund_percentage'],
            ]);

            // Free up the availability slot
            AvailabilitySlot::where('booking_id', $booking->id)
                           ->update([
                               'is_booked' => false,
                               'booking_id' => null
                           ]);

            // Process refund if applicable
            if ($refundInfo['refund_amount'] > 0) {
                $this->processRefund($booking, $refundInfo['refund_amount']);
            }

            // Cancel future sessions
            $booking->sessions()
                   ->where('status', 'scheduled')
                   ->update(['status' => 'cancelled']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Booking cancelled successfully',
                'data' => [
                    'refund_amount' => $refundInfo['refund_amount'],
                    'refund_percentage' => $refundInfo['refund_percentage'],
                    'processing_time' => '3-5 business days',
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel booking',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper methods
     */
    private function generateBookingReference(): string
    {
        return 'BK' . now()->format('Ymd') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    private function generateTransactionReference(): string
    {
        return 'TXN' . now()->format('YmdHis') . rand(1000, 9999);
    }

    private function calculatePackageDiscount(int $sessionsCount): float
    {
        if ($sessionsCount >= 20) return 20; // 20% discount for 20+ sessions
        if ($sessionsCount >= 10) return 15; // 15% discount for 10+ sessions
        if ($sessionsCount >= 5) return 10;  // 10% discount for 5+ sessions
        return 0;
    }

    private function processPayment($payment, $paymentMethod): string
    {
        // Integrate with your payment gateway (e.g., Stripe, PayPal, local Saudi gateways)
        // This is a placeholder - implement actual payment processing
        
        switch ($paymentMethod) {
            case 'card':
                return 'https://payment-gateway.com/pay/' . $payment->transaction_reference;
            case 'wallet':
                return 'https://wallet-service.com/pay/' . $payment->transaction_reference;
            case 'bank_transfer':
                return 'https://bank-transfer.com/pay/' . $payment->transaction_reference;
            default:
                return '';
        }
    }

    private function getNextSessionDate($booking)
    {
        if ($booking->session_type === 'single') {
            return $booking->first_session_date;
        }

        $nextSession = $booking->sessions()
                             ->where('status', 'scheduled')
                             ->where('session_date', '>=', now()->format('Y-m-d'))
                             ->orderBy('session_date')
                             ->first();

        return $nextSession ? $nextSession->session_date : null;
    }

    private function canCancelBooking($booking): bool
    {
        if (in_array($booking->status, ['cancelled', 'completed'])) {
            return false;
        }

        // Fix: Extract date and time correctly
        $date = $booking->first_session_date instanceof \Carbon\Carbon
            ? $booking->first_session_date->format('Y-m-d')
            : substr($booking->first_session_date, 0, 10);

        $startTime = $booking->first_session_start_time instanceof \Carbon\Carbon
            ? $booking->first_session_start_time->format('H:i:s')
            : (strlen($booking->first_session_start_time) > 8
                ? Carbon::parse($booking->first_session_start_time)->format('H:i:s')
                : $booking->first_session_start_time);

        $firstSessionDateTime = Carbon::parse($date . ' ' . $startTime);
        return $firstSessionDateTime->subHours(24)->isFuture();
    }

    private function canRescheduleBooking($booking): bool
    {
        if (in_array($booking->status, ['cancelled', 'completed'])) {
            return false;
        }

        $date = $booking->first_session_date instanceof \Carbon\Carbon
            ? $booking->first_session_date->format('Y-m-d')
            : substr($booking->first_session_date, 0, 10);

        $startTime = $booking->first_session_start_time instanceof \Carbon\Carbon
            ? $booking->first_session_start_time->format('H:i:s')
            : (strlen($booking->first_session_start_time) > 8
                ? Carbon::parse($booking->first_session_start_time)->format('H:i:s')
                : $booking->first_session_start_time);

        $firstSessionDateTime = Carbon::parse($date . ' ' . $startTime);
        return $firstSessionDateTime->subHours(4)->isFuture();
    }

    private function canReviewBooking($booking): bool
    {
        return $booking->status === 'completed' && $booking->sessions_completed > 0;
    }

    private function canJoinSession($booking): bool
    {
        if ($booking->status !== 'confirmed') {
            return false;
        }

        $now = now();

        $date = $booking->first_session_date instanceof \Carbon\Carbon
            ? $booking->first_session_date->format('Y-m-d')
            : substr($booking->first_session_date, 0, 10);

        $startTime = $booking->first_session_start_time instanceof \Carbon\Carbon
            ? $booking->first_session_start_time->format('H:i:s')
            : (strlen($booking->first_session_start_time) > 8
                ? Carbon::parse($booking->first_session_start_time)->format('H:i:s')
                : $booking->first_session_start_time);

        $endTime = $booking->first_session_end_time instanceof \Carbon\Carbon
            ? $booking->first_session_end_time->format('H:i:s')
            : (strlen($booking->first_session_end_time) > 8
                ? Carbon::parse($booking->first_session_end_time)->format('H:i:s')
                : $booking->first_session_end_time);

        $firstSessionDateTime = Carbon::parse($date . ' ' . $startTime);
        $sessionEndTime = Carbon::parse($date . ' ' . $endTime);

        // Allow joining 15 minutes before session starts until session ends
        return $now->between($firstSessionDateTime->subMinutes(15), $sessionEndTime);
    }

    private function calculateRefund($booking): array
    {
        $firstSessionDateTime = Carbon::parse($booking->first_session_date . ' ' . $booking->first_session_start_time);
        $hoursUntilSession = now()->diffInHours($firstSessionDateTime);

        // Refund policy based on cancellation time
        if ($hoursUntilSession >= 48) {
            $refundPercentage = 100; // Full refund
        } elseif ($hoursUntilSession >= 24) {
            $refundPercentage = 80; // 80% refund
        } elseif ($hoursUntilSession >= 4) {
            $refundPercentage = 50; // 50% refund
        } else {
            $refundPercentage = 0; // No refund
        }

        $refundAmount = ($booking->total_amount * $refundPercentage) / 100;

        return [
            'refund_percentage' => $refundPercentage,
            'refund_amount' => $refundAmount,
        ];
    }

    private function processRefund($booking, $refundAmount): void
    {
        // Implement refund processing logic
        // This would integrate with your payment gateway's refund API
        
        // Create refund record
        $booking->payment->update([
            'refund_amount' => $refundAmount,
            'refund_status' => 'processing',
            'refund_processed_at' => now(),
        ]);
    }

    private function getDayName(?int $dayNumber): string
    {
        $dayNames = [
            0 => 'Sunday',
            1 => 'Monday',
            2 => 'Tuesday',
            3 => 'Wednesday',
            4 => 'Thursday',
            5 => 'Friday',
            6 => 'Saturday',
        ];
        return $dayNames[$dayNumber] ?? 'Unknown';
    }

    private function extractTimeOnly($timeValue): string
    {
        // Handle full datetime strings (e.g., "2025-11-22 19:00:00") and extract only H:i:s
        if ($timeValue instanceof \Carbon\Carbon) {
            return $timeValue->format('H:i:s');
        }
        
        $timeStr = (string) $timeValue;
        
        // If already in H:i:s format (8 chars), return as-is
        if (strlen($timeStr) === 8 && preg_match('/^\d{2}:\d{2}:\d{2}$/', $timeStr)) {
            return $timeStr;
        }
        
        // If it's a full datetime string, extract the time part
        if (strpos($timeStr, ' ') !== false) {
            $parts = explode(' ', $timeStr);
            return end($parts); // Get the last part (time)
        }
        
        // Fallback: assume it's already valid or try to parse and reformat
        try {
            return Carbon::parse($timeStr)->format('H:i:s');
        } catch (\Exception $e) {
            return '00:00:00';
        }
    }

    private function getFullTeacherData($teacher)
    {
        // Delegate to UserController's implementation
        $userController = new UserController();
        return $userController->getFullTeacherData($teacher);
    }
// 9D02BF634C31F60C56E1B4CDE112D0E4.uat01-vm-tx04
    public function handlePaymentCallback(Request $request): JsonResponse
    {
        // HyperPay can call back with either `id` (checkout id) or `resourcePath`.
        // Accept both and derive a checkout id when needed.
        $checkoutId = $request->query('id');
        $resourcePath = $request->query('resourcePath');

        if (!$checkoutId && $resourcePath) {
            // resourcePath looks like: /v1/checkouts/{checkoutId}
            $parts = explode('/', trim($resourcePath, '/'));
            $checkoutId = end($parts);
        }

        if (!$checkoutId) {
            return response()->json(['success' => false, 'message' => 'Missing checkout ID or resourcePath'], 400);
        }

        Log::info('Payment callback received', ['checkout_id' => $checkoutId, 'resourcePath' => $resourcePath]);

        // Get payment status from HyperPay (using checkout id)
        $hyperpayService = app(\App\Services\HyperpayService::class);
        try {
            $statusResponse = $hyperpayService->getPaymentStatus($checkoutId);
            $statusData = $statusResponse->json();
        } catch (\Exception $e) {
            Log::error('Failed to fetch payment status from HyperPay', ['checkout_id' => $checkoutId, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to fetch status from gateway'], 500);
        }

        // Log full status for debugging - helpful when HyperPay returns nested fields
        Log::debug('HyperPay callback status data', ['checkout_id' => $checkoutId, 'status' => $statusData]);

        // Try several places where transaction reference might exist
        $merchantTxnId = $statusData['merchantTransactionId'] ?? null;
        // some HyperPay responses may nest things differently - try common fallbacks
        if (!$merchantTxnId) {
            if (isset($statusData['transaction']) && is_array($statusData['transaction'])) {
                $merchantTxnId = $statusData['transaction']['merchantTransactionId'] ?? null;
            }
            if (!$merchantTxnId && isset($statusData['result']['merchantTransactionId'])) {
                $merchantTxnId = $statusData['result']['merchantTransactionId'];
            }
        }

        // Attempt to locate the Payment record using multiple strategies
        $payment = null;

        // 1) If HyperPay returns merchantTransactionId (merchant provided id), match transaction_reference
        if ($merchantTxnId) {
            $payment = Payment::where('transaction_reference', $merchantTxnId)->first();
        }

        // 2) If status payload includes an 'id' (checkout id) match gateway_reference
        if (!$payment && isset($statusData['id'])) {
            $payment = Payment::where('gateway_reference', $statusData['id'])->first();
        }

        // 3) fallback: match gateway_reference with the derived checkoutId
        if (!$payment) {
            $payment = Payment::where('gateway_reference', $checkoutId)->first();
        }

        // 4) last resort: maybe the checkout id was stored in transaction_reference (unlikely but safe)
        if (!$payment) {
            $payment = Payment::where('transaction_reference', $checkoutId)->first();
        }

        if (!$payment) {
            Log::error('Payment not found for callback', ['checkout_id' => $checkoutId, 'statusData' => $statusData]);
            return response()->json(['success' => false, 'message' => 'Cannot find transaction reference in response'], 404);
        }

        // Determine result code (try multiple common locations)
        $resultCode = $statusData['result']['code'] ?? $statusData['paymentResult']['code'] ?? '';

        // Successful result codes (pattern used elsewhere in controller)
        if (preg_match('/^(000\.000\.|000\.100\.1|000\.[36])/', $resultCode)) {
            // SUCCESS
            $payment->update([
                'status' => 'paid',
                'paid_at' => now(),
                'gateway_response' => json_encode($statusData),
            ]);

            $booking = $payment->booking;
            if ($booking) {
                $booking->update(['status' => Booking::STATUS_CONFIRMED]);
                Sessions::createForBooking($booking);
                $this->scheduleSessionMeetingJobs($booking);
            }

            Log::info('Payment confirmed via callback', ['payment_id' => $payment->id]);

            // Send notification
            try {
                $ns = new \App\Services\NotificationService();
                $title = app()->getLocale() == 'ar' ? 'تم الدفع بنجاح' : 'Payment successful';
                $msg = app()->getLocale() == 'ar'
                    ? "تم استلام دفعتك للحجز ({$booking->booking_reference}). شكراً."
                    : "Your payment for booking ({$booking->booking_reference}) was successful.";

                if ($booking && $booking->student) {
                    $ns->send($booking->student, 'payment_success', $title, $msg, [
                        'booking_id' => $booking->id,
                        'payment_id' => $payment->id,
                        'amount' => $booking->total_amount,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Notification failed', ['error' => $e->getMessage()]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment successful',
                'data' => [
                    'payment_id' => $payment->id,
                    'booking_id' => $booking?->id,
                    'status' => 'confirmed',
                ]
            ]);
        } else {
            // FAILED
            $payment->update([
                'status' => 'failed',
                'gateway_response' => json_encode($statusData),
            ]);

            Log::warning('Payment failed via callback', [
                'payment_id' => $payment->id,
                'result_code' => $resultCode,
                'statusData' => $statusData,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment failed',
                'error_code' => $resultCode,
            ], 400);
        }
    }

/**
 * Check payment status
 * GET /api/payments/{paymentId}/status
 */
public function checkPaymentStatus($paymentId): JsonResponse
{
    try {
        $payment = Payment::with('booking')->findOrFail($paymentId);
        
        // If payment is still pending, fetch latest status from HyperPay
        if ($payment->status === 'pending' && $payment->gateway_reference) {
            $hyperpayService = app(\App\Services\HyperpayService::class);
            $statusResponse = $hyperpayService->getPaymentStatus($payment->gateway_reference);
            $statusData = $statusResponse->json();
            
            $resultCode = $statusData['result']['code'] ?? '';
            
            // Check if now succeeded
            if (preg_match('/^(000\.000\.|000\.100\.1|000\.[36])/', $resultCode)) {
                $payment->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                    'gateway_response' => json_encode($statusData),
                ]);
                
                $booking = $payment->booking;
                $booking->update(['status' => Booking::STATUS_CONFIRMED]);
                Sessions::createForBooking($booking);
                $this->scheduleSessionMeetingJobs($booking);
            }
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'payment_id' => $payment->id,
                'status' => $payment->status,
                'booking_status' => $payment->booking->status,
                'amount' => $payment->amount,
                'paid_at' => $payment->paid_at,
            ]
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Payment not found'
        ], 404);
    }
}

}

