<?php

namespace App\Services\User;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class UserDeletionService
{
    /**
     * Check for active blockers that must be resolved before account deletion.
     * Only LIVE/PENDING obligations block deletion (e.g. upcoming sessions, active wallet balance, pending payouts).
     * Past historical records (completed bookings, past payments, closed disputes) do NOT block deletion.
     */
    public function checkDeletionBlockers(User $user): array
    {
        $blockers = [];

        // 1. Positive Wallet Balance
        if (Schema::hasTable('wallets') && Schema::hasColumn('wallets', 'user_id')) {
            $wallet = DB::table('wallets')->where('user_id', $user->id)->first();
            if ($wallet && isset($wallet->balance) && (float) $wallet->balance > 0.0) {
                $balance = number_format((float) $wallet->balance, 2);
                $blockers[] = [
                    'type' => 'wallet_balance',
                    'balance' => (float) $wallet->balance,
                    'message_en' => "User has a positive wallet balance of {$balance} SAR. Please withdraw or settle the balance before deletion.",
                    'message_ar' => "لدى المستخدم رصيد نشط في المحفظة بقيمة {$balance} ر.س. يرجى سحب الرصيد أو تسويته قبل الحذف.",
                ];
            }
        }

        // 2. Upcoming or Live Sessions
        if (Schema::hasTable('sessions') && Schema::hasColumn('sessions', 'session_date') && Schema::hasColumn('sessions', 'status')) {
            $upcomingSessions = DB::table('sessions')
                ->where(function ($query) use ($user) {
                    $query->where('student_id', $user->id)
                          ->orWhere('teacher_id', $user->id);
                })
                ->whereDate('session_date', '>=', now()->toDateString())
                ->whereIn('status', ['scheduled', 'live', 'wait_for_teacher', 'in_progress', 'pending'])
                ->count();

            if ($upcomingSessions > 0) {
                $blockers[] = [
                    'type' => 'active_sessions',
                    'count' => $upcomingSessions,
                    'message_en' => "User has {$upcomingSessions} upcoming or active session(s). Please complete or cancel them before deletion.",
                    'message_ar' => "لدى المستخدم {$upcomingSessions} جلسة/جلسات قادمة أو نشطة. يرجى إكمال الجلسات أو إلغاؤها قبل الحذف.",
                ];
            }
        }

        // 3. Active / Confirmed Bookings that haven't occurred yet
        if (Schema::hasTable('bookings') && Schema::hasColumn('bookings', 'status')) {
            $activeBookings = DB::table('bookings')
                ->where(function ($query) use ($user) {
                    $query->where('student_id', $user->id)
                          ->orWhere('teacher_id', $user->id);
                })
                ->whereIn('status', ['confirmed', 'in_progress'])
                ->where(function ($query) {
                    if (Schema::hasColumn('bookings', 'first_session_date')) {
                        $query->whereDate('first_session_date', '>=', now()->toDateString())
                              ->orWhereNull('first_session_date');
                    }
                })
                ->count();

            if ($activeBookings > 0) {
                $blockers[] = [
                    'type' => 'active_bookings',
                    'count' => $activeBookings,
                    'message_en' => "User has {$activeBookings} active booking(s). Please complete or cancel them before deletion.",
                    'message_ar' => "لدى المستخدم {$activeBookings} حجز/حجوزات نشطة. يرجى إكمال الحجوزات أو إلغاؤها قبل الحذف.",
                ];
            }
        }

        // 4. Pending Payout Requests
        if (Schema::hasTable('payouts') && Schema::hasColumn('payouts', 'status')) {
            $pendingPayouts = DB::table('payouts')
                ->where('teacher_id', $user->id)
                ->whereIn('status', ['pending', 'processing'])
                ->count();

            if ($pendingPayouts > 0) {
                $blockers[] = [
                    'type' => 'pending_payouts',
                    'count' => $pendingPayouts,
                    'message_en' => "User has {$pendingPayouts} pending payout request(s) awaiting processing.",
                    'message_ar' => "لدى المستخدم {$pendingPayouts} طلب/طلبات سحب أرباح معلقة قيد المعالجة.",
                ];
            }
        }

        // 5. Open / In-progress Disputes
        if (Schema::hasTable('disputes') && Schema::hasColumn('disputes', 'status')) {
            $openDisputes = DB::table('disputes')
                ->where(function ($query) use ($user) {
                    $query->where('raised_by', $user->id)
                          ->orWhere('against_user_id', $user->id);
                })
                ->whereIn('status', ['open', 'pending', 'under_review'])
                ->count();

            if ($openDisputes > 0) {
                $blockers[] = [
                    'type' => 'open_disputes',
                    'count' => $openDisputes,
                    'message_en' => "User has {$openDisputes} open dispute(s) that must be resolved before deletion.",
                    'message_ar' => "لدى المستخدم {$openDisputes} نزاع/نزاعات مفتوحة يجب تسويتها قبل الحذف.",
                ];
            }
        }

        return ['can_delete' => empty($blockers), 'blockers' => $blockers];
    }

