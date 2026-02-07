# Teacher and Student Registration Guide

## Overview

The registration system has been refactored to provide separate registration endpoints for teachers and students while maintaining backward compatibility. Both endpoints share the same response format and validation rules but teachers can optionally provide additional data that gets saved to different database tables.

## Key Changes

### 1. Three Registration Endpoints

#### A. Unified Register Endpoint (Backward Compatible)
```
POST /api/auth/register
```
- Routes to `registerTeacher()` if `role_id = 3`
- Routes to `registerStudent()` if `role_id = 4`
- Maintains backward compatibility with existing mobile/web clients
- Same response format as before

#### B. Teacher-Specific Registration Endpoint
```
POST /api/auth/register-teacher
```
- Explicitly for teachers (`role_id = 3`)
- Accepts additional fields: `service_id`, `bio`, `certificate`, `cv`
- Same validation rules as the unified endpoint
- Additional validation for service_id (must exist in services table)
- File uploads: certificate and CV
- Returns identical response structure

#### C. Student-Specific Registration Endpoint
```
POST /api/auth/register-student
```
- Explicitly for students (`role_id = 4`)
- Only accepts basic registration fields
- Identical behavior to the unified endpoint with `role_id = 4`
- Returns identical response structure

---

## API Endpoints Detail

### 1. Unified Register (POST /api/auth/register)

**Request Body:**
```json
{
  "first_name": "Ahmed",
  "last_name": "Hassan",
  "email": "ahmed@example.com",
  "phone_number": "+966501234567",
  "role_id": 3,
  "gender": "male",
  "nationality": "Saudi Arabia",
  "password": "SecurePassword123",
  "service_id": 1,
  "bio": "Experienced English teacher with 10 years teaching experience",
  "certificate": "(binary file)",
  "cv": "(binary file)"
}
```

**Required Fields:**
- `first_name` - string, max 255 characters
- `last_name` - string, max 255 characters
- `phone_number` - string (will be normalized)
- `password` - string, minimum 8 characters
- `role_id` - integer (3 for teacher, 4 for student)

**Optional Fields:**
- `email` - string, valid email format
- `gender` - string (male/female/other)
- `nationality` - string
- `service_id` - integer (only valid for teachers, must exist in services table)
- `bio` - string, max 2000 characters (only for teachers)
- `certificate` - file upload (only for teachers, max 5MB, formats: pdf, jpg, jpeg, png, doc, docx)
- `cv` - file upload (only for teachers, max 5MB, formats: pdf, doc, docx)

**Response (Success - 201):**
```json
{
  "success": true,
  "code": "REGISTRATION_SUCCESS",
  "status": "unverified",
  "message_en": "Teacher registration successful. Verification code sent via SMS and email.",
  "message_ar": "تم تسجيل المعلم بنجاح. تم إرسال رمز التحقق عبر الرسائل النصية والبريد الإلكتروني.",
  "user": {
    "id": 123,
    "first_name": "Ahmed",
    "last_name": "Hassan",
    "email": "ahmed@example.com",
    "phone_number": "+966501234567",
    "gender": "male",
    "role_id": 3
  }
}
```

**Response (Already Registered - 409):**
```json
{
  "success": false,
  "code": "ALREADY_REGISTERED",
  "status": "already_registered",
  "message_en": "This email is already registered. Please log in or use a different email.",
  "message_ar": "هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد إلكتروني مختلف.",
  "field": "email"
}
```

