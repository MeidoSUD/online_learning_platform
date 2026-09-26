<?php

namespace App\Services\Booking;

use App\Models\Booking;
use App\Models\Course;
use App\Models\AvailabilitySlot;
use App\Models\PlatformPercentage;
use App\Models\Sessions;
use App\Models\Subject;
use App\Models\User;
use App\Models\TeacherInfo;
use App\Models\UserPaymentMethod;
use App\Models\Services;
use App\Helpers\PackageBookingHelper;
use App\Traits\ActivityRecorder;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BookingService
{
    use ActivityRecorder;

    protected BookingValidationService $validationService;

    public function __construct(BookingValidationService $validationService)
    {
        $this->validationService = $validationService;
    }

    /**
     * Create a new booking (Unified for Courses, Services, and Packages).
     *
     * @param Request $request
     * @param int $studentId
     * @return array ['success' => bool, 'status_code' => int, 'data' => mixed, 'message' => string]
     */
    public function createBooking(Request $request, int $studentId): array
    {
        $isCourse = $request->filled('course_id');
        $isService = $request->filled('service_id');
        $isPackageBooking = $request->filled('subscription_id') && $request->filled('timeslot_ids');

        if (!$isCourse && !$isService) {
            return [
                'success' => false,
                'status_code' => 422,
                'message' => 'Either course_id or service_id is required',
            ];
        }

        $service_id = $request->service_id ?? 0;
        $course = null;

        DB::beginTransaction();
        try {
            $subscription = null;
            $slots = [];

            // ── 1. Package booking from subscription: validate subscription + lock slots ──
            if ($isPackageBooking) {
                $subscription = PackageBookingHelper::validateSubscription(
                    $studentId,
                    (int) $request->subscription_id,
                    count($request->timeslot_ids)
                );
                $slots = PackageBookingHelper::validateAndLockSlots(
                    $request->timeslot_ids,
                    (int) $request->teacher_id
                );
                $slot = $slots[0];
            }

            // ── 2. Course / Service slot logic ──
            if (!$isPackageBooking) {
                if ($isCourse) {
                    $course = Course::with('teacher')->findOrFail($request->course_id);
                    $slotId = $request->availability_slot_id;
                    $slot = AvailabilitySlot::where('id', $slotId)->lockForUpdate()->firstOrFail();

                    $service_id = $course->service_id;

                    $reasons = [];
                    if (!$slot->is_available)
                        $reasons[] = 'slot_not_available';
                    if ($slot->is_booked)
                        $reasons[] = 'slot_already_booked';
                    if ($slot->teacher_id !== $course->teacher_id)
                        $reasons[] = 'slot_teacher_mismatch';
                    if ($slot->course_id !== $course->id)
                        $reasons[] = 'slot_course_mismatch';

                    if (count($reasons) > 0) {
                        DB::rollBack();
                        return [
                            'success' => false,
                            'status_code' => 400,
                            'message' => 'Cannot book unavailable slot',
                            'reasons' => $reasons,
                            'slot' => [
                                'id' => $slot->id,
                                'is_available' => (bool) $slot->is_available,
                                'is_booked' => (bool) $slot->is_booked,
                                'teacher_id' => $slot->teacher_id,
                                'course_id' => $slot->course_id,
                            ],
                        ];
                    }

                    $teacherId = $course->teacher_id;
                    $sessionDuration = $course->session_duration ?? ($slot->duration ?? 60);
                    $basePrice = $course->price_per_hour ?? 0;
                    $currency = $course->currency ?? 'SAR';
                } else {
                    $teacherId = $request->teacher_id;

                    $allSlotIds = [];
                    if ($request->filled('timeslot_ids')) {
                        $allSlotIds = $request->timeslot_ids;
                    } elseif ($request->filled('timeslot_id')) {
                        $allSlotIds = [$request->timeslot_id];
                    }

                    if (empty($allSlotIds)) {
                        DB::rollBack();
                        return [
                            'success' => false,
                            'status_code' => 422,
                            'message' => 'timeslot_id or timeslot_ids is required',
                        ];
                    }

                    foreach ($allSlotIds as $sid) {
                        $s = AvailabilitySlot::where('id', $sid)->lockForUpdate()->first();
                        if (!$s) {
                            DB::rollBack();
                            return [
                                'success' => false,
                                'status_code' => 404,
                                'message' => "Slot #{$sid} not found",
                            ];
                        }
                        $reasons = [];
                        if (!PackageBookingHelper::isSlotBookable($s))
                            $reasons[] = 'slot_not_available';
                        if ($s->teacher_id != $teacherId)
                            $reasons[] = 'slot_teacher_mismatch';
                        if (count($reasons) > 0) {
                            DB::rollBack();
                            return [
                                'success' => false,
                                'status_code' => 400,
                                'message' => "Cannot book slot #{$sid}",
                                'reasons' => $reasons,
                                'slot' => [
                                    'id' => $s->id,
                                    'is_available' => (bool) $s->is_available,
                                    'is_booked' => (bool) $s->is_booked,
                                    'teacher_id' => $s->teacher_id,
                                ],
                            ];
                        }
                        $slots[] = $s;
                    }

                    $slot = $slots[0];

                    $teacherInfo = TeacherInfo::where('teacher_id', $teacherId)->first();
                    $sessionDuration = $slot->duration ?? 60;
                    $basePrice = ($request->type === 'single') ? ($teacherInfo->individual_hour_price ?? 0) : ($teacherInfo->group_hour_price ?? 0);
                    $currency = 'SAR';
                }
            } else {
                $teacherId = (int) $request->teacher_id;
                $sessionDuration = $slot->duration ?? 60;
                $basePrice = 0;
                $currency = 'SAR';
            }

            // ── 3. Resolve the closest future occurrence(s) that are conflict-free ──
            $sessionsCountInput = $request->total_sessions ?? $request->sessions_count;
            $sessionsCount = max(1, (int) ($sessionsCountInput ?? 1));
            $sessionType = $sessionsCount > 1 ? 'package' : $request->type;
            $candidateSessionsList = [];

            if (!empty($slots) && count($slots) > 1) {
                foreach ($slots as $selectedSlot) {
                    $slotSessionsCount = max(1, (int) data_get($request->sessions_per_slot, $selectedSlot->id, 1));
                    $availability = $this->validationService->getNextBookableSessions($selectedSlot, $studentId, $slotSessionsCount);
                    if (!$availability['can_book']) {
                        DB::rollBack();
                        return [
                            'success' => false,
                            'status_code' => 422,
                            'message' => $availability['reason'],
                            'message_ar' => $availability['reason_ar'],
                            'error_code' => $availability['conflict_type'] === 'student' ? 'STUDENT_SESSION_CONFLICT' : 'TIMESLOT_UNAVAILABLE',
                        ];
                    }
                    foreach ($availability['sessions'] as $session) {
                        $candidateSessionsList[] = [
                            'date' => $session['session_date'],
                            'start_time' => $session['start_time'],
                            'end_time' => $session['end_time'],
                        ];
                    }
                }
            } else {
                $availability = $this->validationService->getNextBookableSessions($slot, $studentId, $sessionsCount);
                if (!$availability['can_book']) {
                    DB::rollBack();
                    return [
                        'success' => false,
                        'status_code' => 422,
                        'message' => $availability['reason'],
                        'message_ar' => $availability['reason_ar'],
                        'error_code' => $availability['conflict_type'] === 'student' ? 'STUDENT_SESSION_CONFLICT' : 'TIMESLOT_UNAVAILABLE',
                    ];
                }
                foreach ($availability['sessions'] as $session) {
                    $candidateSessionsList[] = [
                        'date' => $session['session_date'],
                        'start_time' => $session['start_time'],
                        'end_time' => $session['end_time'],
                    ];
                }
            }

            $slotDate = $candidateSessionsList[0]['date'] ?? PackageBookingHelper::resolveSlotDate($slot);
            $date = $slotDate;
            $startTime = $this->extractTimeOnly($slot->start_time);
            $endTime = $this->extractTimeOnly($slot->end_time);

            try {
                $slotDateTime = Carbon::parse($date . ' ' . $startTime);
                $slotEndDateTime = Carbon::parse($date . ' ' . $endTime);
            } catch (\Exception $e) {
                DB::rollBack();
                return [
                    'success' => false,
                    'status_code' => 500,
                    'message' => 'Failed to parse slot datetime',
                    'error' => $e->getMessage(),
                ];
            }

            // ── 5. Pricing calculations ──
            if ($isPackageBooking) {
                $packageTotalSessions = $subscription->total_sessions ?: $sessionsCount;
                $teacherRatePerSession = $packageTotalSessions > 0
                    ? round((float) $subscription->total_paid / $packageTotalSessions, 2)
                    : 0;
                $pricePerSession = 0;
                $platformPercentageValue = 0;
                $discount = 0;
                $subtotal = 0;
                $discountAmount = 0;
                $total = 0;
                $sessionType = Booking::TYPE_PACKAGE;
            } else {
                $platformPercentage = PlatformPercentage::getActive();
                $percentageValue = $platformPercentage ? ($platformPercentage->value / 100) : 0;
                $platformPercentageValue = $platformPercentage ? $platformPercentage->value : 0;

                $teacherRatePerSession = ($basePrice * ($sessionDuration ?? 60)) / 60;
                $pricePerSession = $teacherRatePerSession * (1 + $percentageValue);

                $discount = $sessionsCount > 1 ? $this->calculatePackageDiscount($sessionsCount) : 0;
                $subtotal = $pricePerSession * $sessionsCount;
                $discountAmount = $subtotal * ($discount / 100);
                $total = $subtotal - $discountAmount;
            }

            if ($request->subject_id && $request->subject_id > 0) {
                $subject = Subject::find($request->subject_id);
                if ($subject && $subject->service_id) {
                    $service_id = $subject->service_id;
                }
            }

            // ── 6. Create booking record ──
            $booking = Booking::create([
                'student_id' => $studentId,
                'teacher_id' => $teacherId,
                'availability_slot_id' => $slot->id,
                'service_id' => $service_id,
                'course_id' => $isCourse ? $course->id : null,
                'subject_id' => (!$isCourse && $request->subject_id && $request->subject_id > 0) ? $request->subject_id : null,
                'language_id' => !$isCourse && $request->filled('language_id') ? $request->language_id : null,
                'subscription_id' => $isPackageBooking ? (int) $request->subscription_id : null,
                'booking_reference' => $this->generateBookingReference(),
                'session_type' => $sessionType,
                'sessions_count' => $sessionsCount,
                'sessions_completed' => 0,
                'first_session_date' => $slotDateTime,
                'first_session_start_time' => $slotDateTime->format('H:i:s'),
                'first_session_end_time' => $slotEndDateTime->format('H:i:s'),
                'session_duration' => $sessionDuration,
                'teacher_rate_per_session' => $teacherRatePerSession,
                'platform_percentage' => $platformPercentageValue ?? 0,
                'price_per_session' => $pricePerSession,
                'subtotal' => $subtotal,
                'discount_percentage' => $discount,
                'discount_amount' => $discountAmount,
                'total_amount' => $total,
                'currency' => $currency,
                'special_requests' => $request->special_requests,
                'status' => $isPackageBooking ? Booking::STATUS_CONFIRMED : Booking::STATUS_PENDING_PAYMENT,
                'booking_date' => now(),
                'sessions_per_slot' => $request->sessions_per_slot,
            ]);

            $this->recordActivity('Booking Created', [
                'booking_id' => $booking->id,
                'service_id' => $service_id,
                'subject_id' => $request->subject_id,
                'teacher_id' => $booking->teacher_id,
                'user_id' => $studentId,
                'language_id' => $booking->language_id,
                'course_id' => $booking->course_id,
                'session_type' => $booking->session_type,
                'sessions_count' => $booking->sessions_count,
                'student_id' => $booking->student_id,
                'total_amount' => $booking->total_amount,
                'status' => $booking->status,
            ]);

            // ── 7. Package booking: attach slots, deduct subscription, create sessions ──
            if ($isPackageBooking) {
                PackageBookingHelper::attachSlotsToBooking($slots, $booking);
                PackageBookingHelper::deductSubscriptionSessions($subscription, $sessionsCount);
                PackageBookingHelper::markSlotsAsBooked($slots, $booking->id);

                Sessions::createForBooking($booking, $request->sessions_per_slot);
                $booking->refresh();
                $booking->createMeetingsForSessions();

                \App\Helpers\Helpers::getPendingBalance($booking->teacher_id);

                $ns = new \App\Services\NotificationService();
                $booking->loadMissing(['student', 'teacher']);

                $firstSessionDateStr = $booking->first_session_date;
                $firstSessionTimeStr = $booking->first_session_start_time;
                if ($firstSessionDateStr instanceof \DateTime) {
                    $firstSessionDateStr = $firstSessionDateStr->format('Y-m-d');
                }
                if ($firstSessionTimeStr instanceof \DateTime) {
                    $firstSessionTimeStr = $firstSessionTimeStr->format('H:i');
                }
                $firstSessionStart = Carbon::parse((string) $firstSessionDateStr . ' ' . (string) $firstSessionTimeStr)->format('Y-m-d H:i');

                $msgStudent = app()->getLocale() == 'ar'
                    ? "نجاح! لقد حجزت {$booking->sessions_count} جلسات. تبدأ جلستك الأولى في {$firstSessionStart}."
                    : "Success! You have booked {$booking->sessions_count} sessions. Your first session starts on {$firstSessionStart}.";

                if ($booking->student) {
                    $ns->send($booking->student, 'payment_success', 'Payment successful', $msgStudent, [
                        'booking_id' => $booking->id,
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
            }

            if (!$isCourse && !$isPackageBooking && count($slots) > 1) {
                $booking->availabilitySlots()->saveMany($slots);
            }

            DB::commit();

            // ── 8. Prepare full response payload ──
            $hasSavedMethods = UserPaymentMethod::where('user_id', $studentId)->exists();
            $teacher = $isCourse ? $course->teacher : User::find($teacherId);
            $teacherData = (new \App\Http\Controllers\API\UserController())->getFullTeacherData($teacher);

            $subjectData = null;
            if ($isCourse && $booking->course) {
                $subjectData = [
                    'id' => $booking->course->id,
                    'name' => $booking->course->name ?? null,
                    'name_en' => $booking->course->name ?? null,
                ];
            } elseif ($request->filled('subject_id') && $request->subject_id > 0) {
                $subject = Subject::find($request->subject_id);
                $subjectData = $subject ? [
                    'id' => $subject->id,
                    'name_en' => $subject->name_en,
                    'name_ar' => $subject->name_ar,
                ] : null;
            }

            $serviceData = null;
            $serviceModel = Services::find($service_id);
            if ($serviceModel) {
                $serviceData = [
                    'id' => $serviceModel->id,
                    'name' => $serviceModel->name,
                    'description' => $serviceModel->description ?? null,
                ];
            }

            $timeslotData = [
                'id' => $slot->id,
                'day_number' => $slot->day_number,
                'day_name' => $this->getDayName($slot->day_number ?? 0),
                'start_time' => $slot->start_time instanceof Carbon ? $slot->start_time->format('H:i:s') : $slot->start_time,
                'end_time' => $slot->end_time instanceof Carbon ? $slot->end_time->format('H:i:s') : $slot->end_time,
                'duration' => $slot->duration,
            ];

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
                'requires_payment_method' => $isPackageBooking ? false : !$hasSavedMethods,
                'meta' => [
                    'service' => $serviceData,
                    'subject' => $subjectData,
                    'timeslot' => $timeslotData,
                ],
            ];

            if ($isPackageBooking) {
                $responseData['sessions'] = $booking->sessions->map(function ($session) {
                    return [
                        'id' => $session->id,
                        'session_number' => $session->session_number,
                        'session_date' => $session->session_date,
                        'start_time' => $session->start_time,
                        'end_time' => $session->end_time,
                        'status' => $session->status,
                    ];
                });
                $responseData['subscription'] = [
                    'id' => $subscription->id,
                    'sessions_remaining' => $subscription->fresh()->sessions_remaining,
                ];
                $responseData['meta']['timeslots'] = array_map(function ($s) {
                    return [
                        'id' => $s->id,
                        'day_number' => $s->day_number,
                        'date' => $s->date,
                        'start_time' => $s->start_time instanceof Carbon ? $s->start_time->format('H:i:s') : $s->start_time,
                        'end_time' => $s->end_time instanceof Carbon ? $s->end_time->format('H:i:s') : $s->end_time,
                        'duration' => $s->duration,
                    ];
                }, $slots);
            }

            return [
                'success' => true,
                'status_code' => 200,
                'data' => $responseData,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Booking creation failed in BookingService', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return [
                'success' => false,
                'status_code' => 500,
                'message' => 'Failed to create booking',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Cancel a booking and process potential refund.
     */
    public function cancelBooking(int $bookingId, int $studentId): array
    {
        $booking = Booking::where('student_id', $studentId)->find($bookingId);
        if (!$booking) {
            return [
                'success' => false,
                'status_code' => 404,
                'message' => 'Booking not found',
            ];
        }

        if (!$this->canCancelBooking($booking)) {
            return [
                'success' => false,
                'status_code' => 400,
                'message' => 'This booking cannot be cancelled',
            ];
        }

        DB::beginTransaction();
        try {
            $refundInfo = $this->calculateRefund($booking);

            $booking->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancellation_reason' => 'Cancelled by student',
                'refund_amount' => $refundInfo['refund_amount'],
                'refund_percentage' => $refundInfo['refund_percentage'],
            ]);

            AvailabilitySlot::where('booking_id', $booking->id)
                ->update([
                    'is_booked' => false,
                    'booking_id' => null,
                ]);

            if ($refundInfo['refund_amount'] > 0 && $booking->payment) {
                $this->processRefund($booking, $refundInfo['refund_amount']);
            }

            $booking->sessions()
                ->where('status', 'scheduled')
                ->update(['status' => 'cancelled']);

            DB::commit();

            return [
                'success' => true,
                'status_code' => 200,
                'message' => 'Booking cancelled successfully',
                'data' => [
                    'refund_amount' => $refundInfo['refund_amount'],
                    'refund_percentage' => $refundInfo['refund_percentage'],
                    'processing_time' => '3-5 business days',
                ],
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Cancel booking failed', ['booking_id' => $bookingId, 'error' => $e->getMessage()]);
            return [
                'success' => false,
                'status_code' => 500,
                'message' => 'Failed to cancel booking',
                'error' => $e->getMessage(),
            ];
        }
    }

    public function generateBookingReference(): string
    {
        return 'BK' . now()->format('Ymd') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    public function generateTransactionReference(): string
    {
        return 'TXN' . now()->format('YmdHis') . rand(1000, 9999);
    }

    public function calculatePackageDiscount(int $sessionsCount): float
    {
        if ($sessionsCount >= 20) return 20;
        if ($sessionsCount >= 10) return 15;
        if ($sessionsCount >= 5) return 10;
        return 0;
    }

    public function canCancelBooking($booking): bool
    {
        if (in_array($booking->status, ['cancelled', 'completed'])) {
            return false;
        }

        $date = $booking->first_session_date instanceof Carbon
            ? $booking->first_session_date->format('Y-m-d')
            : substr($booking->first_session_date, 0, 10);

        $startTime = $booking->first_session_start_time instanceof Carbon
            ? $booking->first_session_start_time->format('H:i:s')
            : (strlen($booking->first_session_start_time) > 8
                ? Carbon::parse($booking->first_session_start_time)->format('H:i:s')
                : $booking->first_session_start_time);

        $firstSessionDateTime = Carbon::parse($date . ' ' . $startTime);
        return $firstSessionDateTime->subHours(24)->isFuture();
    }

    public function canRescheduleBooking($booking): bool
    {
        if (in_array($booking->status, ['cancelled', 'completed'])) {
            return false;
        }

        $date = $booking->first_session_date instanceof Carbon
            ? $booking->first_session_date->format('Y-m-d')
            : substr($booking->first_session_date, 0, 10);

        $startTime = $booking->first_session_start_time instanceof Carbon
            ? $booking->first_session_start_time->format('H:i:s')
            : (strlen($booking->first_session_start_time) > 8
                ? Carbon::parse($booking->first_session_start_time)->format('H:i:s')
                : $booking->first_session_start_time);

        $firstSessionDateTime = Carbon::parse($date . ' ' . $startTime);
        return $firstSessionDateTime->subHours(4)->isFuture();
    }

    public function canReviewBooking($booking): bool
    {
        return $booking->status === 'completed' && $booking->sessions_completed > 0;
    }

    public function canJoinSession($booking): bool
    {
        if ($booking->status !== 'confirmed') {
            return false;
        }

        $now = now();
        $date = $booking->first_session_date instanceof Carbon
            ? $booking->first_session_date->format('Y-m-d')
            : substr($booking->first_session_date, 0, 10);

        $startTime = $booking->first_session_start_time instanceof Carbon
            ? $booking->first_session_start_time->format('H:i:s')
            : (strlen($booking->first_session_start_time) > 8
                ? Carbon::parse($booking->first_session_start_time)->format('H:i:s')
                : $booking->first_session_start_time);

        $endTime = $booking->first_session_end_time instanceof Carbon
            ? $booking->first_session_end_time->format('H:i:s')
            : (strlen($booking->first_session_end_time) > 8
                ? Carbon::parse($booking->first_session_end_time)->format('H:i:s')
                : $booking->first_session_end_time);

        $firstSessionDateTime = Carbon::parse($date . ' ' . $startTime);
        $sessionEndTime = Carbon::parse($date . ' ' . $endTime);

        return $now->between($firstSessionDateTime->subMinutes(15), $sessionEndTime);
    }

    public function calculateRefund($booking): array
    {
        $firstSessionDateTime = Carbon::parse($booking->first_session_date . ' ' . $booking->first_session_start_time);
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

    public function processRefund($booking, $refundAmount): void
    {
        if ($booking->payment) {
            $booking->payment->update([
                'refund_amount' => $refundAmount,
                'refund_status' => 'processing',
                'refund_processed_at' => now(),
            ]);
        }
    }

    public function getDayName(?int $dayNumber): string
    {
        $days = [
            1 => 'Saturday',
            2 => 'Sunday',
            3 => 'Monday',
            4 => 'Tuesday',
            5 => 'Wednesday',
            6 => 'Thursday',
            7 => 'Friday',
        ];
        return $days[$dayNumber] ?? 'Unknown';
    }

    public function extractTimeOnly($timeValue): string
    {
        if ($timeValue instanceof Carbon) {
            return $timeValue->format('H:i:s');
        }

        $str = trim((string)$timeValue);
        if (preg_match('/(\d{2}:\d{2}(?::\d{2})?)\s*$/', $str, $m)) {
            return strlen($m[1]) === 5 ? $m[1] . ':00' : $m[1];
        }

        try {
            return Carbon::parse($str)->format('H:i:s');
        } catch (\Throwable $e) {
            return '00:00:00';
        }
    }
}
