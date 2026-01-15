# HyperPay Copy & Pay - Official vs Your Implementation

## Comparison: Official Example vs Your Backend

### Official HyperPay Example (cURL)

```php
$url = "https://eu-test.oppwa.com/v1/checkouts";
$data = "entityId=8a8294174d0595bb014d05d829cb01cd" .
        "&amount=92.00" .
        "&currency=SAR" .
        "&paymentType=DB" .
        "&integrity=true";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
           'Authorization:Bearer OGE4Mjk0MTc0ZDA1OTViYjAxNGQwNWQ4MjllNzAxZDF8OVRuSlBjMm45aA=='));
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$responseData = curl_exec($ch);
```

### Your Implementation (Laravel Http Client)

```php
// In HyperpayService.php
$checkoutPayload = [
    'entityId' => $entityId,
    'amount' => number_format((float)$payload['amount'], 2, '.', ''),
    'currency' => strtoupper($payload['currency']),
    'paymentType' => 'DB', // Debit - immediate capture
];

// ... add optional fields ...

$response = Http::withHeaders($this->headers())
                ->timeout($this->timeout)
                ->asForm()
                ->post($url, $checkoutPayload);
```

---

## ✅ What's Correct (Your Implementation)

| Aspect | Official | Your Code | Status |
|--------|----------|-----------|--------|
| **Endpoint** | `https://eu-test.oppwa.com/v1/checkouts` | ✅ Same | ✅ Correct |
| **Method** | POST | ✅ POST | ✅ Correct |
| **Content-Type** | `application/x-www-form-urlencoded` | ✅ asForm() | ✅ Correct |
| **entityId** | Required | ✅ Included | ✅ Correct |
| **amount** | `92.00` | ✅ Formatted to 2 decimals | ✅ Correct |
| **currency** | `SAR` | ✅ Uppercase | ✅ Correct |
| **paymentType** | `DB` (Debit) | ✅ `'DB'` | ✅ Correct |
| **Authorization** | `Authorization: Bearer TOKEN` | ✅ withHeaders() | ✅ Correct |
| **SSL Verify** | `CURLOPT_SSL_VERIFYPEER, false` | ✅ Built-in (Laravel manages) | ✅ Correct |

---

## ⚠️ What's Different (And Why)

### 1. **`integrity=true` Parameter**

**Official Example**: Has `&integrity=true`

**Your Implementation**: Does NOT include this

**Should You Add It?**

```diff
$checkoutPayload = [
    'entityId' => $entityId,
    'amount' => number_format((float)$payload['amount'], 2, '.', ''),
    'currency' => strtoupper($payload['currency']),
    'paymentType' => 'DB',
+   'integrity' => 'true',  // Add this for checksum validation
];
```

**What it does**: `integrity=true` tells HyperPay to include a checksum for verification. **Optional but recommended** for production.

---

### 2. **`customParameters[3DS2_enrolled]` Parameter**

**Your Implementation**: Includes `customParameters[3DS2_enrolled]=true`

**Official Example**: Does NOT have this

**Is This Good?**

✅ **YES** - This enables 3D Secure authentication for extra security. This is a **best practice** for PCI compliance.

---

### 3. **Error Handling**

**Official Example**:
```php
if(curl_errno($ch)) {
    return curl_error($ch);
}
```

**Your Implementation**:
```php
if (!$response->successful()) {
    Log::error('HyperPay checkout creation failed', [...]);
}
```

✅ **Your version is better** - Uses proper logging instead of returning error strings.

---

## 🎯 Final Recommendation

Your implementation is **better than the official example**. But add the `integrity` parameter for checksum validation:

### Update Your HyperpayService.php

Find this section (around line 120):
```php
// Build HyperPay checkout request
$checkoutPayload = [
    'entityId' => $entityId,
    'amount' => number_format((float)$payload['amount'], 2, '.', ''),
    'currency' => strtoupper($payload['currency']),
    'paymentType' => 'DB', // Debit - immediate capture
];
```

And add `integrity` parameter:
```php
// Build HyperPay checkout request
$checkoutPayload = [
    'entityId' => $entityId,
    'amount' => number_format((float)$payload['amount'], 2, '.', ''),
    'currency' => strtoupper($payload['currency']),
    'paymentType' => 'DB', // Debit - immediate capture
    'integrity' => 'true',   // Request checksum validation (added for security)
];
```

---

## 🔐 Security Comparison

| Feature | Official | Your Code | Notes |
|---------|----------|-----------|-------|
| **Checksum Validation** | ❌ No | ❌ No (recommend adding) | Add `integrity=true` |
| **3D Secure** | ❌ No | ✅ Yes | Your code is more secure |
| **Error Logging** | ❌ Basic | ✅ Detailed | Your code is better |
| **SSL Verification** | ⚠️ Disabled in example | ✅ Enabled | Your code is safer |
| **Input Validation** | ❌ None shown | ✅ Present | Your code validates amount/currency |

---

## 📊 Response Format

Both implementations return the same HyperPay response:

```json
{
  "id": "029FB08233743409981F7CA70294F89D.uat01-vm-tx03",
  "ndc": "...",
  "timestamp": "2026-01-14 12:08:05+0000",
  "result": {
    "code": "000.200.100",
    "description": "success"
  }
}
```

Your backend then:
1. ✅ Extracts the `id` (checkout ID)
2. ✅ Constructs redirect URL: `https://eu-test.oppwa.com/v1/checkouts/{id}/payment.html`
3. ✅ Returns it to Flutter app

---

## 🚀 What Your Implementation Does BETTER

1. ✅ **Uses Laravel Http Client** - More maintainable than raw cURL
2. ✅ **Includes 3D Secure** - Better security than official example
3. ✅ **Proper Error Handling** - Logs errors for debugging
4. ✅ **Input Validation** - Checks required fields
5. ✅ **Configuration-driven** - Uses env variables, not hardcoded values
6. ✅ **Timeout Protection** - Won't hang forever if HyperPay is slow
7. ✅ **Flexible Entity IDs** - Different IDs per card brand (VISA/MASTERCARD/MADA)

---

## 🐛 Potential Issues (And Fixes)

### Issue: Missing `integrity` Parameter
**Current**: No checksum validation
**Fix**: Add `'integrity' => 'true'` to checkout payload

### Issue: No Response Validation
**Current**: Just checks if response is successful (200 status)
**Fix**: Already done - you check `$data['id']` exists

### Issue: Hardcoded Amount/Currency
**Current**: None - you accept from request
**Fix**: Already done in your PaymentController

---

## ✨ Summary

Your implementation is **production-ready** and **better than the official example**. Just add the `integrity` parameter and you're all set!

### Quick Checklist:

- ✅ Correct endpoint (eu-test.oppwa.com)
- ✅ Correct HTTP method (POST)
- ✅ Correct content-type (form data)
- ✅ All required fields (entityId, amount, currency, paymentType)
- ✅ Authorization header
- ✅ 3D Secure enabled (better than official)
- ✅ Error handling (better than official)
- ✅ Error logging (better than official)
- ⚠️ Missing `integrity` parameter (add it)

---

## Final Code Update

Update `app/Services/HyperpayService.php` line ~120:

```php
// Build HyperPay checkout request
$checkoutPayload = [
    'entityId' => $entityId,
    'amount' => number_format((float)$payload['amount'], 2, '.', ''),
    'currency' => strtoupper($payload['currency']),
    'paymentType' => 'DB', // Debit - immediate capture
    'integrity' => 'true',   // Checksum validation - recommended for security
];
```

That's it! Everything else is already correct! 🎉
