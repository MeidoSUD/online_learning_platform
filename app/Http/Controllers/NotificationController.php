<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\DeviceToken;
use App\Models\NotificationSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // Get user notifications
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $unreadCount = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'success' => true,
            'data' => $notifications->items(),
            'unread_count' => $unreadCount,
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'total_pages' => $notifications->lastPage(),
                'total_items' => $notifications->total(),
            ]
        ]);
    }

    // Get unread notifications
    public function unread(Request $request): JsonResponse
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'count' => $notifications->count()
        ]);
    }

    // Mark notification as read
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read'
        ]);
    }

    // Mark all notifications as read
    public function markAllAsRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read'
        ]);
    }

    // Delete notification
    public function destroy(Request $request, int $id): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted'
        ]);
    }

    // Clear all read notifications
    public function clearRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNotNull('read_at')
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Read notifications cleared'
        ]);
    }

    // Register device token (for push notifications)
    public function registerDevice(Request $request): JsonResponse
    {
        $request->validate([
            'device_token' => 'required|string',
            'device_type' => 'required|in:ios,android,web',
        ]);

        DeviceToken::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'device_token' => $request->input('device_token'),
            ],
            [
                'device_type' => $request->input('device_type'),
                'is_active' => true,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Device registered successfully'
        ]);
    }

    // Unregister device token
    public function unregisterDevice(Request $request): JsonResponse
    {
        $request->validate([
            'device_token' => 'required|string',
        ]);

        DeviceToken::where('user_id', $request->user()->id)
            ->where('device_token', $request->input('device_token'))
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Device unregistered successfully'
        ]);
    }

    // Get notification settings
    public function getSettings(Request $request): JsonResponse
    {
        $settings = NotificationSetting::firstOrCreate(
            ['user_id' => $request->user()->id]
        );

        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    // Update notification settings
    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'push_enabled' => 'boolean',
            'email_enabled' => 'boolean',
            'sms_enabled' => 'boolean',
            'order_notifications' => 'boolean',
            'application_notifications' => 'boolean',
            'payment_notifications' => 'boolean',
            'session_notifications' => 'boolean',
        ]);

        $settings = NotificationSetting::updateOrCreate(
            ['user_id' => $request->user()->id],
            $request->only([
                'push_enabled', 'email_enabled', 'sms_enabled',
                'order_notifications', 'application_notifications',
                'payment_notifications', 'session_notifications'
            ])
        );

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
            'data' => $settings
        ]);
    }
}