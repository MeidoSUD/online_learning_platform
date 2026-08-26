<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketingNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'body', 'channel', 'target_type', 'target_user_id', 'scheduled_at',
        'status', 'total_targeted', 'total_sent',
    ];

    protected $casts = ['scheduled_at' => 'datetime'];

    public function targetUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }
}
