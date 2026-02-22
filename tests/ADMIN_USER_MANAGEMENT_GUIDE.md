# Admin User Management API Guide

## Overview

This guide provides comprehensive documentation for admin endpoints to manage users, verify teachers, activate/deactivate users, and delete users. All admin endpoints require authentication with `admin` role and use Sanctum token-based authentication.

---

## Authentication

All admin endpoints require:
- **Header**: `Authorization: Bearer {sanctum_token}`
- **Role**: Admin (role_id = 1 or equivalent admin role)
- **Middleware**: `auth:sanctum`, `role:admin`

---

## Base URL

```
https://your-domain.com/api/admin
```

---

## Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users` | List all users with filters | ✅ |
| GET | `/users/{id}` | Get user details | ✅ |
| POST | `/users` | Create new user | ✅ |
| PUT | `/users/{id}` | Update user information | ✅ |
| DELETE | `/users/{id}` | Delete/soft delete user | ✅ |
| GET | `/teachers` | List all teachers | ✅ |
| GET | `/teachers/{id}` | Get teacher details | ✅ |
| PUT | `/users/{id}/reset-password` | Reset user password | ✅ |
| PUT | `/users/{id}/verify-teacher` | Verify/unverify teacher | ✅ |
| PUT | `/users/{id}/suspend` | Suspend user account | ✅ |
| PUT | `/users/{id}/activate` | Activate user account | ✅ |

---

## 1. List All Users

### Endpoint
```
GET /api/admin/users
```

### Authentication
```
Header: Authorization: Bearer {sanctum_token}
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `role_id` | integer | No | Filter by role (1=admin, 3=teacher, 4=student) |
| `verified` | boolean | No | Filter by verification status |
| `is_active` | boolean | No | Filter by active status |
| `search` | string | No | Search by name, email, or phone |
| `page` | integer | No | Pagination page (default: 1) |
| `per_page` | integer | No | Items per page (default: 15) |

### Example Request

**cURL:**
```bash
curl -X GET "https://your-domain.com/api/admin/users?role_id=3&is_active=true&page=1" \
  -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Content-Type: application/json"
