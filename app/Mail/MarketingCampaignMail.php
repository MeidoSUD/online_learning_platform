<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class MarketingCampaignMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $campaignTitle,
        public string $campaignBody,
        public ?User $user = null
    ) {
    }

    public function build(): static
    {
        $userName = $this->user ? trim(($this->user->first_name ?? '') . ' ' . ($this->user->last_name ?? '')) : '';

        return $this->subject($this->campaignTitle)
            ->view('emails.marketing-campaign')
            ->with([
                'title' => $this->campaignTitle,
                'bodyContent' => $this->campaignBody,
                'userName' => $userName,
                'user' => $this->user,
            ]);
    }
}
