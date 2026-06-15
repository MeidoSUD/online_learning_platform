<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;
use Illuminate\Support\Facades\Log;
use App\Models\DeviceToken;

class FirebaseService
{
    protected $messaging;

    public function __construct()
    {
        try {
            $defaultProject = config('firebase.default', 'app');
            $credentials = config('firebase.projects.' . $defaultProject . '.credentials');
            if ($credentials && file_exists($credentials)) {
                $factory = (new Factory)->withServiceAccount($credentials);
                $this->messaging = $factory->createMessaging();
            }
        } catch (\Exception $e) {
            Log::error('Firebase service initialization failed: ' . $e->getMessage());
        }
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
}
