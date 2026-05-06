# Course System - Flutter Implementation Guide

## Architecture Overview

### Two Course Types

| | Individual Course | Group Course |
|---|---|---|
| **What it is** | 1-on-1 tutoring | Multiple students learn together |
| **Schedule** | Student picks from teacher's available time slots | Teacher sets fixed schedule |
| **When sessions start** | Immediately after booking + payment | On the group's start date |
| **Sessions created** | After payment (weekly recurrence) | After payment (from schedule pattern) |
| **Capacity** | 1 student per slot | 3-10 students per group |

---

## API Endpoints Reference

### Base URL
```
GET /api/courses                    → Browse courses (public)
GET /api/courses/{id}               → Course details (public)
GET /api/courses/{id}/groups        → Get available groups (public, group courses only)
```

### Student Endpoints (auth: student role)
```
POST /api/student/booking/course    → Create booking (individual or group)
POST /api/student/payments/checkout → Initiate Moyasar payment
POST /api/student/payments/status   → Check payment result
GET  /api/student/booking           → List my bookings
GET  /api/student/booking/{id}      → Booking details
GET  /api/student/sessions          → List my sessions
POST /api/student/sessions/{id}/join → Join session (get Agora token)
```

### Teacher Endpoints (auth: teacher role)
```
POST   /api/teacher/courses                    → Create course
PUT    /api/teacher/courses/{id}               → Update course
DELETE /api/teacher/courses/{id}               → Delete course
GET    /api/teacher/courses                    → My courses
GET    /api/teacher/courses/{id}/groups        → My groups (with enrollment data)
POST   /api/teacher/courses/{id}/groups        → Create a new group
GET    /api/teacher/courses/{id}/groups/{gid}/students → Group enrolled students
POST   /api/teacher/courses/{id}/groups/{gid}/start    → Start group
GET    /api/teacher/sessions                   → My sessions
POST   /api/teacher/sessions/{id}/start        → Start session
POST   /api/teacher/sessions/{id}/end          → End session
```

### Payment Endpoints (auth: student role)
```
POST /api/student/payments/checkout  → Create Moyasar payment session
POST /api/student/payments/status    → Verify payment result
GET  /api/student/payments/saved-cards → Saved payment methods
```

---

## Day Numbering (IMPORTANT)

**The app uses this day numbering for all schedule data:**

| Number | Day |
|--------|-----|
| 1 | Saturday |
| 2 | Sunday |
| 3 | Monday |
| 4 | Tuesday |
| 5 | Wednesday |
| 6 | Thursday |
| 7 | Friday |

**Use this for:**
- Individual course availability slots (`available_slots[].day`)
- Group course schedule pattern (`schedule_pattern.days`)

```dart
const dayNames = {
  1: 'Saturday',
  2: 'Sunday',
  3: 'Monday',
  4: 'Tuesday',
  5: 'Wednesday',
  6: 'Thursday',
  7: 'Friday',
};
```

---

## Flutter Data Models

