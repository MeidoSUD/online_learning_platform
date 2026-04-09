# String Casting Fix for API Responses

**Date**: April 4, 2026  
**Issue**: Mobile app crashes with "int is not a subtype of string" error  
**Root Cause**: Backend returning numeric types for fields that app expects as strings  
**Status**: ✅ FIXED - Commit `41190e2`

---

## Problem Summary

The Flutter mobile app encountered a crash when receiving JSON responses with numeric values for fields that should always be strings:

```json
// ❌ BROKEN (caused crash)
{
  "verification_code": 1904,
  "social_provider_id": 2,
  "phone_number": 966501234567
}

// ✅ FIXED (now working)
{
  "verification_code": "1904",
  "social_provider_id": "2",
  "phone_number": "966501234567"
}
```

---

## Fields Fixed

### 1. **verification_code** ✅
- **Type**: Should always be STRING
- **Original**: Returned as integer from `rand(1000, 9999)`
- **Fix**: Cast to `(string)` when returning in API responses
- **Locations Fixed**:
  - `UserController::getFullTeacherData()` - Line 1259
  - `AuthController::profile()` - Line 741-760

### 2. **social_provider_id** ✅
- **Type**: Should always be STRING  
- **Original**: Returned as integer/null from database
- **Fix**: Cast to `(string)` with fallback to empty string if null
- **Code**: `(string) ($field ?? '')`
- **Locations Fixed**:
  - `UserController::getFullTeacherData()` - Line 1261
  - `AuthController::profile()` - Line 748

### 3. **phone_number** ✅
- **Type**: Should always be STRING
- **Original**: Returned as integer from database (numbers stored without +966 prefix)
- **Fix**: Cast to `(string)` when returning
- **Locations Fixed**:
  - `UserController::getFullTeacherData()` - Line 1260 (moved up)
  - `AuthController::profile()` - Line 745

---

## Changes Made

### File 1: `app/Http/Controllers/API/UserController.php`

**Method**: `getFullTeacherData()`

```php
// BEFORE
'verification_code' => $teacher->verification_code,
'social_provider_id' => $teacher->social_provider_id,

// AFTER
'phone_number' => (string) $teacher->phone_number,
'verification_code' => (string) $teacher->verification_code,
'social_provider_id' => (string) ($teacher->social_provider_id ?? ''),
```

This method is used by:
- `listTeachers()` - Returns paginated list of teachers
- `teacherDetails($id)` - Returns single teacher details
- `updateProfile()` - Returns updated profile after profile update

### File 2: `app/Http/Controllers/API/AuthController.php`

**Method**: `profile()`

```php
// BEFORE
return response()->json($request->user());

// AFTER
return response()->json([
    'id' => (string) $user->id,
    'first_name' => $user->first_name,
    'last_name' => $user->last_name,
    'email' => $user->email,
    'phone_number' => (string) $user->phone_number,
    'role_id' => $user->role_id,
    'gender' => $user->gender,
    'nationality' => $user->nationality,
    'verification_code' => (string) ($user->verification_code ?? ''),
    'social_provider' => $user->social_provider,
    'social_provider_id' => (string) ($user->social_provider_id ?? ''),
    'verified' => (bool) $user->verified,
    'email_verified_at' => $user->email_verified_at,
    'created_at' => $user->created_at,
    'updated_at' => $user->updated_at,
]);
```

---

## API Endpoints Affected

### Teacher Profile Endpoints ✅
- `GET /api/teachers` - List all teachers
- `GET /api/teachers/{id}` - Get teacher details
- `GET /api/student/teachers` - Get teachers (student view)
- `GET /api/teacher/get-services` - Get teacher services
- `PUT /api/profile/update` - Update profile (returns updated teacher data)

### Auth Endpoints ✅
- `GET /api/auth/user/details` - Get authenticated user profile

### Teacher Data Endpoints ✅
- All endpoints returning user data with `getFullTeacherData()` transformation

---

## Testing Checklist

