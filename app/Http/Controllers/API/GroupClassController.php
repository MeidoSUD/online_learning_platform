<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\GroupClass;
use App\Models\GroupClassAvailabilitySlot;
use App\Models\GroupClassLesson;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class GroupClassController extends Controller
{
    public function index(Request $request)
    {
        $teacherId = $request->user()->id;

        $classes = GroupClass::with([
            'educationLevel',
            'class',
            'subject',
            'lessons' => function ($q) {
                $q->withCount(['bookingLessons as students_count' => function ($bq) {
                    $bq->whereHas('booking', function ($query) {
                        $query->whereNotIn('status', ['cancelled']);
                    });
                }]);
            },
        ])
            ->where('teacher_id', $teacherId)
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $classes,
        ]);
    }

    public function show(Request $request, $id)
    {
        $teacherId = $request->user()->id;

        $groupClass = GroupClass::with([
            'educationLevel',
            'class',
            'subject',
            'lessons' => function ($q) {
                $q->withCount(['bookingLessons as students_count' => function ($bq) {
                    $bq->whereHas('booking', function ($query) {
                        $query->whereNotIn('status', ['cancelled']);
                    });
                }]);
            },
            'lessons.groupClassTimeSlot',
        ])
            ->where('teacher_id', $teacherId)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $groupClass,
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'education_level_id' => 'required|integer|exists:education_levels,id',
            'class_id' => 'required|integer|exists:classes,id',
            'subject_id' => 'required|integer|exists:subjects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'total_sessions' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $teacherId = $request->user()->id;

        $groupClass = GroupClass::create([
            'teacher_id' => $teacherId,
            'education_level_id' => $request->education_level_id,
            'class_id' => $request->class_id,
            'subject_id' => $request->subject_id,
            'title' => $request->title,
            'description' => $request->description,
            'start_date' => $request->start_date,
            'total_sessions' => $request->total_sessions ?? 1,
            'status' => 'active',
        ]);

        $groupClass->load(['educationLevel', 'class', 'subject']);

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ بيانات الحصة الجماعية بنجاح',
            'data' => $groupClass,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $teacherId = $request->user()->id;
        $groupClass = GroupClass::where('teacher_id', $teacherId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'education_level_id' => 'sometimes|required|integer|exists:education_levels,id',
            'class_id' => 'sometimes|required|integer|exists:classes,id',
            'subject_id' => 'sometimes|required|integer|exists:subjects,id',
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'sometimes|required|date',
            'total_sessions' => 'nullable|integer|min:1',
            'status' => 'nullable|string|in:active,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $groupClass->update($request->only([
            'education_level_id',
            'class_id',
            'subject_id',
            'title',
            'description',
            'start_date',
            'total_sessions',
            'status',
        ]));

        $groupClass->load(['educationLevel', 'class', 'subject']);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث بيانات الحصة الجماعية بنجاح',
            'data' => $groupClass,
        ]);
    }

    public function storeLesson(Request $request, $id)
    {
        $teacherId = $request->user()->id;
        $groupClass = GroupClass::where('teacher_id', $teacherId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'slot_id' => 'required|integer|exists:group_class_time_slots,id',
            'topic' => 'nullable|string',
            'lesson_id' => 'nullable|integer|exists:group_class_lessons,id',
            'lesson_date' => 'nullable|date',
            'lesson_number' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $slot = GroupClassAvailabilitySlot::where('teacher_id', $teacherId)->find($request->slot_id);
        if (!$slot) {
            return response()->json([
                'success' => false,
                'message' => 'موعد الحصة غير متاح أو غير تابع للمعلم',
            ], 422);
        }

        $existingLesson = null;
        if (!empty($request->lesson_id)) {
            $existingLesson = GroupClassLesson::where('group_class_id', $groupClass->id)
                ->where('teacher_id', $teacherId)
                ->find($request->lesson_id);
        }

        $isSameSlot = $existingLesson && (int)$existingLesson->group_class_time_slot_id === (int)$slot->id;

        if (!$isSameSlot && ($slot->is_booked || !$slot->is_available)) {
            return response()->json([
                'success' => false,
                'message' => 'هذا الوقت محجوز بالفعل وغير متاح، يرجى اختيار موعد آخر',
            ], 422);
        }

        $savedLesson = DB::transaction(function () use ($request, $groupClass, $teacherId, $slot, $existingLesson) {
            if ($existingLesson && $existingLesson->group_class_time_slot_id && (int)$existingLesson->group_class_time_slot_id !== (int)$slot->id) {
                GroupClassAvailabilitySlot::where('id', $existingLesson->group_class_time_slot_id)
                    ->update([
                        'is_available' => true,
                        'is_booked' => false,
                    ]);
            }

            $slot->update([
                'is_available' => false,
                'is_booked' => true,
            ]);

            $startTime = $slot->start_time instanceof Carbon
                ? $slot->start_time->format('H:i:s')
                : (string) $slot->start_time;

            $duration = $slot->duration ?? 60;
            $endTime = $slot->end_time
                ? ($slot->end_time instanceof Carbon ? $slot->end_time->format('H:i:s') : (string) $slot->end_time)
                : Carbon::parse($startTime)->addMinutes($duration)->format('H:i:s');

            $lessonDate = !empty($request->lesson_date)
                ? Carbon::parse($request->lesson_date)->format('Y-m-d')
                : ($slot->date ? Carbon::parse($slot->date)->format('Y-m-d') : Carbon::now()->format('Y-m-d'));

            if ($existingLesson) {
                $existingLesson->update([
                    'group_class_time_slot_id' => $slot->id,
                    'topic' => $request->topic,
                    'lesson_date' => $lessonDate,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'duration' => $duration,
                ]);
                $lesson = $existingLesson;
            } else {
                $lessonNumber = $request->lesson_number ?? (GroupClassLesson::where('group_class_id', $groupClass->id)->count() + 1);
                $lesson = GroupClassLesson::create([
                    'teacher_id' => $teacherId,
                    'group_class_id' => $groupClass->id,
                    'group_class_time_slot_id' => $slot->id,
                    'lesson_number' => $lessonNumber,
                    'title' => $groupClass->title ?? ('الحصة ' . $lessonNumber),
                    'topic' => $request->topic,
                    'lesson_date' => $lessonDate,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'duration' => $duration,
                    'status' => 'scheduled',
                ]);
            }

            $groupClass->update([
                'total_sessions' => GroupClassLesson::where('group_class_id', $groupClass->id)->count(),
            ]);

            return $lesson;
        });

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ الحصة بنجاح',
            'data' => $savedLesson->load('groupClassTimeSlot'),
        ]);
    }

    public function destroyLesson(Request $request, $id, $lessonId)
    {
        $teacherId = $request->user()->id;
        $groupClass = GroupClass::where('teacher_id', $teacherId)->findOrFail($id);
        $lesson = GroupClassLesson::where('group_class_id', $groupClass->id)
            ->where('teacher_id', $teacherId)
            ->find($lessonId);

        if (!$lesson) {
            $groupClass->update([
                'total_sessions' => GroupClassLesson::where('group_class_id', $groupClass->id)->count(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم حذف الحصة بنجاح',
            ]);
        }

        DB::transaction(function () use ($lesson, $groupClass) {
            if ($lesson->group_class_time_slot_id) {
                GroupClassAvailabilitySlot::where('id', $lesson->group_class_time_slot_id)
                    ->update([
                        'is_available' => true,
                        'is_booked' => false,
                    ]);
            }

            $lesson->delete();

            $groupClass->update([
                'total_sessions' => GroupClassLesson::where('group_class_id', $groupClass->id)->count(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الحصة بنجاح',
        ]);
    }

    public function storeLessons(Request $request, $id)
    {
        $teacherId = $request->user()->id;
        $groupClass = GroupClass::where('teacher_id', $teacherId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'lessons' => 'required|array|min:1',
            'lessons.*.slot_id' => 'required|integer|exists:group_class_time_slots,id',
            'lessons.*.topic' => 'nullable|string',
            'lessons.*.lesson_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $existingSlotIds = GroupClassLesson::where('group_class_id', $groupClass->id)
            ->whereNotNull('group_class_time_slot_id')
            ->pluck('group_class_time_slot_id')
            ->map(fn($v) => (int)$v)
            ->toArray();

        foreach ($request->lessons as $lessonItem) {
            $slot = GroupClassAvailabilitySlot::where('teacher_id', $teacherId)->find($lessonItem['slot_id']);
            if (!$slot) {
                return response()->json([
                    'success' => false,
                    'message' => 'أحد المواعيد المحددة غير متاح أو غير تابع للمعلم',
                ], 422);
            }
            if (!in_array((int)$slot->id, $existingSlotIds, true) && ($slot->is_booked || !$slot->is_available)) {
                return response()->json([
                    'success' => false,
                    'message' => 'الموعد المحدد للحصة محجوز بالفعل وغير متاح، يرجى اختيار موعد آخر',
                ], 422);
            }
        }

        $createdLessons = [];

        DB::transaction(function () use ($request, $groupClass, $teacherId, $existingSlotIds, &$createdLessons) {
            $newSlotIds = array_map(fn($l) => (int)$l['slot_id'], $request->lessons);
            $slotsToFree = array_diff($existingSlotIds, $newSlotIds);

            if (!empty($slotsToFree)) {
                GroupClassAvailabilitySlot::whereIn('id', $slotsToFree)
                    ->update([
                        'is_available' => true,
                        'is_booked' => false,
                    ]);
            }

            GroupClassLesson::where('group_class_id', $groupClass->id)->delete();

            $index = 1;
            foreach ($request->lessons as $lessonData) {
                $slot = GroupClassAvailabilitySlot::find($lessonData['slot_id']);
                if (!$slot) {
                    continue;
                }

                $slot->update([
                    'is_available' => false,
                    'is_booked' => true,
                ]);

                $startTime = $slot->start_time instanceof Carbon
                    ? $slot->start_time->format('H:i:s')
                    : (string) $slot->start_time;

                $duration = $slot->duration ?? 60;
                $endTime = $slot->end_time
                    ? ($slot->end_time instanceof Carbon ? $slot->end_time->format('H:i:s') : (string) $slot->end_time)
                    : Carbon::parse($startTime)->addMinutes($duration)->format('H:i:s');

                $lessonDate = !empty($lessonData['lesson_date'])
                    ? Carbon::parse($lessonData['lesson_date'])->format('Y-m-d')
                    : ($slot->date ? Carbon::parse($slot->date)->format('Y-m-d') : Carbon::now()->format('Y-m-d'));

                $lesson = GroupClassLesson::create([
                    'teacher_id' => $teacherId,
                    'group_class_id' => $groupClass->id,
                    'group_class_time_slot_id' => $slot->id,
                    'lesson_number' => $index,
                    'title' => $groupClass->title ?? ('الحصة ' . $index),
                    'topic' => $lessonData['topic'] ?? null,
                    'lesson_date' => $lessonDate,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                    'duration' => $duration,
                    'status' => 'scheduled',
                ]);

                $createdLessons[] = $lesson;
                $index++;
            }

            $groupClass->update([
                'total_sessions' => count($createdLessons),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ حصص المجموعة بنجاح',
            'data' => $createdLessons,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $teacherId = $request->user()->id;
        $groupClass = GroupClass::where('teacher_id', $teacherId)->findOrFail($id);

        DB::transaction(function () use ($groupClass) {
            $slotIds = GroupClassLesson::where('group_class_id', $groupClass->id)
                ->whereNotNull('group_class_time_slot_id')
                ->pluck('group_class_time_slot_id')
                ->filter()
                ->toArray();

            if (!empty($slotIds)) {
                GroupClassAvailabilitySlot::whereIn('id', $slotIds)
                    ->update([
                        'is_available' => true,
                        'is_booked' => false,
                    ]);
            }

            $groupClass->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الحصة الجماعية بنجاح',
        ]);
    }

    public function getTeacherGroupClasses($teacherId)
    {
        $classes = GroupClass::with([
            'educationLevel',
            'class',
            'subject',
            'lessons' => function ($q) {
                $q->withCount(['bookingLessons as students_count' => function ($bq) {
                    $bq->whereHas('booking', function ($query) {
                        $query->whereNotIn('status', ['cancelled']);
                    });
                }]);
            },
            'lessons.groupClassTimeSlot',
        ])
            ->where('teacher_id', $teacherId)
            ->where('status', '!=', 'cancelled')
            ->orderByDesc('id')
            ->get();

        foreach ($classes as $class) {
            $actualCount = $class->lessons->count();
            if ($actualCount > 0 && (int)$class->total_sessions !== $actualCount) {
                $class->total_sessions = $actualCount;
                $class->save();
            }
        }

        return response()->json([
            'success' => true,
            'data' => $classes,
        ]);
    }
}
