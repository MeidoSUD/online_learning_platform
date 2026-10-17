<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\MarketingAnnouncement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MarketingAnnouncementController extends Controller
{
    /**
     * Get active marketing announcements/popups targeted for user role and platform.
     *
     * Works both for:
     * - Authenticated users (Sanctum token provided): automatically detects teacher (role 3) or student (role 4).
     * - Public / Guest users: optional query params ?role=student|teacher|both & ?platform=app|web|both.
     */
    public function getActive(Request $request): JsonResponse
    {
        try {
            $platform = $request->query('platform', 'both');
            if (!in_array($platform, ['app', 'web', 'both'])) {
                $platform = 'both';
            }

            // Determine role: authenticated user first, then query parameter, default to 'both'
            $role = 'both';
            $user = auth('sanctum')->user();

            if ($user) {
                if ($user->role_id == 3) {
                    $role = 'teacher';
                } elseif ($user->role_id == 4) {
                    $role = 'student';
                }
            } else {
                $requestedRole = $request->query('role');
                if (in_array($requestedRole, ['student', 'teacher', 'both'])) {
                    $role = $requestedRole;
                }
            }

            $announcements = MarketingAnnouncement::query()
                ->active()
                ->forPlatform($platform)
                ->forRole($role)
                ->orderBy('display_order', 'asc')
                ->orderBy('created_at', 'desc')
                ->get();

            // Transform data for mobile & web consumption
            $formatted = $announcements->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                    'description' => $item->description,
                    'link_url' => $item->link_url,
                    'button_text' => $item->button_text ?: 'سجل الآن',
                    'close_button_text' => $item->close_button_text ?: 'إغلاق',
                    'image_url' => $item->image_url,
                    'target_role' => $item->target_role,
                    'platform' => $item->platform,
                    'starts_at' => $item->starts_at?->toIso8601String(),
                    'expires_at' => $item->expires_at?->toIso8601String(),
                    'display_order' => $item->display_order,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Active marketing announcements retrieved successfully',
                'data' => [
                    'platform' => $platform,
                    'role' => $role,
                    'count' => $formatted->count(),
                    'primary' => $formatted->first(),
                    'announcements' => $formatted,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Error fetching active marketing announcements', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve marketing announcements',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Record click on the announcement action button.
     */
    public function trackClick(int $id): JsonResponse
    {
        $announcement = MarketingAnnouncement::find($id);
        if (!$announcement) {
            return response()->json(['success' => false, 'message' => 'Announcement not found'], 404);
        }

        $announcement->recordClick();

        return response()->json([
            'success' => true,
            'message' => 'Click tracked successfully',
            'data' => [
                'id' => $announcement->id,
                'clicks_count' => $announcement->clicks_count,
            ],
        ]);
    }

    /**
     * Record view/impression of the announcement popup.
     */
    public function trackView(int $id): JsonResponse
    {
        $announcement = MarketingAnnouncement::find($id);
        if (!$announcement) {
            return response()->json(['success' => false, 'message' => 'Announcement not found'], 404);
        }

        $announcement->recordView();

        return response()->json([
            'success' => true,
            'message' => 'View tracked successfully',
            'data' => [
                'id' => $announcement->id,
                'views_count' => $announcement->views_count,
            ],
        ]);
    }
}
