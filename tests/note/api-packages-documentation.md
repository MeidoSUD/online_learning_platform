# Packages & Subscriptions API Documentation

## Flow Overview

```
Admin creates package (price + sessions) 
              ↓
Student views all available packages (PUBLIC)

Student purchases a package:
  → Payment checkout created via Moyasar
  → Student completes payment on Moyasar hosted page
  → On payment success → Subscription created (session credits)
              ↓
Student uses session credits to book individual sessions
  with ANY teacher (picks teacher + available slot)
  → New Booking created (individual session)
  → Session created via Agora/Zoom
  → Subscription sessions_remaining decremented
```

**Roles involved:**
- **Admin**: Creates package definitions, manages pricing
- **Student**: Purchases packages, uses credits to book sessions with any teacher
- **Teacher**: No package involvement — just provides availability slots

---

## 1. Public Endpoints

### 1.1 List All Available Packages

```
GET /api/packages
```

No authentication required.

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "id": 1,
      "name_ar": "باقة المبتدئين",
      "name_en": "Starter Pack",
      "description_ar": "4 جلسات للبدء",
      "description_en": "4 sessions to get started",
      "sessions_count": 4,
      "price": 100.00,
      "price_per_session": 25.00
    }
  ]
}
```

Only returns active packages.

---

## 2. Admin Endpoints

Base: `/api/admin` — Requires `auth:sanctum` + `role:admin`

### 2.1 List All Packages

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
      "name_ar": "باقة المبتدئين",
      "name_en": "Starter Pack",
      "description_ar": "4 جلسات للبدء",
      "description_en": "4 sessions to get started",
      "sessions_count": 4,
      "price": 100.00,
      "price_per_session": 25.00,
      "is_active": true,
      "created_at": "2026-06-23T10:00:00.000000Z",
      "total_subscriptions": 10,
      "active_subscriptions": 5
    }
  ]
}
```

### 2.2 Create Package

```
POST /api/admin/packages
```

**Request:**
```json
{
  "name_ar": "باقة المبتدئين",
  "name_en": "Starter Pack",
  "description_ar": "4 جلسات للبدء",
  "description_en": "4 sessions to get started",
  "sessions_count": 4,
  "price": 100.00
}
```

**Response (201):**
```json
{
  "status": true,
  "message": "Package created successfully",
  "data": { ... }
}
```

### 2.3 Show Package

```
GET /api/admin/packages/{id}
```

### 2.4 Update Package

```
PUT /api/admin/packages/{id}
```

All fields optional.

### 2.5 Delete Package

```
DELETE /api/admin/packages/{id}
```

Cannot delete if package has active subscriptions.

### 2.6 Toggle Active/Inactive

```
PUT /api/admin/packages/{id}/toggle
```

### 2.7 Package Stats

```
GET /api/admin/packages/stats
```

**Response:**
```json
{
  "status": true,
  "data": {
    "total_packages": 5,
    "active_packages": 4,
    "total_subscriptions": 50,
    "active_subscriptions": 30,
    "completed_subscriptions": 18,
    "total_revenue": 5000.00,
    "total_sessions_used": 120,
    "total_sessions_remaining": 80
  }
}
```

---

## 3. Student Endpoints

Base: `/api/student` — Requires `auth:sanctum` + `role:student`

### 3.1 Purchase a Package (Create Checkout)

```
POST /api/student/packages/purchase
```

**Request:**
```json
{
  "package_id": 1,
  "payment_method": "card"
}
```

`payment_method` options: `card`, `wallet`, `bank_transfer`, `apple_pay`, `stc_pay`

**What happens internally:**
1. Creates a `Payment` record → status: `initiated`
2. Creates a Moyasar checkout (hosted invoice)
3. Returns the redirect URL for the user to complete payment

**Response (201):**
```json
{
  "status": true,
  "message": "Payment checkout created",
  "data": {
    "payment_id": 5,
    "checkout_id": "inv_abc123",
    "redirect_url": "https://api.moyasar.com/v1/invoices/inv_abc123",
    "amount": 100.00,
    "currency": "SAR"
  }
}
```

**Flow after purchase:**
1. Open `redirect_url` in WebView/in-app browser → user pays via Moyasar
2. After payment, call `POST /api/student/packages/purchase/confirm` with the `payment_id`

### 3.2 Confirm Package Purchase

```
POST /api/student/packages/purchase/confirm
```

**Request:**
```json
{
  "payment_id": 5
}
```

**Response (201) — Success:**
```json
{
  "status": true,
  "message": "Package purchased successfully",
  "data": {
    "subscription": {
      "id": 10,
      "student_id": 2,
      "package_id": 1,
      "sessions_remaining": 4,
      "sessions_used": 0,
      "status": "active",
      "start_date": "2026-06-23T10:00:00.000000Z",
      "total_paid": 100.00,
      "currency": "SAR",
      "package": { ... }
    },
    "payment": { ... }
  }
}
```

