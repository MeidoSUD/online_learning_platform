<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassModel extends Model
{
    use HasFactory;
    protected $table = 'classes';

    public function subjects()
{
    return $this->hasMany(EducationLevel::class, 'education_level_id');
}

}
