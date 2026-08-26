<?php

namespace App\Jobs;

use App\Channels\MarketingPushChannel;
use App\Channels\MarketingSmsChannel;
use App\Models\MarketingNotification;
use App\Notifications\MarketingPushNotification;
use App\Notifications\MarketingSmsNotification;
use App\Services\MarketingNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendMarketingNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 1200;
    public int $tries = 3;

    public function __construct(public int $campaignId)
    {
    }

    public function handle(MarketingNotificationService $service, MarketingPushChannel $push, MarketingSmsChannel $sms): void
    {
        $campaign = MarketingNotification::find($this->campaignId);
        if (!$campaign || $campaign->status !== 'pending') {
            return;
        }

        $sent = 0;
        try {
            $service->recipientsQuery($campaign)->orderBy('id')->chunkById(MarketingNotificationService::BATCH_SIZE,
                function ($users) use (&$sent, $campaign, $push, $sms) {
                    foreach ($users as $user) {
                        $delivered = false;
                        if (in_array($campaign->channel, ['push', 'both'], true)) {
                            $delivered = $push->send($user, new MarketingPushNotification($campaign->title, $campaign->body, $campaign->id)) || $delivered;
                        }
                        if (in_array($campaign->channel, ['sms', 'both'], true)) {
                            $delivered = $sms->send($user, new MarketingSmsNotification($campaign->body, $campaign->id)) || $delivered;
                        }
                        if ($delivered) {
                            $sent++;
                        }
                    }
                });

            $campaign->update(['total_sent' => $sent, 'status' => $sent > 0 ? 'sent' : 'failed']);
        } catch (\Throwable $exception) {
            $campaign->update(['total_sent' => $sent, 'status' => 'failed']);
            Log::error('Marketing campaign failed', ['campaign_id' => $campaign->id, 'error' => $exception->getMessage()]);
            throw $exception;
        }
    }

    public function failed(\Throwable $exception): void
    {
        MarketingNotification::whereKey($this->campaignId)->where('status', 'pending')->update(['status' => 'failed']);
    }
}
