<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