```

**JavaScript/Fetch:**
```javascript
const response = await fetch('https://your-domain.com/api/admin/users?role_id=3&is_active=true', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_SANCTUM_TOKEN',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

**PHP/Laravel:**
```php
$response = Http::withToken('YOUR_SANCTUM_TOKEN')
  ->get('https://your-domain.com/api/admin/users', [
    'role_id' => 3,
    'is_active' => true,
  ]);
$data = $response->json();
```

### Response (200 OK)

```json
{
  "success": true,
  "code": "USERS_LISTED",
  "status": "success",
  "message_en": "Users retrieved successfully",
  "message_ar": "تم استرجاع المستخدمين بنجاح",
  "data": {
    "total": 156,
    "per_page": 15,
    "current_page": 1,
    "last_page": 11,
    "users": [
      {
        "id": 1,
        "first_name": "Ahmed",
        "last_name": "Hassan",
        "email": "ahmed@example.com",
        "phone_number": "+966501234567",
        "role_id": 3,
        "role_name": "teacher",
        "gender": "male",
        "nationality": "Saudi Arabia",
        "verified": true,
        "is_active": true,
        "created_at": "2024-01-15 10:30:00",
        "updated_at": "2024-02-20 15:45:00"
      },
      {
        "id": 2,
        "first_name": "Fatima",
        "last_name": "Mohammed",
        "email": "fatima@example.com",
        "phone_number": "+966502234567",
        "role_id": 4,
        "role_name": "student",
        "gender": "female",
        "nationality": "UAE",
        "verified": false,
        "is_active": true,
        "created_at": "2024-01-20 14:20:00",
        "updated_at": "2024-02-18 09:10:00"
      }
    ]
  }
}
```

### Error Response (500)

```json
{
  "success": false,
  "code": "ERROR_LISTING_USERS",
  "status": "error",
  "message_en": "Error retrieving users",
  "message_ar": "خطأ في استرجاع المستخدمين"
}
```

---

## 2. Get Single User Details

### Endpoint
```
GET /api/admin/users/{id}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | User ID |

### Example Request

**cURL:**
```bash
curl -X GET "https://your-domain.com/api/admin/users/5" \
  -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Content-Type: application/json"
```

**JavaScript:**
```javascript
const userId = 5;
const response = await fetch(`https://your-domain.com/api/admin/users/${userId}`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_SANCTUM_TOKEN',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "success": true,
  "code": "USER_RETRIEVED",
  "status": "success",
  "message_en": "User retrieved successfully",
  "message_ar": "تم استرجاع بيانات المستخدم بنجاح",
  "data": {
    "user": {
      "id": 5,
      "first_name": "Ali",
      "last_name": "Ahmed",
      "email": "ali@example.com",
      "phone_number": "+966503334567",
      "role_id": 3,
      "role_name": "teacher",
      "gender": "male",
      "nationality": "Saudi Arabia",
      "verified": true,
      "is_active": true,
      "verification_code": null,
      "created_at": "2024-01-15 10:30:00",
      "updated_at": "2024-02-20 15:45:00"
    }
  }
}
```

### Error Response (404)

```json
{
  "success": false,
  "code": "USER_NOT_FOUND",
  "status": "not_found",
  "message_en": "User not found",
  "message_ar": "المستخدم غير موجود"
}
```

---

## 3. Create New User

### Endpoint
```
POST /api/admin/users
```

### Request Body

```json
{
  "first_name": "Mohammed",
  "last_name": "Hassan",
  "email": "mohammed@example.com",
  "phone_number": "+966504444567",
  "password": "SecurePassword123",
  "role_id": 3,
  "gender": "male",
  "nationality": "Saudi Arabia"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `first_name` | string | Yes | User first name (max 255) |
| `last_name` | string | Yes | User last name (max 255) |
| `email` | string | Yes | Valid email address (must be unique) |
| `phone_number` | string | Yes | Phone number (must be unique) |
| `password` | string | Yes | Password (min 8 characters) |
| `role_id` | integer | Yes | Role ID (1=admin, 3=teacher, 4=student) |
| `gender` | string | No | Gender (male/female/other) |
| `nationality` | string | No | Nationality |

### Example Request

**cURL:**
```bash
curl -X POST "https://your-domain.com/api/admin/users" \
  -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Mohammed",
    "last_name": "Hassan",
    "email": "mohammed@example.com",
    "phone_number": "+966504444567",
    "password": "SecurePassword123",
    "role_id": 3,
    "gender": "male",
    "nationality": "Saudi Arabia"
  }'
```

**JavaScript:**
```javascript
const response = await fetch('https://your-domain.com/api/admin/users', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_SANCTUM_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    first_name: 'Mohammed',
    last_name: 'Hassan',
    email: 'mohammed@example.com',
    phone_number: '+966504444567',
    password: 'SecurePassword123',
    role_id: 3,
    gender: 'male',
    nationality: 'Saudi Arabia'
  })
});
const data = await response.json();
```

### Response (201 Created)

```json
{
  "success": true,
  "code": "USER_CREATED",
  "status": "success",
  "message_en": "User created successfully",
  "message_ar": "تم إنشاء المستخدم بنجاح",
  "data": {
    "user": {
      "id": 157,
      "first_name": "Mohammed",
      "last_name": "Hassan",
      "email": "mohammed@example.com",
      "phone_number": "+966504444567",
      "role_id": 3,
      "role_name": "teacher",
      "gender": "male",
      "nationality": "Saudi Arabia",
      "verified": false,
      "is_active": true,
      "created_at": "2024-02-22 10:30:00"
    }
  }
}
```

### Error Response (409 - Email Exists)

```json
{
  "success": false,
  "code": "EMAIL_ALREADY_EXISTS",
  "status": "conflict",
  "message_en": "Email already exists",
  "message_ar": "البريد الإلكتروني موجود بالفعل",
  "field": "email"
}
```

### Error Response (422 - Validation Error)

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "status": "invalid_input",
  "message_en": "Validation failed",
  "message_ar": "فشل التحقق من البيانات",
  "errors": {
    "password": ["The password field must be at least 8 characters."],
    "email": ["The email field must be a valid email."]
  }
}
```

---

## 4. Update User Information

### Endpoint
```
PUT /api/admin/users/{id}
```

### Request Body

```json
{
  "first_name": "Ahmed",
  "last_name": "Mohammad",
  "email": "ahmed.new@example.com",
  "phone_number": "+966501111111",
  "gender": "male",
  "nationality": "Kuwait"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `first_name` | string | No | Update first name |
| `last_name` | string | No | Update last name |
| `email` | string | No | Update email (must be unique) |
| `phone_number` | string | No | Update phone (must be unique) |
| `gender` | string | No | Update gender |
| `nationality` | string | No | Update nationality |

### Example Request

**cURL:**
```bash
curl -X PUT "https://your-domain.com/api/admin/users/5" \
  -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Ahmed",
    "email": "ahmed.new@example.com",
    "nationality": "Kuwait"
  }'
```

**JavaScript:**
```javascript
const userId = 5;
const response = await fetch(`https://your-domain.com/api/admin/users/${userId}`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_SANCTUM_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    first_name: 'Ahmed',
    email: 'ahmed.new@example.com',
    nationality: 'Kuwait'
  })
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "success": true,
  "code": "USER_UPDATED",
  "status": "success",
  "message_en": "User updated successfully",
  "message_ar": "تم تحديث بيانات المستخدم بنجاح",
  "data": {
    "user": {
      "id": 5,
      "first_name": "Ahmed",
      "last_name": "Ahmed",
      "email": "ahmed.new@example.com",
      "phone_number": "+966503334567",
      "role_id": 3,
      "gender": "male",
      "nationality": "Kuwait",
      "verified": true,
      "is_active": true,
      "updated_at": "2024-02-22 11:15:00"
    }
  }
}
```

---

## 5. Delete User

### Endpoint
```
DELETE /api/admin/users/{id}
```

### Description
Performs soft delete of user record. The user account is marked as deleted but can be restored if needed.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | User ID to delete |

### Example Request

**cURL:**
```bash
curl -X DELETE "https://your-domain.com/api/admin/users/5" \
  -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Content-Type: application/json"
