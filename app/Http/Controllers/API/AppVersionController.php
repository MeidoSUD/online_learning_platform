<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AppVersion;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * AppVersionController
 * 
 * Handles app version configuration and update checking.
 * Mobile apps call the config endpoint to check if they need to update.
 */
class AppVersionController extends Controller
{
    /**
     * Get app configuration including version info
     * 
     * This endpoint returns the latest app version for the requesting platform.
     * Mobile apps use this to determine if a force update is required.
     * 
     * @OA\Get(
     *     path="/api/config",
     *     summary="Get app configuration",
     *     tags={"Config"},
     *     @OA\Parameter(name="platform", in="query", @OA\Schema(type="string", enum={"ios", "android"})),
     *     @OA\Response(response=200, description="App configuration"),
     *     @OA\Response(response=400, description="Invalid platform")
     * )
     */
    public function getConfig(Request $request): JsonResponse
    {
        try {
            // Get platform from request - defaults to android if not specified
            $platform = strtolower($request->get('platform', 'android'));
            
            // Validate platform
            if (!in_array($platform, ['ios', 'android'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid platform',
                    'error' => 'Platform must be "ios" or "android"',
                    'code' => 'INVALID_PLATFORM'
                ], 400);
            }

            Log::info('App config request', [
                'platform' => $platform,
                'user_agent' => $request->header('User-Agent'),
                'ip' => $request->ip(),
            ]);

            // Get the latest app version for this platform
            $appVersion = AppVersion::where('platform', $platform)
                ->latest('created_at')
                ->first();

            // If no version found for this platform, return default config
            if (!$appVersion) {
                Log::warning('No app version found for platform', ['platform' => $platform]);
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'platform' => $platform,
                        'version' => '1.0.0',
                        'force_update' => false,
                        'message' => 'No update required',
                        'download_url' => null,
                    ],
                    'code' => 'NO_UPDATE_AVAILABLE'
                ], 200);
            }

            // Build response
            $response = [
                'success' => true,
                'data' => [
                    'platform' => $platform,
                    'version' => $appVersion->version,
                    'force_update' => (bool) $appVersion->force_update,
                    'force_update_message' => $appVersion->force_update 
                        ? 'This version is required. Please update immediately.' 
                        : 'An optional update is available.',
                    'message' => $appVersion->force_update 
                        ? 'A critical update is required. Your app will not work without updating.'
                        : 'A new version is available. Please update when convenient.',
                ],
                'code' => $appVersion->force_update ? 'FORCE_UPDATE_REQUIRED' : 'UPDATE_AVAILABLE'
            ];

            // If force update is true, include details
            if ($appVersion->force_update) {
                $response['data']['action'] = 'FORCE_UPDATE';
                $response['data']['retry_in_seconds'] = 30; // Retry after 30 seconds if user dismisses
                
                Log::info('Force update required', [
                    'platform' => $platform,
                    'version' => $appVersion->version,
                ]);
            } else {
                $response['data']['action'] = 'UPDATE_AVAILABLE';
                $response['code'] = 'UPDATE_AVAILABLE';
            }

            // Add download URL if available
            if (isset($appVersion->download_url) && !empty($appVersion->download_url)) {
                $response['data']['download_url'] = $appVersion->download_url;
            }

            // Add release notes if available
            if (isset($appVersion->release_notes) && !empty($appVersion->release_notes)) {
                $response['data']['release_notes'] = $appVersion->release_notes;
            }

            return response()->json($response, 200);

        } catch (\Exception $e) {
            Log::error('Error getting app config', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error retrieving app configuration',
                'code' => 'CONFIG_ERROR'
            ], 500);
        }
    }

    /**
     * Create a new app version entry (Admin only)
     * 
     * Used by admin to publish a new app version.
     * When force_update=true, all users will be forced to update.
     * 
     * @OA\Post(
     *     path="/api/admin/app-versions",
     *     summary="Create new app version",
     *     tags={"Admin"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"platform", "version", "force_update"},
     *             @OA\Property(property="platform", type="string", enum={"ios", "android"}),
     *             @OA\Property(property="version", type="string", example="2.1.0"),
     *             @OA\Property(property="force_update", type="boolean"),
     *             @OA\Property(property="download_url", type="string"),
     *             @OA\Property(property="release_notes", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="App version created"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function storeAppVersion(Request $request): JsonResponse
    {
        try {
            // Validate input
            $validated = $request->validate([
                'platform' => 'required|in:ios,android',
                'version' => 'required|string|regex:/^\d+\.\d+\.\d+$/',
                'force_update' => 'required|boolean',
                'download_url' => 'nullable|url',
                'release_notes' => 'nullable|string|max:2000',
            ]);

            // Check if version already exists for this platform
            $existingVersion = AppVersion::where('platform', $validated['platform'])
                ->where('version', $validated['version'])
                ->first();

            if ($existingVersion) {
                return response()->json([
                    'success' => false,
                    'message' => 'This version already exists for ' . $validated['platform'],
                    'code' => 'VERSION_EXISTS'
                ], 422);
            }

            // Create new app version
            $appVersion = AppVersion::create([
                'platform' => $validated['platform'],
                'version' => $validated['version'],
                'force_update' => $validated['force_update'],
                'download_url' => $validated['download_url'] ?? null,
                'release_notes' => $validated['release_notes'] ?? null,
            ]);

            Log::info('New app version created', [
                'platform' => $appVersion->platform,
                'version' => $appVersion->version,
                'force_update' => $appVersion->force_update,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'App version created successfully',
                'data' => [
                    'id' => $appVersion->id,
                    'platform' => $appVersion->platform,
                    'version' => $appVersion->version,
                    'force_update' => $appVersion->force_update,
                    'created_at' => $appVersion->created_at,
                ]
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
                'code' => 'VALIDATION_ERROR'
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error creating app version', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error creating app version',
                'code' => 'CREATE_ERROR'
            ], 500);
        }
    }

    /**
     * Get all app versions (Admin only)
     * 
     * @OA\Get(
     *     path="/api/admin/app-versions",
     *     summary="Get all app versions",
     *     tags={"Admin"},
     *     @OA\Response(response=200, description="List of app versions")
     * )
     */
    public function listAppVersions(): JsonResponse
    {
        try {
            $versions = AppVersion::orderBy('platform')
                ->orderByDesc('created_at')
                ->get()
                ->groupBy('platform')
                ->map(function ($platformVersions) {
                    return [
                        'platform' => $platformVersions->first()->platform,
                        'latest' => $platformVersions->first(),
                        'history' => $platformVersions->take(5), // Last 5 versions
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $versions,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error listing app versions', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error retrieving app versions',
                'code' => 'LIST_ERROR'
            ], 500);
        }
    }

    /**
     * Update an app version (Admin only)
     * 
     * @OA\Put(
     *     path="/api/admin/app-versions/{id}",
     *     summary="Update app version",
     *     tags={"Admin"},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="force_update", type="boolean"),
     *             @OA\Property(property="download_url", type="string"),
     *             @OA\Property(property="release_notes", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="App version updated"),
     *     @OA\Response(response=404, description="Not found")
     * )
     */
    public function updateAppVersion(Request $request, $id): JsonResponse
    {
        try {
            $appVersion = AppVersion::findOrFail($id);

            $validated = $request->validate([
                'force_update' => 'nullable|boolean',
                'download_url' => 'nullable|url',
                'release_notes' => 'nullable|string|max:2000',
            ]);

            $appVersion->update($validated);

            Log::info('App version updated', [
                'id' => $appVersion->id,
                'platform' => $appVersion->platform,
                'force_update' => $appVersion->force_update,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'App version updated successfully',
                'data' => $appVersion,
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'App version not found',
                'code' => 'NOT_FOUND'
            ], 404);

        } catch (\Exception $e) {
            Log::error('Error updating app version', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error updating app version',
                'code' => 'UPDATE_ERROR'
            ], 500);
        }
    }
}
