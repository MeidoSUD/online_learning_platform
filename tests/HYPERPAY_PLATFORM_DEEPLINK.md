# Platform-Specific Deep Linking for HyperPay Payments

## Overview

The backend now supports **dynamic, platform-specific deep linking** for HyperPay payment results. This allows the mobile app to intercept payment responses directly through native deep links instead of relying on HTTP callbacks.

**Supported Platforms**:
- ✅ iOS (`com.ewangeniuses.ewanapp.payments://checkout`)
- ✅ Android (`com.ewan_mobile_app.payments://checkout`)
- ✅ Web/Browser (HTTP callback fallback)

---

## What Changed

### Backend Updates

#### 1. **HyperpayService.php** - Added Dynamic URL Generation

```php
/**
 * Generate shopper result URL based on platform
 * 
 * iOS: com.ewangeniuses.ewanapp.payments://checkout
 * Android: com.ewan_mobile_app.payments://checkout
 */
private function generateShopperResultUrl(?string $platform): ?string
{
    if (empty($platform)) {
        return null;
    }

    $platform = strtolower(trim($platform));

    if ($platform === 'ios') {
        return 'com.ewangeniuses.ewanapp.payments://checkout';
    }

    if ($platform === 'android') {
        return 'com.ewan_mobile_app.payments://checkout';
    }

    return null;
}
```

#### 2. **createCheckout() Method** - Now Includes Platform Parameter

**Old Implementation**:
```php
$payload = [
    'amount' => $request->amount,
    'currency' => $request->currency,
    'paymentBrand' => $paymentBrand,
    'merchantTransactionId' => $request->merchant_transaction_id,
    'registrationId' => $registrationId,
];
```

**New Implementation**:
```php
$payload = [
    'amount' => $request->amount,
    'currency' => $request->currency,
    'paymentBrand' => $paymentBrand,
    'merchantTransactionId' => $request->merchant_transaction_id,
    'registrationId' => $registrationId,
    'platform' => $request->platform,  // ← NEW: iOS or Android
];
```

#### 3. **PaymentController.php** - Updated Validation

**Added platform validation**:
```php
$request->validate([
    'amount' => 'required|numeric|min:1',
    'currency' => 'required|string|size:3',
    'payment_brand' => 'nullable|string|in:VISA,MASTER,MADA',
    'saved_card_id' => 'nullable|integer|exists:saved_cards,id',
    'customer_id' => 'nullable|string',
    'merchant_transaction_id' => 'nullable|string',
    'platform' => 'nullable|string|in:iOS,Android',  // ← NEW
]);
```

---

## How It Works

### Payment Flow with Platform-Specific Deep Linking

```
1. iOS/Android App calls createCheckout() with platform parameter
   ↓
   POST /api/student/payments/checkout
   {
     "amount": 100,
     "currency": "SAR",
     "platform": "iOS"  ← NEW
   }

2. Backend validates platform and creates HyperPay checkout
   ↓
   HyperpayService.createCheckout($payload)
   → generateShopperResultUrl('iOS')
   → Returns: 'com.ewangeniuses.ewanapp.payments://checkout'
   → Adds to HyperPay request as 'shopperResultUrl'

3. Backend sends shopperResultUrl to HyperPay
   ↓
   HyperPay API receives:
   {
     "entityId": "8a8...",
     "amount": "100.00",
     "currency": "SAR",
     "shopperResultUrl": "com.ewangeniuses.ewanapp.payments://checkout",
     ... other fields
   }

4. Customer completes payment in HyperPay widget
   ↓
   HyperPay redirects to shopperResultUrl with checkout ID
   iOS: com.ewangeniuses.ewanapp.payments://checkout?id=CHECKOUT_ID
   Android: com.ewan_mobile_app.payments://checkout?id=CHECKOUT_ID

5. Native app intercepts deep link
   ↓
   Operating system routes to registered deep link handler
   App receives: checkout?id=CHECKOUT_ID

6. App calls backend to verify payment status
   ↓
   POST /api/student/payments/status
   {
     "checkout_id": "CHECKOUT_ID",
     "save_card": true
   }

7. Backend confirms payment and returns result
```

---

## API Endpoint

### POST /api/student/payments/checkout

#### Request Parameters

| Parameter | Type | Required | Example | Description |
|-----------|------|----------|---------|-------------|
| `amount` | Decimal | ✅ Yes | `100.00` | Payment amount |
| `currency` | String | ✅ Yes | `SAR` | 3-letter currency code |
| `payment_brand` | String | ❌ No | `VISA` | VISA, MASTER, or MADA (defaults to VISA) |
| `saved_card_id` | Integer | ❌ No | `1` | Use saved card instead of new card |
| `platform` | String | ✅ **NEW** | `iOS` | **NEW**: Platform for deep linking (iOS or Android) |
| `merchant_transaction_id` | String | ❌ No | `txn_abc123` | Your transaction reference |