**Response (Validation Error - 422):**
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "status": "invalid_input",
  "message_en": "Please check your input and try again.",
  "message_ar": "يرجى التحقق من مدخلاتك والمحاولة مرة أخرى.",
  "errors": {
    "email": ["The email field must be a valid email."],
    "password": ["The password field must be at least 8 characters."]
  }
}
```

---

### 2. Teacher Registration (POST /api/auth/register-teacher)

**Request Body:**
```json
{
  "first_name": "Fatima",
  "last_name": "Mohammed",
  "email": "fatima@example.com",
  "phone_number": "+966501234567",
  "password": "SecurePassword123",
  "gender": "female",
  "nationality": "Saudi Arabia",
  "service_id": 1,
  "bio": "Native Arabic speaker teaching Arabic to international students",
  "certificate": "(binary file - PDF or image)",
  "cv": "(binary file - PDF)"
}
```

**Required Fields:**
- `first_name` - string, max 255 characters
- `last_name` - string, max 255 characters
- `phone_number` - string (will be normalized)
- `password` - string, minimum 8 characters

**Optional Fields:**
- `email` - string, valid email format
- `gender` - string (male/female/other)
- `nationality` - string
- `service_id` - integer (must exist in services table)
- `bio` - string, max 2000 characters
- `certificate` - file upload (max 5MB, formats: pdf, jpg, jpeg, png, doc, docx)
- `cv` - file upload (max 5MB, formats: pdf, doc, docx)

**Response (Success - 201):**
Same as unified endpoint

**HTTP Status Codes:**
- `201` - Registration successful
- `409` - Email or phone already registered
- `422` - Validation error
- `500` - Server error during registration

---

### 3. Student Registration (POST /api/auth/register-student)

**Request Body:**
```json
{
  "first_name": "Ali",
  "last_name": "Ahmed",
  "email": "ali@example.com",
  "phone_number": "+966501234567",
  "password": "SecurePassword123",
  "gender": "male",
  "nationality": "Saudi Arabia"
}
```

**Required Fields:**
- `first_name` - string, max 255 characters
- `last_name` - string, max 255 characters
- `phone_number` - string (will be normalized)
- `password` - string, minimum 8 characters

**Optional Fields:**
- `email` - string, valid email format
- `gender` - string (male/female/other)
- `nationality` - string

**Response (Success - 201):**
```json
{
  "success": true,
  "code": "REGISTRATION_SUCCESS",
  "status": "unverified",
  "message_en": "Student registration successful. Verification code sent via SMS and email.",
  "message_ar": "تم تسجيل الطالب بنجاح. تم إرسال رمز التحقق عبر الرسائل النصية والبريد الإلكتروني.",
  "user": {
    "id": 124,
    "first_name": "Ali",
    "last_name": "Ahmed",
    "email": "ali@example.com",
    "phone_number": "+966501234567",
    "gender": "male",
    "role_id": 4
  }
}
```

---

## Data Flow and Database Storage

### Teacher Registration Data Storage

When a teacher registers with all optional data, the system creates entries in multiple tables:

```
Users Table:
  id: 1
  first_name: "Ahmed"
  last_name: "Hassan"
  email: "ahmed@example.com"
  phone_number: "+966501234567"
  password: (hashed)
  gender: "male"
  nationality: "Saudi Arabia"
  role_id: 3 (Teacher)
  verified: false
  verification_code: "1234"

UserProfiles Table:
  id: 1
  user_id: 1
  bio: "Experienced English teacher..."
  verified: false

TeacherServices Table:
  id: 1
  teacher_id: 1
  service_id: 1

Attachments Table (for certificate):
  id: 1
  user_id: 1
  type: "certificate"
  file_path: "teacher-certificates/filename.pdf"
  file_name: "filename.pdf"
  file_size: 102400
  mime_type: "application/pdf"

Attachments Table (for CV):
  id: 2
  user_id: 1
  type: "cv"
  file_path: "teacher-cvs/filename.pdf"
  file_name: "filename.pdf"
  file_size: 51200
  mime_type: "application/pdf"
```

### Student Registration Data Storage

When a student registers, only the Users table is populated:

```
Users Table:
  id: 2
  first_name: "Ali"
  last_name: "Ahmed"
  email: "ali@example.com"
  phone_number: "+966501234567"
  password: (hashed)
  gender: "male"
  nationality: "Saudi Arabia"
  role_id: 4 (Student)
  verified: false
  verification_code: "5678"
