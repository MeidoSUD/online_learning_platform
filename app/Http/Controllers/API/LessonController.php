<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LessonController extends Controller
{
    // Student: Get course lessons
    public function index(Request $request, int $course_id): JsonResponse
    {
        $user = $request->user();
        
        // Check if student is enrolled
        $isEnrolled = DB::table('course_student')
            ->where('course_id', $course_id)
            ->where('user_id', $user->id)
            ->exists();

        if (!$isEnrolled) {
            return response()->json([
                'success' => false,
                'message' => 'Not enrolled in this course'
            ], 403);
        }

        $lessons = Lesson::where('course_id', $course_id)
            ->orderBy('order', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $lessons
        ]);
    }

    // Teacher: Create lesson
    public function store(Request $request, int $course_id): JsonResponse
    {
        $request->validate([
            'title_en' => 'required|string|max:255',
            'title_ar' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'content' => 'nullable|string',
            'video_url' => 'nullable|url',
            'duration_minutes' => 'nullable|integer|min:1|max:600',
            'order' => 'nullable|integer|min:1',
            'is_free' => 'boolean',
        ]);

        // Check if teacher owns the course
        $course = Course::where('teacher_id', $request->user()->id)
            ->findOrFail($course_id);

        $lesson = Lesson::create([
            'course_id' => $course_id,
            'title_en' => $request->input('title_en'),
            'title_ar' => $request->input('title_ar'),
            'description' => $request->input('description'),
            'content' => $request->input('content'),
            'video_url' => $request->input('video_url'),
            'duration_minutes' => $request->input('duration_minutes'),
            'order' => $request->input('order'),
            'is_free' => $request->input('is_free', false),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lesson created successfully',
            'data' => $lesson
        ], 201);
    }

    // Student: Get lesson details
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        
        $lesson = Lesson::with('course')->findOrFail($id);

        // Check if student is enrolled in the course
        $isEnrolled = DB::table('course_student')
            ->where('course_id', $lesson->course_id)
            ->where('user_id', $user->id)
            ->exists();

        if (!$isEnrolled) {
            return response()->json([
                'success' => false,
                'message' => 'Not enrolled in this course'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $lesson
        ]);
    }

    // Teacher: Update lesson
    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'title_en' => 'sometimes|required|string|max:255',
            'title_ar' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'content' => 'nullable|string',
            'video_url' => 'nullable|url',
            'duration_minutes' => 'nullable|integer|min:1|max:600',
            'order' => 'nullable|integer|min:1',
            'is_free' => 'boolean',
        ]);

        $lesson = Lesson::with('course')->findOrFail($id);

        // Check if teacher owns the course
        if ($lesson->course->teacher_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $lesson->update($request->only([
            'title_en', 'title_ar', 'description', 'content',
            'video_url', 'duration_minutes', 'order', 'is_free'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Lesson updated successfully',
            'data' => $lesson
        ]);
    }

    // Teacher: Delete lesson
    public function destroy(Request $request, int $id): JsonResponse
    {
        $lesson = Lesson::with('course')->findOrFail($id);

        // Check if teacher owns the course
        if ($lesson->course->teacher_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $lesson->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lesson deleted successfully'
        ]);
    }

    // Student: Mark lesson as complete
    public function markComplete(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        
        $lesson = Lesson::findOrFail($id);

        // Check if student is enrolled
        $isEnrolled = DB::table('course_student')
            ->where('course_id', $lesson->course_id)
            ->where('user_id', $user->id)
            ->exists();

        if (!$isEnrolled) {
            return response()->json([
                'success' => false,
                'message' => 'Not enrolled in this course'
            ], 403);
        }

        // Mark as complete (you need to create lesson_completions table)
        DB::table('lesson_completions')->updateOrInsert(
            [
                'lesson_id' => $id,
                'user_id' => $user->id
            ],
            [
                'completed_at' => now(),
                'updated_at' => now()
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Lesson marked as complete',
            'data' => [
                'lesson_id' => $id,
                'completed_at' => now()
            ]
        ]);
    }
}