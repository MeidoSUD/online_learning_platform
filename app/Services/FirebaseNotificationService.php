<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class FirebaseNotificationService
{
    protected $messaging;

    public function __construct()
    {
        try {
            $factory = (new Factory)->withServiceAccount(config('firebase.credentials.file'));
            $this->messaging = $factory->createMessaging();
        } catch (\Exception $e) {
            Log::error('Firebase initialization failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Send notification to a single user
     * 
     * @param User $user
     * @param string $title
     * @param string $body
     * @param array $data Additional data payload
     * @return bool
     */
    public function sendToUser(User $user, string $title, string $body, array $data = []): bool
    {
        // Get user's FCM token (you need to store this in users table)
        $fcmToken = $user->fcm_token;

        if (empty($fcmToken)) {
            Log::warning('No FCM token for user', ['user_id' => $user->id]);
            return false;
        }

        return $this->sendToToken($fcmToken, $title, $body, $data);
    }

    /**
     * Send notification to multiple users
     * 
     * @param array $users Array of User models
     * @param string $title
     * @param string $body
     * @param array $data
     * @return array Results with success/failure counts
     */
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

    /**
     * Send notification to a single FCM token
     * 
     * @param string $token
     * @param string $title
     * @param string $body
     * @param array $data
     * @return bool
     */
    public function sendToToken(string $token, string $title, string $body, array $data = []): bool
    {
        try {
            $notification = FirebaseNotification::create($title, $body);

            $message = CloudMessage::withTarget('token', $token)
                ->withNotification($notification)
                ->withData($data);

            $this->messaging->send($message);

            Log::info('Firebase notification sent', [
                'token' => substr($token, 0, 10) . '...',
                'title' => $title
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send Firebase notification', [
                'token' => substr($token, 0, 10) . '...',
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Send notification to multiple FCM tokens
     * 
     * @param array $tokens
     * @param string $title
     * @param string $body
     * @param array $data
     * @return array
     */
    public function sendToTokens(array $tokens, string $title, string $body, array $data = []): array
    {
        $notification = FirebaseNotification::create($title, $body);

        $results = [
            'success' => 0,
            'failure' => 0
        ];

        foreach ($tokens as $token) {
            try {
                $message = CloudMessage::withTarget('token', $token)
                    ->withNotification($notification)
                    ->withData($data);

                $this->messaging->send($message);
                $results['success']++;
            } catch (\Exception $e) {
                Log::error('Failed to send Firebase notification in batch', [
                    'token' => substr($token, 0, 10) . '...',
                    'error' => $e->getMessage()
                ]);
                $results['failure']++;
            }
        }

        Log::info('Firebase batch notification completed', $results);

        return $results;
    }

    /**
     * Send notification to topic (useful for broadcasting)
     * 
     * @param string $topic
     * @param string $title
     * @param string $body
     * @param array $data
     * @return bool
     */
    public function sendToTopic(string $topic, string $title, string $body, array $data = []): bool
    {
        try {
            $notification = FirebaseNotification::create($title, $body);

            $message = CloudMessage::withTarget('topic', $topic)
                ->withNotification($notification)
                ->withData($data);

            $this->messaging->send($message);

            Log::info('Firebase topic notification sent', [
                'topic' => $topic,
                'title' => $title
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send Firebase topic notification', [
                'topic' => $topic,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Subscribe user to topic
     * 
     * @param string|array $tokens
     * @param string $topic
     * @return bool
     */
    public function subscribeToTopic($tokens, string $topic): bool
    {
        try {
            $tokens = is_array($tokens) ? $tokens : [$tokens];
            $this->messaging->subscribeToTopic($topic, $tokens);
            
            Log::info('Subscribed to topic', ['topic' => $topic, 'count' => count($tokens)]);
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