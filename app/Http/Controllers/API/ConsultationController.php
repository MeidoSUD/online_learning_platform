<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Consultation;
use App\Models\ConsultationCategory;
use App\Models\Payment;
use App\Models\Services;
use App\Models\Sessions;
use App\Models\TeacherInfo;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ConsultationController extends Controller
{
    /**
     * GET /api/student/consultation/categories
     * List active consultation categories.
     */
    public function categories(): JsonResponse
    {
        $categories = ConsultationCategory::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * POST /api/student/consultations
     * Student creates a consultation request.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'category_id' => 'required|exists:consultation_categories,id',
            'title' => 'nullable|string|max:255',
            'description' => 'required|string|max:5000',
            'preferred_language_id' => 'nullable|exists:languages,id',
            'education_level_id' => 'nullable|exists:education_levels,id',
            'class_id' => 'nullable|exists:classes,id',
            'preferred_slots' => 'nullable|array|min:1|max:5',
            'preferred_slots.*.date' => 'required|date|after_or_equal:today',
            'preferred_slots.*.start_time' => 'required|date_format:H:i',
            'preferred_slots.*.end_time' => 'required|date_format:H:i|after:preferred_slots.*.start_time',
            'duration_minutes' => 'nullable|integer|min:15|max:240',
            'sessions_count' => 'nullable|integer|min:1|max:10',
            'budget_min' => 'nullable|numeric|min:0',
            'budget_max' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $consultation = Consultation::create([
                'consultation_reference' => 'CONS-' . strtoupper(uniqid()),
                'category_id' => $request->category_id,
                'student_id' => $request->user()->id,
                'title' => $request->title,
                'description' => $request->description,
                'preferred_language_id' => $request->preferred_language_id,
                'education_level_id' => $request->education_level_id,
                'class_id' => $request->class_id,
                'preferred_slots' => $request->preferred_slots,
                'duration_minutes' => $request->duration_minutes ?? 60,
                'sessions_count' => $request->sessions_count ?? 1,
                'budget_min' => $request->budget_min,
                'budget_max' => $request->budget_max,
                'status' => Consultation::STATUS_PENDING,
            ]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create consultation', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create consultation request',
                'error' => $e->getMessage(),
            ], 500);
        }

        $consultation->load(['category', 'preferredLanguage', 'educationLevel', 'class']);

        return response()->json([
            'success' => true,
            'message' => 'Consultation request submitted successfully. Our team will review it shortly.',
            'data' => $consultation,
        ], 201);
    }

    /**
     * GET /api/student/consultations
     * List the logged-in student's consultations.
     */
    public function index(Request $request): JsonResponse
    {
        $consultations = Consultation::with(['category', 'teacher', 'preferredLanguage', 'educationLevel', 'class'])
            ->forStudent($request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $consultations,
        ]);
    }

    /**
     * GET /api/student/consultations/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $consultation = Consultation::with(['category', 'student', 'teacher', 'preferredLanguage', 'educationLevel', 'class', 'booking.sessions'])
            ->forStudent($request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $consultation,
        ]);
    }

    /**
     * POST /api/student/consultations/{id}/cancel
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $consultation = Consultation::forStudent($request->user()->id)
            ->whereIn('status', [Consultation::STATUS_PENDING, Consultation::STATUS_UNDER_REVIEW, Consultation::STATUS_ASSIGNED])
            ->findOrFail($id);

        $consultation->update([
            'status' => Consultation::STATUS_CANCELLED,
            'cancelled_at' => now(),
            'cancellation_reason' => $request->input('reason'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Consultation request cancelled',
            'data' => $consultation,
        ]);
    }

    /**
     * GET /api/teacher/consultations
     * List consultations assigned to the logged-in teacher.
     */
    public function teacherIndex(Request $request): JsonResponse
    {
        $consultations = Consultation::with(['category', 'student', 'preferredLanguage', 'educationLevel', 'class', 'booking.sessions'])
            ->forTeacher($request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $consultations,
        ]);
    }

    /**
     * GET /api/teacher/consultations/{id}
     */
    public function teacherShow(Request $request, int $id): JsonResponse
    {
        $consultation = Consultation::with(['category', 'student', 'preferredLanguage', 'educationLevel', 'class', 'booking.sessions'])
            ->forTeacher($request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $consultation,
        ]);
    }

    /**
     * POST /api/teacher/consultations/{id}/schedule
     *
     * The last step of the flow: the assigned teacher picks an online-session time.
     * This creates a Booking + Sessions and an Agora live meeting so the teacher
     * and student can communicate through the existing online-session system.
     */
    public function schedule(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'scheduled_date' => 'required|date|after_or_equal:today',
            'scheduled_start_time' => 'required|date_format:H:i',
            'scheduled_end_time' => 'required|date_format:H:i|after:scheduled_start_time',
            'admin_notes' => 'nullable|string|max:2000',
        ]);

        $consultation = Consultation::with(['student', 'category'])
            ->forTeacher($request->user()->id)
            ->whereIn('status', [Consultation::STATUS_ASSIGNED, Consultation::STATUS_SCHEDULED])
            ->findOrFail($id);

        try {
            DB::beginTransaction();

            $service = Services::firstOrCreate(
                ['key_name' => 'consultation'],
                [
                    'role_id' => 4,
                    'name_en' => 'Consultation',
                    'name_ar' => 'الاستشارات',
                    'status' => 1,
                ]
            );

            $teacherInfo = TeacherInfo::where('teacher_id', $consultation->teacher_id)->first();
            $hourlyRate = $teacherInfo?->individual_hour_price ?? 0;
            $duration = $consultation->duration_minutes ?? 60;
            $price = round(($hourlyRate * $duration) / 60, 2);
            $sessionsCount = $consultation->sessions_count ?? 1;
            $total = round($price * $sessionsCount, 2);

            // Reuse the existing booking record so the whole sessions/payment/wallet
            // pipeline stays consistent with regular private-lesson bookings.
            $booking = Booking::create([
                'booking_reference' => 'CONS-' . strtoupper(uniqid()),
                'student_id' => $consultation->student_id,
                'teacher_id' => $consultation->teacher_id,
                'service_id' => $service->id,
                'course_id' => null,
                'availability_slot_id' => null,
                'session_type' => Booking::TYPE_SINGLE,
                'sessions_count' => $sessionsCount,
                'sessions_completed' => 0,
                'first_session_date' => $request->scheduled_date,
                'first_session_start_time' => $request->scheduled_start_time,
                'first_session_end_time' => $request->scheduled_end_time,
                'session_duration' => $duration,
                'teacher_rate_per_session' => $hourlyRate,
                'platform_percentage' => 0,
                'price_per_session' => $price,
                'subtotal' => $total,
                'discount_percentage' => 0,
                'discount_amount' => 0,
                'total_amount' => $total,
                'currency' => 'SAR',
                'special_requests' => $consultation->description,
                'status' => Booking::STATUS_CONFIRMED,
                'booking_date' => now(),
            ]);

            // Traceable payment record so financials stay consistent.
            Payment::create([
                'booking_id' => $booking->id,
                'student_id' => $consultation->student_id,
                'teacher_id' => $consultation->teacher_id,
                'amount' => $total,
                'currency' => 'SAR',
                'payment_method' => 'consultation',
                'transaction_reference' => $booking->booking_reference,
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            // Create the online session(s) and generate the Agora meeting links.
            Sessions::createForBooking($booking);
            $booking->refresh();
            $booking->createMeetingsForSessions();

            $consultation->update([
                'booking_id' => $booking->id,
                'service_id' => $service->id,
                'price_per_session' => $price,
                'status' => Consultation::STATUS_SCHEDULED,
                'scheduled_date' => $request->scheduled_date,
                'scheduled_start_time' => $request->scheduled_start_time,
                'scheduled_end_time' => $request->scheduled_end_time,
            ]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to schedule consultation session', [
                'consultation_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to schedule consultation session',
                'error' => $e->getMessage(),
            ], 500);
        }

        // Notify both parties the online session is ready.
        try {
            $notificationService = app(NotificationService::class);
            $notificationService->send(
                $consultation->student,
                'consultation',
                'Consultation session scheduled',
                "Your consultation session is scheduled for {$request->scheduled_date} at {$request->scheduled_start_time}. You can join the online session from your sessions list.",
                ['consultation_id' => $consultation->id, 'booking_id' => $booking->id]
            );
            $notificationService->send(
                $consultation->teacher,
                'consultation',
                'Consultation session scheduled',
                "The consultation session for {$consultation->student->first_name} is scheduled for {$request->scheduled_date} at {$request->scheduled_start_time}.",
                ['consultation_id' => $consultation->id, 'booking_id' => $booking->id]
            );
        } catch (\Throwable $e) {
            Log::warning('Failed to send consultation schedule notifications', ['error' => $e->getMessage()]);
        }

        $consultation->load(['booking.sessions', 'category', 'student', 'teacher', 'preferredLanguage', 'educationLevel', 'class']);

        return response()->json([
            'success' => true,
            'message' => 'Consultation session scheduled. Online session created successfully.',
            'data' => $consultation,
        ]);
    }
}