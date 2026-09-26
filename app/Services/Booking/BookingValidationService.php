<?php

namespace App\Services\Booking;

use App\Models\AvailabilitySlot;
use App\Models\Sessions;
use App\Helpers\PackageBookingHelper;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class BookingValidationService
{
    /**
     * Check if a student has any conflicting active/upcoming session at the given date(s) and time(s).
     * Only checks sessions that are in the future (not in the past).
     *
     * @param int $studentId
     * @param array $sessionsList Array of items: ['date' => 'Y-m-d', 'start_time' => 'H:i:s', 'end_time' => 'H:i:s']
     * @return array ['has_conflict' => bool, 'conflict' => Sessions|null, 'message' => string|null, 'message_ar' => string|null]
     */
    public function checkStudentSessionConflict(int $studentId, array $sessionsList): array
    {
        $now = Carbon::now();

        foreach ($sessionsList as $item) {
            $sessionDate = $item['date'] ?? null;
            $startTime = $this->formatTime($item['start_time'] ?? null);
            $endTime = $this->formatTime($item['end_time'] ?? null);

            if (!$sessionDate || !$startTime || !$endTime) {
                continue;
            }

            // Check if this candidate session is upcoming (not in the past)
            $candidateEndDateTime = Carbon::parse($sessionDate . ' ' . $endTime);
            if ($candidateEndDateTime->lessThan($now)) {
                // Session is in the past, skip checking past history
                continue;
            }

            // Look for existing active session for this student overlapping the requested time on the same date
            $existingSession = Sessions::where('student_id', $studentId)
                ->where('session_date', $sessionDate)
                ->whereIn('status', [
                    Sessions::STATUS_SCHEDULED,
                    Sessions::STATUS_LIVE,
                    'wait_for_teacher',
                    'in_progress'
                ])
                ->where(function ($query) use ($startTime, $endTime) {
                    $query->whereTime('start_time', '<', $endTime)
                          ->whereTime('end_time', '>', $startTime);
                })
                ->first();

            if ($existingSession) {
                Log::info('Student session conflict detected', [
                    'student_id' => $studentId,
                    'requested_date' => $sessionDate,
                    'requested_time' => "{$startTime} - {$endTime}",
                    'existing_session_id' => $existingSession->id,
                    'existing_time' => "{$existingSession->start_time} - {$existingSession->end_time}",
                ]);

                return [
                    'has_conflict' => true,
                    'conflict' => $existingSession,
                    'message' => 'You already have a scheduled session at this time and cannot book.',
                    'message_ar' => 'لديك جلسة مجدولة بالفعل في هذا التوقيت ولا يمكنك الحجز.',
                    'conflict_details' => [
                        'session_id' => $existingSession->id,
                        'session_date' => $existingSession->session_date instanceof Carbon ? $existingSession->session_date->format('Y-m-d') : $existingSession->session_date,
                        'start_time' => $existingSession->start_time instanceof Carbon ? $existingSession->start_time->format('H:i:s') : $existingSession->start_time,
                        'end_time' => $existingSession->end_time instanceof Carbon ? $existingSession->end_time->format('H:i:s') : $existingSession->end_time,
                        'session_title' => $existingSession->session_title,
                        'status' => $existingSession->status,
                    ],
                ];
            }
        }

        return [
            'has_conflict' => false,
            'conflict' => null,
            'message' => null,
            'message_ar' => null,
        ];
    }

    /**
     * Check if a teacher has any conflicting active/upcoming session at the given date(s) and time(s).
     *
     * @param int $teacherId
     * @param array $sessionsList Array of items: ['date' => 'Y-m-d', 'start_time' => 'H:i:s', 'end_time' => 'H:i:s']
     * @param int|null $ignoreStudentId Optional student ID to allow (e.g. group courses)
     * @return array ['has_conflict' => bool, 'conflict' => Sessions|null, 'message' => string|null, 'message_ar' => string|null]
     */
    public function checkTeacherSessionConflict(int $teacherId, array $sessionsList, ?int $ignoreStudentId = null): array
    {
        $now = Carbon::now();

        foreach ($sessionsList as $item) {
            $sessionDate = $item['date'] ?? null;
            $startTime = $this->formatTime($item['start_time'] ?? null);
            $endTime = $this->formatTime($item['end_time'] ?? null);

            if (!$sessionDate || !$startTime || !$endTime) {
                continue;
            }

            $candidateEndDateTime = Carbon::parse($sessionDate . ' ' . $endTime);
            if ($candidateEndDateTime->lessThan($now)) {
                continue;
            }

            $query = Sessions::where('teacher_id', $teacherId)
                ->where('session_date', $sessionDate)
                ->whereIn('status', [
                    Sessions::STATUS_SCHEDULED,
                    Sessions::STATUS_LIVE,
                    'wait_for_teacher',
                    'in_progress'
                ])
                ->where(function ($q) use ($startTime, $endTime) {
                    $q->whereTime('start_time', '<', $endTime)
                      ->whereTime('end_time', '>', $startTime);
                });

            if ($ignoreStudentId) {
                $query->where('student_id', '!=', $ignoreStudentId);
            }

            $existingSession = $query->first();

            if ($existingSession) {
                Log::info('Teacher session conflict detected', [
                    'teacher_id' => $teacherId,
                    'requested_date' => $sessionDate,
                    'requested_time' => "{$startTime} - {$endTime}",
                    'existing_session_id' => $existingSession->id,
                ]);

                return [
                    'has_conflict' => true,
                    'conflict' => $existingSession,
                    'message' => 'Teacher already has another scheduled session at this time.',
                    'message_ar' => 'المعلم لديه جلسة أخرى مجدولة بالفعل في هذا التوقيت.',
                    'conflict_details' => [
                        'session_id' => $existingSession->id,
                        'session_date' => $existingSession->session_date instanceof Carbon ? $existingSession->session_date->format('Y-m-d') : $existingSession->session_date,
                        'start_time' => $existingSession->start_time instanceof Carbon ? $existingSession->start_time->format('H:i:s') : $existingSession->start_time,
                        'end_time' => $existingSession->end_time instanceof Carbon ? $existingSession->end_time->format('H:i:s') : $existingSession->end_time,
                    ],
                ];
            }
        }

        return [
            'has_conflict' => false,
            'conflict' => null,
            'message' => null,
            'message_ar' => null,
        ];
    }

    /**
     * Resolves the upcoming concrete session date(s) for an availability slot and checks conflicts.
     *
     * @param int $slotId
     * @param int|null $studentId
     * @param int $sessionsCount
     * @return array
     */
    public function getTimeslotSessionInfo(int $slotId, ?int $studentId = null, int $sessionsCount = 1): array
    {
        $slot = AvailabilitySlot::find($slotId);
        if (!$slot) {
            return [
                'success' => false,
                'message' => 'Time slot not found',
                'message_ar' => 'الفترة الزمنية غير موجودة',
                'status_code' => 404,
            ];
        }

        $startTime = $this->formatTime($slot->start_time);
        $endTime = $this->formatTime($slot->end_time);
        $resolvedFirstDate = PackageBookingHelper::resolveSlotDate($slot);

        $dayNamesAr = [
            1 => 'السبت',
            2 => 'الأحد',
            3 => 'الإثنين',
            4 => 'الثلاثاء',
            5 => 'الأربعاء',
            6 => 'الخميس',
            7 => 'الجمعة',
        ];

        $dayNamesEn = [
            1 => 'Saturday',
            2 => 'Sunday',
            3 => 'Monday',
            4 => 'Tuesday',
            5 => 'Wednesday',
            6 => 'Thursday',
            7 => 'Friday',
        ];

        $dayNumber = $slot->day_number;
        $dayNameAr = $dayNamesAr[$dayNumber] ?? null;
        $dayNameEn = $dayNamesEn[$dayNumber] ?? null;

        $count = max(1, min(50, $sessionsCount));
        $availability = $this->getNextBookableSessions($slot, $studentId, $count);
        $upcomingSessions = $availability['sessions'];
        foreach ($upcomingSessions as &$session) {
            $session['day_name_ar'] = $dayNameAr;
            $session['day_name_en'] = $dayNameEn;
        }
        unset($session);
        $canBook = $availability['can_book'];
        if ($canBook && !empty($upcomingSessions[0]['session_date'])) {
            $resolvedFirstDate = $upcomingSessions[0]['session_date'];
        }

        $reason = null;
        $reasonAr = null;
        if (!PackageBookingHelper::isSlotBookable($slot)) {
            $reason = 'Slot is not marked as available';
            $reasonAr = 'الفترة الزمنية غير متاحة';
        } elseif (!$canBook) {
            $reason = $availability['reason'];
            $reasonAr = $availability['reason_ar'];
        }

        return [
            'success' => true,
            'status_code' => 200,
            'data' => [
                'slot_id' => $slot->id,
                'teacher_id' => $slot->teacher_id,
                'day_number' => $slot->day_number,
                'day_name_ar' => $dayNameAr,
                'day_name_en' => $dayNameEn,
                'session_date' => $resolvedFirstDate,
                'formatted_date' => Carbon::parse($resolvedFirstDate)->format('Y-m-d'),
                'start_time' => $startTime,
                'end_time' => $endTime,
                'duration' => $slot->duration ?? 60,
                'is_available' => PackageBookingHelper::isSlotBookable($slot),
                'is_booked' => PackageBookingHelper::isRecurringSlot($slot) ? false : (bool) $slot->is_booked,
                'has_teacher_conflict' => !$canBook && $availability['conflict_type'] === 'teacher',
                'has_student_conflict' => !$canBook && $availability['conflict_type'] === 'student',
                'can_book' => $canBook,
                'reason' => $reason,
                'reason_ar' => $reasonAr,
                'upcoming_sessions' => $upcomingSessions,
                'skipped_conflicting_occurrences' => $availability['skipped_occurrences'],
            ],
        ];
    }

    /**
     * Find the nearest future weekly occurrence(s) without a teacher or student
     * time overlap. One-time slots are checked once; recurring slots advance
     * week-by-week instead of failing merely because a prior occurrence booked
     * the same availability row.
     */
    public function getNextBookableSessions(AvailabilitySlot $slot, ?int $studentId, int $sessionsCount = 1): array
    {
        $startTime = $this->formatTime($slot->start_time);
        $endTime = $this->formatTime($slot->end_time);
        $count = max(1, min(50, $sessionsCount));
        $recurring = PackageBookingHelper::isRecurringSlot($slot);
        $slotEnabled = PackageBookingHelper::isSlotBookable($slot);
        $initialDate = Carbon::parse(PackageBookingHelper::resolveSlotDate($slot))->startOfDay();
        $maxWeeks = $recurring ? 52 : 1;
        $rangeEnd = $initialDate->copy()->addWeeks($maxWeeks + $count);
        $activeStatuses = [Sessions::STATUS_SCHEDULED, Sessions::STATUS_LIVE, 'wait_for_teacher', 'in_progress', 'pending'];

        $teacherSessions = Sessions::where('teacher_id', $slot->teacher_id)
            ->whereBetween('session_date', [$initialDate->toDateString(), $rangeEnd->toDateString()])
            ->whereIn('status', $activeStatuses)
            ->get(['session_date', 'start_time', 'end_time', 'status', 'id']);

        $studentSessions = $studentId
            ? Sessions::where('student_id', $studentId)
                ->whereBetween('session_date', [$initialDate->toDateString(), $rangeEnd->toDateString()])
                ->whereIn('status', $activeStatuses)
                ->get(['session_date', 'start_time', 'end_time', 'status', 'id'])
            : collect();

        $lastConflictType = null;
        $skippedOccurrences = 0;
        $iterations = $recurring ? $maxWeeks : 1;

        for ($weekOffset = 0; $weekOffset < $iterations; $weekOffset++) {
            $series = [];
            $conflictFound = false;

            for ($index = 0; $index < $count; $index++) {
                $date = $initialDate->copy()->addWeeks($weekOffset + $index)->format('Y-m-d');
                $candidateEnd = Carbon::parse($date . ' ' . $endTime);
                if ($candidateEnd->lessThan(now())) {
                    $conflictFound = true;
                    $lastConflictType = 'past';
                    break;
                }

                $teacherConflict = $this->findOverlappingSession($teacherSessions, $date, $startTime, $endTime);
                $studentConflict = $this->findOverlappingSession($studentSessions, $date, $startTime, $endTime);
                if ($teacherConflict || $studentConflict) {
                    $conflictFound = true;
                    $lastConflictType = $teacherConflict ? 'teacher' : 'student';
                    break;
                }

                $series[] = [
                    'session_number' => $index + 1,
                    'session_date' => $date,
                    'formatted_date' => $date,
                    'day_name_ar' => null,
                    'day_name_en' => null,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'is_teacher_available' => true,
                    'is_student_available' => true,
                    'can_book' => $slotEnabled,
                    'conflict_reason' => null,
                ];
            }

            if (!$conflictFound && $slotEnabled && count($series) === $count) {
                return [
                    'can_book' => true,
                    'sessions' => $series,
                    'skipped_occurrences' => $skippedOccurrences,
                    'conflict_type' => null,
                    'reason' => null,
                    'reason_ar' => null,
                ];
            }

            $skippedOccurrences++;
            if (!$slotEnabled) {
                return [
                    'can_book' => false,
                    'sessions' => [],
                    'skipped_occurrences' => $skippedOccurrences,
                    'conflict_type' => 'disabled',
                    'reason' => 'This availability time is disabled by the teacher.',
                    'reason_ar' => 'هذا الموعد غير متاح من قبل المعلم.',
                ];
            }
        }

        $reason = $lastConflictType === 'student'
            ? 'You already have a session at this time. No clear occurrence was found soon.'
            : ($lastConflictType === 'past'
                ? 'No future occurrence is available for this slot.'
                : 'The teacher is busy at this time. No clear occurrence was found soon.');
        $reasonAr = $lastConflictType === 'student'
            ? 'لديك جلسة في هذا التوقيت ولم يتم العثور على موعد قريب خالٍ من التعارض.'
            : ($lastConflictType === 'past'
                ? 'لا يوجد موعد مستقبلي متاح لهذه الفترة.'
                : 'المعلم مشغول في هذا التوقيت ولم يتم العثور على موعد قريب خالٍ من التعارض.');

        return [
            'can_book' => false,
            'sessions' => [],
            'skipped_occurrences' => $skippedOccurrences,
            'conflict_type' => $lastConflictType,
            'reason' => $reason,
            'reason_ar' => $reasonAr,
        ];
    }

    private function findOverlappingSession($sessions, string $date, string $startTime, string $endTime)
    {
        return $sessions->first(function ($session) use ($date, $startTime, $endTime) {
            $sessionDate = $session->session_date instanceof Carbon
                ? $session->session_date->format('Y-m-d')
                : Carbon::parse($session->session_date)->format('Y-m-d');
            if ($sessionDate !== $date) {
                return false;
            }

            $existingStart = $this->formatTime($session->start_time);
            $existingEnd = $this->formatTime($session->end_time);
            return $existingStart < $endTime && $existingEnd > $startTime;
        });
    }

    /**
     * Format time value to H:i:s string.
     */
    private function formatTime($value): ?string
    {
        if (!$value) {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value->format('H:i:s');
        }

        $str = trim((string) $value);
        if (preg_match('/(\d{2}:\d{2}(?::\d{2})?)\s*$/', $str, $m)) {
            return strlen($m[1]) === 5 ? $m[1] . ':00' : $m[1];
        }

        try {
            return Carbon::parse($str)->format('H:i:s');
        } catch (\Throwable $e) {
            return null;
        }
    }
}
