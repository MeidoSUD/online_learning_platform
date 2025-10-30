<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Services;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_id',
        'name_en',
        'name_ar',
        'education_level_id',
        'status',
    ];

    public function service()
    {
        return $this->belongsTo(Services::class, 'service_id');
    }
}
