<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\GroupClassAvailabilitySlot;
use Carbon\Carbon;
use Illuminate\Http\Request;

class GroupClassAvailabilityController extends Controller
{
    public function index(Request $request)
    {
        $teacherId = $request->user()->id;

        $slots = GroupClassAvailabilitySlot::forTeacher($teacherId)
            ->orderBy('day_number')
            ->orderBy('start_time')
            ->get();

        $grouped = $slots->groupBy('day_number')->map(function ($daySlots, $dayNumber) {
            $timeSlots = $daySlots->map(function ($slot) {
                $timeString = $slot->start_time instanceof Carbon
                    ? $slot->start_time->format('H:i')
                    : substr((string)$slot->start_time, 0, 5);

                return [
                    'id' => $slot->id,
                    'time' => $timeString,
                    'duration' => $slot->duration ?? 60,
                ];
            })->values();

            return [
                'day' => (int) $dayNumber,
                'time_slots' => $timeSlots,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $grouped
        ]);
    }

    public function store(Request $request)
    {
        $teacherId = $request->user()->id;
        $createdSlots = [];
        $failedDuplicates = [];

        $timeFormats = ['g:i A', 'h:i A', 'H:i', 'G:i'];

        if ($request->has('available_times') && is_array($request->available_times)) {
            foreach ($request->available_times as $dayEntry) {
                $day = $dayEntry['day'] ?? $dayEntry['day_number'] ?? null;
                if (!$day || !is_numeric($day) || (int)$day < 1 || (int)$day > 7) {
                    continue;
                }

                $times = $dayEntry['times'] ?? [];
                if (!is_array($times)) {
                    continue;
                }

                foreach ($times as $time) {
                    $timeStr = trim((string)$time);
                    $timeStr = str_replace(['ص', 'م'], ['AM', 'PM'], $timeStr);
                    $parsed = null;

                    foreach ($timeFormats as $fmt) {
                        try {
                            $parsed = Carbon::createFromFormat($fmt, $timeStr);
                            if ($parsed) {
                                break;
                            }
                        } catch (\Exception $e) {
                        }
                    }

                    if (!$parsed) {
                        continue;
                    }

                    $startTime = $parsed->format('H:i');
                    $endTime = $parsed->copy()->addHour()->format('H:i');

                    $exists = GroupClassAvailabilitySlot::where('teacher_id', $teacherId)
                        ->where('day_number', (int)$day)
                        ->where('start_time', $startTime)
                        ->exists();

                    if ($exists) {
                        $failedDuplicates[] = [
                            'day' => (int)$day,
                            'time' => $startTime
                        ];
                        continue;
                    }

                    $slot = GroupClassAvailabilitySlot::create([
                        'teacher_id' => $teacherId,
                        'day_number' => (int)$day,
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                        'duration' => 60,
                        'repeat_type' => 'weekly',
                    ]);

                    $createdSlots[] = $slot;
                }
            }

            return response()->json([
                'success' => true,
                'data' => $createdSlots,
                'skipped_duplicates' => $failedDuplicates
            ]);
        }

        $request->validate([
            'day_number' => 'required|integer|between:1,7',
            'start_time' => 'required',
        ]);

        $timeStr = trim((string)$request->start_time);
        $timeStr = str_replace(['ص', 'م'], ['AM', 'PM'], $timeStr);
        $parsed = null;

        foreach ($timeFormats as $fmt) {
            try {
                $parsed = Carbon::createFromFormat($fmt, $timeStr);
                if ($parsed) {
                    break;
                }
            } catch (\Exception $e) {
            }
        }

        if (!$parsed) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid time format'
            ], 422);
        }

        $startTime = $parsed->format('H:i');
        $endTime = $parsed->copy()->addHour()->format('H:i');

        $exists = GroupClassAvailabilitySlot::where('teacher_id', $teacherId)
            ->where('day_number', (int)$request->day_number)
            ->where('start_time', $startTime)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Time slot already exists'
            ], 422);
        }

        $slot = GroupClassAvailabilitySlot::create([
            'teacher_id' => $teacherId,
            'day_number' => (int)$request->day_number,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'duration' => 60,
            'repeat_type' => 'weekly',
        ]);

        return response()->json([
            'success' => true,
            'data' => $slot
        ]);
    }

    public function show($id, Request $request)
    {
        $teacherId = $request->user()->id;

        $slot = GroupClassAvailabilitySlot::where('id', $id)
            ->where('teacher_id', $teacherId)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $slot
        ]);
    }

    public function destroy($id, Request $request)
    {
        $teacherId = $request->user()->id;

        $slot = GroupClassAvailabilitySlot::where('id', $id)
            ->where('teacher_id', $teacherId)
            ->firstOrFail();

        $slot->delete();

        return response()->json([
            'success' => true,
            'message' => 'Slot deleted successfully'
        ]);
    }

    public function destroyBatch(Request $request)
    {
        $teacherId = $request->user()->id;

        $idsString = $request->input('ids');
        if (is_array($idsString)) {
            $ids = array_map('intval', $idsString);
        } else {
            $raw = (string) $idsString;
            $ids = array_filter(explode(',', $raw), 'is_numeric');
            $ids = array_map('intval', $ids);
        }

        if (empty($ids)) {
            return response()->json([
                'success' => false,
                'message' => 'No valid IDs provided'
            ], 422);
        }

        $slots = GroupClassAvailabilitySlot::whereIn('id', $ids)
            ->where('teacher_id', $teacherId)
            ->get();

        $deletedIds = [];
        foreach ($slots as $slot) {
            $slot->delete();
            $deletedIds[] = $slot->id;
        }

        return response()->json([
            'success' => true,
            'message' => 'Batch delete completed',
            'deleted' => $deletedIds
        ]);
    }

    public function getTeacherGroupSlots($teacherId)
    {
        $slots = GroupClassAvailabilitySlot::forTeacher($teacherId)
            ->orderBy('day_number')
            ->orderBy('start_time')
            ->get();

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

        $grouped = $slots->groupBy('day_number')->map(function ($daySlots, $dayNumber) use ($dayNamesAr, $dayNamesEn) {
            $times = $daySlots->map(function ($slot) {
                $timeString = $slot->start_time instanceof Carbon
                    ? $slot->start_time->format('h:i A')
                    : substr((string)$slot->start_time, 0, 5);

                return [
                    'id' => $slot->id,
                    'time' => $timeString,
                    'start_time' => $slot->start_time instanceof Carbon ? $slot->start_time->format('H:i:s') : (string)$slot->start_time,
                    'end_time' => $slot->end_time instanceof Carbon ? $slot->end_time->format('H:i:s') : (string)$slot->end_time,
                    'duration' => $slot->duration ?? 60,
                ];
            })->values();

            return [
                'id' => (int) $dayNumber,
                'day' => $dayNamesAr[$dayNumber] ?? '',
                'day_ar' => $dayNamesAr[$dayNumber] ?? '',
                'day_en' => $dayNamesEn[$dayNumber] ?? '',
                'day_name' => $dayNamesAr[$dayNumber] ?? '',
                'times' => $times,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $grouped
        ]);
    }
}
