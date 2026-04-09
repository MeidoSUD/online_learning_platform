# Platform Percentage in Booking Pricing - Implementation Guide

## Overview

✅ **COMPLETE** - Platform percentage is now automatically applied to all bookings. Students pay the increased amount while teachers receive their original rate.

---

## Pricing Formula

```
Teacher Rate: What teacher charges per session (base rate)
Platform Percentage: Commission percentage set in admin dashboard
Student Price: What student pays

Formula:
  Student Price = Teacher Rate × (1 + Platform Percentage / 100)

Example:
  Teacher Rate: 100 SR/hour
  Platform Percentage: 15% (15.50% actual)
  Student Price: 100 × (1 + 15.50/100) = 115.50 SR
  Platform Revenue: 115.50 - 100 = 15.50 SR
```

---

## What Changed

### 1. Booking Price Calculation
- **Before**: `price_per_session = teacher_rate × duration / 60`
- **After**: `price_per_session = (teacher_rate × duration / 60) × (1 + percentage/100)`

### 2. New Booking Fields

The `bookings` table now tracks:

| Field | Type | Purpose |
|-------|------|---------|
| `teacher_rate_per_session` | decimal(10,2) | Teacher's original rate (before percentage) |
| `platform_percentage` | decimal(10,2) | Percentage applied to this booking |
| `price_per_session` | decimal(10,2) | **Final student price (after percentage applied)** |

### 3. Data Flow

```
Student Creates Booking
    ↓
Get Current Platform Percentage (admin dashboard setting)
    ↓
Calculate Teacher Rate: teacher_hourly_rate × (duration / 60)
    ↓
Apply Percentage: teacher_rate × (1 + percentage/100)
    ↓
Store booking with:
  - teacher_rate_per_session: Original rate
  - platform_percentage: Percentage applied
  - price_per_session: Final student price (with percentage)
    ↓
Student Pays: price_per_session × sessions_count
Teacher Receives: teacher_rate_per_session × sessions_count
```

---

## API Response Example

### Create Booking

**Request:**
```
POST /api/student/booking
{
  "teacher_id": 5,
  "type": "single",
  "timeslot_id": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking_id": "B-2026-04-09-001",
    "teacher": {
      "id": "5",
      "name": "Fatima Ahmed",
      "hourly_rate": 100
    },
    "pricing": {
      "teacher_rate_per_session": 100,
      "platform_percentage": 15.50,
      "student_pays_per_session": 115.50,
      "sessions_count": 1,
      "subtotal": 115.50,
      "discount_percentage": 0,
      "discount_amount": 0,
      "total_amount": 115.50,
      "currency": "SAR",
      "breakdown": "100 (teacher) + 15.50 (platform) = 115.50"
    },
    "status": "pending_payment"
  }
}
```

---

## How Teachers See It

### Teacher Dashboard - What They Receive

Teachers see their **original rate** (without percentage):

```json
{
  "booking": {
    "id": "B-2026-04-09-001",
    "student": "Ahmed",
    "sessions": 1,
    "teacher_rate_per_session": 100,
    "total_teacher_receives": 100,
    "notes": "You receive your agreed rate (100 SAR)"
  }
}
```

### Payment to Teacher

Teachers receive payment based on `teacher_rate_per_session`:
- Teacher Rate: 100 SR per session
- Sessions: 1
- **Teacher Receives: 100 SR** (not affected by percentage)

---

## How Students See It

### Student Dashboard - What They Pay

Students see the **final price** (with percentage included):

```json
{
  "booking": {
    "id": "B-2026-04-09-001",
    "teacher": "Fatima",
    "sessions": 1,
    "price_per_session": 115.50,
    "total_student_pays": 115.50,
    "breakdown": {
      "teacher_rate": 100,
      "platform_fee": 15.50,
      "total": 115.50
    }
  }
}
```

### Payment from Student

Students pay based on `price_per_session`:
- Teacher Rate: 100 SR per session
- Platform Percentage: 15.50%
- **Student Pays: 115.50 SR** (includes platform percentage)

---

## Database Schema

### Bookings Table New Columns

```sql
ALTER TABLE bookings ADD COLUMN (
    teacher_rate_per_session DECIMAL(10, 2) NULL,
    platform_percentage DECIMAL(10, 2) NULL DEFAULT 0
);
```

### Sample Data

```sql
SELECT 
    id,
    teacher_id,
    student_id,
    teacher_rate_per_session,      -- 100.00 (teacher's rate)
    platform_percentage,            -- 15.50 (commission %)
    price_per_session,              -- 115.50 (what student pays)
    subtotal,                        -- 115.50 × sessions
    total_amount                     -- Final amount student pays
FROM bookings
WHERE id = 1;
```

---

## PaymentController Updates

When payment is confirmed, the system:

1. ✅ **Marks slot as booked** (is_booked = true)
2. ✅ **Creates sessions** with proper titles
3. ✅ **Updates booking status** to confirmed
4. ✅ **Records teacher rate** (what teacher receives)
5. ✅ **Records platform percentage** (commission %)
6. ✅ **Records student price** (what student paid)

