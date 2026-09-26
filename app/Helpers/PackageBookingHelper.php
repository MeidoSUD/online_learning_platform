<?php

namespace App\Helpers;

use App\Models\Booking;
use App\Models\AvailabilitySlot;
use App\Models\Sessions;
use App\Models\Subscription;
use Carbon\Carbon;
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
                ->lockForUpdate()
                ->first();

            if (!$slot || !self::isSlotBookable($slot)) {
                abort(400, "Slot #{$slotId} not available or already booked");
            }

            $slots[] = $slot;
        }

        return $slots;
    }

    /** A day-number slot is a recurring weekly window, not a one-time resource. */
    public static function isRecurringSlot($slot): bool
    {
        return $slot->day_number !== null
            && ($slot->date === null || $slot->repeat_type === AvailabilitySlot::REPEAT_WEEKLY);
    }

    /**
     * Recurring slots may have legacy booked flags from a previous occurrence;
     * actual availability is determined by date-specific sessions instead.
     */
    public static function isSlotBookable($slot): bool
    {
        if (self::isRecurringSlot($slot) && $slot->is_booked) {
            return true;
        }

        return (bool) $slot->is_available && !(bool) $slot->is_booked;
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
     * حساب تاريخ الموعد لأقرب وقوع قادم (لا يعود بالماضي أبداً).
     *
     * - تاريخ محدد ما زال في المستقبل → يُستخدم كما هو.
     * - مثال: موعد يوم الاثنين انتهى وقته → أقرب اثنين قادم وليس الماضي.
     * - مواعيد `day_number` المتكررة → أقرب وقوع لهذا اليوم (اليوم نفسه إن كان الوقت لم يفت، وإلا الأسبوع القادم).
     * - تاريخ محدد ماضٍ بلا `day_number` → أقرب وقوع قادم لنفس اليوم من الأسبوع.
     *
     * @param mixed $slot
     * @return string Y-m-d
     */
    public static function resolveSlotDate($slot): string
    {
        $time = self::extractSlotTime($slot->start_time ?? null);

        $rawDate = $slot->date ?? null;
        if ($rawDate !== null && trim((string) $rawDate) !== '') {
            $dateStr = $rawDate instanceof Carbon
                ? $rawDate->format('Y-m-d')
                : trim((string) $rawDate);

            try {
                // ما زال في المستقبل → كما هو
                if (Carbon::parse($dateStr . ' ' . $time)->greaterThan(now())) {
                    return Carbon::parse($dateStr)->format('Y-m-d');
                }
            } catch (\Throwable $e) {
                // تاريخ غير صالح → نكمل للحلول البديلة
            }

            // ماضٍ: `day_number` أولى (موعد متكرر)، وإلا نفس يوم الأسبوع للتاريخ القديم
            if (isset($slot->day_number) && $slot->day_number !== null && $slot->day_number !== '') {
                return self::nextWeekday(self::appDayToCarbon((int) $slot->day_number), $time);
            }

            try {
                return self::nextWeekday(Carbon::parse($dateStr)->dayOfWeek, $time);
            } catch (\Throwable $e) {
                return Carbon::today()->format('Y-m-d');
            }
        }

        // متكرر برقم اليوم فقط
        if (isset($slot->day_number) && $slot->day_number !== null && $slot->day_number !== '') {
            return self::nextWeekday(self::appDayToCarbon((int) $slot->day_number), $time);
        }

        // احتياطي: اليوم
        return Carbon::today()->format('Y-m-d');
    }

    /**
     * أقرب وقوع قادم ليوم أسبوع معين (0=الأحد .. 6=السبت).
     * اليوم نفسه يُقبل فقط إن كان الوقت لم يفت، وإلا الأسبوع القادم.
     */
    private static function nextWeekday(int $dayOfWeek, string $time): string
    {
        $today = Carbon::today();
        $candidate = $today->copy()->addDays(($dayOfWeek - $today->dayOfWeek + 7) % 7);

        try {
            if (Carbon::parse($candidate->format('Y-m-d') . ' ' . $time)->lessThanOrEqualTo(now())) {
                $candidate->addDays(7);
            }
        } catch (\Throwable $e) {
            // نُبقي المرشح كما هو
        }

        return $candidate->format('Y-m-d');
    }

    /**
     * Convert the application day number (1=Saturday .. 7=Friday) to Carbon.
     */
    private static function appDayToCarbon(int $dayNumber): int
    {
        return ($dayNumber + 5) % 7;
    }

    private static function extractSlotTime($value): string
    {
        if ($value instanceof Carbon) {
            return $value->format('H:i:s');
        }

        $str = trim((string) $value);

        if (preg_match('/(\d{2}:\d{2}(?::\d{2})?)\s*$/', $str, $m)) {
            return strlen($m[1]) === 5 ? $m[1] . ':00' : $m[1];
        }

        try {
            return Carbon::parse($str)->format('H:i:s');
        } catch (\Throwable $e) {
            return '00:00:00';
        }
    }

    /**
     * Mark all slots as booked.
     */
    public static function markSlotsAsBooked(array $slots, int $bookingId): void
    {
        foreach ($slots as $slot) {
            if (self::isRecurringSlot($slot)) {
                continue;
            }

            $slot->update([
                'is_booked' => true,
                'booking_id' => $bookingId,
            ]);
        }
    }
}
