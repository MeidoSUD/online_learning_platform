<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Review;
use App\Models\User;
use App\Models\Course;

class ReviewController extends Controller
{
    /**
     * Get all reviews for a user (teacher or student) or a course.
     * Pass ?user_id= or ?course_id= as query param.
     */
    public function index(Request $request)
    {
        if ($request->has('user_id')) {
            $reviews = Review::where('reviewed_id', $request->user_id)->with('reviewer')->get();
        } elseif ($request->has('course_id')) {
            $reviews = Review::where('course_id', $request->course_id)->with('reviewer')->get();
        } else {
            // All reviews (admin use)
            $reviews = Review::with('reviewer')->get();
        }

        return response()->json([
            'success' => true,
            'data' => $reviews
        ]);
    }

    /**
     * Store a new review ( course).
     * reviewer_id is the authenticated user.
     */
    public function store(Request $request)
    {
        
        $request->validate([
            'reviewed_id' => 'nullable|exists:users,id',
            'course_id'   => 'nullable|exists:courses,id',
            'rating'      => 'required|integer|min:1|max:5',
            'comment'     => 'nullable|string|max:1000',
        ]);

        if (!$request->reviewed_id && !$request->course_id) {
            return response()->json(['success' => false, 'message' => 'reviewed_id or course_id is required'], 422);
        }

        $review = Review::create([
            'reviewer_id' => $request->user()->id,
            'reviewed_id' => $request->reviewed_id,
            'course_id'   => $request->course_id,
            'rating'      => $request->rating,
            'comment'     => $request->comment,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review added successfully',
            'data' => $review
        ], 201);
    }

    /**
     * Store a new review for a teacher after a completed session.
     * Only students can review teachers, and only for completed sessions.
     */
    public function storeTeacherReview(Request $request, $teacher_id)
    {
        $request->validate([
            'rating'      => 'required|integer|min:1|max:5',
            'comment'     => 'nullable|string|max:1000',
            'session_id'  => 'required|exists:sessions,id'
        ]);

        $student = $request->user();

        // Check if session exists and belongs to this student
        $session = \App\Models\Sessions::where('id', $request->session_id)
            ->where('student_id', $student->id)
            ->where('teacher_id', $teacher_id)
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found or does not belong to you'
            ], 404);
        }

        // Check if session is completed or ended
        if (!in_array($session->status, [
            \App\Models\Sessions::STATUS_COMPLETED,
            \App\Models\Sessions::STATUS_ENDED,
        ])) {
            return response()->json([
                'success' => false,
                'message' => 'You can only review completed or ended sessions'
            ], 422);
        }

        // Check if student already reviewed this session
        $existingReview = Review::where('session_id', $request->session_id)
            ->where('reviewer_id', $student->id)
            ->first();

        if ($existingReview) {
            return response()->json([
                'success' => false,
                'message' => 'You have already reviewed this session'
            ], 422);
        }

        $review = Review::create([
            'reviewer_id' => $student->id,
            'reviewed_id' => $teacher_id,
            'session_id'  => $request->session_id,
            'rating'      => $request->rating,
            'comment'     => $request->comment,
        ]);

        // Notify the teacher that a student has reviewed them
        try {
            $teacher = \App\Models\User::find($teacher_id);

            if ($teacher) {
                $ns = new \App\Services\NotificationService();

                $title = app()->getLocale() == 'ar'
                    ? 'تقييم جديد'
                    : 'New review';
                $msg = app()->getLocale() == 'ar'
                    ? "{$student->first_name} {$student->last_name} قيّم جلستك بـ {$request->rating}/5."
                    : "{$student->first_name} {$student->last_name} rated your session {$request->rating}/5.";

                $ns->send($teacher, 'review_received', $title, $msg, [
                    'review_id'   => $review->id,
                    'session_id'  => $request->session_id,
                    'student_id'  => $student->id,
                    'teacher_id'  => $teacher_id,
                    'rating'      => $request->rating,
                ]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to send review notification', [
                'review_id' => $review->id,
                'teacher_id' => $teacher_id,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Review added successfully',
            'data' => $review->load(['reviewer', 'reviewedUser', 'session'])
        ], 201);
    }

    /**
     * Show a specific review by id.
     */
    public function show($id)
    {
        $review = Review::with(['reviewer'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $review
        ]);
    }

    /**
     * Update a review (only by the reviewer).
     */
    public function update(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        if ($review->reviewer_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'rating'  => 'sometimes|required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review->update($request->only(['rating', 'comment']));

        return response()->json([
            'success' => true,
            'message' => 'Review updated successfully',
            'data' => $review
        ]);
    }

    /**
     * Delete a review (only by the reviewer).
     */
    public function destroy(Request $request, $id)
    {
        $review = Review::findOrFail($id);

        if ($review->reviewer_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $review->delete();

        return response()->json([
            'success' => true,
            'message' => 'Review deleted successfully'
        ]);
    }

    /**
     * Get all reviews written by the authenticated user (who review).
     */
    public function myReviews(Request $request)
    {
        $reviews = Review::where('reviewer_id', $request->user()->id)->with(['reviewedUser', 'course', 'session'])->get();

        return response()->json([
            'success' => true,
            'data' => $reviews
        ]);
    }

    /**
     * Get review for a specific session by the authenticated user.
     */
    public function getSessionReview(Request $request, $session_id)
    {
        $user = $request->user();

        // Check if session exists and user is part of it
        $session = \App\Models\Sessions::where('id', $session_id)
            ->where(function($query) use ($user) {
                $query->where('student_id', $user->id)
                      ->orWhere('teacher_id', $user->id);
            })
            ->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found'
            ], 404);
        }

        // Get review for this session
        $review = Review::where('session_id', $session_id)
            ->with(['reviewer', 'reviewedUser'])
            ->first();

        return response()->json([
            'success' => true,
            'data' => $review,
            'can_review' => in_array($session->status, [
                               \App\Models\Sessions::STATUS_COMPLETED,
                               \App\Models\Sessions::STATUS_ENDED,
                           ]) && 
                           $user->id === $session->student_id && 
                           !$review
        ]);
    }

    /**
     * Get all reviews for sessions of the authenticated user (student or teacher).
     */
    public function mySessionReviews(Request $request)
    {
        $user = $request->user();

        // Get reviews for sessions where user is student or teacher
        $reviews = Review::whereHas('session', function($query) use ($user) {
            $query->where('student_id', $user->id)
                  ->orWhere('teacher_id', $user->id);
        })
        ->with(['reviewer', 'reviewedUser', 'session'])
        ->get();

        return response()->json([
            'success' => true,
            'data' => $reviews
        ]);
    }
}
