<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sessions;
use App\Models\Booking;
use App\Models\User;
use App\Models\Subject;
use App\Models\Services;
use App\Models\Languages;
use App\Models\Abilities;
use App\Traits\ExportsTabularData;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

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
     * Get Single Session Details
     */
    public function show(Request $request, $id)
    {
        $session = Sessions::with([
            'teacher',
            'student',
            'booking.subject',
            'booking.language',
            'booking.ability',
            'booking.service',
            'booking.course',
            'booking.student',
            'booking.teacher'
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $session->id,
                'booking_id' => $session->booking_id,
                'session_title' => $session->session_title,
                'session_number' => $session->session_number,
                'session_date' => $session->session_date ? $session->session_date->format('Y-m-d') : null,
                'start_time' => $session->start_time ? $session->start_time->format('H:i:s') : null,
                'end_time' => $session->end_time ? $session->end_time->format('H:i:s') : null,
                'duration' => $session->duration,
                'status' => $session->status,
                'meeting_id' => $session->meeting_id,
                'join_url' => $session->join_url,
                'host_url' => $session->host_url,
                'teacher_notes' => $session->teacher_notes,
                'homework' => $session->homework,
                'teacher' => $session->teacher ? [
                    'id' => $session->teacher->id,
                    'name' => trim($session->teacher->first_name . ' ' . $session->teacher->last_name),
                    'email' => $session->teacher->email,
                    'phone_number' => $session->teacher->phone_number ?? null,
                ] : null,
                'student' => $session->student ? [
                    'id' => $session->student->id,
                    'name' => trim($session->student->first_name . ' ' . $session->student->last_name),
                    'email' => $session->student->email,
                    'phone_number' => $session->student->phone_number ?? null,
                ] : null,
                'booking' => $session->booking ? [
                    'id' => $session->booking->id,
                    'reference' => $session->booking->booking_reference,
                    'status' => $session->booking->status,
                    'total_amount' => $session->booking->total_amount,
                    'currency' => $session->booking->currency ?? 'SAR',
                    'session_type' => $session->booking->session_type ?? null,
                    'sessions_count' => $session->booking->sessions_count,
                    'sessions_completed' => $session->booking->sessions_completed,
                    'created_at' => $session->booking->created_at ? $session->booking->created_at->toIso8601String() : null,
                ] : null,
                'subject' => ($session->booking && $session->booking->subject) ? [
                    'id' => $session->booking->subject->id ?? null,
                    'name_en' => $session->booking->subject->name_en,
                    'name_ar' => $session->booking->subject->name_ar,
                ] : null,
                'language' => ($session->booking && $session->booking->language) ? [
                    'id' => $session->booking->language->id ?? null,
                    'name_en' => $session->booking->language->name_en,
                    'name_ar' => $session->booking->language->name_ar,
                ] : null,
                'ability' => ($session->booking && $session->booking->ability) ? [
                    'id' => $session->booking->ability->id ?? null,
                    'name_en' => $session->booking->ability->name_en,
                    'name_ar' => $session->booking->ability->name_ar,
                ] : null,
                'service' => ($session->booking && $session->booking->service) ? [
                    'id' => $session->booking->service->id ?? null,
                    'name_en' => $session->booking->service->name_en,
                    'name_ar' => $session->booking->service->name_ar,
                    'key_name' => $session->booking->service->key_name ?? null,
                ] : null,
                'course' => ($session->booking && $session->booking->course) ? [
                    'id' => $session->booking->course->id ?? null,
                    'title_en' => $session->booking->course->title_en ?? null,
                    'title_ar' => $session->booking->course->title_ar ?? null,
                ] : null,
            ]
        ]);
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

    /**
     * Get offerings (services, subjects, languages, abilities) for a specific teacher.
     * Useful for Admin UI cascading dropdowns when creating manual sessions.
     */
    public function teacherOfferings(Request $request, $teacherId)
    {
        $teacher = User::with([
            'teacherServices.service',
            'subjects.service',
            'subjects.educationLevel',
            'subjects.class',
            'teacherLanguages.language',
            'teacherAbilities.ability',
            'teacherInfo',
        ])->findOrFail($teacherId);

        $services = $teacher->teacherServices->map(function ($ts) {
            return [
                'id' => $ts->service?->id,
                'key_name' => $ts->service?->key_name,
                'name_en' => $ts->service?->name_en,
                'name_ar' => $ts->service?->name_ar,
            ];
        })->filter(fn($s) => !empty($s['id']))->unique('id')->values();

        $subjects = $teacher->subjects->map(function ($subj) {
            return [
                'id' => $subj->id,
                'name_en' => $subj->name_en,
                'name_ar' => $subj->name_ar,
                'service_id' => $subj->service_id,
                'class_id' => $subj->class_id,
                'class_name' => $subj->class?->name_en ?? $subj->class?->name_ar,
                'education_level_id' => $subj->education_level_id,
                'education_level_name' => $subj->educationLevel?->name_en ?? $subj->educationLevel?->name_ar,
            ];
        })->values();

        $languages = $teacher->teacherLanguages->map(function ($tl) {
            return [
                'id' => $tl->language?->id,
                'name_en' => $tl->language?->name_en,
                'name_ar' => $tl->language?->name_ar,
            ];
        })->filter(fn($l) => !empty($l['id']))->values();

        $abilities = $teacher->teacherAbilities->map(function ($ta) {
            return [
                'id' => $ta->ability?->id,
                'name_en' => $ta->ability?->name_en,
                'name_ar' => $ta->ability?->name_ar,
            ];
        })->filter(fn($a) => !empty($a['id']))->values();

        return response()->json([
            'success' => true,
            'data' => [
                'teacher' => [
                    'id' => $teacher->id,
                    'name' => trim($teacher->first_name . ' ' . $teacher->last_name),
                    'email' => $teacher->email,
                    'phone_number' => $teacher->phone_number,
                    'hourly_rate' => $teacher->teacherInfo?->hourly_rate ?? $teacher->teacherInfo?->rate ?? 0,
                ],
                'services' => $services,
                'subjects' => $subjects,
                'languages' => $languages,
                'abilities' => $abilities,
            ]
        ]);
    }

    /**
     * Create a manual session (and underlying booking) from Admin dashboard.
     * Generates Agora meeting credentials automatically.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'teacher_id'   => 'required|integer|exists:users,id',
            'student_id'   => 'required|integer|exists:users,id',
            'session_date' => 'required|date',
            'start_time'   => 'required|string',
            'end_time'     => 'required|string',
            'session_title'=> 'nullable|string|max:255',
            'service_id'   => 'nullable|integer|exists:services,id',
            'subject_id'   => 'nullable|integer|exists:subjects,id',
            'language_id'  => 'nullable|integer|exists:languages,id',
            'ability_id'   => 'nullable|integer|exists:abilities,id',
            'price'        => 'nullable|numeric|min:0',
            'admin_notes'  => 'nullable|string|max:1000',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $sessionDate = Carbon::parse($validated['session_date'])->format('Y-m-d');
            $startTime = Carbon::parse($validated['start_time'])->format('H:i:s');
            $endTime = Carbon::parse($validated['end_time'])->format('H:i:s');

            $startDateTime = Carbon::parse($sessionDate . ' ' . $startTime);
            $endDateTime = Carbon::parse($sessionDate . ' ' . $endTime);

            if ($endDateTime->lessThanOrEqualTo($startDateTime)) {
                return response()->json([
                    'success' => false,
                    'message' => 'end_time must be after start_time',
                ], 422);
            }

            $duration = $endDateTime->diffInMinutes($startDateTime);

            // 1. Resolve Service ID and Subject / Language / Ability models
            $serviceId = $validated['service_id'] ?? null;
            $subject = null;
            $language = null;
            $ability = null;

            if (!empty($validated['subject_id'])) {
                $subject = Subject::find($validated['subject_id']);
                if (!$serviceId && $subject) {
                    $serviceId = $subject->service_id 
                        ?: Services::where('key_name', 'like', '%private%')->value('id');
                }
            } elseif (!empty($validated['language_id'])) {
                $language = Languages::find($validated['language_id']);
                if (!$serviceId) {
                    $serviceId = Services::where('key_name', 'language_study')
                        ->orWhere('key_name', 'language_learning')
                        ->orWhere('key_name', 'like', '%lang%')
                        ->value('id');
                }
            } elseif (!empty($validated['ability_id'])) {
                $ability = Abilities::find($validated['ability_id']);
                if (!$serviceId) {
                    $serviceId = Services::where('key_name', 'like', '%abilit%')->value('id');
                }
            }

            // Fallback for service_id if still null
            if (!$serviceId) {
                $serviceObj = Services::where('key_name', 'like', '%private%')->first()
                    ?: Services::first();
                $serviceId = $serviceObj?->id;
            }

            // 2. Resolve Session Title
            $title = $validated['session_title'] ?? null;
            if (empty($title)) {
                if ($subject) {
                    $title = $subject->name_en ?? $subject->name_ar;
                } elseif ($language) {
                    $title = 'Language Study - ' . ($language->name_en ?? $language->name_ar);
                } elseif ($ability) {
                    $title = 'Abilities - ' . ($ability->name_en ?? $ability->name_ar);
                } else {
                    $serviceObj = Services::find($serviceId);
                    $title = $serviceObj?->name_en ?? $serviceObj?->name_ar ?? 'Direct Session';
                }
            }

            $price = isset($validated['price']) ? (float)$validated['price'] : 0.00;

            // 3. Create the underlying Booking record (maintains database integrity & mobile app compatibility)
            $booking = Booking::create([
                'booking_reference'       => 'MAN-' . strtoupper(Str::random(8)),
                'student_id'              => $validated['student_id'],
                'teacher_id'              => $validated['teacher_id'],
                'service_id'              => $serviceId,
                'subject_id'              => $validated['subject_id'] ?? null,
                'language_id'             => $validated['language_id'] ?? null,
                'ability_id'              => $validated['ability_id'] ?? null,
                'session_type'            => Booking::TYPE_SINGLE,
                'sessions_count'          => 1,
                'sessions_completed'      => 0,
                'first_session_date'      => $sessionDate,
                'first_session_start_time'=> $startTime,
                'first_session_end_time'  => $endTime,
                'session_duration'        => $duration,
                'price_per_session'       => $price,
                'total_amount'            => $price,
                'subtotal'                => $price,
                'currency'                => 'SAR',
                'status'                  => Booking::STATUS_CONFIRMED,
                'special_requests'        => $validated['admin_notes'] ?? 'Created manually by Admin (Phone Order)',
                'booking_date'            => now(),
            ]);

            // 4. Create the Session record
            $session = Sessions::create([
                'booking_id'     => $booking->id,
                'student_id'     => $validated['student_id'],
                'teacher_id'     => $validated['teacher_id'],
                'session_title'  => $title,
                'session_number' => 1,
                'session_date'   => $sessionDate,
                'start_time'     => $startTime,
                'end_time'       => $endTime,
                'duration'       => $duration,
                'status'         => Sessions::STATUS_SCHEDULED,
            ]);

            // 5. Initialize Agora meeting details (meeting_id = session_{id}, host_url, join_url)
            $session->createMeeting();
            $session->refresh();

            Log::info('Admin created manual session', [
                'session_id'        => $session->id,
                'booking_id'        => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'teacher_id'        => $session->teacher_id,
                'student_id'        => $session->student_id,
                'meeting_id'        => $session->meeting_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Session created successfully.',
                'data'    => [
                    'session' => [
                        'id'             => $session->id,
                        'session_number' => $session->session_number,
                        'session_title'  => $session->session_title,
                        'session_date'   => $session->session_date ? $session->session_date->format('Y-m-d') : $sessionDate,
                        'start_time'     => $session->start_time ? $session->start_time->format('H:i:s') : $startTime,
                        'end_time'       => $session->end_time ? $session->end_time->format('H:i:s') : $endTime,
                        'duration'       => $session->duration,
                        'status'         => $session->status,
                        'meeting_id'     => $session->meeting_id,
                        'join_url'       => $session->join_url,
                        'host_url'       => $session->host_url,
                    ],
                    'booking' => [
                        'id'             => $booking->id,
                        'reference'      => $booking->booking_reference,
                        'status'         => $booking->status,
                        'total_amount'   => $booking->total_amount,
                        'currency'       => $booking->currency,
                        'service_id'     => $booking->service_id,
                        'subject_id'     => $booking->subject_id,
                        'language_id'    => $booking->language_id,
                        'ability_id'     => $booking->ability_id,
                    ],
                    'teacher' => [
                        'id'   => $session->teacher_id,
                        'name' => trim($session->teacher?->first_name . ' ' . $session->teacher?->last_name),
                    ],
                    'student' => [
                        'id'   => $session->student_id,
                        'name' => trim($session->student?->first_name . ' ' . $session->student?->last_name),
                    ],
                ]
            ], 201);
        });
    }
}
