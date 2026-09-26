<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\User;
use App\Services\Booking\BookingService;
use App\Services\Booking\BookingPaymentService;
use App\Services\Booking\BookingValidationService;
use App\Services\Booking\BookingQueryService;
use App\Services\User\TeacherProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

/**
 * @OA\Tag(
 *     name="Booking",
 *     description="API Endpoints for Bookings Management"
 * )
 */
class BookingController extends Controller
{
    protected BookingService $bookingService;
    protected BookingPaymentService $paymentService;
    protected BookingValidationService $validationService;
    protected BookingQueryService $queryService;
    protected TeacherProfileService $teacherProfileService;

    public function __construct(
        BookingService $bookingService,
        BookingPaymentService $paymentService,
        BookingValidationService $validationService,
        BookingQueryService $queryService,
        TeacherProfileService $teacherProfileService
    ) {
        $this->bookingService = $bookingService;
        $this->paymentService = $paymentService;
        $this->validationService = $validationService;
        $this->queryService = $queryService;
        $this->teacherProfileService = $teacherProfileService;
    }

    /**
     * @OA\Post(
     *     path="/api/student/booking",
     *     summary="Create a new booking (course, service, or package subscription)",
     *     tags={"Booking"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="course_id", type="integer"),
     *             @OA\Property(property="service_id", type="integer"),
     *             @OA\Property(property="teacher_id", type="integer"),
     *             @OA\Property(property="subject_id", type="integer"),
     *             @OA\Property(property="availability_slot_id", type="integer"),
     *             @OA\Property(property="timeslot_id", type="integer"),
     *             @OA\Property(property="timeslot_ids", type="array", @OA\Items(type="integer")),
     *             @OA\Property(property="subscription_id", type="integer"),
     *             @OA\Property(property="type", type="string", enum={"single", "package"}),
     *             @OA\Property(property="sessions_count", type="integer"),
     *             @OA\Property(property="total_sessions", type="integer"),
     *             @OA\Property(property="sessions_per_slot", type="object"),
     *             @OA\Property(property="special_requests", type="string")
     *         )
     *     ),
     *     @OA\Response(response=200, description="Booking created successfully")
     * )
     */
    public function createBooking(Request $request): JsonResponse
    {
        $request->validate([
            'course_id' => 'nullable|exists:courses,id',
            'service_id' => 'nullable|exists:services,id',
            'teacher_id' => 'nullable|integer|exists:users,id',
            'subject_id' => 'nullable|integer',
            'availability_slot_id' => 'nullable|exists:availability_slots,id',
            'timeslot_id' => 'nullable|exists:availability_slots,id',
            'timeslot_ids' => 'nullable|array|min:1',
            'timeslot_ids.*' => 'integer|exists:availability_slots,id',
            'subscription_id' => 'nullable|integer|exists:subscriptions,id',
            'type' => 'required|in:single,package',
            'sessions_count' => 'nullable|integer|min:1|max:50',
            'total_sessions' => 'nullable|integer|min:1|max:50',
            'sessions_per_slot' => 'nullable|array',
            'special_requests' => 'nullable|string|max:500',
        ]);

        $studentId = auth()->id();
        $result = $this->bookingService->createBooking($request, $studentId);

        return response()->json($result, $result['status_code'] ?? 200);
    }

    /**
     * Alias for booking endpoints routed to index.
     */
    public function index(Request $request): JsonResponse
    {
        if ($request->isMethod('post')) {
            return $this->createBooking($request);
        }
        return $this->getStudentBookings($request);
    }

    /**
     * @OA\Get(
     *     path="/api/student/timeslots/{slotId}/session-date",
     *     summary="Get concrete session date and check for teacher/student conflicts",
     *     tags={"Booking"},
     *     @OA\Parameter(name="slotId", in="path", required=false, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="slot_id", in="query", required=false, @OA\Schema(type="integer")),
     *     @OA\Parameter(name="sessions_count", in="query", required=false, @OA\Schema(type="integer", default=1)),
     *     @OA\Response(response=200, description="Timeslot date and availability details")
     * )
     */
    public function getTimeslotSessionDate(Request $request, $slotId = null): JsonResponse
    {
        $targetSlotId = $slotId ?? $request->input('slot_id') ?? $request->input('timeslot_id') ?? $request->input('availability_slot_id');

        if (!$targetSlotId) {
            return response()->json([
                'success' => false,
                'message' => 'Slot ID is required',
                'message_ar' => 'معرف الفترة الزمنية مطلوب',
            ], 422);
        }

        $studentId = auth('sanctum')->id();
        $sessionsCount = (int) $request->input('sessions_count', 1);

        $result = $this->validationService->getTimeslotSessionInfo((int) $targetSlotId, $studentId, $sessionsCount);

        return response()->json($result, $result['status_code'] ?? 200);
    }

