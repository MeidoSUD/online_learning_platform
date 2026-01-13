# 🛡️ Exception Handling & Error Response Guide

Comprehensive guide for implementing exception handling across all API controllers to prevent app crashes.

**Date:** January 9, 2026  
**Status:** ✅ Production Ready

---

## 📋 Overview

This guide implements a **consistent error handling pattern** across all API endpoints to:
- ✅ Prevent app crashes from unhandled exceptions
- ✅ Return structured error responses with codes
- ✅ Handle different exception types (Validation, Auth, Database, Network, etc.)
- ✅ Provide Flutter/iOS apps with parseable error data
- ✅ Maintain consistent response format across all endpoints

---

## 🎯 Error Response Format

All error responses follow this consistent structure:

### Standard Error Response
```json
{
  "success": false,
  "code": "ERROR_TYPE",
  "message": "Human readable message",
  "status": 400,
  "errors": {
    "field_name": ["Error message 1", "Error message 2"]
  }
}
```

### Response Structure Breakdown
| Field | Type | Always Included | Description |
|-------|------|-----------------|-------------|
| `success` | boolean | Yes | Always `false` for errors |
| `code` | string | Yes | Machine-readable error code |
| `message` | string | Yes | Human-readable error message |
| `status` | integer | Yes | HTTP status code |
| `errors` | object | No | Field validation errors (validation errors only) |
| `field` | string | No | Specific field name (conflict errors only) |

---

## 📊 Error Types & Codes

### 1. Validation Error (422)
**When:** Input validation fails  
**Code:** `VALIDATION_ERROR`  
**HTTP Status:** 422

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "status": 422,
  "errors": {
    "email": ["validation.unique"],
    "phone_number": ["The phone number field is required."]
  }
}
```

### 2. Authentication Error (401)
**When:** User not authenticated or invalid credentials  
**Code:** `AUTHENTICATION_ERROR`  
**HTTP Status:** 401

```json
{
  "success": false,
  "code": "AUTHENTICATION_ERROR",
  "message": "Invalid email/phone or password",
  "status": 401
}
```

### 3. Authorization Error (403)
**When:** User authenticated but not authorized  
**Code:** `AUTHORIZATION_ERROR`  
**HTTP Status:** 403

```json
{
  "success": false,
  "code": "AUTHORIZATION_ERROR",
  "message": "You do not have permission to perform this action",
  "status": 403
}
```

### 4. Not Found Error (404)
**When:** Resource not found  
**Code:** `NOT_FOUND`  
**HTTP Status:** 404

```json
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "User not found",
  "status": 404
}
```

### 5. Conflict Error (409)
**When:** Duplicate record or unique constraint violation  
**Code:** `CONFLICT`  
**HTTP Status:** 409

```json
{
  "success": false,
  "code": "CONFLICT",
  "message": "Email already exists",
  "status": 409,
  "field": "email"
}
```

### 6. Database Error (500)
**When:** Database query fails  
**Code:** `DATABASE_ERROR`  
**HTTP Status:** 500

```json
{
  "success": false,
  "code": "DATABASE_ERROR",
  "message": "Database error occurred",
  "status": 500
}
```

### 7. Server Error (500)
**When:** General server exception  
**Code:** `SERVER_ERROR`  
**HTTP Status:** 500

```json
{
  "success": false,
  "code": "SERVER_ERROR",
  "message": "An error occurred. Please try again later.",
  "status": 500
}
```

### 8. Network Error (503)
**When:** External service unavailable  
**Code:** `NETWORK_ERROR`  
**HTTP Status:** 503

```json
{
  "success": false,
  "code": "NETWORK_ERROR",
  "message": "Network error. Please check your connection.",
  "status": 503
}
```

---

## 🔧 ApiResponse Trait

A reusable trait provides all error handling methods.

### Location
```
app/Traits/ApiResponse.php
```

### Available Methods

#### 1. Validation Error
```php
// With ValidationException
return $this->validationError($e, 'Custom message');

// With manual errors array
return $this->validationErrorArray(
    ['email' => ['Email already exists']],
    'Validation failed'
);
```

#### 2. Authentication Error
```php
return $this->authError('Invalid credentials');
```

#### 3. Authorization Error
```php
return $this->authorizationError('Permission denied');
```

#### 4. Not Found Error
```php
return $this->notFoundError('User not found');
```

#### 5. Conflict Error
```php
return $this->conflictError('Email already exists', 'email');
```

#### 6. Database Error
```php
return $this->databaseError($exception, 'Database operation failed');
```

#### 7. Server Error
```php
return $this->serverError($exception, 'Something went wrong');
```

#### 8. Network Error
```php
return $this->networkError('Unable to reach service');
```

#### 9. Success Response
```php
return $this->success($data, 'Operation successful', 200);
```

#### 10. Created Response (201)
```php
return $this->created($data, 'Resource created successfully');
```

---

## 💻 Implementation in Controller

### Step 1: Use the Trait
```php
<?php
namespace App\Http\Controllers\API;

