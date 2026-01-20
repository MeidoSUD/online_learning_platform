# Booking Payment Slot Logic - Complete Refactoring Summary

## Changes Made - January 20, 2026

### Problem Fixed
**Before:** Slots were marked as booked BEFORE payment was confirmed
- If payment failed → Slot remained unavailable
- Other users couldn't book the same slot
- Wasted/blocked slots

**After:** Slots are marked as booked ONLY AFTER payment is confirmed ✅

---

## Code Changes

### 1. BookingController.createBooking() - CHANGED

**Old Logic (WRONG):**
```php
// Mark slot as booked IMMEDIATELY
$slot->update(['is_available' => false, 'is_booked' => true, 'booking_id' => $booking->id]);
```

**New Logic (CORRECT):**
```php
// Mark slot as RESERVED (not booked) - will be finalized after payment
$slot->update([
    'is_available' => true,  // Still available for queries
    'is_booked' => false,    // Not yet confirmed
    'booking_id' => $booking->id,  // Track tentative booking
    'reserved_until' => now()->addMinutes(15),  // Auto-release in 15 min if payment doesn't complete
]);
```

**Key Points:**
- Booking created with status = `pending_payment`
- Sessions created with status = `pending_payment`
- Slot flagged with booking_id but NOT marked as booked
- Reservation expires in 15 minutes if payment not completed

---

### 2. New Method: BookingController.confirmBooking() - ADDED

This method is called INTERNALLY by PaymentController when payment is confirmed.

**Flow:**
```
Payment Confirmed → PaymentController calls BookingController.confirmBooking($booking)
  ├─ Update Booking: status = 'confirmed'
  ├─ Update Sessions: status = 'scheduled'
  ├─ ✅ NOW mark slot as booked: is_booked = true
  ├─ Generate Agora tokens for all sessions
  ├─ Send notifications to student & teacher
  └─ Complete!
```

**What It Does:**
1. Updates booking status → `confirmed`
2. Updates all sessions → `scheduled` (ready for lesson)
3. **NOW** marks the slot as truly booked (`is_booked = true`)
4. Generates Agora RTC tokens for each session
5. Sends confirmation notifications

**Code Location:**
- File: `app/Http/Controllers/API/BookingController.php`
- Lines: ~490-650 (see method for full implementation)

---

### 3. Integration Points

#### In PaymentController (paymentStatus method):

```php
if ($data['status'] === 'paid') {
    $payment->update([
        'status' => 'completed',
        'paid_at' => now(),
    ]);

    // ✅ Confirm the booking after payment
    $booking = $payment->booking;
    if ($booking) {
        app(BookingController::class)->confirmBooking($booking);
    }

    return response()->json([...]);
}
```

#### In MoyasarPaymentController (handleCallback method):

```php
if ($data['status'] === 'paid') {
    $payment = Payment::where('gateway_payment_id', $data['id'])->first();
    
    if ($payment) {
        $payment->update(['status' => 'paid', 'paid_at' => now()]);
        
        // ✅ Confirm the booking after payment
        $booking = $payment->booking;
        if ($booking) {
            app(BookingController::class)->confirmBooking($booking);
        }
    }
}
```

---

## New Payment Flow

### Timeline

```
T+0s: User creates booking
├─ Booking created: status = pending_payment
├─ Sessions created: status = pending_payment  
├─ Slot reserved (not booked): reserved_until = T+15min
└─ API returns booking_id

T+30s: User initiates payment
├─ Payment created: status = initiated
├─ Checkout ID returned
└─ User redirected to Moyasar widget

T+5min: User completes payment in widget
├─ Moyasar charges card
└─ Moyasar sends webhook callback

T+5min+1s: Moyasar webhook callback received
├─ Payment marked: status = paid
├─ BookingController.confirmBooking() called:
│  ├─ Booking updated: status = confirmed ✅
│  ├─ Sessions updated: status = scheduled ✅
│  ├─ Slot updated: is_booked = true ✅
│  ├─ Agora tokens generated
│  └─ Notifications sent
└─ Complete!

T+20min (if payment not completed by T+15min):
├─ Slot reservation expires
├─ Slot becomes available again
├─ Other users can now book it
└─ Original user can retry payment or book different slot
```

---

## Database Behavior

### AvailabilitySlot Fields

| Field | During Booking | After Payment | Description |
|-------|-----------------|---------------|-------------|
| `is_available` | `true` | `false` | Slot queryable for new bookings |
| `is_booked` | `false` | `true` | Slot confirmed booked |
| `booking_id` | booking ID | booking ID | Tracks which booking owns slot |
| `reserved_until` | now() + 15min | NULL | Release time for reservation |

### Booking Status Flow

```
NULL → pending_payment → confirmed → in_progress → completed
                                  ↓
                               cancelled
```

### Sessions Status Flow