    /**
     * @OA\Get(
     *     path="/api/payments/callback",
     *     summary="Payment callback endpoint for 3DS/OTP verification",
     *     tags={"Payment"},
     *     @OA\Parameter(name="resourcePath", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="checkoutId", in="query", @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Payment verified or failed")
     * )
     */
    public function paymentCallback(Request $request): JsonResponse
    {
        $result = $this->paymentService->paymentCallback($request);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    /**
     * Initiate 3DS Payment.
     */
    public function payBooking3DS(Request $request): JsonResponse
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'payment_brand' => 'required|in:VISA,MASTER,MADA',
        ]);

        $studentId = auth()->id();
        $result = $this->paymentService->payBooking3DS($request, $studentId);

        return response()->json($result, $result['status_code'] ?? 200);
    }

    /**
     * Pay booking via direct card details.
     */
    public function payBooking(Request $request): JsonResponse
    {
        $currentYear = Carbon::now()->year;
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'card_number' => 'required|regex:/^\d{13,19}$/',
            'card_holder' => 'required|string|max:100',
            'expiry_month' => 'required|integer|between:1,12',
            'expiry_year' => 'required|integer|min:' . $currentYear,
            'cvv' => 'required|regex:/^\d{3,4}$/',
            'payment_brand' => 'required|in:VISA,MASTER,MADA',
        ]);

        $studentId = auth()->id();
        $result = $this->paymentService->payBooking($request, $studentId);

        return response()->json($result, $result['status_code'] ?? 200);
    }

    /**
     * Handle payment callback.
     */
    public function handlePaymentCallback(Request $request): JsonResponse
    {
        $result = $this->paymentService->handlePaymentCallback($request);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    /**
     * Check payment status by Payment ID.
     */
    public function checkPaymentStatus($paymentId): JsonResponse
    {
        $result = $this->paymentService->checkPaymentStatus($paymentId);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    /**
     * @OA\Get(
     *     path="/api/student/booking",
     *     summary="List student bookings",
     *     tags={"Booking"},
     *     @OA\Parameter(name="status", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="per_page", in="query", @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Student bookings list")
     * )
     */
    public function getStudentBookings(Request $request): JsonResponse
    {
        $studentId = auth()->id();
        $result = $this->queryService->getStudentBookings($request, $studentId);

        return response()->json($result, $result['status_code'] ?? 200);
    }

    /**
     * @OA\Get(
     *     path="/api/student/booking/{bookingId}",
     *     summary="Get booking details",
     *     tags={"Booking"},
     *     @OA\Parameter(name="bookingId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Booking details")
     * )
     */
    public function getBookingDetails($bookingId): JsonResponse
    {
        $studentId = auth()->id();
        $result = $this->queryService->getBookingDetails((int) $bookingId, $studentId);

        return response()->json($result, $result['status_code'] ?? 200);
    }

    /**
     * @OA\Put(
     *     path="/api/student/booking/{bookingId}/cancel",
     *     summary="Cancel a booking",
     *     tags={"Booking"},
     *     @OA\Parameter(name="bookingId", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Booking cancelled")
     * )
     */
    public function cancelBooking($bookingId): JsonResponse
    {
        $studentId = auth()->id();
        $result = $this->bookingService->cancelBooking((int) $bookingId, $studentId);

        return response()->json($result, $result['status_code'] ?? 200);
    }

    /**
     * Get student sessions with a specific teacher.
     */
    public function mySessions(Request $request, $teacherId): JsonResponse
    {
        $studentId = auth()->id();
        $result = $this->queryService->mySessions($request, $studentId, (int) $teacherId);

        return response()->json($result, $result['status_code'] ?? 200);
    }

    /**
     * Get students for authenticated teacher.
     */
    public function getTeacherStudents(Request $request): JsonResponse
    {
        $teacherId = auth()->id();
        $result = $this->queryService->getTeacherStudents($teacherId);

        return response()->json($result, $result['status_code'] ?? 200);
    }

    /**
     * Get students for teacher (Public).
     */
    public function getTeacherStudentsPublic($teacherId): JsonResponse
    {
        $result = $this->queryService->getTeacherStudents((int) $teacherId);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    /**
     * Get teachers for student (Public).
     */
    public function getStudentTeachersPublic(Request $request, $studentId): JsonResponse
    {
        $result = $this->queryService->getStudentTeachersPublic($request, (int) $studentId);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    /**
     * Helper to get full teacher data (for backward-compatibility).
     */
    public function getFullTeacherData($teacher)
    {
        if ($teacher instanceof User) {
            return $this->teacherProfileService->getFullTeacherData($teacher);
        }
        return (new UserController())->getFullTeacherData($teacher);
    }
}
