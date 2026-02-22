<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\Wallet;

class DashboardController extends Controller
{
    /**
     * Get comprehensive admin dashboard statistics
     * 
     * @OA\Get(
     *     path="/api/admin/dashboard",
     *     summary="Get admin dashboard with all statistics",
     *     tags={"Admin - Dashboard"},
     *     security={{"sanctum":{}}},
     *     @OA\Response(response=200, description="Dashboard statistics"),
     * )
     */
    public function dashboard(Request $request)
    {
        try {
            // Total Users count
            $totalUsers = User::count();
            
            // Active Teachers (role_id = 3, verified, is_active)
            $activeTeachers = User::where('role_id', 3)
                ->where('verified', true)
                ->where('is_active', true)
                ->count();
            
            // Total Teachers
            $totalTeachers = User::where('role_id', 3)->count();
            
            // Total Students
            $totalStudents = User::where('role_id', 4)->count();
            
            // Total Bookings
            $totalBookings = Booking::count();
            
            // Confirmed Bookings
            $confirmedBookings = Booking::where('status', 'confirmed')->count();
            
            // Pending Payment Bookings
            $pendingPaymentBookings = Booking::where('status', 'pending_payment')->count();
            
            // Cancelled Bookings
            $cancelledBookings = Booking::where('status', 'cancelled')->count();
            
            // Total Payments
            $totalPayments = Payment::count();
            
            // Successful Payments
            $successfulPayments = Payment::where('status', 'success')->count();
            
            // Total Revenue (sum of successful payments)
            $totalRevenue = Payment::where('status', 'success')
                ->sum('amount') ?? 0;
            
            // Teachers Wallet Total (sum of all teacher wallets) - with error handling
            $teachersWalletTotal = 0;
            try {
                $teachersWalletTotal = Wallet::whereHas('user', function ($query) {
                    $query->where('role_id', 3);
                })->sum('balance') ?? 0;
            } catch (\Exception $e) {
                Log::warning('Error calculating teachers wallet total', ['error' => $e->getMessage()]);
                $teachersWalletTotal = 0;
            }
            
            // Recent Activity (last 10 bookings)
            $recentActivity = Booking::with(['student', 'teacher'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($booking) {
                    // Get student or teacher name depending on context
                    $studentName = optional($booking->student)->first_name . ' ' . optional($booking->student)->last_name;
                    $teacherName = optional($booking->teacher)->first_name . ' ' . optional($booking->teacher)->last_name;
                    
                    return [
                        'id' => $booking->id,
                        'type' => 'booking',
                        'student_name' => $studentName,
                        'teacher_name' => $teacherName,
                        'status' => $booking->status,
                        'amount' => $booking->total_amount ?? 0,
                        'created_at' => $booking->created_at->format('Y-m-d H:i:s'),
                    ];
                });
            
            // New Users This Month
            $newUsersThisMonth = User::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();
            
            // New Bookings This Month
            $newBookingsThisMonth = Booking::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();
            
            // Unverified Teachers
            $unverifiedTeachers = User::where('role_id', 3)
                ->where('verified', false)
                ->count();
            
            // Inactive Users
            $inactiveUsers = User::where('is_active', false)->count();
            
            // Users by Role
            $usersByRole = [
                'admin' => User::where('role_id', 1)->count(),
                'teacher' => $totalTeachers,
                'student' => $totalStudents,
            ];
            
            // Booking Status Distribution
            $bookingsByStatus = [
                'confirmed' => $confirmedBookings,
                'pending_payment' => $pendingPaymentBookings,
                'cancelled' => $cancelledBookings,
            ];
            
            // Payment Status Distribution
            $paymentsByStatus = [
                'success' => $successfulPayments,
                'pending' => Payment::where('status', 'pending')->count(),
                'failed' => Payment::where('status', 'failed')->count(),
            ];
            
            Log::info('Admin dashboard accessed', [
                'timestamp' => now(),
                'total_users' => $totalUsers,
                'active_teachers' => $activeTeachers,
            ]);
            
            return response()->json([
                'success' => true,
                'code' => 'DASHBOARD_RETRIEVED',
                'status' => 'success',
                'message_en' => 'Dashboard data retrieved successfully',
                'message_ar' => 'تم استرجاع بيانات لوحة التحكم بنجاح',
                'data' => [
                    'summary' => [
                        'total_users' => $totalUsers,
                        'total_teachers' => $totalTeachers,
                        'active_teachers' => $activeTeachers,
                        'unverified_teachers' => $unverifiedTeachers,
                        'total_students' => $totalStudents,
                        'inactive_users' => $inactiveUsers,
                        'total_bookings' => $totalBookings,
                        'total_revenue' => (float) $totalRevenue,
                        'teachers_wallet_total' => (float) $teachersWalletTotal,
                    ],
                    'bookings' => [
                        'total' => $totalBookings,
                        'confirmed' => $confirmedBookings,
                        'pending_payment' => $pendingPaymentBookings,
                        'cancelled' => $cancelledBookings,
                        'by_status' => $bookingsByStatus,
                    ],
                    'payments' => [
                        'total' => $totalPayments,
                        'successful' => $successfulPayments,
                        'total_amount' => (float) $totalRevenue,
                        'by_status' => $paymentsByStatus,
                    ],
                    'users_by_role' => $usersByRole,
                    'monthly_metrics' => [
                        'new_users_this_month' => $newUsersThisMonth,
                        'new_bookings_this_month' => $newBookingsThisMonth,
                    ],
                    'recent_activity' => $recentActivity,
                    'wallet_info' => [
                        'total_teachers_wallet' => (float) $teachersWalletTotal,
                        'average_per_teacher' => $totalTeachers > 0 ? round((float) $teachersWalletTotal / $totalTeachers, 2) : 0,
                    ],
                ],
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Error fetching dashboard data', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'code' => 'DASHBOARD_ERROR',
                'status' => 'error',
                'message_en' => 'Error fetching dashboard data',
                'message_ar' => 'خطأ في جلب بيانات لوحة التحكم',
            ], 500);
        }
    }

    public function stats(Request $request)
    {
        $users = DB::table('users')->count();
        $teachers = DB::table('users')->where('role_id', 3)->count();
        $courses = DB::table('courses')->count();
        $bookings = DB::table('bookings')->count();

        return response()->json([
            'success' => true,
            'data' => compact('users','teachers','courses','bookings')
        ]);
    }

    public function health(Request $request)
    {
        // Basic health check — DB connectivity and queue length if present
        try {
            DB::select('select 1');
            $db = 'ok';
        } catch (\Throwable $e) {
            $db = 'error';
        }

        return response()->json([
            'success' => true,
            'data' => [
                'database' => $db,
                'app' => env('APP_ENV'),
                'timestamp' => now()->toDateTimeString(),
            ]
        ]);
    }
}