```dart
enum CourseFormat { individual, group }
enum CourseStatus { draft, published, archived }
enum CourseType { single, package, subscription }
enum BookingStatus { pendingPayment, confirmed, inProgress, completed, cancelled }
enum SessionStatus { scheduled, live, ended, completed, cancelled }
enum GroupStatus { open, confirmed, inProgress, completed, cancelled }

class Course {
  final int id;
  final int teacherId;
  final String name;
  final String? description;
  final CourseType courseType;
  final CourseFormat courseFormat;
  final double? price;
  final int? durationHours;
  final int? maxStudents;
  final int? minStudents;
  final CourseStatus status;
  final TeacherInfo? teacher;
  final List<AvailabilitySlot>? availableSlots;    // individual courses
  final List<CourseGroup>? courseGroups;            // group courses

  bool get isGroup => courseFormat == CourseFormat.group;
  bool get isIndividual => courseFormat == CourseFormat.individual;
}

class CourseGroup {
  final int id;
  final int courseId;
  final String groupName;
  final DateTime startDate;
  final SchedulePattern schedulePattern;
  final int totalSessions;
  final int maxStudents;
  final int? minStudents;
  final int enrolledCount;
  final GroupStatus status;

  int get remainingSeats => maxStudents - enrolledCount;
  bool get isFull => enrolledCount >= maxStudents;
  bool get minReached {
    if (minStudents == null) return true;
    return enrolledCount >= minStudents!;
  }
  bool get canJoin => !isFull && (status == GroupStatus.open || status == GroupStatus.confirmed);
}

class SchedulePattern {
  final List<int> days;      // [1,3] = Saturday + Monday (app numbering)
  final String time;         // "18:00"
  final String? endTime;     // "19:00"
}

class AvailabilitySlot {
  final int id;
  final int dayNumber;       // 1-7 (app numbering)
  final String startTime;    // "09:00"
  final String endTime;      // "10:00"
  final bool isAvailable;
  final bool isBooked;
}

class Booking {
  final int id;
  final String bookingReference;
  final int studentId;
  final int teacherId;
  final int? courseId;
  final int? courseGroupId;
  final BookingStatus status;
  final String sessionType;     // "single" or "package"
  final int sessionsCount;
  final int sessionsCompleted;
  final String? firstSessionDate;
  final String? firstSessionStartTime;
  final String? firstSessionEndTime;
  final int sessionDuration;    // minutes
  final double totalAmount;
  final String currency;
  final DateTime bookingDate;
  final Course? course;
  final CourseGroup? courseGroup;
  final TeacherInfo? teacher;

  bool get isPaid => status == BookingStatus.confirmed || 
                       status == BookingStatus.inProgress || 
                       status == BookingStatus.completed;
  bool get isPendingPayment => status == BookingStatus.pendingPayment;
}

class Session {
  final int id;
  final int bookingId;
  final int studentId;
  final int teacherId;
  final int sessionNumber;
  final String? sessionTitle;
  final DateTime sessionDate;
  final String startTime;
  final String endTime;
  final int duration;
  final SessionStatus status;
  final String? joinUrl;
  final String? meetingId;
  final String? hostUrl;

  bool get canJoin => status == SessionStatus.scheduled;
  bool get isLive => status == SessionStatus.live;
}

class TeacherInfo {
  final int id;
  final String firstName;
  final String lastName;
  final String? bio;
  final double? rating;
  final int? totalReviews;
  final String? profileImage;
}
```

---

## Screen Flow — Student

