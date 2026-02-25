<?php

 namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\User;
use App\Models\CourseCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Admin Courses Management Controller
 *
 * API Documentation:
 *
 * GET /api/admin/courses
 * - List all courses with optional filtering and pagination
 * - Query params: status, teacher_id, category_id, service_id, approval_status, page, per_page
 * - Response: { success: true, data: [...], total: number, current_page: number, last_page: number }
 *
 * GET /api/admin/courses/{id}
 * - Get course details with teacher and enrollment info
 * - Response: { success: true, data: {...} }
 *
 * PUT /api/admin/courses/{id}/approve
 * - Approve a course for publishing
 * - Response: { success: true, message: "Course approved", data: {...} }
 *
 * PUT /api/admin/courses/{id}/reject
 * - Reject a course with reason
 * - Body: { rejection_reason: string }
 * - Response: { success: true, message: "Course rejected", data: {...} }
 *
 * PUT /api/admin/courses/{id}/status
 * - Update course status (active/inactive)
 * - Body: { status: 1|0 }
 * - Response: { success: true, message: "Course status updated", data: {...} }
 *
 * DELETE /api/admin/courses/{id}
 * - Delete course (if no enrollments)
 * - Response: { success: true, message: "Course deleted" }
 *
 * GET /api/admin/courses/pending-approval
 * - Get courses pending admin approval
 * - Response: { success: true, data: [...], total: number }
 *
 * PUT /api/admin/courses/{id}/feature
 * - Mark course as featured
 * - Body: { is_featured: boolean }
 * - Response: { success: true, message: "Course featured status updated", data: {...} }
 */
