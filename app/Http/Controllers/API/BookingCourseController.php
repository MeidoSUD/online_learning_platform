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
            'service_id' => 'nullable|exists:services,id',
            'teacher_id' => 'nullable|integer|exists:users,id',
            'availability_slot_id' => 'nullable|exists:availability_slots,id',
            'subject_id' => 'nullable|integer',
            'type' => 'required|in:single,package',
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

            if ($isCourse) {
                $course = Course::with('teacher')->findOrFail($request->course_id);
                $teacherId = $course->teacher_id;
                $sessionDuration = $course->session_duration ?? 60;
                $basePrice = $course->price_per_hour ?? $course->price ?? 0;
                $currency = $course->currency ?? 'SAR';
            } else {
                $teacherId = $request->teacher_id;
                $teacherInfo = \App\Models\TeacherInfo::where('teacher_id', $teacherId)->first();
                $sessionDuration = 60;
                $basePrice = ($request->type === 'single') ? ($teacherInfo->individual_hour_price ?? 0) : ($teacherInfo->group_hour_price ?? 0);
                $currency = 'SAR';
            }

            $slot = null;
            if ($request->filled('availability_slot_id')) {
                $slot = AvailabilitySlot::lockForUpdate()->find($request->availability_slot_id);
                if (!$slot || !$slot->is_available || $slot->teacher_id != $teacherId) {
                    return response()->json(['success' => false, 'message' => 'Selected slot is no longer available'], 400);
                }
            }

            $slotDate = null;
            if ($slot) {
                if ($slot->date && trim((string)$slot->date) !== '') {
                    $slotDate = $slot->date instanceof Carbon ? $slot->date->format('Y-m-d') : (string) $slot->date;
                } elseif ($slot->day_number !== null) {
                    $today = Carbon::today();
                    $targetDay = (int) $slot->day_number;
                    $todayDow = $today->dayOfWeek;
                    $delta = ($targetDay - $todayDow + 7) % 7;
                    $candidate = $today->copy()->addDays($delta);
                    
                    $startTimeOnly = $this->extractTimeOnly($slot->start_time);
                    if ($candidate->format('Y-m-d') == $today->format('Y-m-d') && Carbon::parse($startTimeOnly)->lessThanOrEqualTo(now())) {
                         $candidate->addDays(7);
                    }
                    $slotDate = $candidate->format('Y-m-d');
                }
            }

            $sessionsCount = $request->type === 'package' ? (int)$request->sessions_count : 1;
            $pricePerSession = ($basePrice * ($sessionDuration ?? 60)) / 60;
            $discount = $sessionsCount > 1 ? $this->calculatePackageDiscount($sessionsCount) : 0;
            $subtotal = $pricePerSession * $sessionsCount;
            $discountAmount = $subtotal * ($discount / 100);
            $total = $subtotal - $discountAmount;

            $booking = Booking::create([
                'student_id' => $studentId,
                'teacher_id' => $teacherId,
                'course_id' => $isCourse ? $request->course_id : null,
                'subject_id' => !$isCourse ? $request->subject_id : null,
                'language_id' => !$isCourse && $request->filled('language_id') ? $request->language_id : null,
                'booking_reference' => $this->generateBookingReference(),
                'session_type' => $request->type,
                'sessions_count' => $sessionsCount,
                'sessions_completed' => 0,
                'first_session_date' => $slotDate,
                'first_session_start_time' => $slot ? $this->extractTimeOnly($slot->start_time) : null,
                'first_session_end_time' => $slot ? $this->extractTimeOnly($slot->end_time) : null,
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

            if ($slot) {
                $slot->update(['is_available' => false, 'is_booked' => true, 'booking_id' => $booking->id]);
            }

            if ($booking->first_session_date) {
                Sessions::createForBooking($booking);
            }

            DB::commit();

            $hasSavedMethods = UserPaymentMethod::where('user_id', $studentId)->exists();
            $teacher = User::findOrFail($teacherId);
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
                $service = Services::find($request->service_id);
                $serviceData = $service ? [
                    'id' => $service->id,
                    'name' => $service->name,
                    'description' => $service->description ?? null,
                ] : null;
            }

            $timeslotData = null;
            if ($slot) {
                $timeslotData = [
                    'id' => $slot->id,
                    'day_number' => $slot->day_number,
                    'day_name' => $this->getDayName($slot->day_number ?? 0),
                    'start_time' => $this->extractTimeOnly($slot->start_time),
                    'end_time' => $this->extractTimeOnly($slot->end_time),
                    'duration' => $slot->duration,
                ];
            }

            $responseData = [
                'booking_id' => $booking->id,
                'booking' => [
                    'id' => $booking->id,
                    'reference' => $booking->booking_reference,
                    'status' => $booking->status,
                    'total_amount' => (float)$booking->total_amount,
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