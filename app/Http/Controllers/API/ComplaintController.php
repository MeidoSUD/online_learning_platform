<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Complaint;

class ComplaintController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $complaints = Complaint::where('student_id', $userId)
            ->with(['session', 'teacher'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $complaints,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'session_id'  => 'required|exists:sessions,id',
            'teacher_id'  => 'required|exists:users,id',
            'reason'      => 'required|string|max:2000',
        ]);

        $existing = Complaint::where('session_id', $validated['session_id'])
            ->where('student_id', $request->user()->id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'You have already submitted a complaint for this session',
            ], 409);
        }

        $complaint = Complaint::create([
            'session_id'  => $validated['session_id'],
            'student_id'  => $request->user()->id,
            'teacher_id'  => $validated['teacher_id'],
            'reason'      => $validated['reason'],
            'status'      => 'open',
        ]);

        $complaint->load(['session', 'teacher']);

        return response()->json([
            'success' => true,
            'message' => 'Complaint submitted successfully',
            'data'    => $complaint,
        ], 201);
    }

    public function bySession(Request $request, $sessionId)
    {
        $userId = $request->user()->id;
        $complaint = Complaint::where('session_id', $sessionId)
            ->where('student_id', $userId)
            ->with(['session', 'teacher'])
            ->first();

        if ($complaint) {
            return response()->json([
                'success' => true,
                'data'    => $complaint,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No complaint found for this session',
        ]);
    }
}
