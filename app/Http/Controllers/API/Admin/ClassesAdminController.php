<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClassModel;
use App\Models\EducationLevel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Admin Classes Management Controller
 *
 * API Documentation:
 *
 * GET /api/admin/classes
 * - List all classes with optional filtering
 * - Query params: education_level_id, status, include_deleted
 * - Response: { success: true, data: [...], total: number }
 *
 * POST /api/admin/classes
 * - Create a new class
 * - Body: { name_en: string, name_ar: string, education_level_id: number, status: 1|0 }
 * - Response: { success: true, message: "Class created", data: {...} }
 *
 * GET /api/admin/classes/{id}
 * - Get class details with subjects count
 * - Response: { success: true, data: {...} }
 *
 * PUT /api/admin/classes/{id}
 * - Update class information
 * - Body: { name_en?: string, name_ar?: string, education_level_id?: number, status?: 1|0 }
 * - Response: { success: true, message: "Class updated", data: {...} }
 *
 * DELETE /api/admin/classes/{id}
 * - Soft delete class (if no subjects attached)
 * - Response: { success: true, message: "Class deleted" }
 *
 * DELETE /api/admin/classes/{id}/force
 * - Permanently delete class (if no subjects attached)
 * - Response: { success: true, message: "Class permanently deleted" }
 *
 * POST /api/admin/classes/{id}/restore
 * - Restore soft-deleted class
 * - Response: { success: true, message: "Class restored", data: {...} }
 */
