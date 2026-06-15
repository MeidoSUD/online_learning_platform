<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\DeviceToken;

class FirebaseNotificationService
{
    protected $messaging;

    public function __construct()
    {
        try {
            $credentials = config('firebase.projects.app.credentials');
            if ($credentials && file_exists($credentials)) {
                $factory = (new Factory)->withServiceAccount($credentials);
                $this->messaging = $factory->createMessaging();
            }
        } catch (\Exception $e) {
            Log::error('Firebase initialization failed: ' . $e->getMessage());
        }
    }

    public function sendToUser(User $user, string $title, string $body, array $data = []): bool
    {
        $fcmToken = $user->fcm_token;

        if (empty($fcmToken)) {
            Log::warning('No FCM token for user', ['user_id' => $user->id]);
            return false;
        }

        return $this->sendToToken($fcmToken, $title, $body, $data);
    }

    public function sendToMultipleUsers(array $users, string $title, string $body, array $data = []): array
    {
        $tokens = [];
        foreach ($users as $user) {
            if (!empty($user->fcm_token)) {
                $tokens[] = $user->fcm_token;
            }
        }

        if (empty($tokens)) {
            Log::warning('No valid FCM tokens found for batch send');
            return ['success' => 0, 'failure' => 0];
        }

        return $this->sendToTokens($tokens, $title, $body, $data);
    }

    public function sendToToken(string $token, string $title, string $body, array $data = []): bool
    {
        try {
            if (!$this->messaging) {
                Log::error('Firebase messaging not initialized');
                return false;
            }

            $notification = FirebaseNotification::create($title, $body);
            $message = CloudMessage::withTarget('token', $token)
                ->withNotification($notification)
                ->withData($data);
            // Log::info(json_encode($message));

            $this->messaging->send($message);
            return true;
        } catch (\Kreait\Firebase\Exception\Messaging\NotFound $e) {
            Log::warning('FCM token not found or expired', ['token' => substr($token, 0, 20)]);
            DeviceToken::where('device_token', $token)->update(['is_active' => false]);
            return false;
        } catch (\Exception $e) {
            Log::error('Firebase notification failed: ' . $e->getMessage());
            return false;
        }
    }

    public function sendToTokens(array $tokens, string $title, string $body, array $data = []): array
    {
        $results = [
            'success' => 0,
            'failure' => 0
        ];

        foreach ($tokens as $token) {
            if ($this->sendToToken($token, $title, $body, $data)) {
                $results['success']++;
            } else {
                $results['failure']++;
            }
        }

        return $results;
    }

    public function sendToTopic(string $topic, string $title, string $body, array $data = []): bool
    {
        try {
            if (!$this->messaging) {
                Log::error('Firebase messaging not initialized');
                return false;
            }

            $notification = FirebaseNotification::create($title, $body);
            $message = CloudMessage::withTarget('topic', $topic)
                ->withNotification($notification)
                ->withData($data);

            $this->messaging->send($message);
            return true;
        } catch (\Exception $e) {
            Log::error('Firebase topic notification failed: ' . $e->getMessage());
            return false;
        }
    }

    public function subscribeToTopic($tokens, string $topic): bool
    {
        try {
            if (!$this->messaging) {
                Log::warning('Firebase messaging not initialized');
                return false;
            }
            $tokens = is_array($tokens) ? $tokens : [$tokens];
            $this->messaging->subscribeToTopic($topic, $tokens);
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to subscribe to topic', [
                'topic' => $topic,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
}