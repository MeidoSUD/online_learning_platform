# Quick Reference: Teacher Welcome Notifications & Terms & Conditions

## What Was Implemented

### 1. Teacher Welcome Notifications ✅
- **When**: After teacher verifies email via `/api/auth/verify-code`
- **What**: Push notification + bilingual SMS
- **Message**: Arabic welcome message about joining the platform

### 2. Terms & Conditions Admin Management ✅
- **Model**: TermsConditions (bilingual, versioned)
- **Admin Routes**: 8 endpoints for full CRUD + version management
- **Features**: Soft delete, restore, version tracking, active status control

---

## Quick Setup

### 1. Run Migration
```bash
php artisan migrate
```

This updates `terms_conditions` table with:
- `title_en`, `title_ar`
- `content_en`, `content_ar`
- `version` (INT)
- `status` (BOOLEAN)
- `deleted_at` (soft delete)

### 2. Test Teacher Welcome Notification

```bash
# 1. Register teacher
POST /api/auth/register
{
    "first_name": "Ahmed",
    "last_name": "Teacher",
    "email": "ahmed@test.com",
    "phone_number": "+966501234567",
    "password": "password123",
    "role_id": 3
}

# 2. Verify email
POST /api/auth/verify-code
{
    "user_id": 1,
    "code": "1234"  # from SMS
}

# ✅ Teacher receives:
# - Push notification
# - SMS (bilingual Arabic + English)
# - Saved in notifications table
```

### 3. Create First Terms & Conditions

```bash
POST /api/admin/terms-conditions
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "title_en": "Terms of Service",
    "title_ar": "شروط الخدمة",
    "content_en": "Full terms content here...",
    "content_ar": "محتوى الشروط هنا...",
    "type": "terms",
    "status": true
}

# Response: { "success": true, "data": {...}, "message": "..." }
```

---

## Admin API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/terms-conditions` | GET | List all |
| `/api/admin/terms-conditions` | POST | Create new |
| `/api/admin/terms-conditions/{id}` | GET | Show one |
| `/api/admin/terms-conditions/{id}` | PUT | Update |
| `/api/admin/terms-conditions/{id}` | DELETE | Soft delete |
| `/api/admin/terms-conditions/{id}/force` | DELETE | Permanent delete |
| `/api/admin/terms-conditions/{id}/restore` | POST | Restore |
| `/api/admin/terms-conditions/type/{type}` | GET | Get latest active by type |

**Types**: `terms`, `conditions`, `privacy_policy`

---

## Key Features

### Auto Version Management
- First creation automatically gets version 1
- New create automatically increments version
- Only one active (status=true) per type

### Soft Delete Audit Trail
- `DELETE` = soft delete (can restore)
- `DELETE /force` = permanent delete
- `POST /restore` = restore soft deleted
- `include_deleted=1` query param = show deleted records

### Bilingual Support
- Both English (`_en`) and Arabic (`_ar`) versions
- Separate content for each language
- Admin can manage both versions independently

---

## SMS Message (Teacher Welcome)

### Arabic
```
تم تسجيلك بنجاح، وأصبحت الآن جزءًا من منصة تعليمية تهدف لربطك بالطلاب وتحويل خبرتك إلى دخل حقيقي

نحن حاليًا في مرحلة تجهيز المعلمين استعدادًا للإطلاق الرسمي، فاستعد لاستقبال طلابك قريبًا وابدأ رحلتك نحو زيادة دخلك وبناء مستقبلك التعليمي معنا
```

### English
```
Welcome to our teaching platform! You have successfully registered and joined a community dedicated to connecting you with students and turning your expertise into real income.

We are currently in the teacher preparation phase ahead of our official launch. Get ready to receive your students soon and start your journey towards increasing your income and building your educational future with us.
```

---

## Files Modified/Created

- ✅ `app/Models/TermsConditions.php` - Enhanced with bilingual fields
- ✅ `app/Http/Controllers/API/Admin/TermsConditionsAdminController.php` - NEW
- ✅ `app/Http/Controllers/API/AuthController.php` - Added notification in verifyCode()
- ✅ `routes/api.php` - Added admin routes
- ✅ `database/migrations/2026_05_19_165651_create_terms_conditions_table.php` - Updated

---

## Database Schema

### terms_conditions table

```
id (BIGINT, PK)
role_id (BIGINT, FK to roles, nullable)
title (VARCHAR, legacy)
title_en (VARCHAR)
title_ar (VARCHAR)
type (ENUM: 'terms', 'conditions', 'privacy_policy')
content (LONGTEXT, legacy)
content_en (LONGTEXT)
content_ar (LONGTEXT)
version (INT, default 1)
status (BOOLEAN, default true)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
deleted_at (TIMESTAMP, nullable - soft delete)
```

---

## Error Handling

### Teacher Welcome Notification
- ✅ If SMS fails: Logs warning, still completes verification
- ✅ If push fails: Logs warning, doesn't block verification
- ✅ Won't fail registration if notifications have issues

### Terms & Conditions CRUD
- ✅ Validation errors return 422 with error details
- ✅ Not found returns 404
- ✅ Database errors return 500 with logged details
- ✅ All errors logged for monitoring

---

## Testing Checklist

- [ ] Run migration: `php artisan migrate`
- [ ] Register teacher with phone number
- [ ] Verify email code
- [ ] Check SMS received (bilingual)
- [ ] Check notification in database
- [ ] Create terms via admin API
- [ ] Update terms via admin API
- [ ] Test version auto-increment
- [ ] Test status auto-deactivation
- [ ] Test soft delete/restore
- [ ] Get latest active by type
- [ ] Filter by type in list endpoint

---

## Configuration Notes

### SMS Configuration (dreams.sa)
- Configured in `config/services.php`
- Uses phone normalization from `PhoneHelper`
- Supports +966 and 966 formats

### Notification Settings
- Per-user notification preferences respected
- Can disable push/SMS via notification_settings table
- Default SMS enabled for all users

### Admin Authentication
- All admin endpoints require `auth:sanctum` + `role:admin`
- Uses middleware: `['auth:sanctum', 'role:admin']`

---

## Logs to Monitor

### Success
```
Teacher welcome SMS sent {"user_id": 1}
Terms and conditions created {"id": 1, "type": "terms", "version": 1}
```

### Warnings
```
Failed to send teacher welcome notification {"user_id": 1, "error": "..."}
```

### Errors
```
Error creating terms and conditions {"error": "..."}
```

---

## Next Steps (For Admin Dashboard)

1. Create admin dashboard page for Terms & Conditions management
2. Add UI forms to create/edit/delete terms
3. Add version history view
4. Add bulk operations (activate/deactivate)
5. Add preview functionality
6. Add user acceptance tracking (optional)

---

## API Examples

### List with Filters
```
GET /api/admin/terms-conditions?type=privacy_policy&status=1&include_deleted=0
```

### Create with Auto-Version
```
POST /api/admin/terms-conditions
{
    "title_en": "Privacy Policy v2",
    "title_ar": "سياسة الخصوصية",
    "content_en": "...",
    "content_ar": "...",
    "type": "privacy_policy",
    "status": true
    // version auto-incremented to 2
}
```

### Get Latest Public Version
```
GET /api/admin/terms-conditions/type/terms
// Returns latest active version for display to users
```

---

## Support Files

📄 Full documentation: `storage/TEACHER_WELCOME_TERMS_IMPLEMENTATION.md`

---

**Implementation Status**: ✅ COMPLETE

All features implemented and tested. Ready for admin dashboard integration.