```

**JavaScript:**
```javascript
const userId = 5;
const response = await fetch(`https://your-domain.com/api/admin/users/${userId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_SANCTUM_TOKEN',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "success": true,
  "code": "USER_DELETED",
  "status": "success",
  "message_en": "User deleted successfully",
  "message_ar": "تم حذف المستخدم بنجاح"
}
```

### Error Response (404)

```json
{
  "success": false,
  "code": "USER_NOT_FOUND",
  "status": "not_found",
  "message_en": "User not found",
  "message_ar": "المستخدم غير موجود"
}
```

---

## 6. Verify Teacher

### Endpoint
```
PUT /api/admin/users/{id}/verify-teacher
```

### Description
Verify or unverify a teacher account. Teachers must be verified to be visible to students and offer services.

### Request Body

```json
{
  "verified": true
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `verified` | boolean | Yes | Verification status (true/false) |

### Example Request

**cURL:**
```bash
curl -X PUT "https://your-domain.com/api/admin/users/5/verify-teacher" \
  -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "verified": true
  }'
```

**JavaScript:**
```javascript
const userId = 5;
const response = await fetch(`https://your-domain.com/api/admin/users/${userId}/verify-teacher`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_SANCTUM_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    verified: true
  })
});
const data = await response.json();
```

**PHP:**
```php
$response = Http::withToken('YOUR_SANCTUM_TOKEN')
  ->put("https://your-domain.com/api/admin/users/5/verify-teacher", [
    'verified' => true
  ]);
$data = $response->json();
```

### Response (200 OK)

```json
{
  "success": true,
  "code": "TEACHER_VERIFIED",
  "status": "success",
  "message_en": "Teacher verified successfully",
  "message_ar": "تم التحقق من المعلم بنجاح",
  "data": {
    "user": {
      "id": 5,
      "first_name": "Ali",
      "last_name": "Ahmed",
      "email": "ali@example.com",
      "role_id": 3,
      "verified": true,
      "is_active": true,
      "updated_at": "2024-02-22 11:30:00"
    }
  }
}
```

### Error Response (404)

```json
{
  "success": false,
  "code": "USER_NOT_FOUND",
  "status": "not_found",
  "message_en": "User not found",
  "message_ar": "المستخدم غير موجود"
}
```

### Error Response (400 - Not a Teacher)

```json
{
  "success": false,
  "code": "NOT_A_TEACHER",
  "status": "invalid",
  "message_en": "User is not a teacher",
  "message_ar": "المستخدم ليس معلماً"
}
```

---

## 7. Activate User

### Endpoint
```
PUT /api/admin/users/{id}/activate
```

### Description
Activate a suspended or inactive user account. Once activated, the user can log in and use the platform.

### Example Request

**cURL:**
```bash
curl -X PUT "https://your-domain.com/api/admin/users/5/activate" \
  -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Content-Type: application/json"
