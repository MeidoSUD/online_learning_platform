# Backend Guide: Admin Sessions Management

This guide explains the required JSON structures and API endpoints needed to support the new "Admin Sessions" features in the React Admin Dashboard.

## Required Endpoints
You need to implement the following **3 new endpoints** in the backend:

1. **Get All Sessions** (With optional filters)
2. **Reschedule / Make-up Session**
3. **Get User Sessions Profile** (By User ID and Role)

---

### 1. Get All Sessions
**Endpoint:** `GET /api/admin/sessions`
**Query Parameters (Optional):** `?teacher_name=...&student_name=...&status=...&date=...`

**Expected Response Format:**
The frontend expects either a direct array of session objects or an object containing a `data` property that holds the array.

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "booking_id": 101,
      "session_number": 1,
      "session_date": "2026-05-01",
      "start_time": "10:00:00",
      "end_time": "11:00:00",
      "status": "live", 
      "teacher": {
        "id": 10,
        "name": "Ahmad Teacher",
        "email": "ahmad@example.com"
      },
      "student": {
        "id": 20,
        "name": "Omar Student",
        "email": "omar@example.com"
      },
      "subject": {
        "name_en": "Mathematics",
        "name_ar": "الرياضيات"
      }
    }
  ]
}
```
*Note on `status`: The frontend recognizes `scheduled`, `live`, `ended`, and `cancelled`.*

---

### 2. Reschedule / Make-up Session
**Endpoint:** `PUT /api/admin/sessions/{id}/reschedule`
**Request Body:**
```json
{
  "session_date": "2026-05-08",
  "start_time": "10:00:00", 
  "end_time": "11:00:00"   
}
```
*(Only `session_date` is strictly required to be updated by the frontend, but start/end time can optionally be included if your logic requires it).*

**Expected Response:**
```json
{
  "success": true,
  "message": "Session rescheduled successfully."
}
```

---

### 3. Get User Sessions Profile
**Endpoint:** `GET /api/admin/users/{userId}/sessions?role=teacher` (or `role=student`)

**Expected Response Format:**
Exactly the same as the "Get All Sessions" array format, but filtered specifically to only return sessions where the requested user is the teacher (if `role=teacher`) or student (if `role=student`).

```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "session_date": "2026-05-10",
      "start_time": "14:00:00",
      "end_time": "15:00:00",
      "status": "scheduled",
      "teacher": { "id": 10, "name": "Ahmad Teacher" },
      "student": { "id": 35, "name": "Sara Student" }
    }
  ]
}
```
