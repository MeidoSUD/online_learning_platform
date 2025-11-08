<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_id',
        'name_en',
        'name_ar',
        'class_id',
        'education_level_id', // if this exists in your subjects table
        // add other fields...
    ];

    /**
     * Get the education level that owns the subject.
     */
    public function service()
    {
        return $this->belongsTo(Services::class, 'service_id');
    }

    public function educationLevel()
    {
        return $this->belongsTo(EducationLevel::class, 'education_level_id');
    }

    /**
     * Get the class that owns the subject.
     */
    public function class()
    {
        return $this->belongsTo(ClassModel::class, 'class_id');
    }

    /**
     * Get the teachers teaching this subject.
     */
    public function teachers()
    {
        return $this->belongsToMany(User::class, 'teacher_subjects', 'subject_id', 'teacher_id');
    }
}