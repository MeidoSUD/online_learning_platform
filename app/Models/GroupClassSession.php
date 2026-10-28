<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class GroupClassSession extends Model
{
    use HasFactory;

    protected $table = 'group_class_sessions';

    protected $fillable = [
        'group_class_id',
        'group_class_lesson_id',
        'teacher_id',
        'session_title',
        'session_date',
        'start_time',
        'end_time',
        'duration',
        'status',
        'join_url',
        'host_url',
        'meeting_id',
        'chat_room_id',
        'started_at',
        'ended_at',
        'teacher_notes',
        'materials_shared',
    ];

    protected $casts = [
        'group_class_id' => 'integer',
        'group_class_lesson_id' => 'integer',
        'teacher_id' => 'integer',
        'duration' => 'integer',
        'session_date' => 'date:Y-m-d',
        'start_time' => 'date:H:i',
        'end_time' => 'date:H:i',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'materials_shared' => 'array',
    ];

    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_LIVE = 'live';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    public function groupClass(): BelongsTo
    {
        return $this->belongsTo(GroupClass::class, 'group_class_id');
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(GroupClassLesson::class, 'group_class_lesson_id');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function sessionStudents(): HasMany
    {
        return $this->hasMany(GroupClassSessionStudent::class, 'group_class_session_id');
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'group_class_session_students', 'group_class_session_id', 'student_id')
            ->withPivot(['booking_id', 'status', 'joined_at', 'left_at'])
            ->withTimestamps();
    }
}
