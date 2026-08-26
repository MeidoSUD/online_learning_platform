<?php

namespace App\Channels;

use App\Models\DeviceToken;
use App\Services\FirebaseNotificationService;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class MarketingPushChannel
{
    public function __construct(private FirebaseNotificationService $firebase)
    {
    }

    /** Returns true when FCM accepted delivery to at least one registered device. */
    public function send($notifiable, Notification $notification): bool
    {
        $message = $notification->toMarketingPush($notifiable);
        $tokens = DeviceToken::query()->where('user_id', $notifiable->id)->where('is_active', true)
            ->pluck('device_token')->filter()->unique()->values()->all();

        if (empty($tokens) && !empty($notifiable->fcm_token)) {
            $tokens = [$notifiable->fcm_token];
        }
        if (empty($tokens)) {
            Log::info('Marketing push skipped: no token', ['user_id' => $notifiable->id]);
            return false;
        }

        $data = collect($message['data'] ?? [])->mapWithKeys(
            fn ($value, $key) => [(string) $key => (string) $value]
        )->all();
        $result = $this->firebase->sendToTokens($tokens, $message['title'], $message['body'], $data);

        return $result['success'] > 0;
    }
}
