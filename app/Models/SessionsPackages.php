<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SessionsPackages extends Model
{
    use HasFactory;

    protected $table = 'sessions_packages';

    protected $fillable = [
        'created_by',
        'name',
        'description',
        'sessions_count',
        'total_price',
        'price_per_session',
        'is_active',
    ];

    protected $casts = [
        'total_price' => 'decimal:2',
        'price_per_session' => 'decimal:2',
        'sessions_count' => 'integer',
        'is_active' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($package) {
            if (!$package->price_per_session && $package->total_price && $package->sessions_count) {
                $package->price_per_session = round($package->total_price / $package->sessions_count, 2);
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'package_id');
    }
}
