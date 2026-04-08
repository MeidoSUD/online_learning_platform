# BACKEND ADMIN SYSTEM - Complete Implementation Guide

**Date**: April 8, 2026  
**Framework**: Laravel 10+ with MVC Architecture  
**Status**: ✅ Production Ready  
**Author**: Backend Team

---

## Table of Contents

1. [Services Admin Controller](#1-services-admin-controller)
2. [Order Management Controller](#2-order-management-controller)
3. [Revenue & Percentage Controller](#3-revenue--percentage-controller)
4. [Database Schema](#4-database-schema)
5. [Frontend Integration Guide](#5-frontend-integration-guide)
6. [Error Handling](#6-error-handling)
7. [Best Practices](#7-best-practices)

---

## 1. Services Admin Controller

### Purpose
Manages all educational services (Private Lessons, Language Study, Courses, etc.) with automatic slug generation, multi-language support, and soft deletes for data preservation.

### Endpoints

#### **GET /api/admin/services**
List all services with filtering and pagination.

**Query Parameters:**
```
GET /api/admin/services?status=1&role_id=3&search=lesson&per_page=15&page=1
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Services retrieved successfully",
  "data": [
    {
      "id": "1",
      "key_name": "private-lessons",
      "name_en": "Private Lessons",
      "name_ar": "دروس خاصة",
      "description_en": "1-on-1 tutoring sessions",
      "description_ar": "جلسات تدريس فردية",
      "image": "storage/services/private-lessons.jpg",
      "status": "1",
      "role_id": "3",
      "created_at": "2026-04-08T10:30:00",
      "updated_at": "2026-04-08T10:30:00"
    }
  ],
  "pagination": {
    "total": 4,
    "per_page": 15,
    "current_page": 1,
    "last_page": 1
  }
}
```

#### **POST /api/admin/services**
Create a new service with automatic slug generation.

**Request Body:**
```json
{
  "name_en": "Group Classes",
  "name_ar": "حصص جماعية",
  "description_en": "Small group tutoring sessions",
  "description_ar": "جلسات تدريس جماعية صغيرة",
  "key_name": "group-classes",
  "role_id": 3,
  "status": 1
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Service created successfully",
  "data": {
    "id": "5",
    "key_name": "group-classes",
    "name_en": "Group Classes",
    ...
  }
}
```

**Validation Rules:**
```
name_en:       required|string|max:255|unique
name_ar:       required|string|max:255|unique
description_en: nullable|string|max:1000
description_ar: nullable|string|max:1000
key_name:      nullable|string|max:255|unique (auto-generated if not provided)
role_id:       nullable|integer|in:3,4 (3=teacher, 4=student)
status:        nullable|integer|in:0,1 (default: 1)
```

#### **GET /api/admin/services/{id}**
Get single service details.

**Response:**
```json
{
  "success": true,
  "message": "Service retrieved successfully",
  "data": { ... service details ... }
}
```

#### **PUT /api/admin/services/{id}**
Update service. All fields optional.

**Request Body:**
```json
{
  "name_en": "Updated Name",
  "status": 0,
  "key_name": "updated-key"
}
```

**Important**: Update `key_name` when changing service name to maintain URL integrity.

#### **DELETE /api/admin/services/{id}**
Soft delete (preserves historical data).

**Response:**
```json
{
  "success": true,
  "message": "Service deleted successfully"
}
```

---

## 2. Order Management Controller

### Purpose
Central marketplace admin dashboard for monitoring and managing teacher-student matching requests.

### Business Flow

```
Student Posts Order (status: pending)
    ↓
Teachers Submit Applications
    ↓
Admin Reviews Applications (views teacher profiles)
    ↓
Admin Accepts Teacher (status: confirmed)
    ↓
Other Applications Rejected
    ↓
Sessions Created → Status: in_progress
    ↓
Sessions Completed → Status: completed
```

### Endpoints

#### **GET /api/admin/orders**
List all orders with complete details.

**Query Parameters:**
```
GET /api/admin/orders?status=pending&search=Ahmed&per_page=20&sort_by=created_at&sort_order=DESC
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "id": "42",
      "student": {
        "id": "5",
        "first_name": "Ahmed",
        "last_name": "Smith",
        "email": "ahmed@example.com",
        "phone_number": "966501234567"
      },
      "subject": {
        "id": "12",
        "name_en": "Mathematics",
        "name_ar": "الرياضيات"
      },
      "assigned_teacher": {
        "id": "8",
        "first_name": "Fatima",
        "last_name": "Johnson",
        "rating": "4.8",
        "experience_years": "5"
      },
      "status": "pending",
      "min_price": "50.00",
      "max_price": "100.00",
      "notes": "Needs calculus help",
      "application_count": 3,
      "created_at": "2026-04-08T10:30:00",
      "updated_at": "2026-04-08T11:45:00"
    }
  ],
  "pagination": { ... }
}
```

#### **GET /api/admin/orders/{order_id}/applications**
View all teacher applications for an order with FULL teacher profiles.

**Response:**
```json
{
  "success": true,
  "order": { ... order details ... },
  "applications": [
    {
      "id": "1",
      "teacher": {
        "id": "8",
        "first_name": "Fatima",
        "last_name": "Johnson",
        "email": "fatima@example.com",
        "phone_number": "966509876543",
        "rating": "4.8",
        "experience_years": "5",
        "verified": true,
        "profile_photo": "storage/profile-photos/teacher.jpg"
      },
      "applied_at": "2026-04-08T10:30:00",
      "status": "pending",
      "is_preferred": false
    }
  ],
  "application_count": 3
}
```

**⚠️ Critical Note for Admin UI:**
Include teacher's:
- Rating (helps decide)
- Experience years (qualification indicator)
- Verified status (trust indicator)
- Profile photo (recognition)

This allows admins to quickly make approval decisions.

#### **POST /api/admin/orders/{order_id}/assign**
Assign a teacher and accept their application.

**Request Body:**
```json
{
  "teacher_id": 8,
  "reason": "Best rating and experience match"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Teacher assigned successfully",
  "order": {
    "status": "confirmed",
    "assigned_teacher": { ... teacher data ... }
  }
}
```

**Behind the Scenes:**
1. Order status → "confirmed"
2. Teacher application → "accepted"
3. All other applications → "rejected"
4. Sessions auto-created (if applicable)

#### **PUT /api/admin/orders/{order_id}/status**
Update order status through workflow.

**Request Body:**
```json
{
  "status": "completed",
  "notes": "All sessions successfully completed"
}
```

**Valid Status Transitions:**
- `pending` → `confirmed`, `cancelled`
- `confirmed` → `in_progress`, `cancelled`
- `in_progress` → `completed`, `cancelled`
- `completed` → `cancelled` (only)
- `cancelled` → (no transitions)

---

## 3. Revenue & Percentage Controller

### Purpose
Manages dynamic pricing strategy and profit margins with historical tracking for compliance.

### Pricing Formula

```
┌─────────────────────────────────────────────────────────┐
│ Student Price = Teacher Rate × (1 + Percentage / 100)  │
├─────────────────────────────────────────────────────────┤
│ Example:                                                │
│ Teacher wants: $100/hour                               │
│ Platform %: 20%                                        │
│ Student sees: $100 × 1.20 = $120/hour                 │
│ Platform revenue: $20                                  │
└─────────────────────────────────────────────────────────┘
```

### Why Effective Date Matters

**Without Effective Date (WRONG):**
```
Day 1: Set 10% → All orders show 10% price
Day 15: Change to 15% → OLD orders recalculate (WRONG!)
        Historical data is lost or incorrect
```

**With Effective Date (CORRECT):**
```
Day 1: Set 10% effective 2026-01-01
Day 15: Set 15% effective 2026-04-15
        Orders before 4/15: use 10% (historical accuracy)
        Orders after 4/15: use 15% (new strategy)
        Perfect for audits!
```

### Endpoints

#### **GET /api/admin/revenue/percentage**
Get the currently active commission percentage.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Active percentage retrieved",
  "data": {
    "id": "1",
    "value": "20.00",
    "effective_date": "2026-03-01",
    "is_active": true,
    "description": "Q2 pricing strategy",
    "created_at": "2026-03-01T00:00:00",
    "updated_at": "2026-03-01T00:00:00"
  },
  "price_example": {
    "teacher_rate": 100,
    "student_pays": 120,
    "platform_revenue": 20
  }
}
```

#### **GET /api/admin/revenue/history**
View all historical percentage changes (audit trail).

**Query Parameters:**
```
GET /api/admin/revenue/history?per_page=20&page=1
```

**Response:**
```json
{
  "success": true,
  "message": "Percentage history retrieved",
  "data": [
    {
      "id": "3",
      "value": "20.00",
      "effective_date": "2026-04-01",
      "is_active": true,
      "description": "Current rate for Q2 2026"
    },
    {
      "id": "2",
      "value": "15.00",
      "effective_date": "2026-01-01",
      "is_active": false,
      "description": "Q1 2026 rate"
    }
  ],
  "total_changes": 3
}
```

#### **POST /api/admin/revenue/percentage**
Set a new commission percentage.

**Request Body:**
```json
{
  "value": 25,
  "effective_date": "2026-05-01",
  "description": "Q2 2026 pricing increase due to inflation"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Percentage updated successfully",
  "data": { ... new percentage ... },
  "impact": {
    "percentage_change": "Percentage changed from 20% to 25%",
    "effective": "Effective from 2026-05-01 (scheduled for future)",
    "affects": "New orders created on or after this date",
    "historical_note": "Existing orders retain the percentage active when they were created"
  }
}
```

#### **GET /api/admin/revenue/calculator**
Test pricing calculations before applying.

**Query Parameters:**
```
GET /api/admin/revenue/calculator?teacher_rate=100
GET /api/admin/revenue/calculator?teacher_rate=100&percentage_id=2
```

**Response:**
```json
{
  "success": true,
  "teacher_rate": 100,
  "current_percentage": "20.00%",
  "student_price": 120,
  "platform_revenue": 20,
  "percentage_breakdown": {
    "teacher_gets": 100,
    "platform_gets": 20,
    "total": 120
  },
  "effective_date": "2026-04-01"
}
```

#### **GET /api/admin/revenue/analytics**
Revenue dashboard and statistics.

**Response:**
```json
{
  "success": true,
  "summary": {
    "current_percentage": "20.00%",
    "active_since": "2026-04-01",
    "total_revenue": 15000,
    "average_revenue_per_booking": 120,
    "bookings_count": 125
  },
  "history": [ ... ]
}
```

---

## 4. Database Schema

### services table
```sql
CREATE TABLE services (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    key_name VARCHAR(255) UNIQUE NOT NULL,
    name_en VARCHAR(255) NOT NULL UNIQUE,
    name_ar VARCHAR(255) NOT NULL UNIQUE,
    description_en TEXT,
    description_ar TEXT,
    image VARCHAR(255),
    status TINYINT DEFAULT 1,
    role_id TINYINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP -- For soft deletes
);
```

### orders table
```sql
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL REFERENCES users(id),
    subject_id BIGINT REFERENCES subjects(id),
    teacher_id BIGINT REFERENCES users(id),
    class_id BIGINT REFERENCES classes(id),
    education_level_id BIGINT REFERENCES education_levels(id),
    status VARCHAR(50) DEFAULT 'pending',
    min_price DECIMAL(10, 2),
    max_price DECIMAL(10, 2),
    notes TEXT,
    order_type VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### teachers_applications table
```sql
CREATE TABLE teachers_applications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    teacher_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### platform_percentages table
```sql
CREATE TABLE platform_percentages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    value DECIMAL(5, 2) NOT NULL,
    effective_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## 5. Frontend Integration Guide

### 5.1 Services Admin Frontend

**Display List View:**
```javascript
// Fetch services
async function loadServices() {
  const response = await fetch('/api/admin/services?per_page=15&page=1');
  const { data, pagination } = await response.json();
  
  // Map to table structure
  const services = data.map(service => ({
    id: service.id,
    name: service.name_en,
    nameAr: service.name_ar,
    slug: service.key_name,
    status: service.status === "1" ? "Active" : "Inactive",
    createdAt: service.created_at,
    actions: ['Edit', 'Delete']
  }));
}
```

**Key Fields to Display:**
- Service ID (immutable)
- Name (English) - clickable to edit
- Name (Arabic) - clickable to edit
- Slug/Key Name - auto-updates when name changes
- Status - toggle button
- Created Date
- Last Updated - show in details
- Edit/Delete buttons

**Validation Feedback:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "name_en": ["The name_en field is required."],
    "key_name": ["The key_name has already been taken."]
  }
}
```

### 5.2 Order Management Frontend

**Admin Dashboard Layout:**
```
┌─────────────────────────────────────────┐
│  ORDERS DASHBOARD                       │
├─────────────────────────────────────────┤
│  Status Filter: [All] [Pending] [...]   │
│  Search: [_________________]            │
├─────────────────────────────────────────┤
│  Order │ Student │ Subject │ Status │ # │
│   42   │ Ahmed   │ Math    │ Pending│ 3 │
│   41   │ Fatima  │ English │ Conf.  │ 1 │
├─────────────────────────────────────────┤
│  [View Details] [View Applications]     │
└─────────────────────────────────────────┘
```

**Order Details Page:**
1. Order Info (ID, Status, Dates)
2. Student Info (Name, Email, Phone)
3. Subject/Class/Level
4. Teacher (if assigned) with rating/experience
5. Price Range
6. Notes

**Applications List:**
```
For each application:
- Teacher Name [REQUIRED]
- Rating: 4.8/5 [REQUIRED]
- Experience: 5 years [REQUIRED]
- Email
- Applied Date
- Status badge
- [ACCEPT] [REJECT] buttons
```

### 5.3 Revenue/Percentage Frontend

**Percentage Management Page:**
```
┌──────────────────────────────────────┐
│  CURRENT RATE: 20%                   │
│  Active Since: 2026-04-01            │
├──────────────────────────────────────┤
│  TEST CALCULATOR:                    │
│  Teacher Rate: [100] → Student: $120 │
│  Platform Revenue: $20               │
├──────────────────────────────────────┤
│  CHANGE PERCENTAGE:                  │
│  New Rate: [____]%                   │
│  Effective: [2026-05-01]             │
│  Notes: [________________]           │
│  [SCHEDULE] [CANCEL]                 │
└──────────────────────────────────────┘
```

**History Timeline:**
```
Date          | Percentage | Status   | Notes
2026-04-01    | 20%        | Active   | Current Q2 rate
2026-01-01    | 15%        | Inactive | Q1 2026
2025-06-01    | 10%        | Inactive | Launch rate
```

---

## 6. Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": {
    "field_name": ["Error message 1", "Error message 2"]
  },
  "error": "Detailed technical info (dev only)"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created successfully
- `400`: Bad request
- `404`: Not found
- `422`: Validation error
- `500`: Server error

### Frontend Error Handling Pattern
```javascript
try {
  const response = await fetch(endpoint, options);
  const data = await response.json();
  
  if (!data.success) {
    if (response.status === 422) {
      // Show validation errors per field
      displayFieldErrors(data.errors);
    } else {
      // Show general error message
      showAlert(data.message, 'error');
    }
  }
} catch (error) {
  showAlert('Network error: ' + error.message, 'error');
}
```

---

## 7. Best Practices

### 1. Services Management
✅ **DO:**
- Update `key_name` when changing service name (URL integrity)
- Use consistent naming (English & Arabic pairs)
- Include descriptions for frontend display
- Use soft deletes (don't physically delete)

❌ **DON'T:**
- Rename services without updating slug
- Create duplicate services with same name
- Leave descriptions empty
- Physically delete services

### 2. Order Management
✅ **DO:**
- Show teacher's RATING and EXPERIENCE in applications list
- Include teacher PROFILE PHOTO for quick recognition
- Log all admin decisions with reasons
- Verify teacher applied before assigning
- Follow status transitions (don't skip steps)

❌ **DON'T:**
- Assign teacher without seeing their profile
- Skip validation of status transitions
- Assign without teacher applying first
- Ignore application status updates

### 3. Revenue Management
✅ **DO:**
- Use effective_date for pricing changes
- Schedule future changes in advance
- Keep full audit trail
- Test calculator before applying changes
- Document reason for percentage changes

❌ **DON'T:**
- Change percentage without effective_date
- Lose historical data
- Apply retroactively to old orders
- Change percentage too frequently

---

## Integration Checklist

### Backend Setup
- [ ] ServiceAdminController deployed
- [ ] OrderAdminController deployed
- [ ] RevenuePercentageController deployed
- [ ] PlatformPercentage model created
- [ ] Database migrations applied
- [ ] Routes configured
- [ ] Authentication/Authorization tested

### Frontend Setup
- [ ] Services management UI built
- [ ] Order dashboard built
- [ ] Order details page built
- [ ] Applications list with teacher profiles
- [ ] Revenue management UI built
- [ ] Error handling implemented
- [ ] Responsive design tested

### Testing
- [ ] Create/Read/Update/Delete services
- [ ] Test slug auto-generation
- [ ] Order status workflow
- [ ] Teacher assignment flow
- [ ] Percentage calculations
- [ ] Historical data retrieval
- [ ] Validation error messages

---

## File Locations

```
app/
├── Http/Controllers/API/Admin/
│   ├── ServiceAdminController.php       ✅ Complete
│   ├── OrderAdminController.php         ✅ Complete
│   └── RevenuePercentageController.php  ✅ Complete
└── Models/
    └── PlatformPercentage.php           ✅ Complete

database/migrations/
├── [timestamp]_create_services_table.php
├── [timestamp]_create_orders_table.php
└── [timestamp]_create_platform_percentages_table.php
```

---

## Support & Troubleshooting

### Issue: Slug conflicts
**Solution**: Auto-increment suffix added (e.g., `private-lessons-1`)

### Issue: Cannot delete service
**Solution**: Check for related orders; use soft delete (not hard delete)

### Issue: Old orders showing wrong price
**Solution**: Use effective_date in PlatformPercentage queries

### Issue: Teacher not appearing in applications
**Solution**: Verify teacher_id exists in users table and teacher applied

---

**Document Version**: 1.0  
**Last Updated**: April 8, 2026  
**Backend Framework**: Laravel 10+  
**API Standard**: RESTful JSON  
**Status**: ✅ Production Ready
