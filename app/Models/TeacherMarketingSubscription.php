<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class TeacherMarketingSubscription extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'teacher_marketing_subscriptions';

    const STATUS_PENDING = 'pending_payment';
    const STATUS_ACTIVE = 'active';
    const STATUS_EXPIRED = 'expired';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'teacher_id',
        'plan_id',
        'amount_paid',
        'currency',
        'payment_method',
        'payment_reference',
        'payment_response',
        'status',
        'start_date',
        'end_date',
        'banner_image',
        'marketing_title',
        'marketing_bio',
        'views_count',
        'clicks_count',
    ];

    protected $casts = [
        'amount_paid' => 'float',
        'payment_response' => 'array',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'views_count' => 'integer',
        'clicks_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = [
        'is_active',
        'days_remaining',
        'banner_url',
    ];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(TeacherMarketingPlan::class, 'plan_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE)
            ->where(function ($q) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', now());
            });
    }

    public function getIsActiveAttribute(): bool
    {
        if ($this->status !== self::STATUS_ACTIVE) {
            return false;
        }

        if (!$this->end_date) {
            return true;
        }

        return Carbon::now()->lte($this->end_date);
    }

    public function getDaysRemainingAttribute(): int
    {
        if (!$this->is_active || !$this->end_date) {
            return 0;
        }

        $remaining = Carbon::now()->diffInDays($this->end_date, false);
        return max(0, (int) ceil($remaining));
    }

    public function getBannerUrlAttribute(): ?string
    {
        $toUrl = function (?string $path): ?string {
            if (!$path) return null;
            if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
                return $path;
            }
            $clean = ltrim($path, '/');
            if (str_starts_with($clean, 'storage/')) {
                $clean = substr($clean, strlen('storage/'));
            }
            return asset('storage/' . $clean);
        };

        if ($this->banner_image) {
            return $toUrl($this->banner_image);
        }

        // Fallback to teacher cover image or profile image if custom banner is not provided
        if ($this->teacher) {
            $cover = $this->teacher->attachments()
                ->where('attached_to_type', 'cover_image')
                ->latest()
                ->value('file_path');

            if ($cover) {
                return $toUrl($cover);
            }

            $avatar = $this->teacher->attachments()
                ->where('attached_to_type', 'profile_picture')
                ->latest()
                ->value('file_path');

            if ($avatar) {
                return $toUrl($avatar);
            }
        }

        return null;
    }

    public function recordView(): void
    {
        $this->increment('views_count');
    }

    public function recordClick(): void
    {
        $this->increment('clicks_count');
    }
}
