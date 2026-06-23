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
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class StudentPackageController extends Controller
{
    public function index()
    {
        $packages = SessionsPackages::where('is_active', true)
            ->orderBy('sessions_count')
            ->get()
            ->map(function ($package) {
                return [
                    'id' => $package->id,
                    'name_ar' => $package->name_ar,
                    'name_en' => $package->name_en,
                    'description_ar' => $package->description_ar,
                    'description_en' => $package->description_en,
                    'sessions_count' => $package->sessions_count,
                    'price' => $package->price,
                    'discount' => $package->discount,
                    'price_per_session' => $package->price_per_session,
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
            'payment_method' => 'required|string|in:card,wallet,bank_transfer,apple_pay,stc_pay',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        $package = SessionsPackages::findOrFail($request->package_id);

        if (!$package->is_active) {
            return response()->json(['status' => false, 'message' => 'Package is not available'], 400);
        }

        return DB::transaction(function () use ($request, $studentId, $package) {
            $booking = Booking::create([
                'student_id' => $studentId,
                'session_type' => Booking::TYPE_PACKAGE,
                'sessions_count' => $package->sessions_count,
                'sessions_completed' => 0,
                'session_duration' => 0,
                'price_per_session' => $package->price_per_session,
                'subtotal' => $package->price,
                'total_amount' => $package->price,
                'currency' => 'SAR',
                'status' => Booking::STATUS_PENDING_PAYMENT,
                'booking_date' => now(),
            ]);

            $payment = Payment::create([
                'booking_id' => $booking->id,
                'student_id' => $studentId,
                'amount' => $package->price,
                'currency' => 'SAR',
                'payment_method' => $request->payment_method,
                'status' => Payment::STATUS_COMPLETED,
                'paid_at' => now(),
            ]);

            $booking->update(['status' => Booking::STATUS_CONFIRMED]);

            $subscription = Subscription::create([
                'student_id' => $studentId,
                'package_id' => $package->id,
                'sessions_remaining' => $package->sessions_count,
                'sessions_used' => 0,
                'status' => Subscription::STATUS_ACTIVE,
                'start_date' => now(),
                'total_paid' => $package->price,
                'currency' => 'SAR',
                'payment_id' => $payment->id,
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Package purchased successfully',
                'data' => [
                    'subscription' => $subscription->load('package'),
                    'booking' => $booking,
                    'payment' => $payment,
                ],
            ], 201);
        });
    }

    public function mySubscriptions(Request $request)
    {
        $studentId = $request->user()->id;

        $subscriptions = Subscription::where('student_id', $studentId)
            ->with('package')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($sub) {
                return [
                    'id' => $sub->id,
                    'package_name_ar' => $sub->package->name_ar ?? '',
                    'package_name_en' => $sub->package->name_en ?? '',
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
            ->with(['package', 'bookings.sessions'])
            ->findOrFail($id);

        return response()->json([
            'status' => true,
            'data' => [
                'id' => $subscription->id,
                'package' => $subscription->package,
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
                        'teacher_id' => $booking->teacher_id,
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
            'teacher_id' => 'required|exists:users,id',
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
                ->where('teacher_id', $request->teacher_id)
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
                'teacher_id' => $request->teacher_id,
                'availability_slot_id' => $slot->id,
                'subscription_id' => $subscription->id,
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
                    'booking' => $booking->load('sessions', 'teacher'),
                    'sessions_remaining' => $subscription->fresh()->sessions_remaining,
                ],
            ], 201);
        });
    }
}