class CourseAdminController extends Controller
{
    /**
     * Get all courses with optional filtering and pagination
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Course::with(['teacher', 'category', 'enrollments']);

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Filter by teacher
            if ($request->has('teacher_id')) {
                $query->where('teacher_id', $request->teacher_id);
            }

            // Filter by category
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            // Filter by service
            if ($request->has('service_id')) {
                $query->where('service_id', $request->service_id);
            }

            // Filter by approval status
            if ($request->has('approval_status')) {
                $query->where('approval_status', $request->approval_status);
            }

            // Search by course name
            if ($request->has('search')) {
                $query->where('name', 'like', '%' . $request->search . '%');
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $courses = $query->paginate($perPage);

            $transformedCourses = collect($courses->items())->transform(function ($course) {
                return [
                    'id' => $course->id,
                    'name' => $course->name,
                    'description' => $course->description,
                    'course_type' => $course->course_type,
                    'price' => $course->price,
                    'duration_hours' => $course->duration_hours,
                    'status' => $course->status,
                    'approval_status' => $course->approval_status,
                    'is_featured' => $course->is_featured ?? false,
                    'teacher' => $course->teacher ? [
                        'id' => $course->teacher->id,
                        'first_name' => $course->teacher->first_name,
                        'last_name' => $course->teacher->last_name,
                        'email' => $course->teacher->email,
                    ] : null,
                    'category' => $course->category ? [
                        'id' => $course->category->id,
                        'name' => $course->category->name_ar,
                    ] : null,
                    'enrollments_count' => $course->enrollments->count(),
                    'created_at' => $course->created_at,
                    'updated_at' => $course->updated_at,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Courses retrieved successfully',
                'data' => $transformedCourses,
                'pagination' => [
                    'total' => $courses->total(),
                    'per_page' => $courses->perPage(),
                    'current_page' => $courses->currentPage(),
                    'last_page' => $courses->lastPage(),
                    'from' => $courses->firstItem(),
                    'to' => $courses->lastItem(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching courses', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve courses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get course details
     */
    public function show($id): JsonResponse
    {
        try {
            $course = Course::with([
                'teacher',
                'category',
                'enrollments.student',
                'lessons',
                'availabilitySlots'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Course retrieved successfully',
                'data' => [
                    'id' => $course->id,
                    'name' => $course->name,
                    'description' => $course->description,
                    'course_type' => $course->course_type,
                    'price' => $course->price,
                    'duration_hours' => $course->duration_hours,
                    'status' => $course->status,
                    'approval_status' => $course->approval_status,
                    'rejection_reason' => $course->rejection_reason,
                    'is_featured' => $course->is_featured ?? false,
                    'teacher' => $course->teacher ? [
                        'id' => $course->teacher->id,
                        'first_name' => $course->teacher->first_name,
                        'last_name' => $course->teacher->last_name,
                        'email' => $course->teacher->email,
                        'phone' => $course->teacher->phone,
                    ] : null,
                    'category' => $course->category ? [
                        'id' => $course->category->id,
                        'name' => $course->category->name,
                    ] : null,
                    'enrollments' => $course->enrollments->map(function ($enrollment) {
                        return [
                            'id' => $enrollment->id,
                            'student' => $enrollment->student ? [
                                'id' => $enrollment->student->id,
                                'first_name' => $enrollment->student->first_name,
                                'last_name' => $enrollment->student->last_name,
                                'email' => $enrollment->student->email,
                            ] : null,
                            'status' => $enrollment->status,
                            'enrolled_at' => $enrollment->created_at,
                        ];
                    }),
                    'lessons_count' => $course->lessons->count(),
                    'availability_slots_count' => $course->availabilitySlots->count(),
                    'enrollments_count' => $course->enrollments->count(),
                    'created_at' => $course->created_at,
                    'updated_at' => $course->updated_at,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Course not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching course', ['course_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve a course for publishing
     */
    public function approve($id): JsonResponse
    {
        try {
            $course = Course::findOrFail($id);

            if ($course->approval_status === 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Course is already approved'
                ], 409);
            }

            $course->update([
                'approval_status' => 'approved',
                'rejection_reason' => null,
                'status' => 1, // Activate the course
            ]);

            Log::info('Course approved', ['course_id' => $course->id, 'teacher_id' => $course->teacher_id]);

            return response()->json([
                'success' => true,
                'message' => 'Course approved successfully',
                'data' => [
                    'id' => $course->id,
                    'name' => $course->name,
                    'approval_status' => $course->approval_status,
                    'status' => $course->status,
                    'approved_at' => $course->updated_at,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Course not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error approving course', ['course_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a course with reason
     */
    public function reject(Request $request, $id): JsonResponse
    {
        $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        try {
            $course = Course::findOrFail($id);

            if ($course->approval_status === 'rejected') {
                return response()->json([
                    'success' => false,
                    'message' => 'Course is already rejected'
                ], 409);
            }

            $course->update([
                'approval_status' => 'rejected',
                'rejection_reason' => $request->rejection_reason,
                'status' => 0, // Deactivate the course
            ]);

            Log::info('Course rejected', ['course_id' => $course->id, 'teacher_id' => $course->teacher_id, 'reason' => $request->rejection_reason]);

            return response()->json([
                'success' => true,
                'message' => 'Course rejected successfully',
                'data' => [
                    'id' => $course->id,
                    'name' => $course->name,
                    'approval_status' => $course->approval_status,
                    'rejection_reason' => $course->rejection_reason,
                    'status' => $course->status,
                    'rejected_at' => $course->updated_at,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Course not found'
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error rejecting course', ['course_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update course status (active/inactive)
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:published,draft',
        ]);

        try {
            $course = Course::findOrFail($id);

            $course->update([
                'status' => $request->status,
            ]);

            Log::info('Course status updated', ['course_id' => $course->id, 'status' => $request->status]);

            return response()->json([
                'success' => true,
                'message' => 'Course status updated successfully',
                'data' => [
                    'id' => $course->id,
                    'name' => $course->name,
                    'status' => $course->status,
                    'updated_at' => $course->updated_at,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Course not found'
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating course status', ['course_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update course status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark course as featured
     */
    public function feature(Request $request, $id): JsonResponse
    {
        $request->validate([
            'is_featured' => 'required|boolean',
        ]);

        try {
            $course = Course::findOrFail($id);

            $course->update([
                'is_featured' => $request->is_featured,
            ]);

            Log::info('Course featured status updated', ['course_id' => $course->id, 'is_featured' => $request->is_featured]);

            return response()->json([
                'success' => true,
                'message' => 'Course featured status updated successfully',
                'data' => [
                    'id' => $course->id,
                    'name' => $course->name,
                    'is_featured' => $course->is_featured,
                    'updated_at' => $course->updated_at,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Course not found'
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating course featured status', ['course_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update course featured status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete course
     */
    public function destroy($id): JsonResponse
    {
        try {
            $course = Course::findOrFail($id);

            // Check if course has enrollments
            $enrollmentsCount = $course->enrollments()->count();
            if ($enrollmentsCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete course that has student enrollments',
                    'data' => [
                        'enrollments_count' => $enrollmentsCount,
                    ]
                ], 409);
            }

            $course->delete();

            Log::info('Course deleted', ['course_id' => $course->id, 'teacher_id' => $course->teacher_id]);

            return response()->json([
                'success' => true,
                'message' => 'Course deleted successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Course not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting course', ['course_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get courses pending approval
     */
    public function pendingApproval(): JsonResponse
    {
        try {
            $courses = Course::with(['teacher', 'category'])
                ->where('approval_status', 'pending')
                ->orWhereNull('approval_status')
                ->get()
                ->map(function ($course) {
                    return [
                        'id' => $course->id,
                        'name' => $course->name,
                        'description' => $course->description,
                        'course_type' => $course->course_type,
                        'price' => $course->price,
                        'teacher' => $course->teacher ? [
                            'id' => $course->teacher->id,
                            'first_name' => $course->teacher->first_name,
                            'last_name' => $course->teacher->last_name,
                            'email' => $course->teacher->email,
                        ] : null,
                        'category' => $course->category ? [
                            'id' => $course->category->id,
                            'name' => $course->category->name,
                        ] : null,
                        'created_at' => $course->created_at,
                        'submitted_at' => $course->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Pending approval courses retrieved successfully',
                'total' => count($courses),
                'data' => $courses,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching pending approval courses', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve pending approval courses',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
