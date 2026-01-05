<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\EducationLevel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Admin Education Levels Management Controller
 *
 * API Documentation:
 *
 * GET /api/admin/education-levels
 * - List all education levels with optional filtering
 * - Query params: status, include_deleted
 * - Response: { success: true, data: [...], total: number }
 *
 * POST /api/admin/education-levels
 * - Create a new education level
 * - Body: { name_en: string, name_ar: string, description?: string, status: 1|0 }
 * - Response: { success: true, message: "Education level created", data: {...} }
 *
 * GET /api/admin/education-levels/{id}
 * - Get education level details with classes and subjects count
 * - Response: { success: true, data: {...} }
 *
 * PUT /api/admin/education-levels/{id}
 * - Update education level information
 * - Body: { name_en?: string, name_ar?: string, description?: string, status?: 1|0 }
 * - Response: { success: true, message: "Education level updated", data: {...} }
 *
 * DELETE /api/admin/education-levels/{id}
 * - Soft delete education level (if no classes attached)
 * - Response: { success: true, message: "Education level deleted" }
 *
 * DELETE /api/admin/education-levels/{id}/force
 * - Permanently delete education level (if no classes attached)
 * - Response: { success: true, message: "Education level permanently deleted" }
 *
 * POST /api/admin/education-levels/{id}/restore
 * - Restore soft-deleted education level
 * - Response: { success: true, message: "Education level restored", data: {...} }
 */
