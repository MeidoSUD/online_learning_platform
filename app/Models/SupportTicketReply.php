<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupportTicketReply extends Model
{
    use HasFactory;

    protected $fillable = [
        'support_ticket_id',
        'user_id',
        'message',
        'is_admin_reply',
    ];

    protected $casts = [
        'is_admin_reply' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the support ticket this reply belongs to
     */
    public function ticket()
    {
        return $this->belongsTo(SupportTicket::class, 'support_ticket_id');
    }

    /**
     * Get the user who made this reply
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Scope to get admin replies only
     */
    public function scopeAdminReplies($query)
    {
        return $query->where('is_admin_reply', true);
    }

    /**
     * Scope to get user replies only
     */
    public function scopeUserReplies($query)
    {
        return $query->where('is_admin_reply', false);
    }
}
