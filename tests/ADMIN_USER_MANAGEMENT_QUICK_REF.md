# Admin User Management - Quick Reference

## Quick Endpoint List

### Authentication Required
All endpoints require: `Authorization: Bearer {sanctum_token}` header

### User Management Endpoints

| Action | Method | Endpoint | Purpose |
|--------|--------|----------|---------|
| **List Users** | GET | `/api/admin/users` | Get all users with filters |
| **Get User** | GET | `/api/admin/users/{id}` | Get single user details |
| **Create User** | POST | `/api/admin/users` | Create new user account |
| **Update User** | PUT | `/api/admin/users/{id}` | Update user information |
| **Delete User** | DELETE | `/api/admin/users/{id}` | Soft delete user |

### Teacher Management Endpoints

| Action | Method | Endpoint | Purpose |
|--------|--------|----------|---------|
| **List Teachers** | GET | `/api/admin/teachers` | Get all teachers |
| **Get Teacher** | GET | `/api/admin/teachers/{id}` | Get teacher details |
| **Verify Teacher** | PUT | `/api/admin/users/{id}/verify-teacher` | Verify/unverify teacher |

### User Action Endpoints

| Action | Method | Endpoint | Purpose |
|--------|--------|----------|---------|
| **Activate** | PUT | `/api/admin/users/{id}/activate` | Activate user account |
| **Suspend** | PUT | `/api/admin/users/{id}/suspend` | Suspend user account |
| **Reset Password** | PUT | `/api/admin/users/{id}/reset-password` | Reset user password |

---

## Common Requests

### 1. Get All Active Teachers
```bash
GET /api/admin/teachers?verified=true&is_active=true
```

### 2. Verify a Teacher
```bash
PUT /api/admin/users/5/verify-teacher
Body: { "verified": true }
```

### 3. Suspend a User
```bash
PUT /api/admin/users/10/suspend
```

### 4. Activate a User
```bash
PUT /api/admin/users/10/activate
```

### 5. Reset User Password
```bash
PUT /api/admin/users/5/reset-password
Body: { "new_password": "TempPass@123" }
```

### 6. Create New User
```bash
POST /api/admin/users
Body: {
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone_number": "+966501234567",
  "password": "Password@123",
  "role_id": 3,
  "gender": "male",
  "nationality": "Saudi Arabia"
}
```

---

## Response Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | User verified, activated, suspended |
| 201 | Created | User created successfully |
| 400 | Bad Request | Invalid request body |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | User doesn't have admin role |
| 404 | Not Found | User ID doesn't exist |
| 409 | Conflict | Email/phone already exists |
| 422 | Validation Error | Invalid input data |
| 500 | Server Error | Database or server issue |

---

## Default Response Structure

All responses follow this format:

```json
{
  "success": true/false,
  "code": "STATUS_CODE",
  "status": "success/error/invalid_input",
  "message_en": "English message",
  "message_ar": "رسالة عربية",
  "data": { /* response data */ },
  "errors": { /* validation errors */ }
}
```

---

## Role IDs Reference

| Role ID | Role Name | Permissions |
|---------|-----------|-------------|
| 1 | Admin | Full access to all endpoints |
| 3 | Teacher | Can create courses, manage availability |
| 4 | Student | Can enroll in courses, book sessions |

---

## Important Notes

1. **Soft Delete**: DELETE endpoint performs soft delete (user data preserved)
2. **Email/Phone Unique**: Both email and phone number must be unique
3. **Password Requirements**: Minimum 8 characters
4. **Verification**: Teachers must be verified to appear in student listings
5. **Suspension**: Suspended users cannot log in
6. **Token**: Store token securely, never expose in logs

---

## For Complete Details

See: `ADMIN_USER_MANAGEMENT_GUIDE.md` for full API documentation with:
- Detailed request/response examples
- Query parameters
- Error scenarios
- Complete workflows
- Postman setup instructions

