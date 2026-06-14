# Terms, Conditions & Privacy Policy Management — Admin API Guide

## Overview

The admin can manage three types of legal documents:
- `terms` — Terms of Service / Terms & Conditions
- `conditions` — Additional conditions / rules
- `privacy_policy` — Privacy Policy

Each entry supports **Arabic + English** content, version tracking, role-specific targeting, and soft deletes.

---

## Base URL

```
POST /api/admin/terms-conditions
GET  /api/admin/terms-conditions
GET  /api/admin/terms-conditions/{id}
PUT  /api/admin/terms-conditions/{id}
DELETE /api/admin/terms-conditions/{id}
DELETE /api/admin/terms-conditions/{id}/force
POST /api/admin/terms-conditions/{id}/restore
GET  /api/admin/terms-conditions/type/{type}
```

**Headers (all requests):**
```
Authorization: Bearer <admin_token>
Accept: application/json
```

---

## 1. Create Terms & Conditions (POST)

### Endpoint
```
POST /api/admin/terms-conditions
```

### JSON Body

#### Example 1 — Privacy Policy (English + Arabic)

```json
{
    "title_en": "Privacy Policy",
    "title_ar": "سياسة الخصوصية",
    "content_en": "We collect your personal data to provide and improve our services. Your data will not be shared with third parties without your consent.",
    "content_ar": "نقوم بجمع بياناتك الشخصية لتقديم وتحسين خدماتنا. لن تتم مشاركة بياناتك مع أطراف ثالثة دون موافقتك.",
    "type": "privacy_policy",
    "status": 1
}
```

#### Example 2 — Terms of Service

```json
{
    "title_en": "Terms of Service",
    "title_ar": "شروط الخدمة",
    "content_en": "By using this platform, you agree to the following terms and conditions. You must be at least 18 years old to register.",
    "content_ar": "باستخدام هذه المنصة، فإنك توافق على الشروط والأحكام التالية. يجب أن يكون عمرك 18 عامًا على الأقل للتسجيل.",
    "type": "terms",
    "status": 1
}
```

#### Example 3 — Conditions (with role targeting + explicit version)

```json
{
    "title_en": "Teacher Conditions",
    "title_ar": "شروط المعلم",
    "content_en": "Teachers must maintain a completion rate above 80%. Failure to do so may result in account suspension.",
    "content_ar": "يجب على المعلمين الحفاظ على نسبة إنجاز تزيد عن 80٪. قد يؤدي عدم القيام بذلك إلى تعليق الحساب.",
    "type": "conditions",
    "role_id": 2,
    "version": 1,
    "status": 1
}
```

### Validation Rules

| Field | Required | Rules |
|-------|----------|-------|
| `title_en` | Yes | string, max:255 |
| `title_ar` | Yes | string, max:255 |
| `content_en` | Yes | string |
| `content_ar` | Yes | string |
| `type` | Yes | in: `terms`, `conditions`, `privacy_policy` |
| `status` | Yes | boolean (1 or 0) |
| `role_id` | No | nullable, must exist in `roles` table |
| `version` | No | integer, min:1 (auto-incremented if omitted) |

### Success Response (201 Created)

```json
{
    "success": true,
    "message": "Terms and conditions created successfully",
    "data": {
        "id": 1,
        "title_en": "Privacy Policy",
        "title_ar": "سياسة الخصوصية",
        "content_en": "We collect your personal data...",
        "content_ar": "نقوم بجمع بياناتك الشخصية...",
        "type": "privacy_policy",
        "role_id": null,
        "version": 1,
        "status": true,
        "is_deleted": false,
        "created_at": "2026-06-08T10:00:00.000000Z",
        "updated_at": "2026-06-08T10:00:00.000000Z",
        "deleted_at": null
    }
}
```

### Error Response (422 Validation)

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "title_en": ["The title en field is required."],
        "type": ["The selected type is invalid."]
    }
}
```

---

## 2. List All (GET)

### Endpoint
```
GET /api/admin/terms-conditions
```

### Optional Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `status` | boolean | Filter by active (1) / inactive (0) |
| `type` | string | Filter by type: `terms`, `conditions`, `privacy_policy` |
| `role_id` | integer | Filter by role ID |
| `version` | integer | Filter by specific version |
| `include_deleted` | boolean | Include soft-deleted records (1) |

### Example Requests

```
GET /api/admin/terms-conditions
GET /api/admin/terms-conditions?type=privacy_policy
GET /api/admin/terms-conditions?status=1
GET /api/admin/terms-conditions?type=terms&status=1
GET /api/admin/terms-conditions?include_deleted=1
```

### Success Response

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "title_en": "Privacy Policy",
            "title_ar": "سياسة الخصوصية",
            "content_en": "We collect your personal data...",
            "content_ar": "نقوم بجمع بياناتك الشخصية...",
            "type": "privacy_policy",
            "role_id": null,
            "version": 1,
            "status": true,
            "is_deleted": false,
            "created_at": "2026-06-08T10:00:00.000000Z",
            "updated_at": "2026-06-08T10:00:00.000000Z",
            "deleted_at": null
        },
        {
            "id": 2,
            "title_en": "Terms of Service",
            "title_ar": "شروط الخدمة",
            "content_en": "By using this platform...",
            "content_ar": "باستخدام هذه المنصة...",
            "type": "terms",
            "role_id": null,
            "version": 1,
            "status": true,
            "is_deleted": false,
            "created_at": "2026-06-08T10:05:00.000000Z",
            "updated_at": "2026-06-08T10:05:00.000000Z",
            "deleted_at": null
        }
    ],
    "total": 2
}
```

