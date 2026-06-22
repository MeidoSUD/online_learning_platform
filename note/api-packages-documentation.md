# Packages & Subscriptions API Documentation

## Flow Overview

```
Admin creates packages (prices) → Approves teacher → Teacher enables packages
                                                          ↓
Student views teacher packages → Purchases package → Gets session credits
                                                          ↓
                                            Student books sessions one-by-one
                                            using available time slots
```

**Roles involved:**
- **Admin**: Creates package definitions, approves teachers
- **Teacher**: Toggles packages on/off, provides availability slots
- **Student**: Views packages, purchases, books sessions from credits

---

## 1. Admin Endpoints

Base: `/api/admin` — Requires `auth:sanctum` + `role:admin`

### 1.1 List All Packages

```
GET /api/admin/packages
```

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "id": 1,
      "name": "Starter Pack",
      "description": "4 sessions to get started",
      "sessions_count": 4,
      "total_price": 100.00,
      "price_per_session": 25.00,
      "is_active": true,
      "created_by": "Admin Name",
      "created_at": "2026-06-22T10:00:00.000000Z",
      "total_subscriptions": 5
    }
  ]
}
```

### 1.2 Create Package

```
POST /api/admin/packages
```

**Request:**
```json
{
  "name": "Starter Pack",
  "description": "4 sessions to get started",
  "sessions_count": 4,
  "total_price": 100.00,
  "is_active": true
}
```

**Response (201):**
```json
{
  "status": true,
  "message": "Package created successfully",
  "data": {
    "id": 1,
    "name": "Starter Pack",
    "sessions_count": 4,
    "total_price": 100.00,
    "price_per_session": 25.00,
    "is_active": true,
    ...
  }
}
```

**Errors:** `422` validation error

### 1.3 Show Package Details

```
GET /api/admin/packages/{id}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "id": 1,
    "name": "Starter Pack",
    "description": "4 sessions to get started",
    "sessions_count": 4,
    "total_price": 100.00,
    "price_per_session": 25.00,
    "is_active": true,
    "created_by": "Admin Name",
    "created_at": "2026-06-22T10:00:00.000000Z",
    "updated_at": "2026-06-22T10:00:00.000000Z",
    "total_subscriptions": 5
  }
}
```

### 1.4 Update Package

```
PUT /api/admin/packages/{id}
```

**Request (all fields optional):**
```json
{
  "name": "Premium Pack",
  "description": "Updated description",
  "sessions_count": 8,
  "total_price": 180.00,
  "is_active": true
}
```

**Response:**
```json
{
  "status": true,
  "message": "Package updated successfully",
  "data": { ... }
}
```

### 1.5 Delete Package

```
DELETE /api/admin/packages/{id}
```

**Response:**
```json
{
  "status": true,
  "message": "Package deleted successfully"
}
```

**Note:** Cannot delete a package that has active subscriptions.

### 1.6 Toggle Package Active/Inactive

```
PUT /api/admin/packages/{id}/toggle
```

**Response:**
```json
{
  "status": true,
  "message": "Package activated",
  "data": { ... }
}
```

### 1.7 List Teachers Pending Package Approval

```
GET /api/admin/teachers/pending-packages
```

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "id": 5,
      "name": "Teacher Name",
      "email": "teacher@example.com",
      "offer_packages": false,
      "packages_approved": false
    }
  ]
}
```

### 1.8 List Teachers Approved for Packages

```
GET /api/admin/teachers/approved-packages
```

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "id": 3,
      "name": "Approved Teacher",
      "email": "approved@example.com",
      "offer_packages": true,
      "packages_approved": true
    }
  ]
}
```

### 1.9 Approve Teacher for Packages

```
PUT /api/admin/teachers/{teacherId}/approve-packages
```

**Response:**
```json
{
  "status": true,
  "message": "Teacher approved for offering packages"
}
```

### 1.10 Revoke Teacher Package Approval

```
PUT /api/admin/teachers/{teacherId}/revoke-packages
```

**Response:**
```json
{
  "status": true,
  "message": "Teacher package approval revoked"
}
```

---

## 2. Teacher Endpoints

Base: `/api/teacher` — Requires `auth:sanctum` + `role:teacher`

### 2.1 View Available Packages & Status

```
GET /api/teacher/packages
```

**Response:**
```json
{
  "status": true,
  "data": {
    "offer_packages": true,
    "packages_approved": true,
    "available_packages": [
      {
        "id": 1,
        "name": "Starter Pack",
        "sessions_count": 4,
        "total_price": 100.00,
        "price_per_session": 25.00,
        ...
      }
    ]
  }
}
```

- `offer_packages`: teacher's current toggle state
- `packages_approved`: admin approval status (read-only for teacher)
- `available_packages`: system-wide active packages teacher can offer

### 2.2 Toggle Packages On/Off

```
PUT /api/teacher/packages/toggle-offer
```

Requires `packages_approved = true`. If not approved yet, returns 403.

**Response (success):**
```json
{
  "status": true,
  "message": "Packages enabled for your profile",
  "offer_packages": true
}
```

**Response (not approved):**
```json
{
  "status": false,
  "message": "Your package feature is pending admin approval"
}
```

---

## 3. Student Endpoints

Base: `/api/student` — Requires `auth:sanctum` + `role:student`

### 3.1 View Teacher's Packages (Public)

```
GET /api/teachers/{teacherId}/packages
```

Public — no authentication required.

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "id": 1,
      "name": "Starter Pack",
      "description": "4 sessions to get started",
      "sessions_count": 4,
      "total_price": 100.00,
      "price_per_session": 25.00,
      "savings_per_session": 5.00
    }
  ]
}
```

