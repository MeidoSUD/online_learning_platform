<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class MarketingSmsChannel
{
    /** Sends through the configured Dreams SMS or Unifonic provider. */
    public function send($notifiable, Notification $notification): bool
    {
        $phone = $notifiable->phone_number;
        if (empty($phone)) {
            Log::info('Marketing SMS skipped: no phone number', ['user_id' => $notifiable->id]);
            return false;
        }

        $message = $notification->toMarketingSms($notifiable);
        $provider = strtolower((string) config('services.sms.provider', 'dreamsSms'));

        try {
            if ($provider === 'unifonic') {
                $response = Http::timeout(15)->asForm()->post('https://el.cloud.unifonic.com/rest/SMS/messages', [
                    'AppSid' => config('services.unifonic.app_sid'),
                    'SenderID' => config('services.unifonic.sender_id'),
                    'Recipient' => $phone,
                    'Body' => $message['body'],
                ]);
            } elseif ($provider === 'dreamssms' || $provider === 'custom') {
                $url = config('services.sms.url') ?: 'https://www.dreams.sa/index.php/api/sendsms/';
                $response = Http::timeout(15)->asForm()->post($url, [
                    'user' => config('services.sms.user'),
                    'secret_key' => config('services.sms.secret_key'),
                    'sender' => config('services.sms.sender'),
                    'to' => $phone,
                    'message' => $message['body'],
                ]);
            } else {
                throw new RuntimeException("Unsupported SMS provider [{$provider}]");
            }

            if ($response->successful()) {
                return true;
            }
            Log::warning('Marketing SMS provider rejected request', ['user_id' => $notifiable->id, 'status' => $response->status()]);
        } catch (\Throwable $exception) {
            Log::error('Marketing SMS delivery failed', ['user_id' => $notifiable->id, 'error' => $exception->getMessage()]);
        }

        return false;
    }
}
