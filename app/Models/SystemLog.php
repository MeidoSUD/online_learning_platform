<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemLog extends Model
{
    protected $guarded = [];

    protected $casts = [
        'context' => 'array',
        'last_occurred_at' => 'datetime',
    ];
}
