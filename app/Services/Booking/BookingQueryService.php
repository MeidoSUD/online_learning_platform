<?php

namespace App\Services\Booking;

use App\Models\Booking;
use App\Models\Course;
use App\Models\Sessions;
use App\Models\Subject;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

class BookingQueryService
{
    protected BookingService $bookingService;

    public function __construct(BookingService $bookingService)
    {
        $this->bookingService = $bookingService;
    }

    /**
     * Get student bookings with filters and pagination.
     */
    public function getStudentBookings(Request $request, int $studentId): array
    {
        $status = $request->get('status', 'all');
        $perPage = $request->get('per_page', 10);

        $query = Booking::with([
            'subject',
            'course',
            'course.service',
            'teacher.profile'
        ])->where('student_id', $studentId);

        switch ($status) {
            case 'upcoming':
                $query->whereIn('status', ['confirmed', 'pending_payment'])
                    ->where('first_session_date', '>=', now()->format('Y-m-d'));
                break;
            case 'completed':
                $query->where('status', 'completed');
                break;
            case 'cancelled':
                $query->where('status', 'cancelled');
                break;
            case 'active':
                $query->whereIn('status', ['confirmed', 'in_progress']);
                break;
        }

        $bookings = $query->orderByDesc('created_at')->paginate($perPage);

        $transformedBookings = $bookings->through(function ($booking) {
            $teacherData = (new \App\Http\Controllers\API\UserController())->getFullTeacherData($booking->teacher);

            $courseData = null;
            $subjectData = null;

            if ($booking->course) {
                $courseData = Course::find($booking->course_id);
                if ($booking->course->subject) {
                    $subjectData = $booking->course->subject;
                }
            } elseif ($booking->subject_id) {
                $subjectData = Subject::find($booking->subject_id);
            }

            return [
                'id' => $booking->id,
                'reference' => $booking->booking_reference,
                'teacher' => $teacherData,
                'course' => $courseData,
                'subject' => $subjectData,
                'session_info' => [
                    'type' => $booking->session_type,
                    'total_sessions' => $booking->sessions_count,
                    'completed_sessions' => $booking->sessions_completed,
                    'remaining_sessions' => $booking->sessions_count - $booking->sessions_completed,
                    'duration' => $booking->session_duration . ' minutes',
                    'join_url' => ($booking->status === 'confirmed' && Route::has('sessions.join')) ? route('sessions.join', ['booking_id' => $booking->id]) : null,
                    'host_url' => ($booking->status === 'confirmed' && Route::has('sessions.host')) ? route('sessions.host', ['booking_id' => $booking->id]) : null,
                ],
                'schedule' => [
                    'first_session_date' => $booking->first_session_date,
                    'first_session_time' => $booking->first_session_start_time,
                    'next_session_date' => $this->getNextSessionDate($booking),
                ],
                'pricing' => [
                    'total_amount' => $booking->total_amount,
                    'currency' => $booking->currency,
                    'discount_applied' => $booking->discount_percentage > 0,
                ],
                'status' => $booking->status,
                'booking_date' => $booking->booking_date->format('Y-m-d H:i'),
                'can_cancel' => $this->bookingService->canCancelBooking($booking),
                'can_reschedule' => $this->bookingService->canRescheduleBooking($booking),
            ];
        });

        return [
            'success' => true,
            'status_code' => 200,
            'data' => $transformedBookings,
            'pagination' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
        ];
    }

