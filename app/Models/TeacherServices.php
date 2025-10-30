<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherServices extends Model
{
    use HasFactory;
    protected $table = 'teacher_services';

    protected $fillable = [
        'teacher_id',
        'service_id',
    ]; 
}
