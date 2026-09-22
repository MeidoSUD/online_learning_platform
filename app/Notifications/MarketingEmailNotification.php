<?php

namespace App\Notifications;

use App\Channels\MarketingEmailChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MarketingEmailNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $title,
        public string $body,
        public int $campaignId
    ) {
    }

    public function via($notifiable): array
    {
        return [MarketingEmailChannel::class];
    }

    public function toMarketingEmail($notifiable): array
    {
        return [
            'title' => $this->title,
            'body' => $this->body,
            'campaign_id' => $this->campaignId,
        ];
    }
}
