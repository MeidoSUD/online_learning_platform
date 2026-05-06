# ✅ Booking System - Errors Fixed & Architecture Clarified

## Summary of Fixes

Two critical errors in `BookingController.php` have been fixed:

### Error 1: Undefined Variable `$subjectData`
**Location**: `app/Http/Controllers/API/BookingController.php`, line 1101  
**Problem**: Variable was only initialized in `else` clause but used unconditionally

**Root Cause**:
```php
// BEFORE (WRONG)
if ($booking->course) {
    $courseData = Course::find($booking->course_id);
} else {
    $subjectData = Subject::find($booking->subject_id);  // Only set here!
}

// Then later...
'subject' => $subjectData,  // ❌ Error if $booking->course is true!
```

**Fix Applied**:
```php
// AFTER (CORRECT)
$subjectData = null;  // ✅ Initialize for all bookings

if ($booking->course) {
    $courseData = Course::find($booking->course_id);
    if ($booking->course->subject) {
        $subjectData = $booking->course->subject;
    }
} else if ($booking->subject_id) {
    $subjectData = Subject::find($booking->subject_id);
}

// Now safe to use:
'subject' => $subjectData,  // ✅ Always defined (may be null)
```

---

### Error 2: Undefined Variable `$course`
**Location**: `app/Http/Controllers/API/BookingController.php`, line 256  
**Problem**: Variable was only defined inside `if ($isCourse)` block but used later regardless

**Root Cause**:
```php
// BEFORE (WRONG)
$isCourse = $request->filled('course_id');

if ($isCourse) {
    $course = Course::with('teacher')->findOrFail($request->course_id);
    // ...
}

// Then much later (outside the if block)...
'course_id' => $isCourse ? $course->id : null,  // ❌ $course undefined!
```

**Fix Applied**:
```php
// AFTER (CORRECT)
$isCourse = $request->filled('course_id');
$course = null;  // ✅ Initialize at beginning

if ($isCourse) {
    $course = Course::with('teacher')->findOrFail($request->course_id);
    // ...
}

// Now safe to use:
'course_id' => $isCourse ? $course->id : null,  // ✅ Always defined (may be null)
```

---

## Architecture Clarification: Which Controller to Use?

### The Answer: **Use BookingController for ALL bookings**

| Feature | Course Booking | Service Booking |
|---------|---|---|
| **Controller** | ✅ BookingController | ✅ BookingController |
| **Route** | POST /api/student/booking | POST /api/student/booking |
| **Model** | Booking | Booking |
| **Service Type** | Service ID = 4 (Course) | Service ID = 1,2,3,etc |

### Why NOT BookingCourseController?

The `BookingCourseController` exists but is **redundant and NOT USED** because:

1. **Single Payment-First Flow**: Both course and service bookings follow the same process:
   - Create booking (pending_payment)
   - Student pays
   - Lock availability slot
   - Create sessions

2. **Same Database Table**: Both use the `bookings` table with:
   - `course_id` (NULL for services)
   - `service_id` (NULL for courses)

3. **Unified API Design**: The BookingController distinguishes at runtime:
   ```php
   $isCourse = $request->filled('course_id');
   $isService = $request->filled('service_id');
   ```

### Status of BookingCourseController

**File**: `app/Http/Controllers/API/BookingCourseController.php`  
**Status**: ❌ **NOT USED** - can be safely removed or deprecated  
**Recommendation**: Delete or mark as deprecated in comments

---

## API Endpoints Reference

### Student Booking Endpoints

| Endpoint | Method | Controller | Purpose |
|----------|--------|-----------|---------|
| `/api/student/booking` | POST | BookingController::createBooking | Create course OR service booking |
| `/api/student/booking` | GET | BookingController::getStudentBookings | List all student bookings |
| `/api/student/booking/{id}` | GET | BookingController::getBookingDetails | View specific booking |
| `/api/student/booking/{id}/cancel` | PUT | BookingController::cancelBooking | Cancel booking |

### Payment Endpoints

| Endpoint | Method | Controller | Purpose |
|----------|--------|-----------|---------|
| `/api/payments/checkout` | POST | PaymentController::createCheckout | Initiate payment |
| `/api/payments/status` | POST | PaymentController::paymentStatus | Confirm payment & create sessions |

---

## How Course vs Service Bookings Work

### Request: Create Course Booking
```json
POST /api/student/booking
{
  "course_id": 5,
  "availability_slot_id": 12,
  "type": "single",
  "total_sessions": 1
}
```

**Response**:
```json
{
  "success": true,
  "booking": {
    "id": 45,
    "reference": "BK-20260502-ABC123",
    "course_id": 5,
    "service_id": 4,
    "subject_id": 3,
    "teacher_id": 27,
    "status": "pending_payment",
    "total_amount": 150,
    "currency": "SAR"
  }
}
```

---

### Request: Create Service Booking
```json
POST /api/student/booking
{
  "service_id": 2,
  "teacher_id": 27,
  "timeslot_id": 12,
  "subject_id": 3,
  "language_id": 1,
  "type": "single",
  "total_sessions": 1
}
```

**Response**:
```json
{
  "success": true,
  "booking": {
    "id": 46,
    "reference": "BK-20260502-XYZ789",
    "course_id": null,
    "service_id": 2,
    "subject_id": 3,
    "teacher_id": 27,
    "status": "pending_payment",
    "total_amount": 120,
    "currency": "SAR"
  }
}
```

---

### Request: Get All Student Bookings
```json
GET /api/student/booking?status=upcoming&per_page=10
```

