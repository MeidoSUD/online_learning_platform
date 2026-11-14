# Timezone Architecture & Implementation Specification (Universal Multi-Country Support)

## 1. Executive Summary & Root Cause Analysis

### The Problem
1. **Sessions Displayed in Saudi Time for International Users (e.g. Egypt, Jordan, UAE, US, UK, etc.)**:
   - The Laravel application backend is configured to `Asia/Riyadh` (`UTC+3`) in `config/app.php`.
   - When a session is created in the `sessions` table, `session_date` (e.g. `2026-11-10`) and `start_time` (e.g. `16:00:00`) are stored without timezone or offset information.
   - When users outside Saudi Arabia (such as Egypt `UTC+2` standard time / `UTC+3` DST) fetch their sessions via `/api/sessions`, the API previously outputted raw `start_time: "16:00:00"`.
   - Users in Egypt saw "16:00" on their screens and believed the lesson started at 16:00 Cairo time. However, 16:00 Saudi time is **15:00 Cairo time**.
   - As a result, when an Egyptian student or teacher attempted to start or join at 16:00 Cairo time, the session was already 1 hour overdue!

2. **Availability Slots Saved by International Teachers**:
   - Teachers outside Saudi Arabia (e.g., Egypt, UAE, Jordan, UK) set their recurring availability slots (e.g., Saturday 16:00).
   - They enter times relative to their **own local time zone** (e.g. 16:00 Cairo or 16:00 Dubai).
   - Without storing and communicating the teacher's timezone offset, students in different countries booking that slot were booking a time without knowing which country's clock the teacher was using.

---

## 2. Implemented Universal Architecture

The solution supports **all countries and timezones globally** (Saudi Arabia, Egypt, UAE, Kuwait, Qatar, Bahrain, Oman, Jordan, Lebanon, Iraq, Syria, Yemen, Sudan, Libya, Tunisia, Algeria, Morocco, Turkey, US, UK, Europe, etc.).

### Key Architectural Pillars:
1. **Dynamic Offset & IANA Identification**: All offsets are computed dynamically using `Carbon::now($timezone)->format('P')`, properly accounting for Daylight Saving Time (DST) changes across all regions.
2. **Normalized Platform Datetime (`start_at_iso`)**: Every session outputs an unambiguous ISO-8601 string (e.g. `2026-11-14T16:00:00+03:00`). Both Mobile (Flutter `DateTime.parse`) and Web (`new Date()`) parse this automatically into the user's phone or browser clock.
3. **Pre-Calculated `user_local_time` Object**: For convenience, the API automatically computes the date, day name, and time in the authenticated user's local timezone.
4. **Teacher Timezone Awareness in Slots**: Availability slots return `teacher_timezone_offset` and `teacher_timezone` so clients can present slots transparently.

---

## 3. Standardized API Contracts (Mobile & Web Parity)

### 3.1. Teacher Availability Management

#### A. `POST /api/teacher/availability` & `PUT /api/teacher/availability/{id}`
Teachers send their availability slots along with their timezone and offset.

**Request Payload:**
```json
{
  "timezone": "Asia/Riyadh",
  "timezone_offset": "+03:00",
  "available_times": [
    {
      "day": 1,
      "times": [
        "16:00",
        "18:30"
      ]
    },
    {
      "day": 2,
      "times": [
        "10:00"
      ]
    }
  ]
}
```

**Backend Handling:**
- Validates `timezone` as a valid IANA timezone name.
- Updates `users.timezone` on the teacher's profile.
- Saves availability slots.
- Returns `timezone` and `timezone_offset` in the response.

---

#### B. `GET /api/teacher/availability`
Returns the teacher's slots grouped by day, explicitly returning `teacher_timezone_offset` and `teacher_timezone` on each day item and top level.

**Response Payload:**
```json
{
  "success": true,
  "timezone": "Africa/Cairo",
  "timezone_offset": "+02:00",
  "data": [
    {
      "day": 1,
      "teacher_timezone_offset": "+02:00",
      "teacher_timezone": "Africa/Cairo",
      "time_slots": [
        {
          "id": 105,
          "time": "16:00",
          "is_available": true,
          "is_booked": false,
          "session": null
        }
      ]
    }
  ]
}
```

---

### 3.2. Student Viewing Teacher Slots (`GET /api/teachers/{id}`)

