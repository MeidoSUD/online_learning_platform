<?php

namespace App\Helpers;

use App\Models\Booking;
use App\Models\AvailabilitySlot;
use App\Models\Sessions;
use App\Models\Subscription;
use Illuminate\Support\Facades\Log;

class PackageBookingHelper
{
    /**
     * Validate subscription exists, is active, and has enough sessions.
     */
    public static function validateSubscription(int $studentId, int $subscriptionId, int $sessionsCount): Subscription
    {
        $subscription = Subscription::where('student_id', $studentId)
            ->where('id', $subscriptionId)
            ->where('status', Subscription::STATUS_ACTIVE)
            ->first();

        if (!$subscription) {
            abort(404, 'Subscription not found or not active');
        }

        if ($subscription->sessions_remaining < $sessionsCount) {
            abort(400, 'No remaining sessions in this subscription');
        }

        return $subscription;
    }

    /**
     * Validate and lock all timeslots.
     */
    public static function validateAndLockSlots(array $timeslotIds, int $teacherId): array
    {
        $slots = [];
        foreach ($timeslotIds as $slotId) {
            $slot = AvailabilitySlot::where('id', $slotId)
                ->where('teacher_id', $teacherId)
                ->where('is_available', true)
                ->where('is_booked', false)
                ->lockForUpdate()
                ->first();

            if (!$slot) {
                abort(400, "Slot #{$slotId} not available or already booked");
            }

            $slots[] = $slot;
        }

        return $slots;
    }

    /**
     * Attach slots to the booking's availabilitySlots relationship.
     * Call this AFTER booking is created (needs booking ID).
     */
    public static function attachSlotsToBooking(array $slots, ?Booking $booking = null): void
    {
        if ($booking) {
            $booking->availabilitySlots()->saveMany($slots);
        }
    }

    /**
     * Deduct sessions from subscription.
     */
    public static function deductSubscriptionSessions(Subscription $subscription, int $count): void
    {
        for ($i = 0; $i < $count; $i++) {
            $subscription->useSession();
        }

        Log::info('Subscription sessions deducted', [
            'subscription_id' => $subscription->id,
            'deducted' => $count,
            'remaining' => $subscription->fresh()->sessions_remaining,
        ]);
    }

    /**
     * Mark all slots as booked.
     */
    public static function markSlotsAsBooked(array $slots, int $bookingId): void
    {
        foreach ($slots as $slot) {
            $slot->update([
                'is_booked' => true,
                'booking_id' => $bookingId,
            ]);
        }
    }
}
