<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\User;
use App\Models\Course;
use App\Models\AvailabilitySlot;
use App\Models\TeacherApplication;
use App\Models\Sessions;

class Orders extends Model
{
    protected $fillable = [
        'user_id', 'subject_id', 'teacher_id', 'class_id', 
        'education_level_id', 'type', 'min_price', 'max_price', 
        'status', 'notes' , 'order_type'
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function preferredTeacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function availableSlots(): HasMany
    {
        return $this->hasMany(AvailabilitySlot::class, 'order_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(TeachersApplications::class , 'order_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(Sessions::class, 'order_id');
    }
}
