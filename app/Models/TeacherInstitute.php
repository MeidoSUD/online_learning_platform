<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherInstitute extends Model
{
    use HasFactory;

    protected $table = 'teacher_institutes';

    protected $fillable = [
        'user_id',
        'institute_name',
        'commercial_register',
        'license_number',
        'cover_image',
        'intro_video',
        'description',
        'website',
        'commission_percentage',
        'status',
        'rejection_reason',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns this institute
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Scope to get only approved institutes
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope to get only pending institutes
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get only rejected institutes
     */
    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Check if institute is approved
     */
    public function isApproved()
    {
        return $this->status === 'approved';
    }

    /**
     * Check if institute is pending
     */
    public function isPending()
    {
        return $this->status === 'pending';
    }

    /**
     * Check if institute is rejected
     */
    public function isRejected()
    {
        return $this->status === 'rejected';
    }
};
