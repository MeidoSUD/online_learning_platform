<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AdsPanner extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'image_path',
        'image_name',
        'description',
        'role_id',
        'platform',
        'is_active',
        'link_url',
        'cta_text',
        'display_order',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'role_id' => 'integer',
        'display_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get ads by platform and role
     * 
     * @param string $platform (web, app, both)
     * @param int|null $roleId (null for guest, 3 for teacher, 4 for student)
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getActiveAds($platform = 'both', $roleId = null)
    {
        return self::where('is_active', true)
            ->where(function ($query) use ($platform) {
                // Match platform: both, or specific platform
                $query->where('platform', 'both')
                    ->orWhere('platform', $platform);
            })
            ->where(function ($query) use ($roleId) {
                // Match role: null (for all), or specific role
                $query->whereNull('role_id')
                    ->orWhere('role_id', $roleId);
            })
            ->orderBy('display_order', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Scope: Get only active ads
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Filter by platform
     */
    public function scopeByPlatform($query, $platform)
    {
        return $query->where(function ($q) use ($platform) {
            $q->where('platform', 'both')
              ->orWhere('platform', $platform);
        });
    }

    /**
     * Scope: Filter by role
     */
    public function scopeByRole($query, $roleId)
    {
        return $query->where(function ($q) use ($roleId) {
            $q->whereNull('role_id')
              ->orWhere('role_id', $roleId);
        });
    }
}

