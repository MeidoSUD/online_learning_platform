# 🏫 Institute Registration System - Architecture & Flow

Complete visual guide for the institute registration and management system.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATIONS                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ iOS App      │  │ Flutter App  │  │ Web Browser  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │ POST /api/register         │
             │                            │
             ↓                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   LARAVEL API SERVER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         AuthController::register()                   │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ Validate request                              │  │   │
│  │  │ Check email/phone uniqueness                  │  │   │
│  │  │ Normalize phone number                        │  │   │
│  │  │                                                │  │   │
│  │  │ if teacher_type == 'individual'               │  │   │
│  │  │   └─ Create User (teacher_type=individual)    │  │   │
│  │  │                                                │  │   │
│  │  │ if teacher_type == 'institute'                │  │   │
│  │  │   ├─ DB::beginTransaction()                   │  │   │
│  │  │   ├─ Create User (teacher_type=institute)     │  │   │
│  │  │   ├─ Create TeacherInstitute (status=pending) │  │   │
│  │  │   └─ DB::commit()                             │  │   │
│  │  │                                                │  │   │
│  │  │ Send verification SMS/Email                   │  │   │
│  │  │ Return user response                          │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │     InstituteController (Admin Only)                │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ GET  /institutes              → index()       │  │   │
│  │  │ GET  /institutes/stats        → getStats()    │  │   │
│  │  │ GET  /institutes/{id}         → show()        │  │   │
│  │  │ POST /institutes/{id}/approve → approve()     │  │   │
│  │  │ POST /institutes/{id}/reject  → reject()      │  │   │
│  │  │ PUT  /institutes/{id}         → update()      │  │   │
│  │  │ DELETE /institutes/{id}       → destroy()     │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
             │                            │
             ↓                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   MYSQL DATABASE                            │
│  ┌─────────────────────┐      ┌──────────────────────────┐  │
│  │  users table        │      │ teacher_institutes table │  │
│  │ ┌─────────────────┐ │      │ ┌────────────────────┐   │  │
│  │ │ id (PK)         │ │      │ │ id (PK)            │   │  │
│  │ │ first_name      │ │      │ │ user_id (FK)       │   │  │
│  │ │ last_name       │ │      │ │ institute_name     │   │  │
│  │ │ email           │ │      │ │ license_number     │   │  │
│  │ │ phone_number    │ │◄─────┼─│ cover_image        │   │  │
│  │ │ role_id         │ │      │ │ intro_video        │   │  │
│  │ │ teacher_type*   │ │      │ │ description        │   │  │
│  │ │ password        │ │      │ │ website            │   │  │
│  │ │ created_at      │ │      │ │ status             │   │  │
│  │ │ updated_at      │ │      │ │ rejection_reason   │   │  │
│  │ └─────────────────┘ │      │ │ commission_pct     │   │  │
│  │   * NEW COLUMN      │      │ │ created_at         │   │  │
│  └─────────────────────┘      │ │ updated_at         │   │  │
│                               │ └────────────────────┘   │  │
│                               │   * NEW TABLE           │  │
│                               └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 👤 User Registration Flows

### Flow 1: Individual Teacher Registration

```
User App
  │
  ├─ Select "Register as Teacher"
  │
  ├─ Fill form:
  │  ├─ First Name
  │  ├─ Last Name
  │  ├─ Email
  │  ├─ Phone Number
  │  └─ (Optional) Gender, Nationality
  │
  └─ POST /api/register
     {
       "first_name": "Ahmed",
       "last_name": "Ali",
       "email": "ahmed@example.com",
       "phone_number": "0501234567",
       "role_id": 3,
       "teacher_type": "individual"  // or omit (defaults)
     }
     │
     ↓
  Server Processing
     │
     ├─ Validate input
     ├─ Normalize phone
     ├─ Check email uniqueness
     │
     └─ Create User
        {
          "teacher_type": "individual",
          "status": "active"  // immediate
        }
        │
        ↓
  READY TO USE
     │
     ├─ Can create courses immediately
     ├─ Can teach students
     └─ No approval needed
```

### Flow 2: Institute Registration

```
Institute Admin App
  │
  ├─ Select "Register as Training Center"
  │
  ├─ Fill form:
  │  ├─ Institute Name *
  │  ├─ Admin Name
  │  ├─ Admin Email
  │  ├─ Phone Number
  │  ├─ Commercial Register
  │  ├─ License Number
  │  ├─ Description
  │  ├─ Website URL
  │  └─ (Optional) Cover Image, Intro Video
  │
  └─ POST /api/register
     {
       "first_name": "Admin",
       "last_name": "Center",
       "email": "info@center.com",
       "phone_number": "0501234567",
       "role_id": 3,
       "teacher_type": "institute",  // REQUIRED
       "institute_name": "ABC Training Center",  // REQUIRED
       "license_number": "LIC-789012",  // OPTIONAL
       ...
     }
     │
     ↓
  Server Processing
     │
     ├─ Validate input
     ├─ Normalize phone
     ├─ Check institute_name provided
     │
     └─ Atomic Transaction (ALL OR NOTHING)
        │
        ├─ Create User
        │  {
        │    "teacher_type": "institute",
        │    "status": "active"
        │  }
        │
        └─ Create TeacherInstitute
           {
             "user_id": <new_user_id>,
             "institute_name": "ABC Training Center",
             "status": "pending"  // APPROVAL REQUIRED
           }
        │
        ↓
  PENDING ADMIN REVIEW
     │
     ├─ Show message: "Your institute is under review"
     ├─ Cannot create courses yet
     └─ Waiting for admin approval
```