```
┌─────────────────────────────────────────────────────────────┐
│                    COURSE BROWSING                          │
│                                                             │
│  ┌──────────────────────────────────────┐                   │
│  │ CoursesListScreen                    │                   │
│  │ - Search/filter courses              │                   │
│  │ - Shows: name, price, teacher, type  │                   │
│  │ - Badge: "Individual" or "Group"     │                   │
│  │ - Tap → CourseDetailScreen           │                   │
│  └──────────────────────────────────────┘                   │
│                          │ tap                               │
│                          ▼                                   │
│  ┌──────────────────────────────────────┐                   │
│  │ CourseDetailScreen                   │                   │
│  │                                      │                   │
│  │ IF course.course_format == 'group':  │                   │
│  │   → Fetch GET /api/courses/{id}/     │                   │
│  │     groups                           │                   │
│  │   → Show list of groups with:        │                   │
│  │     - Group name, start date         │                   │
│  │     - "3/8 enrolled" progress        │                   │
│  │     - "Full" badge if full           │                   │
│  │     - Tap group → PaymentScreen      │                   │
│  │                                      │                   │
│  │ IF course.course_format == 'indiv':  │                   │
│  │   → Show teacher's availability      │                   │
│  │     slots (weekly calendar view)     │                   │
│  │   → Tap available slot →             │                   │
│  │     BookingConfirmationScreen        │                   │
│  └──────────────────────────────────────┘                   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────┐                   │
│  │ BookingConfirmationScreen            │                   │
│  │ - Shows booking summary:             │                   │
│  │   - Course name, teacher             │                   │
│  │   - Selected group OR slot           │                   │
│  │   - Sessions count, total price      │                   │
│  │ - [Proceed to Payment] button        │                   │
│  │ - POST /api/student/booking/course   │                   │
│  │   → Returns booking_id               │                   │
│  └──────────────────────────────────────┘                   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────┐                   │
│  │ PaymentScreen                        │                   │
│  │ - Moyasar SDK / webview              │                   │
│  │ - POST /api/student/payments/        │                   │
│  │   checkout                           │                   │
│  │ - Poll POST /api/student/payments/   │                   │
│  │   status until paid                  │                   │
│  │ - On success → MyBookingsScreen      │                   │
│  └──────────────────────────────────────┘                   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────┐                   │
│  │ MyBookingsScreen                     │                   │
│  │ - Tab: Upcoming / Completed          │                   │
│  │ - Each booking shows:                │                   │
│  │   - Course name, next session date   │                   │
│  │   - Progress: 3/8 sessions           │                   │
│  │   - Status badge                     │                   │
│  │   - Tap → BookingDetailScreen        │                   │
│  └──────────────────────────────────────┘                   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────┐                   │
│  │ SessionsListScreen                   │                   │
│  │ - List of all sessions for booking   │                   │
│  │ - Each session:                      │                   │
│  │   - Date, time, session #            │                   │
│  │   - Status (scheduled/live/completed)│                   │
│  │   - [Join] button if can join        │                   │
│  │   - Tap Join → Agora session screen  │                   │
│  └──────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Screen Flow — Teacher

```
┌─────────────────────────────────────────────────────────────┐
│                    TEACHER COURSES                          │
│                                                             │
│  ┌──────────────────────────────────────┐                   │
│  │ TeacherCoursesScreen                 │                   │
│  │ - List of teacher's courses          │                   │
│  │ - Shows: name, students, status      │                   │
│  │ - Badge: "Individual" / "Group"      │                   │
│  │ - [+ New Course] button              │                   │
│  │ - Tap → TeacherCourseDetailScreen    │                   │
│  └──────────────────────────────────────┘                   │
│                          │ tap                               │
│                          ▼                                   │
│  ┌──────────────────────────────────────┐                   │
│  │ TeacherCourseDetailScreen            │                   │
│  │                                      │                   │
│  │ IF individual course:                │                   │
│  │   - Show/edit availability slots     │                   │
│  │     (weekly template view)           │                   │
│  │   - Show enrolled students           │                   │
│  │   - Show upcoming sessions           │                   │
│  │                                      │                   │
│  │ IF group course:                     │                   │
│  │   - Tab: Groups / Students           │                   │
│  │   - Groups tab shows:                │                   │
│  │     - List of groups                 │                   │
│  │     - Each: name, start date,        │                   │
│  │       enrolled/max, status           │                   │
│  │     - Tap group → GroupDetailScreen  │                   │
│  │   - [+ Add Group] button             │                   │
│  │     → CreateGroupScreen              │                   │
│  └──────────────────────────────────────┘                   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────┐                   │
│  │ CreateCourseScreen                   │                   │
│  │ Step 1: Course Info                  │                   │
│  │   - Name, description                │                   │
│  │   - Category, subject, level         │                   │
│  │   - Price, duration_hours            │                   │
│  │   - Course format picker:            │                   │
│  │     ○ Individual  ○ Group            │                   │
│  │                                      │                   │
│  │ IF Individual selected → Step 2:     │                   │
│  │   - Weekly availability grid         │                   │
│  │   - 7 columns (days), time slots     │                   │
│  │   - Tap to add/remove slots          │                   │
│  │   - POST /api/teacher/courses        │                   │
│  │   Body:                              │                   │
│  │   {                                  │                   │
│  │     "name": "...",                   │                   │
│  │     "course_format": "individual",   │                   │
│  │     "available_slots": [             │                   │
│  │       {"day": 3, "times": ["09:00"]} │                   │
│  │     ]                                │                   │
│  │   }                                  │                   │
│  │                                      │                   │
│  │ IF Group selected → Step 2:          │                   │
│  │   - Start date picker                │                   │
│  │   - Day of week multi-select         │                   │
│  │   - Time picker (start + end)        │                   │
│  │   - Total sessions input             │                   │
│  │   - Max/min students input           │                   │
│  │   - POST /api/teacher/courses        │                   │
│  │   Body:                              │                   │
│  │   {                                  │                   │
│  │     "name": "...",                   │                   │
│  │     "course_format": "group",        │                   │
│  │     "start_date": "2026-06-01",      │                   │
│  │     "schedule_pattern": {            │                   │
│  │       "days": [3, 5],                │                   │
│  │       "time": "18:00",               │                   │
│  │       "end_time": "19:00"            │                   │
│  │     },                               │                   │
│  │     "total_sessions": 8,             │                   │
│  │     "max_students": 8,               │                   │
│  │     "min_students": 3                │                   │
│  │   }                                  │                   │
│  └──────────────────────────────────────┘                   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────┐                   │
│  │ GroupDetailScreen                    │                   │
│  │ - Group name, start date             │                   │
│  │ - Schedule pattern display           │                   │
│  │ - Enrolled students list:            │                   │
│  │   GET /api/teacher/courses/{id}/     │                   │
│  │     groups/{gid}/students            │                   │
│  │ - "Min students: 3/5 reached"        │                   │
│  │ - [Start Group] button (enabled      │                   │
│  │   when min_students_reached == true) │                   │
│  │   POST /api/teacher/courses/{id}/    │                   │
│  │     groups/{gid}/start               │                   │
│  └──────────────────────────────────────┘                   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────┐                   │
│  │ TeacherSessionsScreen                │                   │
│  │ - List of upcoming sessions          │                   │
│  │ - Grouped by course/group            │                   │
│  │ - Each session:                      │                   │
│  │   - Student name, date, time         │                   │
│  │   - Status badge                     │                   │
│  │   - [Start] button                   │                   │
│  │   - Tap Start → Agora host session   │                   │
│  └──────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Request/Response Examples

