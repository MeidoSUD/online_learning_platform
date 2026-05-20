<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\TermsConditions;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Admin Terms & Conditions Management Controller
 *
 * API Documentation:
 *
 * GET /api/admin/terms-conditions
 * - List all terms and conditions with optional filtering
 * - Query params: status, type, role_id, include_deleted, version
 * - Response: { success: true, data: [...], total: number }
 *
 * POST /api/admin/terms-conditions
 * - Create new terms and conditions entry
 * - Body: { title_en: string, title_ar: string, content_en: string, content_ar: string, type: 'terms'|'conditions'|'privacy_policy', role_id?: number, status: 1|0, version?: number }
 * - Response: { success: true, message: "Created successfully", data: {...} }
 *
 * GET /api/admin/terms-conditions/{id}
 * - Get terms and conditions details
 * - Response: { success: true, data: {...} }
 *
 * PUT /api/admin/terms-conditions/{id}
 * - Update terms and conditions
 * - Body: { title_en?: string, title_ar?: string, content_en?: string, content_ar?: string, type?: string, role_id?: number, status?: 1|0 }
 * - Response: { success: true, message: "Updated successfully", data: {...} }
 *
 * DELETE /api/admin/terms-conditions/{id}
 * - Soft delete terms and conditions
 * - Response: { success: true, message: "Deleted successfully" }
 *
 * DELETE /api/admin/terms-conditions/{id}/force
 * - Permanently delete terms and conditions
 * - Response: { success: true, message: "Permanently deleted" }
 *
 * POST /api/admin/terms-conditions/{id}/restore
 * - Restore soft-deleted terms and conditions
 * - Response: { success: true, message: "Restored successfully", data: {...} }
 *
 * GET /api/admin/terms-conditions/type/{type}
 * - Get latest active terms and conditions by type
 * - Response: { success: true, data: {...} }
 */
