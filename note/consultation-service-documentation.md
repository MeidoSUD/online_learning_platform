# Education Consultation Service — API & Logic Documentation (Flutter Team)

> **Service name:** Education Consultation (`consultation`)
> **Purpose:** Students submit consultation requests (e.g. IELTS help, research papers, homework, university admission), our support team reviews and assigns the right teacher, and the teacher schedules a paid **online (video) session** using the existing Agora session system.
>
> **Auth:** All consultation endpoints require authentication. Use `Authorization: Bearer <token>` (Sanctum). Roles are enforced by middleware:
> - `student` → role_id `4`
> - `teacher` → role_id `3`
> - `admin` → role_id `1`

---

## Table of Contents

1. [Business Flow & Status Machine](#1-business-flow--status-machine)
2. [Base URLs & Conventions](#2-base-urls--conventions)
3. [Student Endpoints](#3-student-endpoints)
4. [Teacher Endpoints](#4-teacher-endpoints)
5. [Admin Endpoints](#5-admin-endpoints)
6. [Online Session (Join / Start / Chat)](#6-online-session-join--start--chat)
7. [Data Models](#7-data-models)
8. [Price Calculation](#8-price-calculation)
9. [Notifications](#9-notifications)
10. [Important Notes / Gotchas](#10-important-notes--gotchas)

---

## 1. Business Flow & Status Machine

### 1.1 Lifecycle

```
Student browses categories
        ↓
Student submits consultation request  → status = pending
        ↓
Admin reviews                         → status = under_review
        ↓
Admin assigns a teacher               → status = assigned   (notifications sent to teacher + student)
        ↓
Teacher schedules the online session  → status = scheduled  (Booking + Payment + Sessions + Agora created)
        ↓
Session held online                   → status = completed

At any point before "completed":
  - Student can cancel      → status = cancelled
  - Admin can reject/cancel → status = rejected  /  cancelled
```

### 1.2 Allowed Status Transitions (enforced by backend)

| From           | Allowed transitions                         |
|----------------|---------------------------------------------|
| `pending`      | `under_review`, `rejected`, `cancelled`     |
| `under_review` | `assigned`, `rejected`, `cancelled`         |
| `assigned`     | `scheduled`, `cancelled`                    |
| `scheduled`    | `completed`, `cancelled`                    |
| `completed`    | `cancelled`                                 |
| `rejected`     | *(terminal — no transitions)*               |
| `cancelled`    | *(terminal — no transitions)*               |

### 1.3 Status Codes

| Value           | Display label |
|-----------------|---------------|
| `pending`       | Pending       |
| `under_review`  | Under Review  |
| `assigned`      | Assigned      |
| `scheduled`     | Scheduled     |
| `completed`     | Completed     |
| `cancelled`     | Cancelled     |
| `rejected`      | Rejected      |

> The API returns both machine values (`status`) and labels (`status_label`).

### 1.4 Who can act

| Action                    | Student | Teacher | Admin |
|---------------------------|:-------:|:-------:|:-----:|
| Create consultation       | ✅      | —       | —     |
| List own consultations    | ✅      | ✅*     | ✅    |
| View details              | ✅ own  | ✅ own  | ✅ any|
| Cancel                    | ✅ own (pending/under_review/assigned only) | — | ✅ any |
| Schedule session          | —       | ✅ own  | —     |
| Assign teacher            | —       | —       | ✅    |
| Change status             | —       | —       | ✅    |
| Manage categories         | —       | —       | ✅    |

\* Teacher only sees consultations **assigned to them** (`teacher_id`).

---

## 2. Base URLs & Conventions

| Role    | Base path    | Required headers / middleware       |
|---------|--------------|-------------------------------------|
| Student | `/api/student` | `auth:sanctum` + `role:student`    |
| Teacher | `/api/teacher` | `auth:sanctum` + `role:teacher`    |
| Admin   | `/api/admin`   | `auth:sanctum` + `role:admin`      |

- All request/response bodies are **JSON**.
- Time format everywhere: `H:i` (24h, e.g. `14:00`).
- Date format: `Y-m-d` (e.g. `2026-09-15`).
- Timestamps: `Y-m-d H:i:s`.
- Money: decimal string (e.g. `"75.00"`); currency is **SAR**.
- Success responses: `{ "success": true, "data": ... }`
- Validation errors: HTTP `422` with `{ "success": false, "message": "Validation failed", "errors": { field: [messages] } }`
- Not found: HTTP `404` with `{ "success": false, "message": "..." }`
- Server error: HTTP `500` with `{ "success": false, "message": "...", "error": "..." }`

---

## 3. Student Endpoints

### 3.1 Get consultation categories

```
GET /api/student/consultation/categories
```

Returns all **active** categories ordered by `sort_order`.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name_en": "International Exams",
      "name_ar": "الاختبارات الدولية",
      "description_en": null,
      "description_ar": null,
      "icon": null,
      "is_active": true,
      "sort_order": 0,
      "created_at": "2026-09-01T00:00:00.000000Z",
      "updated_at": "2026-09-01T00:00:00.000000Z"
    }
  ]
}
```

### 3.2 Submit a consultation request

```
POST /api/student/consultations
```

**Request body:**

| Field                 | Type                | Required | Rules                                              |
|-----------------------|---------------------|----------|----------------------------------------------------|
| `category_id`         | int                 | ✅        | must exist in `consultation_categories`            |
| `title`               | string              | no       | max 255                                            |
| `description`         | string              | ✅        | max 5000                                           |
| `preferred_language_id`| int                | no       | must exist in `languages`                          |
| `education_level_id`  | int                 | no       | must exist in `education_levels`                   |
| `class_id`            | int                 | no       | must exist in `classes`                            |
| `preferred_slots`     | array (1–5 items)   | no       | each slot:                                         |
| `preferred_slots[].date`| string (Y-m-d)    | ✅ (if slots) | date, `after_or_equal: today`                |
| `preferred_slots[].start_time`| string (H:i) | ✅ (if slots) | `date_format:H:i`                       |
| `preferred_slots[].end_time`| string (H:i)   | ✅ (if slots) | `after: start_time`                      |
| `duration_minutes`    | int                 | no       | 15–240 (default **60**)                            |
| `sessions_count`      | int                 | no       | 1–10 (default **1**)                               |
| `budget_min`          | number              | no       | ≥ 0                                                |
| `budget_max`          | number              | no       | ≥ 0                                                |

**Example request:**
```json
{
  "category_id": 1,
  "title": "Help with IELTS writing",
  "description": "I need help preparing for the writing section of IELTS.",
  "preferred_language_id": 2,
  "education_level_id": 3,
  "class_id": 5,
  "preferred_slots": [
    { "date": "2026-09-15", "start_time": "10:00", "end_time": "12:00" },
    { "date": "2026-09-17", "start_time": "14:00", "end_time": "16:00" }
  ],
  "duration_minutes": 60,
  "sessions_count": 1,
  "budget_min": 100,
  "budget_max": 500
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Consultation request submitted successfully. Our team will review it shortly.",
  "data": {
    "id": 1,
    "consultation_reference": "CONS-68C8A0B123456",
    "category_id": 1,
    "student_id": 42,
    "teacher_id": null,
    "service_id": null,
    "booking_id": null,
    "title": "Help with IELTS writing",
    "description": "I need help preparing for the writing section of IELTS.",
    "preferred_language_id": 2,
    "education_level_id": 3,
    "class_id": 5,
    "preferred_slots": [
      { "date": "2026-09-15", "start_time": "10:00", "end_time": "12:00" }
    ],
    "duration_minutes": 60,
    "sessions_count": 1,
    "budget_min": "100.00",
    "budget_max": "500.00",
    "price_per_session": null,
    "status": "pending",
    "status_label": "Pending",
    "assigned_by": null,
    "assigned_at": null,
    "admin_notes": null,
    "scheduled_date": null,
    "scheduled_start_time": null,
    "scheduled_end_time": null,
    "cancelled_at": null,
    "cancellation_reason": null,
    "created_at": "2026-09-07T10:00:00.000000Z",
    "updated_at": "2026-09-07T10:00:00.000000Z",
    "category": { "id": 1, "name_en": "International Exams", "name_ar": "الاختبارات الدولية" },
    "preferredLanguage": null,
    "educationLevel": { "id": 3, "name_en": "High School", "name_ar": "ثانوي" },
    "class": { "id": 5, "name_en": "Grade 12", "name_ar": "الثالث الثانوي" }
  }
}
```

> **Note:** The nested objects (`category`, `teacher`, `preferredLanguage`, `educationLevel`, `class`) follow **camelCase** keys (Laravel relation names), while top-level columns are **snake_case**.

### 3.3 List my consultations

```
GET /api/student/consultations
```

Returns all consultations for the logged-in student, newest first. Same object shape as 3.2 (with `category`, `teacher`, `preferredLanguage`, `educationLevel`, `class`).

### 3.4 View consultation details

```
GET /api/student/consultations/{id}
```

Returns full details **including** `booking.sessions`:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "scheduled",
    "...": "...",
    "booking": {
      "id": 45,
      "booking_reference": "CONS-...",
      "sessions": [
        {
          "id": 100,
          "session_title": "Consultation",
          "session_date": "2026-09-20",
          "start_time": "14:00",
          "end_time": "15:00",
          "duration": 60,
          "status": "scheduled",
          "join_url": "https://...",
          "meeting_id": "session_100"
        }
      ]
    }
  }
}
```

See [section 6](#6-online-session-join--start--chat) for how to join the session.

### 3.5 Cancel a consultation

```
POST /api/student/consultations/{id}/cancel
```

**Conditions:** Only allowed while status is `pending`, `under_review`, or `assigned` (otherwise 404).

**Request body:**

| Field    | Type   | Required | Notes                  |
|----------|--------|----------|------------------------|
| `reason` | string | no       | stored as `cancellation_reason` |

**Example:**
```json
{ "reason": "No longer needed" }
```

**Response 200:**
```json
{
  "success": true,
  "message": "Consultation request cancelled",
  "data": {
    "id": 1,
    "status": "cancelled",
    "cancelled_at": "2026-09-07T12:30:00.000000Z",
    "cancellation_reason": "No longer needed",
    "...": "..."
  }
}
```

---

## 4. Teacher Endpoints

### 4.1 List my assigned consultations

```
GET /api/teacher/consultations
```

Only consultations where `teacher_id` = the logged-in teacher. Includes `category`, `student`, `preferredLanguage`, `educationLevel`, `class`, `booking.sessions`.

### 4.2 View consultation details

```
GET /api/teacher/consultations/{id}
```

Same shape as student details (4.1). Student object includes contact info (`first_name`, `last_name`, `email`, `phone_number`) so the teacher can follow up.

### 4.3 Schedule the online session

```
POST /api/teacher/consultations/{id}/schedule
```

The **final step** of the flow. This creates a `Booking` + `Payment` + `Sessions` + Agora meeting and sets status to `scheduled`. Only the assigned teacher can call this, and only when status is `assigned` or `scheduled` (re-scheduling).

**Request body:**

| Field                  | Type     | Required | Rules                                  |
|------------------------|----------|----------|----------------------------------------|
| `scheduled_date`       | string (Y-m-d) | ✅ | date, `after_or_equal: today`    |
| `scheduled_start_time` | string (H:i)  | ✅ | `date_format:H:i`                |
| `scheduled_end_time`   | string (H:i)  | ✅ | `after: start_time`              |
| `admin_notes`          | string         | no | max 2000 (stored on the consultation) |

**Example:**
```json
{
  "scheduled_date": "2026-09-20",
  "scheduled_start_time": "14:00",
  "scheduled_end_time": "15:00",
  "admin_notes": "Focus on writing task 2 structure"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Consultation session scheduled. Online session created successfully.",
  "data": {
    "id": 1,
    "consultation_reference": "CONS-...",
    "status": "scheduled",
    "status_label": "Scheduled",
    "booking_id": 45,
    "service_id": 3,
    "price_per_session": "75.00",
    "scheduled_date": "2026-09-20",
    "scheduled_start_time": "14:00",
    "scheduled_end_time": "15:00",
    "booking": {
      "id": 45,
      "booking_reference": "CONS-...",
      "session_type": "single",
      "sessions_count": 1,
      "sessions_completed": 0,
      "first_session_date": "2026-09-20",
      "first_session_start_time": "14:00",
      "first_session_end_time": "15:00",
      "session_duration": 60,
      "teacher_rate_per_session": "75.00",
      "platform_percentage": null,
      "price_per_session": "75.00",
      "total_amount": "75.00",
      "currency": "SAR",
      "status": "confirmed",
      "sessions": [
        {
          "id": 100,
          "session_title": "Consultation",
          "session_number": 1,
          "session_date": "2026-09-20",
          "start_time": "14:00",
          "end_time": "15:00",
          "duration": 60,
          "status": "scheduled",
          "join_url": "https://...",
          "meeting_id": "session_100"
        }
      ]
    },
    "category": { "id": 1, "name_en": "International Exams", "name_ar": "الاختبارات الدولية" },
    "student": { "id": 42, "first_name": "Ahmed", "last_name": "Ali", "email": "...", "phone_number": "..." },
    "teacher": { "id": 7, "first_name": "Sara", "last_name": "Mohammed", "email": "..." }
  }
}
```

> **What happens server-side (transaction):**
> 1. Creates/finds the `consultation` service record (`key_name = 'consultation'`, role_id 4).
> 2. Reads teacher's hourly rate from `teacher_info.individual_hour_price`.
> 3. Calculates price (see [section 8](#8-price-calculation)).
> 4. Creates a `booking` (`session_type = single`, `status = confirmed`, `platform_percentage = 0`, `special_requests = consultation.description`).
> 5. Creates a `payment` row (`status = paid`, `payment_method = 'consultation'`).
> 6. Creates the session(s) via `Sessions::createForBooking()`.
> 7. Generates the Agora meeting links.
> 8. Updates the consultation with `booking_id`, `service_id`, `price_per_session`, status `scheduled`, schedule times.
> 9. Sends notifications to student + teacher.

---

## 5. Admin Endpoints

### 5.1 Dashboard stats

```
GET /api/admin/consultations/stats
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total": 42,
    "pending": 5,
    "under_review": 3,
    "assigned": 2,
    "scheduled": 8,
    "completed": 20,
    "cancelled": 4
  }
}
```

### 5.2 List all consultations (paginated, filterable)

```
GET /api/admin/consultations
```

**Query parameters:**

| Param        | Values                                                         |
|--------------|----------------------------------------------------------------|
| `status`     | `pending`, `under_review`, `assigned`, `scheduled`, `completed`, `cancelled`, `rejected` |
| `search`     | matches reference, student first/last name, category name (en/ar) |
| `sort_by`    | `id`, `status`, `created_at`, `updated_at`, `assigned_at` (default `created_at`) |
| `sort_order` | `ASC` / `DESC` (default `DESC`)                                 |
| `per_page`   | page size (default 20)                                          |

**Response 200:**
```json
{
  "success": true,
  "message": "Consultations retrieved successfully",
  "data": [
    {
      "id": "1",
      "consultation_reference": "CONS-...",
      "category": { "id": "1", "name_en": "International Exams", "name_ar": "..." },
      "student": { "id": "42", "first_name": "Ahmed", "last_name": "Ali", "email": "...", "phone_number": "..." },
      "teacher": { "id": "7", "first_name": "Sara", "last_name": "Mohammed", "email": "..." },
      "title": "Help with IELTS writing",
      "description": "...",
      "preferred_slots": [ { "date": "2026-09-15", "start_time": "10:00", "end_time": "12:00" } ],
      "duration_minutes": 60,
      "sessions_count": 1,
      "budget_min": "100.00",
      "budget_max": "500.00",
      "price_per_session": null,
      "status": "under_review",
      "status_label": "Under Review",
      "admin_notes": null,
      "scheduled_date": null,
      "scheduled_start_time": null,
      "scheduled_end_time": null,
      "booking_id": null,
      "assigned_at": null,
      "created_at": "2026-09-07 10:00:00",
      "updated_at": "2026-09-07 10:00:00"
    }
  ],
  "pagination": {
    "total": 42,
    "per_page": 20,
    "current_page": 1,
    "last_page": 3
  }
}
```

> Admin list responses use a **formatted** shape:
> - ids are cast to **strings** (`"1"`).
> - dates are `Y-m-d H:i:s` (no `Z` suffix).
> - `teacher` is `null` until assigned.

### 5.3 View consultation details

```
GET /api/admin/consultations/{id}
```

Full detail object (formatted shape from 5.2) plus:
- `teacher.teacherInfo` (hourly rate etc.)
- `assignedBy` (the admin user who assigned)
- `booking.sessions`
- `preferredLanguage`, `educationLevel`, `class`

### 5.4 List candidate teachers

```
GET /api/admin/consultations/teachers
```

Returns active verified teachers (role_id 3) with their consultation hourly rate, for the assignment dropdown.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "7",
      "first_name": "Sara",
      "last_name": "Mohammed",
      "email": "sara@example.com",
      "phone_number": "05xxxxxxx",
      "verified": true,
      "hourly_rate": 75
    }
  ]
}
```

### 5.5 Assign a teacher

```
POST /api/admin/consultations/{id}/assign-teacher
```

**Request body:**

| Field        | Type   | Required | Rules                              |
|--------------|--------|----------|------------------------------------|
| `teacher_id` | int    | ✅        | must exist in `users` and be role_id 3 |
| `admin_notes`| string | no       | max 2000                           |

**Conditions:** Only allowed when status is `pending`, `under_review`, or `assigned`. Otherwise HTTP 422.

**Example:**
```json
{ "teacher_id": 7, "admin_notes": "Best fit for IELTS writing" }
```

**Response 200:** Formatted consultation object with status `assigned`. Notifications are sent to the teacher ("New consultation assigned to you") and the student ("Teacher assigned to your consultation").

### 5.6 Update status

```
PUT /api/admin/consultations/{id}/status
```

**Request body:**

| Field         | Type   | Required | Rules                                                        |
|---------------|--------|----------|--------------------------------------------------------------|
| `status`      | string | ✅        | one of `pending`, `under_review`, `assigned`, `scheduled`, `completed`, `cancelled`, `rejected` |
| `admin_notes` | string | no       | max 2000                                                     |

**Important:** The transition must be valid per the [status machine](#12-allowed-status-transitions-enforced-by-backend). Invalid transitions return HTTP 422 with a message like `Cannot transition from 'pending' to 'completed'`.

### 5.7 Category management (CRUD)

| Action | Method | Path |
|--------|--------|------|
| List categories | `GET` | `/api/admin/consultation-categories` |
| Create category | `POST` | `/api/admin/consultation-categories` |
| Update category | `PUT` | `/api/admin/consultation-categories/{id}` |
| Delete category | `DELETE` | `/api/admin/consultation-categories/{id}` |

**Create/Update fields:**

| Field            | Type    | Required (create) |
|------------------|---------|-------------------|
| `name_en`        | string  | ✅                 |
| `name_ar`        | string  | ✅                 |
| `description_en` | string  | no                 |
| `description_ar` | string  | no                 |
| `icon`           | string  | no                 |
| `is_active`      | boolean | no (default `true`)|
| `sort_order`     | int     | no (default `0`)   |

**List** adds a `consultations_count` field (number of requests per category).

**Delete** is blocked with HTTP 422 if the category already has consultation requests:
```json
{ "success": false, "message": "Cannot delete a category that has consultation requests" }
```

---

## 6. Online Session (Join / Start / Chat)

Consultations reuse the existing **Sessions** system (Agora). After the teacher schedules, a session row appears under `booking.sessions`. The flow to enter the video call:

### 6.1 Get session details

```
GET /api/student/sessions/{sessionId}            (student)
GET /api/teacher/sessions/{sessionId}            (teacher)
```

Returns the session object (`id`, `status`, `meeting_id`, `join_url`, teacher/student info).

### 6.2 Teacher starts the session

```
POST /api/teacher/sessions/{id}/start
```

Only the teacher. Allowed up to **15 minutes before** the scheduled start. Returns Agora RTC **host** credentials + chat credentials:

```json
{
  "success": true,
  "message": "Session started",
  "data": {
    "agora": {
      "channel": "session_100",
      "token": "007eJxTY...",
      "uid": "teacher_7",
      "role": "host",
      "expires_in": 3600,
      "chat_channel": "session_100",
      "app_id": "...",
      "chat_token": "...",
      "chat_uid": "...",
      "chat_expires_in": 3600,
      "chat_agora_uid": "...",
      "chat_room_id": "..."
    },
    "session_status": "live"
  }
}
```

### 6.3 Participant joins (student or teacher)

```
POST /api/student/sessions/{id}/join
```

- If the teacher has **not** started yet, the backend returns HTTP **423**:
  ```json
  { "success": false, "message": "Waiting for teacher to start the session", "data": { "session_status": "waiting_for_teacher" } }
  ```
  → The app should show "Waiting for teacher…".
- Once live, returns Agora **subscriber/participant** token (teacher gets `host` role, student gets `participant`):

```json
{
  "success": true,
  "message": "You can now join the session",
  "data": {
    "agora": {
      "channel": "session_100",
      "token": "007eJx...",
      "uid": "student_42",
      "role": "participant",
      "expires_in": 3600,
      "chat_channel": "session_100",
      "app_id": "...",
      "chat_token": "...",
      "chat_uid": "...",
      "chat_expires_in": 3600,
      "chat_agora_uid": "...",
      "chat_room_id": "..."
    }
  }
}
```

### 6.4 Chat token (optional, shown before session starts)

```
POST /api/student/sessions/{id}/chat-token
POST /api/teacher/sessions/{id}/chat-token
```

Can be called **before** the session goes live to let users open the chat / wait room. Returns `chat` credentials (same shape as above) plus `chat_room_id`.

### 6.5 End session (teacher)

```
POST /api/teacher/sessions/{id}/end
```

Marks the session `ended` and increments the booking's completed-session count.

---

## 7. Data Models

### 7.1 `consultations`

| Column                   | Type            | Notes                                        |
|--------------------------|-----------------|----------------------------------------------|
| `id`                     | bigint (PK)     |                                              |
| `consultation_reference` | string (unique) | `CONS-{uniqid}` e.g. `CONS-68C8A0B123456`    |
| `category_id`            | FK → `consultation_categories` |                          |
| `student_id`             | FK → `users`    | cascade delete                               |
| `teacher_id`             | FK → `users`    | nullable; set when assigned                  |
| `service_id`             | FK → `services` | set when scheduled (`key_name='consultation'`) |
| `booking_id`             | FK → `bookings` | set when scheduled                           |
| `title`                  | string          | nullable                                     |
| `description`            | text            |                                              |
| `preferred_language_id`  | FK → `languages`| nullable                                     |
| `education_level_id`     | FK → `education_levels` | nullable                             |
| `class_id`               | FK → `classes`  | nullable                                     |
| `preferred_slots`        | json            | array of `{date, start_time, end_time}`      |
| `duration_minutes`       | int             | default 60                                   |
| `sessions_count`         | int             | default 1                                    |
| `budget_min`             | decimal(10,2)   | nullable                                     |
| `budget_max`             | decimal(10,2)   | nullable                                     |
| `price_per_session`      | decimal(10,2)   | set when scheduled                           |
| `status`                 | enum            | see [status machine](#13-status-codes)       |
| `assigned_by`            | FK → `users`    | admin who assigned                           |
| `assigned_at`            | timestamp       | nullable                                     |
| `admin_notes`            | text            | nullable                                     |
| `scheduled_date`         | date            | nullable                                     |
| `scheduled_start_time`   | time            | nullable                                     |
| `scheduled_end_time`     | time            | nullable                                     |
| `cancelled_at`           | timestamp       | nullable                                     |
| `cancellation_reason`    | text            | nullable                                     |
| `created_at` / `updated_at` | timestamps   |                                              |

Indexes: `status`, composite `(status, teacher_id)`.

### 7.2 `consultation_categories`

| Column            | Type          | Notes                        |
|-------------------|---------------|------------------------------|
| `id`              | bigint (PK)   |                              |
| `name_en`         | string        | required                     |
| `name_ar`         | string        | required                     |
| `description_en`  | text          | nullable                     |
| `description_ar`  | text          | nullable                     |
| `icon`            | string        | nullable                     |
| `is_active`       | boolean       | default true                 |
| `sort_order`      | int           | default 0                    |
| `created_at` / `updated_at` | timestamps |                     |

### 7.3 Seeded category list (from `ConsultationSeeder`)

1. **International Exams** (الاختبارات الدولية) — IELTS, TOEFL, SAT, GRE
2. **Research & Papers** (البحوث والأوراق العلمية) — theses, scientific papers
3. **Homework Help** (مساعدة في الواجبات) — assignments, exercises
4. **Mathematics** (الرياضيات) — all levels
5. **University Admission** (القبول الجامعي) — application guidance
6. **Career Guidance** (الإرشاد المهني) — career-path consultations

### 7.4 Linked models (used by scheduling)

- **`bookings`** → `session_type='single'`, `status='confirmed'`, `platform_percentage=0`, `special_requests = description`, `currency='SAR'`.
- **`payments`** → `payment_method='consultation'`, `status='paid'`, `transaction_reference = booking_reference`.
- **`sessions`** → one per `sessions_count`; carries `meeting_id` (`session_{id}`), `join_url`, `host_url`, `chat_room_id`. Statuses: `scheduled`, `live`, `ended`, `completed`, `cancelled`, `wait_for_teacher`.

---

## 8. Price Calculation

On scheduling, the backend computes:

```
hourly_rate  = teacher_info.individual_hour_price   (fallback 0)
price_per_session = round( (hourly_rate × duration_minutes) / 60, 2 )
total              = price_per_session × sessions_count
```

Example: teacher = 75 SAR/h, duration = 60 min → `price_per_session = 75.00`, total `75.00` for 1 session.

- Stored on the consultation as `price_per_session`.
- Stored on the booking as `price_per_session`, `subtotal`, `total_amount`.
- **Platform percentage is 0** for consultations (no platform cut).

---

## 9. Notifications

Two events push in-app + push + email (per user notification settings), type `'consultation'`:

| Event                    | Sent to                  | Content summary                                          |
|--------------------------|--------------------------|----------------------------------------------------------|
| Teacher assigned         | Teacher + Student        | "New consultation assigned to you" / "Teacher assigned to your consultation" |
| Session scheduled        | Teacher + Student        | "Consultation session scheduled" + date/time             |

Payload includes `consultation_id` (and `booking_id` for scheduling).

---

## 10. Important Notes / Gotchas

1. **Key naming:** Consultation list/detail responses (student/teacher) are **raw model objects** — top-level columns are snake_case, relation objects are camelCase keys (`category`, `teacher`, `preferredLanguage`, `educationLevel`, `class`, `booking`). Admin responses use the **formatted** shape (IDs as strings, `Y-m-d H:i:s` dates, flat structure).
2. **Cancel scope:** Student cancel works **only** for `pending`, `under_review`, `assigned`. If status is already `scheduled`, the cancel request returns 404 (consultation not found) — the app should treat this as "cannot cancel".
3. **Assignment rule:** `assign-teacher` also rejects statuses outside `pending`/`under_review`/`assigned` with HTTP 422.
4. **Re-scheduling:** The teacher can call `schedule` again when status is already `scheduled` (it re-runs the booking creation flow).
5. **Status label:** Always `status_label` from the server for display; don't hardcode labels client-side.
6. **Money:** parse decimals as strings to avoid float rounding in Dart; currency is SAR.
7. **Join window:** A participant calling `join` before the teacher starts receives HTTP **423** `waiting_for_teacher` — poll or wait until the teacher calls `start`.
8. **Join window (teacher):** `start` only works from 15 minutes before the scheduled time; use `chat-token` for pre-session chat.
9. **Agora app_id** comes back from the API in the join/start/chat responses; do not hardcode it in the app.
10. **Session statuses** (`scheduled`/`live`/`ended`) belong to `sessions`, and are **different** from consultation statuses (`pending`…`completed`). When a session ends it does **not** auto-complete the consultation — admin flips it to `completed` (or via a future webhook).