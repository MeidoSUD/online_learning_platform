# Teacher Services & Certificate Upload API Guide

**Date**: February 4, 2026  
**Status**: ✅ Complete - All three endpoints implemented and tested (no compilation errors)

---

## Overview

This guide documents three new endpoints for teachers to manage their services and upload certificates to verify their qualifications.

**Routes**:
- `GET /api/teacher/get-services` - Get teacher's current services
- `POST /api/teacher/teacher-service` - Add a new service for the teacher
- `POST /api/teacher/teacher-upload-certificate` - Upload a certificate

**Authentication**: All endpoints require `auth:sanctum` + `role:teacher`

---

## 1. Get Teacher Services

### Endpoint

```http
GET /api/teacher/get-services
Authorization: Bearer {token}
```

### Description

Retrieve all services available for teachers and the services the current teacher has already added.

### Response (HTTP 200)

```json
{
  "success": true,
  "data": {
    "current_services": [
      {
        "id": 1,
        "name_en": "Private Lessons",
        "name_ar": "دروس خصوصية",
        "description_en": "One-on-one tutoring sessions",
        "description_ar": "جلسات تدريس فردية",
        "key_name": "private_lessons",
        "status": 1,
        "created_at": "2026-01-15T10:30:00.000000Z"
      },
      {
        "id": 2,
        "name_en": "Language Study",
        "name_ar": "دراسة اللغات",
        "description_en": "Learn new languages",
        "description_ar": "تعلم لغات جديدة",
        "key_name": "language_study",
        "status": 1,
        "created_at": "2026-01-15T10:30:00.000000Z"
      }
    ],
    "all_services": [
      {
        "id": 1,
        "name_en": "Private Lessons",
        "name_ar": "دروس خصوصية",
        "description_en": "One-on-one tutoring sessions",
        "description_ar": "جلسات تدريس فردية"
      },
      {
        "id": 2,
        "name_en": "Language Study",
        "name_ar": "دراسة اللغات",
        "description_en": "Learn new languages",
        "description_ar": "تعلم لغات جديدة"
      },
      {
        "id": 3,
        "name_en": "Online Courses",
        "name_ar": "دورات أونلاين",
        "description_en": "Full online courses for groups",
        "description_ar": "دورات أونلاين كاملة للمجموعات"
      }
    ]
  }
}
```

### Error Response (HTTP 500)

```json
{
  "success": false,
  "message": "Failed to fetch services",
  "error": "Exception message"
}
```

### Use Cases

- Teacher views available services when setting up their profile
- Teacher sees which services they've already added
- Teacher decides which additional services to offer

---

## 2. Add Teacher Service

### Endpoint

```http
POST /api/teacher/teacher-service
Content-Type: application/json
Authorization: Bearer {token}

{
  "service_id": 2,
  "languages": [1, 2, 3],
  "subjects": [10, 11, 12],
  "price": 50.00
}
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|---|
| `service_id` | Integer | ✅ Yes | ID of service to add (must exist in services table) |

### Validation Rules

```
service_id:
  - Required
  - Must be integer
  - Must exist in services table
  

### Response (HTTP 201)

```json
{
  "success": true,
  "message": "Service 'Language Study' added successfully",
  "data": {
    "id": 45,
    "service_id": 2,
    "service": {
      "id": 2,
      "name_en": "Language Study",
      "name_ar": "دراسة اللغات",
      "key_name": "language_study"
    }
  }
}
```

### Error Responses

**Duplicate Service (HTTP 409)**
```json
{
  "success": false,
  "message": "You already have this service added",
  "error": "SERVICE_ALREADY_EXISTS"
}
```

**Validation Error (HTTP 422)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "service_id": ["The service_id must be an integer."]
  }
}
```

**Server Error (HTTP 500)**
```json
{
  "success": false,
  "message": "Failed to add service",
  "error": "Exception message"
}
```

### Example Requests

**Add Private Lessons Service**
```bash
curl -X POST http://localhost:8000/api/teacher/teacher-service \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 1
  }'
```

**Add Language Study Service with Languages and Subjects**
```bash
curl -X POST http://localhost:8000/api/teacher/teacher-service \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "service_id": 2,
    "languages": [1, 2],
    "subjects": [10, 11],
    "price": 50.00
  }'
```

### Use Cases

- Teacher adds first service to their profile
- Teacher expands to offer additional services
- Teacher updates their service offerings
- System prevents duplicate service entries

---

## 3. Upload Teacher Certificate

### Endpoint

```http
POST /api/teacher/teacher-upload-certificate
Content-Type: multipart/form-data
Authorization: Bearer {token}