### 1. Create Individual Course (Teacher)

**POST** `/api/teacher/courses`

**Request:**
```json
{
  "name": "English Speaking Practice",
  "description": "Improve your English conversation skills",
  "course_type": "package",
  "course_format": "individual",
  "price": 50,
  "duration_hours": 1,
  "status": "published",
  "available_slots": [
    {"day": 3, "times": ["09:00", "14:00"]},
    {"day": 5, "times": ["10:00", "16:00"]}
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "id": 42,
    "name": "English Speaking Practice",
    "course_format": "individual",
    "price": 50,
    "teacher_id": 5,
    "status": "published",
    "availability_slots": [
      {"id": 101, "day_number": 3, "start_time": "09:00", "end_time": "10:00"},
      {"id": 102, "day_number": 3, "start_time": "14:00", "end_time": "15:00"},
      {"id": 103, "day_number": 5, "start_time": "10:00", "end_time": "11:00"},
      {"id": 104, "day_number": 5, "start_time": "16:00", "end_time": "17:00"}
    ]
  }
}
```

### 2. Create Group Course (Teacher)

**POST** `/api/teacher/courses`

**Request:**
```json
{
  "name": "IELTS Preparation Group",
  "description": "Prepare for IELTS exam with group practice",
  "course_type": "package",
  "course_format": "group",
  "price": 40,
  "duration_hours": 1,
  "max_students": 8,
  "min_students": 3,
  "status": "published",
  "schedule_pattern": {
    "days": [3, 5],
    "time": "18:00",
    "end_time": "19:00"
  },
  "start_date": "2026-06-01",
  "total_sessions": 8
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "id": 43,
    "name": "IELTS Preparation Group",
    "course_format": "group",
    "price": 40,
    "max_students": 8,
    "min_students": 3,
    "course_groups": [
      {
        "id": 10,
        "group_name": "Group 1",
        "start_date": "2026-06-01",
        "schedule_pattern": {"days": [3,5], "time": "18:00", "end_time": "19:00"},
        "total_sessions": 8,
        "max_students": 8,
        "min_students": 3,
        "enrolled_count": 0,
        "status": "open"
      }
    ]
  }
}
```

