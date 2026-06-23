<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SessionsPackages;
use App\Models\Subscription;
use Illuminate\Support\Facades\Validator;

class PackageAdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:admin');
    }

    public function index()
    {
        $packages = SessionsPackages::orderBy('sessions_count')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'name_ar' => $p->name_ar,
                'name_en' => $p->name_en,
                'description_ar' => $p->description_ar,
                'description_en' => $p->description_en,
                'sessions_count' => $p->sessions_count,
                'price' => $p->price,
                'price_per_session' => $p->price_per_session,
                'is_active' => $p->is_active,
                'created_at' => $p->created_at,
                'total_subscriptions' => $p->subscriptions()->count(),
                'active_subscriptions' => $p->subscriptions()->where('status', 'active')->count(),
            ];
        });

        return response()->json(['status' => true, 'data' => $packages]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'sessions_count' => 'required|integer|min:1|max:100',
            'price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        $package = SessionsPackages::create([
            'name_ar' => $request->name_ar,
            'name_en' => $request->name_en,
            'description_ar' => $request->description_ar,
            'description_en' => $request->description_en,
            'sessions_count' => $request->sessions_count,
            'price' => $request->price,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Package created successfully',
            'data' => $package->fresh(),
        ], 201);
    }

    public function show($id)
    {
        $package = SessionsPackages::findOrFail($id);

        return response()->json([
            'status' => true,
            'data' => [
                'id' => $package->id,
                'name_ar' => $package->name_ar,
                'name_en' => $package->name_en,
                'description_ar' => $package->description_ar,
                'description_en' => $package->description_en,
                'sessions_count' => $package->sessions_count,
                'price' => $package->price,
                'price_per_session' => $package->price_per_session,
                'is_active' => $package->is_active,
                'created_at' => $package->created_at,
                'updated_at' => $package->updated_at,
                'total_subscriptions' => $package->subscriptions()->count(),
            ],
        ]);
    }

    public function update(Request $request, $id)
    {
        $package = SessionsPackages::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name_ar' => 'sometimes|string|max:255',
            'name_en' => 'sometimes|string|max:255',
            'description_ar' => 'nullable|string',
            'description_en' => 'nullable|string',
            'sessions_count' => 'sometimes|integer|min:1|max:100',
            'price' => 'sometimes|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        $package->update($request->only([
            'name_ar', 'name_en', 'description_ar', 'description_en',
            'sessions_count', 'price', 'is_active',
        ]));

        return response()->json([
            'status' => true,
            'message' => 'Package updated successfully',
            'data' => $package->fresh(),
        ]);
    }

    public function destroy($id)
    {
        $package = SessionsPackages::findOrFail($id);

        if ($package->subscriptions()->where('status', 'active')->exists()) {
            return response()->json([
                'status' => false,
                'message' => 'Cannot delete package with active subscriptions',
            ], 400);
        }

        $package->delete();

        return response()->json([
            'status' => true,
            'message' => 'Package deleted successfully',
        ]);
    }

    public function toggleActive($id)
    {
        $package = SessionsPackages::findOrFail($id);
        $package->update(['is_active' => !$package->is_active]);

        return response()->json([
            'status' => true,
            'message' => $package->is_active ? 'Package activated' : 'Package deactivated',
            'data' => $package->fresh(),
        ]);
    }

    public function stats()
    {
        return response()->json([
            'status' => true,
            'data' => [
                'total_packages' => SessionsPackages::count(),
                'active_packages' => SessionsPackages::where('is_active', true)->count(),
                'total_subscriptions' => Subscription::count(),
                'active_subscriptions' => Subscription::where('status', 'active')->count(),
                'completed_subscriptions' => Subscription::where('status', 'completed')->count(),
                'total_revenue' => Subscription::sum('total_paid'),
                'total_sessions_used' => Subscription::sum('sessions_used'),
                'total_sessions_remaining' => Subscription::sum('sessions_remaining'),
            ],
        ]);
    }
}