#### Example Requests

**iOS Request**:
```json
POST /api/student/payments/checkout
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "amount": 100,
  "currency": "SAR",
  "payment_brand": "VISA",
  "platform": "iOS"
}
```

**Android Request**:
```json
POST /api/student/payments/checkout
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "amount": 150,
  "currency": "SAR",
  "payment_brand": "MASTER",
  "platform": "Android"
}
```

#### Success Response

```json
{
  "success": true,
  "message": "Checkout session created successfully",
  "data": {
    "checkout_id": "8a82944a7e4...",
    "payment_id": 123,
    "redirect_url": "https://hyperpay.hyperpay.com/v1/checkouts/8a82944a7e4.../payment.html",
    "amount": 100,
    "currency": "SAR"
  }
}
```

---

## Backend Implementation Details

### HyperpayService.php - New Method

```php
/**
 * Generate platform-specific deep link URL
 * 
 * @param string|null $platform 'iOS', 'Android', or null
 * @return string|null Deep link URL or null if no platform
 */
private function generateShopperResultUrl(?string $platform): ?string
{
    if (empty($platform)) {
        return null;
    }

    $platform = strtolower(trim($platform));

    // iOS deep link
    if ($platform === 'ios') {
        return 'com.ewangeniuses.ewanapp.payments://checkout';
    }

    // Android deep link
    if ($platform === 'android') {
        return 'com.ewan_mobile_app.payments://checkout';
    }

    // Unknown platform - log warning and skip
    Log::warning('Unknown platform for HyperPay shopperResultUrl', ['platform' => $platform]);
    return null;
}
```

### createCheckout() - Integration

```php
public function createCheckout(array $payload)
{
    // ... validation ...

    $checkoutPayload = [
        'entityId' => $entityId,
        'amount' => $payload['amount'],
        'currency' => $payload['currency'],
        'paymentType' => 'DB',
        'integrity' => 'true',
        // ... other fields ...
    ];

    // ✅ NEW: Generate platform-specific deep link
    $shopperResultUrl = $this->generateShopperResultUrl($payload['platform'] ?? null);
    if (!empty($shopperResultUrl)) {
        $checkoutPayload['shopperResultUrl'] = $shopperResultUrl;
    }

    // Send to HyperPay
    $response = Http::withHeaders($this->headers())
                    ->timeout($this->timeout)
                    ->asForm()
                    ->post($this->base . '/v1/checkouts', $checkoutPayload);

    return $response;
}
```

---

## Logging

The backend logs platform information for debugging:

```php
Log::info('HyperPay Copy & Pay Checkout Created', [
    'amount' => $checkoutPayload['amount'],
    'currency' => $checkoutPayload['currency'],
    'brand' => $brand,
    'entityId' => $entityId,
    'platform' => $payload['platform'] ?? 'unknown',  // ← Platform logged
    'shopper_result_url' => $shopperResultUrl ?? 'not_set',  // ← URL logged
]);
```

Check logs with:
```bash
tail -f storage/logs/laravel.log | grep "HyperPay Copy & Pay Checkout Created"
```

---

## Deep Link Scheme Definitions

### iOS Scheme

**Scheme**: `com.ewangeniuses.ewanapp.payments`

**Format**: `com.ewangeniuses.ewanapp.payments://checkout?id={checkoutId}`

**Example**: `com.ewangeniuses.ewanapp.payments://checkout?id=8a82944a7e4f...`

**Configuration**: Register in `Info.plist`

### Android Scheme

**Scheme**: `com.ewan_mobile_app.payments`

**Format**: `com.ewan_mobile_app.payments://checkout?id={checkoutId}`

**Example**: `com.ewan_mobile_app.payments://checkout?id=8a82944a7e4f...`

**Configuration**: Register in `AndroidManifest.xml`

**Fallback Support**: Android can listen to BOTH schemes:
- `com.ewan_mobile_app.payments://checkout`
- `com.ewangeniuses.ewanapp.payments://checkout`

---

## Backward Compatibility

✅ **Fully Backward Compatible**

- If `platform` parameter is **NOT provided**, the backend will **NOT set `shopperResultUrl`**
- HyperPay will use its default behavior (HTTP browser redirect)
- Existing apps continue to work without changes

### Upgrade Path

1. **Phase 1** (Current): Backend supports both with and without platform
2. **Phase 2** (Future): All apps send platform parameter
3. **Phase 3** (Optional): Deprecate HTTP callback in favor of deep links

---

## Testing

### Manual Testing with Postman

**1. Get Authentication Token**

```
POST /api/auth/login
{
  "email": "student@example.com",
  "password": "password123",
  "fcm_token": "token_here"
}

# Copy the token from response
```

**2. Create Checkout (iOS)**

```
POST /api/student/payments/checkout
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "amount": 100,
  "currency": "SAR",
  "payment_brand": "VISA",
  "platform": "iOS"
}
```

