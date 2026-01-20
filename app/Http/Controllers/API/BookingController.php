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
use Illuminate\Support\Facades\App;

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

            // ✅ IMPORTANT: DO NOT mark slot as booked yet!
            // Slot will only be marked as booked after payment is confirmed
            // This prevents blocking slots when users create bookings but don't pay
            // 
            // Instead, we mark it as "reserved" with booking_id and optional expiry time
            // - is_available: true (still queryable)
            // - is_booked: false (not yet confirmed)
            // - booking_id: set to track tentative booking
            // - reserved_until: optional expiry (15 min from now)
            
            $slot->update([
                'is_available' => true,  // Still available for queries
                'is_booked' => false,    // Not yet booked (payment pending)
                'booking_id' => $booking->id,  // Track which booking is attempting this slot
                'reserved_until' => now()->addMinutes(15),  // Release slot in 15 min if payment doesn't complete
            ]);

            Log::info('Slot reserved (not booked) pending payment', [
                'slot_id' => $slot->id,
                'booking_id' => $booking->id,
                'status' => 'pending_payment',
                'reserved_until' => $slot->start_time->format('H:i:s'),
            ]);

            // Create sessions skeleton (status = pending_payment)
            
            try {
                Sessions::createForBooking($booking);
                Log::info('Sessions created successfully', ['booking_id' => $booking->id]);
            } catch (\Exception $e) {
                Log::error('Sessions::createForBooking failed', [
                    'booking_id' => $booking->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                throw $e; // Re-throw to trigger rollback
            }

            // No payment processing here — booking is created, user will pay via a separate endpoint
            DB::commit();
            Log::info('Transaction committed successfully', ['booking_id' => $booking->id]);

            // Let frontend know whether student has saved payment methods
            $hasSavedMethods = \App\Models\UserPaymentMethod::where('user_id', $studentId)->exists();

            // Load teacher with full data
            $teacher = \App\Models\User::findOrFail($teacherId);
            $UserController = App::make(\App\Http\Controllers\API\UserController::class);
            $teacherData = $UserController->getFullTeacherData($teacher);

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
     * ========================================================================
     * PAYMENT METHODS REMOVED - Now handled by PaymentController with Moyasar
     * ========================================================================
     *
     * DEPRECATED METHODS (removed in v2.0):
     * - paymentCallback() - HyperPay callback handler
     * - payBooking() - HyperPay direct payment with card details
     *
     * WHY REMOVED:
     * ✅ PCI-DSS Compliance: No card details accepted at backend
     * ✅ Moyasar exclusive: HyperPay integration removed completely
     * ✅ Separation of concerns: BookingController only manages bookings
     *
     * NEW PAYMENT FLOW (Moyasar):
     * 1. POST /api/student/booking - Create booking (BookingController)
     *    Returns: booking_id, status = pending_payment
     *
     * 2. POST /api/payments/checkout - Initiate payment (PaymentController)
     *    Input: booking_id, amount, saved_card_id (optional)
     *    Returns: checkout_id for payment widget
     *
     * 3. Customer completes payment in Moyasar widget
     *
     * 4. POST /api/moyasar/payments/callback - Moyasar webhook
     *    Moyasar calls us with payment confirmation
     *    Automatically creates sessions and generates Agora tokens
     *
     * 5. GET /api/bookings/{id} - Poll booking status
     *    Returns: status = confirmed, sessions with agora_token
     *
     * FILES INVOLVED:
     * - app/Http/Controllers/API/BookingController.php → Booking logic only
     * - app/Http/Controllers/API/PaymentController.php → All payment operations
     * - app/Services/MoyasarPay.php → Moyasar API integration
     * - routes/api.php → Updated routing
     *
     * MIGRATION CHECKLIST:
     * ✅ Removed HyperPay methods from BookingController
     * ✅ PaymentController handles Moyasar payments
     * ✅ MoyasarPay service with proper amount handling (* 100)
     * ✅ Callback creates sessions automatically
     * ======================================================================*/

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
    // ========================================================================
    // CONFIRM BOOKING AFTER PAYMENT
    // ========================================================================

    /**
     * Confirm a booking after successful payment
     * 
     * Called INTERNALLY by PaymentController and MoyasarPaymentController
     * when payment is confirmed. This is NOT a public API endpoint.
     *
     * Flow:
     * 1. Payment confirmed by Moyasar
     * 2. PaymentController calls this method
     * 3. Booking status → confirmed
     * 4. Sessions status → scheduled
     * 5. Slot marked as booked ✅ (ONLY NOW)
     * 6. Agora tokens generated
     * 7. Notifications sent
     *
     * @param Booking $booking
     * @return void
     * @throws Exception
     */
    public function confirmBooking(Booking $booking): void
    {
        DB::beginTransaction();
        try {
            // Step 1: Update booking status to confirmed
            $booking->update(['status' => Booking::STATUS_CONFIRMED]);

            // Step 2: Update all sessions to scheduled (ready for lesson)
            $booking->sessions()->update(['status' => Sessions::STATUS_SCHEDULED]);

            // Step 3: ✅ NOW mark the slot as truly booked (after payment confirmed)
            if ($booking->sessions()->count() > 0) {
                $session = $booking->sessions()->first();
                
                // Find the original slot - try multiple ways to locate it
                $slot = null;
                if ($session->availability_slot_id) {
                    $slot = AvailabilitySlot::find($session->availability_slot_id);
                }
                if (!$slot && $booking->availability_slot_id) {
                    $slot = AvailabilitySlot::find($booking->availability_slot_id);
                }

                if ($slot) {
                    // Confirm the slot as booked
                    $slot->update([
                        'is_available' => false,  // No longer available
                        'is_booked' => true,      // Confirmed booked
                        'booking_id' => $booking->id,
                        'reserved_until' => null,  // Clear reservation expiry
                    ]);

                    Log::info('Slot confirmed as booked after payment', [
                        'slot_id' => $slot->id,
                        'booking_id' => $booking->id,
                        'booking_status' => $booking->status,
                    ]);
                }
            }

            // Step 4: Generate Agora tokens for all sessions
            foreach ($booking->sessions as $session) {
                try {
                    // Generate RTC token for this session
                    $agora = new \App\Services\AgoraService();
                    $channelName = 'session-' . $session->id;
                    
                    // Generate token for student
                    $tokenResult = $agora->generateRtcToken(
                        $channelName,
                        (string)$booking->student_id,
                        \App\Agora\RtcTokenBuilder::RoleSubscriber
                    );
                    
                    if ($tokenResult && isset($tokenResult['token'])) {
                        $session->update([
                            'agora_token' => $tokenResult['token'],
                            'agora_channel' => $channelName,
                        ]);

                        Log::info('Agora token generated for session', [
                            'session_id' => $session->id,
                            'channel' => $channelName,
                            'user_id' => $booking->student_id,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to generate Agora token', [
                        'session_id' => $session->id,
                        'error' => $e->getMessage(),
                    ]);
                    // Don't fail the whole confirmation if token generation fails
                    // Student can still access session without token if needed
                }
            }

            // Step 5: Send notifications
            $this->sendBookingConfirmedNotifications($booking);

            DB::commit();

            Log::info('Booking confirmed successfully after payment', [
                'booking_id' => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'student_id' => $booking->student_id,
                'sessions_count' => $booking->sessions()->count(),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to confirm booking after payment', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Send notifications to student and teacher after booking is confirmed
     * 
     * @param Booking $booking
     * @return void
     */
    private function sendBookingConfirmedNotifications(Booking $booking): void
    {
        try {
            $ns = new \App\Services\NotificationService();

            // Prepare booking details for notification
            $bookingDetails = [
                'booking_id' => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'first_session_date' => $booking->first_session_date?->format('Y-m-d'),
                'first_session_time' => $booking->first_session_start_time,
                'total_amount' => $booking->total_amount,
                'currency' => $booking->currency,
            ];

            // Student notification
            $studentTitle = app()->getLocale() == 'ar' ? 'تم تأكيد الحجز' : 'Booking Confirmed';
            $studentMsg = app()->getLocale() == 'ar'
                ? "تم تأكيد حجزك ({$booking->booking_reference}). سيبدأ في {$booking->first_session_date?->format('d/m/Y')} الساعة {$booking->first_session_start_time}."
                : "Your booking ({$booking->booking_reference}) is confirmed. Starting {$booking->first_session_date?->format('m/d/Y')} at {$booking->first_session_start_time}.";

            $ns->send($booking->student, 'booking_confirmed', $studentTitle, $studentMsg, $bookingDetails);

            // Teacher notification
            $teacherTitle = app()->getLocale() == 'ar' ? 'حجز جديد مؤكد' : 'New Booking Confirmed';
            $teacherMsg = app()->getLocale() == 'ar'
                ? "لديك حجز جديد من {$booking->student->name} ({$booking->booking_reference})."
                : "You have a new confirmed booking from {$booking->student->name} ({$booking->booking_reference}).";

            $ns->send($booking->teacher, 'new_booking', $teacherTitle, $teacherMsg, [
                'booking_id' => $booking->id,
                'student_id' => $booking->student_id,
                'student_name' => $booking->student->name,
                'booking_reference' => $booking->booking_reference,
            ]);

            Log::info('Booking confirmation notifications sent', ['booking_id' => $booking->id]);

        } catch (\Exception $e) {
            Log::error('Failed to send booking confirmation notifications', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
            ]);
            // Don't throw - notification failure shouldn't break confirmation
        }
    }

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
            'course.subject',
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
            $UserController = App::make(\App\Http\Controllers\API\UserController::class);
            $teacherData = $UserController->getFullTeacherData($booking->teacher);

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
        return 'TXN' . now()->format('YmdHis') . rand(100000, 999999);
    }

    private function calculatePackageDiscount(int $sessionsCount): float
    {
        if ($sessionsCount >= 20) return 20; // 20% discount for 20+ sessions
        if ($sessionsCount >= 10) return 15; // 15% discount for 10+ sessions
        if ($sessionsCount >= 5) return 10;  // 10% discount for 5+ sessions
        return 0;
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

   


}

