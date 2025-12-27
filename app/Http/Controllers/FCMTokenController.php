<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Factory;
use Mockery\Matcher\Not;

class FCMTokenController extends Controller
{

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
        'user_id' => 'required|integer',
        'title' => 'required|string',
        'body' => 'required|string',
        'data' => 'array',
    ]);

    try {
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

        $serviceAccountPath = realpath(storage_path('app/firebase/ewan-geniuses-firebase-adminsdk-fbsvc-45b731f421.json'));

        if (!$serviceAccountPath || !file_exists($serviceAccountPath)) {
            return response()->json([
                'success' => false,
                'message' => 'Firebase service account file not found',
            ], 500);
        }
        
        $factory = (new Factory)
            ->withServiceAccount($serviceAccountPath);

        $messaging = $factory->createMessaging();

        // Create the message payload
        $message = [
            'notification' => [
                'title' => $request->title,
                'body' => $request->body,
            ],
            'data' => $request->input('data', []),
        ];

        // Send to single token using sendMulticast
        $result = $messaging->sendMulticast($message, [$token]);

        // Check if message was sent successfully
        if ($result->hasFailures()) {
            foreach ($result->failures()->getItems() as $failure) {
                Log::error('FCM send failed', [
                    'token' => $failure->target()->value(),
                    'error' => $failure->error()->getMessage()
                ]);
            }
            
           


            return response()->json([
                'success' => false,
                'message' => 'Failed to send notification',
            ], 500);
        }
         // save message in db
            Notification::create([
                'user_id' => $user->id,
                'type' => $request->input('data', [])['type'] ?? 'general',
                'title' => $request->title,
                'message' => $request->body,
                'data' => $request->input('data', []),
                'is_read' => false,
            ]);
        return response()->json([
            'success' => true,
            'message' => 'Notification sent successfully',
            'success_count' => $result->successes()->count(),
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
        $request->validate(['token' => 'required|string']);

        $user = $request->user();
        $user->update(['fcm_token' => $request->token]);

        return response()->json(['message' => app()->getLocale() === 'ar' ? 'تم حفظ الرمز بنجاح' : 'Token saved successfully']);
    }

    public function sendNotification($user, $title, $body)
{
    $user = User::find($user);
    if (!$user) return;
    $fcmToken = $user->fcm_token;
    if (!$fcmToken) return;

    $serverKey = env('FIREBASE_SERVER_KEY'); // from Firebase Console → Project Settings → Cloud Messaging

    $response = Http::withHeaders([
        'Authorization' => 'key=' . $serverKey,
        'Content-Type' => 'application/json',
    ])->post('https://fcm.googleapis.com/fcm/send', [
        'to' => $fcmToken,
        'notification' => [
            'title' => $title,
            'body' => $body,
            'sound' => 'default',
        ],
        'data' => [
            'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
            'id' => '1',
            'status' => 'done',
        ],
    ]);

    return $response->json();
}
}