---

## 👮 Admin Approval Workflow

```
Admin Dashboard
  │
  ├─ Notification: "New institute registration"
  │
  ├─ GET /api/admin/institutes/stats
  │  │
  │  └─ Response:
  │     {
  │       "total": 50,
  │       "pending": 3,
  │       "approved": 45,
  │       "rejected": 2
  │     }
  │
  ├─ GET /api/admin/institutes?status=pending
  │  │
  │  └─ List 3 pending registrations
  │
  └─ Click on Institute → GET /api/admin/institutes/{id}
     │
     ├─ View Details:
     │  ├─ Institute Name
     │  ├─ License Number
     │  ├─ Commercial Register
     │  ├─ Website
     │  └─ Admin Contact Info
     │
     ├─ Review Documents
     │  ├─ Check license validity
     │  ├─ Verify commercial registration
     │  └─ Confirm educational credentials
     │
     └─ Make Decision
        │
        ├─ APPROVED?
        │  │
        │  └─ POST /api/admin/institutes/{id}/approve
        │     {
        │       "commission_percentage": 15.00
        │     }
        │     │
        │     └─ Status: pending → approved
        │        Institute NOW ACTIVE
        │        Can create courses
        │
        └─ REJECTED?
           │
           └─ POST /api/admin/institutes/{id}/reject
              {
                "rejection_reason": "License documents invalid. Please resubmit with certified copies."
              }
              │
              └─ Status: pending → rejected
                 Notify institute
                 Can reapply
```

---

## 📊 Status State Machine

```
                      ┌─────────────────┐
                      │   PENDING       │
                      │ (New Reg)       │
                      └────┬──────┬─────┘
                           │      │
                    ╱──────┘      └──────╲
                   ↓                      ↓
        ┌──────────────────┐   ┌──────────────────┐
        │    APPROVED      │   │    REJECTED      │
        │  (Status: 1)     │   │  (Status: 2)     │
        │  (Active)        │   │  (Needs Resubmit)│
        │                  │   │                  │
        │ • Can teach      │   │ • Cannot teach   │
        │ • Can create     │   │ • Can reapply    │
        │   courses        │   │ • Reason tracked │
        │ • Commission set │   │                  │
        └────────┬─────────┘   └──────────────────┘
                 │
                 │ Optional:
                 │ Can be changed to rejected
                 │ (e.g., policy violations)
                 │
                 ↓
        ┌──────────────────┐
        │  BACK TO PENDING │
        │  Or stay APPROVED│
        └──────────────────┘
```

---

## 🔐 Security & Access Control

```
┌─────────────────────────────────────────────────────────┐
│              REQUEST AUTHENTICATION FLOW                │
└─────────────────────────────────────────────────────────┘

Public Endpoints (No Auth Required)
├─ POST /api/register
│  └─ Anyone can register (individual or institute)
│
└─ POST /api/login
   └─ Anyone can login

Protected Endpoints (Auth Required)
├─ GET /api/user/profile
├─ POST /api/courses/store
└─ ... (teacher endpoints)

Admin Endpoints (Admin Auth Required)
├─ GET /api/admin/institutes
├─ POST /api/admin/institutes/{id}/approve
├─ POST /api/admin/institutes/{id}/reject
└─ ... (other admin endpoints)

Access Check:
  1. Check if token valid (Sanctum)
  2. Check if user exists
  3. For admin: Check if role_id = 1
  4. If all OK: Grant access
  5. If fails: Return 401/403 error
```

---

## 📱 Client Integration Example

### Individual Teacher Registration (App)
```dart
// iOS or Flutter

class RegisterScreen {
  void registerAsTeacher() {
    final request = {
      'first_name': 'Ahmed',
      'last_name': 'Ali',
      'email': 'ahmed@example.com',
      'phone_number': '0501234567',
      'role_id': 3,
      'teacher_type': 'individual'  // or omit
    };
    
    // Send request
    final response = await http.post(
      Uri.parse('https://yourdomain.com/api/auth/register'),
      body: jsonEncode(request)
    );
    
    // Parse response (same for all)
    final user = response['user'];
    showAlert('Check your SMS/email for verification code');
  }
}
```

### Institute Registration (App)
```dart
class InstituteRegisterScreen {
  void registerInstitute() {
    final request = {
      'first_name': 'Admin',
      'last_name': 'Center',
      'email': 'info@center.com',
      'phone_number': '0501234567',
      'role_id': 3,
      'teacher_type': 'institute',  // REQUIRED
      'institute_name': 'ABC Training Center',  // REQUIRED
      'license_number': 'LIC-789012',
      'website': 'https://abc-center.com'
    };
    
    // Send request
    final response = await http.post(
      Uri.parse('https://yourdomain.com/api/auth/register'),
      body: jsonEncode(request)
    );
    
    // Parse response (same structure)
    final user = response['user'];
    showAlert('Institute registered. Awaiting admin approval');
  }
}
```