use App\Traits\ApiResponse;

class YourController extends Controller
{
    use ApiResponse;
    
    // Now you have access to all error handling methods
}
```

### Step 2: Wrap Methods in Try-Catch
```php
public function register(Request $request)
{
    try {
        // Validate input
        $validated = $request->validate([
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
        ]);

        // Create user
        $user = User::create($validated);

        return $this->created($user, 'User registered successfully');

    } catch (ValidationException $e) {
        return $this->validationError($e, 'Registration validation failed');
    } catch (\Illuminate\Database\QueryException $e) {
        return $this->databaseError($e, 'Registration failed');
    } catch (\Exception $e) {
        return $this->serverError($e, 'Registration failed');
    }
}
```

### Step 3: Handle Different Exception Types
```php
public function someAction(Request $request)
{
    try {
        // Your logic
        
    } catch (ValidationException $e) {
        // Validation errors (field validation)
        return $this->validationError($e);
        
    } catch (AuthenticationException $e) {
        // Auth errors (invalid credentials, not logged in)
        return $this->authError('Invalid credentials');
        
    } catch (AuthorizationException $e) {
        // Authorization errors (user not permitted)
        return $this->authorizationError();
        
    } catch (\Illuminate\Database\QueryException $e) {
        // Database errors
        return $this->databaseError($e);
        
    } catch (\Exception $e) {
        // Any other exception
        return $this->serverError($e);
    }
}
```

---

## 📱 Flutter App Implementation

### Handle Error Responses

```dart
// In your Flutter HTTP client or service

Future<T> handleResponse<T>(Response response, T Function(dynamic) fromJson) async {
  try {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      // Success
      return fromJson(jsonDecode(response.body));
    } else {
      // Error
      final errorData = jsonDecode(response.body);
      final errorCode = errorData['code'] ?? 'UNKNOWN_ERROR';
      final errorMessage = errorData['message'] ?? 'An error occurred';
      
      throw ApiException(
        code: errorCode,
        message: errorMessage,
        statusCode: response.statusCode,
        errors: errorData['errors'],
      );
    }
  } catch (e) {
    throw ApiException(
      code: 'PARSE_ERROR',
      message: 'Failed to parse response',
      statusCode: response.statusCode,
    );
  }
}

// Custom Exception Class
class ApiException implements Exception {
  final String code;
  final String message;
  final int statusCode;
  final Map<String, dynamic>? errors;

  ApiException({
    required this.code,
    required this.message,
    required this.statusCode,
    this.errors,
  });

  @override
  String toString() => 'ApiException: $code - $message (Status: $statusCode)';
}
```

### Handle Different Error Types

```dart
void handleApiError(ApiException exception) {
  switch (exception.code) {
    case 'VALIDATION_ERROR':
      showValidationErrorDialog(exception.errors);
      break;
      
    case 'AUTHENTICATION_ERROR':
      logout();
      showLoginRequired();
      break;
      
    case 'AUTHORIZATION_ERROR':
      showSnackBar('You do not have permission');
      break;
      
    case 'NOT_FOUND':
      showSnackBar('Resource not found');
      break;
      
    case 'CONFLICT':
      showSnackBar('${exception.errors?['field']} already exists');
      break;
      
    case 'DATABASE_ERROR':
      showSnackBar('Server database error. Please try again.');
      break;
      
    case 'NETWORK_ERROR':
      showSnackBar('Network error. Check your connection.');
      break;
      
    default:
      showSnackBar(exception.message);
  }
}

