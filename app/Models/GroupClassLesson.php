<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GroupClassLesson extends Model
{
    use HasFactory;

    protected $table = 'group_class_lessons';

    protected $fillable = [
        'group_class_id',
        'group_class_time_slot_id',
        'teacher_id',
        'lesson_number',
        'title',
        'topic',
        'lesson_date',
        'start_time',
        'end_time',
        'duration',
        'status',
    ];

    protected $casts = [
        'group_class_id' => 'integer',
        'group_class_time_slot_id' => 'integer',
        'teacher_id' => 'integer',
        'lesson_number' => 'integer',
        'duration' => 'integer',
        'lesson_date' => 'date:Y-m-d',
        'students_count' => 'integer',
    ];

    protected $appends = [
        'students_count',
    ];

    public function groupClass(): BelongsTo
    {
        return $this->belongsTo(GroupClass::class, 'group_class_id');
    }

    public function groupClassTimeSlot(): BelongsTo
    {
        return $this->belongsTo(GroupClassAvailabilitySlot::class, 'group_class_time_slot_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function bookingLessons(): HasMany
    {
        return $this->hasMany(GroupClassBookingLesson::class, 'group_class_lesson_id');
    }

    public function getStudentsCountAttribute(): int
    {
        if (array_key_exists('students_count', $this->attributes)) {
            return (int) $this->attributes['students_count'];
        }

        return (int) $this->bookingLessons()
            ->whereHas('booking', function ($q) {
                $q->whereNotIn('status', ['cancelled']);
            })
            ->count();
    }
}
