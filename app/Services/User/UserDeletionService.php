<?php

namespace App\Services\User;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class UserDeletionService
{
    /** Business and financial history is retained, never removed by user deletion. */
    private const USER_REFERENCE_TABLES = [
        'bookings' => ['student_id', 'teacher_id'],
        'sessions' => ['student_id', 'teacher_id'],
        'payments' => ['student_id', 'teacher_id', 'user_id'],
        'orders' => ['student_id', 'teacher_id', 'user_id', 'customer_id'],
        'courses' => ['teacher_id', 'user_id'],
        'enrollments' => ['student_id', 'user_id'],
        'subscriptions' => ['student_id', 'user_id'],
        'payouts' => ['teacher_id', 'user_id'],
        'disputes' => ['raised_by', 'against_user_id'],
        'refunds' => ['requester_id', 'teacher_id', 'user_id'],
        'consultations' => ['student_id', 'teacher_id', 'user_id'],
        'availability_slots' => ['teacher_id'],
        'support_tickets' => ['user_id'],
        'support_ticket_replies' => ['sender_id', 'user_id'],
        'teacher_services' => ['teacher_id'],
        'teacher_subjects' => ['teacher_id'],
        'teacher_languages' => ['teacher_id'],
    ];

    /** Return actionable blockers when the user has linked records. */
    public function checkDeletionBlockers(User $user): array
    {
        $blockers = [];

        foreach (self::USER_REFERENCE_TABLES as $table => $candidateColumns) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            $columns = array_values(array_filter(
                $candidateColumns,
                fn ($column) => Schema::hasColumn($table, $column)
            ));
            if (!$columns) {
                continue;
            }

            $count = DB::table($table)
                ->where(function ($query) use ($columns, $user) {
                    foreach ($columns as $index => $column) {
                        $method = $index === 0 ? 'where' : 'orWhere';
                        $query->{$method}($column, $user->id);
                    }
                })
                ->count();

            if ($count > 0) {
                $label = str_replace('_', ' ', $table);
                $upcomingCount = 0;
                if ($table === 'sessions' && Schema::hasColumn($table, 'session_date') && Schema::hasColumn($table, 'status')) {
                    $upcomingQuery = DB::table($table)
                        ->where(function ($query) use ($columns, $user) {
                            foreach ($columns as $index => $column) {
                                $method = $index === 0 ? 'where' : 'orWhere';
                                $query->{$method}($column, $user->id);
                            }
                        })
                        ->whereDate('session_date', '>=', now()->toDateString())
                        ->whereIn('status', ['scheduled', 'live', 'wait_for_teacher', 'in_progress', 'pending']);
                    $upcomingCount = $upcomingQuery->count();
                }

                $upcomingNoteEn = $upcomingCount > 0 ? " This includes {$upcomingCount} upcoming session(s)." : '';
                $upcomingNoteAr = $upcomingCount > 0 ? " ويتضمن ذلك {$upcomingCount} جلسة/جلسات قادمة." : '';
                $blockers[] = [
                    'type' => $table,
                    'count' => $count,
                    'upcoming_count' => $upcomingCount,
                    'message_en' => "User has {$count} {$label} record(s).{$upcomingNoteEn} These records must be retained; suspend the account instead of deleting it.",
                    'message_ar' => "لدى المستخدم {$count} سجل/سجلات مرتبطة بـ {$label}.{$upcomingNoteAr} يجب الاحتفاظ بهذه السجلات؛ يرجى إيقاف الحساب بدلاً من حذفه.",
                ];
            }
        }

        if (Schema::hasTable('wallets') && Schema::hasColumn('wallets', 'user_id')) {
            $wallet = DB::table('wallets')->where('user_id', $user->id)->first();
            if ($wallet && isset($wallet->balance) && (float) $wallet->balance !== 0.0) {
                $balance = number_format((float) $wallet->balance, 2);
                $blockers[] = [
                    'type' => 'wallet_balance',
                    'balance' => (float) $wallet->balance,
                    'message_en' => "User has a wallet balance of {$balance} SAR. Settle the balance before deletion.",
                    'message_ar' => "لدى المستخدم رصيد محفظة بقيمة {$balance} ر.س. يرجى تسوية الرصيد قبل الحذف.",
                ];
            }

            if ($wallet && Schema::hasTable('wallet_transactions') && Schema::hasColumn('wallet_transactions', 'wallet_id')) {
                $transactionCount = DB::table('wallet_transactions')->where('wallet_id', $wallet->id)->count();
                if ($transactionCount > 0) {
                    $blockers[] = [
                        'type' => 'wallet_transactions',
                        'count' => $transactionCount,
                        'message_en' => "User has {$transactionCount} wallet transaction(s). Financial history must be retained; suspend the account instead.",
                        'message_ar' => "لدى المستخدم {$transactionCount} معاملة في المحفظة. يجب الاحتفاظ بالسجل المالي؛ يرجى إيقاف الحساب بدلاً من حذفه.",
                    ];
                }
            }
        }

        return ['can_delete' => empty($blockers), 'blockers' => $blockers];
    }

    /**
     * Soft-delete only accounts with no service or financial records.
     * All associated data is retained and no foreign-key rows are removed.
     */
    public function deleteUser(User $user, bool $isAdminAction = false): array
    {
        try {
            $deletion = DB::transaction(function () use ($user, $isAdminAction) {
                $lockedUser = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
                $check = $this->checkDeletionBlockers($lockedUser);
                if (!$check['can_delete']) {
                    return ['blockers' => $check['blockers']];
                }

                Log::warning('User account deletion initiated', [
                    'user_id' => $lockedUser->id,
                    'admin_action' => $isAdminAction,
                ]);

                if (Schema::hasTable('personal_access_tokens')) {
                    $lockedUser->tokens()->delete();
                }
                $lockedUser->delete();

                return ['deleted_user_id' => $lockedUser->id];
            });

            if (isset($deletion['blockers'])) {
                return [
                    'success' => false,
                    'status_code' => 422,
                    'message' => 'Cannot delete this account because it has linked service, financial, or support records. Review the blockers and suspend the account if it should no longer be used.',
                    'message_ar' => 'لا يمكن حذف هذا الحساب لوجود سجلات مرتبطة بالخدمات أو المعاملات المالية أو الدعم. راجع أسباب التعذر أو أوقف الحساب إذا لم يعد مطلوباً.',
                    'blockers' => $deletion['blockers'],
                ];
            }

            return [
                'success' => true,
                'status_code' => 200,
                'message' => 'Account deleted successfully.',
                'message_ar' => 'تم حذف الحساب بنجاح.',
                'deleted_user_id' => $deletion['deleted_user_id'],
            ];
        } catch (\Throwable $e) {
            Log::error('Account deletion failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'status_code' => 500,
                'message' => 'Failed to delete account. Please try again later.',
                'message_ar' => 'فشل حذف الحساب. يرجى المحاولة لاحقاً.',
            ];
        }
    }
}
