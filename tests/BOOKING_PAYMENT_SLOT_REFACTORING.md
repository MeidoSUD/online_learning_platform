# Booking → Payment → Slot Booking Logic Refactoring

## Problem Statement

**Current (WRONG) Flow:**
```
1. Student creates booking
2. BookingController marks slot as booked (is_booked = true)
3. Sessions are created for the booking
4. Student is asked to pay
5. IF student doesn't pay → Slot remains booked! ❌
   - Other students can't book this slot
   - Slot is wasted
```

**Issues:**
- Slots are locked before payment confirmation
- If payment fails, slot remains unavailable
- Creates blocked/orphaned slots
- Poor user experience (reserves before purchase)

---

## Correct Flow (NEW)

```
1. Student creates booking
   ├─ Create Booking record: status = 'pending_payment'
   ├─ Create Sessions: status = 'pending_payment'
   ├─ DO NOT mark slot as booked yet! ✅
   └─ Return booking_id to student
   
2. Student initiates payment (PaymentController)
   ├─ POST /api/payments/checkout
   ├─ Create Payment record: status = 'initiated'
   └─ Return checkout_id for payment widget
   
3. Customer completes payment in widget
   
4. Moyasar webhook callback (MoyasarPaymentController)
   ├─ Payment confirmed: status = 'paid'
   ├─ BookingController.confirmBooking():
   │  ├─ Update Booking: status = 'confirmed'
   │  ├─ Update Sessions: status = 'confirmed'
   │  └─ ✅ ONLY NOW: Mark slot as booked!
   └─ Generate Agora tokens
   
5. IF payment fails/times out
   ├─ Payment status = 'failed'
   ├─ Booking remains 'pending_payment'
   ├─ Sessions remain 'pending_payment'
   ├─ ✅ Slot remains available for others!
   └─ Student can retry payment or book different slot
```

---

## Database Changes Required

### AvailabilitySlot table
```sql
-- Current (WRONG):
ALTER TABLE availability_slots ADD COLUMN is_booked BOOLEAN DEFAULT FALSE;

-- Should be:
-- Remove is_booked or change logic:
-- - is_booked should only be TRUE when associated payment is 'paid'
-- - Slot is only truly "booked" when booking is confirmed
```

### Booking table
```sql
-- Current state: OK
-- status = 'pending_payment' | 'confirmed' | 'cancelled' | 'completed'
-- ✅ Booking records can exist in pending_payment state
```

### Sessions table
```sql
-- Current state: OK
-- status = 'pending_payment' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
-- ✅ Sessions can exist in pending_payment state
```

### Payment table
```sql
-- Current state: OK (with Moyasar fields)
-- Fields: booking_id, gateway_payment_id, status = 'initiated' | 'paid' | 'failed'
-- ✅ Tracks payment lifecycle
```

---

## Code Changes Required

### 1. BookingController.createBooking()

**BEFORE (WRONG):**
```php
// Create booking
$booking = Booking::create([...]);

// ❌ WRONG: Mark slot as booked before payment
$slot->update(['is_available' => false, 'is_booked' => true, 'booking_id' => $booking->id]);

// Create sessions
Sessions::createForBooking($booking);

DB::commit();
```

**AFTER (CORRECT):**
```php
// Create booking (status = pending_payment)
$booking = Booking::create([...]);

// ✅ DO NOT mark slot as booked yet
// $slot->update(['is_available' => false, 'is_booked' => true, 'booking_id' => $booking->id]);
// Keep slot as available

// Create sessions (status = pending_payment)
Sessions::createForBooking($booking);

// Lock slot as "reserved" but not "booked"
$slot->update([
    'is_available' => true,  // Still available to query
    'is_booked' => false,    // Not yet booked
    'booking_id' => $booking->id,  // Track the tentative booking
    'reserved_until' => now()->addMinutes(15),  // Optional: expiry time for reservation
]);

DB::commit();

return response()->json([
    'success' => true,
    'data' => [
        'booking' => [...],
        'next_step' => 'POST /api/payments/checkout',
        'next_step_description' => 'Complete payment to confirm booking',
    ]
]);
```

### 2. New Method: BookingController.confirmBooking()

Create a new public method (called by PaymentController after payment succeeds):

