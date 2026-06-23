<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SessionsPackages extends Model
{
    use HasFactory;

    protected $table = 'sessions_packages';

    protected $fillable = [
        'name_ar',
        'name_en',
        'description_ar',
        'description_en',
        'sessions_count',
        'price',
        'discount_percentage',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'sessions_count' => 'integer',
        'is_active' => 'boolean',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'package_id');
    }

    public function getPricePerSessionAttribute(): float
    {
        return $this->sessions_count > 0
            ? round($this->price / $this->sessions_count, 2)
            : 0;
    }
}
