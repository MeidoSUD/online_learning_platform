<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Abilities extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name_en',
        'name_ar',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function teacherAbilities()
    {
        return $this->hasMany(TeacherAbility::class, 'ability_id');
    }
}
