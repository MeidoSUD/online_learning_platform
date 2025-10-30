<?php

// app/Models/Booking.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\Sessions;
use Carbon\Carbon;
use MacsiDigital\Zoom\Facades\Zoom;


class Enrollment extends Model
{
    use HasFactory;

    protected $table = 'enrollments';
    protected $fillable = [
        'student_id',
        'course_id',
        'enrollment_date',
        'status',
        'progress',
        'completed_at',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id');
    }
    public function sessions(): HasMany
    {
        return $this->hasMany(Sessions::class, 'enrollment_id');
    }

}
