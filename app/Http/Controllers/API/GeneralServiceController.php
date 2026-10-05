<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\GeneralService;
use App\Models\TeacherGeneralService;
use App\Models\User;
use App\Services\User\TeacherProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GeneralServiceController extends Controller
{
    protected TeacherProfileService $teacherProfileService;

    public function __construct(TeacherProfileService $teacherProfileService)
    {
        $this->teacherProfileService = $teacherProfileService;
    }

    // =====================================================================
    // Public
    // =====================================================================

    /**
     * GET /api/general-services
     */
    public function index(): JsonResponse
    {
        $services = GeneralService::active()
            ->orderBy('id')
            ->get(['id', 'name_ar', 'name_en', 'description_ar', 'description_en', 'icon', 'status']);

        return response()->json([
            'success' => true,
            'data' => $services,
        ]);
    }

    /**
     * GET /api/general-services/{id}/teachers
     * Teachers offering this general service with their prices.
     */
    public function teachers(int $id, Request $request): JsonResponse
    {
        $service = GeneralService::active()->find($id);
        if (!$service) {
            return response()->json(['success' => false, 'message' => 'General service not found'], 404);
        }

        $perPage = (int) $request->get('per_page', 15);

        $offers = TeacherGeneralService::with('teacher')
            ->where('general_service_id', $id)
            ->where('is_active', true)
            ->whereHas('teacher', function ($q) {
                $q->where('role_id', 3)->where('is_active', true);
            })
            ->orderBy('price')
            ->paginate($perPage);

        $data = $offers->through(function (TeacherGeneralService $offer) {
            $teacher = $offer->teacher;
            $teacherData = $teacher
                ? $this->teacherProfileService->getFullTeacherData($teacher)
                : null;

            return [
                'id' => $offer->id,
                'teacher_id' => $offer->teacher_id,
                'price' => (string) $offer->price,
                'currency' => 'SAR',
                'teacher' => $teacherData,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'service' => $service,
                'teachers' => $data,
            ],
            'pagination' => [
                'current_page' => $offers->currentPage(),
                'last_page' => $offers->lastPage(),
                'per_page' => $offers->perPage(),
                'total' => $offers->total(),
            ],
        ]);
    }

    // =====================================================================
    // Teacher management
    // =====================================================================

    /**
     * GET /api/teachers/{id}/general-services (public)
     * Active general-service offers of a teacher with prices.
     */
    public function teacherOffers(int $id): JsonResponse
    {
        $teacher = User::where('id', $id)->where('role_id', 3)->first();
        if (!$teacher) {
            return response()->json(['success' => false, 'message' => 'Teacher not found'], 404);
        }

        $offers = TeacherGeneralService::with('generalService')
            ->where('teacher_id', $id)
            ->where('is_active', true)
            ->whereHas('generalService', fn ($q) => $q->where('status', true))
            ->orderBy('price')
            ->get()
            ->map(fn (TeacherGeneralService $o) => [
                'id' => $o->id,
                'teacher_id' => $o->teacher_id,
                'general_service_id' => $o->general_service_id,
                'price' => (string) $o->price,
                'currency' => 'SAR',
                'service' => $o->generalService,
            ]);

        return response()->json(['success' => true, 'data' => $offers]);
    }

    /**
     * GET /api/teacher/general-services
     */
    public function teacherIndex(): JsonResponse
    {
        $teacher = auth()->user();

        $current = TeacherGeneralService::with('generalService')
            ->where('teacher_id', $teacher->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (TeacherGeneralService $item) {
                return [
                    'id' => $item->id,
                    'general_service_id' => $item->general_service_id,
                    'price' => (string) $item->price,
                    'is_active' => (bool) $item->is_active,
                    'service' => $item->generalService,
                ];
            });

        $takenIds = $current->pluck('general_service_id')->all();
        $available = GeneralService::active()
            ->when(!empty($takenIds), fn ($q) => $q->whereNotIn('id', $takenIds))
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'current_services' => $current->values(),
                'available_services' => $available,
            ],
        ]);
    }

    /**
     * POST /api/teacher/general-services
     */
    public function teacherStore(Request $request): JsonResponse
    {
        $request->validate([
            'general_service_id' => 'required|integer|exists:general_services,id',
            'price' => 'required|numeric|min:0|max:100000',
            'is_active' => 'sometimes|boolean',
        ]);

        $teacher = auth()->user();

        $service = GeneralService::active()->find($request->general_service_id);
        if (!$service) {
            return response()->json(['success' => false, 'message' => 'General service is not available'], 422);
        }

        $exists = TeacherGeneralService::where('teacher_id', $teacher->id)
            ->where('general_service_id', $request->general_service_id)
            ->first();
        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'You already offer this service',
                'error' => 'GENERAL_SERVICE_ALREADY_EXISTS',
            ], 409);
        }

        $offer = TeacherGeneralService::create([
            'teacher_id' => $teacher->id,
            'general_service_id' => $request->general_service_id,
            'price' => $request->price,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'General service added successfully',
            'data' => $offer->load('generalService'),
        ], 201);
    }

    /**
     * PUT /api/teacher/general-services/{id}
     */
    public function teacherUpdate(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'price' => 'sometimes|numeric|min:0|max:100000',
            'is_active' => 'sometimes|boolean',
        ]);

        $teacher = auth()->user();
        $offer = TeacherGeneralService::where('id', $id)
            ->where('teacher_id', $teacher->id)
            ->first();

        if (!$offer) {
            return response()->json(['success' => false, 'message' => 'Service offer not found'], 404);
        }

        $offer->update($request->only(['price', 'is_active']));

        return response()->json([
            'success' => true,
            'message' => 'General service updated successfully',
            'data' => $offer->fresh()->load('generalService'),
        ]);
    }

    /**
     * DELETE /api/teacher/general-services/{id}
     */
    public function teacherDestroy(int $id): JsonResponse
    {
        $teacher = auth()->user();
        $offer = TeacherGeneralService::where('id', $id)
            ->where('teacher_id', $teacher->id)
            ->first();

        if (!$offer) {
            return response()->json(['success' => false, 'message' => 'Service offer not found'], 404);
        }

        $offer->delete();

        return response()->json(['success' => true, 'message' => 'General service removed successfully']);
    }

    // =====================================================================
    // Student booking (mirrors POST /api/student/booking/course)
    // =====================================================================

    /**
     * POST /api/student/booking/general-service
     * Creates a booking WITHOUT any sessions/timeslots, returns booking_id + total for payment.
     */
    public function bookGeneralService(Request $request): JsonResponse
    {
        $request->validate([
            'teacher_id' => 'required|integer|exists:users,id',
            'general_service_id' => 'required|integer|exists:general_services,id',
            'special_requests' => 'nullable|string|max:2000',
        ]);

        DB::beginTransaction();
        try {
            $studentId = auth()->id();

            $service = GeneralService::active()->find($request->general_service_id);
            if (!$service) {
                return response()->json(['success' => false, 'message' => 'General service is not available'], 422);
            }

            $offer = TeacherGeneralService::where('teacher_id', $request->teacher_id)
                ->where('general_service_id', $request->general_service_id)
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();

            if (!$offer) {
                return response()->json([
                    'success' => false,
                    'message' => 'This teacher does not offer the selected service',
                    'error' => 'GENERAL_SERVICE_NOT_OFFERED',
                ], 422);
            }

            $teacher = User::find($request->teacher_id);
            if (!$teacher || (int) ($teacher->role_id ?? 0) !== 3) {
                return response()->json(['success' => false, 'message' => 'Invalid teacher'], 422);
            }

            $basePrice = (float) $offer->price;
            $platformPercentage = \App\Models\PlatformPercentage::getActive();
            $percentageValue = $platformPercentage ? ((float) $platformPercentage->value / 100) : 0;

            $pricePerSession = $basePrice * (1 + $percentageValue);
            $subtotal = $pricePerSession;
            $total = $subtotal;

            $booking = Booking::create([
                'student_id' => $studentId,
                'teacher_id' => $teacher->id,
                'availability_slot_id' => null,
                'timeslot_id' => null,
                'service_id' => null,
                'course_id' => null,
                'course_group_id' => null,
                'subject_id' => null,
                'general_service_id' => $service->id,
                'booking_reference' => $this->generateBookingReference(),
                'session_type' => Booking::TYPE_SINGLE,
                'sessions_count' => null,
                'sessions_completed' => 0,
                'first_session_date' => null,
                'first_session_start_time' => null,
                'first_session_end_time' => null,
                'session_duration' => null,
                'teacher_rate_per_session' => $basePrice,
                'platform_percentage' => $platformPercentage ? $platformPercentage->value : 0,
                'price_per_session' => $pricePerSession,
                'subtotal' => $subtotal,
                'discount_percentage' => 0,
                'discount_amount' => 0,
                'total_amount' => $total,
                'currency' => 'SAR',
                'special_requests' => $request->special_requests,
                'status' => Booking::STATUS_PENDING_PAYMENT,
                'booking_date' => now(),
            ]);

            try {
                $ns = new \App\Services\NotificationService();
                $title = app()->getLocale() == 'ar' ? 'تم إنشاء طلب خدمة عامة' : 'General service request created';
                $msg = app()->getLocale() == 'ar'
                    ? "تم إنشاء طلب الخدمة ({$booking->booking_reference}) بنجاح. أكمل الدفع لتأكيد الطلب."
                    : "Your general service request ({$booking->booking_reference}) was created. Complete payment to confirm.";
                $ns->send($booking->student, 'booking_created', $title, $msg, ['booking_id' => $booking->id]);
                $ns->send($teacher, 'booking_created', $title, $msg, ['booking_id' => $booking->id]);
            } catch (\Throwable $e) {
                Log::warning('General service booking notification failed', ['error' => $e->getMessage()]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'General service booking created successfully',
                'data' => [
                    'booking_id' => $booking->id,
                    'booking_reference' => $booking->booking_reference,
                    'total_amount' => (string) $booking->total_amount,
                    'currency' => $booking->currency,
                    'status' => $booking->status,
                    'service' => [
                        'id' => $service->id,
                        'name_ar' => $service->name_ar,
                        'name_en' => $service->name_en,
                    ],
                ],
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            throw $e;
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('General service booking failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['success' => false, 'message' => 'Failed to create booking', 'error' => $e->getMessage()], 500);
        }
    }

    // =====================================================================
    // Student: list my general-service bookings
    // =====================================================================

    /**
     * GET /api/student/general-service-bookings
     */
    public function studentBookings(Request $request): JsonResponse
    {
        $studentId = auth()->id();
        $status = $request->get('status', 'all');
        $perPage = (int) $request->get('per_page', 15);

        $query = Booking::with(['generalService', 'teacher'])
            ->where('student_id', $studentId)
            ->whereNotNull('general_service_id');

        if (in_array($status, ['pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled'])) {
            $query->where('status', $status);
        }

        $bookings = $query->orderByDesc('created_at')->paginate($perPage);

        $data = $bookings->through(fn (Booking $b) => $this->formatGeneralServiceBooking($b));

        return response()->json([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    // =====================================================================
    // Teacher: incoming general-service orders
    // =====================================================================

    /**
     * GET /api/teacher/general-service-orders
     */
    public function teacherOrders(Request $request): JsonResponse
    {
        $teacherId = auth()->id();
        $status = $request->get('status', 'all');
        $perPage = (int) $request->get('per_page', 15);

        $query = Booking::with(['generalService', 'student'])
            ->where('teacher_id', $teacherId)
            ->whereNotNull('general_service_id');

        if (in_array($status, ['pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled'])) {
            $query->where('status', $status);
        }

        $bookings = $query->orderByDesc('created_at')->paginate($perPage);

        $data = $bookings->through(fn (Booking $b) => $this->formatGeneralServiceBooking($b, true));

        return response()->json([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    /**
     * PUT /api/teacher/general-service-orders/{id}/status
     * Allowed: in_progress, completed (optionally confirmed).
     */
    public function updateOrderStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:in_progress,completed,confirmed',
        ]);

        $teacherId = auth()->id();
        $booking = Booking::where('id', $id)
            ->where('teacher_id', $teacherId)
            ->whereNotNull('general_service_id')
            ->first();

        if (!$booking) {
            return response()->json(['success' => false, 'message' => 'Order not found'], 404);
        }

        if (in_array($booking->status, [Booking::STATUS_CANCELLED, Booking::STATUS_COMPLETED])) {
            return response()->json(['success' => false, 'message' => 'Order can no longer be updated'], 422);
        }

        $booking->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully',
            'data' => $this->formatGeneralServiceBooking($booking->fresh(['generalService', 'student', 'teacher']), true),
        ]);
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    private function formatGeneralServiceBooking(Booking $booking, bool $forTeacher = false): array
    {
        $otherParty = $forTeacher ? $booking->student : $booking->teacher;

        return [
            'id' => $booking->id,
            'booking_reference' => (string) $booking->booking_reference,
            'status' => (string) $booking->status,
            'total_amount' => (string) $booking->total_amount,
            'currency' => (string) ($booking->currency ?? 'SAR'),
            'special_requests' => $booking->special_requests,
            'booking_date' => $booking->booking_date?->format('Y-m-d H:i'),
            'created_at' => $booking->created_at?->format('Y-m-d H:i'),
            'service' => $booking->generalService ? [
                'id' => $booking->generalService->id,
                'name_ar' => $booking->generalService->name_ar,
                'name_en' => $booking->generalService->name_en,
                'description_ar' => $booking->generalService->description_ar,
                'description_en' => $booking->generalService->description_en,
                'icon' => $booking->generalService->icon,
            ] : null,
            $forTeacher ? 'student' : 'teacher' => $otherParty ? [
                'id' => $otherParty->id,
                'name' => trim(($otherParty->first_name ?? '') . ' ' . ($otherParty->last_name ?? '')),
                'email' => $otherParty->email ?? null,
            ] : null,
        ];
    }

    private function generateBookingReference(): string
    {
        return 'BK' . now()->format('Ymd') . str_pad((string) rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }
}
