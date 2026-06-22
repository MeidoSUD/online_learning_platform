<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SessionsPackages;
use App\Models\TeacherInfo;
use App\Models\User;
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
        $packages = SessionsPackages::with('creator')
            ->orderBy('sessions_count')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $packages->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'description' => $p->description,
                    'sessions_count' => $p->sessions_count,
                    'total_price' => $p->total_price,
                    'price_per_session' => $p->price_per_session,
                    'is_active' => $p->is_active,
                    'created_by' => $p->creator ? $p->creator->name : 'System',
                    'created_at' => $p->created_at,
                    'total_subscriptions' => $p->subscriptions()->count(),
                ];
            }),
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sessions_count' => 'required|integer|min:1|max:100',
            'total_price' => 'required|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        $pricePerSession = round($request->total_price / $request->sessions_count, 2);

        $package = SessionsPackages::create([
            'created_by' => $request->user()->id,
            'name' => $request->name,
            'description' => $request->description,
            'sessions_count' => $request->sessions_count,
            'total_price' => $request->total_price,
            'price_per_session' => $pricePerSession,
            'is_active' => $request->is_active ?? true,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Package created successfully',
            'data' => $package,
        ], 201);
    }

    public function show($id)
    {
        $package = SessionsPackages::with('creator')->findOrFail($id);

        return response()->json([
            'status' => true,
            'data' => [
                'id' => $package->id,
                'name' => $package->name,
                'description' => $package->description,
                'sessions_count' => $package->sessions_count,
                'total_price' => $package->total_price,
                'price_per_session' => $package->price_per_session,
                'is_active' => $package->is_active,
                'created_by' => $package->creator ? $package->creator->name : 'System',
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
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'sessions_count' => 'sometimes|integer|min:1|max:100',
            'total_price' => 'sometimes|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        $data = $request->only(['name', 'description', 'sessions_count', 'total_price', 'is_active']);

        if ($request->has('total_price') || $request->has('sessions_count')) {
            $sessionsCount = $request->sessions_count ?? $package->sessions_count;
            $totalPrice = $request->total_price ?? $package->total_price;
            $data['price_per_session'] = round($totalPrice / $sessionsCount, 2);
        }

        $package->update($data);

        return response()->json([
            'status' => true,
            'message' => 'Package updated successfully',
            'data' => $package->fresh(),
        ]);
    }

    public function destroy($id)
    {
        $package = SessionsPackages::findOrFail($id);

        if ($package->subscriptions()->whereIn('status', ['active'])->exists()) {
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

    public function pendingTeachers()
    {
        $teachers = User::whereHas('teacherInfo', function ($q) {
                $q->where('packages_approved', false);
            })
            ->with('teacherInfo')
            ->get()
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'email' => $teacher->email,
                    'offer_packages' => $teacher->teacherInfo->offer_packages ?? false,
                    'packages_approved' => $teacher->teacherInfo->packages_approved ?? false,
                ];
            });

        return response()->json([
            'status' => true,
            'data' => $teachers,
        ]);
    }

    public function approvedTeachers()
    {
        $teachers = User::whereHas('teacherInfo', function ($q) {
                $q->where('packages_approved', true);
            })
            ->with('teacherInfo')
            ->get()
            ->map(function ($teacher) {
                return [
                    'id' => $teacher->id,
                    'name' => $teacher->name,
                    'email' => $teacher->email,
                    'offer_packages' => $teacher->teacherInfo->offer_packages ?? false,
                    'packages_approved' => $teacher->teacherInfo->packages_approved ?? false,
                ];
            });

        return response()->json([
            'status' => true,
            'data' => $teachers,
        ]);
    }

    public function approveTeacher($teacherId)
    {
        $teacherInfo = TeacherInfo::where('teacher_id', $teacherId)->firstOrFail();

        $teacherInfo->update(['packages_approved' => true]);

        return response()->json([
            'status' => true,
            'message' => 'Teacher approved for offering packages',
        ]);
    }

    public function revokeTeacherApproval($teacherId)
    {
        $teacherInfo = TeacherInfo::where('teacher_id', $teacherId)->firstOrFail();

        $teacherInfo->update([
            'packages_approved' => false,
            'offer_packages' => false,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Teacher package approval revoked',
        ]);
    }
}
