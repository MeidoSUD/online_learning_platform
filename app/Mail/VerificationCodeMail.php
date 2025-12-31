<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VerificationCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @var User
     */
    public $user;

    /**
     * @var string
     */
    public $verificationCode;

    /**
     * @var string Type of email: 'register' or 'reset'
     */
    public $type;

    /**
     * Create a new message instance.
     *
     * @param User $user
     * @param string $verificationCode
     * @param string $type
     */
    public function __construct(User $user, $verificationCode, $type = 'register')
    {
        $this->user = $user;
        $this->verificationCode = $verificationCode;
        $this->type = $type;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        $subject = $this->type === 'reset' 
            ? 'Password Reset Verification Code - رمز التحقق من إعادة تعيين كلمة المرور'
            : 'Email Verification Code - رمز التحقق من البريد الإلكتروني';

        return $this->subject($subject)
                    ->view('emails.verification-code')
                    ->with([
                        'user' => $this->user,
                        'verificationCode' => $this->verificationCode,
                        'type' => $this->type,
                    ]);
    }
}
