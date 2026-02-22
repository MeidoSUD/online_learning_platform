# Admin Dashboard API Guide

## Overview

The Admin Dashboard API provides comprehensive statistics and analytics for platform administrators. It returns all key metrics including user counts, booking statistics, payment information, recent activity, and wallet summaries in a single endpoint.

---

## Endpoint

### Get Admin Dashboard

```
GET /api/admin/dashboard
```

### Authentication

**Required:**
- `Authorization: Bearer {sanctum_token}` (Admin token)
- Role: Admin (role_id = 1)
- Middleware: `auth:sanctum`, `role:admin`

---

## Request

### Method
```
GET
```

### Headers
```
Authorization: Bearer YOUR_ADMIN_SANCTUM_TOKEN
Content-Type: application/json
```

### Query Parameters
None required - returns all data

### Example Request

**cURL:**
```bash
curl -X GET "https://your-domain.com/api/admin/dashboard" \
  -H "Authorization: Bearer YOUR_ADMIN_SANCTUM_TOKEN" \
  -H "Content-Type: application/json"
```

**JavaScript/Fetch:**
```javascript
const response = await fetch('https://your-domain.com/api/admin/dashboard', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_ADMIN_SANCTUM_TOKEN',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
console.log(data);
```

**PHP/Laravel:**
```php
$response = Http::withToken('YOUR_ADMIN_SANCTUM_TOKEN')
  ->get('https://your-domain.com/api/admin/dashboard');
$data = $response->json();
```

