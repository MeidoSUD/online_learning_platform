<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherAbility extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'ability_id',
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function ability()
    {
        return $this->belongsTo(Abilities::class, 'ability_id');
    }
}
