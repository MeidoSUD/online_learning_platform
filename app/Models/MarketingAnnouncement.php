<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MarketingAnnouncement extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'marketing_announcements';

    protected $fillable = [
        'title',
        'description',
        'link_url',
        'button_text',
        'close_button_text',
        'target_role',
        'platform',
        'image_path',
        'is_active',
        'starts_at',
        'expires_at',
        'display_order',
        'clicks_count',
        'views_count',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'display_order' => 'integer',
        'clicks_count' => 'integer',
        'views_count' => 'integer',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = [
        'image_url',
    ];

    /**
     * Get full public URL for the optional banner/image.
     */
    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image_path) {
            return null;
        }

        if (str_starts_with($this->image_path, 'http://') || str_starts_with($this->image_path, 'https://')) {
            return $this->image_path;
        }

        return asset('storage/' . ltrim($this->image_path, '/'));
    }

    /**
     * Scope: Filter active announcements within start/expiration dates.
     */
    public function scopeActive($query)
    {
        $now = now();
        return $query->where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('starts_at')
                  ->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>=', $now);
            });
    }

    /**
     * Scope: Filter by platform (app, web, both).
     */
    public function scopeForPlatform($query, ?string $platform = 'both')
    {
        if (empty($platform) || $platform === 'both') {
            return $query;
        }

        return $query->where(function ($q) use ($platform) {
            $q->where('platform', 'both')
              ->orWhere('platform', $platform);
        });
    }

    /**
     * Scope: Filter by target role (student, teacher, both).
     */
    public function scopeForRole($query, ?string $role = 'both')
    {
        if (empty($role) || $role === 'both') {
            return $query;
        }

        return $query->where(function ($q) use ($role) {
            $q->where('target_role', 'both')
              ->orWhere('target_role', $role);
        });
    }

    /**
     * Increment views counter.
     */
    public function recordView(): void
    {
        $this->increment('views_count');
    }

    /**
     * Increment clicks counter.
     */
    public function recordClick(): void
    {
        $this->increment('clicks_count');
    }
}