```php
/**
 * Confirm a booking after successful payment
 * Called by PaymentController when Moyasar callback confirms payment
 * 
 * @param Booking $booking
 * @return void
 * @throws Exception
 */
public function confirmBooking(Booking $booking): void
{
    DB::beginTransaction();
    try {
        // Update booking status
        $booking->update(['status' => Booking::STATUS_CONFIRMED]);

        // Update all sessions to confirmed
        $booking->sessions()->update(['status' => Sessions::STATUS_CONFIRMED]);

        // ✅ NOW mark the slot as truly booked (after payment confirmed)
        if ($booking->sessions()->first()) {
            $session = $booking->sessions()->first();
            // Find the original slot
            $slot = AvailabilitySlot::where('id', $session->availability_slot_id ?? null)
                                    ->orWhere('id', $booking->availability_slot_id ?? null)
                                    ->first();
            
            if ($slot) {
                $slot->update([
                    'is_available' => false,
                    'is_booked' => true,
                    'booking_id' => $booking->id,
                    'reserved_until' => null,  // Clear reservation expiry
                ]);

                Log::info('Slot confirmed as booked', [
                    'slot_id' => $slot->id,
                    'booking_id' => $booking->id,
                ]);
            }
        }

        // Generate Agora tokens for sessions
        foreach ($booking->sessions as $session) {
            try {
                $session->generateAgoraToken();
            } catch (\Exception $e) {
                Log::error('Failed to generate Agora token', [
                    'session_id' => $session->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Send notifications
        $this->sendBookingConfirmedNotifications($booking);

        DB::commit();

        Log::info('Booking confirmed successfully', ['booking_id' => $booking->id]);

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Failed to confirm booking', [
            'booking_id' => $booking->id,
            'error' => $e->getMessage(),
        ]);
        throw $e;
    }
}

/**
 * Send notifications to student and teacher after booking is confirmed
 */
private function sendBookingConfirmedNotifications(Booking $booking): void
{
    try {
        $ns = new \App\Services\NotificationService();
        
        // Student notification
        $studentTitle = app()->getLocale() == 'ar' ? 'تم تأكيد الحجز' : 'Booking Confirmed';
        $studentMsg = app()->getLocale() == 'ar'
            ? "تم تأكيد حجزك ({$booking->booking_reference}). سيبدأ في {$booking->first_session_date}."
            : "Your booking ({$booking->booking_reference}) is confirmed. Starting {$booking->first_session_date}.";

        $ns->send($booking->student, 'booking_confirmed', $studentTitle, $studentMsg, [
            'booking_id' => $booking->id,
            'booking_reference' => $booking->booking_reference,
        ]);

        // Teacher notification
        $teacherTitle = app()->getLocale() == 'ar' ? 'حجز جديد مؤكد' : 'New Booking Confirmed';
        $teacherMsg = app()->getLocale() == 'ar'
            ? "لديك حجز جديد ({$booking->booking_reference}) من {$booking->student->name}."
            : "You have a new confirmed booking ({$booking->booking_reference}) from {$booking->student->name}.";

        $ns->send($booking->teacher, 'new_booking', $teacherTitle, $teacherMsg, [
            'booking_id' => $booking->id,
            'student_id' => $booking->student_id,
        ]);

    } catch (\Exception $e) {
        Log::error('Failed to send booking confirmation notifications', ['error' => $e->getMessage()]);
    }
}
```

### 3. PaymentController - After Payment Confirmed

In `paymentStatus()` method, after payment is marked as 'paid':

```php
if ($data['status'] === 'paid') {
    $payment->update([
        'status' => 'completed',
        'gateway_response' => json_encode($data),
        'paid_at' => now(),
    ]);

    // ✅ Get the booking and confirm it
    $booking = $payment->booking;
    if ($booking) {
        // This locks the slot and generates Agora tokens
        app(\App\Http\Controllers\API\BookingController::class)->confirmBooking($booking);
    }

    // ... rest of response
}
```

### 4. MoyasarPaymentController - Callback

In the callback handler, after payment is confirmed:

```php
if ($data['status'] === 'paid') {
    // Find payment by gateway_payment_id
    $payment = Payment::where('gateway_payment_id', $data['id'])->first();
    
    if ($payment) {
        $payment->update(['status' => 'paid', 'paid_at' => now()]);
        
        // ✅ Confirm the booking
        $booking = $payment->booking;
        if ($booking) {
            app(\App\Http\Controllers\API\BookingController::class)->confirmBooking($booking);
        }
    }
}
```

