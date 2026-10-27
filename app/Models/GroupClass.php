<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GroupClass extends Model
{
    use HasFactory;

    protected $table = 'group_classes';

    protected $fillable = [
        'teacher_id',
        'education_level_id',
        'class_id',
        'subject_id',
        'title',
        'description',
        'start_date',
        'total_sessions',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'total_sessions' => 'integer',
        'education_level_id' => 'integer',
        'class_id' => 'integer',
        'subject_id' => 'integer',
        'teacher_id' => 'integer',
    ];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(EducationLevel::class, 'education_level_id');
    }

    public function class(): BelongsTo
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(GroupClassLesson::class, 'group_class_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'group_class_id');
    }
}
