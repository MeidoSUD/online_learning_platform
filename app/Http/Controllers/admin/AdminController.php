<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Booking;
use App\Models\LessonSession;
use App\Models\Course;
use App\Models\Dispute;
use App\Models\Payout;
use App\Models\Role;

class AdminController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $pageConfigs = ['pageHeader' => false];

        $teachersCount = User::where('role_id', 3)->count();
        $studentsCount = User::where('role_id', 4)->count();
        $coursesCount = Course::count();
        $lessonsCount = LessonSession::count();
        $bookingsCount = Booking::count();
        $disputesCount = Dispute::count();
        $payoutsCount = Payout::count();

        // Recent records
        $recentTeachers = User::where('role_id', 3)->latest()->take(5)->get();
        $recentStudents = User::where('role_id', 4)->latest()->take(5)->get();
        $recentBookings = Booking::latest()->take(5)->get();
        $recentDisputes = Dispute::latest()->take(5)->get();

        // Revenue (example: sum of payouts)
        $totalRevenue = Payout::sum('amount');

        return view('admin.dashboard-admin', compact(
            'pageConfigs',
            'teachersCount',
            'studentsCount',
            'coursesCount',
            'lessonsCount',
            'bookingsCount',
            'disputesCount',
            'payoutsCount',
            'recentTeachers',
            'recentStudents',
            'recentBookings',
            'recentDisputes',
            'totalRevenue'
        ));
    }
}