```

---

## Service Types Reference

Service IDs available for teacher registration:

| ID | Name | Description |
|----|------|-------------|
| 1 | Private Lessons | One-on-one instruction |
| 2 | Language Study | Language learning courses |
| 3 | Courses | Full course offerings |
| 4 | Language Study | Specialized language training |

---

## File Upload Details

### Certificate Upload
- **Accepted Formats:** PDF, JPG, JPEG, PNG, DOC, DOCX
- **Max Size:** 5MB
- **Storage Location:** `storage/app/public/teacher-certificates/`
- **Accessible URL:** `/storage/teacher-certificates/filename`
- **Required:** No (optional)
- **Purpose:** Teaching credentials, certifications, qualifications

### CV Upload
- **Accepted Formats:** PDF, DOC, DOCX
- **Max Size:** 5MB
- **Storage Location:** `storage/app/public/teacher-cvs/`
- **Accessible URL:** `/storage/teacher-cvs/filename`
- **Required:** No (optional)
- **Purpose:** Curriculum Vitae, professional background

---

## Validation Rules Summary

| Field | Type | Rules | Examples |
|-------|------|-------|----------|
| `first_name` | string | required, max 255 | "Ahmed", "Fatima" |
| `last_name` | string | required, max 255 | "Hassan", "Mohammed" |
| `email` | string | optional, valid email | "user@example.com" |
| `phone_number` | string | required, normalized | "+966501234567", "0501234567" |
| `password` | string | required, min 8 chars | "MySecure@Pass123" |
| `gender` | string | optional, male/female/other | "male", "female", "other" |
| `nationality` | string | optional, max 255 | "Saudi Arabia", "UAE" |
| `service_id` | integer | optional, exists in services | 1, 2, 3, 4 |
| `bio` | string | optional, max 2000 chars | "Teaching for 10 years..." |
| `certificate` | file | optional, max 5MB | PDF, JPG, PNG, DOC, DOCX |
| `cv` | file | optional, max 5MB | PDF, DOC, DOCX |

---

## Error Handling

### Common Errors and Solutions

#### 1. Email Already Registered (409)
```json
{
  "success": false,
  "code": "ALREADY_REGISTERED",
  "status": "already_registered",
  "message_en": "This email is already registered...",
  "field": "email"
}
```
**Solution:** Use a different email or login with existing account

#### 2. Phone Already Registered (409)
```json
{
  "success": false,
  "code": "ALREADY_REGISTERED",
  "status": "already_registered",
  "message_en": "This phone number is already registered...",
  "field": "phone_number"
}
```
**Solution:** Use a different phone number or login with existing account

#### 3. Invalid Phone Number (422)
```json
{
  "success": false,
  "code": "INVALID_PHONE",
  "status": "invalid",
  "message_en": "Invalid phone number format.",
  "field": "phone_number"
}
```
**Solution:** Ensure phone number is valid for the selected country

#### 4. Validation Error - Short Password (422)
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "status": "invalid_input",
  "message_en": "Please check your input and try again.",
  "errors": {
    "password": ["The password field must be at least 8 characters."]
  }
}
```
**Solution:** Use a password with at least 8 characters

#### 5. File Too Large (422)
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "status": "invalid_input",
  "errors": {
    "certificate": ["The certificate field must not be greater than 5120 kilobytes."]
  }
}
```
**Solution:** Use a certificate file smaller than 5MB

#### 6. Invalid File Type (422)
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "status": "invalid_input",
  "errors": {
    "cv": ["The cv field must be a file of type: pdf, doc, docx."]
  }
}
```
**Solution:** Convert CV to PDF, DOC, or DOCX format

---

## Phone Number Normalization

The system automatically normalizes phone numbers using the PhoneHelper utility:

**Supported Formats:**
- International: `+966501234567`
- With spaces: `+966 50 123 4567`
- With dashes: `+966-50-123-4567`
- Local format: `0501234567` (converted to international)

**Normalization Process:**
1. Extracts only digits from input
2. Checks country code
3. Validates format
4. Stores in international format with `+` prefix

---

## Backward Compatibility

The original `/api/auth/register` endpoint continues to work exactly as before:

**Key Points:**
- Accepts all fields (basic + teacher-specific)
- Routes to appropriate function based on `role_id`
- Returns identical response format
- All existing mobile/web clients continue to work
- Recommended for new integrations to use role-specific endpoints

---

## Migration Guide for Mobile Apps

### For Apps Currently Using `/api/auth/register`

**No action required** - The endpoint continues to work as before.

### For Apps Wanting to Use New Endpoints

**For Teachers:**
```dart
// Replace this:
POST /api/auth/register (with role_id: 3)

// With this:
POST /api/auth/register-teacher (no role_id needed)
```

