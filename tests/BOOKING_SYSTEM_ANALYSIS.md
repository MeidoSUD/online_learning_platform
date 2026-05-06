# Booking System Analysis - Courses vs Services

## Current Architecture

### 1. **API Routing**

**File**: `routes/api.php`

```php
// Student Booking Routes
Route::post('/booking', [BookingController::class, 'createBooking']);      // Create booking
Route::get('/booking', [BookingController::class, 'getStudentBookings']);  // List bookings
Route::get('/booking/{bookingId}', [BookingController::class, 'getBookingDetails']);
Route::put('/booking/{bookingId}/cancel', [BookingController::class, 'cancelBooking']);
```

**Key Point**: Only `BookingController` is used - NOT `BookingCourseController`

---

## 2. Understanding the Booking System

### What is a Booking?

A `Booking` represents a **student's enrollment in a course or booking of a teacher's service**.

### Booking Types

The system supports **TWO types of bookings**:

#### **Type 1: Course Booking**
- Student enrolls in a **pre-created course** by a teacher
- Course has a fixed curriculum
- Multiple students can enroll in the same course
- Uses `course_id`

**Example**:
```
Student enrolls in "Advanced English" course
→ Booking created with course_id = 5
→ Course has subject_id, education_level_id, etc.
```

#### **Type 2: Service Booking** 
- Student books a **private lesson/service** from a teacher
- Teacher provides a custom service (e.g., language tutoring, exam prep)
- Uses `service_id` + `teacher_id` + `availability_slot_id`
- Can include `language_id` for language learning services

**Example**:
```
Student books "1-on-1 English Tutoring" from Teacher John
→ Booking created with service_id = 2, teacher_id = 27
→ Service has category_id, but NO subject required
```

---

## 3. The Problem with "Undefined variable $subjectData"

### The Error Location
**File**: `app/Http/Controllers/API/BookingController.php`
**Method**: `getStudentBookings()` 
**Line**: 1101

### Root Cause

In `getStudentBookings()`, the code tries to build `$subjectData` for each booking:

```php
// Line ~1093
$subjectData = Subject::find($booking->subject_id);

// Line ~1101 - ERROR HERE
'subject' => $subjectData,  // ❌ $subjectData might be undefined
```

### Why is $subjectData undefined?

**For Service Bookings:**
- `service_id` bookings typically do NOT have a `subject_id`
- `Subject::find($booking->subject_id)` returns `NULL`
- But the code doesn't initialize `$subjectData` before the transform closure

**The Issue**: When looping through paginated bookings, if a booking has `service_id` (not `course_id`), the `$subjectData` variable is not initialized, causing the undefined variable error.

---

## 4. Current Booking Model Relationships

**File**: `app/Models/Booking.php`

```php
public function student(): BelongsTo
{
    return $this->belongsTo(User::class, 'student_id');
}

public function teacher(): BelongsTo
{
    return $this->belongsTo(User::class, 'teacher_id');
}

public function course(): BelongsTo
{
    return $this->belongsTo(Course::class, 'course_id');
}

public function subject(): BelongsTo
{
    return $this->belongsTo(Subject::class, 'subject_id');
}

public function service()
{
    return $this->belongsTo(Services::class, 'service_id');
}

public function sessions(): HasMany
{
    return $this->hasMany(Sessions::class, 'booking_id');
}
```

**Key Relationships**:
- ✅ `course()` - Used for course bookings
- ✅ `subject()` - Used for course/service bookings  
- ✅ `service()` - Used for service bookings
- ❌ **NO courses() relationship** (many-to-many would be redundant since `course_id` is already on Booking)

---

## 5. Booking Database Columns

```
Table: bookings
├── id
├── student_id          (FK → users)
├── teacher_id          (FK → users)
├── course_id           (FK → courses) - NULL for service bookings
├── service_id          (FK → services) - NULL for course bookings
├── subject_id          (FK → subjects) - Can be null
├── language_id         (FK → languages) - For language services
├── availability_slot_id (FK → availability_slots)
├── session_type        (single/package)
├── sessions_count      (number of sessions)
├── first_session_date
├── first_session_start_time
├── first_session_end_time
├── session_duration
├── price_per_session
├── teacher_rate_per_session
├── platform_percentage
├── subtotal
├── discount_percentage
├── discount_amount
├── total_amount
├── currency
├── status              (pending_payment/confirmed/completed/cancelled)
├── payment_id
├── booking_date
├── cancelled_at
└── refund_amount
```

---

## 6. Booking Status Lifecycle

### For Course Bookings:
```
1. Student enrolls in course
   ↓
2. Booking created (status = pending_payment)
3. Slot NOT locked yet (remains available)
   ↓
4. Student initiates payment
   ↓
5. Payment succeeds
   → Booking status = confirmed
   → Sessions created
   → Email/SMS sent
```

