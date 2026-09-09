<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class MarketingSmsChannel
{
    /**
     * Sends through the Dreams SMS provider using exactly the same
     * Guzzle form-params approach as the register/reset verification SMS
     * (sendVerificationSMS in AuthController).
     */
    public function send($notifiable, Notification $notification): bool
    {
        $phone = $notifiable->phone_number;
        if (empty($phone)) {
            Log::info('Marketing SMS skipped: no phone number', ['user_id' => $notifiable->id]);
            return false;
        }

        // Normalize phone number the same way register does (strip leading +)
        $smsPhone = str_starts_with($phone, '+') ? substr($phone, 1) : $phone;

        $message = $notification->toMarketingSms($notifiable);
        $provider = strtolower((string) config('services.sms.provider', 'dreamsSms'));

        $url = config('services.sms.url') ?: 'https://www.dreams.sa/index.php/api/sendsms/';
        $payload = [
            'user' => config('services.sms.user'),
            'secret_key' => config('services.sms.secret_key'),
            'sender' => config('services.sms.sender'),
            'to' => $smsPhone,
            'message' => $message['body'],
        ];

        Log::info('Marketing SMS provider call', [
            'user_id' => $notifiable->id,
            'provider' => $provider,
            'url' => $url,
            'to' => substr($smsPhone, -4),
            'msisdn' => $smsPhone,
            'message_length' => mb_strlen($message['body']),
            'payload_keys' => array_keys($payload),
        ]);

        try {
            if ($provider !== 'dreamssms' && $provider !== 'custom') {
                throw new RuntimeException("Unsupported SMS provider [{$provider}]");
            }

            $client = new \GuzzleHttp\Client(['timeout' => 10]);
            $response = $client->post($url, [
                'form_params' => $payload,
            ]);

            $body = (string) $response->getBody();
            $decoded = json_decode($body, true);

            Log::info('Marketing SMS provider response', [
                'user_id' => $notifiable->id,
                'status_code' => $response->getStatusCode(),
                'response_body' => $body,
                'decoded' => $decoded,
                'success' => $response->getStatusCode() >= 200 && $response->getStatusCode() < 300,
            ]);

            if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 300) {
                return true;
            }

            Log::warning('Marketing SMS provider rejected request', [
                'user_id' => $notifiable->id,
                'status' => $response->getStatusCode(),
                'body' => $body,
            ]);
        } catch (\Throwable $exception) {
            Log::error('Marketing SMS delivery failed', [
                'user_id' => $notifiable->id,
                'to' => substr($smsPhone, -4),
                'error' => $exception->getMessage(),
                'trace' => $exception->getTraceAsString(),
            ]);
        }

        return false;
    }
}