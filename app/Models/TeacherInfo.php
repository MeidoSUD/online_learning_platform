<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherInfo extends Model
{
    use HasFactory;
    protected $table = 'teacher_info';
    protected $fillable = [
        'teacher_id',
        'bio',
        'teach_individual',
        'individual_hour_price',
        'teach_group',
        'group_hour_price',
        'max_group_size',
        'min_group_size'
    ];

    protected $casts = [
    'group_hour_price' => 'float',
    'individual_hour_price' => 'float',
];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
    
}
