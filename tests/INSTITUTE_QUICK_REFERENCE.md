# 🏫 Institute Registration - Quick Reference

Fast lookup guide for institute management APIs and registration.

---

## 📋 Quick Facts

| Item | Details |
|------|---------|
| **Teacher Types** | individual, institute |
| **Status Values** | pending, approved, rejected |
| **Default Type** | individual |
| **Admin Only** | Yes (role_id = 1) |
| **Authentication** | Sanctum token required |
| **Base URL** | `/api/admin/institutes` |

---

## 🔐 Registration Endpoints

### Individual Teacher (Existing - No Change)
```bash
POST /api/auth/register
{
  "first_name": "Ahmed",
  "last_name": "Ali",
  "email": "ahmed@example.com",
  "phone_number": "0501234567",
  "role_id": 2,
  "teacher_type": "individual"  # Optional
}
```

### Institute (New)
```bash
POST /api/auth/register
{
  "first_name": "Admin",
  "last_name": "Center",
  "email": "info@center.com",
  "phone_number": "0501234567",
  "role_id": 2,
  "teacher_type": "institute",          # Required
  "institute_name": "ABC Center",       # Required
  "commercial_register": "COM-123",     # Optional
  "license_number": "LIC-123",         # Optional
  "description": "Training center...",  # Optional
  "website": "https://center.com"      # Optional
}
```

---

## 👮 Admin API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/institutes` | List all institutes |
| GET | `/institutes/stats` | Get statistics |
| GET | `/institutes/{id}` | View single institute |
| POST | `/institutes/{id}/approve` | Approve registration |
| POST | `/institutes/{id}/reject` | Reject registration |
| PUT | `/institutes/{id}` | Update institute |
| DELETE | `/institutes/{id}` | Delete institute |

---

## 🔍 Filtering & Pagination

```bash
# List pending institutes (20 per page)
GET /api/admin/institutes?status=pending&per_page=20

# List approved institutes (page 2)
GET /api/admin/institutes?status=approved&page=2

# Filter options
status=pending    # Show pending applications
status=approved   # Show approved institutes
status=rejected   # Show rejected applications

per_page=10|20|50|100   # Items per page
page=1,2,3...           # Page number
```

---

## ✅ Approval Workflow

```
Registration (status=pending)
        ↓
Admin reviews (GET /institutes?status=pending)
        ↓
      ╱─────────╲
   Approve    Reject
     /           \
   status=     status=
   approved   rejected
```

### Approve Example
```bash
POST /api/admin/institutes/1/approve

# Optional: Set commission
{
  "commission_percentage": 20.00
}

Response:
{
  "success": true,
  "message": "Institute approved successfully",
  "data": { "id": 1, "status": "approved", ... }
}
```

### Reject Example
```bash
POST /api/admin/institutes/1/reject

# Required: Reason
{
  "rejection_reason": "Documents not valid. Please resubmit proper license."
}

Response:
{
  "success": true,
  "message": "Institute rejected successfully",
  "data": { "id": 1, "status": "rejected", "rejection_reason": "..." }
}
```

---

## 📊 Database Tables

### users (Updated)
```
id (PK)
first_name
last_name
email
phone_number
gender
nationality
role_id
teacher_type  ← NEW (individual|institute)
password
fcm_token
verified
verification_code
created_at
updated_at
```

### teacher_institutes (New)
```
id (PK)
user_id (FK → users.id) ← CASCADE DELETE
institute_name
commercial_register
license_number
cover_image
intro_video
description
website
commission_percentage
status (pending|approved|rejected)
rejection_reason
created_at
updated_at
```

---

## 🎯 Key Features

✅ **Backward Compatible**
- Existing teachers unaffected
- Old apps continue working
- No changed response keys
- teacher_type optional in requests

✅ **Flexible**
- Institute can have cover image/video
- Commission percentage configurable
- Website and description optional
- Rejection reason tracked

✅ **Secure**
- Admin only access
- Token authentication
- Database transactions
- Cascade delete protection

---

## 🚨 Validation Errors

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| 422 institute_name required | teacher_type=institute but no name | Add institute_name field |
| 422 email already exists | Email used before | Use unique email |
| 404 Institute not found | Wrong institute ID | Verify ID exists |
| 401 Unauthorized | No/invalid token | Include valid auth token |
| 403 Forbidden | Not admin user | Use admin account (role_id=1) |