---

## 3. Get Single Record (GET)

```
GET /api/admin/terms-conditions/1
```

### Success Response

```json
{
    "success": true,
    "data": {
        "id": 1,
        "title_en": "Privacy Policy",
        "title_ar": "سياسة الخصوصية",
        "content_en": "We collect your personal data...",
        "content_ar": "نقوم بجمع بياناتك الشخصية...",
        "type": "privacy_policy",
        "role_id": null,
        "version": 1,
        "status": true,
        "is_deleted": false,
        "created_at": "2026-06-08T10:00:00.000000Z",
        "updated_at": "2026-06-08T10:00:00.000000Z",
        "deleted_at": null
    }
}
```

---

## 4. Get Latest Active by Type (GET)

```
GET /api/admin/terms-conditions/type/privacy_policy
GET /api/admin/terms-conditions/type/terms
GET /api/admin/terms-conditions/type/conditions
```

### Success Response

Same format as single record. Returns the latest **active** version of the given type.

---

## 5. Update (PUT)

```
PUT /api/admin/terms-conditions/1
```

### JSON Body (partial update allowed)

```json
{
    "title_en": "Updated Privacy Policy",
    "content_en": "Updated content...",
    "status": 0
}
```

### Success Response

```json
{
    "success": true,
    "message": "Terms and conditions updated successfully",
    "data": {
        "id": 1,
        "title_en": "Updated Privacy Policy",
        "title_ar": "سياسة الخصوصية",
        "content_en": "Updated content...",
        "content_ar": "نقوم بجمع بياناتك الشخصية...",
        "type": "privacy_policy",
        "role_id": null,
        "version": 1,
        "status": false,
        ...
    }
}
```

---

## 6. Soft Delete (DELETE)

```
DELETE /api/admin/terms-conditions/1
```

### Response

```json
{
    "success": true,
    "message": "Terms and conditions deleted successfully"
}
```

---

## 7. Restore (POST)

```
POST /api/admin/terms-conditions/1/restore
```

### Response

```json
{
    "success": true,
    "message": "Terms and conditions restored successfully",
    "data": { ... }
}
```

---

## 8. Force Delete (DELETE)

```
DELETE /api/admin/terms-conditions/1/force
```

### Response

```json
{
    "success": true,
    "message": "Terms and conditions permanently deleted"
}
```

---

## Key Business Rules

1. **Version auto-increment**: If `version` is not provided, the system auto-increments from the latest version of the same `type` + `role_id`.
2. **Only one active per type**: When a record is created/updated with `status: 1`, all other records of the same `type` (and `role_id`) are automatically set to `status: 0`.
3. **Public endpoint assumption**: The mobile app should call `/api/admin/terms-conditions/type/{type}` (or a dedicated public route if the app creates one) to fetch the latest active version to display to users.
4. **Soft deletes**: Records are soft-deleted by default. Use `force` to permanently remove.
5. **Bilingual content**: Both English and Arabic fields are required on create. Use the `title` and `content` legacy fields only if your frontend still depends on them.

---

## Quick Postman Test Sequence

1. **Add Privacy Policy**
   - `POST /api/admin/terms-conditions`
   - Body (raw JSON): Example 1 above
   - Expected: 201

2. **Add Terms of Service**
   - `POST /api/admin/terms-conditions`
   - Body (raw JSON): Example 2 above
   - Expected: 201

3. **List All**
   - `GET /api/admin/terms-conditions`
   - Expected: 200, array of 2 items

4. **Get by Type**
   - `GET /api/admin/terms-conditions/type/privacy_policy`
   - Expected: 200, returns the privacy policy

5. **Update**
   - `PUT /api/admin/terms-conditions/1`
   - Body: `{ "status": 0 }`
   - Expected: 200

6. **Verify**
   - `GET /api/admin/terms-conditions?type=privacy_policy`
   - Expected: privacy_policy now has `status: false`