**Response** (after fixes):
```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "reference": "BK-20260502-ABC123",
      "teacher": {
        "id": 27,
        "name": "John Doe",
        "profile": { ... }
      },
      "course": {
        "id": 5,
        "name": "Advanced English",
        "subject_id": 3
      },
      "subject": {
        "id": 3,
        "name_en": "English",
        "name_ar": "الإنجليزية"
      },
      "session_info": {
        "type": "single",
        "total_sessions": 1,
        "completed_sessions": 0,
        "remaining_sessions": 1,
        "duration": "60 minutes"
      },
      "status": "pending_payment"
    },
    {
      "id": 46,
      "reference": "BK-20260502-XYZ789",
      "teacher": { ... },
      "course": null,
      "subject": {
        "id": 3,
        "name_en": "English",
        "name_ar": "الإنجليزية"
      },
      "session_info": {
        "type": "single",
        "total_sessions": 1,
        "completed_sessions": 0,
        "remaining_sessions": 1
      },
      "status": "pending_payment"
    }
  ]
}
```

---

## Database Relationships

### Booking Model
```php
// Many-to-One relationships
public function student(): BelongsTo     → User (student_id)
public function teacher(): BelongsTo     → User (teacher_id)
public function course(): BelongsTo      → Course (course_id)
public function subject(): BelongsTo     → Subject (subject_id)
public function service(): BelongsTo     → Services (service_id)
public function payment(): BelongsTo     → Payment (payment_id)

// One-to-Many relationships
public function sessions(): HasMany      → Sessions (booking_id)
public function reviews(): HasMany       → Review (booking_id)
```

### Booking Table Columns
```sql
CREATE TABLE bookings (
  id BIGINT PRIMARY KEY,
  student_id BIGINT NOT NULL,
  teacher_id BIGINT NOT NULL,
  course_id BIGINT NULLABLE,           ← NULL for service bookings
  service_id BIGINT NULLABLE,          ← NULL for course bookings
  subject_id BIGINT NULLABLE,          ← Can be null for both
  language_id BIGINT NULLABLE,         ← Only for language services
  availability_slot_id BIGINT,
  session_type ENUM('single','package'),
  sessions_count INT,
  sessions_completed INT DEFAULT 0,
  first_session_date DATE,
  first_session_start_time TIME,
  first_session_end_time TIME,
  session_duration INT,                ← Minutes
  price_per_session DECIMAL(10,2),
  teacher_rate_per_session DECIMAL(10,2),
  platform_percentage DECIMAL(5,2),
  subtotal DECIMAL(10,2),
  discount_percentage DECIMAL(5,2),
  discount_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'SAR',
  status ENUM('pending_payment','confirmed','in_progress','completed','cancelled'),
  payment_id BIGINT NULLABLE,
  booking_date TIMESTAMP,
  cancelled_at TIMESTAMP NULLABLE,
  refund_amount DECIMAL(10,2) NULLABLE,
  booking_reference VARCHAR(50) UNIQUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Booking Lifecycle - Complete Flow

### Step 1: Student Creates Booking (Pending Payment)
```
POST /api/student/booking
  ↓
BookingController::createBooking()
  ↓
1. Validate course_id OR service_id
2. Lock availability slot
3. Validate slot conditions
4. Calculate pricing
5. Create Booking row (status = pending_payment)
6. Return booking with payment info
```

### Step 2: Student Initiates Payment
```
POST /api/payments/checkout
  ↓
PaymentController::createCheckout()
  ↓
1. Get booking from database
2. Create payment provider request
3. Redirect to payment gateway (Moyasar/HyperPay)
4. Return payment URL
```

### Step 3: Payment Callback/Status Check
```
POST /api/payments/status (after payment success)
  ↓
PaymentController::paymentStatus()
  ↓
1. Verify payment with provider
2. Update booking.status = confirmed
3. Lock availability slot (is_booked = true)
4. Create sessions (for all booking.sessions_count)
5. Send SMS notifications:
   - Student: "نجاح! لقد حجزت X جلسات..."
   - Teacher: "لديك حجز جديد من [Name]..."
6. Send email confirmation
7. Create Zoom meeting links
```

### Step 4: Session Management
```
Session flow (from Sessions model):
1. Sessions created by Sessions::createForBooking()
2. Cron job runs every minute: sessions:process-upcoming
3. 2-hour reminder sent (push + email)
4. 1-hour reminder sent (push + email + SMS)
5. Session meeting created (Zoom)
6. Session can be joined
7. After completion, sessions_completed++
```

---

## Testing the Fixed Endpoints

### Test: Get Student Bookings
```bash
curl -X GET "http://localhost:8000/api/student/booking?status=upcoming" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: Should return 200 with booking list, NO undefined variable errors

### Test: Create Course Booking
```bash
curl -X POST "http://localhost:8000/api/student/booking" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": 5,
    "availability_slot_id": 12,
    "type": "single"
  }'
```

### Test: Create Service Booking
```bash
curl -X POST "http://localhost:8000/api/student/booking" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 2,
    "teacher_id": 27,
    "timeslot_id": 12,
    "subject_id": 3,
    "type": "single"
  }'
```

---

## Summary

| Issue | Status | Fix |
|-------|--------|-----|
| Undefined `$subjectData` | ✅ FIXED | Initialize to null before conditional |
| Undefined `$course` | ✅ FIXED | Initialize to null at method start |
| `.with('courses')` relationship | ✅ OK | Query uses correct `course` (singular) |
| BookingController vs BookingCourseController | ✅ CLARIFIED | Use BookingController only, remove BookingCourseController |
| Course vs Service bookings | ✅ CLARIFIED | Same endpoint, different request parameters |

**Next Steps**:
1. ✅ Test the `/api/student/booking` endpoint with both course and service bookings
2. ✅ Verify SMS notifications are sent after payment
3. ✅ Check that sessions are created properly
4. (Optional) Remove or deprecate BookingCourseController

