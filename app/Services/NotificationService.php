<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\DeviceToken;
use App\Models\NotificationSetting;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Send notification to user(s) via all enabled channels
     */
    public function send($users, string $type, string $title, string $message, array $data = []): void
    {
        // Convert single user to array
        if ($users instanceof User) {
            $users = [$users];
        }


        foreach ($users as $user) {
            $settings = NotificationSetting::where('user_id', $user->id)->first();
            if ($settings && $settings->sms_enabled && $user->phone_number) {
                $this->sendSMS($user->phone_number, $message);
            }
        }
    }

    /**
     * Get user notification settings
     */
    protected function getUserSettings(int $userId): NotificationSetting
    {
        return NotificationSetting::firstOrCreate(
            ['user_id' => $userId],
            [
                'push_enabled' => false,
                'email_enabled' => false,
                'sms_enabled' => true,
                'order_notifications' => false,
                'application_notifications' => false,
                'payment_notifications' => false,
                'session_notifications' => false,
            ]
        );
    }

    /**
     * Check if notification type is enabled
     */
    protected function isNotificationTypeEnabled(NotificationSetting $settings, string $type): bool
    {
        $typeMap = [
            'order_created' => 'order_notifications',
            'order_updated' => 'order_notifications',
            'order_cancelled' => 'order_notifications',
            'application_received' => 'application_notifications',
            'application_accepted' => 'application_notifications',
            'application_rejected' => 'application_notifications',
            'payment_completed' => 'payment_notifications',
            'payment_failed' => 'payment_notifications',
            'session_scheduled' => 'session_notifications',
            'session_reminder' => 'session_notifications',
            'session_started' => 'session_notifications',
            'session_completed' => 'session_notifications',
        ];

        $settingKey = $typeMap[$type] ?? null;

        return $settingKey ? $settings->$settingKey : true;
    }

    /**
     * Save notification to database
     */
    protected function saveToDatabase(int $userId, string $type, string $title, string $message, array $data): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'send_at' => now(),
        ]);
    }

    /**
     * Send push notification via FCM (Firebase Cloud Messaging)
     */
    protected function sendPushNotification(int $userId, string $title, string $message, array $data): void
    {
        try {
            $tokens = DeviceToken::where('user_id', $userId)
                ->where('is_active', true)
                ->pluck('device_token')
                ->toArray();

            if (empty($tokens)) {
                return;
            }

            $serverKey = config('services.fcm.server_key');

            $response = Http::withHeaders([
                'Authorization' => 'key=' . $serverKey,
                'Content-Type' => 'application/json',
            ])->post('https://fcm.googleapis.com/fcm/send', [
                'registration_ids' => $tokens,
                'notification' => [
                    'title' => $title,
                    'body' => $message,
                    'sound' => 'default',
                    'badge' => 1,
                ],
                'data' => array_merge($data, [
                    'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                ]),
                'priority' => 'high',
            ]);

            if (!$response->successful()) {
                Log::error('FCM push notification failed', [
                    'user_id' => $userId,
                    'response' => $response->body()
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Push notification error: ' . $e->getMessage());
        }
    }

    /**
     * Send SMS via provider
     */
    protected function sendSMS(string $phone, string $message): void
    {
        try {
            // Example using Twilio, Nexmo, or your SMS provider
            $provider = config('services.sms.provider'); // 'twilio', 'nexmo', 'custom'

            switch ($provider) {
                case 'dreamsSms':
                    try {
                        $this->sendViaSms($phone, $message);
                    } catch (\Exception $e) {
                        Log::error('Dreams SMS sending error: ' . $e->getMessage());
                    }
                    break;

                default:
                    Log::warning('No SMS provider configured');
            }
        } catch (\Exception $e) {
            Log::error('SMS sending error: ' . $e->getMessage());
        }
    }

    /**
     * Send SMS via Twilio
     */
    protected function sendViaSms(string $phone, string $message): void
    {
        $client = new \GuzzleHttp\Client();
        $response = $client->post('https://www.dreams.sa/index.php/api/sendsms/', [
            'form_params' => [
                'user'       => config('services.sms.user'),
                'secret_key' => config('services.sms.secret_key'),
                'sender'     => config('services.sms.sender'),
                'to'         => $phone,
                'message'   => $message
            ]
        ]);
    }

    /**
     * Send SMS via Unifonic (Popular in Saudi Arabia)
     */
    protected function sendViaUnifonic(string $phone, string $message): void
    {
        $appSid = config('services.unifonic.app_sid');

        Http::post('https://el.cloud.unifonic.com/rest/SMS/messages', [
            'AppSid' => $appSid,
            'SenderID' => config('services.unifonic.sender_id'),
            'Recipient' => $phone,
            'Body' => $message,
        ]);
    }

    /**
     * Send email notification
     */
    protected function sendEmail(string $email, string $title, string $message, array $data): void
    {
        try {
            Mail::send('emails.notification', [
                'title' => $title,
                'message' => $message,
                'data' => $data,
            ], function ($mail) use ($email, $title) {
                $mail->to($email)
                    ->subject($title);
            });
        } catch (\Exception $e) {
            Log::error('Email sending error: ' . $e->getMessage());
        }
    }
    
}