    /**
     * Delete user account using the industry-standard "Anonymize & Release Credentials" pattern:
     * 1. Release unique credentials (email, phone) so the user can register again immediately.
     * 2. Clear out sensitive personal data (tokens, cards, notification settings, device tokens).
     * 3. Preserve relational database integrity (foreign keys in orders, payments, reviews remain intact).
     * 4. Soft-delete the user record.
     */
    public function deleteUser(User $user, bool $isAdminAction = false): array
    {
        try {
            $deletion = DB::transaction(function () use ($user, $isAdminAction) {
                $lockedUser = User::whereKey($user->id)->lockForUpdate()->firstOrFail();

                // Check active blockers
                $check = $this->checkDeletionBlockers($lockedUser);
                if (!$check['can_delete']) {
                    return ['blockers' => $check['blockers']];
                }

                $timestamp = now()->timestamp;
                $userId = $lockedUser->id;
                $originalEmail = $lockedUser->email;
                $originalPhone = $lockedUser->phone_number;

                Log::warning('User account deletion initiated', [
                    'user_id' => $userId,
                    'original_email' => $originalEmail,
                    'admin_action' => $isAdminAction,
                ]);

                // 1. Revoke and delete API tokens
                if (Schema::hasTable('personal_access_tokens')) {
                    $lockedUser->tokens()->delete();
                }

                // 2. Clean up device push tokens
                if (Schema::hasTable('device_tokens') && Schema::hasColumn('device_tokens', 'user_id')) {
                    DB::table('device_tokens')->where('user_id', $userId)->delete();
                }

                // 3. Clean up saved payment cards and payment methods
                if (Schema::hasTable('cards') && Schema::hasColumn('cards', 'user_id')) {
                    DB::table('cards')->where('user_id', $userId)->delete();
                }
                if (Schema::hasTable('saved_cards') && Schema::hasColumn('saved_cards', 'user_id')) {
                    DB::table('saved_cards')->where('user_id', $userId)->delete();
                }
                if (Schema::hasTable('user_payment_methods') && Schema::hasColumn('user_payment_methods', 'user_id')) {
                    DB::table('user_payment_methods')->where('user_id', $userId)->delete();
                }

                // 4. Clean up notification settings & favorites & hidden services
                if (Schema::hasTable('notification_settings') && Schema::hasColumn('notification_settings', 'user_id')) {
                    DB::table('notification_settings')->where('user_id', $userId)->delete();
                }
                if (Schema::hasTable('favorites') && Schema::hasColumn('favorites', 'user_id')) {
                    DB::table('favorites')->where('user_id', $userId)->delete();
                }
                if (Schema::hasTable('user_hidden_services') && Schema::hasColumn('user_hidden_services', 'user_id')) {
                    DB::table('user_hidden_services')->where('user_id', $userId)->delete();
                }

                // 5. Delete future unbooked availability slots (for teachers)
                if (Schema::hasTable('availability_slots') && Schema::hasColumn('availability_slots', 'teacher_id')) {
                    $slotsQuery = DB::table('availability_slots')->where('teacher_id', $userId);
                    if (Schema::hasColumn('availability_slots', 'is_booked')) {
                        $slotsQuery->where('is_booked', 0);
                    }
                    $slotsQuery->delete();
                }

                // 6. Anonymize user profile (wipe bio, avatar, resume, etc.)
                if (Schema::hasTable('user_profiles') && Schema::hasColumn('user_profiles', 'user_id')) {
                    $profileUpdates = [];
                    foreach (['bio', 'profile_photo', 'awards', 'resume', 'degree'] as $col) {
                        if (Schema::hasColumn('user_profiles', $col)) {
                            $profileUpdates[$col] = null;
                        }
                    }
                    if (!empty($profileUpdates)) {
                        DB::table('user_profiles')->where('user_id', $userId)->update($profileUpdates);
                    }
                }

                // 7. Deactivate courses created by teacher (draft status)
                if (Schema::hasTable('courses') && Schema::hasColumn('courses', 'teacher_id')) {
                    if (Schema::hasColumn('courses', 'status')) {
                        DB::table('courses')->where('teacher_id', $userId)->update(['status' => 'draft']);
                    }
                }

                // 8. Cancel active subscriptions if any
                if (Schema::hasTable('subscriptions') && Schema::hasColumn('subscriptions', 'student_id')) {
                    if (Schema::hasColumn('subscriptions', 'status')) {
                        DB::table('subscriptions')
                            ->where('student_id', $userId)
                            ->where('status', Subscription::STATUS_ACTIVE ?? 'active')
                            ->update(['status' => 'cancelled']);
                    }
                }

                // 9. RELEASE UNIQUE CREDENTIALS on users table
                // This is crucial: frees up email and phone_number so user can register again!
                $lockedUser->email = "deleted_{$timestamp}_{$userId}@deleted.local";
                $lockedUser->phone_number = null;
                $lockedUser->first_name = 'Deleted';
                $lockedUser->last_name = 'User';
                $lockedUser->notional_id = null;
                $lockedUser->fcm_token = null;
                $lockedUser->agora_chat_uid = null;
                $lockedUser->social_provider = null;
                $lockedUser->social_provider_id = null;
                $lockedUser->remember_token = null;
                $lockedUser->is_active = 0;
                $lockedUser->password = Hash::make(Str::random(32));
                $lockedUser->save();

                // 10. Soft-delete the user record
                $lockedUser->delete();

                Log::info('User account deleted and credentials released successfully', [
                    'user_id' => $userId,
                    'original_email' => $originalEmail,
                    'original_phone' => $originalPhone,
                    'admin_action' => $isAdminAction,
                ]);

                return ['deleted_user_id' => $userId];
            });

            if (isset($deletion['blockers'])) {
                return [
                    'success' => false,
                    'status_code' => 422,
                    'message' => 'Cannot delete this account because it has active sessions, bookings, wallet balance, or open disputes. Please resolve them first.',
                    'message_ar' => 'لا يمكن حذف هذا الحساب لوجود جلسات قادمة نشطة، أو حجوزات نشطة، أو رصيد في المحفظة، أو نزاعات مفتوحة. يرجى تسويتها أولاً.',
                    'blockers' => $deletion['blockers'],
                ];
            }

            return [
                'success' => true,
                'status_code' => 200,
                'message' => 'Account deleted successfully. You can register again at any time.',
                'message_ar' => 'تم حذف الحساب بنجاح. يمكنك إعادة التسجيل في أي وقت.',
                'deleted_user_id' => $deletion['deleted_user_id'],
            ];
        } catch (\Throwable $e) {
            Log::error('Account deletion failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
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