class TermsConditionsAdminController extends Controller
{
    /**
     * Get all terms and conditions with optional filtering
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = TermsConditions::query();

            // Include soft-deleted if requested
            if ($request->boolean('include_deleted')) {
                $query->withTrashed();
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->boolean('status'));
            }

            // Filter by type
            if ($request->filled('type')) {
                $query->where('type', $request->type);
            }

            // Filter by role_id
            if ($request->has('role_id')) {
                $query->where('role_id', $request->role_id);
            }

            // Filter by version
            if ($request->has('version')) {
                $query->where('version', $request->version);
            }

            // Sort by latest first
            $terms = $query->latest('created_at')
                ->get()
                ->map(function ($term) {
                    return $this->formatTermsResponse($term);
                });

            return response()->json([
                'success' => true,
                'data' => $terms,
                'total' => count($terms),
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching terms and conditions', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch terms and conditions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new terms and conditions
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title_en' => 'required|string|max:255',
                'title_ar' => 'required|string|max:255',
                'content_en' => 'required|string',
                'content_ar' => 'required|string',
                'type' => 'required|in:terms,conditions,privacy_policy',
                'role_id' => 'nullable|exists:roles,id',
                'status' => 'required|boolean',
                'version' => 'nullable|integer|min:1',
            ]);

            DB::beginTransaction();

            // If version not provided, auto-increment from existing
            if (!isset($validated['version'])) {
                $maxVersion = TermsConditions::where('type', $validated['type'])
                    ->where('role_id', $validated['role_id'] ?? null)
                    ->max('version') ?? 0;
                $validated['version'] = $maxVersion + 1;
            }

            // If this is being set to active, deactivate others of same type
            if ($validated['status'] === true) {
                TermsConditions::where('type', $validated['type'])
                    ->where('role_id', $validated['role_id'] ?? null)
                    ->where('status', true)
                    ->update(['status' => false]);
            }

            $term = TermsConditions::create($validated);

            DB::commit();

            Log::info('Terms and conditions created', [
                'id' => $term->id,
                'type' => $term->type,
                'version' => $term->version,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Terms and conditions created successfully',
                'data' => $this->formatTermsResponse($term)
            ], 201);

        } catch (ValidationException $e) {
            Log::warning('Validation error creating terms and conditions', [
                'errors' => $e->errors()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating terms and conditions', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create terms and conditions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single terms and conditions
     */
    public function show(int $id): JsonResponse
    {
        try {
            $term = TermsConditions::withTrashed()->find($id);

            if (!$term) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terms and conditions not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $this->formatTermsResponse($term)
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching terms and conditions', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch terms and conditions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update terms and conditions
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $term = TermsConditions::find($id);

            if (!$term) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terms and conditions not found'
                ], 404);
            }

            $validated = $request->validate([
                'title_en' => 'sometimes|string|max:255',
                'title_ar' => 'sometimes|string|max:255',
                'content_en' => 'sometimes|string',
                'content_ar' => 'sometimes|string',
                'type' => 'sometimes|in:terms,conditions,privacy_policy',
                'role_id' => 'nullable|exists:roles,id',
                'status' => 'sometimes|boolean',
            ]);

            // If status being changed to true, deactivate others
            if (isset($validated['status']) && $validated['status'] === true) {
                TermsConditions::where('type', $term->type)
                    ->where('role_id', $term->role_id)
                    ->where('id', '!=', $id)
                    ->where('status', true)
                    ->update(['status' => false]);
            }

            $term->update($validated);

            Log::info('Terms and conditions updated', [
                'id' => $term->id,
                'changes' => $validated
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Terms and conditions updated successfully',
                'data' => $this->formatTermsResponse($term)
            ]);

        } catch (ValidationException $e) {
            Log::warning('Validation error updating terms and conditions', [
                'id' => $id,
                'errors' => $e->errors()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error updating terms and conditions', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update terms and conditions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Soft delete terms and conditions
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $term = TermsConditions::find($id);

            if (!$term) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terms and conditions not found'
                ], 404);
            }

            $term->delete();

            Log::info('Terms and conditions deleted', ['id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Terms and conditions deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error deleting terms and conditions', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete terms and conditions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Permanently delete terms and conditions
     */
    public function forceDelete(int $id): JsonResponse
    {
        try {
            $term = TermsConditions::withTrashed()->find($id);

            if (!$term) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terms and conditions not found'
                ], 404);
            }

            $term->forceDelete();

            Log::info('Terms and conditions permanently deleted', ['id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Terms and conditions permanently deleted'
            ]);

        } catch (\Exception $e) {
            Log::error('Error permanently deleting terms and conditions', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to permanently delete terms and conditions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore soft-deleted terms and conditions
     */
    public function restore(int $id): JsonResponse
    {
        try {
            $term = TermsConditions::withTrashed()->find($id);

            if (!$term) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terms and conditions not found'
                ], 404);
            }

            if (!$term->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terms and conditions is not deleted'
                ], 400);
            }

            $term->restore();

            Log::info('Terms and conditions restored', ['id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Terms and conditions restored successfully',
                'data' => $this->formatTermsResponse($term)
            ]);

        } catch (\Exception $e) {
            Log::error('Error restoring terms and conditions', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to restore terms and conditions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get latest active terms and conditions by type
     */
    public function getByType(string $type): JsonResponse
    {
        try {
            $term = TermsConditions::where('type', $type)
                ->where('status', true)
                ->latest('version')
                ->first();

            if (!$term) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terms and conditions not found for this type'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $this->formatTermsResponse($term)
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching terms and conditions by type', [
                'type' => $type,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch terms and conditions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format response data
     */
    private function formatTermsResponse(TermsConditions $term): array
    {
        return [
            'id' => $term->id,
            'title_en' => $term->title_en,
            'title_ar' => $term->title_ar,
            'content_en' => $term->content_en,
            'content_ar' => $term->content_ar,
            'type' => $term->type,
            'role_id' => $term->role_id,
            'version' => $term->version,
            'status' => $term->status,
            'is_deleted' => $term->trashed(),
            'created_at' => $term->created_at,
            'updated_at' => $term->updated_at,
            'deleted_at' => $term->deleted_at,
        ];
    }
}
