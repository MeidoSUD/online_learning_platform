<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WithdrawalMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'name_ar',
        'name_en',
        'key',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
