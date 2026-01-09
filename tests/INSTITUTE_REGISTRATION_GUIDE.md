# 🏫 Institute Registration & Management System

Complete guide for managing institute/training center registrations in the system.

---

## 📋 Overview

The system now supports two types of teachers:
- **Individual Teachers** - Freelance teachers (existing functionality preserved)
- **Institutes/Training Centers** - New feature for centralized training organizations

### Key Features
✅ Separate registration flow for institutes
✅ Institute-specific fields (cover image, intro video, certifications)
✅ Admin approval workflow
✅ Commission management per institute
✅ Status tracking (pending, approved, rejected)
✅ **No breaking changes** to existing teacher registration

---

## 📊 Database Schema

### Updated `users` Table
```sql
ALTER TABLE users ADD COLUMN teacher_type ENUM('individual', 'institute') NULL DEFAULT 'individual';
```

### New `teacher_institutes` Table
```sql
CREATE TABLE teacher_institutes (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    institute_name VARCHAR(255) NOT NULL,
    commercial_register VARCHAR(255) NULL,
    license_number VARCHAR(255) NULL,
    cover_image VARCHAR(255) NULL,
    intro_video VARCHAR(255) NULL,
    description TEXT NULL,
    website VARCHAR(255) NULL,
    commission_percentage DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    rejection_reason TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    CONSTRAINT fk_institute_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);
```

---

## 🔐 Authentication & Registration

### Individual Teacher Registration (Existing - No Changes)
```bash
POST /api/auth/register

{
  "first_name": "Ahmed",
  "last_name": "Ali",
  "email": "ahmed@example.com",
  "phone_number": "0501234567",
  "gender": "male",
  "nationality": "Saudi Arabia",
  "role_id": 3,  // teacher role
  "teacher_type": "individual"  // Optional - defaults to individual
}

Response:
{
  "message": "Verification code sent. Please verify via SMS or email.",
  "user": {
    "id": 123,
    "first_name": "Ahmed",
    "last_name": "Ali",
    "email": "ahmed@example.com",
    "phone_number": "0501234567",
    "gender": "male",
    "role_id": 3
  },
  "sms_response": { ... }
}
```

### Institute Registration (New)
```bash
POST /api/auth/register

{
  "first_name": "Admin",
  "last_name": "Center",
  "email": "info@abc-center.com",
  "phone_number": "0501234567",
  "gender": "male",
  "nationality": "Saudi Arabia",
  "role_id": 3,  // teacher role
  "teacher_type": "institute",
  "institute_name": "ABC Training Center",
  "commercial_register": "COM-123456",
  "license_number": "LIC-789012",
  "description": "Leading training center for professional development",
  "website": "https://abc-center.com"
}

Response: 
{
  "message": "Verification code sent. Please verify via SMS or email.",
  "user": {
    "id": 124,
    "first_name": "Admin",
    "last_name": "Center",
    "email": "info@abc-center.com",
    "phone_number": "0501234567",
    "gender": "male",
    "role_id": 3
  },
  "sms_response": { ... }
}
```

### Response Structure
✅ **Same response structure** for both individual and institute
✅ **No additional keys** in response
✅ **Backward compatible** with existing iOS/Flutter apps
✅ Institute details are optional in response (managed separately via admin API)

---

## 👮 Admin Institute Management API

All routes require:
- Authentication token (Sanctum)
- Admin role (role_id = 1)

Base URL: `/api/admin/institutes`

### 1️⃣ Get All Institutes (Paginated)
```bash
GET /api/admin/institutes
GET /api/admin/institutes?status=pending&per_page=20

Headers:
Authorization: Bearer YOUR_ADMIN_TOKEN

Query Parameters:
- status: pending | approved | rejected (optional)
- per_page: 10-100 (default: 20)
- page: 1, 2, 3... (default: 1)

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 124,
      "institute_name": "ABC Training Center",
      "commercial_register": "COM-123456",
      "license_number": "LIC-789012",
      "cover_image": "/storage/institutes/abc-cover.jpg",
      "intro_video": "/storage/institutes/abc-intro.mp4",
      "description": "Leading training center...",
      "website": "https://abc-center.com",
      "commission_percentage": 15.00,
      "status": "pending",
      "rejection_reason": null,
      "created_at": "2026-01-08T10:00:00Z",
      "updated_at": "2026-01-08T10:00:00Z",
      "user": {
        "id": 124,
        "first_name": "Admin",
        "last_name": "Center",
        "email": "info@abc-center.com",
        "phone_number": "+966501234567"
      }
    }
  ],
  "pagination": {
    "total": 50,
    "per_page": 20,
    "current_page": 1,
    "last_page": 3
  }
}
```

### 2️⃣ Get Single Institute Details
```bash
GET /api/admin/institutes/{id}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 124,
    "institute_name": "ABC Training Center",
    "commercial_register": "COM-123456",
    "license_number": "LIC-789012",
    "cover_image": "/storage/institutes/abc-cover.jpg",
    "intro_video": "/storage/institutes/abc-intro.mp4",
    "description": "Leading training center...",
    "website": "https://abc-center.com",
    "commission_percentage": 15.00,
    "status": "pending",
    "rejection_reason": null,
    "created_at": "2026-01-08T10:00:00Z",
    "updated_at": "2026-01-08T10:00:00Z",
    "user": { ... }
  }
}
```

