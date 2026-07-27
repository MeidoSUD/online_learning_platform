<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\User;
use App\Models\Course;
use App\Models\Booking;
use App\Services\NelcXapiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AdminCertificateController extends Controller
{
    public function index(Request $request)
    {
        $query = Certificate::with(['student:id,first_name,last_name,notional_id', 'course:id,name', 'issuer:id,first_name,last_name']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('certificate_number', 'like', "%{$search}%")
                  ->orWhere('student_name', 'like', "%{$search}%")
                  ->orWhere('course_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            if ($request->type === 'course') {
                $query->whereNotNull('course_id');
            } elseif ($request->type === 'private') {
                $query->whereNull('course_id');
            }
        }

        $certificates = $query->orderByDesc('issued_at')->paginate($request->get('per_page', 20));
        return response()->json(['success' => true, 'data' => $certificates]);
    }

    public function eligible(Request $request)
    {
        $existing = DB::table('certificates')->select('student_id', 'booking_id');

        $completedBookings = Booking::where('status', 'completed')
            ->whereColumn('sessions_completed', '>=', 'sessions_count')
            ->where('sessions_count', '>', 0)
            ->leftJoinSub($existing, 'certs', function ($join) {
                $join->on('certs.student_id', '=', 'bookings.student_id')
                     ->on('certs.booking_id', '=', 'bookings.id');
            })
            ->whereNull('certs.student_id')
            ->with('student:id,first_name,last_name,notional_id', 'course:id,name', 'teacher:id,first_name,last_name')
            ->get()
            ->map(function ($booking) {
                $isPrivate = $booking->course_id === null;
                $student = $booking->student;
                $teacher = $booking->teacher;
                return [
                    'booking_id' => $booking->id,
                    'student_id' => $student->id,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'notional_id' => $student->notional_id,
                    'course_id' => $booking->course_id,
                    'course_name' => $booking->course ? $booking->course->name : ($teacher->first_name . ' ' . $teacher->last_name . ' - Private Lessons'),
                    'teacher_name' => $teacher->first_name . ' ' . $teacher->last_name,
                    'type' => $isPrivate ? 'private' : 'course',
                    'sessions_done' => $booking->sessions_completed,
                    'total_sessions' => $booking->sessions_count,
                ];
            });

        return response()->json(['success' => true, 'data' => $completedBookings]);
    }

    public function issue(Request $request)
    {
        $request->validate([
            'student_id' => 'required|integer|exists:users,id',
            'course_id' => 'nullable|integer|exists:courses,id',
            'booking_id' => 'required|integer|exists:bookings,id',
            'notes' => 'nullable|string',
        ]);

        $booking = Booking::with('student', 'course', 'teacher')->findOrFail($request->booking_id);

        $existing = Certificate::where('student_id', $request->student_id)
            ->where('booking_id', $request->booking_id)
            ->first();

        if ($existing) {
            return response()->json(['success' => false, 'message' => 'Certificate already issued for this session.'], 409);
        }

        $student = $booking->student;
        $admin = $request->user();

        $courseName = $booking->course
            ? $booking->course->name
            : $booking->teacher->first_name . ' ' . $booking->teacher->last_name . ' - Private Lessons';

        $certificate = Certificate::create([
            'student_id' => $student->id,
            'course_id' => $booking->course_id,
            'booking_id' => $booking->id,
            'issued_by' => $admin->id,
            'student_name' => $student->first_name . ' ' . $student->last_name,
            'course_name' => $courseName,
            'completion_date' => now()->toDateString(),
            'notes' => $request->notes,
        ]);

        try {
            $nelc = app(NelcXapiService::class);
            $certUrl = url('/') . '/certificate/' . $certificate->certificate_number;
            $nelc->earned($student, $booking, $certUrl, $certificate->certificate_number);
        } catch (\Throwable $e) {
            Log::warning('NELC xAPI: earned certificate hook failed', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Certificate issued successfully.',
            'data' => $certificate,
        ]);
    }

    public function show($id)
    {
        $certificate = Certificate::with(['student:id,first_name,last_name,notional_id,email', 'course:id,name,description', 'booking:id,booking_reference,teacher_id,sessions_count,sessions_completed', 'issuer:id,first_name,last_name'])
            ->findOrFail($id);
        return response()->json(['success' => true, 'data' => $certificate]);
    }

    public function revoke($id)
    {
        $certificate = Certificate::findOrFail($id);
        $certificate->delete();
        return response()->json(['success' => true, 'message' => 'Certificate revoked.']);
    }
}
