<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherSubject extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'subject_id'
    ];

    // Direct relationship to subject
    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    // Get education level through subject
    public function educationLevel()
    {
        return $this->hasOneThrough(
            EducationLevel::class,
            Subject::class,
            'id', // Foreign key on subjects table...
            'id', // Foreign key on education_levels table...
            'subject_id', // Local key on teacher_subjects table...
            'education_level_id' // Local key on subjects table...
        );
    }

    // Get class through subject
    public function class()
    {
        return $this->hasOneThrough(
            ClassModel::class,
            Subject::class,
            'id', // Foreign key on subjects table...
            'id', // Foreign key on classes table...
            'subject_id', // Local key on teacher_subjects table...
            'class_id' // Local key on subjects table...
        );
    }

    // Teacher relationship
    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