### 3️⃣ Get Institute Statistics
```bash
GET /api/admin/institutes/stats

Response:
{
  "success": true,
  "data": {
    "total": 50,
    "pending": 15,
    "approved": 30,
    "rejected": 5
  }
}
```

### 4️⃣ Approve Institute Registration
```bash
POST /api/admin/institutes/{id}/approve

Body (optional):
{
  "commission_percentage": 20.00
}

Response:
{
  "success": true,
  "message": "Institute approved successfully",
  "data": {
    "id": 1,
    "status": "approved",
    "commission_percentage": 20.00,
    ...
  }
}
```

### 5️⃣ Reject Institute Registration
```bash
POST /api/admin/institutes/{id}/reject

Body (required):
{
  "rejection_reason": "Commercial registration documents not valid. Please resubmit with proper documentation."
}

Response:
{
  "success": true,
  "message": "Institute rejected successfully",
  "data": {
    "id": 1,
    "status": "rejected",
    "rejection_reason": "Commercial registration documents not valid...",
    ...
  }
}
```

### 6️⃣ Update Institute Details
```bash
PUT /api/admin/institutes/{id}

Body:
{
  "institute_name": "ABC Training Center - Updated",
  "description": "Updated description",
  "website": "https://new-website.com",
  "commission_percentage": 25.00,
  "status": "approved"
}

Response:
{
  "success": true,
  "message": "Institute updated successfully",
  "data": { ... }
}
```

### 7️⃣ Delete Institute
```bash
DELETE /api/admin/institutes/{id}

Response:
{
  "success": true,
  "message": "Institute deleted successfully"
}
```

---

## 🔧 Validation Rules

### Registration Validation
| Field | Rules | Example |
|-------|-------|---------|
| first_name | required, string, max:255 | "Ahmed" |
| last_name | required, string, max:255 | "Ali" |
| email | required, email, unique | "ahmed@example.com" |
| phone_number | required, string, max:15 | "0501234567" |
| gender | nullable, in:male/female/other | "male" |
| nationality | nullable, string, max:255 | "Saudi Arabia" |
| role_id | required | 3 (teacher) |
| teacher_type | nullable, in:individual/institute | "institute" |
| institute_name | required_if teacher_type=institute | "ABC Center" |
| commercial_register | nullable, string, max:255 | "COM-123456" |
| license_number | nullable, string, max:255 | "LIC-789012" |
| description | nullable, string, max:5000 | "Training center..." |
| website | nullable, url, max:255 | "https://abc-center.com" |

### Rejection Validation
| Field | Rules | Example |
|-------|-------|---------|
| rejection_reason | required, string, min:10, max:1000 | "Documents not valid..." |

---

## 📈 Workflow Example

### Scenario: New Training Center Registration

**Step 1: Institute Registers via API**
```bash
POST /api/auth/register
{
  "first_name": "Center",
  "last_name": "Admin",
  "email": "info@newcenter.com",
  "phone_number": "0501234567",
  "role_id": 3,
  "teacher_type": "institute",
  "institute_name": "New Training Center",
  "license_number": "NEW-LIC-001"
}

Result: User created with status="pending" on institute record
```

**Step 2: Admin Reviews Application**
```bash
GET /api/admin/institutes/stats
// Check: 1 pending institute

GET /api/admin/institutes?status=pending
// View all pending applications
```

**Step 3a: Admin Approves (Scenario A)**
```bash
POST /api/admin/institutes/{id}/approve
{
  "commission_percentage": 15.00
}

Result: Status = "approved", institute can now create courses
```

**Step 3b: Admin Rejects (Scenario B)**
```bash
POST /api/admin/institutes/{id}/reject
{
  "rejection_reason": "License number could not be verified. Please resubmit with valid government-issued license."
}

Result: Status = "rejected", institute notified to reapply
```

**Step 4: Institute Updates Profile**
```bash
PUT /api/admin/institutes/{id}
{
  "cover_image": "/storage/institutes/new-cover.jpg",
  "intro_video": "/storage/institutes/new-intro.mp4"
}

Result: Profile updated, ready for display in app
```

---

## 🛡️ Security Considerations

### Access Control
- ✅ Only admin users (role_id = 1) can manage institutes
- ✅ All endpoints require Sanctum authentication
- ✅ User can only view/edit their own institute
- ✅ Cascade delete removes all related data

### Validation
- ✅ Email must be unique across system
- ✅ Phone number normalized and validated
- ✅ Institute name required for institute registration
- ✅ Rejection reason required when rejecting

### Status Flow
```
Pending → Approved ✅
Pending → Rejected ✗
Approved → Rejected ✓ (can be withdrawn)
Rejected → (soft reset available)
```

---

## 💾 Database Transactions

Institute registration uses database transaction:
```php
DB::beginTransaction();
// Create user
User::create([...]);
// Create institute record
TeacherInstitute::create([...]);
DB::commit();
```

