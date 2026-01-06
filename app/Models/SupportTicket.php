<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'subject',
        'body',
        'status',
        'internal_note',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who created this support ticket
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get all replies for this support ticket
     */
    public function replies()
    {
        return $this->hasMany(SupportTicketReply::class, 'support_ticket_id');
    }

    /**
     * Get the latest reply
     */
    public function latestReply()
    {
        return $this->hasOne(SupportTicketReply::class, 'support_ticket_id')->latest();
    }

    /**
     * Scope to filter by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get open tickets
     */
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    /**
     * Scope to get unresolved tickets
     */
    public function scopeUnresolved($query)
    {
        return $query->whereIn('status', ['open', 'in_progress']);
    }
}
