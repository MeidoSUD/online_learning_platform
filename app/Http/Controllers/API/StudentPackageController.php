<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SessionsPackages;
use App\Models\Subscription;
use App\Models\Booking;
use App\Models\AvailabilitySlot;
use App\Models\Sessions;
use App\Models\Payment;
use App\Models\TeacherInfo;
use App\Helpers\Helpers;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StudentPackageController extends Controller
{
    public function teacherPackages($teacherId)
    {
        $teacherInfo = TeacherInfo::where('teacher_id', $teacherId)->first();

        if (!$teacherInfo || !$teacherInfo->offer_packages || !$teacherInfo->packages_approved) {
            return response()->json([
                'status' => true,
                'data' => [],
                'message' => 'Teacher does not offer packages',
            ]);
        }

        $teacherHourlyRate = $teacherInfo->individual_hour_price;

        $packages = SessionsPackages::where('is_active', true)
            ->orderBy('sessions_count')
            ->get()
            ->map(function ($package) use ($teacherHourlyRate) {
                $savingsPerSession = $teacherHourlyRate ? round($teacherHourlyRate - $package->price_per_session, 2) : null;
                return [
                    'id' => $package->id,
                    'name' => $package->name,
                    'description' => $package->description,
                    'sessions_count' => $package->sessions_count,
                    'total_price' => $package->total_price,
                    'price_per_session' => $package->price_per_session,
                    'savings_per_session' => $savingsPerSession > 0 ? $savingsPerSession : null,
                ];
            });

        return response()->json([
            'status' => true,
            'data' => $packages,
        ]);
    }

    public function purchase(Request $request)
    {
        $studentId = $request->user()->id;

        $validator = Validator::make($request->all(), [
            'package_id' => 'required|exists:sessions_packages,id',
            'teacher_id' => 'required|exists:users,id',
            'payment_method' => 'required|string|in:card,wallet,bank_transfer,apple_pay,stc_pay',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        $package = SessionsPackages::findOrFail($request->package_id);

        if (!$package->is_active) {
            return response()->json(['status' => false, 'message' => 'Package is not available'], 400);
        }

        $validator->after(function ($v) use ($request) {
            $teacherInfo = TeacherInfo::where('teacher_id', $request->teacher_id)->first();
            if (!$teacherInfo || !$teacherInfo->offer_packages || !$teacherInfo->packages_approved) {
                $v->errors()->add('teacher_id', 'This teacher does not offer packages');
            }
        });

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        return DB::transaction(function () use ($request, $studentId, $package) {
            $payment = Payment::create([
                'student_id' => $studentId,
                'teacher_id' => $request->teacher_id,
                'amount' => $package->total_price,
                'currency' => 'SAR',
                'payment_method' => $request->payment_method,
                'status' => Payment::STATUS_COMPLETED,
                'paid_at' => now(),
            ]);

            $subscription = Subscription::create([
                'student_id' => $studentId,
                'teacher_id' => $request->teacher_id,
                'package_id' => $package->id,
                'sessions_remaining' => $package->sessions_count,
                'sessions_used' => 0,
                'status' => Subscription::STATUS_ACTIVE,
                'start_date' => now(),
                'total_paid' => $package->total_price,
                'currency' => 'SAR',
                'payment_id' => $payment->id,
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Package purchased successfully',
                'data' => [
                    'subscription' => $subscription->load('package', 'teacher', 'payment'),
                    'payment' => $payment,
                ],
            ], 201);
        });
    }

    public function mySubscriptions(Request $request)
    {
        $studentId = $request->user()->id;

        $subscriptions = Subscription::where('student_id', $studentId)
            ->with(['package', 'teacher'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($sub) {
                return [
                    'id' => $sub->id,
                    'package_name' => $sub->package->name ?? 'Package',
                    'teacher_name' => $sub->teacher->name ?? 'Teacher',
                    'teacher_id' => $sub->teacher_id,
                    'sessions_remaining' => $sub->sessions_remaining,
                    'sessions_used' => $sub->sessions_used,
                    'total_sessions' => $sub->total_sessions,
                    'total_paid' => $sub->total_paid,
                    'status' => $sub->status,
                    'is_active' => $sub->is_active,
                    'start_date' => $sub->start_date,
                    'expiry_date' => $sub->expiry_date,
                    'bookings_count' => $sub->bookings()->count(),
                ];
            });

        return response()->json([
            'status' => true,
            'data' => $subscriptions,
        ]);
    }

    public function subscriptionDetails(Request $request, $id)
    {
        $studentId = $request->user()->id;

        $subscription = Subscription::where('student_id', $studentId)
            ->with(['package', 'teacher', 'bookings.sessions'])
            ->findOrFail($id);

        return response()->json([
            'status' => true,
            'data' => [
                'id' => $subscription->id,
                'package' => $subscription->package,
                'teacher' => $subscription->teacher,
                'sessions_remaining' => $subscription->sessions_remaining,
                'sessions_used' => $subscription->sessions_used,
                'total_sessions' => $subscription->total_sessions,
                'total_paid' => $subscription->total_paid,
                'status' => $subscription->status,
                'start_date' => $subscription->start_date,
                'expiry_date' => $subscription->expiry_date,
                'bookings' => $subscription->bookings->map(function ($booking) {
                    return [
                        'id' => $booking->id,
                        'booking_reference' => $booking->booking_reference,
                        'session_date' => $booking->first_session_date,
                        'start_time' => $booking->first_session_start_time,
                        'end_time' => $booking->first_session_end_time,
                        'status' => $booking->status,
                    ];
                }),
            ],
        ]);
    }

    public function bookSession(Request $request, $subscriptionId)
    {
        $studentId = $request->user()->id;

        $validator = Validator::make($request->all(), [
            'availability_slot_id' => 'required|exists:availability_slots,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        $subscription = Subscription::where('student_id', $studentId)
            ->where('id', $subscriptionId)
            ->where('status', Subscription::STATUS_ACTIVE)
            ->first();

        if (!$subscription) {
            return response()->json(['status' => false, 'message' => 'Subscription not found or not active'], 404);
        }

        if ($subscription->sessions_remaining <= 0) {
            return response()->json(['status' => false, 'message' => 'No remaining sessions in this subscription'], 400);
        }

        return DB::transaction(function () use ($request, $studentId, $subscription) {
            $slot = AvailabilitySlot::where('id', $request->availability_slot_id)
                ->where('teacher_id', $subscription->teacher_id)
                ->where('is_available', true)
                ->where('is_booked', false)
                ->lockForUpdate()
                ->first();

            if (!$slot) {
                return response()->json(['status' => false, 'message' => 'Slot not available or already booked'], 400);
            }

            if (!$slot->is_bookable) {
                return response()->json(['status' => false, 'message' => 'Slot must be at least 2 hours in the future'], 400);
            }

            $booking = Booking::create([
                'student_id' => $studentId,
                'teacher_id' => $subscription->teacher_id,
                'availability_slot_id' => $slot->id,
                'subscription_id' => $subscription->id,
                'service_id' => null,
                'session_type' => Booking::TYPE_SINGLE,
                'sessions_count' => 1,
                'sessions_completed' => 0,
                'first_session_date' => $slot->date,
                'first_session_start_time' => $slot->start_time,
                'first_session_end_time' => $slot->end_time,
                'session_duration' => $slot->duration,
                'price_per_session' => 0,
                'teacher_rate_per_session' => 0,
                'subtotal' => 0,
                'total_amount' => 0,
                'currency' => 'SAR',
                'status' => Booking::STATUS_CONFIRMED,
                'booking_date' => now(),
            ]);

            $subscription->useSession();

            $slot->update([
                'is_booked' => true,
                'booking_id' => $booking->id,
            ]);

            Sessions::createForBooking($booking);

            $booking->refresh();
            $booking->createMeetingsForSessions();

            return response()->json([
                'status' => true,
                'message' => 'Session booked successfully from your package',
                'data' => [
                    'booking' => $booking->load('sessions'),
                    'sessions_remaining' => $subscription->fresh()->sessions_remaining,
                ],
            ], 201);
        });
    }
}