**Axios (JavaScript):**
```javascript
import axios from 'axios';

axios.defaults.headers.common['Authorization'] = 'Bearer YOUR_ADMIN_SANCTUM_TOKEN';

axios.get('https://your-domain.com/api/admin/dashboard')
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error:', error.response.data);
  });
```

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "code": "DASHBOARD_RETRIEVED",
  "status": "success",
  "message_en": "Dashboard data retrieved successfully",
  "message_ar": "تم استرجاع بيانات لوحة التحكم بنجاح",
  "data": {
    "summary": {
      "total_users": 250,
      "total_teachers": 45,
      "active_teachers": 38,
      "unverified_teachers": 7,
      "total_students": 200,
      "inactive_users": 5,
      "total_bookings": 850,
      "total_revenue": 45250.50,
      "teachers_wallet_total": 28750.75
    },
    "bookings": {
      "total": 850,
      "confirmed": 720,
      "pending_payment": 95,
      "cancelled": 35,
      "by_status": {
        "confirmed": 720,
        "pending_payment": 95,
        "cancelled": 35
      }
    },
    "payments": {
      "total": 720,
      "successful": 680,
      "total_amount": 45250.50,
      "by_status": {
        "success": 680,
        "pending": 25,
        "failed": 15
      }
    },
    "users_by_role": {
      "admin": 3,
      "teacher": 45,
      "student": 200
    },
    "monthly_metrics": {
      "new_users_this_month": 32,
      "new_bookings_this_month": 125
    },
    "recent_activity": [
      {
        "id": 1250,
        "type": "booking",
        "user_name": "Ahmed Hassan",
        "user_role": "student",
        "status": "confirmed",
        "amount": 150.00,
        "created_at": "2024-02-22 15:30:00"
      },
      {
        "id": 1249,
        "type": "booking",
        "user_name": "Fatima Mohammed",
        "user_role": "teacher",
        "status": "confirmed",
        "amount": 200.00,
        "created_at": "2024-02-22 15:20:00"
      },
      {
        "id": 1248,
        "type": "booking",
        "user_name": "Ali Ahmed",
        "user_role": "student",
        "status": "pending_payment",
        "amount": 175.00,
        "created_at": "2024-02-22 15:10:00"
      }
    ],
    "wallet_info": {
      "total_teachers_wallet": 28750.75,
      "average_per_teacher": 638.91
    }
  }
}
```

### Response Fields Explanation

#### Summary Section
| Field | Type | Description |
|-------|------|-------------|
| `total_users` | integer | Total number of all users |
| `total_teachers` | integer | Total number of teachers (role_id = 3) |
| `active_teachers` | integer | Teachers who are verified and active |
| `unverified_teachers` | integer | Teachers waiting for verification |
| `total_students` | integer | Total number of students (role_id = 4) |
| `inactive_users` | integer | Users with is_active = false |
| `total_bookings` | integer | Total number of all bookings |
| `total_revenue` | float | Sum of all successful payments |
| `teachers_wallet_total` | float | Sum of all teacher wallet balances |

#### Bookings Section
| Field | Type | Description |
|-------|------|-------------|
| `total` | integer | Total bookings |
| `confirmed` | integer | Confirmed bookings |
| `pending_payment` | integer | Bookings awaiting payment |
| `cancelled` | integer | Cancelled bookings |
| `by_status` | object | Booking count distribution |

#### Payments Section
| Field | Type | Description |
|-------|------|-------------|
| `total` | integer | Total payment records |
| `successful` | integer | Successful/completed payments |
| `total_amount` | float | Sum of all successful payments |
| `by_status` | object | Payment status distribution |

#### Users by Role
| Field | Type | Description |
|-------|------|-------------|
| `admin` | integer | Total admins |
| `teacher` | integer | Total teachers |
| `student` | integer | Total students |

#### Monthly Metrics
| Field | Type | Description |
|-------|------|-------------|
| `new_users_this_month` | integer | Users created this month |
| `new_bookings_this_month` | integer | Bookings created this month |

#### Recent Activity
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Booking ID |
| `type` | string | Activity type (e.g., "booking") |
| `user_name` | string | Name of user involved |
| `user_role` | string | User role (teacher/student) |
| `status` | string | Booking status |
| `amount` | float | Booking amount |
| `created_at` | string | Activity timestamp |

#### Wallet Info
| Field | Type | Description |
|-------|------|-------------|
| `total_teachers_wallet` | float | Total balance across all teacher wallets |
| `average_per_teacher` | float | Average wallet balance per teacher |

---

## Error Responses

### 401 Unauthorized

```json
{
  "message": "Unauthenticated",
  "code": "UNAUTHENTICATED"
}
```

**Solution:** Provide valid Sanctum token in Authorization header

### 403 Forbidden

```json
{
  "message": "This action is unauthorized",
  "code": "FORBIDDEN"
}
```

**Solution:** User must have admin role

### 500 Server Error

```json
{
  "success": false,
  "code": "DASHBOARD_ERROR",
  "status": "error",
  "message_en": "Error fetching dashboard data",
  "message_ar": "خطأ في جلب بيانات لوحة التحكم"
}
```

**Solution:** Check server logs for specific error

---

## Data Included

### 1. **Summary Statistics**
- Total users across platform
- User counts by role (admin, teacher, student)
- Active vs inactive users
- Teacher verification status
- Total bookings
- Total revenue from successful payments
- Total wallet balance for all teachers

### 2. **Booking Analytics**
- Total bookings by status (confirmed, pending, cancelled)
- Booking distribution
- Recent booking activity

### 3. **Payment Analytics**
- Total payments and successful payments
- Payment status distribution
- Total revenue amount

### 4. **User Analytics**
- Users grouped by role
- New users this month
- Inactive user count

### 5. **Recent Activity**
- Last 10 bookings/transactions
- User details for each activity
- Booking status and amount

### 6. **Teacher Wallet Summary**
- Total wallet balance across all teachers
- Average wallet balance per teacher

---

## Use Cases

### 1. Display Dashboard Summary
```javascript
const dashboardData = await fetchDashboard();
document.getElementById('totalUsers').textContent = dashboardData.data.summary.total_users;
document.getElementById('activeTeachers').textContent = dashboardData.data.summary.active_teachers;
document.getElementById('totalRevenue').textContent = `$${dashboardData.data.summary.total_revenue}`;
document.getElementById('teacherWallet').textContent = `$${dashboardData.data.wallet_info.total_teachers_wallet}`;
```

### 2. Create Dashboard Charts
```javascript
const bookingData = dashboardData.data.bookings.by_status;
const chartData = {
  labels: ['Confirmed', 'Pending Payment', 'Cancelled'],
  data: [
    bookingData.confirmed,
    bookingData.pending_payment,
    bookingData.cancelled
  ]
};
// Pass to Chart.js or similar
```

### 3. Monitor Monthly Growth
```javascript
const monthly = dashboardData.data.monthly_metrics;
console.log(`New users this month: ${monthly.new_users_this_month}`);
console.log(`New bookings this month: ${monthly.new_bookings_this_month}`);
```

### 4. Review Recent Activity
```javascript
const activities = dashboardData.data.recent_activity;
activities.forEach(activity => {
  console.log(`${activity.user_name} (${activity.user_role}): ${activity.status}`);
});
```

---

## Implementation Examples

### React Component
```jsx
import { useState, useEffect } from 'react';

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      const data = await response.json();
      setDashboard(data.data);
      setLoading(false);
    };

    fetchDashboard();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard 
          title="Total Users" 
          value={dashboard.summary.total_users} 
        />
        <StatCard 
          title="Active Teachers" 
          value={dashboard.summary.active_teachers} 
        />
        <StatCard 
          title="Total Bookings" 
          value={dashboard.summary.total_bookings} 
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${dashboard.summary.total_revenue}`} 
        />
        <StatCard 
          title="Teachers Wallet" 
          value={`$${dashboard.wallet_info.total_teachers_wallet}`} 
        />
      </div>
      <RecentActivityTable activities={dashboard.recent_activity} />
    </div>
  );
}
```

