<?php

namespace App\Notifications;

use App\Channels\MarketingSmsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MarketingSmsNotification extends Notification
{
    use Queueable;

    public function __construct(public string $body, public int $campaignId)
    {
    }

    public function via($notifiable): array
    {
        return [MarketingSmsChannel::class];
    }

    public function toMarketingSms($notifiable): array
    {
        return ['body' => $this->body, 'campaign_id' => $this->campaignId];
    }
}
