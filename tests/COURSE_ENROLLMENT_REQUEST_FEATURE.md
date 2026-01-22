# Course Enrollment Request Feature

## Overview

Added a new `requestEnrollment()` function to allow students to request enrollment in courses with a **pending** status. This is different from the existing `enroll()` function which directly enrolls students.

## New Endpoint

### Request Enrollment
- **Method:** `POST`
- **Route:** `/api/student/courses/{id}/request-enrollment`
- **Auth:** Required (Bearer token)
- **Purpose:** Submit an enrollment request that will be marked as pending

#### Request Body
```json
{
  "note": "Optional message to teacher about why requesting this course"
}
```

#### Response (Success - 201)
```json
{
  "success": true,
  "message": "Enrollment request submitted successfully",
  "data": {
    "enrollment_id": 5,
    "course_id": 12,
    "student_id": 100,
    "status": "pending",
    "requested_at": "2026-01-23T10:30:00Z"
  }
}
```

#### Response (Error - 400)
```json
{
  "success": false,
  "message": "You already have a pending enrollment request for this course"
}
```

---

## Function Details

### `requestEnrollment(Request $request, int $id): JsonResponse`

**Location:** `app/Http/Controllers/API/CourseController.php`

**Parameters:**
- `$request` - HTTP Request containing optional `note` field
- `$id` - Course ID

**Returns:** JsonResponse with enrollment data

**Logic:**

1. **Authenticate:** Gets authenticated user
2. **Validate Course:** Checks course exists and is published
3. **Check Active Enrollment:** 
   - If student already has active enrollment → reject
   - Error: "You are already enrolled in this course"
4. **Check Pending Request:**
   - If student already has pending request → reject
   - Error: "You already have a pending enrollment request for this course"
5. **Create Enrollment:**
   - Creates enrollment record with status = `pending`
   - Sets enrollment_date = now()
6. **Log Action:**
   - Logs the enrollment request with student_id, course_id
7. **Send Notification:**
   - Sends notification to course teacher
   - Title: "New Enrollment Request" / "طلب التحاق جديد"
   - Message includes student name and course name
8. **Return Response:**
   - Returns 201 Created with enrollment data

---

## Validation Checks

| Check | Condition | Error Message |
|-------|-----------|---------------|
| **Course Published** | `status != 'published'` | Course not found (404) |
| **Not Already Enrolled** | Active enrollment exists | "You are already enrolled in this course" |
| **No Pending Request** | Pending enrollment exists | "You already have a pending enrollment request for this course" |

---

## Database Changes

### Enrollment Table
The function uses the existing `enrollments` table with the following fields:

| Field | Type | Value |
|-------|------|-------|
| `id` | int | Auto-generated |
| `student_id` | int | Authenticated user ID |
| `course_id` | int | Course ID from URL |
| `enrollment_date` | timestamp | now() |
| `status` | string | `'pending'` |
| `created_at` | timestamp | Auto-generated |
| `updated_at` | timestamp | Auto-generated |

---

## Notifications

### Teacher Notification
Sent when student submits enrollment request.

**English:**
- Title: "New Enrollment Request"
- Message: "{student_name} requested to enroll in your course: {course_name}"

**Arabic:**
- Title: "طلب التحاق جديد"
- Message: "لديك طلب التحاق جديد من {student_name} في الدورة: {course_name}"

**Payload:**
```php
[
    'enrollment_id' => $enrollment->id,
    'course_id' => $course->id,
    'student_id' => $user->id,
    'student_name' => $user->name,
]
```

---

## Enrollment Status Flow

```
NULL 
  ↓
pending (requestEnrollment)
  ↓
active (teacher approves) OR rejected (teacher rejects)
  ↓
completed (course finished)
```

---

## Difference: requestEnrollment vs enroll

| Aspect | requestEnrollment() | enroll() |
|--------|---------------------|----------|
| **Status Created** | `pending` | `active` |
| **Requires Approval** | ✅ Yes (by teacher) | ❌ No (immediate) |
| **Use Case** | Students request permission | Direct enrollment |
| **Notification** | Sent to teacher | (varies by type) |
| **Endpoint** | POST /courses/{id}/request-enrollment | POST /courses/{id}/enroll |

