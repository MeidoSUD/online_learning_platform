<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\GroupClass;
use App\Models\GroupClassBookingLesson;
use App\Models\GroupClassLesson;
use App\Models\GroupClassSession;
use App\Models\GroupClassSessionStudent;
use App\Models\Sessions;
use App\Models\Subscription;
use App\Models\User;
use App\Services\AgoraService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GroupClassBookingController extends Controller
{
    public function createBooking(Request $request): JsonResponse
    {
        $request->validate([
            'group_class_id' => 'required|integer|exists:group_classes,id',
            'teacher_id' => 'required|integer|exists:users,id',
            'lesson_ids' => 'required|array|min:1',
            'lesson_ids.*' => 'integer|exists:group_class_lessons,id',
            'subscription_id' => 'nullable|integer|exists:subscriptions,id',
            'points_per_lesson' => 'nullable|integer|min:1',
            'special_requests' => 'nullable|string|max:500',
        ]);

        $studentId = auth()->id();

        $groupClass = GroupClass::with(['teacher.teacherInfo'])->findOrFail($request->group_class_id);

        if ((int) $groupClass->teacher_id !== (int) $request->teacher_id) {
            return response()->json([
                'success' => false,
                'message' => 'Teacher does not match group class',
                'message_ar' => 'المعلم لا يتطابق مع الحصة الجماعية',
            ], 422);
        }

        $uniqueLessonIds = array_values(array_unique($request->lesson_ids));
        $lessons = GroupClassLesson::where('group_class_id', $groupClass->id)
            ->whereIn('id', $uniqueLessonIds)
            ->orderBy('lesson_date')
            ->orderBy('start_time')
            ->get();

        if ($lessons->count() !== count($uniqueLessonIds)) {
            return response()->json([
                'success' => false,
                'message' => 'Some selected lessons do not belong to this group class',
                'message_ar' => 'بعض الحصص المحددة لا تنتمي إلى هذه الحصة الجماعية',
            ], 422);
        }

        $alreadyBooked = GroupClassBookingLesson::whereHas('booking', function ($q) use ($studentId) {
                $q->where('student_id', $studentId)
                    ->whereIn('status', [Booking::STATUS_CONFIRMED, Booking::STATUS_IN_PROGRESS]);
            })
            ->whereIn('group_class_lesson_id', $uniqueLessonIds)
            ->exists();

        if ($alreadyBooked) {
            return response()->json([
                'success' => false,
                'message' => 'You have already booked one or more of these lessons',
                'message_ar' => 'لقد قمت بحجز واحدة أو أكثر من هذه الحصص مسبقاً',
            ], 422);
        }

        $sessionsCount = $lessons->count();
        $teacherInfo = $groupClass->teacher?->teacherInfo;
        $pointsPerLesson = (int) ($request->input('points_per_lesson') ?? ($teacherInfo->group_hour_price ?? 1));
        if ($pointsPerLesson < 1) {
            $pointsPerLesson = 1;
        }
        $totalPoints = $sessionsCount * $pointsPerLesson;

        $activeSubscriptions = Subscription::where('student_id', $studentId)
            ->where('status', Subscription::STATUS_ACTIVE)
            ->where('sessions_remaining', '>', 0)
            ->orderBy('expiry_date')
            ->orderBy('id')
            ->get();

        $totalAvailablePoints = (int) $activeSubscriptions->sum('sessions_remaining');

        if ($activeSubscriptions->isEmpty() || $totalAvailablePoints <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'No active package or subscription found',
                'message_ar' => 'لا يوجد اشتراك نشط أو باقة نقاط مفعلة لديك',
                'available_points' => 0,
                'required_points' => $totalPoints,
            ], 404);
        }

        if ($totalAvailablePoints < $totalPoints) {
            return response()->json([
                'success' => false,
                'message' => 'Not enough points in subscription',
                'message_ar' => "رصيد النقاط غير كافٍ. المتوفر لديك {$totalAvailablePoints} نقطة، والمطلوب {$totalPoints} نقطة.",
                'available_points' => $totalAvailablePoints,
                'required_points' => $totalPoints,
            ], 422);
        }

        if ($request->filled('subscription_id')) {
            $preferred = $activeSubscriptions->firstWhere('id', (int) $request->subscription_id);
            if ($preferred) {
                $activeSubscriptions = $activeSubscriptions->reject(fn($s) => $s->id == $preferred->id)->prepend($preferred);
            }
        } elseif ($activeSubscriptions->contains(fn($s) => $s->sessions_remaining >= $totalPoints)) {
            $sufficient = $activeSubscriptions->first(fn($s) => $s->sessions_remaining >= $totalPoints);
            $activeSubscriptions = $activeSubscriptions->reject(fn($s) => $s->id == $sufficient->id)->prepend($sufficient);
        }

        $primarySubscription = $activeSubscriptions->first();

        DB::beginTransaction();
        try {
            do {
                $bookingReference = 'BK-GC-' . strtoupper(Str::random(8));
            } while (Booking::where('booking_reference', $bookingReference)->exists());

            $firstLesson = $lessons->first();
            $firstDate = $firstLesson->lesson_date ? Carbon::parse($firstLesson->lesson_date) : now();
            $firstStart = $firstLesson->start_time;
            $firstEnd = $firstLesson->end_time;
            $duration = $firstLesson->duration ?? 60;

            $teacherRatePerSession = $primarySubscription && $primarySubscription->total_sessions > 0
                ? round((float) $primarySubscription->total_paid / $primarySubscription->total_sessions, 2)
                : 0;

            $booking = Booking::create([
                'booking_reference' => $bookingReference,
                'booking_type' => Booking::BOOKING_TYPE_GROUP,
                'group_class_id' => $groupClass->id,
                'student_id' => $studentId,
                'teacher_id' => $groupClass->teacher_id,
                'subject_id' => $groupClass->subject_id,
                'subscription_id' => $primarySubscription?->id,
                'session_type' => $sessionsCount > 1 ? Booking::TYPE_PACKAGE : Booking::TYPE_SINGLE,
                'sessions_count' => $sessionsCount,
                'sessions_completed' => 0,
                'first_session_date' => $firstDate,
                'first_session_start_time' => $firstStart,
                'first_session_end_time' => $firstEnd,
                'session_duration' => $duration,
                'teacher_rate_per_session' => $teacherRatePerSession,
                'platform_percentage' => 0,
                'price_per_session' => 0,
                'subtotal' => 0,
                'discount_percentage' => 0,
                'discount_amount' => 0,
                'total_amount' => 0,
                'currency' => 'SAR',
                'special_requests' => $request->special_requests,
                'status' => Booking::STATUS_CONFIRMED,
                'booking_date' => now(),
            ]);

            foreach ($lessons as $lesson) {
                GroupClassBookingLesson::create([
                    'booking_id' => $booking->id,
                    'group_class_lesson_id' => $lesson->id,
                ]);
            }

            $pointsToDeduct = $totalPoints;
            foreach ($activeSubscriptions as $sub) {
                if ($pointsToDeduct <= 0) {
                    break;
                }
                $deduct = min($sub->sessions_remaining, $pointsToDeduct);
                $sub->decrement('sessions_remaining', $deduct);
                $sub->increment('sessions_used', $deduct);
                $pointsToDeduct -= $deduct;

                if ($sub->fresh()->sessions_remaining <= 0) {
                    $sub->update([
                        'status' => Subscription::STATUS_COMPLETED,
                        'completed_at' => now(),
                    ]);
                }
            }

            foreach ($lessons as $index => $lesson) {
                Sessions::create([
                    'booking_id' => $booking->id,
                    'student_id' => $studentId,
                    'teacher_id' => $groupClass->teacher_id,
                    'session_title' => $lesson->title ?: ($groupClass->title . ' - ' . ($lesson->topic ?: ('حصة ' . ($index + 1)))),
                    'session_number' => $index + 1,
                    'session_date' => $lesson->lesson_date,
                    'start_time' => $lesson->start_time,
                    'end_time' => $lesson->end_time,
                    'duration' => $lesson->duration ?: 60,
                    'status' => Sessions::STATUS_SCHEDULED,
                ]);
            }

            $booking->refresh();

            try {
                $booking->createMeetingsForSessions();
            } catch (\Throwable $e) {
            }

            \App\Helpers\Helpers::getPendingBalance($booking->teacher_id);

            try {
                $ns = new NotificationService();
                $booking->loadMissing(['student', 'teacher']);
                if ($booking->student) {
                    $ns->send(
                        $booking->student,
                        'booking_confirmed',
                        'تأكيد الحجز',
                        "تم تأكيد حجزك في الحصة الجماعية ({$groupClass->title}) لعدد {$sessionsCount} حصص بنجاح.",
                        [
                            'booking_id' => $booking->id,
                            'booking_type' => 'group_class',
                        ]
                    );
                }
                if ($booking->teacher) {
                    $ns->send(
                        $booking->teacher,
                        'new_booking',
                        'حجز جديد',
                        "لديك حجز جديد في الحصة الجماعية ({$groupClass->title}) من الطالب {$booking->student?->first_name}.",
                        [
                            'booking_id' => $booking->id,
                            'booking_type' => 'group_class',
                        ]
                    );
                }
            } catch (\Throwable $e) {
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Group class booking confirmed successfully',
                'message_ar' => 'تم تأكيد حجز الحصة الجماعية بنجاح بالنقاط',
                'data' => [
                    'booking' => $booking->load(['groupClass', 'groupClassLessons.lesson', 'sessions']),
                    'subscription' => [
                        'id' => $primarySubscription?->id,
                        'sessions_remaining' => (int) Subscription::where('student_id', $studentId)->where('status', Subscription::STATUS_ACTIVE)->sum('sessions_remaining'),
                        'sessions_used' => (int) Subscription::where('student_id', $studentId)->sum('sessions_used'),
                    ],
                    'available_points' => (int) Subscription::where('student_id', $studentId)->where('status', Subscription::STATUS_ACTIVE)->sum('sessions_remaining'),
                ],
            ], 200);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create group class booking: ' . $e->getMessage(),
                'message_ar' => 'فشل إنشاء حجز الحصة الجماعية: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getBookingDetails($bookingId): JsonResponse
    {
        $studentId = auth()->id();
        $booking = Booking::with([
            'teacher',
            'student',
            'groupClass',
            'groupClassLessons.lesson',
            'sessions',
        ])
        ->where('id', $bookingId)
        ->where('student_id', $studentId)
        ->where('booking_type', Booking::BOOKING_TYPE_GROUP)
        ->first();

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found',
                'message_ar' => 'الحجز غير موجود',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $booking,
        ], 200);
    }

    public function studentSessions(Request $request): JsonResponse
    {
        $studentId = auth()->id();
        $status = $request->query('status');

        $query = GroupClassSessionStudent::with([
            'session' => function ($q) {
                $q->withCount('sessionStudents');
            },
            'session.groupClass.educationLevel',
            'session.groupClass.class',
            'session.groupClass.subject',
            'session.lesson',
            'session.teacher.teacherInfo',
            'booking',
        ])
        ->where('student_id', $studentId);

        if ($status && $status !== 'all') {
            if ($status === 'active') {
                $query->whereHas('session', function ($q) {
                    $q->whereIn('status', ['scheduled', 'in_progress', 'live', 'wait_for_teacher']);
                });
            } elseif ($status === 'ended' || $status === 'completed' || $status === 'finished') {
                $query->whereHas('session', function ($q) {
                    $q->whereIn('status', ['ended', 'completed', 'cancelled', 'no_show']);
                });
            } elseif (in_array($status, ['scheduled', 'in_progress', 'live', 'ended', 'completed', 'cancelled', 'no_show', 'wait_for_teacher'])) {
                $query->whereHas('session', function ($q) use ($status) {
                    $q->where('status', $status);
                });
            } else {
                $query->where('status', $status);
            }
        }

        $items = $query->orderByDesc('id')->get();

        return response()->json([
            'success' => true,
            'data' => $items,
        ], 200);
    }

    public function joinSession($id): JsonResponse
    {
        $studentId = auth()->id();
        $sessionStudent = GroupClassSessionStudent::with(['session.teacher', 'session.groupClass'])
            ->where('student_id', $studentId)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('group_class_session_id', $id);
            })
            ->first();

        if (!$sessionStudent || !$sessionStudent->session) {
            return response()->json([
                'success' => false,
                'message' => 'Session not found or you are not enrolled',
                'message_ar' => 'الجلسة غير موجودة أو أنك غير مسجل بها',
            ], 404);
        }

        $session = $sessionStudent->session;
        if ($session->status !== GroupClassSession::STATUS_LIVE) {
            return response()->json([
                'success' => false,
                'message' => 'Waiting for teacher to start the session',
                'message_ar' => 'بانتظار المعلم لبدء الجلسة',
                'data' => ['session_status' => 'waiting_for_teacher'],
            ], 423);
        }

        $channel = $session->meeting_id ?: ('group_session_' . $session->id);
        $account = 'student_' . $studentId;
        $agora = new AgoraService();

        $tokenData = null;
        try {
            $tokenData = $agora->generateTokenForAccount(
                $channel,
                $account,
                \App\Agora\RtcTokenBuilder::RolePublisher
            );
        } catch (\Throwable $e) {
        }

        if (!$tokenData || empty($tokenData['token'])) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate token',
                'message_ar' => 'فشل إنشاء رمز الاتصال بالجلسة',
            ], 500);
        }

        $chatCredentials = $agora->generateChatCredentials(
            (int) $session->id,
            (int) $studentId,
            'student',
            null,
            $channel
        );

        $user = auth()->user();
        if ($chatCredentials && $user && $user->agora_chat_uid !== $chatCredentials['agora_uid']) {
            User::where('id', $user->id)->update(['agora_chat_uid' => $chatCredentials['agora_uid']]);
        }

        $chatRoomId = $agora->getOrCreateChatRoomForGroupSession($session);

        $sessionStudent->update([
            'status' => GroupClassSessionStudent::STATUS_ATTENDED,
            'joined_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Joined session successfully',
            'message_ar' => 'تم الانضمام للجلسة بنجاح',
            'data' => [
                'session' => $session->load(['groupClass', 'lesson', 'teacher.teacherInfo']),
                'session_status' => 'live',
                'agora' => [
                    'channel' => $tokenData['channel'] ?? $channel,
                    'token' => $tokenData['token'] ?? '',
                    'uid' => (string) ($tokenData['uid'] ?? '0'),
                    'role' => 'participant',
                    'expires_in' => $tokenData['expires_in'] ?? 3600,
                    'chat_channel' => $tokenData['channel'] ?? $channel,
                    'app_id' => $chatCredentials['app_id'] ?? config('services.agora.app_id'),
                    'chat_token' => $chatCredentials['token'] ?? null,
                    'chat_uid' => $chatCredentials['uid'] ?? null,
                    'chat_expires_in' => $chatCredentials['expires_in'] ?? null,
                    'chat_agora_uid' => $chatCredentials['agora_uid'] ?? null,
                    'chat_room_id' => $chatRoomId,
                ],
            ],
        ], 200);
    }
}
