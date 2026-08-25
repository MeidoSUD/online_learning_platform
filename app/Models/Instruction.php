<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Instruction extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'content',
        'type',
        'target_audience',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $appends = ['lines'];

    public function getLinesAttribute()
    {
        return explode('|', $this->content);
    }
}
