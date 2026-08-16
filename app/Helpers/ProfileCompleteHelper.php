<?php

namespace App\Helpers;

use App\Models\ProfileComplete;
use App\Models\User;

class ProfileCompleteHelper
{
    /**
     * Sync or create a ProfileComplete record for the given user id.
     * Computes flags from related models (teacher_info, attachments, availability, etc.).
     */
    public static function sync(int $userId): ?ProfileComplete
    {
        $user = User::find($userId);
        if (!$user) return null;

        $teacherInfo = $user->teacherInfo()->first();

        $is_bio = false;
        if ($teacherInfo && !empty($teacherInfo->bio)) $is_bio = true;
        // profile picture: check attachments of type 'profile_picture'
        $is_profile_picture = (bool) $user->attachments()->where('attached_to_type', 'profile_picture')->exists();
        // phone verified stored on user->verified
        $is_phone_number = (bool) $user->verified;
        // email verified if email_verified_at is not null
        $is_email = !is_null($user->email_verified_at);
        // hourly rate
        $is_hourly_rate = $teacherInfo && isset($teacherInfo->individual_hour_price) && $teacherInfo->individual_hour_price > 0;
        // time slots
        $time_slots = (bool) $user->availableSlots()->exists();
        // package_on from teacherInfo.package_on_off
        $package_on = $teacherInfo && (bool) $teacherInfo->package_on_off;

        $values = [
            'user_id' => $user->id,
            'is_bio' => $is_bio,
            'is_profile_picture' => $is_profile_picture,
            'is_phone_number' => $is_phone_number,
            'is_email' => $is_email,
            'is_hourly_rate' => $is_hourly_rate,
            'time_slots' => $time_slots,
            'package_on' => $package_on,
        ];

        $record = ProfileComplete::updateOrCreate(['user_id' => $user->id], $values);

        return $record;
    }
}
