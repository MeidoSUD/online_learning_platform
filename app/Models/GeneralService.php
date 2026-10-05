<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GeneralService extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_ar',
        'name_en',
        'description_ar',
        'description_en',
        'icon',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function teacherGeneralServices(): HasMany
    {
        return $this->hasMany(TeacherGeneralService::class, 'general_service_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'general_service_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', true);
    }
}