### Vue.js Component
```vue
<template>
  <div class="admin-dashboard">
    <div v-if="dashboard" class="dashboard-content">
      <div class="stats-container">
        <StatCard 
          title="Total Users" 
          :value="dashboard.summary.total_users" 
        />
        <StatCard 
          title="Active Teachers" 
          :value="dashboard.summary.active_teachers" 
        />
        <StatCard 
          title="Total Bookings" 
          :value="dashboard.summary.total_bookings" 
        />
        <StatCard 
          title="Total Revenue" 
          :value="`$${dashboard.summary.total_revenue}`" 
        />
      </div>
      <RecentActivity :activities="dashboard.recent_activity" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      dashboard: null
    }
  },
  mounted() {
    this.fetchDashboard();
  },
  methods: {
    async fetchDashboard() {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      const data = await response.json();
      this.dashboard = data.data;
    }
  }
}
</script>
```

---

## Performance Notes

- **Response Time**: Typically 200-500ms depending on database size
- **Database Queries**: Optimized with proper indexing
- **Caching**: Consider caching dashboard for 5-10 minutes in production
- **Real-time Updates**: Refresh every 30 seconds for real-time view

---

## Security Considerations

1. **Authentication Required**: Only admins can access this endpoint
2. **Rate Limiting**: Consider limiting dashboard requests to prevent abuse
3. **Audit Logging**: All dashboard access is logged
4. **Data Filtering**: Only relevant data exposed to admin role

---

## Testing with Postman

1. **Collection Setup:**
   - Base URL: `https://your-domain.com/api`
   - Auth Type: Bearer Token
   - Token: `{{admin_token}}`

2. **Test Request:**
   - Method: GET
   - URL: `{{base_url}}/admin/dashboard`
   - Headers: Auto-populated by Bearer Token

3. **Verify Response:**
   - Status: 200
   - Contains all required fields
   - Numbers match expected values

---

## Troubleshooting

### Missing Fields in Response
- Check that all models (User, Booking, Payment, Wallet) exist
- Verify database migrations are up to date
- Check logs for query errors

### Incorrect Numbers
- Verify data integrity in database
- Check for soft-deleted records (excluded by default)
- Review booking and payment status values

### Slow Response
- Check database indexing
- Monitor server resources
- Consider caching dashboard response

---

## Related Endpoints

- `GET /api/admin/users` - List all users
- `GET /api/admin/teachers` - List all teachers
- `GET /api/admin/bookings` - List all bookings
- `GET /api/admin/payments` - List all payments
- `GET /api/admin/stats` - Quick stats (legacy)

---

## Support

For issues or questions:
1. Check logs: `storage/logs/laravel.log`
2. Verify admin authentication
3. Test with Postman before frontend integration
4. Contact development team with response data