### 3. Get Course Details + Groups (Student)

**GET** `/api/courses/43`

**Response:**
```json
{
  "success": true,
  "data": {
    "course": {
      "id": 43,
      "name": "IELTS Preparation Group",
      "course_format": "group",
      "price": 40,
      "course_groups": [
        {
          "id": 10,
          "group_name": "Group 1",
          "start_date": "2026-06-01",
          "enrolled_count": 2,
          "max_students": 8,
          "remaining_seats": 6,
          "is_full": false,
          "status": "open"
        }
      ]
    },
    "teacher_profile": {...},
    "teacher_basic": {...}
  }
}
```

### 4. Book Individual Course (Student)

**POST** `/api/student/booking/course`

**Request:**
```json
{
  "course_id": 42,
  "availability_slot_id": 101,
  "type": "package",
  "sessions_count": 4
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "id": 55,
      "reference": "BK20260504001",
      "status": "pending_payment",
      "total_amount": 192.0,
      "currency": "SAR",
      "sessions_count": 4,
      "first_session_date": "2026-05-06",
      "first_session_start_time": "09:00:00"
    },
    "requires_payment_method": false
  }
}
```

### 5. Book Group Course (Student)

**POST** `/api/student/booking/course`

**Request:**
```json
{
  "course_id": 43,
  "course_group_id": 10,
  "type": "package"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "id": 56,
      "reference": "BK20260504002",
      "status": "pending_payment",
      "total_amount": 304.0,
      "currency": "SAR",
      "sessions_count": 8,
      "first_session_date": "2026-06-01",
      "first_session_start_time": "18:00"
    },
    "meta": {
      "course_group": {
        "id": 10,
        "group_name": "Group 1",
        "start_date": "2026-06-01",
        "enrolled_count": 2,
        "max_students": 8,
        "remaining_seats": 6
      }
    }
  }
}
```

### 6. Payment Flow (Student)

**Step 1: Initiate payment**

**POST** `/api/student/payments/checkout`

```json
{
  "booking_id": 55,
  "amount": 192.0,
  "currency": "SAR"
}
```

**Step 2: Poll payment status**

**POST** `/api/student/payments/status`

```json
{
  "payment_id": "pay_xxxxxx"
}
```

**Response (on success):**
```json
{
  "success": true,
  "message": "Payment successful",
  "data": {
    "status": "paid",
    "booking_id": 55,
    "sessions_created": true
  }
}
```

### 7. Teacher — View Group Students

**GET** `/api/teacher/courses/43/groups/10/students`

**Response:**
```json
{
  "success": true,
  "data": {
    "group": {
      "id": 10,
      "group_name": "Group 1",
      "start_date": "2026-06-01",
      "status": "open",
      "enrolled_count": 2,
      "max_students": 8
    },
    "students": [
      {
        "booking_id": 56,
        "booking_reference": "BK20260504002",
        "student_id": 12,
        "student_name": "Ahmed Ali",
        "student_email": "ahmed@email.com",
        "sessions_count": 8,
        "sessions_completed": 0
      },
      {
        "booking_id": 57,
        "booking_reference": "BK20260504003",
        "student_id": 15,
        "student_name": "Sara Khan",
        "student_email": "sara@email.com",
        "sessions_count": 8,
        "sessions_completed": 0
      }
    ]
  }
}
```

---

## Flutter Implementation Notes