### For Service Bookings:
```
1. Student books teacher's availability slot
   ↓
2. Booking created (status = pending_payment)
3. Slot NOT locked yet (remains available)
   ↓
4. Student pays
   ↓
5. Payment succeeds
   → Booking status = confirmed
   → Sessions created
   → Slot becomes booked (is_available = false)
```

---

## 7. Why NOT BookingCourseController?

The `BookingCourseController` was created but is redundant because:

1. **Unified Booking System**: `BookingController` handles BOTH course and service bookings
2. **Single Booking Table**: The `bookings` table has both `course_id` and `service_id` columns
3. **Unified Logic**: The same payment flow works for both types

**Current Status of BookingCourseController**:
- Exists in: `app/Http/Controllers/API/BookingCourseController.php`
- Used by: Currently NOT used in any routes (redundant)
- Should be: Removed or deprecated

---

## 8. What Happens During Booking Enrollment

### Create Booking (Payment-First Model):

```
Request:
POST /api/student/booking
{
  "course_id": 5,        // OR service_id
  "service_id": null,    // OR course_id
  "teacher_id": 27,
  "type": "single",      // single/package
  "language_id": 1       // (optional, for language services)
}

Process:
1. Validate request
2. Create Booking row (status = pending_payment)
3. Do NOT lock slot yet
4. Do NOT create sessions yet
5. Return booking with payment instructions

Response includes:
- booking_id
- booking_reference
- teacher info
- course/service info
- subject info (if applicable)
```

### After Payment Success:

```
PaymentController::paymentStatus()
↓
1. Lock availability slot (is_available = false, is_booked = true)
2. Create sessions for all booking sessions
3. Send SMS/Email notifications
4. Update booking.status = confirmed
```

---

## 9. Key Differences: Course vs Service

| Feature | Course Booking | Service Booking |
|---------|---|---|
| **Curriculum** | Fixed (predefined) | Custom (teacher decides) |
| **Multiple Students** | Yes | No (1-on-1 booking) |
| **Subject** | Required | Optional |
| **Language ID** | Not used | Used (for language tutoring) |
| **Availability Slot** | Not used | Required |
| **Sessions** | Pre-defined by course | Defined by slot availability |
| **Price Model** | Fixed course price | Hourly rate |

---

## 10. Fixing the "Undefined $subjectData" Error

### The Fix

In `BookingController::getStudentBookings()`, initialize `$subjectData` properly:

```php
// Initialize for all bookings
$subjectData = null;  // ✅ Initialize BEFORE the loop

$bookings->transform(function($booking) use (&$subjectData) {
    // For course bookings: get subject from course
    if ($booking->course_id && $booking->course) {
        $subjectData = [
            'id' => $booking->course->subject_id,
            'name_en' => $booking->course->subject->name_en ?? '',
            'name_ar' => $booking->course->subject->name_ar ?? '',
        ];
    }
    // For service bookings: get subject if it exists
    else if ($booking->subject_id) {
        $subject = Subject::find($booking->subject_id);
        $subjectData = $subject ? [
            'id' => $subject->id,
            'name_en' => $subject->name_en,
            'name_ar' => $subject->name_ar,
        ] : null;
    }
    // For service bookings without subject
    else {
        $subjectData = null;  // ✅ Explicitly set to null
    }

    return [
        'id' => $booking->id,
        'reference' => $booking->booking_reference,
        'status' => $booking->status,
        'subject' => $subjectData,  // ✅ Now always defined
        // ... other fields
    ];
});
```

---

## 11. Summary: Which Controller for What?

| Endpoint | Controller | Method | Purpose |
|----------|-----------|--------|---------|
| `POST /api/student/booking` | BookingController | createBooking | Create both course & service bookings |
| `GET /api/student/booking` | BookingController | getStudentBookings | List all student bookings |
| `GET /api/student/booking/{id}` | BookingController | getBookingDetails | View specific booking |
| `PUT /api/student/booking/{id}/cancel` | BookingController | cancelBooking | Cancel booking |
| `POST /api/payments/checkout` | PaymentController | createCheckout | Initiate payment |
| `POST /api/payments/status` | PaymentController | paymentStatus | Confirm payment & lock slot |

**Answer to Your Question**: 
- Use `BookingController` (not BookingCourseController) 
- It handles BOTH courses AND services
- BookingCourseController is redundant and should be removed

---

## 12. Course vs Service in DB Schema

### Courses Table
```
courses
├── id
├── teacher_id
├── subject_id         ← Required: what subject is taught
├── category_id
├── service_id         (FK → services, id=4 for course_service)
├── name
├── description
├── price_per_hour
├── price              (total course price)
├── session_duration
├── education_level_id
├── status
└── created_at
```

### Services Table
```
services
├── id
├── name               (e.g., "Language Study", "Course", "Tutoring")
├── type
├── status
└── created_at
```

**Note**: `service_id = 4` is typically "Course" service. When a course is booked, it's actually a booking of the "Course" service.

