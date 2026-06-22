<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SessionsPackages;
use App\Models\TeacherInfo;

class TeacherPackageController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:teacher');
    }

    public function index()
    {
        $teacherId = request()->user()->id;

        $teacherInfo = TeacherInfo::where('teacher_id', $teacherId)->first();

        $packages = SessionsPackages::where('is_active', true)->get();

        return response()->json([
            'status' => true,
            'data' => [
                'offer_packages' => $teacherInfo ? $teacherInfo->offer_packages : false,
                'packages_approved' => $teacherInfo ? $teacherInfo->packages_approved : false,
                'available_packages' => $packages,
            ],
        ]);
    }

    public function toggleOfferPackages(Request $request)
    {
        $teacherId = $request->user()->id;

        $teacherInfo = TeacherInfo::where('teacher_id', $teacherId)->firstOrFail();

        if (!$teacherInfo->packages_approved) {
            return response()->json([
                'status' => false,
                'message' => 'Your package feature is pending admin approval',
            ], 403);
        }

        $teacherInfo->update(['offer_packages' => !$teacherInfo->offer_packages]);

        return response()->json([
            'status' => true,
            'message' => $teacherInfo->offer_packages ? 'Packages enabled for your profile' : 'Packages disabled for your profile',
            'offer_packages' => $teacherInfo->offer_packages,
        ]);
    }
}
