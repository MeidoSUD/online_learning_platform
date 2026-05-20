# Teacher Welcome Notifications & Terms & Conditions Management

## Overview

This implementation adds two major features:
1. **Teacher Welcome Notifications** - Automatic push and SMS notifications sent to teachers after email verification
2. **Terms & Conditions Management** - Admin CRUD APIs to manage terms and conditions content

---

## Feature 1: Teacher Welcome Notifications

### When It Triggers
- After a teacher successfully verifies their email code via `/api/auth/verify-code` endpoint
- Only for users with role_id = 3 (teacher)

### What Gets Sent

#### Arabic Message
```
تم تسجيلك بنجاح، وأصبحت الآن جزءًا من منصة تعليمية تهدف لربطك بالطلاب وتحويل خبرتك إلى دخل حقيقي

نحن حاليًا في مرحلة تجهيز المعلمين استعدادًا للإطلاق الرسمي، فاستعد لاستقبال طلابك قريبًا وابدأ رحلتك نحو زيادة دخلك وبناء مستقبلك التعليمي معنا
```

#### English Translation
```
Welcome to our teaching platform! You have successfully registered and joined a community dedicated to connecting you with students and turning your expertise into real income.

We are currently in the teacher preparation phase ahead of our official launch. Get ready to receive your students soon and start your journey towards increasing your income and building your educational future with us.
```

### Notification Channels

1. **Push Notification**
   - Sent via NotificationService
   - Respects user's notification settings
   - Stored in notifications table

2. **SMS**
   - Bilingual message (Arabic + English)
   - Sent via dreams.sa API
   - Uses sendBilingualSMS method from NotificationService

3. **Email** (if enabled in user settings)
   - Through NotificationService

### Implementation Details

**File**: `app/Http/Controllers/API/AuthController.php`

**Method**: `sendTeacherWelcomeNotification(User $user)`

```php
private function sendTeacherWelcomeNotification(User $user): void
{
    $titleAr = 'مرحباً بك في منصة تعليمية';
    $titleEn = 'Welcome to Our Teaching Platform';
    
    // Arabic and English messages...
    
    // 1. Save to database
    Notification::create([...]);
    
    // 2. Send push notification
    NotificationService::send(...);
    
    // 3. Send bilingual SMS
    NotificationService::sendBilingualSMS(...);
}
```

**Flow**:
1. Teacher calls `/api/auth/verify-code` with user_id and verification code
2. Code is validated
3. User.verified = true
4. **If role_id == 3 (teacher)**:
   - Call sendTeacherWelcomeNotification()
   - Send push notification
   - Send bilingual SMS
   - Save notification to database
5. Return token and user data

### Error Handling
- If notification sending fails, it logs a warning but doesn't fail the verification
- This ensures teachers can still complete registration even if notifications have issues

---

## Feature 2: Terms & Conditions Management

### Purpose
Admin interface to manage and version terms & conditions, privacy policies, and other legal documents in multiple languages.

### Database Structure

**Table**: `terms_conditions`

```sql
CREATE TABLE terms_conditions (
    id BIGINT PRIMARY KEY,
    role_id BIGINT NULLABLE (FK to roles),
    title VARCHAR (old, for compatibility),
    title_en VARCHAR(255),
    title_ar VARCHAR(255),
    type ENUM('terms', 'conditions', 'privacy_policy'),
    content LONGTEXT (old, for compatibility),
    content_en LONGTEXT,
    content_ar LONGTEXT,
    version INT DEFAULT 1,
    status BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP (soft delete)
)
```

**Key Features**:
- Bilingual support (English & Arabic)
- Version tracking for content changes
- Soft deletes for audit trail
- Role-specific terms (optional)
- Active/inactive status control

### Admin APIs

#### 1. List All Terms & Conditions
```
GET /api/admin/terms-conditions
```

**Query Parameters**:
- `status=1|0` - Filter by active/inactive
- `type=terms|conditions|privacy_policy` - Filter by type
- `role_id=N` - Filter by role (teacher, student, etc.)
- `version=N` - Filter by specific version
- `include_deleted=1` - Include soft-deleted records

