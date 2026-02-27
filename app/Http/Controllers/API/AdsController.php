<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AdsPanner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdsController extends Controller
{
    /**
     * Get active ads based on user role and platform
     * 
     * Public endpoint - No authentication required (guest users get guest ads)
     * Authenticated users get ads for their role (student/teacher)
     * 
     * @OA\Get(
     *     path="/api/ads",
     *     summary="Get active ads based on user role",
     *     tags={"Ads"},
     *     @OA\Parameter(
     *         name="platform",
     *         in="query",
     *         description="Platform filter: web, app, or both",
     *         required=false,
     *         @OA\Schema(type="string", enum={"web", "app", "both"})
     *     ),
     *     @OA\Response(response=200, description="List of active ads for user role"),
     *     @OA\Response(response=401, description="Unauthorized"),
     * )
     */
    public function getAds(Request $request)
    {
        try {
            $platform = $request->query('platform', 'both');
            
            // Validate platform parameter
            if (!in_array($platform, ['web', 'app', 'both'])) {
                $platform = 'both';
            }

            // Get user role from authenticated user or null for guest
            $roleId = null;
            $user= auth('sanctum')->user();
            if ($user) {
                $roleId =  $user->role_id;
                Log::info('Ads request from authenticated user', [
                    'user_id' => $user->id,
                    'role_id' => $roleId,
                    'platform' => $platform,
                ]);
            } else {
                Log::info('Ads request from guest user', ['platform' => $platform]);
            }

            // Get active ads for user role and platform
            $ads = AdsPanner::getActiveAds($platform, $roleId);

            Log::info('Ads retrieved successfully', [
                'count' => $ads->count(),
                'role_id' => $roleId,
                'platform' => $platform,
            ]);

            return response()->json([
                'success' => true,
                'code' => 'ADS_RETRIEVED',
                'status' => 'success',
                'message_en' => 'Ads retrieved successfully',
                'message_ar' => 'تم استرجاع الإعلانات بنجاح',
                'data' => [
                    'platform' => $platform,
                    'role' => $roleId ? ($roleId == 3 ? 'teacher' : 'student') : 'guest',
                    'ads_count' => $ads->count(),
                    'ads' => $ads->map(function ($ad) {
                        return [
                            'id' => $ad->id,
                            'image_url' => $ad->image_path ? asset('storage/' . $ad->image_path) : null,
                            'description' => $ad->description,
                            'link_url' => $ad->link_url,
                            'cta_text' => $ad->cta_text,
                            'platform' => $ad->platform,
                        ];
                    })->values(),
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error retrieving ads', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'code' => 'ERROR_RETRIEVING_ADS',
                'status' => 'error',
                'message_en' => 'Error retrieving ads',
                'message_ar' => 'خطأ في استرجاع الإعلانات',
            ], 500);
        }
    }

    /**
     * Get a single ad by ID (public access, check if active)
     * 
     * @OA\Get(
     *     path="/api/ads/{id}",
     *     summary="Get a specific ad by ID",
     *     tags={"Ads"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Ad ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(response=200, description="Ad details"),
     *     @OA\Response(response=404, description="Ad not found"),
     * )
     */
    public function getAdById($id)
    {
        try {
            $ad = AdsPanner::where('is_active', true)->find($id);

            if (!$ad) {
                return response()->json([
                    'success' => false,
                    'code' => 'AD_NOT_FOUND',
                    'status' => 'not_found',
                    'message_en' => 'Ad not found',
                    'message_ar' => 'الإعلان غير موجود',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'code' => 'AD_RETRIEVED',
                'status' => 'success',
                'message_en' => 'Ad retrieved successfully',
                'message_ar' => 'تم استرجاع الإعلان بنجاح',
                'data' => [
                    'id' => $ad->id,
                    'image_url' => $ad->image_path ? asset('storage/' . $ad->image_path) : null,
                    'description' => $ad->description,
                    'link_url' => $ad->link_url,
                    'cta_text' => $ad->cta_text,
                    'platform' => $ad->platform,
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error retrieving ad', [
                'ad_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'code' => 'ERROR_RETRIEVING_AD',
                'status' => 'error',
                'message_en' => 'Error retrieving ad',
                'message_ar' => 'خطأ في استرجاع الإعلان',
            ], 500);
        }
    }
}
