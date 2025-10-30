<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;
    protected $fillable = [
        'reviewer_id',
        'reviewed_id',
        'course_id',
        'rating',
        'comment',
    ];

    public function reviewer()
    {
        return $this->belongsTo(\App\Models\User::class, 'reviewer_id');
    }

    public function reviewedUser()
    {
        return $this->belongsTo(\App\Models\User::class, 'reviewed_id');
    }

    public function course()
    {
        return $this->belongsTo(\App\Models\Course::class, 'course_id');
    }
}
