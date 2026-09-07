<?php

namespace App\Services;

use App\Models\MarketingNotification;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class MarketingNotificationService
{
    public const BATCH_SIZE = 250;

    /** Returns active recipients for a campaign without loading them into memory. */
    public function recipientsQuery(MarketingNotification $campaign): Builder
    {
        $query = User::query();

        // is_active is present in the platform's users schema. Null is accepted for legacy users.
        $query->where(function (Builder $query) {
            $query->where('is_active', true)->orWhereNull('is_active');
        });

        return match ($campaign->target_type) {
            'teachers' => $query->where('role_id', 3),
            'students' => $query->where('role_id', 4),
            'single_user' => $query->whereKey($campaign->target_user_id),
            'multi_teachers' => $query->where('role_id', 3)->whereIn('id', (array) $campaign->target_user_ids),
            'multi_students' => $query->where('role_id', 4)->whereIn('id', (array) $campaign->target_user_ids),
            default => $query,
        };
    }

    public function recipientCount(MarketingNotification $campaign): int
    {
        return $this->recipientsQuery($campaign)->count();
    }
}
