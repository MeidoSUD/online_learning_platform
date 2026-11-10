<?php

namespace App\Http\Controllers\API;

use App\Helpers\TeacherProfileHelper;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AvailabilitySlot;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Sessions;

class AvailabilityController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/teachers",
     *     summary="Get all teachers",
     *     tags={"Teachers"},
     *     @OA\Response(
     *         response=200,
     *         description="List of teachers"
     *     )
     * )
     */
    /**
     * Display a listing of the resource.
     * Groups availability slots by day_number with time_slots array.
     * Includes session data if slot is booked.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        // Auth Teacher ID
        $teacher = $request->user();
        $teacherId = $teacher->id;

        $inTimezone = $request->input('timezone') ?? $request->input('timezone_name') ?? $request->header('X-Timezone');
        $inOffset = $request->input('timezone_offset') ?? $request->input('teacher_timezone_offset');

        $teacherTimezone = \App\Helpers\CountryTimezone::fromInput($inTimezone, $inOffset, $teacher->timezone_name);
        $teacherOffset = $inOffset ?: \App\Helpers\CountryTimezone::getOffset($teacherTimezone);

        $platformTimezone = config('app.timezone', 'Asia/Riyadh');
        $platformOffset = \App\Helpers\CountryTimezone::getOffset($platformTimezone);

        // Get all slots for this teacher sorted
        $slots = AvailabilitySlot::forTeacher($teacherId)
            ->orderBy('day_number')
            ->orderBy('start_time')
            ->get();

        // Convert slots from platform storage time (Asia/Riyadh) to teacher local display time
        $convertedSlots = $slots->map(function ($slot) use ($platformOffset, $teacherOffset) {
            $rawTime = $slot->start_time instanceof \Carbon\Carbon
                ? $slot->start_time->format('H:i')
                : substr((string) $slot->start_time, 0, 5);

            $converted = \App\Helpers\CountryTimezone::convertSlotBetweenOffsets(
                $rawTime,
                (int) $slot->day_number,
                $platformOffset,
                $teacherOffset
            );

            $slot->converted_day = $converted['day'];
            $slot->converted_time = $converted['start_time'];
            return $slot;
        })->sortBy(['converted_day', 'converted_time']);

        // Group by converted_day
        $groupedByDay = $convertedSlots->groupBy('converted_day')->map(function ($daySlots, $dayNumber) use ($teacherTimezone, $teacherOffset) {

            $timeSlots = $daySlots->map(function ($slot) {
                $slotData = [
                    'id' => $slot->id,
                    'time' => $slot->converted_time ?? $slot->start_time->format('H:i'),
                    'session' => null,
                    'is_booked' => $slot->is_booked,
                ];

                // Prefer session linked directly to this availability slot (by availability_slot_id)
                $session = Sessions::where('availability_slot_id', $slot->id)
                    ->where('status', Sessions::STATUS_SCHEDULED)
                    ->first();

                // Fallback: if no direct session, try sessions by booking_id (scheduled)
                if (!$session && $slot->booking_id) {
                    $session = Sessions::where('booking_id', $slot->booking_id)
                        ->where('status', Sessions::STATUS_SCHEDULED)
                        ->first();
                }

                if ($session && $session->booking) {
                    $booking = $session->booking;
                    $course = $booking->course;

                    $slotData['session'] = [
                        'id' => $session->id,
                        'subject' => $course ? $course->name : null,
                        'lesson_class' => $course ? $course->classLevel?->name ?? null : null,
                        'level' => $course ? $course->educationLevel?->name ?? null : null,
                        'url' => $session->join_url ?? null,
                        'student_count' => $booking->sessions()->count() ?? 0,
                        'price' => $booking->price_per_session ?? null,
                        'completedLectures' => $booking->sessions_completed ?? 0,
                    ];
                }

                return $slotData;
            })->values();

            return [
                'day' => (int) $dayNumber,
                'teacher_timezone_offset' => $teacherOffset,
                'teacher_timezone' => $teacherTimezone,
                'time_slots' => $timeSlots,
            ];
        })->values();
        TeacherProfileHelper::checkAndUpdateProfileCompleted($teacherId);

        return response()->json([
            'success' => true,
            'timezone' => $teacherTimezone,
            'timezone_offset' => $teacherOffset,
            'data' => $groupedByDay
        ]);
    }


    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        // Basic validation for container and optional fields
        $request->validate([
            'available_times' => 'required|array',
            'course_id' => 'nullable|exists:courses,id',
            'order_id' => 'nullable|exists:orders,id',
            'repeat_type' => 'nullable|in:none,weekly,daily',
            'timezone' => 'nullable|string',
            'timezone_name' => 'nullable|string',
            'timezone_offset' => 'nullable|string',
            'teacher_timezone_offset' => 'nullable|string',
        ]);

        $teacher = $request->user();
        $teacherId = $teacher->id;

        // Resolve teacher's timezone and offset from any client variation (Flutter, Web, etc.)
        $inTimezone = $request->input('timezone') ?? $request->input('timezone_name') ?? $request->header('X-Timezone');
        $inOffset = $request->input('timezone_offset') ?? $request->input('teacher_timezone_offset');

        $teacherTimezone = \App\Helpers\CountryTimezone::fromInput($inTimezone, $inOffset, $teacher->timezone_name);
        $teacherOffset = $inOffset ?: \App\Helpers\CountryTimezone::getOffset($teacherTimezone);

        if ($teacherTimezone && $teacher->timezone !== $teacherTimezone) {
            $teacher->update(['timezone' => $teacherTimezone]);
        }

        $platformTimezone = config('app.timezone', 'Asia/Riyadh');
        $platformOffset = \App\Helpers\CountryTimezone::getOffset($platformTimezone);

        $createdSlots = [];
        $failedDuplicates = [];

        // Accept times in formats like "9:00 AM", "09:00", etc.
        $timeFormats = ['g:i A', 'h:i A', 'H:i', 'G:i'];

        foreach ($request->available_times as $dayEntry) {
            // Support both `day` and `day_number` keys to match incoming payloads
            $day = $dayEntry['day'] ?? $dayEntry['day_number'] ?? null;
            if (!$day || !is_int((int) $day) || $day < 1 || $day > 7) {
                return response()->json(['success' => false, 'message' => 'Invalid or missing day for available_times entries'], 422);
            }

            if (!isset($dayEntry['times']) || !is_array($dayEntry['times'])) {
                return response()->json(['success' => false, 'message' => 'Times array is required for each available_times entry'], 422);
            }

            foreach ($dayEntry['times'] as $time) {
                $timeStr = trim($time);
                $parsed = null;
                $timeStr = str_replace(['ص', 'م'], ['AM', 'PM'], $timeStr);
                foreach ($timeFormats as $fmt) {
                    try {
                        $parsed = \Carbon\Carbon::createFromFormat($fmt, $timeStr);
                        if ($parsed)
                            break;
                    } catch (\Exception $e) {
                        // try next format
                    }
                }

                if (!$parsed) {
                    return response()->json(['success' => false, 'message' => "Invalid time format: {$timeStr}"], 422);
                }

                $startTime = $parsed->format('H:i');
                $endParsed = $parsed->copy()->addHour();
                if ($endParsed->lessThanOrEqualTo($parsed)) {
                    return response()->json([
                        'success' => false,
                        'message' => "Invalid time slot '{$timeStr}': slot would end after midnight."
                    ], 422);
                }
                $endTime = $endParsed->format('H:i');

                // Normalize time slot from teacher local time to platform base storage time (Asia/Riyadh)
                $converted = \App\Helpers\CountryTimezone::convertSlotBetweenOffsets(
                    $startTime,
                    (int) $day,
                    $teacherOffset,
                    $platformOffset
                );
                $storageDay = $converted['day'];
                $storageStartTime = $converted['start_time'];
                $storageEndTime = $converted['end_time'];

                // Check for duplicate: same teacher + day + start_time in storage
                $duplicateQuery = AvailabilitySlot::where('teacher_id', $teacherId)
                    ->where('day_number', (int) $storageDay)
                    ->where('start_time', $storageStartTime);

                // If course_id is provided, check for duplicate within same course
                if ($request->filled('course_id')) {
                    $duplicateQuery->where('course_id', $request->course_id);
                }

                // If order_id is provided, check for duplicate within same order
                if ($request->filled('order_id')) {
                    $duplicateQuery->where('order_id', $request->order_id);
                }

                // If neither course_id nor order_id is provided, check across all personal slots
                if (!$request->filled('course_id') && !$request->filled('order_id')) {
                    $duplicateQuery->whereNull('course_id')
                        ->whereNull('order_id');
                }

                $exists = $duplicateQuery->exists();

                if ($exists) {
                    $failedDuplicates[] = [
                        'day' => (int) $day,
                        'time' => $startTime,
                        'reason' => 'Time slot already exists for this day'
                    ];
                    continue; // Skip this time
                }

                try {
                    $slot = AvailabilitySlot::create([
                        'teacher_id' => $teacherId,
                        'course_id' => $request->course_id,
                        'order_id' => $request->order_id,
                        'day_number' => (int) $storageDay,
                        'start_time' => $storageStartTime,
                        'end_time' => $storageEndTime,
                        'is_available' => true,
                        'is_booked' => false,
                        'repeat_type' => $request->repeat_type ?? AvailabilitySlot::REPEAT_NONE,
                    ]);
                } catch (\InvalidArgumentException $e) {
                    return response()->json([
                        'success' => false,
                        'message' => $e->getMessage(),
                        'errors' => ['start_time' => [$e->getMessage()]]
                    ], 422);
                }

                // Return slot data decorated with teacher's original local time and day
                $slotData = $slot->toArray();
                $slotData['day_number'] = (int) $day;
                $slotData['start_time'] = $startTime;
                $slotData['end_time'] = $endTime;
                $slotData['storage_day_number'] = $storageDay;
                $slotData['storage_start_time'] = $storageStartTime;
                $createdSlots[] = $slotData;
            }
        }

        $teacher->refresh();
        // Return response with created slots and any duplicates that were skipped
        $response = [
            'success' => true,
            'timezone' => $teacherTimezone,
            'timezone_offset' => $teacherOffset,
            'message' => count($createdSlots) > 0 ? 'Time slots created successfully' : 'No new time slots created',
            'data' => $createdSlots,
        ];

        if (!empty($failedDuplicates)) {
            $response['skipped'] = $failedDuplicates;
            $response['message'] = count($createdSlots) > 0
                ? 'Some duplicate time slots were skipped'
                : 'All time slots were duplicates and were skipped';
        }
        TeacherProfileHelper::checkAndUpdateProfileCompleted($teacherId);

        return response()->json($response);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, $id)
    {
        $teacherId = $request->user()->id;
        $slot = AvailabilitySlot::where('id', $id)->where('teacher_id', $teacherId)->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $slot
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    public function update(Request $request, $id)
    {
        $teacher = $request->user();
        $teacher = $request->user();
        $teacherId = $teacher->id;

        // Resolve teacher's timezone and offset
        $inTimezone = $request->input('timezone') ?? $request->input('timezone_name') ?? $request->header('X-Timezone');
        $inOffset = $request->input('timezone_offset') ?? $request->input('teacher_timezone_offset');

        $teacherTimezone = \App\Helpers\CountryTimezone::fromInput($inTimezone, $inOffset, $teacher->timezone_name);
        $teacherOffset = $inOffset ?: \App\Helpers\CountryTimezone::getOffset($teacherTimezone);

        if ($teacherTimezone && $teacher->timezone !== $teacherTimezone) {
            $teacher->update(['timezone' => $teacherTimezone]);
        }

        $platformTimezone = config('app.timezone', 'Asia/Riyadh');
        $platformOffset = \App\Helpers\CountryTimezone::getOffset($platformTimezone);

        // If client sends a bulk available_times payload to replace/update availability for days,
        // handle it here: sync by replacing all slots for the given days.
        if ($request->has('available_times')) {
            $request->validate([
                'available_times' => 'required|array',
                'course_id' => 'nullable|exists:courses,id',
                'order_id' => 'nullable|exists:orders,id',
                'repeat_type' => 'nullable|in:none,weekly,daily',
                'timezone' => 'nullable|string',
                'timezone_name' => 'nullable|string',
                'timezone_offset' => 'nullable|string',
                'teacher_timezone_offset' => 'nullable|string',
            ]);

            $timeFormats = ['g:i A', 'h:i A', 'H:i', 'G:i'];

            return DB::transaction(function () use ($request, $teacher, $teacherId, $timeFormats, $teacherTimezone, $teacherOffset, $platformOffset) {
                $created = [];
                $failedDuplicates = [];

                foreach ($request->available_times as $entry) {
                    $day = $entry['day'] ?? $entry['day_number'] ?? null;
                    if (!$day)
                        continue;

                    // Remove existing slots for this teacher & day (matching storage days)
                    $approxStorageDayConverted = \App\Helpers\CountryTimezone::convertSlotBetweenOffsets('12:00', (int) $day, $teacherOffset, $platformOffset);
                    $storageDaysToClean = array_unique([(int) $day, (int) $approxStorageDayConverted['day']]);

                    $query = AvailabilitySlot::where('teacher_id', $teacherId)->whereIn('day_number', $storageDaysToClean);
                    if ($request->filled('course_id'))
                        $query->where('course_id', $request->course_id);
                    if ($request->filled('order_id'))
                        $query->where('order_id', $request->order_id);
                    $query->delete();

                    if (!isset($entry['times']) || !is_array($entry['times']))
                        continue;

                    foreach ($entry['times'] as $time) {
                        $timeStr = trim($time);
                        $parsed = null;
                        $timeStr = str_replace(['ص', 'م'], ['AM', 'PM'], $timeStr);
                        foreach ($timeFormats as $fmt) {
                            try {
                                $parsed = \Carbon\Carbon::createFromFormat($fmt, $timeStr);
                                if ($parsed)
                                    break;
                            } catch (\Exception $e) {
                            }
                        }
                        if (!$parsed)
                            continue;

                        $startTime = $parsed->format('H:i');
                        $endParsed = $parsed->copy()->addHour();
                        if ($endParsed->lessThanOrEqualTo($parsed)) {
                            return response()->json([
                                'success' => false,
                                'message' => "Invalid time slot '{$timeStr}': slot would end after midnight."
                            ], 422);
                        }
                        $endTime = $endParsed->format('H:i');

                        // Normalize slot from teacher local time to platform base storage time (Asia/Riyadh)
                        $converted = \App\Helpers\CountryTimezone::convertSlotBetweenOffsets(
                            $startTime,
                            (int) $day,
                            $teacherOffset,
                            $platformOffset
                        );
                        $storageDay = $converted['day'];
                        $storageStartTime = $converted['start_time'];
                        $storageEndTime = $converted['end_time'];

                        // Check for duplicate within the same scope
                        $duplicateQuery = AvailabilitySlot::where('teacher_id', $teacherId)
                            ->where('day_number', (int) $storageDay)
                            ->where('start_time', $storageStartTime);

                        if ($request->filled('course_id')) {
                            $duplicateQuery->where('course_id', $request->course_id);
                        }

                        if ($request->filled('order_id')) {
                            $duplicateQuery->where('order_id', $request->order_id);
                        }

                        if (!$request->filled('course_id') && !$request->filled('order_id')) {
                            $duplicateQuery->whereNull('course_id')
                                ->whereNull('order_id');
                        }

                        if ($duplicateQuery->exists()) {
                            $failedDuplicates[] = [
                                'day' => (int) $day,
                                'time' => $startTime,
                                'reason' => 'Time slot already exists for this day'
                            ];
                            continue;
                        }

                        try {
                            $slot = AvailabilitySlot::create([
                                'teacher_id' => $teacherId,
                                'course_id' => $request->course_id,
                                'order_id' => $request->order_id,
                                'day_number' => (int) $storageDay,
                                'start_time' => $storageStartTime,
                                'end_time' => $storageEndTime,
                                'is_available' => true,
                                'is_booked' => false,
                                'repeat_type' => $request->repeat_type ?? AvailabilitySlot::REPEAT_NONE,
                            ]);
                        } catch (\InvalidArgumentException $e) {
                            return response()->json([
                                'success' => false,
                                'message' => $e->getMessage(),
                                'errors' => ['start_time' => [$e->getMessage()]]
                            ], 422);
                        }

                        $slotData = $slot->toArray();
                        $slotData['day_number'] = (int) $day;
                        $slotData['start_time'] = $startTime;
                        $slotData['end_time'] = $endTime;
                        $created[] = $slotData;
                    }
                }

                $teacher->refresh();
                $response = [
                    'success' => true,
                    'timezone' => $teacherTimezone,
                    'timezone_offset' => $teacherOffset,
                    'message' => 'Availability synced',
                    'data' => $created
                ];

                if (!empty($failedDuplicates)) {
                    $response['skipped'] = $failedDuplicates;
                }
                TeacherProfileHelper::checkAndUpdateProfileCompleted($teacherId);

                return response()->json($response);
            });
        }

        // Otherwise fall back to single-slot update by id
        $slot = AvailabilitySlot::where('id', $id)->where('teacher_id', $teacherId)->firstOrFail();

        $request->validate([
            'day_number' => 'sometimes|integer|between:1,7',
            'start_time' => 'sometimes|string',
            'is_available' => 'sometimes|boolean',
            'repeat_type' => 'nullable|in:none,weekly,daily',
            'course_id' => 'nullable|exists:courses,id',
            'order_id' => 'nullable|exists:orders,id',
            'timezone' => 'nullable|string',
            'timezone_name' => 'nullable|string',
            'timezone_offset' => 'nullable|string',
            'teacher_timezone_offset' => 'nullable|string',
        ]);

        $data = $request->only(['day_number', 'start_time', 'is_available', 'repeat_type', 'course_id', 'order_id']);

        $displayDay = $data['day_number'] ?? null;
        $displayStartTime = $data['start_time'] ?? null;

        // If start_time is present, try multiple formats and normalize to platform storage
        if (isset($data['start_time'])) {
            $parsed = null;
            $startStr = str_replace(['ص', 'م'], ['AM', 'PM'], trim($data['start_time']));
            foreach (['g:i A', 'h:i A', 'H:i', 'G:i'] as $fmt) {
                try {
                    $parsed = \Carbon\Carbon::createFromFormat($fmt, $startStr);
                    if ($parsed)
                        break;
                } catch (\Exception $e) {
                }
            }
            if ($parsed) {
                $rawStartTime = $parsed->format('H:i');
                $endParsed = $parsed->copy()->addHour();
                if ($endParsed->lessThanOrEqualTo($parsed)) {
                    return response()->json([
                        'success' => false,
                        'message' => "Invalid time slot '{$data['start_time']}': slot would end after midnight."
                    ], 422);
                }
                $rawDay = $data['day_number'] ?? $slot->day_number;

                // Normalize to platform storage
                $converted = \App\Helpers\CountryTimezone::convertSlotBetweenOffsets(
                    $rawStartTime,
                    (int) $rawDay,
                    $teacherOffset,
                    $platformOffset
                );

                $data['day_number'] = $converted['day'];
                $data['start_time'] = $converted['start_time'];
                $data['end_time'] = $converted['end_time'];
            } else {
                return response()->json(['success' => false, 'message' => 'Invalid start_time format'], 422);
            }
        } elseif (isset($data['day_number'])) {
            // Day updated without start_time: convert current slot's teacher time to platform
            $currentTeacherTime = \App\Helpers\CountryTimezone::convertSlotBetweenOffsets(
                substr((string) $slot->start_time, 0, 5),
                (int) $slot->day_number,
                $platformOffset,
                $teacherOffset
            );
            $converted = \App\Helpers\CountryTimezone::convertSlotBetweenOffsets(
                $currentTeacherTime['start_time'],
                (int) $data['day_number'],
                $teacherOffset,
                $platformOffset
            );
            $data['day_number'] = $converted['day'];
            $data['start_time'] = $converted['start_time'];
            $data['end_time'] = $converted['end_time'];
        }

        // Check for duplicate only if changing day_number or start_time
        if (isset($data['day_number']) || isset($data['start_time'])) {
            $checkDay = $data['day_number'] ?? $slot->day_number;
            $checkTime = $data['start_time'] ?? $slot->start_time;

            $duplicateQuery = AvailabilitySlot::where('teacher_id', $teacherId)
                ->where('day_number', (int) $checkDay)
                ->where('start_time', $checkTime)
                ->where('id', '!=', $id); // Exclude current slot

            // Check within same course if applicable
            if (isset($data['course_id'])) {
                $duplicateQuery->where('course_id', $data['course_id']);
            } elseif ($slot->course_id) {
                $duplicateQuery->where('course_id', $slot->course_id);
            }

            // Check within same order if applicable
            if (isset($data['order_id'])) {
                $duplicateQuery->where('order_id', $data['order_id']);
            } elseif ($slot->order_id) {
                $duplicateQuery->where('order_id', $slot->order_id);
            }

            if ($duplicateQuery->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'A time slot already exists for this teacher on day ' . $checkDay . ' at ' . $checkTime
                ], 422);
            }
        }

        try {
            $slot->update($data);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors' => ['start_time' => [$e->getMessage()]]
            ], 422);
        }
        TeacherProfileHelper::checkAndUpdateProfileCompleted($teacherId);

        $slotData = $slot->toArray();
        if ($displayDay !== null) $slotData['day_number'] = (int) $displayDay;
        if ($displayStartTime !== null) $slotData['start_time'] = $displayStartTime;

        return response()->json([
            'success' => true,
            'timezone' => $teacherTimezone,
            'timezone_offset' => $teacherOffset,
            'message' => 'Slot updated successfully',
            'data' => $slotData
        ]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $id)
    {
        $teacherId = $request->user()->id;
        $slot = AvailabilitySlot::where('id', $id)->where('teacher_id', $teacherId)->firstOrFail();

        try {
            $slot->delete();
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors' => ['id' => [$e->getMessage()]]
            ], 422);
        }
        TeacherProfileHelper::checkAndUpdateProfileCompleted($teacherId);

        return response()->json([
            'success' => true,
            'message' => 'Slot deleted successfully'
        ]);
    }

    /**
     * Delete multiple slots by IDs (batch delete)
     * Used by Flutter to delete removed time slots
     * Expects: ?ids=1,2,3 in query string
     */
    public function destroyBatch(Request $request)
    {
        $request->validate([
            'ids' => 'required|string',
        ]);

        $teacherId = $request->user()->id;
        // Parse comma-separated IDs from query string
        $idsString = $request->input('ids', '');
        $ids = array_filter(explode(',', $idsString), 'is_numeric');
        $ids = array_map('intval', $ids);

        if (empty($ids)) {
            return response()->json([
                'success' => false,
                'message' => 'No valid IDs provided'
            ], 422);
        }

        // Get slots that belong to this teacher
        $slots = AvailabilitySlot::whereIn('id', $ids)
            ->where('teacher_id', $teacherId)
            ->get();

        $deletedIds = [];
        $failedIds = [];

        foreach ($slots as $slot) {
            try {
                $slot->delete();
                $deletedIds[] = $slot->id;
            } catch (\Exception $e) {
                $failedIds[] = [
                    'id' => $slot->id,
                    'error' => $e->getMessage()
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Batch delete completed',
            'deleted' => $deletedIds,
            'failed' => $failedIds
        ]);
    }
}
