<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VerificationCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $user;
    public string $verificationCode;
    public string $type;

    /**
     * Create a new message instance.
     *
     * @param User $user
     * @param string|int $verificationCode
     * @param string $type Type of email: 'register' or 'reset' or 'login'
     */
    public function __construct(User $user, $verificationCode, string $type = 'register')
    {
        $this->user = $user;
        $this->verificationCode = (string) $verificationCode;
        $this->type = $type;
    }

    /**
     * Build the message with clean subject and multipart plain text fallback.
     *
     * @return $this
     */
    public function build()
    {
        $subject = match ($this->type) {
            'reset' => 'Your Ewan Learning password reset code',
            'login' => 'Your Ewan Learning login verification code',
            default => 'Your Ewan Learning verification code',
        };

        return $this->subject($subject)
                    ->view('emails.verification-code')
                    ->text('emails.verification-code-text')
                    ->with([
                        'user' => $this->user,
                        'verificationCode' => $this->verificationCode,
                        'type' => $this->type,
                    ]);
    }
}