**Benefits:**
- ✅ Atomic operation (all or nothing)
- ✅ No orphaned records
- ✅ Guaranteed data consistency

---

## 🎯 Backward Compatibility

### What Changed
✅ `teacher_type` column added to users (nullable, defaults to 'individual')
✅ New `teacher_institutes` table (separate, non-intrusive)
✅ Optional `teacher_type` in registration request

### What Stayed the Same
✅ Response structure identical
✅ Existing teacher registration works unchanged
✅ Old apps continue working without update
✅ No removed fields or changed response keys
✅ All existing teachers get `teacher_type = 'individual'`

### Migration Strategy
```
1. Run migrations (add column, create table)
2. Existing teachers automatically get teacher_type = 'individual'
3. New individual registrations get teacher_type = 'individual'
4. New institute registrations get teacher_type = 'institute'
5. Old apps work as before (ignore teacher_type field)
6. New app version can leverage institute features
```

---

## 🔍 Querying Examples

### Get Only Approved Institutes
```php
$approved = TeacherInstitute::approved()->with('user')->get();
```

### Get All Pending for Review
```php
$pending = TeacherInstitute::pending()->with('user')->paginate(20);
```

### Get Institute by User
```php
$user = User::with('institute')->find($userId);
$institute = $user->institute;
```

### Get All Individual Teachers
```php
$individuals = User::where('teacher_type', 'individual')
    ->where('role_id', 3)
    ->get();
```

### Get All Institute Teachers
```php
$institutes = User::where('teacher_type', 'institute')
    ->where('role_id', 3)
    ->with('institute')
    ->get();
```

---

## 📱 App Implementation Notes

### For iOS/Flutter App
1. **Register Individual Teacher (No Change)**
   - Keep existing registration flow
   - teacher_type will default to 'individual'

2. **New: Register Institute**
   - Add new registration form for institutes
   - Include fields: institute_name, license_number, etc.
   - Set teacher_type = 'institute'
   - Same endpoint: POST /api/auth/register

3. **Display Institute Status**
   - After registration, status = 'pending'
   - Show message: "Your institute is under review"
   - Check status via admin API once approved

### Request/Response Examples for App
```dart
// Individual Teacher Registration
Map<String, dynamic> individualRequest = {
  "first_name": "Ahmed",
  "last_name": "Ali",
  "email": "ahmed@example.com",
  "phone_number": "0501234567",
  "role_id": 3,
  "teacher_type": "individual"
};

// Institute Registration
Map<String, dynamic> instituteRequest = {
  "first_name": "Center",
  "last_name": "Admin",
  "email": "info@center.com",
  "phone_number": "0501234567",
  "role_id": 3,
  "teacher_type": "institute",
  "institute_name": "ABC Training Center",
  "license_number": "LIC-123"
};

// Response is identical for both
// Just use the existing response parsing
```

---

## ✅ Testing Checklist

- [ ] Individual teacher registration still works
- [ ] Institute registration creates both user and institute records
- [ ] Admin can list all institutes
- [ ] Admin can filter by status
- [ ] Admin can approve institutes
- [ ] Admin can reject institutes with reason
- [ ] Admin can update institute details
- [ ] Statistics endpoint shows correct counts
- [ ] Cascade delete works (deleting user removes institute)
- [ ] Phone normalization works for both types
- [ ] Email verification works for both types

---

## 🚀 Deployment Steps

1. **Backup Database**
   ```bash
   mysqldump -u root online_learning_platform > backup.sql
   ```

2. **Run Migrations**
   ```bash
   php artisan migrate
   ```

3. **Verify Tables**
   ```bash
   php artisan tinker
   DB::table('users')->first();
   DB::table('teacher_institutes')->first();
   ```

4. **Test Registration**
   - Test individual teacher registration
   - Test institute registration
   - Verify both users created correctly

5. **Test Admin APIs**
   - List institutes
   - Approve institute
   - Check status updates

6. **Rollback Plan** (if needed)
   ```bash
   php artisan migrate:rollback
   ```

---

## 📞 Support & Troubleshooting

### Common Issues

**Q: User created but institute record missing?**
A: Check database transaction logs. May indicate validation error in institute fields.

**Q: Getting 422 on institute registration?**
A: Validate that institute_type = 'institute' and institute_name is provided.

**Q: Admin can't approve institute?**
A: Verify user has role_id = 1 and valid Sanctum token.

**Q: Status not updating?**
A: Check database for correct institute ID, verify record exists.

---

## 📚 Related Models

- `User` - Main user model (updated with teacher_type)
- `TeacherInstitute` - New model for institute data
- `Role` - User role (2 = teacher)

## 🔗 Related Endpoints

- `POST /api/auth/register` - Registration (updated)
- `GET /api/admin/institutes` - List institutes (new)
- `POST /api/admin/institutes/{id}/approve` - Approve (new)
- `POST /api/admin/institutes/{id}/reject` - Reject (new)

---

**Status:** ✅ Production Ready
**Last Updated:** January 8, 2026
**Version:** 1.0
