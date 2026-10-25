<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupClassAvailabilitySlot extends Model
{
    use HasFactory;

    protected $table = 'group_class_time_slots';

    protected $fillable = [
        'teacher_id',
        'day_number',
        'date',
        'start_time',
        'end_time',
        'duration',
        'repeat_type',
        'is_available',
        'is_booked',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'duration' => 'integer',
        'day_number' => 'integer',
        'is_available' => 'boolean',
        'is_booked' => 'boolean',
    ];

    const REPEAT_NONE = 'none';
    const REPEAT_WEEKLY = 'weekly';
    const REPEAT_DAILY = 'daily';

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function scopeForTeacher($query, $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }
}
