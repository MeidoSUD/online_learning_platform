<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TeacherMarketingPlan extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'teacher_marketing_plans';

    protected $fillable = [
        'name_ar',
        'name_en',
        'description_ar',
        'description_en',
        'duration_months',
        'duration_days',
        'price',
        'badge_text_ar',
        'badge_text_en',
        'is_active',
        'display_order',
    ];

    protected $casts = [
        'duration_months' => 'integer',
        'duration_days' => 'integer',
        'price' => 'float',
        'is_active' => 'boolean',
        'display_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(TeacherMarketingSubscription::class, 'plan_id');
    }

    public function activeSubscriptions(): HasMany
    {
        return $this->hasMany(TeacherMarketingSubscription::class, 'plan_id')
            ->where('status', TeacherMarketingSubscription::STATUS_ACTIVE)
            ->where('end_date', '>=', now());
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}

