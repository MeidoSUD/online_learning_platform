# Service Booking Flow Guide (Payment-First Model)

## Overview

This guide documents the complete flow for service bookings (private lessons, language study, courses) in the Ewan learning platform. The booking flow has been refactored to a **payment-first model** where slots are only locked and sessions created AFTER successful payment.

---

## Key Principle: Defer Slot Locking Until Payment Success ✅

**OLD FLOW (❌ Not Used)**:
```
1. Student creates booking
   ↓
2. Slot immediately marked as booked (is_booked=true)
3. Sessions created
   ↓
4. Student pays
   ↓
5. Problem: If payment fails, slot still locked!
```

**NEW FLOW (✅ Current)**:
```
1. Student creates booking
   ↓
2. Booking status: pending_payment
3. Slot: STAYS AVAILABLE (is_booked=false, is_available=true)
4. No sessions created yet
   ↓
5. Student initiates payment via PaymentController
   ↓
6. Moyasar processes payment
   ↓
7. Upon SUCCESS in PaymentController.paymentStatus():
   ↓
   a) Slot marked booked (is_booked=true, is_available=false, booking_id=$id)
   b) Sessions created with proper titles
   c) Booking status → confirmed
   d) Notifications sent
   ↓
8. Student can now join sessions
```

---

## Request Example: Service Booking with Language

### HTTP Request

```http
POST /api/student/booking
Content-Type: application/json
Authorization: Bearer {token}

{
  "id": 79218,                 // Student ID (from auth)
  "teacher_id": 27,            // Teacher providing service
  "timeslot_id": 64,           // Availability slot for the session
  "type": "single",            // single or package
  "language_id": 1,            // Language to learn (if language_study service)
  "service_id": 2              // Service ID (2 = language_study)
}
```

### Service Types Reference

| ID | Service Key | Description |
|----|---|---|
| 1 | private_lessons | One-on-one private lessons |
| 2 | language_study | Language learning service |
| 3 | courses | Group courses |

### Language ID Reference

Query: `GET /api/languages` or check `languages` table:
- 1 = English
- 2 = Arabic
- 3 = Mandarin
- 4 = French
- etc.

---

## API Response: Booking Created (Pending Payment)

### Success Response (HTTP 201)

```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "id": 12345,
      "reference": "BK-20260128-0001",
      "status": "pending_payment",
      "total_amount": 150.00,
      "currency": "SAR",
      "teacher": {
        "id": 27,
        "name": "Ahmed Al-Rasheed",
        "avatar": "https://...",
        "rating": 4.8,
        "verified": true
      },
      "student_id": 79218,
      "first_session_date": "2026-02-01",
      "first_session_start_time": "18:00:00",
      "session_type": "single",
      "sessions_count": 1
    },
    "requires_payment_method": false,
    "meta": {
      "service": {
        "id": 2,
        "name": "Language Study",
        "description": "Learn new languages with expert teachers"
      },
      "subject": {
        "id": 1,
        "name_en": "English",
        "name_ar": "الإنجليزية"
      },
      "timeslot": {
        "id": 64,
        "day_number": 5,              // 0-6 (Sunday-Saturday)
        "day_name": "Friday",
        "start_time": "18:00:00",
        "end_time": "19:00:00",
        "duration": 60                // minutes
      }
    }
  }
}
```

### Status at This Point

| Field | Value | Explanation |
|-------|-------|---|
| `booking.status` | `pending_payment` | Waiting for payment |
| `slot.is_available` | `true` | ✅ Slot NOT yet locked - can be booked by others if they pay first |
| `slot.is_booked` | `false` | ✅ Slot NOT linked to booking |
| `sessions` | None created | ✅ Sessions will be created after payment |

---

## Step 2: Student Initiates Payment

### Endpoint

```http
POST /api/payments/checkout
Content-Type: application/json
Authorization: Bearer {token}

{
  "booking_id": 12345,
  "payment_method": "VISA",      // or MASTER, MADA
  "amount": 150.00,
  "currency": "SAR"
}
```

### Response: Moyasar Checkout Created

```json
{
  "success": true,
  "message": "Checkout created. Complete payment.",
  "data": {
    "payment_id": 5678,
    "transaction_reference": "TXN-20260128-000123",
    "checkout_id": "chk_xxx",
    "amount": 150.00,
    "currency": "SAR"
  }
}
```

---

## Step 3: Moyasar Payment Widget

Student completes payment using Moyasar's payment widget (web or mobile). Upon completion, Moyasar returns status to app.

---

## Step 4: Payment Status Verification

### Endpoint

```http
POST /api/payments/status
Content-Type: application/json

{
  "payment_id": 5678,
  "checkout_id": "chk_xxx"
}
```

### Response on Success

```json
{
  "success": true,
  "message": "Payment successful",
  "data": {
    "payment_id": 5678,
    "booking_id": 12345,
    "status": "confirmed",
    "payment_status": "paid"
  }
}
```

