<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Sessions;
use Carbon\Carbon;
use App\Models\Booking;

class TeacherController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return view('teacher.dashboard');
    }

    // bookings

    public function bookings()
    {
        $teacherId = auth()->id();

        // Get all bookings for this teacher
        $bookings = Booking::where('teacher_id', $teacherId)
            ->orderBy('first_session_date', 'asc')
            ->get();

        return view('teacher.bookings.index', compact('bookings'));
    }


    public function calendar(Request $request)
    {
        $teacher = Auth::user();
        
        // Get month and year from request or use current
        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);
        
        // Create Carbon instance for the selected month
        $date = Carbon::createFromDate($year, $month, 1);
        
        // Get all sessions for this teacher
        $sessions = Sessions::where('teacher_id', $teacher->id)
            ->whereYear('session_date', $year)
            ->whereMonth('session_date', $month)
            ->with(['student', 'booking'])
            ->orderBy('session_date')
            ->orderBy('start_time')
            ->get();
        
        // Group sessions by date for calendar view
        $sessionsByDate = $sessions->groupBy(function($session) {
            return Carbon::parse($session->session_date)->format('Y-m-d');
        });
        
        // Get upcoming sessions (next 5)
        $upcomingSessions = Sessions::where('teacher_id', $teacher->id)
            ->where('session_date', '>=', now()->toDateString())
            ->where('status', '!=', 'completed')
            ->with(['student', 'booking'])
            ->orderBy('session_date')
            ->orderBy('start_time')
            ->limit(5)
            ->get();
        
        // Get today's sessions
        $todaySessions = Sessions::where('teacher_id', $teacher->id)
            ->whereDate('session_date', now()->toDateString())
            ->with(['student', 'booking'])
            ->orderBy('start_time')
            ->get();
        
        // Calendar statistics
        $stats = [
            'total_sessions' => Sessions::where('teacher_id', $teacher->id)->count(),
            'completed_sessions' => Sessions::where('teacher_id', $teacher->id)->where('status', 'completed')->count(),
            'upcoming_sessions' => Sessions::where('teacher_id', $teacher->id)
                ->where('session_date', '>=', now()->toDateString())
                ->where('status', '!=', 'completed')
                ->count(),
            'cancelled_sessions' => Sessions::where('teacher_id', $teacher->id)->where('status', 'cancelled')->count(),
        ];
        
        return view('teacher.calendar', compact(
            'sessions',
            'sessionsByDate',
            'upcomingSessions',
            'todaySessions',
            'date',
            'month',
            'year',
            'stats'
        ));
    }
    
    /**
     * Show session details
     */
    public function sessionDetails($id)
    {
        $teacher = Auth::user();
        
        $session = Sessions::where('teacher_id', $teacher->id)
            ->where('id', $id)
            ->with(['student', 'booking', 'teacher'])
            ->firstOrFail();
        
        return view('teacher.session-details', compact('session'));
    }
}
