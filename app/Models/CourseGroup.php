<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class CourseGroup extends Model
{
    use HasFactory;

    protected $table = 'course_groups';

    protected $fillable = [
        'course_id',
        'group_name',
        'start_date',
        'schedule_pattern',
        'total_sessions',
        'max_students',
        'min_students',
        'enrolled_count',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'schedule_pattern' => 'array',
        'total_sessions' => 'integer',
        'max_students' => 'integer',
        'min_students' => 'integer',
        'enrolled_count' => 'integer',
    ];

    const STATUS_OPEN = 'open';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'course_group_id');
    }

    public function scopeOpen($query)
    {
        return $query->where('status', self::STATUS_OPEN);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', [self::STATUS_OPEN, self::STATUS_CONFIRMED, self::STATUS_IN_PROGRESS]);
    }

    public function getIsFullAttribute(): bool
    {
        return $this->enrolled_count >= $this->max_students;
    }

    public function getHasAvailableSeatsAttribute(): bool
    {
        return $this->enrolled_count < $this->max_students;
    }

    public function getMinStudentsReachedAttribute(): bool
    {
        if (is_null($this->min_students)) {
            return true;
        }
        return $this->enrolled_count >= $this->min_students;
    }

    public function getRemainingSeatsAttribute(): int
    {
        return max(0, $this->max_students - $this->enrolled_count);
    }

    public function incrementEnrolledCount(): bool
    {
        return $this->increment('enrolled_count');
    }

    public function decrementEnrolledCount(): bool
    {
        if ($this->enrolled_count > 0) {
            return $this->decrement('enrolled_count');
        }
        return false;
    }

    public function canStart(): bool
    {
        if ($this->status === self::STATUS_CANCELLED) {
            return false;
        }

        if (!is_null($this->min_students) && $this->enrolled_count < $this->min_students) {
            return false;
        }

        return true;
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($group) {
            if (!$group->group_name) {
                $count = CourseGroup::where('course_id', $group->course_id)->count();
                $group->group_name = 'Group ' . ($count + 1);
            }
        });
    }
}