### Example Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "institute_name": ["The institute name field is required."]
  }
}
```

---

## 💡 Quick Curl Examples

### List Institutes (Pending)
```bash
curl -X GET "http://localhost:8000/api/admin/institutes?status=pending" \
  -H "Authorization: Bearer TOKEN"
```

### Get Stats
```bash
curl -X GET "http://localhost:8000/api/admin/institutes/stats" \
  -H "Authorization: Bearer TOKEN"
```

### Approve Institute
```bash
curl -X POST "http://localhost:8000/api/admin/institutes/1/approve" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"commission_percentage": 15}'
```

### Reject Institute
```bash
curl -X POST "http://localhost:8000/api/admin/institutes/1/reject" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rejection_reason": "Documents not valid"}'
```

### Register Institute
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Center",
    "last_name": "Admin",
    "email": "info@center.com",
    "phone_number": "0501234567",
    "role_id": 2,
    "teacher_type": "institute",
    "institute_name": "ABC Training Center",
    "license_number": "LIC-001"
  }'
```

---

## 🧪 Testing Checklist

```
□ Register individual teacher (existing flow)
□ Register institute (new flow)
□ List all institutes
□ Filter by status=pending
□ Get institute stats
□ View single institute
□ Approve institute
□ Reject institute with reason
□ Update institute details
□ Delete institute
□ Verify cascade delete (delete user → delete institute)
```

---

## 📱 App Integration

### For iOS/Flutter

**Option 1: Individual Teacher (Existing)**
```dart
final response = await http.post(
  Uri.parse('https://yourdomain.com/api/auth/register'),
  body: jsonEncode({
    'first_name': 'Ahmed',
    'last_name': 'Ali',
    'email': 'ahmed@example.com',
    'phone_number': '0501234567',
    'role_id': 2,
    'teacher_type': 'individual'
  })
);
```

**Option 2: Institute (New)**
```dart
final response = await http.post(
  Uri.parse('https://yourdomain.com/api/auth/register'),
  body: jsonEncode({
    'first_name': 'Center',
    'last_name': 'Admin',
    'email': 'info@center.com',
    'phone_number': '0501234567',
    'role_id': 2,
    'teacher_type': 'institute',
    'institute_name': 'ABC Training Center',
    'license_number': 'LIC-001'
  })
);
```

**Response (Same for Both)**
```dart
{
  "message": "Verification code sent...",
  "user": {
    "id": 123,
    "first_name": "...",
    "last_name": "...",
    "email": "...",
    "phone_number": "...",
    "role_id": 2
  }
}
```

---

## 🔄 Migration Path

### Step 1: Run Migrations
```bash
php artisan migrate
```

### Step 2: Verify Tables
```bash
php artisan tinker
>>> DB::table('users')->limit(1)->first();
>>> DB::table('teacher_institutes')->limit(1)->first();
```

### Step 3: Test Registration
- Register new individual teacher (verify teacher_type = individual)
- Register new institute (verify both user and institute records created)

### Step 4: Test Admin APIs
- List institutes
- Approve institute
- Verify status changes

---

## 📞 Troubleshooting

**Q: Getting error when registering institute?**
A: Check that teacher_type='institute' AND institute_name is provided.

**Q: Can't approve institute?**
A: Verify you're logged in as admin (role_id=1) and have valid token.

**Q: Status not updating in database?**
A: Check institute ID exists and transaction didn't fail.

**Q: Old apps showing errors?**
A: No breaking changes - teacher_type is optional. Apps should ignore new fields.

---

## 📚 Related Documentation

- Full guide: `INSTITUTE_REGISTRATION_GUIDE.md`
- API endpoints: Routes in `routes/api.php`
- Models: `app/Models/TeacherInstitute.php`, `app/Models/User.php`
- Controller: `app/Http/Controllers/API/Admin/InstituteController.php`

---

## ✅ Compatibility

| Component | Status |
|-----------|--------|
| Existing teacher registration | ✅ Unchanged |
| Existing teacher API | ✅ Works as before |
| iOS app (old version) | ✅ No changes needed |
| Flutter app (old version) | ✅ No changes needed |
| Database backups | ✅ Migration reversible |

---

**Status:** ✅ Production Ready  
**Created:** January 8, 2026