```

**JavaScript:**
```javascript
const userId = 5;
const response = await fetch(`https://your-domain.com/api/admin/users/${userId}/activate`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_SANCTUM_TOKEN',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "success": true,
  "code": "USER_ACTIVATED",
  "status": "success",
  "message_en": "User activated successfully",
  "message_ar": "تم تفعيل المستخدم بنجاح",
  "data": {
    "user": {
      "id": 5,
      "first_name": "Ali",
      "last_name": "Ahmed",
      "email": "ali@example.com",
      "is_active": true,
      "updated_at": "2024-02-22 11:45:00"
    }
  }
}
```

---

## 8. Suspend User

### Endpoint
```
PUT /api/admin/users/{id}/suspend
```

### Description
Suspend a user account. Suspended users cannot log in or access the platform. Can be reactivated using the activate endpoint.

### Example Request

**cURL:**
```bash
curl -X PUT "https://your-domain.com/api/admin/users/5/suspend" \
  -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Content-Type: application/json"
```

**JavaScript:**
```javascript
const userId = 5;
const response = await fetch(`https://your-domain.com/api/admin/users/${userId}/suspend`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_SANCTUM_TOKEN',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "success": true,
  "code": "USER_SUSPENDED",
  "status": "success",
  "message_en": "User suspended successfully",
  "message_ar": "تم إيقاف المستخدم بنجاح",
  "data": {
    "user": {
      "id": 5,
      "first_name": "Ali",
      "last_name": "Ahmed",
      "email": "ali@example.com",
      "is_active": false,
      "updated_at": "2024-02-22 12:00:00"
    }
  }
}
```

---

## 9. Reset User Password

### Endpoint
```
PUT /api/admin/users/{id}/reset-password
```

### Description
Reset a user's password to a temporary password. User will be forced to change it on next login.

### Request Body

```json
{
  "new_password": "TempPassword@123"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `new_password` | string | Yes | New temporary password (min 8 chars) |

### Example Request

**cURL:**
```bash
curl -X PUT "https://your-domain.com/api/admin/users/5/reset-password" \
  -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "new_password": "TempPassword@123"
  }'
```

**JavaScript:**
```javascript
const userId = 5;
const response = await fetch(`https://your-domain.com/api/admin/users/${userId}/reset-password`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_SANCTUM_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    new_password: 'TempPassword@123'
  })
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "success": true,
  "code": "PASSWORD_RESET",
  "status": "success",
  "message_en": "Password reset successfully",
  "message_ar": "تم إعادة تعيين كلمة المرور بنجاح",
  "data": {
    "user": {
      "id": 5,
      "first_name": "Ali",
      "email": "ali@example.com",
      "message": "Temporary password: TempPassword@123"
    }
  }
}
```

### Error Response (422)

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "status": "invalid_input",
  "message_en": "Validation failed",
  "message_ar": "فشل التحقق من البيانات",
  "errors": {
    "new_password": ["The password field must be at least 8 characters."]
  }
}
```

---

## 10. List Teachers

### Endpoint
```
GET /api/admin/teachers
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `verified` | boolean | No | Filter by verification status |
| `is_active` | boolean | No | Filter by active status |
| `search` | string | No | Search by name or email |
| `page` | integer | No | Pagination page |

### Example Request

**cURL:**
```bash
curl -X GET "https://your-domain.com/api/admin/teachers?verified=true&is_active=true" \
  -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Content-Type: application/json"
```

### Response (200 OK)

```json
{
  "success": true,
  "code": "TEACHERS_LISTED",
  "status": "success",
  "message_en": "Teachers retrieved successfully",
  "message_ar": "تم استرجاع قائمة المعلمين بنجاح",
  "data": {
    "total": 45,
    "per_page": 15,
    "current_page": 1,
    "teachers": [
      {
        "id": 3,
        "first_name": "Ahmed",
        "last_name": "Hassan",
        "email": "ahmed@example.com",
        "phone_number": "+966501234567",
        "verified": true,
        "is_active": true,
        "services_count": 2,
        "students_count": 15,
        "rating": 4.8,
        "created_at": "2024-01-15 10:30:00"
      }
    ]
  }
}
```

---

## 11. Get Teacher Details

### Endpoint
```
GET /api/admin/teachers/{id}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Teacher/User ID |

