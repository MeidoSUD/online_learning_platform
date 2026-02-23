# Teacher Bank Account Setup Guide

## Overview
Teachers can add their bank accounts to receive payments from students. Only teachers can add bank accounts (students add payment cards instead).

---

## Quick Summary

| Feature | Details |
|---------|---------|
| **Endpoint** | `POST /api/teacher/payment-methods` |
| **Auth Required** | Yes (Teacher token) |
| **Role** | Teacher only (role_id = 3) |
| **Purpose** | Add bank account for receiving payments |

---

## 1. Add Bank Account (Create)

### Endpoint
```
POST /api/teacher/payment-methods
```

### Request Headers
```
Authorization: Bearer {teacher_sanctum_token}
Content-Type: application/json
```

### Request Body
```json
{
  "bank_id": 1,
  "account_holder_name": "Ahmed Hassan",
  "account_number": "123456789",
  "iban": "SA1234567890123456789012",
  "is_default": true
}
```

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `bank_id` | integer | Bank ID from banks list | 1 |
| `account_holder_name` | string | Account owner name | "Ahmed Hassan" |
| `account_number` | string | Bank account number | "123456789" |
| `iban` | string | IBAN number | "SA1234567890123456789012" |
| `is_default` | boolean | Set as default (optional) | true |

### Example cURL
```bash
curl -X POST "https://your-domain.com/api/teacher/payment-methods" \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bank_id": 1,
    "account_holder_name": "Ahmed Hassan",
    "account_number": "123456789",
    "iban": "SA1234567890123456789012",
    "is_default": true
  }'
```

### Example JavaScript/Fetch
```javascript
const response = await fetch('https://your-domain.com/api/teacher/payment-methods', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TEACHER_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    bank_id: 1,
    account_holder_name: 'Ahmed Hassan',
    account_number: '123456789',
    iban: 'SA1234567890123456789012',
    is_default: true
  })
});
const data = await response.json();
```

### Success Response (201)
```json
{
  "data": {
    "id": 5,
    "user_id": 10,
    "bank_id": 1,
    "account_holder_name": "Ahmed Hassan",
    "account_number": "123456789",
    "iban": "SA1234567890123456789012",
    "is_default": true,
    "created_at": "2026-02-22T10:30:00Z",
    "updated_at": "2026-02-22T10:30:00Z"
  },
  "message": "Payment method added"
}
```

### Error Response - Missing Field (422)
```json
{
  "message": "The iban field is required.",
  "errors": {
    "iban": ["The iban field is required."]
  }
}
```

### Error Response - Invalid Bank (422)
```json
{
  "message": "The selected bank_id is invalid.",
  "errors": {
    "bank_id": ["The selected bank_id is invalid."]
  }
}
```

### Error Response - Unauthorized (403)
```json
{
  "error": "Unauthorized"
}
```

---

## 2. List Bank Accounts

### Endpoint
```
GET /api/teacher/payment-methods
```

### Request Headers
```
Authorization: Bearer {teacher_sanctum_token}
```

### Example cURL
```bash
curl -X GET "https://your-domain.com/api/teacher/payment-methods" \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN"
```

### Success Response (200)
```json
{
  "data": [
    {
      "id": 5,
      "user_id": 10,
      "bank_id": 1,
      "bank": {
        "id": 1,
        "name": "Saudi National Bank",
        "code": "SAB",
        "country": "SA"
      },
      "account_holder_name": "Ahmed Hassan",
      "account_number": "123456789",
      "iban": "SA1234567890123456789012",
      "is_default": true,
      "created_at": "2026-02-22T10:30:00Z"
    },
    {
      "id": 6,
      "user_id": 10,
      "bank_id": 2,
      "bank": {
        "id": 2,
        "name": "Al Rajhi Bank",
        "code": "ARB",
        "country": "SA"
      },
      "account_holder_name": "Ahmed Hassan",
      "account_number": "987654321",
      "iban": "SA9876543210987654321098",
      "is_default": false,
      "created_at": "2026-02-22T11:15:00Z"
    }
  ]
}
```

---

## 3. Update Bank Account

### Endpoint
```
PUT /api/teacher/payment-methods/{id}
```

### Request Headers
```
Authorization: Bearer {teacher_sanctum_token}
Content-Type: application/json
```

### Request Body (any field optional)
```json
{
  "account_holder_name": "Ahmed Mohammed Hassan",
  "account_number": "999888777",
  "iban": "SA1111111111111111111111"
}
```

