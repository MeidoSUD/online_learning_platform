<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TeacherMarketingPlan;
use App\Models\TeacherMarketingSubscription;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\MoyasarPay;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class TeacherMarketingController extends Controller
{
    protected ?MoyasarPay $moyasar = null;

    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:teacher');

        try {
            $this->moyasar = app(MoyasarPay::class);
        } catch (\Throwable $e) {
            Log::warning('MoyasarPay could not be instantiated in TeacherMarketingController: ' . $e->getMessage());
        }
    }

    /**
     * Get available active marketing plans for teachers.
     */
    public function plans()
    {
        $plans = TeacherMarketingPlan::where('is_active', true)
            ->orderBy('display_order', 'asc')
            ->orderBy('duration_months', 'asc')
            ->get();

        return response()->json([
            'status' => true,
            'message' => 'Available marketing plans retrieved successfully',
            'data' => $plans,
        ]);
    }

    /**
     * Get current teacher's marketing status and active boost details.
     */
    public function status(Request $request)
    {
        $teacherId = $request->user()->id;

        $activeSubscription = TeacherMarketingSubscription::with('plan')
            ->where('teacher_id', $teacherId)
            ->active()
            ->latest('id')
            ->first();

        $history = TeacherMarketingSubscription::with('plan')
            ->where('teacher_id', $teacherId)
            ->latest('id')
            ->take(10)
            ->get();

        $isBoosted = (bool) $activeSubscription;

        return response()->json([
            'status' => true,
            'data' => [
                'is_boosted' => $isBoosted,
                'active_subscription' => $activeSubscription ? [
                    'id' => $activeSubscription->id,
                    'plan_id' => $activeSubscription->plan_id,
                    'plan_name_ar' => $activeSubscription->plan->name_ar ?? null,
                    'plan_name_en' => $activeSubscription->plan->name_en ?? null,
                    'badge_text_ar' => $activeSubscription->plan->badge_text_ar ?? 'معلم مميز',
                    'badge_text_en' => $activeSubscription->plan->badge_text_en ?? 'Featured Teacher',
                    'amount_paid' => $activeSubscription->amount_paid,
                    'currency' => $activeSubscription->currency,
                    'payment_method' => $activeSubscription->payment_method,
                    'start_date' => $activeSubscription->start_date?->toIso8601String(),
                    'end_date' => $activeSubscription->end_date?->toIso8601String(),
                    'days_remaining' => $activeSubscription->days_remaining,
                    'marketing_title' => $activeSubscription->marketing_title,
                    'marketing_bio' => $activeSubscription->marketing_bio,
                    'banner_url' => $activeSubscription->banner_url,
                    'views_count' => $activeSubscription->views_count,
                    'clicks_count' => $activeSubscription->clicks_count,
                ] : null,
                'history' => $history,
            ],
        ]);
    }

    /**
     * Subscribe to a marketing plan (pay using Moyasar card or Wallet).
     */
    public function subscribe(Request $request)
    {
        $teacher = $request->user();

        $validator = Validator::make($request->all(), [
            'plan_id' => 'required|exists:teacher_marketing_plans,id',
            'payment_method' => 'required|string|in:card,wallet,apple_pay,stc_pay',
            'banner_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'marketing_title' => 'nullable|string|max:150',
            'marketing_bio' => 'nullable|string|max:500',
            'callback_url' => 'nullable|url',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $plan = TeacherMarketingPlan::findOrFail($request->plan_id);

        if (!$plan->is_active) {
            return response()->json([
                'status' => false,
                'message' => 'This marketing plan is currently not available',
            ], 400);
        }

        // Upload custom banner if provided
        $bannerPath = null;
        if ($request->hasFile('banner_image')) {
            $bannerPath = $request->file('banner_image')->store('marketing_banners', 'public');
        }

        $currency = 'SAR';

        // 1. PAYMENT VIA WALLET
        if ($request->payment_method === 'wallet') {
            return $this->processWalletSubscription($teacher, $plan, $bannerPath, $request);
        }

        // 2. PAYMENT VIA CARD / MOYASAR GATEWAY
        return $this->processMoyasarSubscription($teacher, $plan, $bannerPath, $request);
    }

    /**
     * Process subscription using Teacher Wallet.
     */
    protected function processWalletSubscription($teacher, TeacherMarketingPlan $plan, ?string $bannerPath, Request $request)
    {
        $wallet = Wallet::getOrCreateForUser($teacher->id);

        if ($wallet->balance < $plan->price) {
            return response()->json([
                'status' => false,
                'code' => 'INSUFFICIENT_WALLET_BALANCE',
                'message' => app()->getLocale() == 'ar'
                    ? 'رصيد المحفظة غير كافٍ. الرصيد الحالي: ' . $wallet->balance . ' ر.س والمطلوب: ' . $plan->price . ' ر.س'
                    : 'Insufficient wallet balance. Current: ' . $wallet->balance . ' SAR, Required: ' . $plan->price . ' SAR',
                'data' => [
                    'current_balance' => (float) $wallet->balance,
                    'required_amount' => (float) $plan->price,
                ],
            ], 400);
        }

        return DB::transaction(function () use ($teacher, $plan, $wallet, $bannerPath, $request) {
            $balanceBefore = $wallet->balance;
            // Deduct from wallet
            $wallet->balance -= $plan->price;
            $wallet->save();

            // Record transaction
            WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'debit',
                'amount' => $plan->price,
                'balance_before' => $balanceBefore,
                'balance_after' => $wallet->balance,
                'description' => "Subscription to marketing plan: {$plan->name_en} (#{$plan->id})",
            ]);

            // Extend existing active subscription or start new from now
            $existingActive = TeacherMarketingSubscription::where('teacher_id', $teacher->id)
                ->active()
                ->latest('id')
                ->first();

            $startDate = now();
            $durationDays = $plan->duration_days ?: ($plan->duration_months * 30);

            if ($existingActive && $existingActive->end_date && $existingActive->end_date->isFuture()) {
                // Extend existing subscription duration
                $endDate = $existingActive->end_date->copy()->addDays($durationDays);
            } else {
                $endDate = now()->addDays($durationDays);
            }

            $subscription = TeacherMarketingSubscription::create([
                'teacher_id' => $teacher->id,
                'plan_id' => $plan->id,
                'amount_paid' => $plan->price,
                'currency' => 'SAR',
                'payment_method' => 'wallet',
                'payment_reference' => 'WALLET-' . strtoupper(uniqid()),
                'status' => TeacherMarketingSubscription::STATUS_ACTIVE,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'banner_image' => $bannerPath ?? ($existingActive->banner_image ?? null),
                'marketing_title' => $request->marketing_title ?? ($existingActive->marketing_title ?? null),
                'marketing_bio' => $request->marketing_bio ?? ($existingActive->marketing_bio ?? null),
            ]);

            return response()->json([
                'status' => true,
                'message' => app()->getLocale() == 'ar'
                    ? 'تم الاشتراك بنجاح وتفعيل ميزة الإعلان لحسابك!'
                    : 'Marketing subscription activated successfully!',
                'data' => [
                    'subscription' => $subscription->load('plan'),
                    'is_boosted' => true,
                    'days_remaining' => $subscription->days_remaining,
                    'wallet_balance' => (float) $wallet->balance,
                ],
            ], 201);
        });
    }

    /**
     * Process subscription using Moyasar Hosted Invoice / Card.
     */
    protected function processMoyasarSubscription($teacher, TeacherMarketingPlan $plan, ?string $bannerPath, Request $request)
    {
        if (!$this->moyasar) {
            return response()->json([
                'status' => false,
                'message' => 'Payment gateway is not currently configured',
            ], 500);
        }

        try {
            $amountInCents = (int) round($plan->price * 100);
            $currency = 'SAR';
            $callbackUrl = $request->callback_url ?? route('api.payment.callback');

            // Pre-create pending subscription
            $subscription = TeacherMarketingSubscription::create([
                'teacher_id' => $teacher->id,
                'plan_id' => $plan->id,
                'amount_paid' => $plan->price,
                'currency' => $currency,
                'payment_method' => $request->payment_method,
                'status' => TeacherMarketingSubscription::STATUS_PENDING,
                'banner_image' => $bannerPath,
                'marketing_title' => $request->marketing_title,
                'marketing_bio' => $request->marketing_bio,
            ]);

            $payload = [
                'amount' => $amountInCents,
                'currency' => $currency,
                'description' => "Teacher Boost: {$plan->name_en}",
                'callback_url' => $callbackUrl,
                'metadata' => [
                    'type' => 'teacher_marketing_subscription',
                    'subscription_id' => $subscription->id,
                    'teacher_id' => $teacher->id,
                    'plan_id' => $plan->id,
                ],
            ];

            $invoice = $this->moyasar->createInvoice($payload);

            $subscription->update([
                'payment_reference' => $invoice['id'],
                'payment_response' => $invoice,
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Payment checkout created successfully',
                'data' => [
                    'subscription_id' => $subscription->id,
                    'checkout_id' => $invoice['id'],
                    'redirect_url' => $invoice['url'] ?? '',
                    'amount' => (float) $plan->price,
                    'currency' => $currency,
                    'plan' => [
                        'id' => $plan->id,
                        'name_ar' => $plan->name_ar,
                        'name_en' => $plan->name_en,
                        'duration_months' => $plan->duration_months,
                        'duration_days' => $plan->duration_days,
                    ],
                ],
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Teacher marketing subscription payment creation failed: ' . $e->getMessage(), [
                'teacher_id' => $teacher->id,
                'plan_id' => $plan->id,
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Failed to initiate payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Confirm and activate subscription after Moyasar payment completes.
     */
    public function confirmPayment(Request $request)
    {
        $teacherId = $request->user()->id;

        $validator = Validator::make($request->all(), [
            'subscription_id' => 'required|integer|exists:teacher_marketing_subscriptions,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $subscription = TeacherMarketingSubscription::with('plan')
            ->where('id', $request->subscription_id)
            ->where('teacher_id', $teacherId)
            ->firstOrFail();

        // If already active, return immediately
        if ($subscription->status === TeacherMarketingSubscription::STATUS_ACTIVE && $subscription->is_active) {
            return response()->json([
                'status' => true,
                'message' => 'Subscription is already active',
                'data' => [
                    'subscription' => $subscription,
                    'is_boosted' => true,
                    'days_remaining' => $subscription->days_remaining,
                ],
            ]);
        }

        if (!$this->moyasar || empty($subscription->payment_reference)) {
            return response()->json([
                'status' => false,
                'message' => 'Cannot verify payment details',
            ], 400);
        }

        try {
            $invoice = $this->moyasar->fetchInvoice($subscription->payment_reference);
            $isPaid = ($invoice['status'] === 'paid' && !empty($invoice['payments']));

            if (!$isPaid) {
                return response()->json([
                    'status' => false,
                    'message' => 'Payment has not been completed yet',
                    'data' => [
                        'payment_status' => $invoice['status'] ?? 'pending',
                    ],
                ], 400);
            }

            // Payment succeeded! Calculate start and end date
            $plan = $subscription->plan;
            $durationDays = $plan->duration_days ?: ($plan->duration_months * 30);

            // Check if there was an earlier active subscription to extend
            $latestActive = TeacherMarketingSubscription::where('teacher_id', $teacherId)
                ->where('id', '!=', $subscription->id)
                ->active()
                ->latest('end_date')
                ->first();

            $startDate = now();
            if ($latestActive && $latestActive->end_date && $latestActive->end_date->isFuture()) {
                $endDate = $latestActive->end_date->copy()->addDays($durationDays);
            } else {
                $endDate = now()->addDays($durationDays);
            }

            $subscription->update([
                'status' => TeacherMarketingSubscription::STATUS_ACTIVE,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'payment_response' => $invoice,
            ]);

            return response()->json([
                'status' => true,
                'message' => app()->getLocale() == 'ar'
                    ? 'تم تأكيد الدفع وتفعيل الإعلان بنجاح!'
                    : 'Payment confirmed and profile boost activated successfully!',
                'data' => [
                    'subscription' => $subscription->fresh()->load('plan'),
                    'is_boosted' => true,
                    'days_remaining' => $subscription->fresh()->days_remaining,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Error confirming teacher marketing payment: ' . $e->getMessage());

            return response()->json([
                'status' => false,
                'message' => 'Failed to verify payment with gateway: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update promo banner information for currently active subscription.
     */
    public function updateBanner(Request $request)
    {
        $teacherId = $request->user()->id;

        $subscription = TeacherMarketingSubscription::where('teacher_id', $teacherId)
            ->active()
            ->latest('id')
            ->first();

        if (!$subscription) {
            return response()->json([
                'status' => false,
                'message' => 'You do not have an active marketing subscription to update.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'banner_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'marketing_title' => 'nullable|string|max:150',
            'marketing_bio' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        if ($request->hasFile('banner_image')) {
            $bannerPath = $request->file('banner_image')->store('marketing_banners', 'public');
            $subscription->banner_image = $bannerPath;
        }

        if ($request->has('marketing_title')) {
            $subscription->marketing_title = $request->marketing_title;
        }

        if ($request->has('marketing_bio')) {
            $subscription->marketing_bio = $request->marketing_bio;
        }

        $subscription->save();

        return response()->json([
            'status' => true,
            'message' => 'Banner details updated successfully',
            'data' => [
                'marketing_title' => $subscription->marketing_title,
                'marketing_bio' => $subscription->marketing_bio,
                'banner_url' => $subscription->banner_url,
            ],
        ]);
    }
}
