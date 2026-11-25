<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use App\Services\FirebaseNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FCMTokenController extends Controller
{
    protected $firebaseNotificationService;

    public function __construct(FirebaseNotificationService $firebaseNotificationService)
    {
        $this->firebaseNotificationService = $firebaseNotificationService;
    }

    // fetch all notification for a user
    public function getNotifications(Request $request): JsonResponse
    {
        $user = $request->user();
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    // mark a notification as read
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $notification = Notification::where('user_id', $user->id)->findOrFail($id);
        $notification->is_read = true;
        $notification->read_at = now();
        $notification->save();


        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
        ]);
    }

    // mark all notifications as read
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
        ]);
    }

    // delete a notification
    public function deleteNotification(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $notification = Notification::where('user_id', $user->id)->findOrFail($id);
        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted',
        ]);
    }

    public function sendToToken(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required_without:token|nullable|integer',
            'token' => 'required_without:user_id|nullable|string',
            'title' => 'required|string',
            'body' => 'required|string',
            'data' => 'nullable|array',
        ]);

        try {
            $user = null;
            $token = $request->input('token');

            if ($request->filled('user_id')) {
                $user = User::find($request->user_id);
                if (!$user) {
                    return response()->json([
                        'success' => false,
                        'message' => 'User not found',
                    ], 404);
                }

                $token = $user->fcm_token;
                if (!$token) {
                    return response()->json([
                        'success' => false,
                        'message' => 'User does not have a valid FCM token',
                    ], 400);
                }
            }

            if (!$token) {
                return response()->json([
                    'success' => false,
                    'message' => 'Valid FCM token is required',
                ], 400);
            }

            $sent = $this->firebaseNotificationService->sendToToken(
                $token,
                $request->title,
                $request->body,
                $request->input('data', [])
            );

            if ($sent && $user) {
                Notification::create([
                    'user_id' => $user->id,
                    'type' => $request->input('data', [])['type'] ?? 'general',
                    'title' => $request->title,
                    'message' => $request->body,
                    'data' => $request->input('data', []),
                    'is_read' => false,
                    'sent_at' => now(),
                ]);
            }

            return response()->json([
                'success' => $sent,
                'message' => $sent ? 'Notification sent successfully' : 'Failed to send notification',
            ]);

        } catch (\Throwable $e) {
            Log::error('FCM send error', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send notification',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function save(Request $request)
    {
        $token = $request->input('token') ?? $request->input('fcm_token') ?? $request->input('device_token');

        if (empty($token) || !is_string($token)) {
            return response()->json([
                'success' => false,
                'message' => 'The token field is required (accepted keys: token, fcm_token, device_token).',
            ], 422);
        }

        $user = $request->user();
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // 1. Update token on users table
        $user->update(['fcm_token' => $token]);

        // 2. Also sync to device_tokens table for multi-device push notification delivery
        try {
            if (class_exists(\App\Models\DeviceToken::class)) {
                \App\Models\DeviceToken::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'device_token' => $token,
                    ],
                    [
                        'device_type' => $request->input('device_type', 'android'),
                        'is_active' => true,
                    ]
                );
            }
        } catch (\Throwable $e) {
            Log::warning('Failed to sync device_tokens in FCMTokenController::save: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => app()->getLocale() === 'ar' ? 'تم حفظ الرمز بنجاح' : 'Token saved successfully',
            'token' => substr($token, 0, 15) . '...',
        ]);
    }

}