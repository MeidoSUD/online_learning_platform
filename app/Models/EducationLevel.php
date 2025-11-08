<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EducationLevel extends Model
{
    use HasFactory;
    protected $fillable = ['name_ar', 'name_en', 'description'];

    public function students()
    {
        return $this->hasMany(User::class, 'education_level_id');
    }
    public function classes()
    {
        return $this->hasMany(ClassModel::class, 'education_level_id');
    }
    public function subjects()
    {
        return $this->hasMany(Subject::class, 'education_level_id');
    }
}
