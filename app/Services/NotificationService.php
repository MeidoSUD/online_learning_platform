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
        if ($users instanceof User) {
            $users = [$users];
        }
        Log::info('send notification', [
            'users' => $users,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
        $data['type'] = $type;

        foreach ($users as $user) {
            try {
                $this->saveToDatabase($user->id, $type, $title, $message, $data);

                $settings = $this->getUserSettings($user->id);

                if ($settings->push_enabled) {
                    $this->sendPushNotification($user->id, $title, $message, $data);
                }

                if ($settings->email_enabled && $user->email) {
                    $this->sendEmail($user->email, $title, $message, $data);
                }

                if ($settings->sms_enabled && $user->phone_number) {
                    $this->sendSMS($user->phone_number, $message);
                }
            } catch (\Exception $e) {
                Log::error('Notification delivery failed', [
                    'user_id' => $user->id,
                    'type' => $type,
                    'error' => $e->getMessage()
                ]);
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
            'payment_success' => 'payment_notifications',
            'payment_failed' => 'payment_notifications',
            'booking_received' => 'order_notifications',
            'session_scheduled' => 'session_notifications',
            'session_reminder' => 'session_notifications',
            'session_started' => 'session_notifications',
            'session_completed' => 'session_notifications',
            'session_link_ready' => 'session_notifications',
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

            $messaging = app('firebase.messaging');

            $formattedData = [];
            foreach ($data as $key => $value) {
                $formattedData[(string)$key] = (string)$value;
            }

            $messageObject = \Kreait\Firebase\Messaging\CloudMessage::new()
                ->withNotification(\Kreait\Firebase\Messaging\Notification::create($title, $message))
                ->withData($formattedData);

            $messaging->sendMulticast($messageObject, $tokens);
            Log::info('Push notification sent successfully to user', [
                'user_id' => $userId,

                'tokens_count' => count($tokens),
            ]);
            Log::info('messageObject', [
                'messageObject' => $messageObject,
            ]);
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


    /**
     * Send bilingual SMS notification via dreams.sa provider
     * This method sends SMS for critical scenarios like payment confirmation and session reminders
     * 
     * @param string $phone Phone number (will accept both +966 and 966 formats)
     * @param string $message Bilingual message (Arabic and English)
     * @return array Response from SMS provider
     */
    public function sendBilingualSMS(string $phone, string $message): array
    {
        try {
            // Normalize phone number - remove + if present
            $normalizedPhone = str_starts_with($phone, '+') ? substr($phone, 1) : $phone;

            $client = new \GuzzleHttp\Client();
            $response = $client->post('https://www.dreams.sa/index.php/api/sendsms/', [
                'form_params' => [
                    'user'       => config('services.sms.user'),
                    'secret_key' => config('services.sms.secret_key'),
                    'sender'     => config('services.sms.sender'),
                    'to'         => $normalizedPhone,
                    'message'    => $message
                ]
            ]);

            $responseData = json_decode($response->getBody(), true);
            
            // Ensure response is always an array - dreams.sa might return int (1) for success
            if (!is_array($responseData)) {
                $responseData = ['status' => $responseData, 'success' => true];
            }

            Log::info('Bilingual SMS sent successfully', [
                'phone' => substr($normalizedPhone, -4),
                'provider' => 'dreams.sa',
                'response_status' => $responseData['status'] ?? 'unknown'
            ]);

            return $responseData;
        } catch (\Exception $e) {
            Log::error('Failed to send bilingual SMS', [
                'phone' => substr($phone, -4),
                'error' => $e->getMessage()
            ]);
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