**For Students:**
```dart
// Replace this:
POST /api/auth/register (with role_id: 4)

// With this:
POST /api/auth/register-student (no role_id needed)
```

---

## Verification After Registration

### Step 1: Receive Verification Code
After successful registration (201 response), the user receives:
- SMS with 4-digit code
- Email with verification link containing the code

### Step 2: Verify Registration
```
POST /api/auth/verify
```
**Request:**
```json
{
  "phone_number": "+966501234567",
  "verification_code": "1234"
}
```

### Step 3: Login
After verification, user can login:
```
POST /api/auth/login
```

---

## Example: Complete Teacher Registration Flow

### Step 1: Prepare Files
Ensure you have:
- Certificate file (e.g., `certificate.pdf`)
- CV file (e.g., `cv.pdf`)

### Step 2: Register Teacher
```bash
curl -X POST http://localhost:8000/api/auth/register-teacher \
  -F "first_name=Ahmed" \
  -F "last_name=Hassan" \
  -F "email=ahmed@example.com" \
  -F "phone_number=+966501234567" \
  -F "password=SecurePassword123" \
  -F "gender=male" \
  -F "nationality=Saudi Arabia" \
  -F "service_id=1" \
  -F "bio=Experienced English teacher with 10 years experience" \
  -F "certificate=@certificate.pdf" \
  -F "cv=@cv.pdf"
```

### Step 3: Receive Response
```json
{
  "success": true,
  "code": "REGISTRATION_SUCCESS",
  "status": "unverified",
  "message_en": "Teacher registration successful...",
  "user": {
    "id": 123,
    "first_name": "Ahmed",
    "last_name": "Hassan",
    "email": "ahmed@example.com",
    "phone_number": "+966501234567",
    "gender": "male",
    "role_id": 3
  }
}
```

### Step 4: Verify with Code
```bash
curl -X POST http://localhost:8000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+966501234567",
    "verification_code": "1234"
  }'
```

### Step 5: Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed@example.com",
    "password": "SecurePassword123"
  }'