### Example cURL
```bash
curl -X PUT "https://your-domain.com/api/teacher/payment-methods/5" \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_holder_name": "Ahmed Mohammed Hassan"
  }'
```

### Success Response (200)
```json
{
  "data": {
    "id": 5,
    "user_id": 10,
    "bank_id": 1,
    "account_holder_name": "Ahmed Mohammed Hassan",
    "account_number": "123456789",
    "iban": "SA1234567890123456789012",
    "is_default": true,
    "updated_at": "2026-02-22T12:00:00Z"
  }
}
```

---

## 4. Set as Default Bank Account

### Endpoint
```
PUT /api/teacher/payment-methods/set-default/{id}
```

### Example cURL
```bash
curl -X PUT "https://your-domain.com/api/teacher/payment-methods/set-default/5" \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN"
```

### Success Response (200)
```json
{
  "data": {
    "id": 5,
    "is_default": true,
    "message": "Default payment method updated"
  }
}
```

---

## 5. Delete Bank Account

### Endpoint
```
DELETE /api/teacher/payment-methods/{id}
```

### Example cURL
```bash
curl -X DELETE "https://your-domain.com/api/teacher/payment-methods/5" \
  -H "Authorization: Bearer YOUR_TEACHER_TOKEN"
```

### Success Response (200)
```json
{
  "message": "Payment method deleted successfully"
}
```

### Error Response - Not Found (404)
```json
{
  "message": "Not found"
}
```

---

## Banks List

Before adding a bank account, get the available banks:

### Endpoint
```
GET /api/banks
```

### Success Response (200)
```json
{
  "data": [
    {
      "id": 1,
      "name": "Saudi National Bank",
      "code": "SNB",
      "country": "SA",
      "swift_code": "SAUBSARI"
    },
    {
      "id": 2,
      "name": "Al Rajhi Bank",
      "code": "ARB",
      "country": "SA",
      "swift_code": "RJHISARI"
    },
    {
      "id": 3,
      "name": "First Abu Dhabi Bank",
      "code": "FAB",
      "country": "AE",
      "swift_code": "NBADAEAD"
    }
  ]
}
```

---

## Complete Workflow

### Step 1: Get Banks
```bash
curl -X GET "https://your-domain.com/api/banks"
```

### Step 2: Login as Teacher
```bash
curl -X POST "https://your-domain.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123"
  }'
# Response: { "token": "1|ABC123xyz..." }
```

### Step 3: Add Bank Account
```bash
curl -X POST "https://your-domain.com/api/teacher/payment-methods" \
  -H "Authorization: Bearer 1|ABC123xyz..." \
  -H "Content-Type: application/json" \
  -d '{
    "bank_id": 1,
    "account_holder_name": "Ahmed Hassan",
    "account_number": "123456789",
    "iban": "SA1234567890123456789012",
    "is_default": true
  }'
```

### Step 4: List Bank Accounts
```bash
curl -X GET "https://your-domain.com/api/teacher/payment-methods" \
  -H "Authorization: Bearer 1|ABC123xyz..."
```

---

## Important Notes

1. **Teacher Only**: Students cannot add bank accounts (they add cards instead)
2. **IBAN Required**: Must be valid IBAN format for the selected country
3. **One Default**: Only one bank account can be marked as default
4. **Bank List**: Always fetch banks first to get valid bank_id values
5. **Security**: IBAN and account numbers are encrypted in database
6. **Withdrawal**: Teachers use default bank account for receiving payments

---

## Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Account updated, retrieved, or deleted |
| 201 | Created | Bank account added successfully |
| 403 | Unauthorized | Not a teacher or permission denied |
| 404 | Not Found | Bank account ID doesn't exist |
| 422 | Validation Error | Missing or invalid field |

---

## Quick Reference

**Add Bank Account:**
```bash
POST /api/teacher/payment-methods
{ "bank_id": 1, "account_holder_name": "Name", "account_number": "123", "iban": "SA...", "is_default": true }
```

**List Accounts:**
```bash
GET /api/teacher/payment-methods
```

**Update Account:**
```bash
PUT /api/teacher/payment-methods/{id}
{ "account_holder_name": "New Name" }
```

**Set Default:**
```bash
PUT /api/teacher/payment-methods/set-default/{id}
```

**Delete Account:**
```bash
DELETE /api/teacher/payment-methods/{id}
```