    /**
     * Get booking details by ID for student.
     */
    public function getBookingDetails(int $bookingId, int $studentId): array
    {
        $booking = Booking::with([
            'course.subject',
            'course.service',
            'course.educationLevel',
            'course.classLevel',
            'teacher.profile',
            'payment',
            'sessions' => function ($query) {
                $query->orderBy('session_date')->orderBy('start_time');
            }
        ])->where('student_id', $studentId)
            ->find($bookingId);

        if (!$booking) {
            return [
                'success' => false,
                'status_code' => 404,
                'message' => 'Booking not found',
            ];
        }

        $courseData = null;
        if ($booking->course) {
            $courseData = [
                'id' => $booking->course->id,
                'name' => $booking->course->name ?? null,
                'education_level' => $booking->course->educationLevel->name_en ?? null,
                'class_level' => $booking->course->classLevel->name_en ?? null,
                'description' => $booking->course->description ?? null,
            ];
        }

        $bookingDetails = [
            'id' => $booking->id,
            'reference' => $booking->booking_reference,
            'status' => $booking->status,
            'booking_date' => $booking->booking_date->format('Y-m-d H:i'),

            'teacher' => [
                'id' => $booking->teacher->id,
                'name' => $booking->teacher->first_name . ' ' . $booking->teacher->last_name,
                'avatar' => $booking->teacher->getProfilePhotoPathAttribute ?? null,
                'gender' => $booking->teacher->profile->gender ?? null,
                'nationality' => $booking->teacher->profile->nationality ?? null,
                'phone' => $booking->status === 'confirmed' ? $booking->teacher->phone : null,
                'email' => $booking->status === 'confirmed' ? $booking->teacher->email : null,
            ],

            'course' => $courseData,

            'session_info' => [
                'type' => $booking->session_type,
                'total_sessions' => $booking->sessions_count,
                'completed_sessions' => $booking->sessions_completed,
                'remaining_sessions' => $booking->sessions_count - $booking->sessions_completed,
                'session_duration' => $booking->session_duration,
                'first_session_date' => $booking->first_session_date,
                'first_session_start_time' => $booking->first_session_start_time,
                'first_session_end_time' => $booking->first_session_end_time,
            ],

            'pricing' => [
                'price_per_session' => $booking->price_per_session,
                'subtotal' => $booking->subtotal,
                'discount_percentage' => $booking->discount_percentage,
                'discount_amount' => $booking->discount_amount,
                'total_amount' => $booking->total_amount,
                'currency' => $booking->currency,
            ],

            'payment' => $booking->payment ? [
                'id' => $booking->payment->id,
                'status' => $booking->payment->status,
                'method' => $booking->payment->payment_method,
                'transaction_reference' => $booking->payment->transaction_reference,
                'paid_at' => $booking->payment->paid_at?->format('Y-m-d H:i'),
            ] : null,

            'sessions' => $booking->sessions->map(function ($session) {
                return [
                    'id' => $session->id,
                    'session_number' => $session->session_number,
                    'session_date' => $session->session_date,
                    'start_time' => $session->start_time,
                    'end_time' => $session->end_time,
                    'status' => $session->status,
                    'join_url' => $session->join_url,
                    'notes' => $session->teacher_notes,
                    'homework' => $session->homework,
                ];
            }),

            'special_requests' => $booking->special_requests,
            'cancellation_reason' => $booking->cancellation_reason,
            'cancelled_at' => $booking->cancelled_at?->format('Y-m-d H:i'),

            'actions' => [
                'can_cancel' => $this->bookingService->canCancelBooking($booking),
                'can_reschedule' => $this->bookingService->canRescheduleBooking($booking),
                'can_review' => $this->bookingService->canReviewBooking($booking),
                'can_join_session' => $this->bookingService->canJoinSession($booking),
            ]
        ];

        return [
            'success' => true,
            'status_code' => 200,
            'data' => $bookingDetails,
        ];
    }

    /**
     * Get student sessions with a specific teacher.
     */
    public function mySessions(Request $request, int $studentId, int $teacherId): array
    {
        $perPage = $request->get('per_page', 10);
        $sessions = Sessions::with(['teacher:id,first_name,last_name,email', 'student:id,first_name,last_name,email', 'booking'])
            ->where('student_id', $studentId)
            ->where('teacher_id', $teacherId)
            ->orderByDesc('session_date')
            ->orderByDesc('start_time')
            ->paginate($perPage);

        $transformed = $sessions->through(function ($session) {
            $subjectData = null;
            if ($session->booking) {
                if ($session->booking->course) {
                    $subjectData = ['id' => $session->booking->course->id, 'name' => $session->booking->course->name, 'course_id' => $session->booking->course->id];
                } elseif (isset($session->booking->subject_id)) {
                    $subject = Subject::find($session->booking->subject_id);
                    if ($subject) $subjectData = ['id' => $subject->id, 'name_en' => $subject->name_en, 'name_ar' => $subject->name_ar];
                }
            }
            $rd = $session->session_date;
            try {
                if ($rd instanceof Carbon) {
                    $sf = $rd->format('Y-m-d');
                    $dn = $rd->dayOfWeek;
                    $dname = $rd->format('l');
                } else {
                    $dt = Carbon::parse((string)$rd);
                    $sf = $dt->format('Y-m-d');
                    $dn = $dt->dayOfWeek;
                    $dname = $dt->format('l');
                }
            } catch (\Exception $e) {
                $sf = substr((string)$rd, 0, 10);
                try {
                    $dt = Carbon::parse($sf);
                    $dn = $dt->dayOfWeek;
                    $dname = $dt->format('l');
                } catch (\Exception $ex) {
                    $dn = null;
                    $dname = null;
                }
            }
            return [
                'id' => $session->id,
                'booking_id' => $session->booking_id,
                'chat_room_id' => $session->chat_room_id,
                'session_number' => $session->session_number,
                'session_title' => $session->session_title,
                'session_date' => $sf,
                'day_name' => $dname,
                'day_number' => $dn,
                'start_time' => $session->start_time instanceof Carbon ? $session->start_time->format('H:i:s') : $session->start_time,
                'end_time' => $session->end_time instanceof Carbon ? $session->end_time->format('H:i:s') : $session->end_time,
                'duration' => $session->duration,
                'status' => $session->status,
                'teacher' => ['id' => $session->teacher->id, 'name' => $session->teacher->first_name . ' ' . $session->teacher->last_name, 'email' => $session->teacher->email],
                'student' => ['id' => $session->student->id, 'name' => $session->student->first_name . ' ' . $session->student->last_name, 'email' => $session->student->email],
                'meeting' => ['meeting_id' => $session->meeting_id, 'join_url' => $session->join_url, 'host_url' => $session->host_url],
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
                'ratings' => ['student_rating' => $session->student_rating, 'teacher_rating' => $session->teacher_rating],
            ];
        });

        return [
            'success' => true,
            'status_code' => 200,
            'data' => $transformed,
            'pagination' => [
                'current_page' => $sessions->currentPage(),
                'last_page' => $sessions->lastPage(),
                'per_page' => $sessions->perPage(),
                'total' => $sessions->total(),
            ],
        ];
    }

