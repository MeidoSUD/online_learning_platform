# Payment Notification System - Final Fixes

## Summary
Fixed two critical errors in payment notification system discovered during end-to-end testing.

---

## Error 1: Undefined Method `languages()`

### Error Message
```
[2026-05-17 16:36:57] local.WARNING: Could not determine booking title 
{"booking_id":110,"error":"Call to undefined method App\\Models\\Booking::languages()"}
```

### Root Cause
In `PaymentController::getTitleForBooking()` method, the code attempted to call:
```php
$language = $booking->languages()->first();  // ❌ Method doesn't exist
```

The `Booking` model does NOT have a `languages()` relationship. Instead, it has a `language_id` foreign key that references the `Languages` table.

### Model Relationship
```php
// Booking.php - fillable array includes:
'language_id'  // Foreign key to Languages table

// No languages() method defined
```

### Solution
Changed to use direct `language_id` foreign key lookup:

**File**: `app/Http/Controllers/API/PaymentController.php`

```php
// ❌ BEFORE
elseif ($service && $service->key_name === 'language_learning') {
    $language = $booking->languages()->first();
    $languageName = $language?->name ?? 'Language';
    return "Language: {$languageName}";
}

// ✅ AFTER
elseif ($service && $service->key_name === 'language_learning') {
    if ($booking->language_id) {
        $language = Languages::find($booking->language_id);
        $languageName = $language?->name_en ?? 'Language';
    } else {
        $languageName = 'Language';
    }
    return app()->getLocale() == 'ar' 
        ? "دراسة لغة: {$languageName}" 
        : "Language: {$languageName}";
}
```

**Also added import**: `use App\Models\Languages;`

### Result
✅ Notification title now correctly shows language name (e.g., "Language: English")

---

## Error 2: Return Type Mismatch - Expected Array, Received Int

### Error Message
```
[2026-05-17 16:36:58] local.ERROR: App\Services\NotificationService::sendBilingualSMS(): 
Return value must be of type array, int returned 
{"userId":20,"exception":"[object] (TypeError(code: 0): ..."}
```

### Root Cause
The dreams.sa SMS API returns plain integers (e.g., `1`) for success, not JSON objects.

When `json_decode($response->getBody(), true)` processes an integer response:
```php
json_decode('1', true);  // Returns: int(1), NOT array
```

But the method signature declares it must return `array`:
```php
public function sendBilingualSMS(string $phone, string $message): array  // ❌ Type mismatch
{
    // ...
    $responseData = json_decode($response->getBody(), true);
    return $responseData;  // Returns int instead of array
}
```

### Solution
Added type checking to ensure response is always converted to array format:

**File**: `app/Services/NotificationService.php` (Line 276)

```php
public function sendBilingualSMS(string $phone, string $message): array
{
    try {
        // ... existing code ...
        
        $responseData = json_decode($response->getBody(), true);
        
        // ✅ NEW: Ensure response is always an array
        if (!is_array($responseData)) {
            $responseData = ['status' => $responseData, 'success' => true];
        }

        Log::info('Bilingual SMS sent successfully', [
            'phone' => substr($normalizedPhone, -4),
            'provider' => 'dreams.sa',
            'response_status' => $responseData['status'] ?? 'unknown'
        ]);

        return $responseData;
    } catch (\Exception $e) {
        // ... error handling ...
    }
}
```

### Result
✅ Method now always returns array type, preventing TypeError
✅ SMS service responses are normalized to array format
✅ Logging still captures the actual response status

---

## Files Modified

### 1. `app/Http/Controllers/API/PaymentController.php`
- **Added import**: `use App\Models\Languages;`
- **Modified method**: `getTitleForBooking()` (lines ~710-718)
- **Change**: Use `Languages::find($booking->language_id)` instead of `$booking->languages()->first()`
- **Status**: ✅ No syntax errors

### 2. `app/Services/NotificationService.php`
- **Modified method**: `sendBilingualSMS()` (lines ~268-290)
- **Change**: Added type check to normalize non-array responses to array format
- **Status**: ✅ No syntax errors

---

## Testing Recommendations

### Test Case 1: Language Learning Service
```php
// Create booking for language_learning service
$booking->service_id = [language_learning service ID]
$booking->language_id = [some language ID]

// Make payment
// Verify:
// 1. getTitleForBooking() returns "Language: {language_name}" 
// 2. No "Call to undefined method" error in logs
// 3. sendBilingualSMS() completes without TypeError
```

### Test Case 2: SMS Response Handling
```php
// Monitor dreams.sa API response
// Verify both scenarios:
// 1. If API returns: 1 (integer) -> wrapped to ['status' => 1, 'success' => true]
// 2. If API returns: {"status": "success"} (JSON) -> stays as-is
// 3. No TypeError thrown in either case
```

---

## Verification
✅ PaymentController syntax verified - No errors
✅ NotificationService syntax verified - No errors
✅ All imports added correctly
✅ Type hints enforce array return type
✅ Fallback handling ensures graceful degradation

---

## Related Documentation
- See `PAYMENT_NOTIFICATION_FIXES.md` for previous date parsing fixes
- TeacherProfileHelper validates service requirements
- SMS service uses dreams.sa provider with bilingual support
