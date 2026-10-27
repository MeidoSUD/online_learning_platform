<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupClassBookingLesson extends Model
{
    use HasFactory;

    protected $table = 'group_class_booking_lessons';

    protected $fillable = [
        'booking_id',
        'group_class_lesson_id',
    ];

    protected $casts = [
        'booking_id' => 'integer',
        'group_class_lesson_id' => 'integer',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(GroupClassLesson::class, 'group_class_lesson_id');
    }
}