When a student in any country views a teacher's profile:
- `available_times` includes `teacher_timezone` and `teacher_timezone_offset` both at the root teacher level and inside each day entry.
- Clients can display the slots with a timezone badge (e.g., `16:00 (+02:00 Cairo)`) or convert them to student device time.

**Response Snippet:**
```json
{
  "teacher_timezone": "Africa/Cairo",
  "teacher_timezone_offset": "+02:00",
  "available_times": [
    {
      "id": 1,
      "day_number": 1,
      "day": "السبت",
      "day_ar": "السبت",
      "day_en": "Saturday",
      "teacher_timezone": "Africa/Cairo",
      "teacher_timezone_offset": "+02:00",
      "times": [
        {
          "id": 105,
          "time": "04:00 PM",
          "start_time": "16:00:00",
          "end_time": "17:00:00",
          "duration": 60,
          "is_available": true,
          "is_booked": false
        }
      ]
    }
  ]
}
```

---

### 3.3. Timeslot Session Date Resolution (`GET /api/student/timeslots/{slotId}/session-date`)

When a student checks a slot prior to booking:
- Returns `teacher_timezone`, `teacher_timezone_offset`, `start_datetime_iso`, and `end_datetime_iso`.
- Allows client to show the exact future date and time in both teacher time and student local time.

**Response Snippet:**
```json
{
  "success": true,
  "data": {
    "slot_id": 105,
    "teacher_id": 42,
    "teacher_timezone": "Africa/Cairo",
    "teacher_timezone_offset": "+02:00",
    "day_number": 1,
    "day_name_ar": "السبت",
    "day_name_en": "Saturday",
    "session_date": "2026-11-14",
    "start_time": "16:00",
    "end_time": "17:00",
    "start_datetime_iso": "2026-11-14T16:00:00+02:00",
    "end_datetime_iso": "2026-11-14T17:00:00+02:00",
    "duration": 60
  }
}
```

---

### 3.4. Sessions API (`GET /api/sessions`, `GET /api/sessions/{id}`, `GET /api/sessions/grouped`)

This resolves the core bug where international users see Saudi time and miss sessions.

**Enhanced Response Payload in `transformSession`:**
```json
{
  "id": 204,
  "session_number": 1,
  "session_title": "Mathematics",
  "session_date": "2026-11-14",
  "start_time": "16:00:00",
  "end_time": "17:00:00",
  "timezone": "Asia/Riyadh",
  "timezone_offset": "+03:00",
  "start_at_iso": "2026-11-14T16:00:00+03:00",
  "end_at_iso": "2026-11-14T17:00:00+03:00",
  "user_local_time": {
    "timezone": "Africa/Cairo",
    "timezone_offset": "+02:00",
    "session_date": "2026-11-14",
    "day_name": "Saturday",
    "day_number": 6,
    "start_time": "15:00:00",
    "end_time": "16:00:00",
    "start_at_iso": "2026-11-14T15:00:00+02:00",
    "end_at_iso": "2026-11-14T16:00:00+02:00"
  },
  "can_start": false,
  "can_join": false,
  "status": "scheduled"
}
```

---

## 4. Modified Backend Files

1. **`app/Helpers/CountryTimezone.php`**:
   - Expanded mapping to cover all Arab, European, American, and Asian regions.
   - Added `isValidTimezone($timezone)` to validate standard IANA timezone identifiers.
   - Added `getOffset($timezone)` to dynamically calculate current UTC offset (e.g. `+03:00`, `+02:00`, `-05:00`).
   - Added `normalizeTimezone($timezone, $fallback)`.

2. **`app/Models/User.php`**:
   - Added `getTimezoneNameAttribute()` resolving the user's timezone from user record, nationality, or system fallback.
   - Added `getTimezoneOffsetAttribute()` returning current offset dynamically.

3. **`app/Http/Controllers/API/AvailabilityController.php`**:
   - In `index()`: Injects `teacher_timezone_offset` and `teacher_timezone` into each day and root response.
   - In `store()` and `update()`: Validates `timezone` and `timezone_offset` and updates the teacher's profile.

4. **`app/Http/Controllers/Teacher/TeacherAvailabilityController.php`**:
   - Web parity: Validates `timezone` and updates teacher record on `store` and `update`.
   - Passes `teacherTimezone` and `teacherOffset` to the Blade view.

5. **`app/Services/User/TeacherProfileService.php`**:
   - In `teacherDetails()`: Exposes `teacher_timezone` and `teacher_timezone_offset` on the teacher data and in `available_times`.

