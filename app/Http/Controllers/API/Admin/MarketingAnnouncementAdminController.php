<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\MarketingAnnouncement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class MarketingAnnouncementAdminController extends Controller
{
    /**
     * List all marketing announcements with filters.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = MarketingAnnouncement::query();

            // Filter by active status
            if ($request->has('is_active') && $request->input('is_active') !== null && $request->input('is_active') !== '') {
                $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
            }

            // Filter by target role
            if ($request->filled('target_role') && $request->input('target_role') !== 'all') {
                $query->where('target_role', $request->input('target_role'));
            }

            // Filter by platform
            if ($request->filled('platform') && $request->input('platform') !== 'all') {
                $query->where('platform', $request->input('platform'));
            }

            // Search query
            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('link_url', 'like', "%{$search}%");
                });
            }

            $query->orderBy('display_order', 'asc')
                  ->orderBy('created_at', 'desc');

            if ($request->boolean('all')) {
                $announcements = $query->get();
                return response()->json([
                    'success' => true,
                    'message' => 'Announcements retrieved successfully',
                    'data' => $announcements,
                ]);
            }

            $perPage = $request->integer('per_page', 15);
            $announcements = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Announcements retrieved successfully',
                'data' => $announcements->items(),
                'meta' => [
                    'current_page' => $announcements->currentPage(),
                    'last_page' => $announcements->lastPage(),
                    'per_page' => $announcements->perPage(),
                    'total' => $announcements->total(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Error fetching marketing announcements', [
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
     * Get summary statistics for dashboard.
     */
    public function stats(): JsonResponse
    {
        try {
            $total = MarketingAnnouncement::count();
            $active = MarketingAnnouncement::active()->count();
            $students = MarketingAnnouncement::whereIn('target_role', ['student', 'both'])->count();
            $teachers = MarketingAnnouncement::whereIn('target_role', ['teacher', 'both'])->count();
            $totalClicks = (int) MarketingAnnouncement::sum('clicks_count');
            $totalViews = (int) MarketingAnnouncement::sum('views_count');

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $total,
                    'active' => $active,
                    'inactive' => $total - $active,
                    'target_students' => $students,
                    'target_teachers' => $teachers,
                    'total_clicks' => $totalClicks,
                    'total_views' => $totalViews,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to calculate stats',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created marketing announcement.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'link_url' => ['required', 'string', 'max:2048'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'close_button_text' => ['nullable', 'string', 'max:100'],
            'target_role' => ['required', Rule::in(['student', 'teacher', 'both'])],
            'platform' => ['required', Rule::in(['app', 'web', 'both'])],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120'],
            'is_active' => ['nullable', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'display_order' => ['nullable', 'integer'],
        ]);

        try {
            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('marketing_announcements', 'public');
            }

            $announcement = MarketingAnnouncement::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'link_url' => $validated['link_url'],
                'button_text' => !empty($validated['button_text']) ? $validated['button_text'] : 'سجل الآن',
                'close_button_text' => !empty($validated['close_button_text']) ? $validated['close_button_text'] : 'إغلاق',
                'target_role' => $validated['target_role'],
                'platform' => $validated['platform'],
                'image_path' => $imagePath,
                'is_active' => $request->has('is_active') ? $request->boolean('is_active') : true,
                'starts_at' => $validated['starts_at'] ?? null,
                'expires_at' => $validated['expires_at'] ?? null,
                'display_order' => $validated['display_order'] ?? 0,
            ]);

            Log::info('Marketing announcement created by admin', [
                'admin_id' => $request->user()?->id,
                'announcement_id' => $announcement->id,
                'title' => $announcement->title,
                'target_role' => $announcement->target_role,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Marketing announcement created successfully',
                'data' => $announcement,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Failed to create marketing announcement', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create marketing announcement',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display a specific marketing announcement.
     */
    public function show(int $id): JsonResponse
    {
        $announcement = MarketingAnnouncement::find($id);
        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Marketing announcement not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $announcement,
        ]);
    }

    /**
     * Update an existing marketing announcement.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $announcement = MarketingAnnouncement::find($id);
        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Marketing announcement not found',
            ], 404);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'required', 'string'],
            'link_url' => ['sometimes', 'required', 'string', 'max:2048'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'close_button_text' => ['nullable', 'string', 'max:100'],
            'target_role' => ['sometimes', 'required', Rule::in(['student', 'teacher', 'both'])],
            'platform' => ['sometimes', 'required', Rule::in(['app', 'web', 'both'])],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:5120'],
            'remove_image' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'starts_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'display_order' => ['nullable', 'integer'],
        ]);

        try {
            // Handle image removal or replacement
            if ($request->boolean('remove_image')) {
                if ($announcement->image_path && Storage::disk('public')->exists($announcement->image_path)) {
                    Storage::disk('public')->delete($announcement->image_path);
                }
                $announcement->image_path = null;
            } elseif ($request->hasFile('image')) {
                if ($announcement->image_path && Storage::disk('public')->exists($announcement->image_path)) {
                    Storage::disk('public')->delete($announcement->image_path);
                }
                $announcement->image_path = $request->file('image')->store('marketing_announcements', 'public');
            }

            if (isset($validated['title'])) $announcement->title = $validated['title'];
            if (isset($validated['description'])) $announcement->description = $validated['description'];
            if (isset($validated['link_url'])) $announcement->link_url = $validated['link_url'];
            if (array_key_exists('button_text', $validated)) $announcement->button_text = $validated['button_text'] ?: 'سجل الآن';
            if (array_key_exists('close_button_text', $validated)) $announcement->close_button_text = $validated['close_button_text'] ?: 'إغلاق';
            if (isset($validated['target_role'])) $announcement->target_role = $validated['target_role'];
            if (isset($validated['platform'])) $announcement->platform = $validated['platform'];
            if ($request->has('is_active')) $announcement->is_active = $request->boolean('is_active');
            if (array_key_exists('starts_at', $validated)) $announcement->starts_at = $validated['starts_at'];
            if (array_key_exists('expires_at', $validated)) $announcement->expires_at = $validated['expires_at'];
            if (isset($validated['display_order'])) $announcement->display_order = $validated['display_order'];

            $announcement->save();

            Log::info('Marketing announcement updated', [
                'admin_id' => $request->user()?->id,
                'announcement_id' => $announcement->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Marketing announcement updated successfully',
                'data' => $announcement,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to update marketing announcement', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update marketing announcement',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Toggle active state of an announcement.
     */
    public function toggleActive(int $id): JsonResponse
    {
        $announcement = MarketingAnnouncement::find($id);
        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Marketing announcement not found',
            ], 404);
        }

        $announcement->is_active = !$announcement->is_active;
        $announcement->save();

        return response()->json([
            'success' => true,
            'message' => 'Announcement status updated successfully',
            'data' => [
                'id' => $announcement->id,
                'is_active' => $announcement->is_active,
            ],
        ]);
    }

    /**
     * Delete an announcement.
     */
    public function destroy(int $id): JsonResponse
    {
        $announcement = MarketingAnnouncement::find($id);
        if (!$announcement) {
            return response()->json([
                'success' => false,
                'message' => 'Marketing announcement not found',
            ], 404);
        }

        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Marketing announcement deleted successfully',
        ]);
    }
}
