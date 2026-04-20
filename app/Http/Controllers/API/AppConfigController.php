<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * AppConfigController
 * 
 * Handles app configuration requests from mobile applications.
 * This endpoint provides version info, maintenance mode status, and update requirements.
 */
class AppConfigController extends Controller
{
    /**
     * Get app configuration for mobile apps
     * 
     * This endpoint is called by mobile apps to check:
     * - Current required version for their platform
     * - Whether a force update is needed
     * - Whether the app is in maintenance mode
     * - Optional update messages and download URLs
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getConfig(Request $request): JsonResponse
    {
        try {
            // Get platform from request - defaults to android if not specified
            $platform = strtolower($request->get('platform', 'android'));
            $currentVersion = $request->get('version', null); // Current app version on user's device
            
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
                'current_version' => $currentVersion,
                'user_agent' => $request->header('User-Agent'),
                'ip' => $request->ip(),
            ]);

            // Check if maintenance mode is enabled
            $maintenanceEnabled = Setting::getValue('maintenance_enabled', false);
            
            // Get the required app version for this platform
            $versionKey = 'app_version_' . $platform;
            $requiredVersion = Setting::getValue($versionKey, '1.0.0');
            
            // Get force update flag for this platform
            $forceUpdateKey = 'force_update_' . $platform;
            $forceUpdate = Setting::getValue($forceUpdateKey, false);

            // Build response data
            $data = [
                'platform' => $platform,
                'required_version' => $requiredVersion,
                'current_version' => $currentVersion,
                'force_update' => (bool) $forceUpdate,
                'maintenance_mode' => (bool) $maintenanceEnabled,
            ];

            // Add maintenance message if enabled
            if ($maintenanceEnabled) {
                $data['maintenance_message'] = 'The app is currently under maintenance. Please try again later.';
                $data['status'] = 'MAINTENANCE_MODE';
            }

            // Add update information if version is different or force update is enabled
            if ($currentVersion && $this->isVersionLower($currentVersion, $requiredVersion)) {
                $data['update_available'] = true;
                $data['update_message'] = $forceUpdate 
                    ? 'A critical update is required. Please update immediately.'
                    : 'A new version is available. Please update when convenient.';
                $data['action'] = $forceUpdate ? 'FORCE_UPDATE' : 'OPTIONAL_UPDATE';
                $data['status'] = $forceUpdate ? 'FORCE_UPDATE_REQUIRED' : 'UPDATE_AVAILABLE';
                
                if ($forceUpdate) {
                    $data['retry_in_seconds'] = 30; // Retry after 30 seconds if user dismisses
                }
            } else {
                $data['update_available'] = false;
                $data['action'] = 'NO_ACTION';
                $data['status'] = $maintenanceEnabled ? 'MAINTENANCE_MODE' : 'UP_TO_DATE';
            }

            Log::info('App config response', [
                'platform' => $platform,
                'status' => $data['status'],
                'force_update' => $forceUpdate,
                'maintenance_mode' => $maintenanceEnabled,
            ]);

            return response()->json([
                'success' => true,
                'data' => $data,
                'code' => $data['status']
            ], 200);

        } catch (\Exception $e) {
            Log::error('App config error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve app configuration',
                'error' => $e->getMessage(),
                'code' => 'CONFIG_ERROR'
            ], 500);
        }
    }

    /**
     * Check if version1 is lower than version2
     * Compares semantic versions (e.g., 1.0.0 vs 1.1.0)
     *
     * @param string $version1
     * @param string $version2
     * @return bool
     */
    private function isVersionLower(string $version1, string $version2): bool
    {
        return version_compare($version1, $version2, '<');
    }

    /**
     * Get all app configuration settings (Admin view)
     * 
     * This endpoint is for admin dashboard to view current app settings
     * 
     * @return JsonResponse
     */
    public function getAppSettings(): JsonResponse
    {
        try {
            $settings = [
                'app_name' => Setting::getValue('app_name', 'ewan'),
                'maintenance_enabled' => Setting::getValue('maintenance_enabled', false),
                'app_version_ios' => Setting::getValue('app_version_ios', '1.0.0'),
                'app_version_android' => Setting::getValue('app_version_android', '1.0.0'),
                'force_update_ios' => Setting::getValue('force_update_ios', false),
                'force_update_android' => Setting::getValue('force_update_android', false),
            ];

            return response()->json([
                'success' => true,
                'data' => $settings,
                'code' => 'APP_SETTINGS_RETRIEVED'
            ], 200);

        } catch (\Exception $e) {
            Log::error('App settings retrieval error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve app settings',
                'error' => $e->getMessage(),
                'code' => 'SETTINGS_ERROR'
            ], 500);
        }
    }

    /**
     * Update app version for a specific platform (Admin only)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function updateAppVersion(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'platform' => 'required|string|in:ios,android',
                'version' => 'required|string|regex:/^\d+\.\d+\.\d+$/',
                'force_update' => 'nullable|boolean',
            ]);

            $platform = strtolower($validated['platform']);
            $versionKey = 'app_version_' . $platform;
            $forceUpdateKey = 'force_update_' . $platform;

            // Update version
            Setting::setValue(
                $versionKey,
                $validated['version'],
                'string',
                'app',
                "Required version for $platform app"
            );

            // Update force update flag if provided
            if (isset($validated['force_update'])) {
                Setting::setValue(
                    $forceUpdateKey,
                    $validated['force_update'],
                    'bool',
                    'app',
                    "Force update flag for $platform app"
                );
            }

            Log::info('App version updated', [
                'platform' => $platform,
                'version' => $validated['version'],
                'force_update' => $validated['force_update'] ?? false,
                'updated_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "App version for $platform updated successfully",
                'data' => [
                    'platform' => $platform,
                    'version' => $validated['version'],
                    'force_update' => $validated['force_update'] ?? false,
                ],
                'code' => 'APP_VERSION_UPDATED'
            ], 200);

        } catch (\Exception $e) {
            Log::error('App version update error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'updated_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update app version',
                'error' => $e->getMessage(),
                'code' => 'VERSION_UPDATE_ERROR'
            ], 500);
        }
    }

    /**
     * Toggle maintenance mode (Admin only)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function toggleMaintenanceMode(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'enabled' => 'required|boolean',
            ]);

            Setting::setValue(
                'maintenance_enabled',
                $validated['enabled'],
                'bool',
                'app',
                'Enable/disable maintenance mode for the app'
            );

            Log::info('Maintenance mode toggled', [
                'enabled' => $validated['enabled'],
                'toggled_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Maintenance mode ' . ($validated['enabled'] ? 'enabled' : 'disabled'),
                'data' => [
                    'maintenance_enabled' => $validated['enabled'],
                ],
                'code' => 'MAINTENANCE_MODE_UPDATED'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Maintenance mode toggle error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'toggled_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to toggle maintenance mode',
                'error' => $e->getMessage(),
                'code' => 'MAINTENANCE_MODE_ERROR'
            ], 500);
        }
    }
}