```

---

## Database Considerations

### Transaction Safety
- Registration uses database transactions with rollback
- If file upload fails, registration still completes (files are non-critical)
- If user creation fails, entire transaction rolls back

### Unique Constraints
- `email` - Unique per user (if email provided)
- `phone_number` - Unique per user (always required)
- Email/phone validation happens before database commit

### File Storage
- Certificates stored in: `storage/app/public/teacher-certificates/`
- CVs stored in: `storage/app/public/teacher-cvs/`
- Attachments table tracks all uploaded files
- Files can be retrieved later for verification

---

## Logging

The system logs all registration attempts for security and debugging:

### Log Examples

**Successful Teacher Registration:**
```
[2024-01-15 10:30:45] local.INFO: Teacher registration request received {"has_service_id":true,"has_certificate":true,"has_cv":true,"has_bio":true}
[2024-01-15 10:30:46] local.INFO: Teacher user created {"user_id":123}
[2024-01-15 10:30:46] local.INFO: Teacher profile created with bio {"user_id":123}
[2024-01-15 10:30:46] local.INFO: Teacher service added {"user_id":123,"service_id":1}
[2024-01-15 10:30:47] local.INFO: Teacher certificate uploaded {"user_id":123,"file_path":"teacher-certificates/..."}
[2024-01-15 10:30:47] local.INFO: Teacher CV uploaded {"user_id":123,"file_path":"teacher-cvs/..."}
```

**Validation Error:**
```
[2024-01-15 10:35:12] local.WARNING: Teacher registration validation failed {"errors":{"password":["must be at least 8 characters"]}}
```

**Duplicate Registration:**
```
[2024-01-15 10:40:15] local.WARNING: Teacher registration - email already exists {"email":"existing@example.com"}
```

---

## Security Considerations

1. **Password Hashing:** Passwords are hashed using Laravel's Hash facade (bcrypt)
2. **SQL Injection:** All inputs are properly escaped through Laravel's query builder
3. **File Validation:** Files are validated by type and size before storage
4. **Phone Normalization:** Prevents duplicate registrations via different formats
5. **Transaction Safety:** Database transactions prevent partial records
6. **Rate Limiting:** Consider implementing rate limiting on registration endpoints
7. **Email Verification:** Required before account can be fully used
8. **SMS Verification:** OTP sent via SMS for additional security

---

## Performance Tips

1. **Async File Upload:** Consider using queue for file processing if doing additional operations
2. **Database Indexing:** Ensure `users.email` and `users.phone_number` are indexed
3. **Validation Caching:** Service IDs validation - consider caching services list
4. **Storage:** Ensure adequate disk space for certificate/CV uploads
5. **Network:** File uploads may take time - set appropriate timeouts

---

## Testing Guide

### Unit Tests for Teacher Registration
```php
// Test successful teacher registration
public function testTeacherRegistrationSuccess()
{
    $response = $this->postJson('/api/auth/register-teacher', [
        'first_name' => 'Ahmed',
        'last_name' => 'Hassan',
        'email' => 'ahmed@example.com',
        'phone_number' => '+966501234567',
        'password' => 'SecurePassword123',
        'service_id' => 1,
        'bio' => 'Test bio'
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('success', true)
        ->assertJsonPath('user.role_id', 3);
    
    // Verify data was saved
    $this->assertDatabaseHas('users', ['email' => 'ahmed@example.com']);
    $this->assertDatabaseHas('user_profiles', ['bio' => 'Test bio']);
    $this->assertDatabaseHas('teacher_services', ['service_id' => 1]);
}

// Test duplicate email
public function testTeacherRegistrationDuplicateEmail()
{
    User::factory()->create(['email' => 'test@example.com']);
    
    $response = $this->postJson('/api/auth/register-teacher', [
        'email' => 'test@example.com',
        'phone_number' => '+966501234567',
        'password' => 'SecurePassword123'
    ]);

    $response->assertStatus(409)
        ->assertJsonPath('code', 'ALREADY_REGISTERED');
}
```

### Integration Tests for File Upload
```php
// Test certificate upload
public function testTeacherRegistrationWithCertificate()
{
    $certificateFile = UploadedFile::fake()->create('certificate.pdf', 1000, 'application/pdf');
    
    $response = $this->postJson('/api/auth/register-teacher', [
        'first_name' => 'Ahmed',
        'phone_number' => '+966501234567',
        'password' => 'SecurePassword123',
        'certificate' => $certificateFile
    ]);

    $response->assertStatus(201);
    
    // Verify file was stored
    $this->assertDatabaseHas('attachments', ['type' => 'certificate']);
}
```

---

## Troubleshooting

### Issue: File uploads not working
**Possible Causes:**
- Storage disk not configured properly
- Symbolic link not created: `php artisan storage:link`
- File permissions issue on storage directory

**Solution:**
```bash
# Create symbolic link
php artisan storage:link

# Check permissions
chmod -R 775 storage/app/public
```

### Issue: Phone normalization failing
**Possible Causes:**
- Invalid phone format for country
- Missing country code

**Solution:**
- Always provide phone in international format (+966...)
- Check PhoneHelper implementation for supported countries

### Issue: Verification code not sent
**Possible Causes:**
- SMS/Email service not configured
- API credentials missing

**Solution:**
- Check mail and SMS service configuration
- Verify log files for specific errors

### Issue: Database transaction rollback
**Possible Causes:**
- Unique constraint violation
- Foreign key violation
- Database connection error

**Solution:**
- Check logs for specific error
- Verify data integrity constraints
- Ensure database connection is active

---

## Future Enhancements

1. **Social Registration:** Add Facebook, Google registration for teachers/students
2. **Bulk Import:** Admin endpoint to bulk import teachers with certificates
3. **Document Verification:** Automated document verification workflow
4. **Profile Completion:** Wizard-style profile setup after registration
5. **Bank Account:** Teacher bank account details for payment (later step)
6. **Video Introduction:** Teachers can upload introduction video
7. **Language Proficiency:** Test/verify language proficiency for language teachers
8. **Subject Specialization:** Multiple subject selection for teachers

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-15 | Initial implementation with teacher/student separation |

---

## Support

For issues or questions about registration:
1. Check logs in `storage/logs/laravel.log`
2. Review this documentation
3. Test with cURL or Postman
4. Contact development team with reproduction steps and logs