class EducationLevelAdminController extends Controller
{
    /**
     * Get all education levels with optional filtering
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = EducationLevel::with(['classes', 'subjects']);

            // Include soft-deleted if requested
            if ($request->boolean('include_deleted')) {
                $query->withTrashed();
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $educationLevels = $query->get()->map(function ($level) {
                return [
                    'id' => $level->id,
                    'name_en' => $level->name_en,
                    'name_ar' => $level->name_ar,
                    'description' => $level->description,
                    'classes_count' => $level->classes->count(),
                    'subjects_count' => $level->subjects->count(),
                    'students_count' => $level->students()->count(),
                    'status' => $level->status,
                    'created_at' => $level->created_at,
                    'updated_at' => $level->updated_at,
                    'deleted_at' => $level->deleted_at,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Education levels retrieved successfully',
                'total' => count($educationLevels),
                'data' => $educationLevels,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching education levels', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve education levels',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new education level
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name_en' => 'required|string|max:255|unique:education_levels,name_en',
            'name_ar' => 'required|string|max:255|unique:education_levels,name_ar',
            'description' => 'nullable|string|max:1000',
            'status' => 'nullable|boolean',
        ]);

        try {
            $educationLevel = EducationLevel::create([
                'name_en' => $request->name_en,
                'name_ar' => $request->name_ar,
                'description' => $request->description,
                'status' => $request->status ?? 1,
            ]);

            Log::info('Education level created', ['level_id' => $educationLevel->id, 'name_en' => $educationLevel->name_en]);

            return response()->json([
                'success' => true,
                'message' => 'Education level created successfully',
                'data' => [
                    'id' => $educationLevel->id,
                    'name_en' => $educationLevel->name_en,
                    'name_ar' => $educationLevel->name_ar,
                    'description' => $educationLevel->description,
                    'classes_count' => 0,
                    'subjects_count' => 0,
                    'students_count' => 0,
                    'status' => $educationLevel->status,
                    'created_at' => $educationLevel->created_at,
                ]
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating education level', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create education level',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get education level details
     */
    public function show($id): JsonResponse
    {
        try {
            $educationLevel = EducationLevel::with(['classes', 'subjects'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Education level retrieved successfully',
                'data' => [
                    'id' => $educationLevel->id,
                    'name_en' => $educationLevel->name_en,
                    'name_ar' => $educationLevel->name_ar,
                    'description' => $educationLevel->description,
                    'classes' => $educationLevel->classes->map(function ($class) {
                        return [
                            'id' => $class->id,
                            'name_en' => $class->name_en,
                            'name_ar' => $class->name_ar,
                            'subjects_count' => $class->subjects->count(),
                        ];
                    }),
                    'subjects' => $educationLevel->subjects->map(function ($subject) {
                        return [
                            'id' => $subject->id,
                            'name_en' => $subject->name_en,
                            'name_ar' => $subject->name_ar,
                            'class' => $subject->class ? [
                                'id' => $subject->class->id,
                                'name_en' => $subject->class->name_en,
                                'name_ar' => $subject->class->name_ar,
                            ] : null,
                        ];
                    }),
                    'classes_count' => $educationLevel->classes->count(),
                    'subjects_count' => $educationLevel->subjects->count(),
                    'students_count' => $educationLevel->students()->count(),
                    'status' => $educationLevel->status,
                    'created_at' => $educationLevel->created_at,
                    'updated_at' => $educationLevel->updated_at,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Education level not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching education level', ['level_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve education level',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update education level
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $educationLevel = EducationLevel::findOrFail($id);

            $request->validate([
                'name_en' => 'sometimes|string|max:255|unique:education_levels,name_en,' . $id,
                'name_ar' => 'sometimes|string|max:255|unique:education_levels,name_ar,' . $id,
                'description' => 'nullable|string|max:1000',
                'status' => 'nullable|boolean',
            ]);

            $educationLevel->update([
                'name_en' => $request->name_en ?? $educationLevel->name_en,
                'name_ar' => $request->name_ar ?? $educationLevel->name_ar,
                'description' => $request->description ?? $educationLevel->description,
                'status' => $request->has('status') ? $request->status : $educationLevel->status,
            ]);

            Log::info('Education level updated', ['level_id' => $educationLevel->id]);

            return response()->json([
                'success' => true,
                'message' => 'Education level updated successfully',
                'data' => [
                    'id' => $educationLevel->id,
                    'name_en' => $educationLevel->name_en,
                    'name_ar' => $educationLevel->name_ar,
                    'description' => $educationLevel->description,
                    'classes_count' => $educationLevel->classes()->count(),
                    'subjects_count' => $educationLevel->subjects()->count(),
                    'students_count' => $educationLevel->students()->count(),
                    'status' => $educationLevel->status,
                    'updated_at' => $educationLevel->updated_at,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Education level not found'
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating education level', ['level_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update education level',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Soft delete education level
     */
    public function destroy($id): JsonResponse
    {
        try {
            $educationLevel = EducationLevel::findOrFail($id);

            // Check if education level has classes
            $classesCount = $educationLevel->classes()->count();
            if ($classesCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete education level that has classes attached',
                    'data' => [
                        'classes_count' => $classesCount,
                    ]
                ], 409);
            }

            $educationLevel->delete();

            Log::info('Education level deleted', ['level_id' => $educationLevel->id]);

            return response()->json([
                'success' => true,
                'message' => 'Education level deleted successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Education level not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting education level', ['level_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete education level',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Permanently delete education level
     */
    public function forceDestroy($id): JsonResponse
    {
        try {
            $educationLevel = EducationLevel::withTrashed()->findOrFail($id);

            // Check if education level has classes
            $classesCount = $educationLevel->classes()->count();
            if ($classesCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot permanently delete education level that has classes attached',
                    'data' => [
                        'classes_count' => $classesCount,
                    ]
                ], 409);
            }

            $educationLevel->forceDelete();

            Log::info('Education level permanently deleted', ['level_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Education level permanently deleted',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Education level not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error permanently deleting education level', ['level_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to permanently delete education level',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore soft-deleted education level
     */
    public function restore($id): JsonResponse
    {
        try {
            $educationLevel = EducationLevel::withTrashed()->findOrFail($id);

            if (!$educationLevel->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Education level is not deleted'
                ], 409);
            }

            $educationLevel->restore();

            Log::info('Education level restored', ['level_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Education level restored successfully',
                'data' => [
                    'id' => $educationLevel->id,
                    'name_en' => $educationLevel->name_en,
                    'name_ar' => $educationLevel->name_ar,
                    'description' => $educationLevel->description,
                    'classes_count' => $educationLevel->classes()->count(),
                    'subjects_count' => $educationLevel->subjects()->count(),
                    'students_count' => $educationLevel->students()->count(),
                    'status' => $educationLevel->status,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Education level not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error restoring education level', ['level_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to restore education level',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}