**Response (400) — Payment not yet completed:**
```json
{
  "status": false,
  "message": "Payment not completed yet",
  "data": {
    "payment_status": "initiated",
    "payment_id": 5
  }
}
```

### 3.3 View My Subscriptions

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
      "package_name_ar": "باقة المبتدئين",
      "package_name_en": "Starter Pack",
      "sessions_remaining": 3,
      "sessions_used": 1,
      "total_sessions": 4,
      "total_paid": 100.00,
      "status": "active",
      "is_active": true,
      "start_date": "2026-06-23T10:00:00.000000Z",
      "expiry_date": null,
      "bookings_count": 1
    }
  ]
}
```

Status values: `active`, `completed`, `cancelled`, `expired`

### 3.4 Subscription Details

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
    "sessions_remaining": 3,
    "sessions_used": 1,
    "total_sessions": 4,
    "total_paid": 100.00,
    "status": "active",
    "start_date": "2026-06-23T10:00:00.000000Z",
    "expiry_date": null,
    "bookings": [
      {
        "id": 50,
        "booking_reference": "BOK-xxxx",
        "teacher_id": 5,
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
  "availability_slot_id": 25,
  "teacher_id": 5
}
```

The slot must belong to `teacher_id` and must be available (not booked, not in the past).

**What happens internally:**
1. Validates subscription is active + has remaining sessions
2. Validates slot belongs to teacher + is available
3. Creates a `Booking` (type=single, status=confirmed) with subscription_id
4. Calls `subscription.useSession()` → decrements `sessions_remaining`
5. Marks slot as booked
6. Creates session via existing flow (Agora/Zoom meeting)

**Response (201):**
```json
{
  "status": true,
  "message": "Session booked successfully from your package",
  "data": {
    "booking": {
      "id": 51,
      "session_type": "single",
      "first_session_date": "2026-06-25",
      "first_session_start_time": "10:00:00",
      "first_session_end_time": "11:00:00",
      "status": "confirmed",
      "teacher": { ... },
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

## 4. Subscription Lifecycle

```
active     → Student has remaining sessions, can book
completed  → All sessions used (sessions_remaining = 0)
cancelled  → Cancelled by admin/student
expired    → Past expiry date (if set)
```

---

## 5. Database Schema

### sessions_packages
| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| name_ar | string(255) | Arabic name |
| name_en | string(255) | English name |
| description_ar | text | Arabic description |
| description_en | text | English description |
| sessions_count | integer | Number of sessions in package |
| price | decimal(10,2) | Total package price |
| is_active | boolean | Whether package is available |
| timestamps | - | created_at, updated_at |

### subscriptions
| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| student_id | bigint FK→users | Student who purchased |
| package_id | bigint FK→sessions_packages | Package purchased |
| sessions_remaining | integer | Available session credits |
| sessions_used | integer | Credits used |
| status | string | active/completed/cancelled/expired |
| start_date | timestamp | Purchase date |
| expiry_date | timestamp | Optional expiry |
| completed_at | timestamp | When all sessions used |
| total_paid | decimal(10,2) | Amount paid |
| currency | string(3) | SAR |
| payment_id | bigint FK→payments | Payment reference |

---

## 6. Error Response Format

```json
// Standard error
{ "status": false, "message": "Human-readable error message" }

// Validation error (422)
{ "status": false, "errors": { "package_id": ["The package id field is required."] } }
```

---

## 7. Base URL

```
Production: https://your-domain.com/api
Local:      http://localhost:8000/api
Headers:    Accept: application/json
            Authorization: Bearer {token}
```

---

## 8. Complete UI Checklist

**Admin panel:**
1. `GET /api/admin/packages` — list all packages
2. `POST /api/admin/packages` — create package
3. `PUT /api/admin/packages/{id}` — edit package
4. `DELETE /api/admin/packages/{id}` — delete package
5. `PUT /api/admin/packages/{id}/toggle` — activate/deactivate
6. `GET /api/admin/packages/stats` — package analytics
7. Dashboard already shows package stats under `data.packages`

**Student app:**
1. `GET /api/packages` — browse available packages (public)
2. `POST /api/student/packages/purchase` — create payment checkout
3. Open `redirect_url` in WebView → user pays on Moyasar
4. `POST /api/student/packages/purchase/confirm` — confirm payment & create subscription
5. `GET /api/student/subscriptions` — my session credits
6. `GET /api/student/subscriptions/{id}` — details + booking history
7. `POST /api/student/subscriptions/{id}/book` — book 1 session using credit

**Teacher app:**
No changes needed. Teachers just provide availability slots as before.
