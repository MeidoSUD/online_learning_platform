<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AvailabilitySlot;
use App\Models\Sessions;
use App\Models\Orders;
use App\Models\Booking;
use Carbon\Carbon;
use App\Models\Payment;
use App\Models\TeachersApplications;
use App\Models\User;
use App\Helpers\NotificationHelper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrdersController extends Controller
{
    // Student: Create new order
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'class_id' => 'nullable|integer',
            'education_level_id' => 'nullable|integer',
            'type' => 'nullable|in:single,group',
            'min_price' => 'nullable|integer|min:0',
            'max_price' => 'nullable|integer|min:0|gte:min_price',
            'notes' => 'nullable|string|max:1000',
            'availability_slots' => 'required|array|min:1',
            'availability_slots.*.date' => 'required|date|after_or_equal:today',
            'availability_slots.*.start_time' => 'required|date_format:H:i',
            'availability_slots.*.end_time' => 'required|date_format:H:i|after:availability_slots.*.start_time',
        ]);

        DB::beginTransaction();
        try {
            // Create order
            $order = Orders::create([
                'user_id' => $request->user()->id,
                'subject_id' => $request->subject_id,
                'class_id' => $request->class_id,
                'education_level_id' => $request->education_level_id,
                'type' => $request->type ?? 'single',
                'min_price' => $request->min_price,
                'max_price' => $request->max_price,
                'status' => 'pending',
                'notes' => $request->notes,
            ]);

            // Create available slots
            foreach ($request->input('availability_slots') as $slot) {
                AvailabilitySlot::create([
                    'order_id' => $order->id,
                    'date' => $slot['date'],
                    'start_time' => $slot['start_time'],
                    'end_time' => $slot['end_time'],
                    'duration' => 60, 
                ]);
            }

            DB::commit();
            $teachers = User::where('role_id', 3)
                ->whereIn('id', function ($query) use ($order) {
                    $query->select('teacher_id')
                        ->from('teacher_subjects')
                        ->where('subject_id', $order->subject_id);
                })
                ->whereIn('id', function ($query) use ($order) {
                    $query->select('teacher_id')
                        ->from('teacher_teach_classes')
                        ->where('class_id', $order->class_id);
                })
                ->get();
            try {
                NotificationHelper::orderCreated($teachers, $order);
            } catch (\Throwable $e) {
                // Log the error or include it in the response for debugging
                return response()->json([
                    'success' => false,
                    'message' => 'Order created, but notification failed: ' . $e->getMessage(),
                    'data' => $order
                ], 500);
            }

            $order->load(['subject', 'availableSlots']);

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully',
                'data' => $order,
                'teachers_notified' => $teachers
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create order: ' . $e->getMessage()
            ], 500);
        }
    }

    // Student: Get my orders
    public function index(Request $request): JsonResponse
    {
        $orders = Orders::with(['subject', 'availableSlots', 'applications'])
            ->where('user_id', $request->user()->id)
            ->withCount('applications')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

    // Student: Get single order details
    public function show(Request $request, int $id): JsonResponse
    {
        $order = Orders::with(['subject', 'availableSlots', 'applications.teacher', 'sessions'])
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $order
        ]);
    }

    // Student: Update order
    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'subject_id' => 'sometimes|required|exists:courses,id',
            'teacher_id' => 'nullable|exists:users,id',
            'class_id' => 'nullable|integer',
            'education_level_id' => 'nullable|integer',
            'type' => 'nullable|in:single,group',
            'min_price' => 'nullable|integer|min:0',
            'max_price' => 'nullable|integer|min:0',
            'notes' => 'nullable|string|max:1000',
            'status' => 'sometimes|in:pending,cancelled',
        ]);

        $order = Orders::where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->findOrFail($id);

        $order->update($request->only([
            'subject_id',
            'teacher_id',
            'class_id',
            'education_level_id',
            'type',
            'min_price',
            'max_price',
            'notes',
            'status'
        ]));

        $order->load(['subject', 'availableSlots']);

        return response()->json([
            'success' => true,
            'message' => 'Order updated successfully',
            'data' => $order
        ]);
    }

    // Student: Delete order
    public function destroy(Request $request, int $id): JsonResponse
    {
        $order = Orders::where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->findOrFail($id);

        $order->delete();

        return response()->json([
            'success' => true,
            'message' => 'Order deleted successfully'
        ]);
    }

    // Student: Get applications for my order
    public function getApplications(Request $request, int $order_id): JsonResponse
    {
        $order = Orders::where('user_id', $request->user()->id)
            ->findOrFail($order_id);

        $applications = TeachersApplications::with(['teacher.profile'])
            ->where('order_id', $order_id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $applications
        ]);
    }

    // Student: Accept teacher application and make payment
    public function acceptApplication(Request $request, int $order_id, int $application_id): JsonResponse
    {
        $request->validate([
            'slot_id' => 'required|exists:availability_slots,id',
            'payment_method' => 'required|string',
            'payment_reference' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $order = Orders::where('user_id', $request->user()->id)
                ->where('status', 'pending')
                ->findOrFail($order_id);

            $application = TeachersApplications::where('order_id', $order_id)
                ->where('id', $application_id)
                ->where('status', 'pending')
                ->firstOrFail();

            $slot = AvailabilitySlot::where('order_id', $order_id)
                ->findOrFail($request->input('slot_id'));

            // Accept application
            $application->update(['status' => 'accepted']);

            // Reject other applications
            TeachersApplications::where('order_id', $order_id)
                ->where('id', '!=', $application_id)
                ->update(['status' => 'rejected']);

            // Update order status
            $order->update([
                'status' => 'completed',
            ]);

            // Create booking
            $booking = Booking::create([
                'booking_reference' => uniqid('BK'),
                'student_id' => $order->user_id,
                'teacher_id' => $application->teacher_id,
                'course_id' => null, // or set if you have course
                'session_type' => 'single',
                'sessions_count' => 1,
                'sessions_completed' => 0,
                'first_session_date' => $slot->available_date,
                'first_session_start_time' => $slot->start_time,
                'first_session_end_time' => $slot->end_time,
                'session_duration' => Carbon::parse($slot->start_time)->diffInMinutes(Carbon::parse($slot->end_time)),
                'price_per_session' => $application->proposed_price,
                'subtotal' => $application->proposed_price,
                'discount_percentage' => 0,
                'discount_amount' => 0,
                'total_amount' => $application->proposed_price,
                'currency' => 'SAR',
                'special_requests' => $order->notes,
                'status' => 'confirmed',
                'booking_date' => now(),
            ]);

            // Create payment record
            $payment = Payment::create([
                'booking_id' => $booking->id,
                'student_id' => $order->user_id,
                'teacher_id' => $application->teacher_id,
                'amount' => $application->proposed_price,
                'currency' => 'SAR',
                'payment_method' => $request->input('payment_method'),
                'transaction_reference' => $request->input('payment_reference'),
                'status' => 'pending',
                'paid_at' => now(),
            ]);

            // Create session record (replace Zoom code with your own logic)
            $session = Sessions::create([
                'booking_id' => $booking->id,
                'student_id' => $order->user_id,
                'teacher_id' => $application->teacher_id,
                'session_number' => 1,
                'session_date' => $slot->date,
                'start_time' => $slot->start_time,
                'end_time' => $slot->end_time,
                'duration' => Carbon::parse($slot->start_time)->diffInMinutes(Carbon::parse($slot->end_time)),
                'status' => Sessions::STATUS_SCHEDULED,
                'join_url' => null,
                'host_url' => null, // Replace with actual generated URL
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Application accepted, booking and session created',
                'data' => [
                    'order' => $order,
                    'booking' => $booking,
                    'payment' => $payment,
                    'session' => $session
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to process: ' . $e->getMessage()
            ], 500);
        }
    }

    // Add this to your orderController_api.php


public function get_payment_status_request($checkout_id, $payment_gway_type)
{
    return get_payment_status_request($checkout_id, $payment_gway_type);
}
}
