<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
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

            $message = CloudMessage::withTarget('token', $token)
                ->withNotification($notification)
                ->withData($data);

            $this->messaging->send($message);

            Log::info('Push notification sent successfully.', [
                'token' => substr($token, 0, 20) . '...', // Don't log full token
                'title' => $title,
            ]);

            return true;
        } catch (\Kreait\Firebase\Exception\Messaging\NotFound $e) {
            Log::warning('FCM token not found or expired', ['token' => substr($token, 0, 20)]);
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
