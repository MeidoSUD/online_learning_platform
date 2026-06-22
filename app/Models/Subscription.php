<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'teacher_id',
        'package_id',
        'sessions_remaining',
        'sessions_used',
        'status',
        'start_date',
        'expiry_date',
        'completed_at',
        'total_paid',
        'currency',
        'payment_id',
    ];

    protected $casts = [
        'sessions_remaining' => 'integer',
        'sessions_used' => 'integer',
        'total_paid' => 'decimal:2',
        'start_date' => 'datetime',
        'expiry_date' => 'datetime',
        'completed_at' => 'datetime',
    ];

    const STATUS_ACTIVE = 'active';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_EXPIRED = 'expired';

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(SessionsPackages::class, 'package_id');
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'payment_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'subscription_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeForTeacher($query, $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }

    public function getRemainingSessionsAttribute(): int
    {
        return max(0, $this->sessions_remaining);
    }

    public function getUsedSessionsAttribute(): int
    {
        return $this->sessions_used;
    }

    public function getTotalSessionsAttribute(): int
    {
        return $this->sessions_remaining + $this->sessions_used;
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function useSession(): bool
    {
        if ($this->status !== self::STATUS_ACTIVE || $this->sessions_remaining <= 0) {
            return false;
        }

        $this->sessions_remaining--;
        $this->sessions_used++;

        if ($this->sessions_remaining <= 0) {
            $this->status = self::STATUS_COMPLETED;
            $this->completed_at = now();
        }

        return $this->save();
    }
}
