<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\ClassModel;
use App\Models\EducationLevel;
use App\Models\Services;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Admin Subjects Management Controller
 *
 * API Documentation:
 *
 * GET /api/admin/subjects
 * - List all subjects with optional filtering
 * - Query params: class_id, education_level_id, service_id, status, include_deleted
 * - Response: { success: true, data: [...], total: number }
 *
 * POST /api/admin/subjects
 * - Create a new subject
 * - Body: { name_en: string, name_ar: string, class_id: number, education_level_id: number, service_id: number, status: 1|0 }
 * - Response: { success: true, message: "Subject created", data: {...} }
 *
 * GET /api/admin/subjects/{id}
 * - Get subject details with relationships
 * - Response: { success: true, data: {...} }
 *
 * PUT /api/admin/subjects/{id}
 * - Update subject information
 * - Body: { name_en?: string, name_ar?: string, class_id?: number, education_level_id?: number, service_id?: number, status?: 1|0 }
 * - Response: { success: true, message: "Subject updated", data: {...} }
 *
 * DELETE /api/admin/subjects/{id}
 * - Soft delete subject (if no teachers attached)
 * - Response: { success: true, message: "Subject deleted" }
 *
 * DELETE /api/admin/subjects/{id}/force
 * - Permanently delete subject (if no teachers attached)
 * - Response: { success: true, message: "Subject permanently deleted" }
 *
 * POST /api/admin/subjects/{id}/restore
 * - Restore soft-deleted subject
 * - Response: { success: true, message: "Subject restored", data: {...} }
 */