**3. Create Checkout (Android)**

```
POST /api/student/payments/checkout
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "amount": 150,
  "currency": "SAR",
  "payment_brand": "MASTER",
  "platform": "Android"
}
```

**4. Verify in Logs**

```bash
tail -f storage/logs/laravel.log | grep "HyperPay Copy & Pay Checkout Created"
```

Expected output:
```
[2026-01-17 10:30:45] local.INFO: HyperPay Copy & Pay Checkout Created 
{
  "amount":"100.00",
  "currency":"SAR",
  "platform":"ios",
  "shopper_result_url":"com.ewangeniuses.ewanapp.payments://checkout"
}
```

---

## Flutter Implementation Guide

### Step 1: Import Package

```dart
import 'package:flutter_app/services/payment_service.dart';
```

### Step 2: Get Platform

```dart
import 'dart:io' show Platform;

String platform = Platform.isIOS ? 'iOS' : 'Android';
```

### Step 3: Send Platform to Backend

```dart
Future<PaymentResponse> createCheckout({
  required double amount,
  required String currency,
  String? paymentBrand,
  String? savedCardId,
}) async {
  try {
    final response = await dio.post(
      '/api/student/payments/checkout',
      data: {
        'amount': amount,
        'currency': currency,
        'payment_brand': paymentBrand ?? 'VISA',
        'platform': Platform.isIOS ? 'iOS' : 'Android',  // ← NEW
      },
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ),
    );

    if (response.statusCode == 200) {
      return PaymentResponse.fromJson(response.data['data']);
    }
    throw Exception('Failed to create checkout');
  } catch (e) {
    print('Checkout error: $e');
    throw e;
  }
}
```

### Step 4: Handle Deep Link Response

```dart
// iOS
if (Platform.isIOS) {
  // Register deep link listener
  FirebaseAppCheck.instance.onTokenChange.listen((token) {
    // Listen for: com.ewangeniuses.ewanapp.payments://checkout?id=...
    handleDeepLink(uri);
  });
}

// Android
if (Platform.isAndroid) {
  // Register deep link listener
  // Listen for: com.ewan_mobile_app.payments://checkout?id=...
  // OR: com.ewangeniuses.ewanapp.payments://checkout?id=...
  handleDeepLink(uri);
}

void handleDeepLink(Uri uri) {
  if (uri.scheme == 'com.ewangeniuses.ewanapp.payments' ||
      uri.scheme == 'com.ewan_mobile_app.payments') {
    final checkoutId = uri.queryParameters['id'];
    verifyPayment(checkoutId);
  }
}
```

---

## Configuration Files

No configuration changes needed! The platform selection is fully dynamic.

The deep link schemes are hardcoded in the service:
- iOS: `com.ewangeniuses.ewanapp.payments`
- Android: `com.ewan_mobile_app.payments`

If you need to change these, update `HyperpayService::generateShopperResultUrl()`:

```php
private function generateShopperResultUrl(?string $platform): ?string
{
    // Customize schemes here
    if ($platform === 'ios') {
        return 'your.custom.ios.scheme://checkout';  // ← Change this
    }
    if ($platform === 'android') {
        return 'your.custom.android.scheme://checkout';  // ← Or this
    }
    return null;
}
```

---

## Troubleshooting

### Issue: Platform parameter not being sent

**Check**:
```php
$request->validate([
    'platform' => 'nullable|string|in:iOS,Android',  // ← Should be present
]);
```

**Solution**: Ensure your Flutter app sends platform parameter in request.

### Issue: Deep link not working

**Check**:
1. Verify platform was sent to backend: Check logs for `platform` field
2. Verify `shopperResultUrl` is being set: Check logs for `shopper_result_url`
3. Verify deep link is registered in native app (iOS Info.plist, Android Manifest)

### Issue: Log shows "unknown platform"

**Cause**: Platform value case mismatch (should be 'iOS' or 'Android', not 'ios' or 'ios')

**Solution**: Check Flutter app sends exact case:
```dart
'platform': Platform.isIOS ? 'iOS' : 'Android',  // ← Correct case
```

---

## Summary

| Aspect | Detail |
|--------|--------|
| **Feature** | Dynamic platform-specific deep linking for HyperPay |
| **Platforms** | iOS (com.ewangeniuses.ewanapp.payments) + Android (com.ewan_mobile_app.payments) |
| **Parameter** | New optional `platform` field in createCheckout request |
| **Values** | 'iOS' or 'Android' (case-sensitive) |
| **Backward Compatible** | ✅ Yes - works with and without platform parameter |
| **Logging** | ✅ Yes - logs platform and URL for debugging |
| **Android Fallback** | ✅ Yes - can listen to both scheme formats |
| **Changes Required** | ❌ None (fully backward compatible, but recommended to update Flutter) |