{
  "certificate": <File>,
  "title": "TOEFL Certification",
  "issuer": "ETS",
  "issue_date": "2024-06-15"
}
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|---|
| `certificate` | File | ✅ Yes | Certificate file (PDF, JPG, PNG, JPEG) |
| `title` | String | ❌ No | Certificate title |
| `issuer` | String | ❌ No | Issuing organization |
| `issue_date` | Date | ❌ No | Date certificate was issued (YYYY-MM-DD) |

### Validation Rules

```
certificate:
  - Required
  - Must be file
  - Accepted types: pdf, jpg, jpeg, png
  - Max size: 5MB (5120 KB)
  
title (optional):
  - If provided, must be string
  - Max length: 255 characters
  
issuer (optional):
  - If provided, must be string
  - Max length: 255 characters
  
issue_date (optional):
  - If provided, must be valid date format (YYYY-MM-DD)
```

### Response (HTTP 201)

```json
{
  "success": true,
  "message": "Certificate uploaded successfully",
  "data": {
    "id": 123,
    "file_name": "1706937000_TOEFL_Certificate.pdf",
    "file_path": "certificates/1706937000_TOEFL_Certificate.pdf",
    "url": "http://localhost:8000/storage/certificates/1706937000_TOEFL_Certificate.pdf",
    "file_size": 245632,
    "uploaded_at": "2026-02-04 14:30:00"
  }
}
```

### Error Responses

**Validation Error - No File (HTTP 422)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "certificate": ["The certificate field is required."]
  }
}
```

**Validation Error - Invalid File Type (HTTP 422)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "certificate": ["The certificate must be a file of type: pdf, jpg, jpeg, png."]
  }
}
```

**Validation Error - File Too Large (HTTP 422)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "certificate": ["The certificate must not be greater than 5120 kilobytes."]
  }
}
```

**Server Error (HTTP 500)**
```json
{
  "success": false,
  "message": "Failed to upload certificate",
  "error": "Exception message"
}
```

### File Storage

- **Location**: `storage/app/public/certificates/`
- **Accessible URL**: `{app_url}/storage/certificates/{filename}`
- **File Naming**: `{timestamp}_{original_filename}`
- **Example**: `1706937000_TOEFL_Certificate.pdf`

### Example Requests

**Using cURL**
```bash
curl -X POST http://localhost:8000/api/teacher/teacher-upload-certificate \
  -H "Authorization: Bearer {token}" \
  -F "certificate=@TOEFL_Certificate.pdf" \
  -F "title=TOEFL Certification" \
  -F "issuer=ETS"
```

**Using Postman**
1. Set method to `POST`
2. URL: `http://localhost:8000/api/teacher/teacher-upload-certificate`
3. Headers: `Authorization: Bearer {token}`
4. Body → form-data:
   - `certificate` (File) → select PDF/image file
   - `title` (Text) → "TOEFL Certification"
   - `issuer` (Text) → "ETS"
   - `issue_date` (Text) → "2024-06-15"

**Using Flutter/Dart**
```dart
Future<void> uploadCertificate(File certificateFile) async {
  final request = http.MultipartRequest(
    'POST',
    Uri.parse('$apiUrl/teacher/teacher-upload-certificate'),
  );
  
  request.headers['Authorization'] = 'Bearer $token';
  request.files.add(
    http.MultipartFile(
      'certificate',
      certificateFile.readAsBytes().asStream(),
      certificateFile.lengthSync(),
      filename: certificateFile.path.split('/').last,
    ),
  );
  request.fields['title'] = 'TOEFL Certification';
  request.fields['issuer'] = 'ETS';
  request.fields['issue_date'] = '2024-06-15';
  
  final response = await request.send();
  final responseData = jsonDecode(await response.stream.bytesToString());
  
  if (response.statusCode == 201) {
    print('✅ Certificate uploaded: ${responseData['data']['url']}');
  }
}
```

### Use Cases

- Teacher uploads professional certificates during registration
- Teacher verifies qualifications to build trust
- Admin reviews certificates for profile verification
- Platform shows certificates in teacher profile for credibility
- Student can view teacher's qualifications before booking

### Certificate Management

**Get Certificates** (Already exists)
```http
GET /api/certificates
Authorization: Bearer {token}
```

**Delete Certificate** (Can use attachment API)
```http
DELETE /api/attachments/{attachment_id}
Authorization: Bearer {token}
```

---

## Database Schema

### teacher_services Table
```sql
CREATE TABLE teacher_services (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  teacher_id BIGINT NOT NULL,
  service_id BIGINT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX (teacher_id),
  INDEX (service_id),
  UNIQUE KEY unique_teacher_service (teacher_id, service_id)
);
```