6. **`app/Services/Booking/BookingValidationService.php`**:
   - In `getTimeslotSessionInfo()`: Exposes `teacher_timezone`, `teacher_timezone_offset`, `start_datetime_iso`, and `end_datetime_iso`.

7. **`app/Http/Controllers/API/SessionsController.php`**:
   - In `transformSession()` and `groupedSessions()`: Adds `timezone`, `timezone_offset`, `start_at_iso`, `end_at_iso`, and `user_local_time` object.

---

## 5. Client Guidelines (Flutter & Web)

1. **For Session Countdowns & Display**:
   - Always use `start_at_iso` (e.g. `"2026-11-14T16:00:00+03:00"`):
     - **Flutter**: `DateTime sessionTime = DateTime.parse(session['start_at_iso']).toLocal();`
     - **Web JS**: `const sessionTime = new Date(session.start_at_iso);`
   - Alternatively, display `session.user_local_time.start_time`.
2. **For Availability Submission (`POST /api/teacher/availability` & `PUT /api/teacher/availability/{id}`)**:
   - Pass device timezone: e.g. `timezone_offset: "+02:00"`, `timezone_name: "EET"` (or `timezone: "Africa/Khartoum"`).
   - Any client field (`timezone`, `timezone_name`, `timezone_offset`, `teacher_timezone_offset`) is automatically recognized and resolved.
   - The backend normalizes slot times to platform storage time (`Asia/Riyadh`, `+03:00`), so bookings and sessions are universally synchronized across all countries without any 1-hour shifts.

---

## 6. Sudan / Egypt vs. Saudi Real-World Flow Example

### Step 1: Teacher in Sudan (+02:00) adds availability for 8:00 PM
- Teacher sends:
  ```json
  {
    "timezone_offset": "+02:00",
    "timezone_name": "EET",
    "available_times": [
      { "day": 3, "times": ["20:00"] }
    ]
  }
  ```
- **Backend conversion**:
  - `+02:00` (Sudan) to `+03:00` (Saudi platform storage) shifts `20:00` to `21:00`.
  - Stored in `availability_slots`: `day_number = 3`, `start_time = "21:00:00"`, `end_time = "22:00:00"`.
- **Response to Teacher**:
  - `timezone_offset`: `"+02:00"`
  - `timezone`: `"Africa/Cairo"` / `"Africa/Khartoum"`
  - `start_time`: `"20:00"` (teacher sees their own 8:00 PM).

### Step 2: Student in Saudi Arabia (+03:00) views the teacher (`GET /api/teachers/{id}`)
- Viewer offset is `+03:00`.
- Backend converts `21:00` (storage) to viewer offset `+03:00`:
  - `time`: `"09:00 PM"` (`start_time: "21:00:00"`)
  - `teacher_time`: `"08:00 PM"` (`teacher_timezone_offset: "+02:00"`)
- The Saudi student clearly sees the session is at **9:00 PM Saudi time** (which corresponds to 8:00 PM Sudan time).

### Step 3: Booking & Attending the Session
- When booked, a session is created with `session_date` and `start_time: "21:00:00"` (Saudi base time).
- `GET /api/sessions`:
  - `start_at_iso`: `"2026-11-14T21:00:00+03:00"`
  - **Saudi Student** `user_local_time`: `start_time: "21:00:00"` (9:00 PM).
  - **Sudan Teacher** `user_local_time`: `start_time: "20:00:00"` (8:00 PM).
- Both the teacher and student join the video room at the exact same physical moment. Neither is early or late!

---

## 7. Embedded Social Sign-Up / Sign-In (Google & Apple ID)

### Backend Endpoints:
- `POST /api/auth/social-login`
- `POST /api/auth/social/google`
- `POST /api/auth/social/apple`

### Payload:
```json
{
  "provider": "google", // or "apple"
  "id_token": "<Firebase / Google / Apple ID token>",
  "email": "user@example.com",
  "name": "User Name",
  "first_name": "First",
  "last_name": "Last",
  "role_id": 4, // 4 = Student (default), 3 = Teacher
  "timezone": "Africa/Khartoum",
  "timezone_offset": "+02:00"
}
```

### Verification & Behavior:
1. Validates token via Firebase Auth verification or Google/Apple token endpoints.
2. If user exists with the same email or provider ID, generates Sanctum access token and logs them in.
3. If new user, creates user record with given role (`student` or `teacher`), sets `social_provider`, verifies email automatically, and returns access token with full profile and timezone.
