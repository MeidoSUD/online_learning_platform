<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Kreait\Firebase\Messaging\AndroidConfig;
use Kreait\Firebase\Messaging\ApnsConfig;
use Illuminate\Support\Facades\Log;

class FirebaseService
{
    protected $messaging;

    public function __construct()
    {
        // Read credentials from the package config. The kreait/laravel-firebase
        // package stores credentials under `projects.{default}.credentials`.
        $defaultProject = config('firebase.default', 'app');
        $credentials = config('firebase.projects.' . $defaultProject . '.credentials');

        if (empty($credentials)) {
            throw new \RuntimeException('Firebase credentials are not configured. Please set FIREBASE_CREDENTIALS in your .env or update config/firebase.php');
        }

        $firebase = (new Factory)
            ->withServiceAccount($credentials);
        $this->messaging = $firebase->createMessaging();
    }

    /**
     * Send push notification to a single device token.
     */
    public function sendToToken(string $token, string $title, string $body, array $data = []): bool
    {
        try {
            $notification = Notification::create($title, $body);

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

            $androidConfig = AndroidConfig::fromArray([
                'priority' => 'high',
                'notification' => [
                    'channel_id' => $data['channel_id'] ?? 'high_importance_channel',
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

            $message = CloudMessage::withTarget('token', $token)
                ->withNotification($notification)
                ->withData($sanitizedData)
                ->withAndroidConfig($androidConfig)
                ->withApnsConfig($apnsConfig);

            $this->messaging->send($message);

            Log::info('Push notification sent successfully.', [
                'token' => substr($token, 0, 15) . '...',
                'title' => $title,
            ]);

            return true;
        } catch (\Kreait\Firebase\Exception\Messaging\NotFound $e) {
            Log::warning('FCM token not found or expired', ['token' => substr($token, 0, 15) . '...']);
            return false;
        } catch (\Throwable $e) {
            Log::error('Failed to send FCM push notification', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }
}

