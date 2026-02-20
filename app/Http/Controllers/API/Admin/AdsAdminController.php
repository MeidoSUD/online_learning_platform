<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdsPanner;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class AdsAdminController extends Controller
{
    /**
     * List all ads with filtering options
     * 
     * @OA\Get(
     *     path="/api/admin/ads",
     *     summary="List all ads",
     *     tags={"Admin - Ads"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="is_active", in="query", description="Filter by active status", @OA\Schema(type="boolean")),
     *     @OA\Parameter(name="role_id", in="query", description="Filter by role (3=teacher, 4=student, null=all)", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="platform", in="query", description="Filter by platform", @OA\Schema(type="string", enum={"web", "app", "both"})),
     *     @OA\Response(response=200, description="List of ads"),
     * )
     */
    public function listAds(Request $request)
    {
        try {
            $query = AdsPanner::query();

            // Filter by active status
            if ($request->filled('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            // Filter by role
            if ($request->filled('role_id')) {
                $query->where('role_id', $request->input('role_id'));
            }

            // Filter by platform
            if ($request->filled('platform')) {
                $query->byPlatform($request->input('platform'));
            }

            $ads = $query->orderBy('display_order', 'asc')
                        ->orderBy('created_at', 'desc')
                        ->get();

            return response()->json([
                'success' => true,
                'code' => 'ADS_LISTED',
                'status' => 'success',
                'message_en' => 'Ads listed successfully',
                'message_ar' => 'تم استعراض الإعلانات بنجاح',
                'data' => [
                    'count' => $ads->count(),
                    'ads' => $ads->map(function ($ad) {
                        return [
                            'id' => $ad->id,
                            'image_url' => $ad->image_path ? asset('storage/' . $ad->image_path) : null,
                            'image_path' => $ad->image_path,
                            'description' => $ad->description,
                            'role_id' => $ad->role_id,
                            'role_name' => $ad->role_id == 3 ? 'teacher' : ($ad->role_id == 4 ? 'student' : 'all/guest'),
                            'platform' => $ad->platform,
                            'is_active' => $ad->is_active,
                            'link_url' => $ad->link_url,
                            'cta_text' => $ad->cta_text,
                            'display_order' => $ad->display_order,
                            'created_at' => $ad->created_at->format('Y-m-d H:i:s'),
                            'updated_at' => $ad->updated_at->format('Y-m-d H:i:s'),
                        ];
                    })->values(),
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error listing ads', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'code' => 'ERROR_LISTING_ADS',
                'status' => 'error',
                'message_en' => 'Error listing ads',
                'message_ar' => 'خطأ في استعراض الإعلانات',
            ], 500);
        }
    }

    /**
     * Create a new ad with image upload
     * 
     * @OA\Post(
     *     path="/api/admin/ads",
     *     summary="Create a new ad",
     *     tags={"Admin - Ads"},
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 required={"image"},
     *                 @OA\Property(property="image", type="string", format="binary", description="Ad image"),
     *                 @OA\Property(property="description", type="string", description="Ad description"),
     *                 @OA\Property(property="role_id", type="integer", description="Target role (null=all, 3=teacher, 4=student)"),
     *                 @OA\Property(property="platform", type="string", enum={"web", "app", "both"}, description="Target platform"),
     *                 @OA\Property(property="link_url", type="string", description="Link URL for CTA"),
     *                 @OA\Property(property="cta_text", type="string", description="Call-to-action button text"),
     *                 @OA\Property(property="display_order", type="integer", description="Display order"),
     *             )
     *         )
     *     ),
     *     @OA\Response(response=201, description="Ad created successfully"),
     *     @OA\Response(response=422, description="Validation error"),
     * )
     */
    public function createAd(Request $request)
    {
        try {
            // Validate input
            $validated = $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB
                'description' => 'nullable|string|max:1000',
                'role_id' => 'nullable|integer|in:3,4', // 3=teacher, 4=student, null=all
                'platform' => 'required|in:web,app,both',
                'link_url' => 'nullable|url',
                'cta_text' => 'nullable|string|max:255',
                'display_order' => 'nullable|integer|min:0',
            ]);

            // Upload image
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $path = $file->store('ads', 'public');

                $ad = AdsPanner::create([
                    'image_path' => $path,
                    'image_name' => $file->getClientOriginalName(),
                    'description' => $validated['description'] ?? null,
                    'role_id' => $validated['role_id'] ?? null,
                    'platform' => $validated['platform'],
                    'link_url' => $validated['link_url'] ?? null,
                    'cta_text' => $validated['cta_text'] ?? null,
                    'display_order' => $validated['display_order'] ?? 0,
                    'is_active' => true,
                ]);

                Log::info('Ad created successfully', [
                    'ad_id' => $ad->id,
                    'image_path' => $path,
                    'role_id' => $validated['role_id'] ?? null,
                    'platform' => $validated['platform'],
                ]);

                return response()->json([
                    'success' => true,
                    'code' => 'AD_CREATED',
                    'status' => 'success',
                    'message_en' => 'Ad created successfully',
                    'message_ar' => 'تم إنشاء الإعلان بنجاح',
                    'data' => [
                        'id' => $ad->id,
                        'image_url' => asset('storage/' . $ad->image_path),
                        'description' => $ad->description,
                        'role_id' => $ad->role_id,
                        'platform' => $ad->platform,
                        'is_active' => $ad->is_active,
                        'created_at' => $ad->created_at->format('Y-m-d H:i:s'),
                    ],
                ], 201);
            }

            return response()->json([
                'success' => false,
                'code' => 'NO_IMAGE',
                'status' => 'error',
                'message_en' => 'Image file is required',
                'message_ar' => 'صورة الإعلان مطلوبة',
            ], 422);

        } catch (ValidationException $e) {
            Log::warning('Ad creation validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'code' => 'VALIDATION_ERROR',
                'status' => 'invalid_input',
                'message_en' => 'Validation error',
                'message_ar' => 'خطأ في التحقق من البيانات',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error creating ad', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'code' => 'ERROR_CREATING_AD',
                'status' => 'error',
                'message_en' => 'Error creating ad',
                'message_ar' => 'خطأ في إنشاء الإعلان',
            ], 500);
        }
    }

    /**
     * Update an existing ad
     * 
     * @OA\Post(
     *     path="/api/admin/ads/{id}",
     *     summary="Update an existing ad",
     *     tags={"Admin - Ads"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 @OA\Property(property="image", type="string", format="binary", description="New ad image (optional)"),
     *                 @OA\Property(property="description", type="string", description="Ad description"),
     *                 @OA\Property(property="role_id", type="integer", description="Target role"),
     *                 @OA\Property(property="platform", type="string", enum={"web", "app", "both"}),
     *                 @OA\Property(property="link_url", type="string", description="Link URL"),
     *                 @OA\Property(property="cta_text", type="string", description="CTA button text"),
     *                 @OA\Property(property="is_active", type="boolean", description="Active status"),
     *                 @OA\Property(property="display_order", type="integer", description="Display order"),
     *             )
     *         )
     *     ),
     *     @OA\Response(response=200, description="Ad updated successfully"),
     *     @OA\Response(response=404, description="Ad not found"),
     * )
     */
    public function updateAd(Request $request, $id)
    {
        try {
            $ad = AdsPanner::find($id);

            if (!$ad) {
                return response()->json([
                    'success' => false,
                    'code' => 'AD_NOT_FOUND',
                    'status' => 'not_found',
                    'message_en' => 'Ad not found',
                    'message_ar' => 'الإعلان غير موجود',
                ], 404);
            }

            // Validate input
            $validated = $request->validate([
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
                'description' => 'nullable|string|max:1000',
                'role_id' => 'nullable|integer|in:3,4',
                'platform' => 'nullable|in:web,app,both',
                'link_url' => 'nullable|url',
                'cta_text' => 'nullable|string|max:255',
                'is_active' => 'nullable|boolean',
                'display_order' => 'nullable|integer|min:0',
            ]);

            // Handle image update
            if ($request->hasFile('image')) {
                // Delete old image
                if ($ad->image_path) {
                    Storage::disk('public')->delete($ad->image_path);
                }

                $file = $request->file('image');
                $path = $file->store('ads', 'public');
                $ad->image_path = $path;
                $ad->image_name = $file->getClientOriginalName();
            }

            // Update other fields
            if (isset($validated['description'])) {
                $ad->description = $validated['description'];
            }
            if (isset($validated['role_id'])) {
                $ad->role_id = $validated['role_id'];
            }
            if (isset($validated['platform'])) {
                $ad->platform = $validated['platform'];
            }
            if (isset($validated['link_url'])) {
                $ad->link_url = $validated['link_url'];
            }
            if (isset($validated['cta_text'])) {
                $ad->cta_text = $validated['cta_text'];
            }
            if (isset($validated['is_active'])) {
                $ad->is_active = $validated['is_active'];
            }
            if (isset($validated['display_order'])) {
                $ad->display_order = $validated['display_order'];
            }

            $ad->save();

            Log::info('Ad updated successfully', ['ad_id' => $id]);

            return response()->json([
                'success' => true,
                'code' => 'AD_UPDATED',
                'status' => 'success',
                'message_en' => 'Ad updated successfully',
                'message_ar' => 'تم تحديث الإعلان بنجاح',
                'data' => [
                    'id' => $ad->id,
                    'image_url' => asset('storage/' . $ad->image_path),
                    'description' => $ad->description,
                    'role_id' => $ad->role_id,
                    'platform' => $ad->platform,
                    'is_active' => $ad->is_active,
                    'updated_at' => $ad->updated_at->format('Y-m-d H:i:s'),
                ],
            ], 200);

        } catch (ValidationException $e) {
            Log::warning('Ad update validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'code' => 'VALIDATION_ERROR',
                'status' => 'invalid_input',
                'message_en' => 'Validation error',
                'message_ar' => 'خطأ في التحقق من البيانات',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error updating ad', ['ad_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'code' => 'ERROR_UPDATING_AD',
                'status' => 'error',
                'message_en' => 'Error updating ad',
                'message_ar' => 'خطأ في تحديث الإعلان',
            ], 500);
        }
    }

    /**
     * Toggle ad active/inactive status
     * 
     * @OA\Put(
     *     path="/api/admin/ads/{id}/toggle",
     *     summary="Toggle ad active status",
     *     tags={"Admin - Ads"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Status toggled"),
     * )
     */
    public function toggleAdStatus($id)
    {
        try {
            $ad = AdsPanner::find($id);

            if (!$ad) {
                return response()->json([
                    'success' => false,
                    'code' => 'AD_NOT_FOUND',
                    'status' => 'not_found',
                    'message_en' => 'Ad not found',
                    'message_ar' => 'الإعلان غير موجود',
                ], 404);
            }

            $ad->is_active = !$ad->is_active;
            $ad->save();

            Log::info('Ad status toggled', ['ad_id' => $id, 'is_active' => $ad->is_active]);

            return response()->json([
                'success' => true,
                'code' => 'STATUS_TOGGLED',
                'status' => 'success',
                'message_en' => 'Ad status updated',
                'message_ar' => 'تم تحديث حالة الإعلان',
                'data' => [
                    'id' => $ad->id,
                    'is_active' => $ad->is_active,
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error toggling ad status', ['ad_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'code' => 'ERROR_TOGGLING_STATUS',
                'status' => 'error',
                'message_en' => 'Error toggling ad status',
                'message_ar' => 'خطأ في تحديث حالة الإعلان',
            ], 500);
        }
    }

    /**
     * Delete an ad
     * 
     * @OA\Delete(
     *     path="/api/admin/ads/{id}",
     *     summary="Delete an ad",
     *     tags={"Admin - Ads"},
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Ad deleted successfully"),
     *     @OA\Response(response=404, description="Ad not found"),
     * )
     */
    public function deleteAd($id)
    {
        try {
            $ad = AdsPanner::find($id);

            if (!$ad) {
                return response()->json([
                    'success' => false,
                    'code' => 'AD_NOT_FOUND',
                    'status' => 'not_found',
                    'message_en' => 'Ad not found',
                    'message_ar' => 'الإعلان غير موجود',
                ], 404);
            }

            // Delete image file
            if ($ad->image_path) {
                Storage::disk('public')->delete($ad->image_path);
            }

            $ad->delete();

            Log::info('Ad deleted successfully', ['ad_id' => $id]);

            return response()->json([
                'success' => true,
                'code' => 'AD_DELETED',
                'status' => 'success',
                'message_en' => 'Ad deleted successfully',
                'message_ar' => 'تم حذف الإعلان بنجاح',
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error deleting ad', ['ad_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'code' => 'ERROR_DELETING_AD',
                'status' => 'error',
                'message_en' => 'Error deleting ad',
                'message_ar' => 'خطأ في حذف الإعلان',
            ], 500);
        }
    }
}