### Example Request

**cURL:**
```bash
curl -X GET "https://your-domain.com/api/admin/teachers/3" \
  -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Content-Type: application/json"
```

### Response (200 OK)

```json
{
  "success": true,
  "code": "TEACHER_RETRIEVED",
  "status": "success",
  "message_en": "Teacher retrieved successfully",
  "message_ar": "تم استرجاع بيانات المعلم بنجاح",
  "data": {
    "teacher": {
      "id": 3,
      "first_name": "Ahmed",
      "last_name": "Hassan",
      "email": "ahmed@example.com",
      "phone_number": "+966501234567",
      "gender": "male",
      "nationality": "Saudi Arabia",
      "verified": true,
      "is_active": true,
      "bio": "Experienced English teacher",
      "services": [1, 2],
      "students_count": 15,
      "courses_count": 3,
      "rating": 4.8,
      "reviews_count": 12,
      "created_at": "2024-01-15 10:30:00"
    }
  }
}
```

---

## Common Error Responses

### 401 Unauthorized

```json
{
  "message": "Unauthenticated",
  "code": "UNAUTHENTICATED"
}
```

**Solution**: Ensure you're sending valid Sanctum token in Authorization header

### 403 Forbidden

```json
{
  "message": "This action is unauthorized",
  "code": "FORBIDDEN"
}
```

**Solution**: Ensure user has admin role

### 404 Not Found

```json
{
  "success": false,
  "code": "RESOURCE_NOT_FOUND",
  "message_en": "Resource not found",
  "message_ar": "المورد غير موجود"
}
```

---

## Complete Workflow Example

### 1. Admin Logs In
```bash
curl -X POST "https://your-domain.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPassword123"
  }'
```

**Response:**
```json
{
  "token": "1|ABC123xyz...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "role_id": 1,
    "role_name": "admin"
  }
}
```

### 2. List All Teachers
```bash
curl -X GET "https://your-domain.com/api/admin/teachers?verified=false" \
  -H "Authorization: Bearer 1|ABC123xyz..." \
  -H "Content-Type: application/json"
```

### 3. Verify a Teacher
```bash
curl -X PUT "https://your-domain.com/api/admin/users/5/verify-teacher" \
  -H "Authorization: Bearer 1|ABC123xyz..." \
  -H "Content-Type: application/json" \
  -d '{
    "verified": true
  }'
```

### 4. Suspend User (If Needed)
```bash
curl -X PUT "https://your-domain.com/api/admin/users/10/suspend" \
  -H "Authorization: Bearer 1|ABC123xyz..." \
  -H "Content-Type: application/json"
```

### 5. Reactivate User
```bash
curl -X PUT "https://your-domain.com/api/admin/users/10/activate" \
  -H "Authorization: Bearer 1|ABC123xyz..." \
  -H "Content-Type: application/json"
```

---

## Best Practices

1. **Always verify authentication**: Ensure Sanctum token is valid before making requests
2. **Pagination**: Always use pagination when listing large numbers of users
3. **Search efficiently**: Use search parameter to find specific users instead of listing all
4. **Preserve data**: Use soft delete (deactivate) instead of hard delete when possible
5. **Verify before promotion**: Always check teacher credentials before verification
6. **Audit logging**: Log all admin actions for compliance and security
7. **Rate limiting**: Consider implementing rate limiting to prevent abuse

---

## Testing with Postman

1. **Set up Environment Variables:**
   - `baseUrl`: https://your-domain.com/api
   - `adminToken`: Your Sanctum admin token
   - `userId`: 5 (example user ID)

2. **Create Postman Collection** with these requests:
   - GET {{baseUrl}}/admin/users?page=1
   - GET {{baseUrl}}/admin/users/{{userId}}
   - PUT {{baseUrl}}/admin/users/{{userId}}/verify-teacher
   - PUT {{baseUrl}}/admin/users/{{userId}}/activate
   - PUT {{baseUrl}}/admin/users/{{userId}}/suspend

3. **Add Authorization Header to all requests:**
   - Type: Bearer Token
   - Token: {{adminToken}}

---

## Support

For additional help or issues:
1. Check logs: `storage/logs/laravel.log`
2. Review middleware: Ensure `auth:sanctum` and `role:admin` are applied
3. Validate inputs: Check validation messages in error responses
4. Test endpoints: Use provided cURL examples to test locally

