<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherGeneralService extends Model
{
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'general_service_id',
        'price',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function generalService(): BelongsTo
    {
        return $this->belongsTo(GeneralService::class, 'general_service_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
