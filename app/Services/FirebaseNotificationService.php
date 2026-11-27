<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;
use Kreait\Firebase\Messaging\AndroidConfig;
use Kreait\Firebase\Messaging\ApnsConfig;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class FirebaseNotificationService
{
    protected $messaging;

    public function __construct()
    {
        try {
            $factory = (new Factory)
                ->withServiceAccount(
                    config('firebase.projects.app.credentials')
                );

            $this->messaging = $factory->createMessaging();
        } catch (\Exception $e) {
            Log::error('Firebase initialization failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Build standard CloudMessage with Notification, Data, Android channel, and APNS config.
     */
    protected function buildMessage(string $targetType, string $targetValue, string $title, string $body, array $data = []): CloudMessage
    {
        $notification = FirebaseNotification::create($title, $body);

        // Ensure all values in data payload are strings for FCM HTTP v1
        $sanitizedData = [];
        foreach ($data as $key => $value) {
            if (is_array($value) || is_object($value)) {
                $sanitizedData[(string) $key] = json_encode($value, JSON_UNESCAPED_UNICODE);
            } elseif (is_bool($value)) {
                $sanitizedData[(string) $key] = $value ? '1' : '0';
            } elseif ($value === null) {
                $sanitizedData[(string) $key] = '';
            } else {
                $sanitizedData[(string) $key] = (string) $value;
            }
        }

        $channelId = $data['channel_id'] ?? 'high_importance_channel';

        $androidConfig = AndroidConfig::fromArray([
            'priority' => 'high',
            'notification' => [
                'channel_id' => $channelId,
                'sound' => 'default',
                'default_sound' => true,
                'default_vibrate_timings' => true,
                'notification_priority' => 'PRIORITY_HIGH',
            ],
        ]);

        $apnsConfig = ApnsConfig::fromArray([
            'headers' => [
                'apns-priority' => '10',
            ],
            'payload' => [
                'aps' => [
                    'alert' => [
                        'title' => $title,
                        'body' => $body,
                    ],
                    'sound' => 'default',
                    'badge' => 1,
                    'content-available' => 1,
                ],
            ],
        ]);

        return CloudMessage::withTarget($targetType, $targetValue)
            ->withNotification($notification)
            ->withData($sanitizedData)
            ->withAndroidConfig($androidConfig)
            ->withApnsConfig($apnsConfig);
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
            $message = $this->buildMessage('token', $token, $title, $body, $data);

            $this->messaging->send($message);

            Log::info('Firebase notification sent', [
                'token' => substr($token, 0, 15) . '...',
                'title' => $title
            ]);

            return true;
        } catch (\Kreait\Firebase\Exception\Messaging\NotFound $e) {
            Log::warning('FCM token not found or expired', ['token' => substr($token, 0, 15) . '...']);
            return false;
        } catch (\Throwable $e) {
            Log::error('Failed to send Firebase notification', [
                'token' => substr($token, 0, 15) . '...',
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
        $results = [
            'success' => 0,
            'failure' => 0
        ];

        foreach (array_unique(array_filter($tokens)) as $token) {
            try {
                $message = $this->buildMessage('token', $token, $title, $body, $data);
                $this->messaging->send($message);
                $results['success']++;
            } catch (\Kreait\Firebase\Exception\Messaging\NotFound $e) {
                Log::warning('FCM token not found or expired in batch', ['token' => substr($token, 0, 15) . '...']);
                $results['failure']++;
                try {
                    if (class_exists(\App\Models\DeviceToken::class)) {
                        \App\Models\DeviceToken::where('device_token', $token)->update(['is_active' => false]);
                    }
                } catch (\Throwable $deactivationError) {
                    // Ignore DB errors during token deactivation
                }
            } catch (\Throwable $e) {
                Log::error('Failed to send Firebase notification in batch', [
                    'token' => substr($token, 0, 15) . '...',
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
            $message = $this->buildMessage('topic', $topic, $title, $body, $data);

            $this->messaging->send($message);

            Log::info('Firebase topic notification sent', [
                'topic' => $topic,
                'title' => $title
            ]);

            return true;
        } catch (\Throwable $e) {
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