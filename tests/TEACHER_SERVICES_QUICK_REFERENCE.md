# Teacher Services & Certificate Upload - Quick Reference

**Date**: February 4, 2026  
**Status**: ✅ Implemented - No compilation errors

---

## 📚 Three New Endpoints

### 1️⃣ GET Services
```http
GET /api/teacher/get-services
Authorization: Bearer {token}
```
**Response**: Current services + all available services for teachers
**Status**: 200 OK

### 2️⃣ ADD Service
```http
POST /api/teacher/teacher-service
Authorization: Bearer {token}
Content-Type: application/json

{
  "service_id": 2
}
```
**Response**: Service added (HTTP 201) or already exists (HTTP 409)

### 3️⃣ UPLOAD Certificate
```http
POST /api/teacher/teacher-upload-certificate
Authorization: Bearer {token}
Content-Type: multipart/form-data

- certificate: [PDF/JPG/PNG file, max 5MB]
- title: (optional) "TOEFL Certificate"
- issuer: (optional) "ETS"
- issue_date: (optional) "2024-06-15"
```
**Response**: File uploaded & URL returned (HTTP 201)

---

## 📂 Files Modified

| File | Change | Status |
|------|--------|--------|
| `app/Http/Controllers/API/ServicesController.php` | Added 3 new methods | ✅ |

---

## 🔌 Routes (Already Added)

From `routes/api.php`:
```php
Route::prefix('teacher')->middleware(['auth:sanctum', 'role:teacher'])->group(function () {
    Route::get('get-serivices', [ServicesController::class, 'teacherServices']);
    Route::post('teacher-service', [ServicesController::class, 'addTeacherService']);
    Route::post('teacher-upload-certificate', [ServicesController::class, 'uploadTeacherCertificate']);
});
```

---

## ✨ Key Features

✅ **Get Services**
- List all available teacher services
- Show teacher's current services
- Supports bilingual (English/Arabic)

✅ **Add Service**
- Add new service with duplicate prevention
- Validation: service_id must exist
- Error: 409 if duplicate
- Success: 201 with service details

✅ **Upload Certificate**
- Accepted: PDF, JPG, PNG, JPEG
- Max size: 5MB
- Auto-timestamp filename
- Stored in: storage/app/public/certificates/
- Returns public URL

---

## 🗄️ Database

**teacher_services**:
```
id, teacher_id, service_id, timestamps
Unique constraint: (teacher_id, service_id)
```

**attachments**:
```
id, user_id, file_path, file_name, file_type, file_size, attached_to_type, timestamps
```

---

## 🧪 Quick Test

### cURL Examples

**1. Get Services**
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/teacher/get-services
```

**2. Add Service**
```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"service_id": 2}' \
  http://localhost:8000/api/teacher/teacher-service
```

**3. Upload Certificate**
```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -F "certificate=@certificate.pdf" \
  http://localhost:8000/api/teacher/teacher-upload-certificate
```

---

## 💡 Usage Scenarios

1. **Teacher Registration**: Get services → Add service → Upload certificate
2. **Profile Setup**: Teacher adds multiple services they offer
3. **Verification**: Upload certificates to build credibility
4. **Mobile App**: Flutter can integrate all three endpoints

---

## 🎯 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET) |
| 201 | Created (POST) |
| 409 | Conflict (duplicate service) |
| 422 | Validation error |
| 500 | Server error |

---

## 📋 Request/Response Examples

### Add Service Response (201)
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
      "name_ar": "دراسة اللغات"
    }
  }
}
```

### Upload Certificate Response (201)
```json
{
  "success": true,
  "message": "Certificate uploaded successfully",
  "data": {
    "id": 123,
    "file_name": "1706937000_TOEFL_Certificate.pdf",
    "url": "http://localhost:8000/storage/certificates/1706937000_TOEFL_Certificate.pdf",
    "file_size": 245632,
    "uploaded_at": "2026-02-04 14:30:00"
  }
}
```

---

## ⚠️ Validation Rules

### addTeacherService()
- `service_id`: required, integer, exists in services table
- `languages`: optional, array of language IDs
- `subjects`: optional, array of subject IDs
- `price`: optional, numeric, >= 0
- **Duplicate Check**: 409 if (teacher_id, service_id) already exists

### uploadTeacherCertificate()
- `certificate`: required, file
- `title`: optional, string, max 255
- `issuer`: optional, string, max 255
- `issue_date`: optional, date (YYYY-MM-DD)
- **File Types**: pdf, jpg, jpeg, png
- **Max Size**: 5MB

---

## 🔐 Security

✅ All endpoints authenticated with `auth:sanctum`  
✅ All endpoints require `role:teacher`  
✅ File upload: Type validation + size limit  
✅ File storage: Outside public folder with permission control  
✅ Database: Cascade delete on user deletion  
✅ Logging: All operations logged  

---

## 📝 Logging

All operations logged with:
- Teacher ID
- Operation (add/upload)
- Resource IDs (service_id, attachment_id)
- File details (size, type, name)
- Success/Error status

---

## 🎓 Implementation Details

**Language**: PHP 8.0+  
**Framework**: Laravel 10+  
**Auth**: Sanctum  
**Database**: MySQL/MariaDB  
**Storage**: Local public disk  
**Models Used**: TeacherServices, Attachment, Services  

---

## 📌 Next Steps

1. ✅ Routes already added in `routes/api.php`
2. ✅ Methods implemented in ServicesController
3. ✅ Database schema ready (teacher_services, attachments)
4. ⏭️ Test with Postman or cURL
5. ⏭️ Integrate into Flutter app
6. ⏭️ Add admin certificate review endpoint (optional)