**Response**:
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "title_en": "Terms of Service",
            "title_ar": "شروط الخدمة",
            "type": "terms",
            "content_en": "...",
            "content_ar": "...",
            "version": 2,
            "status": true,
            "is_deleted": false,
            "created_at": "2026-05-19T...",
            "updated_at": "2026-05-19T..."
        }
    ],
    "total": 1
}
```

#### 2. Create New Terms & Conditions
```
POST /api/admin/terms-conditions
```

**Request Body**:
```json
{
    "title_en": "Terms of Service",
    "title_ar": "شروط الخدمة",
    "content_en": "Full terms content in English...",
    "content_ar": "محتوى الشروط بالكامل بالعربية...",
    "type": "terms",
    "role_id": null,
    "status": true,
    "version": 2
}
```

**Validation**:
- `title_en`, `title_ar`, `content_en`, `content_ar` - Required, string/text
- `type` - Required, one of: 'terms', 'conditions', 'privacy_policy'
- `status` - Required, boolean
- `role_id` - Optional, must exist in roles table
- `version` - Optional, auto-increments if not provided

**Auto-behaviors**:
- If version not provided: Automatically increments from the highest version for that type
- If status=true: Automatically deactivates other active records of the same type (ensures only one active version)

**Response**:
```json
{
    "success": true,
    "message": "Terms and conditions created successfully",
    "data": { /* full object */ }
}
```

#### 3. Get Single Terms & Conditions
```
GET /api/admin/terms-conditions/{id}
```

**Response**: Same as create, returns single object

#### 4. Update Terms & Conditions
```
PUT /api/admin/terms-conditions/{id}
```

**Request Body** (all fields optional):
```json
{
    "title_en": "Updated Title",
    "title_ar": "عنوان محدث",
    "content_en": "Updated content...",
    "content_ar": "محتوى محدث...",
    "type": "privacy_policy",
    "status": false
}
```

**Auto-behaviors**:
- If status changed to true: Deactivates other active records of same type

#### 5. Soft Delete
```
DELETE /api/admin/terms-conditions/{id}
```

- Marks record as deleted (deleted_at timestamp set)
- Record still in database, can be restored
- Can be retrieved with `include_deleted=1` filter

**Response**:
```json
{
    "success": true,
    "message": "Terms and conditions deleted successfully"
}
```

#### 6. Permanent Delete
```
DELETE /api/admin/terms-conditions/{id}/force
```

- Permanently removes record from database
- Cannot be restored
- Use with caution

**Response**:
```json
{
    "success": true,
    "message": "Terms and conditions permanently deleted"
}
```

#### 7. Restore Soft-Deleted
```
POST /api/admin/terms-conditions/{id}/restore
```

- Unmarks a soft-deleted record
- Sets deleted_at back to null
- Record becomes available again

**Response**:
```json
{
    "success": true,
    "message": "Terms and conditions restored successfully",
    "data": { /* full object */ }
}
```

#### 8. Get Latest Active by Type (Public)
```
GET /api/admin/terms-conditions/type/{type}
```

**Parameters**:
- `type` - One of: 'terms', 'conditions', 'privacy_policy'

**Returns**: Latest active (status=true) version of that type

**Response**:
```json
{
    "success": true,
    "data": {
        "id": 1,
        "title_en": "Privacy Policy",
        "title_ar": "سياسة الخصوصية",
        "content_en": "...",
        "content_ar": "...",
        "version": 1
    }
}
```

### Version Management

**How Versioning Works**:

1. **First Creation**: Automatically gets version 1
   ```php
   $maxVersion = TermsConditions::where('type', 'terms')->max('version') ?? 0;
   $version = $maxVersion + 1; // First: 1
   ```

2. **When to Update vs. Create**:
   - **Update existing**: Use PUT if modifying current active version
   - **Create new version**: Use POST with next version number to create a new version while keeping history

3. **Active Version Logic**:
   - Only one active (status=true) version per type per role allowed
   - Creating/updating with status=true automatically deactivates others
   - You can have multiple inactive versions for reference

4. **Example Workflow**:
   ```
   Version 1 (2026-01-01): "Old terms" - status: false
   Version 2 (2026-03-15): "Updated terms" - status: true ✓ ACTIVE
   Version 3 (2026-05-19): "New draft" - status: false
   ```

### Model: TermsConditions

**File**: `app/Models/TermsConditions.php`

**Key Methods**:
- `getLatest()` - Get latest active version
- `scopeActive()` - Query scope for active records only
- `scopeByVersion()` - Query scope for specific version

**Usage**:
```php
// Get latest active terms
$terms = TermsConditions::getLatest();

// Get all active terms
$terms = TermsConditions::active()->get();

