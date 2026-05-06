# ✅ PaymentController Security Update - Amount Calculation from Booking

## Overview

The `createCheckout()` method has been updated to **calculate the payment amount from the booking** instead of accepting it from the request. This is a critical security improvement that prevents payment manipulation attacks.

---

## Security Issue (Before)

### ❌ VULNERABLE CODE
```php
// OLD: Amount comes from user input - HIGH RISK!
public function createCheckout(Request $request)
{
    $request->validate([
        'amount' => 'required|numeric|min:1',  // ❌ User can send ANY amount
        'booking_id' => 'nullable|integer|exists:bookings,id',
    ]);
    
    $amount = (int)($request->amount * 100);  // ❌ Uses user-provided amount
}
```

### Attack Scenario
```
Attacker sends: POST /api/payments/checkout
{
  "booking_id": 100,
  "amount": 1.0,          ← ❌ Should be 500 SAR!
  "currency": "SAR"
}

Result: Payment created for 1 SAR instead of 500 SAR
```

**Risks**:
1. Customer pays less than expected
2. Business loses revenue
3. Inconsistency between booking price and payment
4. Chargebacks and disputes

---

## Security Solution (After)

### ✅ SECURE CODE
```php
// NEW: Amount calculated from database booking - SAFE!
public function createCheckout(Request $request)
{
    $request->validate([
        'booking_id' => 'required|integer|exists:bookings,id',  // ✅ Required
        // amount is NOT in validation anymore
    ]);
    
    // Get booking from database
    $booking = Booking::findOrFail($bookingId);
    
    // Verify ownership
    if ($booking->student_id !== $user->id) {
        return $this->authorizationError('This booking does not belong to you');
    }
    
    // ✅ USE AMOUNT FROM DATABASE, NOT REQUEST
    $amount = (int)($booking->total_amount * 100);
}
```

### Result
```
Student sends: POST /api/payments/checkout
{
  "booking_id": 100         ← Only booking_id needed
}

Response: Payment created with amount from booking (500 SAR)
✅ Safe and consistent!
```

---

## Changes Made

### 1. Validation Changes

**Before**:
```php
$request->validate([
    'amount' => 'required|numeric|min:1',              // ❌ Removed
    'currency' => 'required|string|size:3',            // ❌ Changed to nullable
    'payment_brand' => 'nullable|string',
    'saved_card_id' => 'nullable|integer|exists:saved_cards,id',
    'booking_id' => 'nullable|integer|exists:bookings,id',  // ❌ Changed to required
    'teacher_id' => 'nullable|integer|exists:users,id',
    'merchant_transaction_id' => 'nullable|string',
    'description' => 'nullable|string',
    'callback_url' => 'nullable|url',
]);
```

**After**:
```php
$request->validate([
    'booking_id' => 'required|integer|exists:bookings,id',  // ✅ NOW REQUIRED
    'currency' => 'nullable|string|size:3',                 // ✅ Optional (from booking)
    'payment_brand' => 'nullable|string',
    'saved_card_id' => 'nullable|integer|exists:saved_cards,id',
    'teacher_id' => 'nullable|integer|exists:users,id',
    'merchant_transaction_id' => 'nullable|string',
    'description' => 'nullable|string',
    'callback_url' => 'nullable|url',
]);
```

### 2. Amount Calculation

**Before**:
```php
$amount = (int)($request->amount * 100);  // ❌ From request
```

**After**:
```php
// Get booking with validation
$booking = Booking::findOrFail($bookingId);

// Verify student owns this booking
if ($booking->student_id !== $user->id) {
    return $this->authorizationError('This booking does not belong to you');
}

// Calculate amount from booking
$amount = (int)($booking->total_amount * 100);  // ✅ From database
```

### 3. Currency Handling

**Before**:
```php
'currency' => strtoupper($request->currency),  // ❌ From request
```

**After**:
```php
$currency = $request->currency ?? $booking->currency ?? 'SAR';  // ✅ From booking
```

### 4. Response Includes Session Count

**Before**:
```php
return $this->success([
    'checkout_id' => $data['id'],
    'payment_id' => $payment->id,
    'redirect_url' => $data['url'] ?? '',
    'amount' => $request->amount,
    'currency' => $request->currency,
], 'Payment initiated successfully');
```

**After**:
```php
return $this->success([
    'checkout_id' => $data['id'],
    'payment_id' => $payment->id,
    'redirect_url' => $data['url'] ?? '',
    'amount' => $booking->total_amount,           // ✅ From booking
    'currency' => $currency,                      // ✅ From booking
    'sessions' => $booking->sessions_count,       // ✅ NEW: Show session count
], 'Payment initiated successfully');
```

---

## How Amount is Calculated During Booking

When a booking is created, the `total_amount` is calculated as:

```php
// From BookingController::createBooking()
$sessionsCount = (int)$request->total_sessions;  // User provides count
$pricePerSession = $teacherRatePerSession * (1 + $percentageValue);
$subtotal = $pricePerSession * $sessionsCount;   // Multiple by count!
$discountAmount = $subtotal * ($discount / 100);
$total = $subtotal - $discountAmount;            // This is total_amount

// Store in booking
Booking::create([
    'sessions_count' => $sessionsCount,
    'price_per_session' => $pricePerSession,
    'subtotal' => $subtotal,
    'discount_percentage' => $discount,
    'discount_amount' => $discountAmount,
    'total_amount' => $total,  // ✅ Already includes multiple sessions
]);
```

**Examples**:
- 1 session @ 100 SAR = total_amount: 100 SAR
- 5 sessions @ 100 SAR = total_amount: 500 SAR
- 5 sessions @ 100 SAR with 10% discount = total_amount: 450 SAR

---

## New API Usage

### Request Format

```json
POST /api/payments/checkout
Content-Type: application/json
Authorization: Bearer {token}

{
  "booking_id": 100
}
```

**Optional fields**:
```json
{
  "booking_id": 100,
  "currency": "SAR",          // Optional (defaults to booking currency)
  "saved_card_id": 5,         // Optional (use saved payment method)
  "description": "Course enrollment",  // Optional
  "callback_url": "https://app.com/callback"  // Optional
}
```

### Response Format

```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "data": {
    "checkout_id": "123456789",
    "payment_id": 45,
    "redirect_url": "https://moyasar.com/checkout/...",
    "amount": 500,
    "currency": "SAR",
    "sessions": 5
  }
}
```

---

## Security Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Amount Control** | ❌ User input | ✅ Database (immutable) |
| **Attack Vector** | ❌ Easy - send any amount | ✅ Prevented - must use booking |
| **Consistency** | ❌ Can mismatch | ✅ Always matches booking |
| **Ownership Validation** | ❌ Not checked | ✅ Verified: `booking->student_id === auth()->id()` |
| **Multi-session Support** | ⚠️ Manual calc | ✅ Auto-calculated during booking |
| **Discount Handling** | ❌ Not validated | ✅ Pre-calculated in booking |

---

## Testing

### Test 1: Valid Payment Request

```bash
curl -X POST "http://localhost:8000/api/payments/checkout" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 100
  }'
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "data": {
    "checkout_id": "...",
    "payment_id": 45,
    "amount": 500,
    "currency": "SAR",
    "sessions": 5
  }
}
```

---

### Test 2: Missing Booking ID

```bash
curl -X POST "http://localhost:8000/api/payments/checkout" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response** (422):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "booking_id": ["The booking_id field is required."]
  }
}
```

---

### Test 3: Non-existent Booking

```bash
curl -X POST "http://localhost:8000/api/payments/checkout" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 999999
  }'
```

**Expected Response** (404):
```json
{
  "success": false,
  "message": "Not found"
}
```

---

### Test 4: Booking Belongs to Another Student

```bash
curl -X POST "http://localhost:8000/api/payments/checkout" \
  -H "Authorization: Bearer STUDENT_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 50  // Belongs to Student B
  }'
```

**Expected Response** (403):
```json
{
  "success": false,
  "message": "This booking does not belong to you"
}
```

---

### Test 5: With Saved Card

```bash
curl -X POST "http://localhost:8000/api/payments/checkout" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": 100,
    "saved_card_id": 5
  }'
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "data": {
    "checkout_id": "...",
    "payment_id": 46,
    "redirect_url": "...",
    "amount": 500,
    "currency": "SAR",
    "sessions": 5
  }
}
```

---

## Migration Guide for Mobile App

### OLD CODE (Insecure)
```dart
// Flutter - OLD approach
final response = await http.post(
  Uri.parse('$apiUrl/api/payments/checkout'),
  headers: {'Authorization': 'Bearer $token'},
  body: jsonEncode({
    'booking_id': booking.id,
    'amount': 500,  // ❌ Sending amount from app - INSECURE!
    'currency': 'SAR',
  }),
);
```

### NEW CODE (Secure)
```dart
// Flutter - NEW approach
final response = await http.post(
  Uri.parse('$apiUrl/api/payments/checkout'),
  headers: {'Authorization': 'Bearer $token'},
  body: jsonEncode({
    'booking_id': booking.id,  // ✅ Only booking_id needed
    // Amount is calculated on server from booking.total_amount
  }),
);

// Parse response
if (response.statusCode == 200) {
  final data = jsonDecode(response.body);
  print('Amount: ${data['data']['amount']}');  // From server
  print('Sessions: ${data['data']['sessions']}');  // Confirmation
}
```

---

## Benefits Summary

✅ **Prevents Payment Manipulation**: Amount is immutable in database  
✅ **Automatic Multi-Session Calculation**: No client-side math needed  
✅ **Ownership Validation**: Ensures student owns the booking  
✅ **Discount Preservation**: Discounts pre-calculated in booking  
✅ **Consistency**: Payment always matches booking price  
✅ **Reduced Attack Surface**: Less user input = less risk  
✅ **Simplified API**: Client needs fewer parameters  
✅ **Audit Trail**: All amounts traceable to bookings  