### 1. Course Format Picker
```dart
class CourseFormatPicker extends StatelessWidget {
  final ValueChanged<CourseFormat> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _OptionButton(
          label: 'Individual (1-on-1)',
          icon: Icons.person,
          onTap: () => onChanged(CourseFormat.individual),
        ),
        _OptionButton(
          label: 'Group',
          icon: Icons.group,
          onTap: () => onChanged(CourseFormat.group),
        ),
      ],
    );
  }
}
```

### 2. Weekly Availability Grid (Individual Courses)
```dart
class WeeklyAvailabilityGrid extends StatefulWidget {
  final List<AvailabilitySlot> slots;
  final void Function(int day, String time) onAddSlot;
  final void Function(int slotId) onRemoveSlot;

  // Show 7 columns (Sat-Fri), each row is a time slot
  // Teacher taps empty cells to add, taps filled cells to remove
}
```

### 3. Group Schedule Builder (Group Courses)
```dart
class GroupScheduleBuilder extends StatefulWidget {
  // Multi-select days of week (checkboxes for Sat-Fri)
  // Time picker for start/end time
  // Number input for total sessions
  // Number inputs for max/min students
  // Date picker for start date
}
```

### 4. Session Join (Agora)
```dart
// When student taps [Join] on a session:
// 1. Call GET /api/student/sessions/{id} to get session details
// 2. Get Agora token from your backend (existing Agora endpoint)
// 3. Launch Agora video call screen with:
//    - channelName: session.meetingId
//    - role: client (student) or host (teacher)
//    - uid: studentId/teacherId
```

### 5. Payment Flow State Machine
```
BookingCreated (pending_payment)
  → PaymentInitiated (checkout created)
    → PaymentInProgress (user in Moyasar SDK)
      → PaymentSuccess (status: paid) → SessionsCreated → BookingConfirmed
      → PaymentFailed → Return to PaymentScreen (retry)
```

### 6. Group Card Widget
```dart
class GroupCard extends StatelessWidget {
  final CourseGroup group;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          Text(group.groupName),
          Text(group.startDate),
          LinearProgressIndicator(
            value: group.enrolledCount / group.maxStudents,
          ),
          Text('${group.enrolledCount}/${group.maxStudents} enrolled'),
          if (group.isFull)
            Chip(label: Text('Full')),
          if (!group.minReached)
            Chip(label: Text('Needs ${group.minStudents! - group.enrolledCount} more')),
          ElevatedButton(
            onPressed: group.canJoin ? () => _bookGroup(group) : null,
            child: Text(group.isFull ? 'Full' : 'Join Group'),
          ),
        ],
      ),
    );
  }
}
```

---

## Business Rules Summary

### Individual Courses
1. Teacher sets weekly availability (day + time slots)
2. Student browses → picks a slot → creates booking (pending_payment)
3. Student pays → slot locked → sessions created weekly → Agora meetings created
4. Each student gets their own private sessions at the slot time
5. Multiple students can book the same course at DIFFERENT slots
6. Once a slot is booked, it's unavailable for other students

### Group Courses
1. Teacher creates course → creates one or more groups with schedule + start date
2. Student browses → sees groups with enrollment count → picks a group
3. Student pays → sessions created from schedule pattern → enrolled_count +1
4. All students in same group share the same session dates/times
5. Teacher can start the group when min_students is reached
6. Group fills up naturally — no waiting for strangers to pick the same slot

---

## Error Handling

| Scenario | HTTP Code | Response |
|----------|-----------|----------|
| Group is full | 400 | `"This group is full"` |
| No slot provided for individual course | 422 | `"For individual courses you must select an availability slot"` |
| No group selected for group course | 422 | `"For group courses you must select a course group"` |
| Slot already booked | 400 | `"Cannot book unavailable slot"` |
| Min students not met (teacher tries to start) | 400 | `"Minimum X students required"` |
| Course not published | 404 | Course not found |
| Payment fails | 400 | Payment status from Moyasar |

---

## Migration Steps

```bash
# Run migrations
php artisan migrate

# Verify tables created
php artisan db:show --table=course_groups
php artisan db:show --table=courses
php artisan db:show --table=bookings
```