---

## 📊 Data Flow Diagram

```
┌────────────────────────────────────────────────────────────┐
│  CLIENT SUBMITS REGISTRATION REQUEST                       │
│  {teacher_type: "institute", institute_name: "ABC"}        │
└────────────┬─────────────────────────────────────────────┬─┘
             │                                             │
             │ POST /api/register                          │
             ↓                                             │
┌────────────────────────────────────────────┐             │
│  AuthController::register()                │             │
│  ├─ Validate all fields                    │             │
│  ├─ Check teacher_type                     │             │
│  ├─ If institute: verify institute fields  │             │
│  └─ Normalize phone number                 │             │
└────────────┬─────────────────────────────┬─┘             │
             │                             │               │
             │ Validation OK               │ Validation FAIL
             ↓                             │
┌────────────────────────────────────────┐ │
│  DB::beginTransaction()                │ │
│  ├─ Create User record                │ │
│  │  └─ teacher_type = 'institute'     │ │
│  │                                    │ │
│  └─ Create TeacherInstitute record   │ │
│     └─ status = 'pending'             │ │
│     └─ user_id = <new_user_id>        │ │
│                                        │ │
│  DB::commit()                         │ │
└────────────┬────────────────┬──────────┘ │
             │                │            │
             │ Success        │ Failure    │
             ↓                ↓            │
        ┌─────────┐    ┌──────────────┐   │
        │ RETURN  │    │ ROLLBACK &   │   │
        │ USER    │    │ Return Error │◄──┘
        │ DATA    │    └──────────────┘
        └────────┬┘
                 │
                 ↓ Send to Client
         ┌──────────────┐
         │ Verification │
         │ Code via SMS │
         │ & Email      │
         └──────────────┘
```

---

## 🗄️ Database Transaction Flow

```
ATOMIC OPERATION:
Either ALL succeed or ALL rollback (nothing happens)

START TRANSACTION
  ├─ User::create()
  │  └─ Insert row in users table
  │
  ├─ TeacherInstitute::create()
  │  └─ Insert row in teacher_institutes table
  │
  ├─ Both succeed?
  │  └─ COMMIT ✅
  │     All changes permanent
  │
  └─ Either fails?
     └─ ROLLBACK ❌
        Both changes reverted
        Database unchanged

Result:
- User exists → Institute record MUST exist
- No orphaned records possible
- Data integrity guaranteed
```

---

## 📈 Scaling Considerations

```
Current Implementation:
├─ Horizontal Scaling ✅
│  └─ Database connections pooled
│  └─ Stateless API servers
│
├─ Query Optimization ✅
│  └─ Indexes on: user_id, status
│  └─ Eager loading with relationships
│
├─ Caching Ready ✅
│  └─ Institute stats can be cached
│  └─ Statistics recomputable
│
└─ Production Ready ✅
   └─ Error handling in place
   └─ Logging configured
   └─ Transaction safety implemented
```

---

## 🛡️ Error Handling

```
Request Flow:
  │
  ├─ Validation Error (422)
  │  ├─ Missing required field
  │  ├─ Invalid email format
  │  └─ Return error details
  │
  ├─ Database Error (500)
  │  ├─ Transaction fails
  │  ├─ Logs error
  │  └─ Return generic message
  │
  ├─ Authentication Error (401)
  │  ├─ Invalid/missing token
  │  └─ Prompt login
  │
  └─ Authorization Error (403)
     ├─ Not admin user
     └─ Permission denied
```

---

## ✅ Implementation Checklist

```
✓ Database Migrations Created
  ├─ Add teacher_type to users
  └─ Create teacher_institutes table

✓ Models Created/Updated
  ├─ TeacherInstitute model
  └─ User model (added institute relationship)

✓ Controllers Created/Updated
  ├─ AuthController (enhanced register)
  └─ InstituteController (7 endpoints)

✓ Routes Added
  ├─ Updated POST /api/register
  └─ Added 7 /api/admin/institutes routes

✓ Documentation Created
  ├─ INSTITUTE_REGISTRATION_GUIDE.md
  ├─ INSTITUTE_QUICK_REFERENCE.md
  └─ INSTITUTE_IMPLEMENTATION_SUMMARY.md

✓ Testing Completed
  ├─ Individual registration
  ├─ Institute registration
  ├─ Admin approval flow
  └─ Error handling

✓ Backward Compatibility
  ├─ Old apps unaffected
  ├─ Response structure same
  └─ No breaking changes

✓ Production Ready
  ├─ No errors
  ├─ No warnings
  └─ Fully functional
```

---

**Status:** ✅ COMPLETE & PRODUCTION READY  
**Architecture Version:** 1.0  
**Date:** January 8, 2026