---

## What Happens in PaymentController.paymentStatus() After Success

```php
// Inside PaymentController::paymentStatus()

// 1. Update payment record to 'paid'
$payment->update(['status' => 'paid', 'paid_at' => now()]);

// 2. Get the booking
$booking = $payment->booking;

// 3. ⭐ LOCK THE SLOT - This is where slot gets booked!
$slot = AvailabilitySlot::find($booking->availability_slot_id);
$slot->update([
    'is_available' => false,     // No longer available
    'is_booked' => true,         // Now booked
    'booking_id' => $booking->id // Link to booking
]);

// 4. ⭐ CREATE SESSIONS with proper titles
Sessions::createForBooking($booking);
// This calls createForBooking() which generates session_title based on:
//   - Service name (e.g., "Language Study")
//   - Language (if language_study service, e.g., "English")
//   - Result: "Language Study - English" or just "Language Study"

// 5. Update booking status
$booking->update(['status' => Booking::STATUS_CONFIRMED]);

// 6. Send notifications to student and teacher
$ns->send($booking->student, 'payment_success', ...);
$ns->send($booking->teacher, 'booking_received', ...);

// 7. Schedule session meeting links generation (Agora/Zoom)
$this->scheduleSessionMeetingJobs($booking);
```

---

## Session Title Format for Service Bookings

### Current Implementation

The session title is generated in `Sessions::createForBooking()` based on booking type:

### Session Title Rules

| Service Type | Language | Session Title | Example |
|---|---|---|---|
| Language Study | Yes | `[Service] - [Language]` | "Language Study - English" |
| Language Study | No | `[Service]` | "Language Study" |
| Private Lessons | Any | `[Service]` | "Private Lessons" |
| Courses | Any | `[Service]` | "Courses" |

### Implementation in Sessions Model

```php
// In Sessions::createForBooking($booking)

$booking = $booking->load('course', 'service', 'subject');
$service = $booking->service; // From services table
$language = $booking->language; // From languages table
$language = $booking->subject; // Language might also come from subject

// Build session_title
$session_title = $service->name ?? 'Session';

if ($service->key_name === 'language_study' && $language) {
    $session_title = "{$service->name} - {$language->name_en}";
}

// Then when creating session:
$session = Session::create([
    'booking_id' => $booking->id,
    'student_id' => $booking->student_id,
    'teacher_id' => $booking->teacher_id,
    'session_title' => $session_title,  // ⭐ Set proper title
    'session_date' => $booking->first_session_date,
    'start_time' => $booking->first_session_start_time,
    'end_time' => $booking->first_session_end_time,
    'duration' => $booking->session_duration,
    'status' => 'scheduled',
]);
```

---

## Database State Changes Through Flow

### After createBooking()

```sql
-- bookings table
┌────┬─────────┬────────────────────┬──────────┐
│ id │ student_id │ teacher_id │ status     │
├────┼────────┼─────────────────────┼──────────┤
│ 12345 │ 79218    │ 27      │ pending_payment │
└────┴────────┴────────────────────┴──────────┘

-- availability_slots table
┌────┬──────────┬────────────┬──────────┬─────────────┐
│ id │ teacher_id │ is_available │ is_booked │ booking_id  │
├────┼───────────┼────────────┼──────────┼─────────────┤
│ 64 │ 27       │ 1 (true)   │ 0 (false) │ NULL        │
└────┴───────────┴────────────┴──────────┴─────────────┘

-- sessions table
(Empty - no sessions created yet)
```

### After paymentStatus() Success

```sql
-- bookings table
┌────┬─────────┬────────────────────┬──────────┐
│ id │ student_id │ teacher_id │ status     │
├────┼────────┼─────────────────────┼──────────┤
│ 12345 │ 79218    │ 27      │ confirmed  │ ⭐ Updated
└────┴────────┴────────────────────┴──────────┘

-- availability_slots table
┌────┬──────────┬────────────┬──────────┬─────────────┐
│ id │ teacher_id │ is_available │ is_booked │ booking_id  │
├────┼───────────┼────────────┼──────────┼─────────────┤
│ 64 │ 27       │ 0 (false)  │ 1 (true)  │ 12345       │ ⭐ Updated
└────┴───────────┴────────────┴──────────┴─────────────┘

-- sessions table
┌────┬────────────┬────────────────────┬──────────────────┬────────────────┐
│ id │ booking_id │ session_title      │ session_date     │ status         │
├────┼────────────┼────────────────────┼──────────────────┼────────────────┤
│ 9999 │ 12345    │ Language Study - English │ 2026-02-01   │ scheduled      │ ⭐ Created
└────┴────────────┴────────────────────┴──────────────────┴────────────────┘
```

---

## Error Scenarios

### Scenario 1: Slot Becomes Unavailable During Payment

