<?php

namespace App\Notifications;

use App\Channels\MarketingPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MarketingPushNotification extends Notification
{
    use Queueable;

    public function __construct(public string $title, public string $body, public int $campaignId)
    {
    }

    public function via($notifiable): array
    {
        return [MarketingPushChannel::class];
    }

    public function toMarketingPush($notifiable): array
    {
        return [
            'title' => $this->title,
            'body' => $this->body,
            'data' => ['type' => 'marketing', 'campaign_id' => (string) $this->campaignId],
        ];
    }
}
