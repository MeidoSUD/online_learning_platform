<?php

namespace App\Services;

use App\Models\Payout;
use App\Models\Sessions;
use App\Models\Wallet;
use App\Models\Booking;
use App\Models\PlatformPercentage;
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

            $amount = $booking->teacher_rate_per_session;
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

    public function debitTeacherForPayout(Payout $payout, array $updateData = [])
    {
        return DB::transaction(function () use ($payout, $updateData) {
            if ($updateData) {
                $payout->update($updateData);
            }

            $wallet = Wallet::where('user_id', $payout->teacher_id)->lockForUpdate()->first();
            if (!$wallet) {
                $wallet = Wallet::create(['user_id' => $payout->teacher_id, 'balance' => 0]);
            }

            $teacherPercentage = PlatformPercentage::getActive(PlatformPercentage::TYPE_TEACHER);
            $grossAmount = $teacherPercentage
                ? $teacherPercentage->calculateTeacherGrossAmount((float) $payout->amount)
                : (float) $payout->amount;
            $companyFee = $grossAmount - (float) $payout->amount;

            $reason = 'Payout Approved: ' . $payout->amount;
            $meta = [
                'payout_id' => $payout->id,
                'teacher_id' => $payout->teacher_id,
                'net_payout_amount' => (float) $payout->amount,
                'gross_wallet_amount' => round($grossAmount, 2),
                'company_fee' => round($companyFee, 2),
                'teacher_percentage' => $teacherPercentage ? (float) $teacherPercentage->value : 0,
            ];

            $wallet->debit(round($grossAmount, 2), $reason, $meta);

            Log::info('Teacher wallet debited for payout', [
                'teacher_id' => $payout->teacher_id,
                'net_amount' => $payout->amount,
                'gross_amount' => round($grossAmount, 2),
                'payout_id' => $payout->id,
            ]);

            return true;
        });
    }
}