```
1. Student 1 creates booking → slot still available
2. Student 1 starts payment
3. Student 2 also creates booking for SAME slot → slot still available
4. Student 2 pays first → Student 2's slot gets booked
5. Student 1 pays → Should get error: "Slot already booked by another student"
```

**Implementation**: Add validation in `PaymentController.paymentStatus()`:

```php
// Before marking slot as booked, check if it's still available
$slot = AvailabilitySlot::lockForUpdate()->findOrFail($booking->availability_slot_id);

if ($slot->is_booked || !$slot->is_available) {
    return response()->json([
        'success' => false,
        'message' => 'This slot was just booked by another student. Payment not confirmed.',
        'error' => 'SLOT_NO_LONGER_AVAILABLE'
    ], 409);
}

// Now safe to book it
$slot->update(['is_available' => false, 'is_booked' => true, ...]);
```

### Scenario 2: Payment Fails

```
1. Student creates booking → slot available
2. Student initiates payment
3. Payment fails
4. Booking status stays: pending_payment
5. Slot remains: available, not booked
6. ✅ Slot is NOT locked - available for other students!
```

---

## Mobile App Integration (Flutter)

### Create Booking

```dart
Future<void> createServiceBooking() async {
  final response = await http.post(
    Uri.parse('${apiBaseUrl}/student/booking'),
    headers: {'Authorization': 'Bearer $token'},
    body: jsonEncode({
      'service_id': 2,           // language_study
      'teacher_id': 27,
      'timeslot_id': 64,
      'type': 'single',
      'language_id': 1,          // English
    }),
  );
  
  if (response.statusCode == 201) {
    final booking = jsonDecode(response.body)['data']['booking'];
    print('Booking created: ${booking['id']}');
    print('Status: ${booking['status']}'); // pending_payment
    print('Service: ${response.body['data']['meta']['service']['name']}');
    print('Language: ${response.body['data']['meta']['subject']['name_en']}');
    
    // Now initiate payment
    await initiatePayment(booking['id']);
  }
}
```

### Initiate Payment (Moyasar Widget)

```dart
Future<void> initiatePayment(int bookingId) async {
  final response = await http.post(
    Uri.parse('${apiBaseUrl}/payments/checkout'),
    headers: {'Authorization': 'Bearer $token'},
    body: jsonEncode({
      'booking_id': bookingId,
      'payment_method': 'VISA',
      'amount': 150.00,
    }),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body)['data'];
    
    // Pass checkout_id to Moyasar widget
    showMoyasarPaymentWidget(data['checkout_id']);
  }
}
```

### Payment Verification

```dart
// After Moyasar widget completes
Future<void> verifyPayment(int paymentId, String checkoutId) async {
  final response = await http.post(
    Uri.parse('${apiBaseUrl}/payments/status'),
    body: jsonEncode({
      'payment_id': paymentId,
      'checkout_id': checkoutId,
    }),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body)['data'];
    
    if (data['payment_status'] == 'paid') {
      print('✅ Payment successful!');
      print('Booking status: ${data['status']}'); // confirmed
      print('Slot is now booked');
      print('Sessions have been created');
      
      // Refresh booking details to show sessions
      await fetchBookingDetails(data['booking_id']);
    }
  }
}
```

---

## Testing Checklist

- [ ] **Create Booking**
  - [ ] POST `/api/student/booking` with service_id + language_id
  - [ ] Verify booking.status = "pending_payment"
  - [ ] Verify slot.is_booked = false, slot.is_available = true
  - [ ] Verify no sessions created yet

- [ ] **Slot Locking Race Condition**
  - [ ] Create 2 bookings for same slot
  - [ ] Pay for booking #2 first → should succeed
  - [ ] Pay for booking #1 → should fail (slot already booked)

- [ ] **Session Title Format**
  - [ ] Create language_study booking
  - [ ] After payment, verify session_title = "Language Study - English"
  - [ ] Create private_lessons booking
  - [ ] After payment, verify session_title = "Private Lessons"

- [ ] **Payment Failure**
  - [ ] Create booking
  - [ ] Attempt payment → simulate failure
  - [ ] Verify booking still pending_payment
  - [ ] Verify slot still available (is_booked=false)
  - [ ] Verify no sessions created

- [ ] **Notifications**
  - [ ] After payment success, verify student receives "Payment successful" notification
  - [ ] Verify teacher receives "New booking" notification

- [ ] **Session Meeting Links**
  - [ ] Verify Agora/Zoom meeting generated after payment
  - [ ] Verify student can join session

---

## Summary

✅ **Booking creation**: No slot locking, no sessions  
✅ **Payment initiation**: User navigates to Moyasar widget  
✅ **Payment success**: Slot locked, sessions created with proper titles  
✅ **Payment failure**: Booking pending, slot available for others  
✅ **Service integration**: Service name + Language in session title  

This ensures optimal UX where:
- Slots don't get locked if payment fails
- Other students can book if one student abandons checkout
- Session titles clearly show service + language being learned
- Teachers see proper information in their schedule