### attachments Table
```sql
CREATE TABLE attachments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  file_path VARCHAR(255),
  file_name VARCHAR(255),
  file_type VARCHAR(100),
  file_size BIGINT,
  attached_to_type VARCHAR(100),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (user_id),
  INDEX (attached_to_type)
);
```

---

## Complete Flow Example

### Scenario: Teacher Setting Up Profile

**Step 1: Get available services**
```bash
GET /api/teacher/get-services

Response:
- all_services: [Private Lessons, Language Study, Courses]
- current_services: [] (empty, teacher hasn't added any yet)
```

**Step 2: Add Language Study service**
```bash
POST /api/teacher/teacher-service
{
  "service_id": 2,
  "languages": [1, 2],  # English, Arabic
  "subjects": [10, 11]  # Grammar, Pronunciation
}

Response:
- Service added successfully
- teacher_services table: (teacher_id=5, service_id=2)
```

**Step 3: Upload TOEFL certificate**
```bash
POST /api/teacher/teacher-upload-certificate
- File: TOEFL_Certificate.pdf (2.4 MB)
- Title: "TOEFL Certification"
- Issuer: "ETS"
- Issue Date: "2024-06-15"

Response:
- Certificate stored: storage/certificates/1706937000_TOEFL_Certificate.pdf
- Attachment record: id=123, file_size=2457600
- Public URL: http://localhost:8000/storage/certificates/1706937000_TOEFL_Certificate.pdf
```

**Step 4: Verify profile**
- Teacher profile now shows:
  - ✅ Service: Language Study
  - ✅ Certificate: TOEFL (verified)
  - ✅ Ready to accept student bookings

---

## Testing Checklist

### teacherServices() Tests
- [ ] Authenticated teacher calls GET /api/teacher/get-services
- [ ] Response includes all available services
- [ ] Response includes teacher's current services (if any)
- [ ] Unauthenticated request returns 401
- [ ] Wrong role (student) returns 403

### addTeacherService() Tests
- [ ] Teacher adds new service (HTTP 201)
- [ ] Service appears in current_services list
- [ ] Teacher tries to add duplicate service (HTTP 409)
- [ ] Invalid service_id (HTTP 422)
- [ ] Response includes service details
- [ ] Database: TeacherServices record created
- [ ] Logging: Success log appears

### uploadTeacherCertificate() Tests
- [ ] Upload PDF certificate (HTTP 201)
- [ ] Upload JPG certificate (HTTP 201)
- [ ] Upload PNG certificate (HTTP 201)
- [ ] Attempt upload without file (HTTP 422)
- [ ] Attempt upload with file > 5MB (HTTP 422)
- [ ] Attempt upload with invalid type (HTTP 422)
- [ ] File stored in storage/certificates/
- [ ] Attachment record created in database
- [ ] File accessible via public URL
- [ ] Logging: Upload log includes file size
- [ ] Invalid date format (HTTP 422)

### Integration Tests
- [ ] Teacher can add multiple services
- [ ] Teacher can upload multiple certificates
- [ ] File permissions: readable by web server
- [ ] Storage path: matches configured disk
- [ ] Database cascade: delete user → delete services + attachments

---

## API Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/teacher/get-services` | GET | ✅ Teacher | Get all services (current + available) |
| `/api/teacher/teacher-service` | POST | ✅ Teacher | Add a new service |
| `/api/teacher/teacher-upload-certificate` | POST | ✅ Teacher | Upload certificate file |

---

## Error Codes Reference

| Code | Status | Meaning |
|------|--------|---------|
| `SERVICE_ALREADY_EXISTS` | 409 | Teacher already has this service |
| `VALIDATION_FAILED` | 422 | One or more validation errors |
| `FILE_TOO_LARGE` | 422 | Certificate file exceeds 5MB |
| `INVALID_FILE_TYPE` | 422 | File is not PDF, JPG, PNG, or JPEG |
| `UPLOAD_FAILED` | 500 | Server error during upload |
| `QUERY_FAILED` | 500 | Database error |

---

## Logging

All operations are logged with teacher_id and relevant details:

**Success Logs**:
```
INFO: Teacher service added (teacher_id=5, service_id=2)
INFO: Teacher certificate uploaded (teacher_id=5, attachment_id=123, file_size=245632)
```

**Error Logs**:
```
ERROR: Failed to add teacher service (teacher_id=5, error=Exception message)
ERROR: Failed to upload certificate (teacher_id=5, error=Exception message)
```

---

## Future Enhancements

- Add certificate verification status (pending/verified/rejected)
- Add certificate expiry tracking
- Admin approval workflow for certificates
- Certificate display in teacher profile
- Delete service endpoint
- Bulk service management
- Service pricing management
- Certificate templates/types