// Show validation errors
void showValidationErrorDialog(Map<String, dynamic>? errors) {
  if (errors == null) return;
  
  String message = 'Please fix the following errors:\n\n';
  errors.forEach((field, errorList) {
    message += '• $field: ${errorList[0]}\n';
  });
  
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: Text('Validation Error'),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text('OK'),
        )
      ],
    ),
  );
}
```

### Usage in UI
```dart
// In your login method
try {
  final response = await authService.login(email, password);
  navigateToHome();
} on ApiException catch (e) {
  handleApiError(e);
} catch (e) {
  showSnackBar('Unexpected error: $e');
}
```

---

## 🚀 AuthController Examples

### Register Method (Implemented)
```php
public function register(Request $request)
{
    try {
        $validated = $request->validate([
            'email' => 'required|email|unique:users',
            // ... other fields
        ]);

        $user = User::create($validated);
        return $this->created($user, 'Registration successful');

    } catch (ValidationException $e) {
        return $this->validationError($e, 'Registration validation failed');
    } catch (\Illuminate\Database\QueryException $e) {
        return $this->databaseError($e, 'Registration failed');
    } catch (\Exception $e) {
        return $this->serverError($e);
    }
}
```

### Login Method (Implemented)
```php
public function login(Request $request)
{
    try {
        $validated = $request->validate([
            'email' => 'nullable|email',
            'password' => 'required',
        ]);

        // Find user and verify
        if (!$user || !Hash::check($request->password, $user->password)) {
            return $this->authError('Invalid credentials');
        }

        $token = $user->createToken('mobile-app-token')->plainTextToken;
        
        return $this->success([
            'user' => $user,
            'token' => $token,
        ], 'Login successful');

    } catch (ValidationException $e) {
        return $this->validationError($e);
    } catch (\Exception $e) {
        return $this->serverError($e);
    }
}
```

---

## 📋 Exception Handling Checklist

For each controller method, ensure:

```
✅ Input validation in try-catch
✅ Validation errors handled
✅ Authentication/Authorization checks
✅ Database operations in try-catch
✅ External service calls in try-catch
✅ All exceptions caught
✅ Proper error codes returned
✅ Logging for debugging
✅ User-friendly messages
✅ Non-blocking operations wrapped separately
```

---

## 🎨 Common Patterns

### Pattern 1: Validation + Database
```php
try {
    $validated = $request->validate([...]);
    
    $record = Model::create($validated);
    
    return $this->created($record);
    
} catch (ValidationException $e) {
    return $this->validationError($e);
} catch (\Exception $e) {
    return $this->serverError($e);
}
```

### Pattern 2: Find or Fail
```php
try {
    $record = Model::findOrFail($id);
    
    return $this->success($record);
    
} catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
    return $this->notFoundError('Record not found');
} catch (\Exception $e) {
    return $this->serverError($e);
}
```

### Pattern 3: Update with Validation
```php
try {
    $record = Model::findOrFail($id);
    
    $validated = $request->validate([...]);
    
    $record->update($validated);
    
    return $this->success($record);
    
} catch (ValidationException $e) {
    return $this->validationError($e);
} catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
    return $this->notFoundError();
} catch (\Exception $e) {
    return $this->serverError($e);
}
```

### Pattern 4: Non-Fatal Operations
```php
try {
    // Main operation
    $result = doMainThing();
    
    // Non-fatal operation (log if fails, don't block response)
    try {
        sendNotification($result);
    } catch (\Exception $e) {
        Log::warning('Non-fatal operation failed: ' . $e->getMessage());
    }
    
    return $this->success($result);
    
} catch (\Exception $e) {
    return $this->serverError($e);
}
```

---

## 🔍 Debugging

### Enable Debug Mode
In `.env`:
```
APP_DEBUG=true
```

In `config/app.php`:
```php
'debug' => env('APP_DEBUG', false),
```

### Check Logs
```bash
tail -f storage/logs/laravel.log
```

### Test with Postman
1. Send request to endpoint
2. Check response `code` field
3. Compare with error type table
4. Verify error message is helpful

---

## ✅ Testing Error Handling

### Test Validation Error
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email"}'

# Expected: 422 VALIDATION_ERROR
```

### Test Auth Error
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}'

# Expected: 401 AUTHENTICATION_ERROR
```

### Test Not Found
```bash
curl http://localhost:8000/api/users/99999 \
  -H "Authorization: Bearer TOKEN"

# Expected: 404 NOT_FOUND
```

---

## 📚 Files Created/Modified

### Created
- `app/Traits/ApiResponse.php` - Exception handling trait with 10+ methods

### Modified
- `app/Http/Controllers/API/AuthController.php` - Register and login with full error handling

### To Be Updated
- All other API controllers (UserController, CourseController, etc.)

---

## 🎯 Next Steps

1. **Update AuthController** ✅ (DONE)
2. **Create ApiResponse Trait** ✅ (DONE)
3. **Update UserController** - IN PROGRESS
4. **Update CourseController** - PENDING
5. **Update BookingController** - PENDING
6. **Update all remaining controllers** - PENDING
7. **Update Flutter app to handle errors** - PENDING

---

## 📞 Usage Summary

### For Developers

```php
use App\Traits\ApiResponse;

class MyController extends Controller {
    use ApiResponse;
    
    public function myMethod(Request $request) {
        try {
            // your code
        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (\Exception $e) {
            return $this->serverError($e);
        }
    }
}
```

### For Flutter Apps

```dart
try {
  final result = await api.call();
  // handle success
} on ApiException catch (e) {
  if (e.code == 'VALIDATION_ERROR') {
    // show validation errors
  } else if (e.code == 'AUTHENTICATION_ERROR') {
    // show login screen
  } else {
    // show generic error
    showSnackBar(e.message);
  }
}
```

---

**Status:** ✅ IMPLEMENTATION STARTED  
**Completed:** AuthController (register, login)  
**Remaining:** All other controllers  
**Created:** January 9, 2026