- `savings_per_session`: difference between teacher's hourly rate and package per-session price (null if teacher has no hourly rate or if package price is higher)
- Returns empty array if teacher does not offer packages or is not approved

### 3.2 Purchase a Package

```
POST /api/student/packages/purchase
```

**Request:**
```json
{
  "package_id": 1,
  "teacher_id": 3,
  "payment_method": "card"
}
```

`payment_method` options: `card`, `wallet`, `bank_transfer`, `apple_pay`, `stc_pay`

**Response (201):**
```json
{
  "status": true,
  "message": "Package purchased successfully",
  "data": {
    "subscription": {
      "id": 10,
      "student_id": 2,
      "teacher_id": 3,
      "package_id": 1,
      "sessions_remaining": 4,
      "sessions_used": 0,
      "status": "active",
      "start_date": "2026-06-22T10:00:00.000000Z",
      "total_paid": 100.00,
      "currency": "SAR",
      "package": { ... },
      "teacher": { ... },
      "payment": { ... }
    },
    "payment": { ... }
  }
}
```

**Errors:**
- `422` — validation error
- `400` — package not active or teacher not offering packages

### 3.3 View My Subscriptions (Student)

```
GET /api/student/subscriptions
```

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "id": 10,
      "package_name": "Starter Pack",
      "teacher_name": "Teacher Name",
      "teacher_id": 3,
      "sessions_remaining": 3,
      "sessions_used": 1,
      "total_sessions": 4,
      "total_paid": 100.00,
      "status": "active",
      "is_active": true,
      "start_date": "2026-06-22T10:00:00.000000Z",
      "expiry_date": null,
      "bookings_count": 1
    }
  ]
}
```

Status values: `active`, `completed`, `cancelled`, `expired`

### 3.4 View Subscription Details

```
GET /api/student/subscriptions/{id}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "id": 10,
    "package": { ... },
    "teacher": { ... },
    "sessions_remaining": 3,
    "sessions_used": 1,
    "total_sessions": 4,
    "total_paid": 100.00,
    "status": "active",
    "start_date": "2026-06-22T10:00:00.000000Z",
    "expiry_date": null,
    "bookings": [
      {
        "id": 50,
        "booking_reference": "BOK-xxxx",
        "session_date": "2026-06-25",
        "start_time": "10:00:00",
        "end_time": "11:00:00",
        "status": "confirmed"
      }
    ]
  }
}
```

### 3.5 Book a Session from Subscription

```
POST /api/student/subscriptions/{id}/book
```

**Request:**
```json
{
  "availability_slot_id": 25
}
```

The `availability_slot_id` must belong to the same teacher as the subscription and must be available (not booked, not in the past).

**Response (201):**
```json
{
  "status": true,
  "message": "Session booked successfully from your package",
  "data": {
    "booking": {
      "id": 51,
      "booking_reference": "BOK-xxxx",
      "session_type": "single",
      "first_session_date": "2026-06-25",
      "first_session_start_time": "10:00:00",
      "first_session_end_time": "11:00:00",
      "status": "confirmed",
      "sessions": [
        {
          "id": 100,
          "session_number": 1,
          "session_date": "2026-06-25",
          "start_time": "10:00:00",
          "end_time": "11:00:00",
          "status": "scheduled",
          "join_url": "https://...",
          "meeting_id": "..."
        }
      ]
    },
    "sessions_remaining": 2
  }
}
```

**Errors:**
- `404` — subscription not found or not active
- `400` — no remaining sessions
- `400` — slot not available or already booked
- `400` — slot must be at least 2 hours in the future

---

## 4. Status & Subscription Lifecycle

```
active     → Student has remaining sessions, can book
completed  → All sessions used (sessions_remaining = 0)
cancelled  → Manually cancelled by admin/student
expired    → Past expiry date (if set)
```

---

## 5. Teacher Setup Checklist (for Flutter UI)

**Admin panel:**
1. Create packages → `POST /api/admin/packages`
2. Approve teachers → `PUT /api/admin/teachers/{id}/approve-packages`

**Teacher app:**
1. View packages + approval status → `GET /api/teacher/packages`
2. Toggle packages on → `PUT /api/teacher/packages/toggle-offer`

**Student app:**
1. Browse teacher's packages → `GET /api/teachers/{teacherId}/packages`
2. Purchase → `POST /api/student/packages/purchase`
3. View subscriptions → `GET /api/student/subscriptions`
4. Pick available slot → `GET /api/student/teachers/{id}` (existing teacher detail)
5. Book session → `POST /api/student/subscriptions/{id}/book`

---

## 6. Error Response Format

All errors follow this structure:

```json
{
  "status": false,
  "message": "Human-readable error message"
}
```

For validation errors (422):

```json
{
  "status": false,
  "errors": {
    "package_id": ["The package id field is required."]
  }
}
```

---

## 7. Base URL

```
https://your-domain.com/api
```

For local development:

```
http://localhost:8000/api
```

Headers for authenticated requests:

```
Accept: application/json
Authorization: Bearer {token}
```
