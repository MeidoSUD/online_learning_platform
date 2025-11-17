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
    
    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function service()
    {
        return $this->belongsTo(Services::class, 'service_id');
    }
}