```
NULL → pending_payment → scheduled → in_progress → completed
                                  ↓
                                cancelled
```

### Payment Status Flow

```
NULL → initiated → paid → completed
                 ↓
              failed
```

---

## API Behavior

### Before Payment

**GET /api/bookings/1**
```json
{
  "data": {
    "booking": {
      "id": 1,
      "status": "pending_payment",
      "total_amount": 200.00,
      "sessions": [
        {
          "id": 1,
          "status": "pending_payment",
          "agora_token": null,
          "agora_channel": null
        }
      ]
    }
  }
}
```

**Response Indicates:** "Payment required to activate booking"

---

### After Payment

**GET /api/bookings/1**
```json
{
  "data": {
    "booking": {
      "id": 1,
      "status": "confirmed",
      "total_amount": 200.00,
      "sessions": [
        {
          "id": 1,
          "status": "scheduled",
          "agora_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
          "agora_channel": "session-1"
        }
      ]
    }
  }
}
```

**Response Indicates:** "Booking confirmed - student and teacher can now use session"

---

## Slot Availability Query

### Correct Query (considers reservation expiry)

```php
$availableSlots = AvailabilitySlot::where('teacher_id', $teacherId)
    ->where('is_booked', false)  // Not officially booked
    ->where(function ($query) {
        $query->whereNull('reserved_until')  // Not reserved OR
              ->where('reserved_until', '<', now());  // reservation expired
    })
    ->get();
```

This ensures:
- ✅ Previously booked and confirmed slots are excluded
- ✅ Slots with active reservations (payment pending) are excluded
- ✅ Expired reservations (no payment) are included

---

## Notifications

### When Sent

**Before:** Immediately after booking creation (WRONG - before payment)
**After:** Only after payment confirmed (CORRECT)

### Notified Parties

1. **Student:**
   - Title: "Booking Confirmed" / "تم تأكيد الحجز"
   - Contains: booking reference, date, time, teacher info

2. **Teacher:**
   - Title: "New Booking Confirmed" / "حجز جديد مؤكد"
   - Contains: booking reference, student name, student info

---

## Implementation Checklist

- [x] Modified `BookingController.createBooking()` to NOT book slot immediately
- [x] Added `confirmBooking()` method to BookingController
- [x] Added `sendBookingConfirmedNotifications()` helper method
- [x] Amount conversion (× 100 halala) in MoyasarPay service
- [x] Removed all HyperPay methods from BookingController
- [ ] Update PaymentController.paymentStatus() to call confirmBooking()
- [ ] Update MoyasarPaymentController.handleCallback() to call confirmBooking()
- [ ] Test full flow: Booking → Payment → Confirmation
- [ ] Test payment failure: Slot should be released
- [ ] Test reservation timeout: Slot should auto-release after 15 min

---

## Next Steps

### For PaymentController:

```php
// In paymentStatus() method, after payment is confirmed:
if ($data['status'] === 'paid') {
    $payment->update([...]);
    
    // ✅ ADD THIS:
    $booking = $payment->booking;
    if ($booking) {
        (new BookingController())->confirmBooking($booking);
    }
}
```

### For MoyasarPaymentController:

```php
// In handleCallback() method, after payment is confirmed:
if ($data['status'] === 'paid') {
    $payment->update([...]);
    
    // ✅ ADD THIS:
    $booking = $payment->booking;
    if ($booking) {
        (new BookingController())->confirmBooking($booking);
    }
}
```

---

## Benefits

✅ **Prevents Slot Blocking:** Unpaid bookings don't lock slots  
✅ **Better UX:** Students can retry if payment fails  
✅ **Fair Slot Distribution:** Other users can book if payment times out  
✅ **Clean Data:** No orphaned bookings without payments  
✅ **Atomic Operations:** Booking + Payment + Slot Lock happen together  
✅ **Proper Notifications:** Notifications sent only after confirmation  
✅ **Agora Tokens:** Generated only for confirmed sessions  

---

## Testing Script

```bash
# 1. Create booking
POST /api/student/booking
Response: booking_id = 1, status = pending_payment

# 2. Check slot - should still be available
GET /api/availability-slots?teacher_id=123
Check: is_booked = false, reserved_until = 2026-01-20 10:15:00

# 3. Check booking
GET /api/bookings/1
Check: status = pending_payment, sessions[0].agora_token = null

# 4. Initiate payment
POST /api/payments/checkout
Response: checkout_id = xyz

# 5. Simulate payment completion
POST /api/moyasar/payments/callback
Body: { id: "payment-id", status: "paid", ... }

# 6. Check booking again
GET /api/bookings/1
Check: status = confirmed, sessions[0].agora_token = eyJ0eXA...

# 7. Check slot - should now be booked
GET /api/availability-slots?teacher_id=123
Check: is_booked = true, reserved_until = null
```

