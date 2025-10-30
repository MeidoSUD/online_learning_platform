<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Booking;
use App\Models\Course;
use App\Models\AvailabilitySlot;
use App\Models\Payment;
use App\Models\Sessions;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
class BookingController extends Controller
{
    /**
     * Create a new booking
     */
    public function createBooking(Request $request): JsonResponse
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'availability_slot_id' => 'required|exists:availability_slots,id',
            'course_type' => 'required|in:single,package',
            'sessions_count' => 'required_if:course_type,package|integer|min:1|max:50',
            'special_requests' => 'nullable|string|max:500',
            'payment_method' => 'required|in:card,wallet,bank_transfer',
        ]);

        DB::beginTransaction();
        try {
            $course = Course::with('teacher')->findOrFail($request->course_id);
            $slot = AvailabilitySlot::findOrFail($request->availability_slot_id);
            
            // Check if slot is still available
            if (!$slot->is_available || $slot->is_booked) {
                return response()->json([
                    'success' => false,
                    'message' => 'This time slot is no longer available'
                ], 400);
            }

            // Check if slot belongs to the same teacher
            if ($slot->teacher_id !== $course->teacher_id || $slot->course_id !== $course->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid time slot for this course'
                ], 400);
            }

            // Check booking advance time (minimum 2 hours)
            $date = $slot->date instanceof \Carbon\Carbon ? $slot->date->format('Y-m-d') : $slot->date;
            $startTime = $slot->start_time instanceof \Carbon\Carbon
                ? $slot->start_time->format('H:i:s')
                : $slot->start_time;

            // Debug output
            $debugString = "date: " . var_export($date, true) . ", startTime: " . var_export($startTime, true);

            try {
                $slotDateTime = Carbon::parse($date . ' ' . $startTime);
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to parse slot date/time',
                    'debug' => $debugString,
                    'error' => $e->getMessage()
                ], 500);
            }
            if ($slotDateTime->subHours(2)->isPast()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bookings must be made at least 2 hours in advance'
                ], 400);
            }

            $studentId = auth()->id();
            $sessionsCount = $request->session_type === 'package' ? $request->sessions_count : 1;
            
            // Calculate pricing
            $basePrice = $course->price_per_hour;
            $sessionDuration = $course->session_duration; // in minutes
            $pricePerSession = ($basePrice * $sessionDuration) / 60;
            
            // Apply package discount if applicable
            $discount = 0;
            if ($sessionsCount > 1) {
                $discount = $this->calculatePackageDiscount($sessionsCount);
            }
            
            $subtotal = $pricePerSession * $sessionsCount;
            $discountAmount = $subtotal * ($discount / 100);
            $total = $subtotal - $discountAmount;

            // Create booking
            $booking = Booking::create([
                'student_id' => $studentId,
                'teacher_id' => $course->teacher_id,
                'course_id' => $course->id,
                'booking_reference' => $this->generateBookingReference(),
                'session_type' => $request->session_type,
                'sessions_count' => $sessionsCount,
                'sessions_completed' => 0,
                'first_session_date' => $slot->date,
                'first_session_start_time' => $slot->start_time,
                'first_session_end_time' => $slot->end_time,
                'session_duration' => $sessionDuration,
                'price_per_session' => $pricePerSession,
                'subtotal' => $subtotal,
                'discount_percentage' => $discount,
                'discount_amount' => $discountAmount,
                'total_amount' => $total,
                'currency' => $course->currency ?? 'SAR',
                'special_requests' => $request->special_requests,
                'status' => 'pending_payment',
                'booking_date' => now(),
            ]);

            // Mark the slot as booked
            $slot->update([
                'is_booked' => true,
                'booking_id' => $booking->id
            ]);
            // create session records
            Sessions::createForBooking($booking);
            // Create payment record
            $payment = Payment::create([
                'booking_id' => $booking->id,
                'student_id' => $studentId,
                'teacher_id' => $course->teacher_id,
                'amount' => $total,
                'currency' => $course->currency ?? 'SAR',
                'payment_method' => $request->payment_method,
                'status' => 'pending',
                'transaction_reference' => $this->generateTransactionReference(),
            ]);

            DB::commit();

            // Here you would integrate with your payment gateway
            $paymentUrl = $this->processPayment($payment, $request->payment_method);

            return response()->json([
                'success' => true,
                'message' => 'Booking created successfully',
                'data' => [
                    'booking' => [
                        'id' => $booking->id,
                        'reference' => $booking->booking_reference,
                        'status' => $booking->status,
                        'total_amount' => $booking->total_amount,
                        'currency' => $booking->currency,
                    ],
                    'payment_url' => $paymentUrl,
                    'payment_reference' => $payment->transaction_reference,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create booking',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get student's bookings
     */
    public function getStudentBookings(Request $request): JsonResponse
    {
        $studentId = auth()->id();
        $status = $request->get('status', 'all'); // all, upcoming, completed, cancelled
        $perPage = $request->get('per_page', 10);

        $query = Booking::with([
            'course.subject',
            'course.service',
            'teacher.profile'
        ])->where('student_id', $studentId);

        // Filter by status
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
            return [
                'id' => $booking->id,
                'reference' => $booking->booking_reference,
                'teacher' => [
                    'id' => $booking->teacher->id,
                    'name' => $booking->teacher->first_name.' '.$booking->teacher->last_name,
                    'avatar' => $booking->teacher->profile->avatar ?? null,
                    'nationality' => $booking->teacher->profile->nationality ?? null,
                ],
                'course' => [
                    'subject_en' => $booking->course->subject->name_en,
                ],
                'session_info' => [
                    'type' => $booking->session_type,
                    'total_sessions' => $booking->sessions_count,
                    'completed_sessions' => $booking->sessions_completed,
                    'remaining_sessions' => $booking->sessions_count - $booking->sessions_completed,
                    'duration' => $booking->session_duration . ' minutes',
                    'join_url' => $booking->status === 'confirmed' ? route('sessions.join', ['booking_id' => $booking->id]) : null,
                    'host_url' => $booking->status === 'confirmed' ? route('sessions.host', ['booking_id' => $booking->id]) : null,
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
                'can_cancel' => $this->canCancelBooking($booking),
                'can_reschedule' => $this->canRescheduleBooking($booking),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $transformedBookings,
            'pagination' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ]
        ]);
    }

    /**
     * Get detailed booking information
     */
    public function getBookingDetails($bookingId): JsonResponse
    {
        $studentId = auth()->id();
        
        $booking = Booking::with([
            'course.subject',
            'course.service',
            'course.educationLevel',
            'course.classLevel',
            'teacher.profile',
            'payment',
            'sessions' => function($query) {
                $query->orderBy('session_date')->orderBy('start_time');
            }
        ])->where('student_id', $studentId)
          ->findOrFail($bookingId);

        $date = $booking->first_session_date instanceof \Carbon\Carbon
            ? $booking->first_session_date->format('Y-m-d')
            : substr($booking->first_session_date, 0, 10);

        $startTime = $booking->first_session_start_time instanceof \Carbon\Carbon
            ? $booking->first_session_start_time->format('H:i:s')
            : (strlen($booking->first_session_start_time) > 8
                ? Carbon::parse($booking->first_session_start_time)->format('H:i:s')
                : $booking->first_session_start_time);

        $debugString = "date: " . var_export($date, true) . ", startTime: " . var_export($startTime, true);

        try {
            $firstSessionDateTime = Carbon::parse($date . ' ' . $startTime);
        } catch (\Exception $e) {
            // Log or return the debug info
            throw new \Exception('Failed to parse session datetime. Debug: ' . $debugString . ' Error: ' . $e->getMessage());
        }

        $bookingDetails = [
            'id' => $booking->id,
            'reference' => $booking->booking_reference,
            'status' => $booking->status,
            'booking_date' => $booking->booking_date->format('Y-m-d H:i'),
            
            'teacher' => [
                'id' => $booking->teacher->id,
                'name' => $booking->teacher->first_name.' '.$booking->teacher->last_name,
                'avatar' => $booking->teacher->profile->avatar ?? null,
                'gender' => $booking->teacher->profile->gender ?? null,
                'nationality' => $booking->teacher->profile->nationality ?? null,
                'phone' => $booking->status === 'confirmed' ? $booking->teacher->phone : null,
                'email' => $booking->status === 'confirmed' ? $booking->teacher->email : null,
            ],
            
            'course' => [
                'id' => $booking->course->id,
                'subject' => $booking->course->subject->name_en,
                'education_level' => $booking->course->educationLevel->name_en ?? null,
                'class_level' => $booking->course->classLevel->name_en ?? null,
                'description' => $booking->course->description,
            ],
            
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
                'can_cancel' => $this->canCancelBooking($booking),
                'can_reschedule' => $this->canRescheduleBooking($booking),
                'can_review' => $this->canReviewBooking($booking),
                'can_join_session' => $this->canJoinSession($booking),
            ]
        ];

        return response()->json([
            'success' => true,
            'data' => $bookingDetails
        ]);
    }

    /**
     * Cancel a booking
     */
    public function cancelBooking($bookingId): JsonResponse
    {
        $studentId = auth()->id();
        
        $booking = Booking::where('student_id', $studentId)
                         ->findOrFail($bookingId);

        if (!$this->canCancelBooking($booking)) {
            return response()->json([
                'success' => false,
                'message' => 'This booking cannot be cancelled'
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Calculate refund amount based on cancellation policy
            $refundInfo = $this->calculateRefund($booking);
            
            // Update booking status
            $booking->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancellation_reason' => 'Cancelled by student',
                'refund_amount' => $refundInfo['refund_amount'],
                'refund_percentage' => $refundInfo['refund_percentage'],
            ]);

            // Free up the availability slot
            AvailabilitySlot::where('booking_id', $booking->id)
                           ->update([
                               'is_booked' => false,
                               'booking_id' => null
                           ]);

            // Process refund if applicable
            if ($refundInfo['refund_amount'] > 0) {
                $this->processRefund($booking, $refundInfo['refund_amount']);
            }

            // Cancel future sessions
            $booking->sessions()
                   ->where('status', 'scheduled')
                   ->update(['status' => 'cancelled']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Booking cancelled successfully',
                'data' => [
                    'refund_amount' => $refundInfo['refund_amount'],
                    'refund_percentage' => $refundInfo['refund_percentage'],
                    'processing_time' => '3-5 business days',
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel booking',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper methods
     */
    private function generateBookingReference(): string
    {
        return 'BK' . now()->format('Ymd') . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    private function generateTransactionReference(): string
    {
        return 'TXN' . now()->format('YmdHis') . rand(1000, 9999);
    }

    private function calculatePackageDiscount(int $sessionsCount): float
    {
        if ($sessionsCount >= 20) return 20; // 20% discount for 20+ sessions
        if ($sessionsCount >= 10) return 15; // 15% discount for 10+ sessions
        if ($sessionsCount >= 5) return 10;  // 10% discount for 5+ sessions
        return 0;
    }

    // private function processPayment($payment, $paymentMethod): string
    // {
    //     // Integrate with your payment gateway (e.g., Stripe, PayPal, local Saudi gateways)
    //     // This is a placeholder - implement actual payment processing
        
    //     switch ($paymentMethod) {
    //         case 'card':
    //             return 'https://payment-gateway.com/pay/' . $payment->transaction_reference;
    //         case 'wallet':
    //             return 'https://wallet-service.com/pay/' . $payment->transaction_reference;
    //         case 'bank_transfer':
    //             return 'https://bank-transfer.com/pay/' . $payment->transaction_reference;
    //         default:
    //             return '';
    //     }
    // }

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

    private function canCancelBooking($booking): bool
    {
        if (in_array($booking->status, ['cancelled', 'completed'])) {
            return false;
        }

        // Fix: Extract date and time correctly
        $date = $booking->first_session_date instanceof \Carbon\Carbon
            ? $booking->first_session_date->format('Y-m-d')
            : substr($booking->first_session_date, 0, 10);

        $startTime = $booking->first_session_start_time instanceof \Carbon\Carbon
            ? $booking->first_session_start_time->format('H:i:s')
            : (strlen($booking->first_session_start_time) > 8
                ? Carbon::parse($booking->first_session_start_time)->format('H:i:s')
                : $booking->first_session_start_time);

        $firstSessionDateTime = Carbon::parse($date . ' ' . $startTime);
        return $firstSessionDateTime->subHours(24)->isFuture();
    }

    private function canRescheduleBooking($booking): bool
    {
        if (in_array($booking->status, ['cancelled', 'completed'])) {
            return false;
        }

        $date = $booking->first_session_date instanceof \Carbon\Carbon
            ? $booking->first_session_date->format('Y-m-d')
            : substr($booking->first_session_date, 0, 10);

        $startTime = $booking->first_session_start_time instanceof \Carbon\Carbon
            ? $booking->first_session_start_time->format('H:i:s')
            : (strlen($booking->first_session_start_time) > 8
                ? Carbon::parse($booking->first_session_start_time)->format('H:i:s')
                : $booking->first_session_start_time);

        $firstSessionDateTime = Carbon::parse($date . ' ' . $startTime);
        return $firstSessionDateTime->subHours(4)->isFuture();
    }

    private function canReviewBooking($booking): bool
    {
        return $booking->status === 'completed' && $booking->sessions_completed > 0;
    }

    private function canJoinSession($booking): bool
    {
        if ($booking->status !== 'confirmed') {
            return false;
        }

        $now = now();

        $date = $booking->first_session_date instanceof \Carbon\Carbon
            ? $booking->first_session_date->format('Y-m-d')
            : substr($booking->first_session_date, 0, 10);

        $startTime = $booking->first_session_start_time instanceof \Carbon\Carbon
            ? $booking->first_session_start_time->format('H:i:s')
            : (strlen($booking->first_session_start_time) > 8
                ? Carbon::parse($booking->first_session_start_time)->format('H:i:s')
                : $booking->first_session_start_time);

        $endTime = $booking->first_session_end_time instanceof \Carbon\Carbon
            ? $booking->first_session_end_time->format('H:i:s')
            : (strlen($booking->first_session_end_time) > 8
                ? Carbon::parse($booking->first_session_end_time)->format('H:i:s')
                : $booking->first_session_end_time);

        $firstSessionDateTime = Carbon::parse($date . ' ' . $startTime);
        $sessionEndTime = Carbon::parse($date . ' ' . $endTime);

        // Allow joining 15 minutes before session starts until session ends
        return $now->between($firstSessionDateTime->subMinutes(15), $sessionEndTime);
    }

    private function calculateRefund($booking): array
    {
        $firstSessionDateTime = Carbon::parse($booking->first_session_date . ' ' . $booking->first_session_start_time);
        $hoursUntilSession = now()->diffInHours($firstSessionDateTime);

        // Refund policy based on cancellation time
        if ($hoursUntilSession >= 48) {
            $refundPercentage = 100; // Full refund
        } elseif ($hoursUntilSession >= 24) {
            $refundPercentage = 80; // 80% refund
        } elseif ($hoursUntilSession >= 4) {
            $refundPercentage = 50; // 50% refund
        } else {
            $refundPercentage = 0; // No refund
        }

        $refundAmount = ($booking->total_amount * $refundPercentage) / 100;

        return [
            'refund_percentage' => $refundPercentage,
            'refund_amount' => $refundAmount,
        ];
    }

    private function processRefund($booking, $refundAmount): void
    {
        // Implement refund processing logic
        // This would integrate with your payment gateway's refund API
        
        // Create refund record
        $booking->payment->update([
            'refund_amount' => $refundAmount,
            'refund_status' => 'processing',
            'refund_processed_at' => now(),
        ]);
    }
}