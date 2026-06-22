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
        'min_group_size',
        'code',
        'offer_packages',
        'packages_approved',
    ];

    protected $casts = [
        'group_hour_price' => 'float',
        'individual_hour_price' => 'float',
        'offer_packages' => 'boolean',
        'packages_approved' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::created(function ($teacherInfo) {
            if (empty($teacherInfo->code)) {
                $chars = substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 0, 3);
                $teacherInfo->code = $chars . $teacherInfo->id;
                $teacherInfo->save();
            }
        });
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
    
}
