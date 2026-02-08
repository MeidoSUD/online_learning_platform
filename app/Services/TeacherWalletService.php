<?php

namespace App\Services;

use App\Models\Sessions;
use App\Models\Wallet;
use App\Models\Booking;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TeacherWalletService
{
    public function creditTeacherForSession(Sessions $session)
    {
        return DB::transaction(function () use ($session) {
            $booking = $session->booking;

            if (!$booking) {
                Log::error('Wallet Credit Failed: No booking found for session ' . $session->id);
                return false;
            }

            $amount = $booking->price_per_session;
            $teacherId = $session->teacher_id;

            $wallet = Wallet::firstOrCreate(
                ['user_id' => $teacherId],
                ['balance' => 0]
            );

            $reason = 'Session Completed: ' . $session->session_title;
            $meta = [
                'session_id' => $session->id,
                'booking_id' => $booking->id,
                'session_number' => $session->session_number,
                'booking_reference' => $booking->booking_reference
            ];

            $wallet->credit($amount, $reason, $meta);

            Log::info('Teacher wallet credited successfully', [
                'teacher_id' => $teacherId,
                'amount' => $amount,
                'session_id' => $session->id
            ]);

            return true;
        });
    }
}
