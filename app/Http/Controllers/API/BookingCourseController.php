<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Course;
use App\Models\AvailabilitySlot;
use App\Models\Sessions;
use App\Models\Subject;
use App\Models\User;
use App\Models\UserPaymentMethod;
use App\Models\Services;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BookingCourseController extends Controller
{
    public function createBooking(Request $request): JsonResponse
    {
        $request->validate([
            'course_id' => 'nullable|exists:courses,id',
            'course_group_id' => 'nullable|exists:course_groups,id',
            'service_id' => 'nullable|exists:services,id',
            'teacher_id' => 'nullable|integer|exists:users,id',
            'availability_slot_id' => 'nullable|exists:availability_slots,id',
            'subject_id' => 'nullable|integer',
            'type' => 'required|in:single,package',
            'sessions_count' => 'nullable|integer|min:1|max:50',
            'total_sessions' => 'nullable|integer|min:1|max:50',
        ]);

        $isCourse = $request->filled('course_id');
        $isService = $request->filled('service_id');

        if (!$isCourse && !$isService) {
            return response()->json([
                'success' => false,
                'message' => 'Either course_id or service_id is required'
            ], 422);
        }

        DB::beginTransaction();
        try {
            $studentId = auth()->id();
            $courseGroupId = null;

            if ($isCourse) {
                $course = Course::with('teacher')->findOrFail($request->course_id);
                $teacherId = $course->teacher_id;
                $sessionDuration = ($course->duration_hours ?? 1) * 60;
                $basePrice = $course->price ?? 0;
                $currency = 'SAR';

                $courseFormat = $course->course_format ?? 'individual';

                if ($courseFormat === 'group') {
                    if (!$request->filled('course_group_id')) {
                        return response()->json([
                            'success' => false,
                            'message' => 'For group courses you must select a course group'
                        ], 422);
                    }

                    $courseGroup = \App\Models\CourseGroup::where('id', $request->course_group_id)
                        ->where('course_id', $course->id)
                        ->lockForUpdate()
                        ->first();

                    if (!$courseGroup) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Selected group not found for this course'
                        ], 404);
                    }

                    if ($courseGroup->status !== 'open' && $courseGroup->status !== 'confirmed') {
                        return response()->json([
                            'success' => false,
                            'message' => 'This group is not accepting enrollments'
                        ], 400);
                    }

                    if ($courseGroup->is_full) {
                        return response()->json([
                            'success' => false,
                            'message' => 'This group is full'
                        ], 400);
                    }

                    $courseGroupId = $courseGroup->id;
                    $sessionsCount = $courseGroup->total_sessions;
                    $startDate = Carbon::parse($courseGroup->start_date);
                    $schedulePattern = $courseGroup->schedule_pattern;

                    $time = $schedulePattern['time'] ?? ($schedulePattern['start_time'] ?? '00:00');
                    $endTime = $schedulePattern['end_time'] ?? null;

                    if ($endTime) {
                        $startCarbon = Carbon::parse($time);
                        $endCarbon = Carbon::parse($endTime);
                        $sessionDuration = $startCarbon->diffInMinutes($endCarbon);
                    }

                    $firstSessionDate = $startDate->format('Y-m-d');
                    $startTime = is_string($time) ? $time : Carbon::parse($time)->format('H:i');
                    $firstSessionEndTime = $endTime
                        ? (is_string($endTime) ? $endTime : Carbon::parse($endTime)->format('H:i'))
                        : Carbon::parse($startTime)->copy()->addMinutes($sessionDuration)->format('H:i');

                } else {
                    $slotId = $request->availability_slot_id;
                    if (!$slotId) {
                        return response()->json([
                            'success' => false,
                            'message' => 'For individual courses you must select an availability slot'
                        ], 422);
                    }

                    $slot = AvailabilitySlot::where('id', $slotId)->lockForUpdate()->firstOrFail();

                    $reasons = [];
                    if (!$slot->is_available) $reasons[] = 'slot_not_available';
                    if ($slot->is_booked) $reasons[] = 'slot_already_booked';
                    if ($slot->teacher_id !== $course->teacher_id) $reasons[] = 'slot_teacher_mismatch';
                    if ($slot->course_id !== $course->id) $reasons[] = 'slot_course_mismatch';
                    if (count($reasons) > 0) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Cannot book unavailable slot',
                            'reasons' => $reasons,
                        ], 400);
                    }

                    $slotDate = null;
                    if ($slot->date && trim((string)$slot->date) !== '') {
                        $slotDate = $slot->date instanceof Carbon ? $slot->date->format('Y-m-d') : (string) $slot->date;
                    } elseif ($slot->day_number !== null) {
                        $today = Carbon::today();
                        $dayNumberFromApp = (int) $slot->day_number;
                        $carbonDayOfWeek = ($dayNumberFromApp === 1) ? 6 : ($dayNumberFromApp - 2);
                        $todayDow = $today->dayOfWeek;
                        $delta = ($carbonDayOfWeek - $todayDow + 7) % 7;
                        $candidate = $today->copy()->addDays($delta);

                        $slotStart = $this->extractTimeOnly($slot->start_time);
                        $candidateDateTime = Carbon::parse($candidate->format('Y-m-d') . ' ' . $slotStart);

                        if ($candidateDateTime->lessThanOrEqualTo(now())) {
                            $candidate->addDays(7);
                        }

                        $slotDate = $candidate->format('Y-m-d');
                    } else {
                        $slotDate = Carbon::today()->format('Y-m-d');
                    }

                    $firstSessionDate = $slotDate;
                    $startTime = $this->extractTimeOnly($slot->start_time);
                    $firstSessionEndTime = $this->extractTimeOnly($slot->end_time);

                    $sessionsCountInput = $request->total_sessions ?? $request->sessions_count;
                    $sessionsCount = (int)($sessionsCountInput ?? ($request->type === 'package' ? 1 : 1));
                }
            } else {
                $teacherId = $request->teacher_id;
                $teacherInfo = \App\Models\TeacherInfo::where('teacher_id', $teacherId)->first();
                $sessionDuration = 60;
                $basePrice = ($request->type === 'single') ? ($teacherInfo->individual_hour_price ?? 0) : ($teacherInfo->group_hour_price ?? 0);
                $currency = 'SAR';
                $sessionsCount = $request->type === 'package' ? (int)($request->sessions_count ?? 1) : 1;
                $firstSessionDate = null;
                $startTime = null;
                $firstSessionEndTime = null;
            }

            $sessionType = $sessionsCount > 1 ? 'package' : $request->type;

            $platformPercentage = \App\Models\PlatformPercentage::getActive();
            $percentageValue = $platformPercentage ? ($platformPercentage->value / 100) : 0;

            $teacherRatePerSession = ($basePrice * $sessionDuration) / 60;
            $pricePerSession = $teacherRatePerSession * (1 + $percentageValue);

            $discount = $sessionsCount > 1 ? $this->calculatePackageDiscount($sessionsCount) : 0;
            $subtotal = $pricePerSession * $sessionsCount;
            $discountAmount = $subtotal * ($discount / 100);
            $total = $subtotal - $discountAmount;

            $service_id = $isCourse ? ($course->service_id ?? 0) : ($request->service_id ?? 0);

            if ($request->subject_id && !$isCourse) {
                $subject = Subject::find($request->subject_id);
                $service_id = $subject ? $subject->service_id : $service_id;
            }

            $booking = Booking::create([
                'student_id' => $studentId,
                'teacher_id' => $teacherId,
                'availability_slot_id' => $isCourse && ($courseFormat ?? 'individual') !== 'group' ? $request->availability_slot_id : null,
                'service_id' => $service_id,
                'course_id' => $isCourse ? $course->id : null,
                'course_group_id' => $courseGroupId,
                'subject_id' => !$isCourse ? $request->subject_id : null,
                'language_id' => !$isCourse && $request->filled('language_id') ? $request->language_id : null,
                'booking_reference' => $this->generateBookingReference(),
                'session_type' => $sessionType,
                'sessions_count' => $sessionsCount,
                'sessions_completed' => 0,
                'first_session_date' => $firstSessionDate,
                'first_session_start_time' => $startTime,
                'first_session_end_time' => $firstSessionEndTime,
                'session_duration' => $sessionDuration,
                'teacher_rate_per_session' => $teacherRatePerSession,
                'platform_percentage' => $platformPercentage ? $platformPercentage->value : 0,
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

            $ns = new \App\Services\NotificationService();

            $title = app()->getLocale() == 'ar'
                ? 'تم إنشاء الحجز'
                : 'Booking Created';

            $msg = app()->getLocale() == 'ar'
                ? "تم إنشاء الحجز ({$booking->booking_reference}) بنجاح. يمكنك متابعة التفاصيل من حسابك."
                : "Your booking ({$booking->booking_reference}) has been created successfully. You can view the details in your account.";

            $ns->send($booking->student, 'booking_created', $title, $msg, [
                'booking_id' => $booking->id,
            ]);

            $teacher = \App\Models\User::findOrFail($teacherId);
            $ns->send($teacher, 'booking_created', $title, $msg, [
                'booking_id' => $booking->id,
            ]);

            DB::commit();
            Log::info('Course booking created (pending payment)', [
                'booking_id' => $booking->id,
                'course_id' => $isCourse ? $course->id : null,
                'course_group_id' => $courseGroupId,
            ]);

            $hasSavedMethods = \App\Models\UserPaymentMethod::where('user_id', $studentId)->exists();
            $teacherData = $this->getFullTeacherData($teacher);

            $subjectData = null;
            if ($isCourse && $booking->course) {
                $subjectData = [
                    'id' => $booking->course->id,
                    'name' => $booking->course->name ?? null,
                    'name_en' => $booking->course->name ?? null,
                ];
            } elseif (!$isCourse && $request->filled('subject_id')) {
                $subject = Subject::find($request->subject_id);
                $subjectData = $subject ? [
                    'id' => $subject->id,
                    'name_en' => $subject->name_en,
                    'name_ar' => $subject->name_ar,
                ] : null;
            }

            $serviceData = null;
            if ($isService) {
                $service = \App\Models\Services::find($request->service_id);
                $serviceData = $service ? [
                    'id' => $service->id,
                    'name' => $service->name,
                    'description' => $service->description ?? null,
                ] : null;
            }

            $timeslotData = null;
            if (isset($slot) && $slot) {
                $timeslotData = [
                    'id' => $slot->id,
                    'day_number' => $slot->day_number,
                    'day_name' => $this->getDayName($slot->day_number ?? 0),
                    'start_time' => $this->extractTimeOnly($slot->start_time),
                    'end_time' => $this->extractTimeOnly($slot->end_time),
                    'duration' => $slot->duration,
                ];
            }

            $courseGroupData = null;
            if ($courseGroupId) {
                $cg = \App\Models\CourseGroup::find($courseGroupId);
                if ($cg) {
                    $courseGroupData = [
                        'id' => $cg->id,
                        'group_name' => $cg->group_name,
                        'start_date' => $cg->start_date,
                        'total_sessions' => $cg->total_sessions,
                        'enrolled_count' => $cg->enrolled_count,
                        'max_students' => $cg->max_students,
                        'remaining_seats' => $cg->remaining_seats,
                    ];
                }
            }

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
                'requires_payment_method' => !$hasSavedMethods,
                'meta' => [
                    'service' => $serviceData,
                    'subject' => $subjectData,
                    'timeslot' => $timeslotData,
                    'course_group' => $courseGroupData,
                ]
            ];

            return response()->json(['success' => true, 'message' => 'Booking created successfully', 'data' => $responseData]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Course booking creation failed', [
                'student_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['success' => false, 'message' => 'Failed to create booking', 'error' => $e->getMessage()], 500);
        }
    }

    private function generateBookingReference(): string
    {
        return 'BK' . now()->format('Ymd') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    private function getFullTeacherData($teacher)
    {
        $userController = new UserController();
        return $userController->getFullTeacherData($teacher);
    }

    private function calculatePackageDiscount(int $sessionsCount): float
    {
        if ($sessionsCount >= 20) return 20;
        if ($sessionsCount >= 10) return 15;
        if ($sessionsCount >= 5) return 10;
        return 0;
    }

    private function getDayName(?int $dayNumber): string
    {
        $dayNames = [
            0 => 'Sunday', 1 => 'Monday', 2 => 'Tuesday', 3 => 'Wednesday',
            4 => 'Thursday', 5 => 'Friday', 6 => 'Saturday',
        ];
        return $dayNames[$dayNumber] ?? 'Unknown';
    }

    private function extractTimeOnly($timeValue): string
    {
        if ($timeValue instanceof Carbon) {
            return $timeValue->format('H:i:s');
        }
        $timeStr = (string)$timeValue;
        if (strlen($timeStr) === 8 && preg_match('/^\d{2}:\d{2}:\d{2}$/', $timeStr)) {
            return $timeStr;
        }
        if (strpos($timeStr, ' ') !== false) {
            $parts = explode(' ', $timeStr);
            return end($parts);
        }
        return $timeStr;
    }
}