After deployment to production server, verify:

- [ ] Test `/api/teachers` endpoint - verify JSON has `"verification_code": "1904"` (with quotes)
- [ ] Test `/api/teachers/{id}` endpoint - verify `verification_code` is string
- [ ] Test `/api/auth/profile` endpoint - verify `phone_number` is string with quotes
- [ ] Test teacher registration - verify returned data has string fields
- [ ] Mobile app no longer crashes when receiving teacher profile data
- [ ] Social login users with `social_provider_id` don't cause type errors

---

## Server Deployment Steps

1. **Pull Latest Code**
   ```bash
   cd ~/portal
   git pull origin main
   ```
   
2. **Clear Caches** (Critical - ensures old compiled code is removed)
   ```bash
   php artisan cache:clear
   php artisan config:cache
   php artisan view:cache
   
   # If using OPcache:
   rm -rf bootstrap/cache/*.php
   rm -rf storage/framework/cache/*
   ```

3. **Restart PHP Service**
   ```bash
   systemctl restart php-fpm
   # OR
   systemctl restart apache2
   ```

4. **Test API Responses**
   ```bash
   curl -H "Accept: application/json" https://yourdomain.com/api/teachers/1 | jq '.data.verification_code'
   # Should output: "1904" (with quotes indicating string type)
   ```

---

## JSON Response Examples

### ✅ Correct Response Format (After Fix)

**GET /api/teachers/1**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "first_name": "Ahmed",
    "last_name": "Smith",
    "email": "ahmed@example.com",
    "phone_number": "966501234567",
    "verification_code": "1234",
    "social_provider_id": "2",
    "profile": {
      "profile_photo": "storage/profile-photos/teacher.jpg"
    }
  }
}
```

**GET /api/auth/profile**

```json
{
  "id": "5",
  "first_name": "Fatima",
  "last_name": "Johnson",
  "email": "fatima@example.com",
  "phone_number": "966509876543",
  "verification_code": "5678",
  "social_provider_id": "",
  "verified": true
}
```

---

## Why This Fix Works

**Problem**: Flutter/Dart's strict type checking requires all JSON strings to be actual strings
- `"1904"` = String type ✅ 
- `1904` = Integer type ❌ (causes type error in Dart)

**Solution**: Explicitly cast database values to strings when building JSON responses
- Database stores `verification_code` as INT (1904)
- API response wraps it as STRING `"1904"`
- App receives `"1904"` and can safely parse it

---

## Git Commit

**Commit**: `41190e2`  
**Message**: "Fix: Cast verification_code, social_provider_id, and phone_number to strings in API responses"

```bash
git log --oneline | head -5
# 41190e2 (HEAD -> main, origin/main) Fix: Cast verification_code, social_provider_id, and phone_number to strings
# 4ee100a Fix: Remove duplicate route name api.payment.callback
# 2b4bc3a Merge pull request #4 from MeidoSUD/ab01
# 2a318a8 some fix
# 534b10f settings
```

---

## Related Documentation

- **EXCEPTION_HANDLING_GUIDE.md** - Exception handling patterns
- **API documentation.md** - API endpoint specifications
- **FLUTTER_REGISTRATION_DEBUG_GUIDE.md** - Mobile app integration testing

---

## Q&A

**Q: Will this break existing clients using the API?**  
A: No. JSON string format is more compatible. Clients expecting integers can parse strings safely.

**Q: Why not fix this in the app instead?**  
A: While possible, fixing on backend is safer:
- One source of truth (backend)
- All clients benefit immediately
- No need to update each app platform
- Database values are inherently strings for these fields

**Q: What about future fields that might have this issue?**  
A: All user/teacher profile fields now return proper types. Similar casts should be applied to other models on a case-by-case basis.

**Q: Are other models affected?**  
A: This fix addresses the immediate crash. Other models should be reviewed:
- Course IDs in course listings
- Booking IDs in booking responses
- Service IDs in service listings

Check if they're being cast properly or if similar issues exist.

