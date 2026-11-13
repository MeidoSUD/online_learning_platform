<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\TeacherMarketingPlan;
use App\Models\TeacherMarketingSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TeacherMarketingPlanAdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:admin');
    }

    /**
     * List all marketing plans.
     */
    public function index()
    {
        $plans = TeacherMarketingPlan::withCount([
            'subscriptions as total_subscriptions',
            'subscriptions as active_subscriptions' => function ($query) {
                $query->where('status', TeacherMarketingSubscription::STATUS_ACTIVE)
                      ->where(function ($q) {
                          $q->whereNull('end_date')->orWhere('end_date', '>=', now());
                      });
            }
        ])
        ->orderBy('display_order', 'asc')
        ->orderBy('duration_months', 'asc')
        ->get();

        return response()->json([
            'status' => true,
            'message' => 'Marketing plans retrieved successfully',
            'data' => $plans,
        ]);
    }

    /**
     * Create a new marketing plan.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'duration_months' => 'required|integer|min:1|max:12',
            'duration_days' => 'nullable|integer|min:1|max:365',
            'price' => 'required|numeric|min:0',
            'badge_text_ar' => 'nullable|string|max:50',
            'badge_text_en' => 'nullable|string|max:50',
            'is_active' => 'nullable|boolean',
            'display_order' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $durationDays = $request->duration_days ?: ($request->duration_months * 30);

        $plan = TeacherMarketingPlan::create([
            'name_ar' => $request->name_ar,
            'name_en' => $request->name_en,
            'description_ar' => $request->description_ar,
            'description_en' => $request->description_en,
            'duration_months' => $request->duration_months,
            'duration_days' => $durationDays,
            'price' => $request->price,
            'badge_text_ar' => $request->badge_text_ar ?? 'معلم مميز',
            'badge_text_en' => $request->badge_text_en ?? 'Featured Teacher',
            'is_active' => $request->is_active ?? true,
            'display_order' => $request->display_order ?? 0,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Marketing plan created successfully',
            'data' => $plan,
        ], 201);
    }

    /**
     * Show plan details.
     */
    public function show($id)
    {
        $plan = TeacherMarketingPlan::withCount([
            'subscriptions as total_subscriptions',
            'subscriptions as active_subscriptions' => function ($query) {
                $query->where('status', TeacherMarketingSubscription::STATUS_ACTIVE)
                      ->where(function ($q) {
                          $q->whereNull('end_date')->orWhere('end_date', '>=', now());
                      });
            }
        ])->findOrFail($id);

        return response()->json([
            'status' => true,
            'data' => $plan,
        ]);
    }

    /**
     * Update a marketing plan (e.g. price, duration, texts).
     */
    public function update(Request $request, $id)
    {
        $plan = TeacherMarketingPlan::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name_ar' => 'sometimes|string|max:255',
            'name_en' => 'sometimes|string|max:255',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'duration_months' => 'sometimes|integer|min:1|max:12',
            'duration_days' => 'nullable|integer|min:1|max:365',
            'price' => 'sometimes|numeric|min:0',
            'badge_text_ar' => 'nullable|string|max:50',
            'badge_text_en' => 'nullable|string|max:50',
            'is_active' => 'sometimes|boolean',
            'display_order' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $request->only([
            'name_ar',
            'name_en',
            'description_ar',
            'description_en',
            'duration_months',
            'price',
            'badge_text_ar',
            'badge_text_en',
            'is_active',
            'display_order',
        ]);

        if ($request->has('duration_days')) {
            $data['duration_days'] = $request->duration_days;
        } elseif ($request->has('duration_months') && !$plan->duration_days) {
            $data['duration_days'] = $request->duration_months * 30;
        }

        $plan->update($data);

        return response()->json([
            'status' => true,
            'message' => 'Marketing plan updated successfully',
            'data' => $plan->fresh(),
        ]);
    }

    /**
     * Delete a marketing plan (if no active subscriptions exist).
     */
    public function destroy($id)
    {
        $plan = TeacherMarketingPlan::findOrFail($id);

        $hasActive = $plan->subscriptions()
            ->where('status', TeacherMarketingSubscription::STATUS_ACTIVE)
            ->where(function ($q) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', now());
            })
            ->exists();

        if ($hasActive) {
            return response()->json([
                'status' => false,
                'message' => 'Cannot delete a plan with active subscriptions. You can deactivate it instead.',
            ], 422);
        }

        $plan->delete();

        return response()->json([
            'status' => true,
            'message' => 'Marketing plan deleted successfully',
        ]);
    }

    /**
     * Toggle plan active / inactive.
     */
    public function toggle($id)
    {
        $plan = TeacherMarketingPlan::findOrFail($id);
        $plan->is_active = !$plan->is_active;
        $plan->save();

        return response()->json([
            'status' => true,
            'message' => $plan->is_active ? 'Plan activated' : 'Plan deactivated',
            'data' => $plan,
        ]);
    }

    /**
     * List all teacher marketing subscriptions with filtering.
     */
    public function subscriptions(Request $request)
    {
        $query = TeacherMarketingSubscription::with([
            'teacher:id,first_name,last_name,email,phone_number',
            'plan:id,name_ar,name_en,duration_months,price'
        ]);

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->active();
            } else {
                $query->where('status', $request->status);
            }
        }

        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->teacher_id);
        }

        if ($request->filled('plan_id')) {
            $query->where('plan_id', $request->plan_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('teacher', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        $subscriptions = $query->latest('id')->paginate($request->get('per_page', 20));

        return response()->json([
            'status' => true,
            'data' => $subscriptions,
        ]);
    }

    /**
     * Marketing subscriptions statistics.
     */
    public function stats()
    {
        $totalSubscriptions = TeacherMarketingSubscription::count();
        $activeSubscriptions = TeacherMarketingSubscription::active()->count();
        $totalRevenue = TeacherMarketingSubscription::whereIn('status', [
            TeacherMarketingSubscription::STATUS_ACTIVE,
            TeacherMarketingSubscription::STATUS_EXPIRED
        ])->sum('amount_paid');

        $totalViews = TeacherMarketingSubscription::sum('views_count');
        $totalClicks = TeacherMarketingSubscription::sum('clicks_count');

        return response()->json([
            'status' => true,
            'data' => [
                'total_plans' => TeacherMarketingPlan::count(),
                'active_plans' => TeacherMarketingPlan::where('is_active', true)->count(),
                'total_subscriptions' => $totalSubscriptions,
                'active_subscriptions' => $activeSubscriptions,
                'total_revenue' => (float) $totalRevenue,
                'total_views' => (int) $totalViews,
                'total_clicks' => (int) $totalClicks,
            ],
        ]);
    }
}
