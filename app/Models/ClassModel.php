<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassModel extends Model
{
    use HasFactory;
    protected $table = 'classes';
 protected $fillable = [ 'education_level_id', 'name_en', 'name_ar'];
    public function subjects()
{
    return $this->hasMany(Subject::class, 'class_id');
}    
    public function educationLevel()
    {
        return $this->belongsTo(EducationLevel::class, 'education_level_id');   
        
    }
    
}