---

## API Behavior Changes

### Before Payment (Pending)

```
GET /api/bookings/1

{
  "data": {
    "booking": {
      "id": 1,
      "status": "pending_payment",  // ⏳ Not confirmed yet
      "sessions": [
        {
          "id": 1,
          "status": "pending_payment",  // ⏳ Sessions not active
          "agora_token": null  // ❌ No token yet
        }
      ]
    },
    "next_action": "Complete payment to activate booking"
  }
}
```

### After Payment (Confirmed)

```
GET /api/bookings/1

{
  "data": {
    "booking": {
      "id": 1,
      "status": "confirmed",  // ✅ Confirmed
      "sessions": [
        {
          "id": 1,
          "status": "confirmed",  // ✅ Active
          "agora_token": "eyJ0eXA...",  // ✅ Token ready
          "agora_channel": "session-1"
        }
      ]
    }
  }
}
```

---

## Slot Availability Logic

### Query Available Slots (for booking)

```php
// Get available slots - should exclude:
// 1. Already booked slots (is_booked = true)
// 2. Reserved slots that haven't expired (reserved_until > now)

$availableSlots = AvailabilitySlot::where('teacher_id', $teacherId)
    ->where('is_available', true)
    ->where('is_booked', false)
    ->where(function ($query) {
        $query->whereNull('reserved_until')
              ->orWhere('reserved_until', '<', now());
    })
    ->get();
```

### Check if Slot is Truly Available

```php
private function isSlotAvailable(AvailabilitySlot $slot): bool
{
    // Slot must be:
    // 1. Not already booked
    if ($slot->is_booked) {
        return false;
    }

    // 2. Not reserved (reservation not expired)
    if ($slot->reserved_until && $slot->reserved_until > now()) {
        return false;
    }

    // 3. Have an associated booking that is paid
    if ($slot->booking_id) {
        $booking = Booking::find($slot->booking_id);
        if ($booking && $booking->status !== Booking::STATUS_CONFIRMED) {
            // There's a pending booking - check if payment is expired
            if ($booking->created_at->addMinutes(15) < now()) {
                // Reservation expired, slot is available again
                $slot->update(['booking_id' => null, 'reserved_until' => null]);
                return true;
            }
            // Reservation still valid
            return false;
        }
    }

    return true;
}
```

---

## Payment Timeout Handling (Optional)

If you want to auto-release slots after payment timeout (15 minutes):

```php
// Booking::model - add method
public function releaseIfPaymentExpired()
{
    if ($this->status === Booking::STATUS_PENDING_PAYMENT) {
        if ($this->created_at->addMinutes(15) < now()) {
            // Payment window expired
            $this->update(['status' => Booking::STATUS_CANCELLED]);
            
            // Release the slot
            AvailabilitySlot::where('booking_id', $this->id)
                ->update(['booking_id' => null, 'reserved_until' => null]);
            
            return true;
        }
    }
    return false;
}

// In BookingController.getStudentBookings() or a scheduled task:
Booking::where('status', Booking::STATUS_PENDING_PAYMENT)
    ->get()
    ->each(fn($booking) => $booking->releaseIfPaymentExpired());
```

---

## Summary of Changes

| Component | Current (Wrong) | New (Correct) |
|-----------|-----------------|---------------|
| **Slot booking timing** | Before payment ❌ | After payment ✅ |
| **Status when booking created** | N/A | `pending_payment` ✅ |
| **Slot availability** | Locked before payment | Available until payment confirmed ✅ |
| **Agora token generation** | Immediate | Only after payment ✅ |
| **Failed payment** | Slot remains locked | Slot released ✅ |
| **API response** | Sessions with no tokens | Tokens after confirmation ✅ |

---

## Testing Checklist

- [ ] Create booking → Slot remains available
- [ ] Initiate payment → Booking status still pending_payment
- [ ] Cancel payment → Slot released, available for others
- [ ] Complete payment → Booking confirmed, slot locked, Agora tokens generated
- [ ] Verify other users can book same slot if first user doesn't pay
- [ ] Test payment timeout (15 min) → Slot auto-released
- [ ] Verify notifications sent only after confirmation