// Get specific version
$terms = TermsConditions::byVersion(2)->get();
```

### Controller: TermsConditionsAdminController

**File**: `app/Http/Controllers/API/Admin/TermsConditionsAdminController.php`

All CRUD methods with:
- Input validation
- Comprehensive error handling
- Logging for audit trail
- Transaction support for database consistency

---

## API Routes Summary

### Public APIs (No Auth Required)
- `GET /api/admin/terms-conditions/type/{type}` - Get latest active terms by type

### Admin APIs (Requires auth:sanctum + role:admin)
- `GET /api/admin/terms-conditions` - List all
- `POST /api/admin/terms-conditions` - Create
- `GET /api/admin/terms-conditions/{id}` - Show
- `PUT /api/admin/terms-conditions/{id}` - Update
- `DELETE /api/admin/terms-conditions/{id}` - Soft delete
- `DELETE /api/admin/terms-conditions/{id}/force` - Permanent delete
- `POST /api/admin/terms-conditions/{id}/restore` - Restore

---

## File Changes Summary

### New/Modified Files

1. **`app/Models/TermsConditions.php`**
   - Added bilingual fields (title_en, title_ar, content_en, content_ar)
   - Added version and status fields
   - Added SoftDeletes trait
   - Added helper methods (getLatest, scopeActive, scopeByVersion)

2. **`app/Http/Controllers/API/Admin/TermsConditionsAdminController.php`** (NEW)
   - Complete CRUD implementation
   - Version management logic
   - Soft delete/restore functionality
   - Comprehensive validation and error handling

3. **`app/Http/Controllers/API/AuthController.php`**
   - Updated `verifyCode()` method to trigger teacher welcome notification
   - Added `sendTeacherWelcomeNotification()` private method
   - Sends push notification + bilingual SMS to teachers

4. **`routes/api.php`**
   - Added import: `use App\Http\Controllers\API\Admin\TermsConditionsAdminController;`
   - Added 8 admin routes for TermsConditions management

5. **`database/migrations/2026_05_19_165651_create_terms_conditions_table.php`**
   - Updated migration to add new bilingual fields
   - Added version, status, and soft delete columns
   - Maintained backward compatibility with old fields

---

## Testing Guide

### Test 1: Teacher Registration & Welcome Notification

**Steps**:
1. Call `POST /api/auth/register` with role_id=3 (teacher)
   ```json
   {
       "first_name": "Ahmed",
       "last_name": "Smith",
       "email": "ahmed@test.com",
       "phone_number": "+966501234567",
       "password": "password123",
       "role_id": 3
   }
   ```

2. Receive verification code via SMS
3. Call `POST /api/auth/verify-code`
   ```json
   {
       "user_id": 1,
       "code": "1234"
   }
   ```

4. **Verify in logs**:
   - Check laravel.log for "Teacher welcome SMS sent" message
   - Check notifications table for new notification record
   - Verify SMS was sent to teacher's phone via dreams.sa

### Test 2: Create Terms & Conditions

```bash
curl -X POST http://localhost:8000/api/admin/terms-conditions \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title_en": "Terms of Service",
    "title_ar": "شروط الخدمة",
    "content_en": "Full terms here...",
    "content_ar": "الشروط الكاملة هنا...",
    "type": "terms",
    "status": true
  }'
```

### Test 3: Version Management

1. Create version 1 with status=true
2. Create version 2 with status=true
3. **Verify**: Version 1 should now have status=false (auto-deactivated)
4. List: `GET /api/admin/terms-conditions?type=terms` should show both

### Test 4: Get Latest Active

```bash
curl http://localhost:8000/api/admin/terms-conditions/type/terms
```

Should return the latest version with status=true

---

## Logging & Monitoring

### Key Log Messages

**Teacher Welcome**:
```
Teacher welcome SMS sent {"user_id": 1}
```

**Terms Management**:
```
Terms and conditions created {"id": 1, "type": "terms", "version": 1}
Terms and conditions updated {"id": 1, "changes": {...}}
Terms and conditions deleted {"id": 1}
```

### Errors to Monitor

- "Failed to send teacher welcome notification" - SMS/push issues
- "Validation error creating terms" - Invalid input data
- "Failed to update terms and conditions" - Database issues

---

## Future Enhancements

1. **Content Versioning UI** - Show version history in admin dashboard
2. **Approval Workflow** - Draft → Review → Publish flow
3. **Scheduled Activation** - Set terms to activate on specific date
4. **User Acceptance Tracking** - Track which users accepted which version
5. **PDF Export** - Export terms as PDF for download
6. **Localization** - Support more languages beyond AR/EN

---

## Backward Compatibility

- Old `title` and `content` fields preserved in migration
- All new functionality uses `title_en/ar` and `content_en/ar`
- Existing code won't break, but should migrate to new fields

---

## Security Notes

- ✅ Admin routes protected with auth:sanctum + role:admin
- ✅ Soft deletes preserve audit trail
- ✅ No sensitive data in logs (only IDs and types)
- ✅ Validation ensures data integrity
- ✅ SMS not sent to invalid phone numbers

---

## Support & Questions

For issues or questions, check:
1. Laravel logs: `/storage/logs/laravel.log`
2. SMS logs: Look for "dreams.sa" in logs
3. Notification settings: Check user.notification_settings
