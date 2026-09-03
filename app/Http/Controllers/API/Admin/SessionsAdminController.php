<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sessions;
use App\Traits\ExportsTabularData;

class SessionsAdminController extends Controller
{
    use ExportsTabularData;
    /**
     * Get All Sessions (With optional filters)
     */
    public function index(Request $request)
    {
        $query = Sessions::with(['teacher', 'student', 'booking.subject']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date')) {
            $query->whereDate('session_date', $request->date);
        }

        if ($request->filled('teacher_name')) {
            $query->whereHas('teacher', function($q) use ($request) {
                $q->where('first_name', 'like', '%' . $request->teacher_name . '%')
                  ->orWhere('last_name', 'like', '%' . $request->teacher_name . '%');
            });
        }

        if ($request->filled('student_name')) {
            $query->whereHas('student', function($q) use ($request) {
                $q->where('first_name', 'like', '%' . $request->student_name . '%')
                  ->orWhere('last_name', 'like', '%' . $request->student_name . '%');
            });
        }

        $sessions = $query->orderByDesc('session_date')
                         ->orderByDesc('start_time')
                         ->paginate(25);

        $sessions->getCollection()->transform(function ($session) {
            return [
                'id' => $session->id,
                'booking_id' => $session->booking_id,
                'session_number' => $session->session_number,
                'session_date' => $session->session_date ? $session->session_date->format('Y-m-d') : null,
                'start_time' => $session->start_time ? $session->start_time->format('H:i:s') : null,
                'end_time' => $session->end_time ? $session->end_time->format('H:i:s') : null,
                'status' => $session->status,
                'teacher' => $session->teacher ? [
                    'id' => $session->teacher->id,
                    'name' => trim($session->teacher->first_name . ' ' . $session->teacher->last_name),
                    'email' => $session->teacher->email
                ] : null,
                'student' => $session->student ? [
                    'id' => $session->student->id,
                    'name' => trim($session->student->first_name . ' ' . $session->student->last_name),
                    'email' => $session->student->email
                ] : null,
                'subject' => ($session->booking && $session->booking->subject) ? [
                    'name_en' => $session->booking->subject->name_en,
                    'name_ar' => $session->booking->subject->name_ar,
                ] : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $sessions
        ]);
    }

    public function export(Request $request)
    {
        $query = Sessions::with(['teacher', 'student', 'booking.subject']);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('date')) $query->whereDate('session_date', $request->date);
        if ($request->filled('teacher_name')) $query->whereHas('teacher', fn ($q) => $q
            ->where('first_name', 'like', '%' . $request->teacher_name . '%')
            ->orWhere('last_name', 'like', '%' . $request->teacher_name . '%'));
        if ($request->filled('student_name')) $query->whereHas('student', fn ($q) => $q
            ->where('first_name', 'like', '%' . $request->student_name . '%')
            ->orWhere('last_name', 'like', '%' . $request->student_name . '%'));

        $rows = $query->orderByDesc('session_date')->orderByDesc('start_time')->get()->map(fn ($session) => [
            $session->id,
            $session->session_date?->format('Y-m-d'),
            $session->start_time?->format('H:i:s'),
            $session->end_time?->format('H:i:s'),
            $session->teacher ? trim($session->teacher->first_name . ' ' . $session->teacher->last_name) : 'N/A',
            $session->student ? trim($session->student->first_name . ' ' . $session->student->last_name) : 'N/A',
            $session->status,
        ])->all();

        $headers = ['ID', 'Date', 'Start Time', 'End Time', 'Teacher', 'Student', 'Status'];
        return $request->input('format', 'xlsx') === 'pdf'
            ? $this->pdfResponse($headers, $rows, 'sessions-export')
            : $this->xlsxResponse($headers, $rows, 'sessions-export');
    }

    /**
     * Reschedule / Make-up Session
     */
    public function reschedule(Request $request, $id)
    {
        $request->validate([
            'session_date' => 'required|date',
            'start_time' => 'nullable|date_format:H:i:s',
            'end_time' => 'nullable|date_format:H:i:s',
        ]);

        $session = Sessions::findOrFail($id);
        
        $session->session_date = $request->session_date;
        
        if ($request->filled('start_time')) {
            $session->start_time = $request->start_time;
        }
        
        if ($request->filled('end_time')) {
            $session->end_time = $request->end_time;
        }
        
        $session->save();

        return response()->json([
            'success' => true,
            'message' => 'Session rescheduled successfully.'
        ]);
    }

    /**
     * Get User Sessions Profile
     */
    public function userSessions(Request $request, $userId)
    {
        $role = $request->query('role');
        $query = Sessions::with(['teacher', 'student', 'booking.subject']);

        if ($role === 'teacher') {
            $query->where('teacher_id', $userId);
        } elseif ($role === 'student') {
            $query->where('student_id', $userId);
        } else {
            $query->where(function($q) use ($userId) {
                $q->where('teacher_id', $userId)
                  ->orWhere('student_id', $userId);
            });
        }

        $sessions = $query->orderByDesc('session_date')
                         ->orderByDesc('start_time')
                         ->get();

        $data = $sessions->map(function ($session) {
            return [
                'id' => $session->id,
                'booking_id' => $session->booking_id,
                'session_number' => $session->session_number,
                'session_date' => $session->session_date ? $session->session_date->format('Y-m-d') : null,
                'start_time' => $session->start_time ? $session->start_time->format('H:i:s') : null,
                'end_time' => $session->end_time ? $session->end_time->format('H:i:s') : null,
                'status' => $session->status,
                'teacher' => $session->teacher ? [
                    'id' => $session->teacher->id,
                    'name' => trim($session->teacher->first_name . ' ' . $session->teacher->last_name),
                    'email' => $session->teacher->email
                ] : null,
                'student' => $session->student ? [
                    'id' => $session->student->id,
                    'name' => trim($session->student->first_name . ' ' . $session->student->last_name),
                    'email' => $session->student->email
                ] : null,
                'subject' => ($session->booking && $session->booking->subject) ? [
                    'name_en' => $session->booking->subject->name_en,
                    'name_ar' => $session->booking->subject->name_ar,
                ] : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
}
