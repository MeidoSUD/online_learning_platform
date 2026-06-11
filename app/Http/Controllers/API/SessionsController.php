<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sessions;
use Illuminate\Http\JsonResponse;
use App\Services\AgoraService;
use App\Services\TeacherWalletService;
use Illuminate\Support\Facades\Log;
use App\Models\User;


class SessionsController extends Controller
{
    /**
     * @OA\Get(
     *     path="/api/sessions",
     *     summary="Get all sessions for the authenticated user",
     *     tags={"Sessions"},
     *     @OA\Parameter(name="status", in="query", @OA\Schema(type="string")),
     *     @OA\Response(
     *         response=200,
     *         description="List of sessions for the authenticated user"
     *     )
     * )
     */

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->autoUpdateOverdueSessions($user);

        $status = $request->get('status', null); // optional: filter by status
        $perPage = $request->get('per_page', 15);

        // Build query based on user type
        $query = Sessions::with(['teacher:id,first_name,last_name,email,nationality', 'student:id,first_name,last_name,email', 'booking']);

        if ($user->role_id == 3) {
            // TEACHER: Get all sessions for this teacher
            $query->where('teacher_id', $user->id);
        } elseif ($user->role_id == 4) {
            // STUDENT: Get all sessions for this student
            $query->where('student_id', $user->id);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Invalid user role'
            ], 403);
        }

        // Filter by status if provided
        if ($status) {
            $query->where('status', $status);
        }

        // Order by date and time (newest first)
        $sessions = $query->orderByDesc('session_date')->orderByDesc('start_time')->paginate($perPage);

        // Transform sessions with full data
        $transformedSessions = $sessions->through(function ($session) use ($user) {
            return $this->transformSession($session, $user);
        });

        return response()->json([
            'success' => true,
            'data' => $transformedSessions,
            'pagination' => [
                'current_page' => $sessions->currentPage(),
                'last_page' => $sessions->lastPage(),
                'per_page' => $sessions->perPage(),
                'total' => $sessions->total(),
            ]
        ]);
    }

    /**
     * Get grouped sessions by time (for teacher view)
     * Sessions that share the same time/date are grouped together
     * GET /api/sessions/grouped
     */
    /**
     * @OA\Get(
     *     path="/api/sessions/grouped",
     *     summary="Get grouped sessions (teacher view)",
     *     tags={"Sessions"},
     *     @OA\Response(response=200, description="Grouped sessions")
     * )
     */
    public function groupedSessions(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->autoUpdateOverdueSessions($user);

        if ($user->role_id != 3) {
            return response()->json([
                'success' => false,
                'message' => 'This endpoint is for teachers only'
            ], 403);
        }

        $status = $request->get('status', null);

        // Get all sessions for this teacher
        $query = Sessions::with(['teacher:id,first_name,last_name,email,nationality', 'student:id,first_name,last_name,email', 'booking'])
            ->where('teacher_id', $user->id);

        if ($status) {
            $query->where('status', $status);
        }

        $allSessions = $query->orderBy('session_date')->orderBy('start_time')->get();

        // Group by session_date and start_time
        $grouped = $allSessions->groupBy(function ($session) {
            return $session->session_date . '|' . $session->start_time;
        })->map(function ($sessionGroup) use ($user) {
            $firstSession = $sessionGroup->first();

            return [
                'session_datetime' => [
                    'date' => $firstSession->session_date,
                    'start_time' => $firstSession->start_time,
                    'end_time' => $firstSession->end_time,
                    'duration' => $firstSession->duration,
                ],
                'group_info' => [
                    'total_students' => $sessionGroup->count(),
                    'session_type' => $sessionGroup->count() > 1 ? 'group' : 'single',
                    'status' => $firstSession->status,
                    'meeting_id' => $firstSession->meeting_id,
                    'join_url' => $firstSession->join_url,
                    'host_url' => $firstSession->host_url,
                ],
                'students' => $sessionGroup->map(function ($session) {
                    return $this->transformSession($session, null);
                })->values(),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $grouped,
            'total_groups' => count($grouped),
        ]);
    }

    /**
     * Transform a session record with full related data
     */
    private function transformSession($session, $user): array
    {
        // Get subject data if booking exists
        $subjectData = null;
        if ($session->booking) {
            // If booking has course, get course name as subject
            if ($session->booking->course) {
                $subjectData = [
                    'id' => $session->booking->course->id,
                    'name' => $session->booking->course->name,
                    'course_id' => $session->booking->course->id,
                ];
            } else {
                // Check if booking has a subject_id directly
                // (for service bookings without course)
                if (isset($session->booking->subject_id)) {
                    $subject = \App\Models\Subject::find($session->booking->subject_id);
                    if ($subject) {
                        $subjectData = [
                            'id' => $subject->id,
                            'name_en' => $subject->name_en,
                            'name_ar' => $subject->name_ar,
                        ];
                    }
                }
            }
        }

        // Normalize session date to Y-m-d and provide day info
        $rawDate = $session->session_date;
        try {
            if ($rawDate instanceof \Carbon\Carbon) {
                $sessionDateFormatted = $rawDate->format('Y-m-d');
                $dayNumber = $rawDate->dayOfWeek; // 0 (Sunday) .. 6 (Saturday)
                $dayName = $rawDate->format('l');
            } else {
                $dt = \Carbon\Carbon::parse((string) $rawDate);
                $sessionDateFormatted = $dt->format('Y-m-d');
                $dayNumber = $dt->dayOfWeek;
                $dayName = $dt->format('l');
            }
        } catch (\Exception $e) {
            // Fallback: take first 10 chars
            $sessionDateFormatted = substr((string) $rawDate, 0, 10);
            try {
                $dt = \Carbon\Carbon::parse($sessionDateFormatted);
                $dayNumber = $dt->dayOfWeek;
                $dayName = $dt->format('l');
            } catch (\Exception $ex) {
                $dayNumber = null;
                $dayName = null;
            }
        }

        return [
            'id' => $session->id,
            'booking_id' => $session->booking_id,
            'session_number' => $session->session_number,
            'session_title' => $session->session_title,
            'session_date' => $sessionDateFormatted,
            'day_name' => $dayName,
            'day_number' => $dayNumber,
            'start_time' => $session->start_time instanceof \Carbon\Carbon
                ? $session->start_time->format('H:i:s')
                : $session->start_time,
            'end_time' => $session->end_time instanceof \Carbon\Carbon
                ? $session->end_time->format('H:i:s')
                : $session->end_time,
            'duration' => $session->duration,
            'status' => $session->status,
            'teacher' => [
                'id' => $session->teacher->id,
                'name' => $session->teacher->first_name . ' ' . $session->teacher->last_name,
                'email' => $session->teacher->email,
            ],
            'student' => [
                'id' => $session->student->id,
                'name' => $session->student->first_name . ' ' . $session->student->last_name,
                'email' => $session->student->email,
            ],
            'meeting' => [
                'meeting_id' => $session->meeting_id,
                'join_url' => $session->join_url,
                'host_url' => $session->host_url,
            ],
            'subject' => $subjectData,
            'booking' => $session->booking ? [
                'id' => $session->booking->id,
                'reference' => $session->booking->booking_reference,
                'type' => $session->booking->session_type,
                'total_sessions' => $session->booking->sessions_count,
                'completed_sessions' => $session->booking->sessions_completed,
            ] : null,
            'session_info' => [
                'started_at' => $session->started_at,
                'ended_at' => $session->ended_at,
                'teacher_notes' => $session->teacher_notes,
                'homework' => $session->homework,
                'materials_shared' => $session->materials_shared,
            ],
            'ratings' => [
                'student_rating' => $session->student_rating,
                'teacher_rating' => $session->teacher_rating,
            ],
        ];
    }

    /**
     * Get details of a specific session
     * GET /api/sessions/{sessionId}
     */
    /**
     * @OA\Get(
     *     path="/api/sessions/{sessionId}",
     *     summary="Get session details",
     *     tags={"Sessions"},
     *     @OA\Parameter(name="sessionId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Session details")
     * )
     */
    public function show(Request $request, $sessionId): JsonResponse
    {
        $user = $request->user();
        $this->autoUpdateOverdueSessions($user);

        $session = Sessions::with(['teacher:id,first_name,last_name,email,nationality', 'student:id,first_name,last_name,email', 'booking'])->where('id', $sessionId)
            ->where(function ($query) use ($user) {
                if ($user->role_id == 3) { // teacher
                    $query->where('teacher_id', $user->id);
                } elseif ($user->role_id == 4) { // student
                    $query->where('student_id', $user->id);
                }
            })->first();

        if (!$session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->transformSession($session, $user)
        ]);
    }

    /**
     * Get Agora Chat credentials for a session.
     * Can be called BEFORE the session starts (unlike join() which requires live status).
     * Mobile app calls this to register the user on Agora Chat and get an RTM token + channel.
     *
     * POST /api/sessions/{id}/chat-token
     */
    public function getChatToken(Request $request, $sessionId): JsonResponse
    {
        $user = $request->user();

        $session = Sessions::with(['teacher', 'student'])
            ->where('id', $sessionId)
            ->where(function ($q) use ($user) {
                $q->where('student_id', $user->id)->orWhere('teacher_id', $user->id);
            })
            ->first();

        if (! $session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found or you are not a participant'
            ], 404);
        }

        $userType = ($user->id == $session->teacher_id) ? 'teacher' : 'student';

        $agora = new AgoraService();

        $chatCredentials = $agora->generateChatCredentials(
            (int) $session->id,
            (int) $user->id,
            $userType
        );

        if (! $chatCredentials) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate Agora Chat credentials'
            ], 500);
        }

        // Persist the Agora Chat UUID on the user record (one-time)
        if ($user->agora_chat_uid !== $chatCredentials['agora_uid']) {
            User::where('id', $user->id)->update(['agora_chat_uid' => $chatCredentials['agora_uid']]);
        }
        Log::info('Generated Agora Chat credentials', [
            'chat credentials' => $chatCredentials,
        ]);
        // Ensure a chat room exists for this session. createChatRoom will
        // return an Agora chat room id when successful. Persist it once.
        $chatRoomId = $session->chat_room_id ?? null;
        if (! $chatRoomId) {
            try {
                $createdId = $agora->createChatRoom('session_' . $session->id, 'teacher_' . $session->teacher_id);
                if ($createdId) {
                    $session->chat_room_id = $createdId;
                    $session->save();
                    $chatRoomId = $createdId;
                    Log::info('Persisted chat_room_id to session', ['session_id' => $session->id, 'chat_room_id' => $chatRoomId]);
                } else {
                    Log::warning('createChatRoom returned null or room already exists', ['session_id' => $session->id]);
                }
            } catch (\Throwable $e) {
                Log::error('Failed to create or persist chat_room_id', ['session_id' => $session->id, 'error' => $e->getMessage()]);
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'chat' => [
                    'token'      => $chatCredentials['token'],
                    'uid'        => $chatCredentials['uid'],
                    'channel'    => $chatCredentials['channel'],
                    'expires_in' => $chatCredentials['expires_in'],
                    'app_id'     => $chatCredentials['app_id'],
                    'agora_uid'  => $chatCredentials['agora_uid'],
                    'chat_room_id' => $chatRoomId,
                ],
            ],
        ]);
    }

    public function start(Request $request, $sessionId): JsonResponse
{
    $user = $request->user();

    if ($user->role_id != 3) {
        return response()->json(['success' => false, 'message' => 'Only teachers can start sessions'], 403);
    }

    $session = Sessions::with(['teacher', 'student', 'booking'])
        ->where('id', $sessionId)
        ->where('teacher_id', $user->id)
        ->first();

    if (!$session) {
        return response()->json(['success' => false, 'message' => 'Session not found or you are not the teacher'], 404);
    }

    if (!$session->can_start) {
        Log::info('Teacher tried to start session outside allowed window', ['session_id' => $session->id]);
    }

    $agora          = new AgoraService();
    $channel        = 'session_' . $session->id;
    $teacherAccount = 'teacher_' . $session->teacher_id;

    // 1. Generate RTC host token
    $host = $agora->generateTokenForAccount($channel, $teacherAccount, \App\Agora\RtcTokenBuilder::RolePublisher);

    if (!$host || empty($host['token'])) {
        Log::error('Failed to generate Agora host token', [
            'channel' => $channel,
            'account' => $teacherAccount,
        ]);
        return response()->json(['success' => false, 'message' => 'Failed to generate Agora host token. Check Agora credentials.'], 500);
    }

    // 2. Persist meeting_id and mark session live
    try {
        $session->meeting_id = $channel;
        $session->status     = Sessions::STATUS_LIVE;
        $session->save();
    } catch (\Throwable $e) {
        Log::warning('Failed to persist meeting id to session: ' . $e->getMessage());
    }

    $session->start();

    // 3. Register teacher on Agora Chat + generate Chat USER token
    $chatCredentials = $agora->generateChatCredentials(
        (int) $session->id,
        (int) $user->id,
        'teacher'
    );

    if ($chatCredentials && $user->agora_chat_uid !== $chatCredentials['agora_uid']) {
        User::where('id', $user->id)->update(['agora_chat_uid' => $chatCredentials['agora_uid']]);
    }

    // 4. Get or create the chat room — single source of truth, persists the ID
    $chatRoomId = $agora->getOrCreateChatRoomForSession($session);

    return response()->json([
        'success' => true,
        'message' => 'Session started',
        'data'    => [
            'agora' => [
                'channel'        => $host['channel'],
                'token'          => $host['token'],
                'uid'            => $host['uid'],
                'role'           => 'host',
                'expires_in'     => $host['expires_in'],
                'chat_channel'   => $host['channel'],
                'app_id'         => $chatCredentials['app_id'] ?? config('services.agora.app_id'),
                'chat_token'     => $chatCredentials['token'] ?? null,
                'chat_uid'       => $chatCredentials['uid'] ?? null,
                'chat_expires_in'=> $chatCredentials['expires_in'] ?? null,
                'chat_agora_uid' => $chatCredentials['agora_uid'] ?? null,
                'chat_room_id'   => $chatRoomId,
            ],
            'session_status' => 'live',
        ],
        'errors' => null,
        'meta'   => null,
    ]);
}