---

## Admin Dashboard - Percentage Management

### Set New Percentage

```
POST /api/admin/revenue/percentage
{
  "value": 18.50,
  "effective_date": "2024-05-01",
  "description": "Increased commission"
}
```

**Behavior:**
- ✅ All NEW bookings created after effective_date use 18.50%
- ✅ OLD bookings keep their original percentage (no retroactive changes)
- ✅ Historical data preserved for reporting

### Example Timeline

```
April 1: Percentage = 15.50%
  - Booking 1 created: 100 × 1.155 = 115.50 (uses 15.50%)

April 20: Admin changes percentage to 18% (effective May 1)
  - Booking 2 created: Still uses 15.50% (effective_date not reached)

May 1: Effective date reached
  - Booking 3 created: 100 × 1.18 = 118 (uses new 18%)
```

---

## Revenue Analytics

### Get Revenue Breakdown

```
GET /api/admin/revenue/analytics?from_date=2024-04-01&to_date=2024-04-30
```

**Response:**
```json
{
  "total_bookings": 100,
  "total_student_spent": 11550,    // What students paid (with %)
  "total_teacher_earned": 10000,   // What teachers got (without %)
  "total_platform_revenue": 1550,  // Difference = platform profit
  "average_percentage": 15.50,
  "breakdown": {
    "student_total_paid": 11550,
    "teacher_total_earned": 10000,
    "platform_commission": 1550
  }
}
```

---

## Key Points for Mobile App

### What Mobile App Receives

The booking response includes complete pricing breakdown:

```json
{
  "pricing": {
    "teacher_rate_per_session": 100,
    "platform_percentage": 15.50,
    "student_price_per_session": 115.50,
    "total_student_pays": 115.50
  },
  "teacher": {
    "name": "Fatima",
    "receives_per_session": 100
  }
}
```

### Mobile App Should Display

To student:
```
Lesson Price: 115.50 SAR
├─ Teacher Rate: 100 SAR
└─ Platform Fee: 15.50 SAR (15.50%)
Total: 115.50 SAR
```

To teacher (in earnings):
```
You will receive: 100 SAR per session
(Platform commission: 15.50% = 15.50 SAR per session)
```

---

## Troubleshooting

### Percentage Not Applied to New Bookings

**Problem:** Booking created but percentage = 0

**Solution:**
1. Check if platform percentage is set:
   ```
   GET /api/admin/revenue/percentage
   ```
2. If not set, create one:
   ```
   POST /api/admin/revenue/percentage
   {
     "value": 15.50,
     "effective_date": "2024-04-01"
   }
   ```
3. Create new booking - should use percentage

### Teacher Receiving Wrong Amount

**Problem:** Teacher gets less/more than expected

**Cause:** `price_per_session` vs `teacher_rate_per_session` confusion

**Solution:**
- Teacher receives: `teacher_rate_per_session` ✅
- Student pays: `price_per_session` ✅
- Difference: Platform revenue ✅

### Payment Not Reflecting Percentage

**Problem:** Payment recorded but booking shows 0%

**Solution:** Check booking creation date vs percentage effective_date
- Percentage must be set BEFORE booking is created
- Retroactive changes don't affect existing bookings

---

## Database Migration

### What Was Added

```sql
-- New columns in bookings table
teacher_rate_per_session DECIMAL(10, 2)    -- Teacher's original rate
platform_percentage DECIMAL(10, 2)         -- Commission percentage applied
```

### Migration File
```
database/migrations/2026_04_09_add_percentage_tracking_to_bookings.php
```

### Run Migration
```bash
php artisan migrate
```

---

## Testing Checklist

- [ ] Create booking with 15% percentage set
  - Verify: `price_per_session` = `teacher_rate × 1.15`
  - Verify: `platform_percentage` = 15.00

- [ ] Create booking with 18% percentage set
  - Verify: `price_per_session` = `teacher_rate × 1.18`
  - Verify: `platform_percentage` = 18.00

- [ ] Change percentage, create new booking
  - Verify: New booking uses new percentage
  - Old bookings unaffected

- [ ] Check teacher receives correct amount
  - Verify: Payment = `teacher_rate_per_session × sessions`
  - Not affected by percentage

- [ ] Check student pays correct amount
  - Verify: Payment = `price_per_session × sessions`
  - Includes platform percentage

- [ ] Verify analytics
  - Verify: `platform_revenue` = `total_student_paid` - `total_teacher_earned`

---

## Summary

✅ **Platform percentage is now fully integrated into booking pricing:**
1. Student price automatically includes percentage
2. Teacher rate stored separately (unaffected by percentage)
3. Platform revenue calculated as difference
4. Historical bookings preserve their original percentage
5. New percentage changes only affect future bookings

**Result:** 
- Students pay: Teacher Rate × (1 + Platform %)
- Teachers receive: Original Teacher Rate
- Platform keeps: Difference (Platform Revenue)

