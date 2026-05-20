<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TermsConditions extends Model
{
    use HasFactory, SoftDeletes;
    protected $table = 'terms_conditions';
    protected $fillable = ['role_id', 'title', 'type', 'content', 'title_en', 'title_ar', 'content_en', 'content_ar', 'version', 'status'];

    protected $casts = [
        'status' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Get the latest active version
     */
    public static function getLatest()
    {
        return self::where('status', true)
            ->latest('version')
            ->first();
    }

    /**
     * Scope to get only active terms
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    /**
     * Scope to get by version
     */
    public function scopeByVersion($query, $version)
    {
        return $query->where('version', $version);
    }
}
