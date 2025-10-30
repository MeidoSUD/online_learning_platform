<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'push_enabled', 'email_enabled', 'sms_enabled',
        'order_notifications', 'application_notifications',
        'payment_notifications', 'session_notifications'
    ];

    protected $casts = [
        'push_enabled' => 'boolean',
        'email_enabled' => 'boolean',
        'sms_enabled' => 'boolean',
        'order_notifications' => 'boolean',
        'application_notifications' => 'boolean',
        'payment_notifications' => 'boolean',
        'session_notifications' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}