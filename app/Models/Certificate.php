<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    protected $fillable = [
        'student_id',
        'course_id',
        'booking_id',
        'issued_by',
        'certificate_number',
        'student_name',
        'course_name',
        'completion_date',
        'issued_at',
        'notes',
    ];

    protected $casts = [
        'completion_date' => 'date',
        'issued_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function issuer()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($cert) {
            if (empty($cert->certificate_number)) {
                $year = now()->format('Y');
                $seq = static::whereYear('created_at', now()->year)->count() + 1;
                $cert->certificate_number = 'EWAN-' . $year . '-' . str_pad($seq, 5, '0', STR_PAD_LEFT);
            }
            if (empty($cert->issued_at)) {
                $cert->issued_at = now();
            }
        });
    }
}
