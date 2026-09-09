<?php

namespace App\Helpers;

use App\Models\Sessions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * SessionNumberHelper
 *
 * يعيد ترقيم جلسات نفس الحجز (booking_id) فقط من 1 إلى N
 * مرتبة حسب session_date ثم start_time ثم id.
 *
 * الاستخدام بعد إنشاء الجلسات فقط (استدعاء واحد):
 *   SessionNumberHelper::renumberBookingSessions($bookingId);
 */
class SessionNumberHelper
{
    /**
     * إعادة ترقيم جلسات حجز واحد فقط.
     *
     * @param int|null $bookingId
     * @return int عدد الجلسات التي تم ترقيمها (0 لو لا يوجد حجز)
     */
    public static function renumberBookingSessions($bookingId): int
    {
        if (empty($bookingId)) {
            return 0;
        }

        // نجلب الجلسات مرتبة بالتاريخ ثم الوقت ثم id لضمان ترتيب ثابت
        $sessions = Sessions::withoutEvents(function () use ($bookingId) {
            return Sessions::where('booking_id', $bookingId)
                ->orderBy('session_date', 'asc')
                ->orderBy('start_time', 'asc')
                ->orderBy('id', 'asc')
                ->get(['id', 'session_number']);
        });

        if ($sessions->isEmpty()) {
            return 0;
        }

        $counter = 1;
        $updated = 0;

        DB::transaction(function () use ($sessions, &$counter, &$updated) {
            foreach ($sessions as $session) {
                // حدّث فقط المختلف لتقليل الكتابة على DB وتفادي events
                if ((int) $session->session_number !== $counter) {
                    // update مباشر عبر Query Builder حتى لا يطلق model events (منع recursion)
                    DB::table('sessions')
                        ->where('id', $session->id)
                        ->update(['session_number' => $counter]);
                    $updated++;
                }
                $counter++;
            }
        });

        Log::info('Session numbers renumbered for booking', [
            'booking_id' => $bookingId,
            'total' => $sessions->count(),
            'updated' => $updated,
        ]);

        return $sessions->count();
    }
}