class ClassesAdminController extends Controller
{
    /**
     * Get all classes with optional filtering
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = ClassModel::with(['educationLevel', 'subjects']);

            // Include soft-deleted if requested
            if ($request->boolean('include_deleted')) {
                $query->withTrashed();
            }

            // Filter by education level
            if ($request->has('education_level_id')) {
                $query->where('education_level_id', $request->education_level_id);
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $classes = $query->get()->map(function ($class) {
                return [
                    'id' => $class->id,
                    'name_en' => $class->name_en,
                    'name_ar' => $class->name_ar,
                    'education_level' => $class->educationLevel ? [
                        'id' => $class->educationLevel->id,
                        'name_en' => $class->educationLevel->name_en,
                        'name_ar' => $class->educationLevel->name_ar,
                    ] : null,
                    'subjects_count' => $class->subjects->count(),
                    'status' => $class->status,
                    'created_at' => $class->created_at,
                    'updated_at' => $class->updated_at,
                    'deleted_at' => $class->deleted_at,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Classes retrieved successfully',
                'total' => count($classes),
                'data' => $classes,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching classes', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve classes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new class
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name_en' => 'required|string|max:255|unique:classes,name_en',
            'name_ar' => 'required|string|max:255|unique:classes,name_ar',
            'education_level_id' => 'required|exists:education_levels,id',
            'status' => 'nullable|boolean',
        ]);

        try {
            $class = ClassModel::create([
                'name_en' => $request->name_en,
                'name_ar' => $request->name_ar,
                'education_level_id' => $request->education_level_id,
                'status' => $request->status ?? 1,
            ]);

            // Load relationships for response
            $class->load('educationLevel');

            Log::info('Class created', ['class_id' => $class->id, 'name_en' => $class->name_en]);

            return response()->json([
                'success' => true,
                'message' => 'Class created successfully',
                'data' => [
                    'id' => $class->id,
                    'name_en' => $class->name_en,
                    'name_ar' => $class->name_ar,
                    'education_level' => $class->educationLevel ? [
                        'id' => $class->educationLevel->id,
                        'name_en' => $class->educationLevel->name_en,
                        'name_ar' => $class->educationLevel->name_ar,
                    ] : null,
                    'status' => $class->status,
                    'created_at' => $class->created_at,
                ]
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating class', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create class',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get class details
     */
    public function show($id): JsonResponse
    {
        try {
            $class = ClassModel::with(['educationLevel', 'subjects'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Class retrieved successfully',
                'data' => [
                    'id' => $class->id,
                    'name_en' => $class->name_en,
                    'name_ar' => $class->name_ar,
                    'education_level' => $class->educationLevel ? [
                        'id' => $class->educationLevel->id,
                        'name_en' => $class->educationLevel->name_en,
                        'name_ar' => $class->educationLevel->name_ar,
                    ] : null,
                    'subjects' => $class->subjects->map(function ($subject) {
                        return [
                            'id' => $subject->id,
                            'name_en' => $subject->name_en,
                            'name_ar' => $subject->name_ar,
                            'service_id' => $subject->service_id,
                        ];
                    }),
                    'subjects_count' => $class->subjects->count(),
                    'status' => $class->status,
                    'created_at' => $class->created_at,
                    'updated_at' => $class->updated_at,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Class not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching class', ['class_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve class',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update class
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $class = ClassModel::findOrFail($id);

            $request->validate([
                'name_en' => 'sometimes|string|max:255|unique:classes,name_en,' . $id,
                'name_ar' => 'sometimes|string|max:255|unique:classes,name_ar,' . $id,
                'education_level_id' => 'sometimes|exists:education_levels,id',
                'status' => 'nullable|boolean',
            ]);

            $class->update([
                'name_en' => $request->name_en ?? $class->name_en,
                'name_ar' => $request->name_ar ?? $class->name_ar,
                'education_level_id' => $request->education_level_id ?? $class->education_level_id,
                'status' => $request->has('status') ? $request->status : $class->status,
            ]);

            $class->load('educationLevel');

            Log::info('Class updated', ['class_id' => $class->id]);

            return response()->json([
                'success' => true,
                'message' => 'Class updated successfully',
                'data' => [
                    'id' => $class->id,
                    'name_en' => $class->name_en,
                    'name_ar' => $class->name_ar,
                    'education_level' => $class->educationLevel ? [
                        'id' => $class->educationLevel->id,
                        'name_en' => $class->educationLevel->name_en,
                        'name_ar' => $class->educationLevel->name_ar,
                    ] : null,
                    'status' => $class->status,
                    'updated_at' => $class->updated_at,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Class not found'
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating class', ['class_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update class',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Soft delete class
     */
    public function destroy($id): JsonResponse
    {
        try {
            $class = ClassModel::findOrFail($id);

            // Check if class has subjects
            $subjectsCount = $class->subjects()->count();
            if ($subjectsCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete class that has subjects attached',
                    'data' => [
                        'subjects_count' => $subjectsCount,
                    ]
                ], 409);
            }

            $class->delete();

            Log::info('Class deleted', ['class_id' => $class->id]);

            return response()->json([
                'success' => true,
                'message' => 'Class deleted successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Class not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting class', ['class_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete class',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Permanently delete class
     */
    public function forceDestroy($id): JsonResponse
    {
        try {
            $class = ClassModel::withTrashed()->findOrFail($id);

            // Check if class has subjects
            $subjectsCount = $class->subjects()->count();
            if ($subjectsCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot permanently delete class that has subjects attached',
                    'data' => [
                        'subjects_count' => $subjectsCount,
                    ]
                ], 409);
            }

            $class->forceDelete();

            Log::info('Class permanently deleted', ['class_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Class permanently deleted',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Class not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error permanently deleting class', ['class_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to permanently delete class',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore soft-deleted class
     */
    public function restore($id): JsonResponse
    {
        try {
            $class = ClassModel::withTrashed()->findOrFail($id);

            if (!$class->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Class is not deleted'
                ], 409);
            }

            $class->restore();
            $class->load('educationLevel');

            Log::info('Class restored', ['class_id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Class restored successfully',
                'data' => [
                    'id' => $class->id,
                    'name_en' => $class->name_en,
                    'name_ar' => $class->name_ar,
                    'education_level' => $class->educationLevel ? [
                        'id' => $class->educationLevel->id,
                        'name_en' => $class->educationLevel->name_en,
                        'name_ar' => $class->educationLevel->name_ar,
                    ] : null,
                    'status' => $class->status,
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Class not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error restoring class', ['class_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to restore class',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