/**
 * Student (or participant) joins a session and receives join token/urls
 * POST /api/student/sessions/{id}/join
 */
public function join(Request $request, $sessionId): JsonResponse
{
    $user = $request->user();

    $session = Sessions::with(['teacher', 'student', 'booking'])
        ->where('id', $sessionId)
        ->where(function ($q) use ($user) {
            $q->where('student_id', $user->id)->orWhere('teacher_id', $user->id);
        })
        ->first();

    if (!$session) {
        return response()->json(['success' => false, 'message' => 'Session not found or you are not a participant'], 404);
    }

    if ($session->status !== Sessions::STATUS_LIVE) {
        return response()->json([
            'success' => false,
            'message' => 'Waiting for teacher to start the session',
            'data'    => ['session_status' => 'waiting_for_teacher'],
            'errors'  => null,
            'meta'    => null,
        ], 423);
    }

    $agora     = new AgoraService();
    $channel   = 'session_' . $session->id;
    $isTeacher = $user->id == $session->teacher_id;

    $account   = $isTeacher ? 'teacher_' . $user->id : 'student_' . $user->id;
    $roleConst = $isTeacher ? \App\Agora\RtcTokenBuilder::RolePublisher : \App\Agora\RtcTokenBuilder::RoleSubscriber;
    $roleName  = $isTeacher ? 'host' : 'participant';

    // 1. Generate RTC token for this participant
    $tokenInfo = $agora->generateTokenForAccount($channel, $account, $roleConst);

    if (!$tokenInfo || empty($tokenInfo['token'])) {
        Log::error('Failed to generate Agora token for participant', [
            'channel' => $channel,
            'account' => $account,
            'role'    => $roleName,
        ]);
        return response()->json(['success' => false, 'message' => 'Failed to generate Agora token for participant. Check Agora credentials.'], 500);
    }

    // 2. Register user on Agora Chat + generate Chat USER token
    $chatCredentials = $agora->generateChatCredentials(
        (int) $session->id,
        (int) $user->id,
        $isTeacher ? 'teacher' : 'student'
    );

    if ($chatCredentials && $user->agora_chat_uid !== $chatCredentials['agora_uid']) {
        User::where('id', $user->id)->update(['agora_chat_uid' => $chatCredentials['agora_uid']]);
    }

    // 3. Get or create the chat room — returns the SAME room ID the teacher already created
    $chatRoomId = $agora->getOrCreateChatRoomForSession($session);

    return response()->json([
        'success' => true,
        'message' => 'You can now join the session',
        'data'    => [
            'agora' => [
                'channel'        => $tokenInfo['channel'],
                'token'          => $tokenInfo['token'],
                'uid'            => $tokenInfo['uid'],
                'role'           => $roleName,
                'expires_in'     => $tokenInfo['expires_in'],
                'chat_channel'   => $tokenInfo['channel'],
                'app_id'         => $chatCredentials['app_id'] ?? config('services.agora.app_id'),
                'chat_token'     => $chatCredentials['token'] ?? null,
                'chat_uid'       => $chatCredentials['uid'] ?? null,
                'chat_expires_in'=> $chatCredentials['expires_in'] ?? null,
                'chat_agora_uid' => $chatCredentials['agora_uid'] ?? null,
                'chat_room_id'   => $chatRoomId,
            ],
        ],
        'errors' => null,
        'meta'   => null,
    ]);
}

    public function end(Request $request, $sessionId): JsonResponse
    {
        $user = $request->user();

        if ($user->role_id != 3) { // teacher
            return response()->json(['success' => false, 'message' => 'Only teachers can end sessions'], 403);
        }

        $session = Sessions::where('id', $sessionId)->where('teacher_id', $user->id)->first();

        if (!$session) {
            return response()->json(['success' => false, 'message' => 'Session not found or you are not the teacher'], 404);
        }

        // mark session as ended (this sets status -> completed and ended_at)
        $ended = $session->end();
        Log::info(' $ended', [' $ended' => $ended]);
        if ($ended) {
            try {
                $walletService = new TeacherWalletService();
                $walletService2 = $walletService->creditTeacherForSession($session);
                Log::info('$walletService', ['$walletService' => $walletService]);
                Log::info('$walletService2', ['$walletService2' => $walletService2]);
            } catch (\Exception $e) {
                Log::error('Failed to credit teacher wallet after session completion', [
                    'session_id' => $session->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Session ended',
            'data' => [
                'session_status' => 'completed'
            ],
            'errors' => null,
            'meta' => null
        ]);
    }

    /**
     * Automatically update overdue sessions to 'ended' status.
     * A session is considered overdue if the session_date is before today.
     * This logic gives flexibility for teachers to start/end sessions on the same day.
     */
    private function autoUpdateOverdueSessions($user): void
    {
        try {
            $today = \Carbon\Carbon::today()->format('Y-m-d');

            $query = Sessions::whereIn('status', [Sessions::STATUS_SCHEDULED, Sessions::STATUS_LIVE])
                ->where('session_date', '<', $today);

            // Filter by user to optimize, though global update is also fine
            if ($user->role_id == 3) { // Teacher
                $query->where('teacher_id', $user->id);
            } elseif ($user->role_id == 4) { // Student
                $query->where('student_id', $user->id);
            }

            $affected = $query->update(['status' => Sessions::STATUS_ENDED]);

            if ($affected > 0) {
                Log::info("Auto-updated {$affected} overdue sessions to 'ended' for user {$user->id}");
            }
        } catch (\Exception $e) {
            Log::error("Failed to auto-update overdue sessions: " . $e->getMessage());
        }
    }
}