---

## Code Example: Complete Flow

### Step 1: Student Requests Enrollment
```bash
curl -X POST https://api.yoursite.com/api/courses/12/request-enrollment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "I am interested in learning this subject"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Enrollment request submitted successfully",
  "data": {
    "enrollment_id": 25,
    "course_id": 12,
    "student_id": 100,
    "status": "pending",
    "requested_at": "2026-01-23T10:30:00Z"
  }
}
```

### Step 2: Teacher Reviews Request
Teacher receives notification and can approve/reject in their dashboard.

### Step 3: Update Enrollment to Active
(Requires separate endpoint to be implemented)
```bash
# Teacher approves
PUT /api/enrollments/25/approve

# Or rejects
PUT /api/enrollments/25/reject
```

### Step 4: Student Sees Approved Status
```bash
GET /api/my-enrollments
```

Response shows status = `active`

---

## Validation Examples

### ✅ Valid Request
```json
{
  "student_id": 100,
  "course_id": 12
}
```
- ✅ Student is authenticated
- ✅ Course exists and is published
- ✅ No active enrollment
- ✅ No pending request
- **Result:** Enrollment created with status = pending

### ❌ Invalid: Already Enrolled
```json
{
  "student_id": 100,
  "course_id": 12
}
```
- ❌ Student already has active enrollment in course 12
- **Result:** Error - "You are already enrolled in this course"

### ❌ Invalid: Pending Request Exists
```json
{
  "student_id": 100,
  "course_id": 12
}
```
- ❌ Student already has pending enrollment request for course 12
- **Result:** Error - "You already have a pending enrollment request for this course"

### ❌ Invalid: Course Not Published
```json
{
  "student_id": 100,
  "course_id": 15
}
```
- ❌ Course 15 has status = draft
- **Result:** 404 Not Found

---

## Logging

All enrollment requests are logged for audit trail:

```
Student requested enrollment - Log Entry:
  - student_id: 100
  - course_id: 12
  - enrollment_id: 25
```

---

## Error Handling

All errors are caught and handled gracefully:

1. **Course Not Found:** Returns 404 with default message
2. **Database Error:** Logs error, returns 500
3. **Notification Error:** Logs error but doesn't fail the request
4. **Validation Error:** Returns 400 with specific message

---

## Route Definition

```php
// In routes/api.php (Student authenticated routes)
Route::post('/courses/{id}/request-enrollment', [CourseController::class, 'requestEnrollment']);
```

---

## Next Steps

To complete the enrollment approval workflow, implement:

1. **Approval Endpoint:** `PUT /api/enrollments/{id}/approve`
   - Update enrollment status from pending → active
   - Send notification to student

2. **Rejection Endpoint:** `PUT /api/enrollments/{id}/reject`
   - Delete or mark as rejected
   - Send notification to student with reason

3. **List Pending Requests:** `GET /api/teacher/enrollment-requests`
   - Teacher view of all pending enrollment requests for their courses

4. **Student Enrollment Status:** `GET /api/my-enrollments`
   - Show student their enrollment status in courses

---

## Testing Script

```bash
#!/bin/bash

# Test 1: Valid enrollment request
echo "Test 1: Request enrollment in course 12"
curl -X POST http://localhost/api/courses/12/request-enrollment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo ""
echo "Test 2: Try to request same enrollment again (should fail)"
curl -X POST http://localhost/api/courses/12/request-enrollment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo ""
echo "Test 3: Request enrollment in non-existent course (should fail)"
curl -X POST http://localhost/api/courses/9999/request-enrollment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo ""
echo "Test 4: Request enrollment in draft course (should fail)"
curl -X POST http://localhost/api/courses/5/request-enrollment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

## Summary

✅ New endpoint: `POST /api/courses/{id}/request-enrollment`
✅ Status: Creates enrollment with `pending` status
✅ Validations: Checks for active enrollment and pending requests
✅ Notifications: Sends to teacher
✅ Logging: Logs all requests for audit trail
✅ Error Handling: Graceful error responses

