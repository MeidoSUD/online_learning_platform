# Payment Security Update - Quick Reference

## ⚡ Key Changes

| Parameter | Before | After |
|-----------|--------|-------|
| `amount` | ✅ Required | ❌ Removed |
| `booking_id` | 📝 Optional | ✅ Required |
| `currency` | ✅ Required | 📝 Optional (from booking) |
| Amount Source | 📨 User request | 💾 Database (booking.total_amount) |
| Security | ❌ Vulnerable | ✅ Safe |

---

## New API Endpoint

### Checkout (Create Payment)

```
POST /api/payments/checkout
Content-Type: application/json
Authorization: Bearer {student_token}

{
  "booking_id": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkout_id": "123",
    "payment_id": 45,
    "amount": 500,
    "currency": "SAR",
    "sessions": 5,
    "redirect_url": "https://..."
  }
}
```

---

## How Multi-Session Pricing Works

When booking is created:

```
Input:
- sessions_count: 5
- price_per_session: 100 SAR
- discount: 10%

Calculation:
1. subtotal = 100 × 5 = 500 SAR
2. discount_amount = 500 × 10% = 50 SAR
3. total_amount = 500 - 50 = 450 SAR ✅

Payment:
POST /api/payments/checkout
{
  "booking_id": 100
}

Response amount: 450 SAR ✅ Automatic!
```

---

## Security Features

✅ **Booking Ownership Check**
```php
if ($booking->student_id !== $user->id) {
    return error('This booking does not belong to you');
}
```

✅ **Amount from Database** (not request)
```php
$amount = (int)($booking->total_amount * 100);
```

✅ **Auto Multi-Session Calculation**
```php
// Already included in booking.total_amount
// No need to multiply by session count manually
```

---

## Migration Checklist

- [ ] Update mobile app to NOT send `amount` field
- [ ] Update mobile app to send only `booking_id`
- [ ] Test with single session booking
- [ ] Test with multi-session booking (5+ sessions)
- [ ] Test with discount applied
- [ ] Test with saved card
- [ ] Verify response includes `sessions` field

---

## Old vs New Examples

### Example 1: Single Session (100 SAR)

**OLD (Insecure)**:
```dart
{
  "booking_id": 1,
  "amount": 100,  // ❌ Manual entry - what if typo?
  "currency": "SAR"
}
```

**NEW (Secure)**:
```dart
{
  "booking_id": 1  // ✅ Just the ID, server calculates
}
```

---

### Example 2: 5 Sessions with Discount

**OLD (Insecure)**:
```dart
{
  "booking_id": 2,
  "amount": 450,  // ❌ Must calculate manually - error prone!
  "currency": "SAR"
}
```

**NEW (Secure)**:
```dart
{
  "booking_id": 2  // ✅ Server knows it's 5 sessions × 100 - 10% = 450
}
```

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | ✅ Payment created | Proceed to payment gateway |
| 400 | Booking not found or invalid | Check booking_id |
| 403 | Booking belongs to another student | Verify auth token |
| 422 | Missing booking_id | Add booking_id to request |

---

## Support

For issues:
1. Ensure `booking_id` is valid and belongs to authenticated student
2. Check booking has `total_amount` populated
3. Verify `currency` matches payment gateway requirements
4. Check student authentication token is valid