class SubjectAdminController extends Controller
{
    /**
     * Get all subjects with optional filtering
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Subject::with(['class', 'educationLevel', 'service', 'teachers']);

            // Include soft-deleted if requested
            if ($request->boolean('include_deleted')) {
                // $query->withTrashed();
            }

            // Filter by class
            if ($request->has('class_id')) {
                $query->where('class_id', $request->class_id);
            }

            // Filter by education level
            if ($request->has('education_level_id')) {
                $query->where('education_level_id', $request->education_level_id);
            }

            // Filter by service
            if ($request->has('service_id')) {
                $query->where('service_id', $request->service_id);
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $subjects = $query->get()->map(function ($subject) {
                return [
                    'id' => $subject->id,
                    'name_en' => $subject->name_en,
                    'name_ar' => $subject->name_ar,
                    'class' => $subject->class ? [
                        'id' => $subject->class->id,
                        'name_en' => $subject->class->name_en,
                        'name_ar' => $subject->class->name_ar,
                    ] : null,
                    'education_level' => $subject->educationLevel ? [
                        'id' => $subject->educationLevel->id,
                        'name_en' => $subject->educationLevel->name_en,
                        'name_ar' => $subject->educationLevel->name_ar,
                    ] : null,
                    'service' => $subject->service ? [
                        'id' => $subject->service->id,
                        'name_en' => $subject->service->name_en,
                        'name_ar' => $subject->service->name_ar,
                    ] : null,
                    'teachers_count' => $subject->teachers->count(),
                    'status' => $subject->status,
                    'service_id'=> $subject->service_id,
                    'created_at' => $subject->created_at,
                    'updated_at' => $subject->updated_at,
                    'deleted_at' => $subject->deleted_at,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Subjects retrieved successfully',
                'total' => count($subjects),
                'data' => $subjects,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching subjects', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve subjects',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new subject
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name_en' => 'required|string|max:255',
            'name_ar' => 'required|string|max:255',
            'class_id' => 'required|exists:classes,id',
            'education_level_id' => 'required|exists:education_levels,id',
            'service_id' => 'required|exists:services,id',
            'status' => 'nullable|boolean',
        ]);

        try {
            // Check for duplicate subject in same class
            $existingSubject = Subject::where('name_en', $request->name_en)
                ->where('class_id', $request->class_id)
                ->first();

            if ($existingSubject) {
                return response()->json([
                    'success' => false,
                    'message' => 'Subject with this name already exists in the selected class',
                ], 422);
            }

            $subject = Subject::create([
                'name_en' => $request->name_en,
                'name_ar' => $request->name_ar,
                'class_id' => $request->class_id,
                'education_level_id' => $request->education_level_id,
                'service_id' => $request->service_id,
                'status' => $request->status ?? 1,
            ]);

            // Load relationships for response
            $subject->load(['class', 'educationLevel', 'service']);

            Log::info('Subject created', ['subject_id' => $subject->id, 'name_en' => $subject->name_en]);

            return response()->json([
                'success' => true,
                'message' => 'Subject created successfully',
                'data' => [
                    'id' => $subject->id,
                    'name_en' => $subject->name_en,
                    'name_ar' => $subject->name_ar,
                    'class' => $subject->class ? [
                        'id' => $subject->class->id,
                        'name_en' => $subject->class->name_en,
                        'name_ar' => $subject->class->name_ar,
                    ] : null,
                    'education_level' => $subject->educationLevel ? [
                        'id' => $subject->educationLevel->id,
                        'name_en' => $subject->educationLevel->name_en,
                        'name_ar' => $subject->educationLevel->name_ar,
                    ] : null,
                    'service' => $subject->service ? [
                        'id' => $subject->service->id,
                        'name_en' => $subject->service->name_en,
                        'name_ar' => $subject->service->name_ar,
                    ] : null,
                    'status' => $subject->status,
                    'created_at' => $subject->created_at,
                ]
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating subject', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create subject',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get subject details
     */
    public function show($id): JsonResponse
    {
        try {
            $subject = Subject::with(['class', 'educationLevel', 'service', 'teachers'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Subject retrieved successfully',
                'data' => [
                    'id' => $subject->id,
                    'name_en' => $subject->name_en,
                    'name_ar' => $subject->name_ar,
                    'class' => $subject->class ? [
                        'id' => $subject->class->id,
                        'name_en' => $subject->class->name_en,
                        'name_ar' => $subject->class->name_ar,
                    ] : null,
                    'education_level' => $subject->educationLevel ? [
                        'id' => $subject->educationLevel->id,
                        'name_en' => $subject->educationLevel->name_en,
                        'name_ar' => $subject->educationLevel->name_ar,
                    ] : null,
                    'service' => $subject->service ? [
                        'id' => $subject->service->id,
                        'name_en' => $subject->service->name_en,
                        'name_ar' => $subject->service->name_ar,
                    ] : null,
                    'teachers' => $subject->teachers->map(function ($teacher) {
                        return [
                            'id' => $teacher->id,
                            'first_name' => $teacher->first_name,
                            'last_name' => $teacher->last_name,
                            'email' => $teacher->email,
                        ];
                    }),
                    'teachers_count' => $subject->teachers->count(),
                    'status' => $subject->status,
                    'created_at' => $subject->created_at,
                    'updated_at' => $subject->updated_at,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Subject not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching subject', ['subject_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve subject',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update subject
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $subject = Subject::findOrFail($id);

            $request->validate([
                'name_en' => 'sometimes|string|max:255',
                'name_ar' => 'sometimes|string|max:255',
                'class_id' => 'sometimes|exists:classes,id',
                'education_level_id' => 'sometimes|exists:education_levels,id',
                'service_id' => 'sometimes|exists:services,id',
                'status' => 'nullable|boolean',
            ]);

            // Check for duplicate subject in same class (excluding current subject)
            if ($request->has('name_en') && $request->has('class_id')) {
                $existingSubject = Subject::where('name_en', $request->name_en)
                    ->where('class_id', $request->class_id)
                    ->where('id', '!=', $id)
                    ->first();

                if ($existingSubject) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Subject with this name already exists in the selected class',
                    ], 422);
                }
            }

            $subject->update([
                'name_en' => $request->name_en ?? $subject->name_en,
                'name_ar' => $request->name_ar ?? $subject->name_ar,
                'class_id' => $request->class_id ?? $subject->class_id,
                'education_level_id' => $request->education_level_id ?? $subject->education_level_id,
                'service_id' => $request->service_id ?? $subject->service_id,
                'status' => $request->has('status') ? $request->status : $subject->status,
            ]);

            $subject->load(['class', 'educationLevel', 'service']);

            Log::info('Subject updated', ['subject_id' => $subject->id]);

            return response()->json([
                'success' => true,
                'message' => 'Subject updated successfully',
                'data' => [
                    'id' => $subject->id,
                    'name_en' => $subject->name_en,
                    'name_ar' => $subject->name_ar,
                    'class' => $subject->class ? [
                        'id' => $subject->class->id,
                        'name_en' => $subject->class->name_en,
                        'name_ar' => $subject->class->name_ar,
                    ] : null,
                    'education_level' => $subject->educationLevel ? [
                        'id' => $subject->educationLevel->id,
                        'name_en' => $subject->educationLevel->name_en,
                        'name_ar' => $subject->educationLevel->name_ar,
                    ] : null,
                    'service' => $subject->service ? [
                        'id' => $subject->service->id,
                        'name_en' => $subject->service->name_en,
                        'name_ar' => $subject->service->name_ar,
                    ] : null,
                    'status' => $subject->status,
                    'updated_at' => $subject->updated_at,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Subject not found'
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating subject', ['subject_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update subject',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Soft delete subject
     */
    public function destroy($id): JsonResponse
    {
        try {
            $subject = Subject::findOrFail($id);

            // Check if subject has teachers
            $teachersCount = $subject->teachers()->count();
            if ($teachersCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete subject that has teachers attached',
                    'data' => [
                        'teachers_count' => $teachersCount,
                    ]
                ], 409);
            }

            $subject->delete();

            Log::info('Subject deleted', ['subject_id' => $subject->id]);

            return response()->json([
                'success' => true,
                'message' => 'Subject deleted successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Subject not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting subject', ['subject_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete subject',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Permanently delete subject
     */
    public function forceDestroy($id): JsonResponse
    {
        try {
            $subject = Subject::withTrashed()->findOrFail($id);

            // Check if subject has teachers
            $teachersCount = $subject->teachers()->count();
            if ($teachersCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot permanently delete subject that has teachers attached',
                    'data' => [
                        'teachers_count' => $teachersCount,
                    ]
                ], 409);
            }

            $subject->forceDelete();

            Log::info('Subject permanently deleted', ['subject_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Subject permanently deleted',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Subject not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error permanently deleting subject', ['subject_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to permanently delete subject',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore soft-deleted subject
     */
    public function restore($id): JsonResponse
    {
        try {
            $subject = Subject::withTrashed()->findOrFail($id);

            if (!$subject->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Subject is not deleted'
                ], 409);
            }

            $subject->restore();
            $subject->load(['class', 'educationLevel', 'service']);

            Log::info('Subject restored', ['subject_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Subject restored successfully',
                'data' => [
                    'id' => $subject->id,
                    'name_en' => $subject->name_en,
                    'name_ar' => $subject->name_ar,
                    'class' => $subject->class ? [
                        'id' => $subject->class->id,
                        'name_en' => $subject->class->name_en,
                        'name_ar' => $subject->class->name_ar,
                    ] : null,
                    'education_level' => $subject->educationLevel ? [
                        'id' => $subject->educationLevel->id,
                        'name_en' => $subject->educationLevel->name_en,
                        'name_ar' => $subject->educationLevel->name_ar,
                    ] : null,
                    'service' => $subject->service ? [
                        'id' => $subject->service->id,
                        'name_en' => $subject->service->name_en,
                        'name_ar' => $subject->service->name_ar,
                    ] : null,
                    'status' => $subject->status,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Subject not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error restoring subject', ['subject_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to restore subject',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
