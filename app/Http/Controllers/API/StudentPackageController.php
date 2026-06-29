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
use App\Services\MoyasarPay;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StudentPackageController extends Controller
{
    protected MoyasarPay $moyasar;

    public function __construct(MoyasarPay $moyasar)
    {
        $this->moyasar = $moyasar;
    }

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
                    'discount_percentage' => $package->discount_percentage,
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

        try {
            $amount = (int) ($package->price * 100);
            $currency = 'SAR';
            $callbackUrl = route('api.payment.callback');

            $payload = [
                'amount' => $amount,
                'currency' => $currency,
                'description' => "Package: {$package->name_en} ({$package->sessions_count} sessions)",
                'callback_url' => $callbackUrl,
                'metadata' => [
                    'user_id' => $studentId,
                    'package_id' => $package->id,
                    'type' => 'package_purchase',
                ],
            ];

            $gatewayResponse = $this->moyasar->createInvoice($payload);

            $payment = Payment::create([
                'student_id' => $studentId,
                'amount' => $package->price,
                'currency' => $currency,
                'payment_method' => 'MOYASAR_' . strtoupper($request->payment_method),
                'status' => $gatewayResponse['status'],
                'transaction_reference' => $gatewayResponse['id'],
                'gateway_reference' => $gatewayResponse['id'],
                'gateway_response' => json_encode($gatewayResponse),
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Payment checkout created',
                'data' => [
                    'payment_id' => $payment->id,
                    'checkout_id' => $gatewayResponse['id'],
                    'redirect_url' => $gatewayResponse['url'] ?? '',
                    'amount' => $package->price,
                    'currency' => $currency,
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('Package purchase checkout failed', [
                'student_id' => $studentId,
                'package_id' => $package->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Failed to initiate payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function confirmPurchase(Request $request)
    {
        $studentId = $request->user()->id;

        $validator = Validator::make($request->all(), [
            'payment_id' => 'required|integer|exists:payments,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        $payment = Payment::where('id', $request->payment_id)
            ->where('student_id', $studentId)
            ->first();

        if (!$payment) {
            return response()->json(['status' => false, 'message' => 'Payment not found'], 404);
        }

        if ($payment->status === Payment::STATUS_COMPLETED) {
            $subscription = Subscription::where('payment_id', $payment->id)->first();
            if ($subscription) {
                return response()->json([
                    'status' => true,
                    'message' => 'Already confirmed',
                    'data' => [
                        'subscription' => $subscription->load('package'),
                        'payment' => $payment,
                    ],
                ]);
            }
        }

        try {
            $invoice = $this->moyasar->fetchInvoice($payment->gateway_reference);

            $isPaid = $invoice['status'] === 'paid' && !empty($invoice['payments']);
            $gatewayStatus = $invoice['status'];

            if (!$isPaid) {
                $payment->update([
                    'status' => $gatewayStatus,
                    'gateway_response' => json_encode($invoice),
                ]);

                return response()->json([
                    'status' => false,
                    'message' => 'Payment not completed yet',
                    'data' => [
                        'payment_status' => $gatewayStatus,
                        'payment_id' => $payment->id,
                    ],
                ], 400);
            }

            $payment->update([
                'status' => Payment::STATUS_COMPLETED,
                'gateway_response' => json_encode($invoice),
                'paid_at' => now(),
            ]);

            $metadata = $invoice['metadata'] ?? [];
            $packageId = $metadata['package_id'] ?? null;

            if (!$packageId) {
                return response()->json([
                    'status' => false,
                    'message' => 'Could not determine package from payment',
                ], 400);
            }

            $package = SessionsPackages::findOrFail($packageId);

            $subscription = Subscription::create([
                'student_id' => $studentId,
                'package_id' => $package->id,
                'sessions_remaining' => $package->sessions_count,
                'sessions_used' => 0,
                'status' => Subscription::STATUS_ACTIVE,
                'start_date' => now(),
                'total_paid' => $payment->amount,
                'currency' => 'SAR',
                'payment_id' => $payment->id,
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Package purchased successfully',
                'data' => [
                    'subscription' => $subscription->load('package'),
                    'payment' => $payment->fresh(),
                ],
            ], 201);
        } catch (\Exception $e) {
            Log::error('Package purchase confirmation failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'status' => false,
                'message' => 'Failed to confirm payment: ' . $e->getMessage(),
            ], 500);
        }
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
            'sessions_count' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => false, 'errors' => $validator->errors()], 422);
        }

        $sessionsCount = $request->input('sessions_count', 1);

        $subscription = Subscription::where('student_id', $studentId)
            ->where('id', $subscriptionId)
            ->where('status', Subscription::STATUS_ACTIVE)
            ->first();

        if (!$subscription) {
            return response()->json(['status' => false, 'message' => 'Subscription not found or not active'], 404);
        }

        if ($subscription->sessions_remaining < $sessionsCount) {
            return response()->json(['status' => false, 'message' => 'No remaining sessions in this subscription'], 400);
        }

        return DB::transaction(function () use ($request, $studentId, $subscription, $sessionsCount) {
            $slot = AvailabilitySlot::where('id', $request->availability_slot_id)
                ->where('teacher_id', $request->teacher_id)
                ->where('is_available', true)
                ->where('is_booked', false)
                ->lockForUpdate()
                ->first();

            if (!$slot) {
                return response()->json(['status' => false, 'message' => 'Slot not available or already booked'], 400);
            }

            $slotDate = null;
            if ($slot->date && trim((string) $slot->date) !== '') {
                $slotDate = $slot->date instanceof \Carbon\Carbon ? $slot->date->format('Y-m-d') : (string) $slot->date;
            } elseif ($slot->day_number !== null) {
                $today = \Carbon\Carbon::today();
                $dayNumberFromApp = (int) $slot->day_number;
                $carbonDayOfWeek = ($dayNumberFromApp === 1) ? 6 : ($dayNumberFromApp - 2);
                $todayDow = $today->dayOfWeek;
                $delta = ($carbonDayOfWeek - $todayDow + 7) % 7;
                $candidate = $today->copy()->addDays($delta);
                $slotStart = $this->extractTimeOnly($slot->start_time);
                $candidateDateTime = \Carbon\Carbon::parse($candidate->format('Y-m-d') . ' ' . $slotStart);

                if ($candidateDateTime->lessThanOrEqualTo(now())) {
                    $candidate->addDays(7);
                }
                $slotDate = $candidate->format('Y-m-d');
            } else {
                $slotDate = \Carbon\Carbon::today()->format('Y-m-d');
            }

            $startTime = $this->extractTimeOnly($slot->start_time);
            $endTime = $this->extractTimeOnly($slot->end_time);

            try {
                $slotDateTime = \Carbon\Carbon::parse($slotDate . ' ' . $startTime);
                $slotEndDateTime = \Carbon\Carbon::parse($slotDate . ' ' . $endTime);
            } catch (\Exception $e) {
                return response()->json(['status' => false, 'message' => 'Failed to parse slot datetime'], 500);
            }

            if ($slotDateTime->copy()->subHours(2)->isPast()) {
                return response()->json(['status' => false, 'message' => 'Slot must be at least 2 hours in the future'], 400);
            }

            $booking = Booking::create([
                'student_id' => $studentId,
                'teacher_id' => $request->teacher_id,
                'availability_slot_id' => $slot->id,
                'subscription_id' => $subscription->id,
                'session_type' => Booking::TYPE_SINGLE,
                'sessions_count' => $sessionsCount,
                'sessions_completed' => 0,
                'first_session_date' => $slotDateTime,
                'first_session_start_time' => $slotDateTime->format('H:i:s'),
                'first_session_end_time' => $slotEndDateTime->format('H:i:s'),
                'session_duration' => $slot->duration,
                'price_per_session' => 0,
                'teacher_rate_per_session' => 0,
                'subtotal' => 0,
                'total_amount' => 0,
                'currency' => 'SAR',
                'status' => Booking::STATUS_CONFIRMED,
                'booking_date' => now(),
            ]);

            for ($i = 0; $i < $sessionsCount; $i++) {
                $subscription->useSession();
            }

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

    private function extractTimeOnly($timeValue): string
    {
        if ($timeValue instanceof \Carbon\Carbon) {
            return $timeValue->format('H:i:s');
        }

        if (is_string($timeValue)) {
            // Check if it's a full datetime string like "2024-01-01 14:30:00"
            if (strpos($timeValue, ' ') !== false) {
                $parts = explode(' ', $timeValue);
                return $parts[1]; // Return just the time part
            }
            // Check if it has milliseconds like "14:30:00.000000"
            if (strpos($timeValue, '.') !== false) {
                $parts = explode('.', $timeValue);
                return $parts[0];
            }
            return $timeValue;
        }

        return '00:00:00';
    }
}
