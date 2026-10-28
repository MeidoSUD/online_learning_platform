<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupClassSessionStudent extends Model
{
    use HasFactory;

    protected $table = 'group_class_session_students';

    protected $fillable = [
        'group_class_session_id',
        'student_id',
        'booking_id',
        'status',
        'joined_at',
        'left_at',
    ];

    protected $casts = [
        'group_class_session_id' => 'integer',
        'student_id' => 'integer',
        'booking_id' => 'integer',
        'joined_at' => 'datetime',
        'left_at' => 'datetime',
    ];

    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_ATTENDED = 'attended';
    const STATUS_ABSENT = 'absent';
    const STATUS_LEFT = 'left';

    public function session(): BelongsTo
    {
        return $this->belongsTo(GroupClassSession::class, 'group_class_session_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }
}