    /**
     * Get students who booked with this teacher (Teacher role).
     */
    public function getTeacherStudents(int $teacherId): array
    {
        $studentIds = Booking::where('teacher_id', $teacherId)
            ->where('status', '!=', 'cancelled')
            ->distinct()
            ->pluck('student_id');

        $students = User::whereIn('id', $studentIds)->get();

        $studentsData = $students->map(function ($student) use ($teacherId) {
            $bookingsCount = Booking::where('teacher_id', $teacherId)
                ->where('student_id', $student->id)
                ->where('status', '!=', 'cancelled')
                ->count();

            $profilePhoto = $student->attachments()
                ->where('attached_to_type', 'profile_picture')
                ->latest()
                ->value('file_path');

            return [
                'id' => $student->id,
                'name' => $student->first_name . ' ' . $student->last_name,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'email' => $student->email,
                'phone_number' => $student->phone_number,
                'image' => $profilePhoto,
                'bookings_count' => $bookingsCount,
            ];
        });

        return [
            'success' => true,
            'status_code' => 200,
            'data' => $studentsData,
        ];
    }

    /**
     * Get teachers who taught this student (Public / Student).
     */
    public function getStudentTeachersPublic(Request $request, int $studentId): array
    {
        $perPage = $request->get('per_page', 10);

        $teacherIds = Sessions::where('student_id', $studentId)
            ->where('status', '!=', 'cancelled')
            ->distinct()
            ->pluck('teacher_id');

        $teachers = User::whereIn('id', $teacherIds)->paginate($perPage);

        $teachersData = collect($teachers->items())->map(function ($teacher) use ($studentId) {
            $bookingsCount = Sessions::where('student_id', $studentId)
                ->where('teacher_id', $teacher->id)
                ->where('status', '!=', 'cancelled')
                ->count();

            $profilePhoto = $teacher->attachments()
                ->where('attached_to_type', 'profile_picture')
                ->latest()
                ->value('file_path');

            return [
                'id' => $teacher->id,
                'name' => $teacher->first_name . ' ' . $teacher->last_name,
                'first_name' => $teacher->first_name,
                'last_name' => $teacher->last_name,
                'email' => $teacher->email,
                'phone_number' => $teacher->phone_number,
                'image' => $profilePhoto,
                'bookings_count' => $bookingsCount,
            ];
        });

        return [
            'success' => true,
            'status_code' => 200,
            'data' => $teachersData,
            'pagination' => [
                'current_page' => $teachers->currentPage(),
                'last_page' => $teachers->lastPage(),
                'per_page' => $teachers->perPage(),
                'total' => $teachers->total(),
            ],
        ];
    }

    private function getNextSessionDate($booking)
    {
        if ($booking->session_type === 'single') {
            return $booking->first_session_date;
        }

        $nextSession = $booking->sessions()
            ->where('status', 'scheduled')
            ->where('session_date', '>=', now()->format('Y-m-d'))
            ->orderBy('session_date')
            ->first();

        return $nextSession ? $nextSession->session_date : null;
    }
}
