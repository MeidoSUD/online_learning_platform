<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProfileComplete extends Model
{
    use HasFactory;
    protected $table = 'profile_completes';
    protected $fillable = [
        'user_id',
        'is_bio',
        'is_profile_picture',
        'is_phone_number',
        'is_email',
        'is_hourly_rate',
        'time_slots',
        'package_on'
    ];
}
