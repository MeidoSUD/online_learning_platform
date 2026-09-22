<?php

namespace App\Channels;

use App\Mail\MarketingCampaignMail;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MarketingEmailChannel
{
    /** Send marketing campaign email to the user. Returns true on success. */
    public function send($notifiable, Notification $notification): bool
    {
        $email = $notifiable->email ?? null;
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Log::info('Marketing email skipped: missing or invalid email', ['user_id' => $notifiable->id ?? null]);
            return false;
        }

        try {
            $data = $notification->toMarketingEmail($notifiable);
            Mail::to($email)->send(new MarketingCampaignMail(
                $data['title'],
                $data['body'],
                $notifiable
            ));
            return true;
        } catch (\Throwable $e) {
            Log::warning('Marketing email delivery failed for user', [
                'user_id' => $notifiable->id ?? null,
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
