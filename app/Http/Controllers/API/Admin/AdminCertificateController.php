<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\User;
use App\Models\Course;
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

        $certificates = $query->orderByDesc('issued_at')->paginate($request->get('per_page', 20));
        return response()->json(['success' => true, 'data' => $certificates]);
    }

    public function eligible(Request $request)
    {
        $sub = DB::table('subscriptions')
            ->select('user_id', 'course_id', DB::raw('MAX(sessions_completed) as sessions_done'), DB::raw('MAX(sessions_count) as total_sessions'))
            ->groupBy('user_id', 'course_id')
            ->havingRaw('MAX(sessions_completed) >= MAX(sessions_count)')
            ->havingRaw('MAX(sessions_count) > 0');

        $existing = DB::table('certificates')->select('student_id', 'course_id');

        $results = DB::table('subscriptions as s')
            ->join('users as u', 'u.id', '=', 's.user_id')
            ->join('courses as c', 'c.id', '=', 's.course_id')
            ->leftJoinSub($existing, 'certs', function ($join) {
                $join->on('certs.student_id', '=', 's.user_id')
                     ->on('certs.course_id', '=', 's.course_id');
            })
            ->whereNull('certs.student_id')
            ->select('u.id as user_id', 'u.first_name', 'u.last_name', 'u.notional_id',
                     'c.id as course_id', 'c.name as course_name',
                     's.sessions_done', 's.total_sessions')
            ->distinct()
            ->get();

        return response()->json(['success' => true, 'data' => $results]);
    }

    public function issue(Request $request)
    {
        $request->validate([
            'student_id' => 'required|integer|exists:users,id',
            'course_id' => 'required|integer|exists:courses,id',
            'notes' => 'nullable|string',
        ]);

        $existing = Certificate::where('student_id', $request->student_id)
            ->where('course_id', $request->course_id)
            ->first();

        if ($existing) {
            return response()->json(['success' => false, 'message' => 'Certificate already issued for this student and course.'], 409);
        }

        $student = User::findOrFail($request->student_id);
        $course = Course::findOrFail($request->course_id);
        $admin = $request->user();

        $certificate = Certificate::create([
            'student_id' => $student->id,
            'course_id' => $course->id,
            'issued_by' => $admin->id,
            'student_name' => $student->first_name . ' ' . $student->last_name,
            'course_name' => $course->name,
            'completion_date' => now()->toDateString(),
            'notes' => $request->notes,
        ]);

        try {
            $nelc = app(NelcXapiService::class);
            $certUrl = url('/') . '/certificate/' . $certificate->certificate_number;
            $nelc->earned($student, $course, $certUrl, $certificate->certificate_number);
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
        $certificate = Certificate::with(['student:id,first_name,last_name,notional_id,email', 'course:id,name,description', 'issuer:id,first_name,last_name'])
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
