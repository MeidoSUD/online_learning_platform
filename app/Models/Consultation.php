<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Consultation extends Model
{
    use HasFactory;

    const STATUS_PENDING = 'pending';
    const STATUS_UNDER_REVIEW = 'under_review';
    const STATUS_ASSIGNED = 'assigned';
    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'consultation_reference',
        'category_id',
        'student_id',
        'teacher_id',
        'service_id',
        'booking_id',
        'title',
        'description',
        'preferred_language_id',
        'education_level_id',
        'class_id',
        'preferred_slots',
        'duration_minutes',
        'sessions_count',
        'budget_min',
        'budget_max',
        'price_per_session',
        'status',
        'assigned_by',
        'assigned_at',
        'admin_notes',
        'scheduled_date',
        'scheduled_start_time',
        'scheduled_end_time',
        'cancelled_at',
        'cancellation_reason',
    ];

    protected $casts = [
        'preferred_slots' => 'array',
        'budget_min' => 'decimal:2',
        'budget_max' => 'decimal:2',
        'price_per_session' => 'decimal:2',
        'duration_minutes' => 'integer',
        'sessions_count' => 'integer',
        'assigned_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'scheduled_date' => 'date:Y-m-d',
        'scheduled_start_time' => 'datetime:H:i',
        'scheduled_end_time' => 'datetime:H:i',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ConsultationCategory::class, 'category_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Services::class, 'service_id');
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function preferredLanguage(): BelongsTo
    {
        return $this->belongsTo(Languages::class, 'preferred_language_id');
    }

    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(EducationLevel::class, 'education_level_id');
    }

    public function class(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeForStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeForTeacher($query, $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'Pending',
            self::STATUS_UNDER_REVIEW => 'Under Review',
            self::STATUS_ASSIGNED => 'Assigned',
            self::STATUS_SCHEDULED => 'Scheduled',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_CANCELLED => 'Cancelled',
            self::STATUS_REJECTED => 'Rejected',
            default => ucfirst($this->status),
        };
    }
}