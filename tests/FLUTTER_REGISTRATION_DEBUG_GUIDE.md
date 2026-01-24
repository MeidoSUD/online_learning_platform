# Flutter Registration 422 Error Debug Guide

## Problem Summary
**Error:** `"password": ["validation.required"]`  
**Status:** 422 Unprocessable Entity

This error means the server received the registration request but **the `password` field is missing or empty**.

---

## Root Causes

### 1. ❌ Missing Password Field in Request Body
The Flutter app is not including the `password` field in the JSON body.

### 2. ❌ Wrong Content-Type Header
- Using `multipart/form-data` instead of `application/json`
- Using `form-urlencoded` instead of `application/json`

### 3. ❌ Password Variable is Null/Empty
The password variable in Flutter is `null` or empty string before sending.

### 4. ❌ Dio Interceptor Stripping Fields
Custom interceptor is removing the `password` field.

### 5. ❌ ngrok Headers Issue
ngrok forwarding might be corrupting headers or body.

---

## Server-Side Validation (What's Required)

```php
// In AuthController.register() - Line 47
$validated = $request->validate([
    'first_name'    => 'required|string|max:255',
    'last_name'     => 'required|string|max:255',
    'email'         => 'required|string|email|unique:users',
    'phone_number'  => 'required|string|max:15',
    'role_id'       => 'required|in:3,4', // 3=teacher, 4=student
    'gender'        => 'nullable|in:male,female,other',
    'nationality'   => 'nullable|string|max:255',
    'password'      => 'required|string|min:8',  // ← MUST BE PRESENT AND MIN 8 CHARS
]);
```

**All required fields:**
- ✅ `first_name` (string, required)
- ✅ `last_name` (string, required)
- ✅ `email` (email, unique, required)
- ✅ `phone_number` (string, max 15, required) - KSA format recommended
- ✅ `role_id` (integer: 3=teacher or 4=student)
- ✅ `password` (string, min 8 characters, **REQUIRED**)
- ⚠️ `gender` (nullable: male, female, other)
- ⚠️ `nationality` (nullable: string)

---

## ✅ Correct Flutter Implementation

### 1. Register Service Setup
```dart
// services/auth_service.dart

import 'package:dio/dio.dart';

class AuthService {
  final Dio _dio;
  
  AuthService(this._dio);

  Future<Map<String, dynamic>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String phoneNumber,
    required String password,
    required int roleId, // 3=teacher, 4=student
    String? gender,
    String? nationality,
    String? fcmToken,
  }) async {
    try {
      // IMPORTANT: Ensure password is not null and has min 8 chars
      if (password.isEmpty || password.length < 8) {
        throw Exception('Password must be at least 8 characters');
      }

      // Build request body as JSON
      final Map<String, dynamic> data = {
        'first_name': firstName.trim(),
        'last_name': lastName.trim(),
        'email': email.trim(),
        'phone_number': phoneNumber.replaceAll(RegExp(r'\D'), ''), // Remove non-digits
        'role_id': roleId,
        'password': password, // ← MUST BE INCLUDED
      };

      // Add optional fields if provided
      if (gender != null && gender.isNotEmpty) {
        data['gender'] = gender;
      }
      if (nationality != null && nationality.isNotEmpty) {
        data['nationality'] = nationality;
      }
      if (fcmToken != null && fcmToken.isNotEmpty) {
        data['fcm_token'] = fcmToken;
      }

      print('📤 Register Request Payload:');
      print('URL: ${_dio.options.baseUrl}/api/auth/register');
      print('Method: POST');
      print('Content-Type: application/json');
      print('Body: $data');

      final response = await _dio.post(
        '/api/auth/register',
        data: data, // Dio will automatically set Content-Type: application/json
        options: Options(
          contentType: Headers.jsonContentType, // ← EXPLICIT JSON CONTENT TYPE
          responseType: ResponseType.json,
        ),
      );

      if (response.statusCode == 201) {
        print('✅ Registration successful');
        return response.data;
      } else {
        throw Exception('Unexpected status code: ${response.statusCode}');
      }
    } on DioException catch (e) {
      print('❌ Registration DioException:');
      print('Status: ${e.response?.statusCode}');
      print('Error: ${e.response?.data}');
      rethrow;
    } catch (e) {
      print('❌ Registration Exception: $e');
      rethrow;
    }
  }
}
```

### 2. Register Screen Usage
```dart
// screens/register_screen.dart

class RegisterScreen extends StatefulWidget {
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final AuthService _authService = AuthService(getDioInstance());
  
  final TextEditingController firstNameController = TextEditingController();
  final TextEditingController lastNameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController phoneController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmPasswordController = TextEditingController();

  int _selectedRole = 4; // 4 = student, 3 = teacher

  @override
  void dispose() {
    firstNameController.dispose();
    lastNameController.dispose();
    emailController.dispose();
    phoneController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  void _handleRegister() async {
    // Validation checks
    if (firstNameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('First name is required')),
      );
      return;
    }

    if (passwordController.text.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Password must be at least 8 characters')),
      );
      return;
    }

    if (passwordController.text != confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Passwords do not match')),
      );
      return;
    }

    try {
      final result = await _authService.register(
        firstName: firstNameController.text,
        lastName: lastNameController.text,
        email: emailController.text,
        phoneNumber: phoneController.text,
        password: passwordController.text, // ← CRITICAL: Must be provided
        roleId: _selectedRole,
        gender: null,
        nationality: null,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Registration successful! Please verify your email.')),
        );
        // Navigate to verification screen
        Navigator.pushNamed(context, '/verify-email', arguments: {
          'user_id': result['user']['id'],
          'email': result['user']['email'],
        });
      }
    } on DioException catch (e) {
      if (mounted) {
        final errorMessage = e.response?.data['message'] ?? 'Registration failed';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMessage), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Register')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: firstNameController,
              decoration: InputDecoration(
                labelText: 'First Name',
                hintText: 'Enter your first name',
              ),
            ),
            SizedBox(height: 16),
            TextField(
              controller: lastNameController,
              decoration: InputDecoration(
                labelText: 'Last Name',
                hintText: 'Enter your last name',
              ),
            ),
            SizedBox(height: 16),
            TextField(
              controller: emailController,
              decoration: InputDecoration(
                labelText: 'Email',
                hintText: 'Enter your email',
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            SizedBox(height: 16),
            TextField(
              controller: phoneController,
              decoration: InputDecoration(
                labelText: 'Phone Number',
                hintText: '+966 50 123 4567',
              ),
              keyboardType: TextInputType.phone,
            ),
            SizedBox(height: 16),
            TextField(
              controller: passwordController,
              decoration: InputDecoration(
                labelText: 'Password',
                hintText: 'Min 8 characters',
              ),
              obscureText: true,
            ),
            SizedBox(height: 16),
            TextField(
              controller: confirmPasswordController,
              decoration: InputDecoration(
                labelText: 'Confirm Password',
                hintText: 'Re-enter your password',
              ),
              obscureText: true,
            ),
            SizedBox(height: 24),
            ElevatedButton(
              onPressed: _handleRegister,
              child: Text('Register'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 🔍 Debugging Steps

### Step 1: Enable Request Logging in Flutter
```dart
// main.dart

void main() {
  final dio = Dio(
    BaseOptions(
      baseUrl: 'https://your-domain.ngrok-free.dev',
      connectTimeout: Duration(seconds: 30),
      receiveTimeout: Duration(seconds: 30),
    ),
  );

  // Add logging interceptor
  dio.interceptors.add(
    LoggingInterceptor(), // Log all requests/responses
  );

  runApp(MyApp());
}

class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    print('━━━━━━━━━ REQUEST ━━━━━━━━━');
    print('URL: ${options.uri}');
    print('Method: ${options.method}');
    print('Headers: ${options.headers}');
    print('Body: ${options.data}');
    print('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    super.onRequest(options, handler);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    print('━━━━━━━━━ RESPONSE ━━━━━━━━━');
    print('Status: ${response.statusCode}');
    print('Body: ${response.data}');
    print('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    super.onResponse(response, handler);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    print('━━━━━━━━━ ERROR ━━━━━━━━━');
    print('Status: ${err.response?.statusCode}');
    print('Body: ${err.response?.data}');
    print('Message: ${err.message}');
    print('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    super.onError(err, handler);
  }
}
```

### Step 2: Check Network Tab in Postman
```
POST /api/auth/register HTTP/1.1
Host: your-domain.ngrok-free.dev
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone_number": "+966501234567",
  "role_id": 4,
  "password": "SecurePassword123"
}
```

### Step 3: Test with cURL
```bash
curl -X POST https://your-domain.ngrok-free.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "+966501234567",
    "role_id": 4,
    "password": "SecurePassword123"
  }'
```

---

## 🔧 Common Fixes

| Issue | Solution |
|-------|----------|
| **Password field missing** | Ensure `passwordController.text` is not empty before calling `register()` |
| **Wrong Content-Type** | Set `contentType: Headers.jsonContentType` in Dio options |
| **Null password variable** | Check password field in form is bound to controller |
| **Form submission without validation** | Validate all required fields before API call |
| **ngrok tunnel issues** | Check ngrok is running: `ngrok http 8000` |
| **Interceptor stripping fields** | Review custom Dio interceptors - ensure they're not modifying body |

---

## 📋 Checklist

Before sending registration request:

- [ ] Password field has value (not null, not empty)
- [ ] Password is at least 8 characters
- [ ] All required fields have values (first_name, last_name, email, phone_number, role_id)
- [ ] Phone number is properly formatted (digits only or with country code)
- [ ] Email is valid format
- [ ] Content-Type header is `application/json`
- [ ] Dio is using `post()` method with JSON data (not `postUri()` or form-data)
- [ ] ngrok tunnel is active and reachable
- [ ] Server is running (check with `php artisan serve`)

---

## ✅ Expected Success Response

```json
{
  "success": true,
  "code": "REGISTRATION_SUCCESS",
  "message": "Verification code sent. Please verify via SMS or email.",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "+966501234567",
    "gender": null,
    "role_id": 4
  },
  "sms_response": {
    "message": "SMS sent successfully"
  }
}
```

---

## 🆘 Still Having Issues?

### Enable Server-Side Debug Logging

Add this to the beginning of `AuthController.register()`:

```php
public function register(Request $request)
{
    // Log raw request
    Log::info('Register request received', [
        'all_input' => $request->all(),
        'headers' => $request->headers->all(),
        'content_type' => $request->header('Content-Type'),
    ]);

    try {
        $validated = $request->validate([
            'first_name'    => 'required|string|max:255',
            'last_name'     => 'required|string|max:255',
            'email'         => 'required|string|email|unique:users',
            'phone_number'  => 'required|string|max:15',
            'role_id'       => 'required|in:3,4',
            'gender'        => 'nullable|in:male,female,other',
            'nationality'   => 'nullable|string|max:255',
            'password'      => 'required|string|min:8',
        ]);

        Log::info('Register validation passed', [
            'validated_data' => $validated,
        ]);

        // ... rest of code
    }
}
```

Then check logs at: `storage/logs/laravel.log`

---

## 📞 Quick Support Summary

**Your error means:** The server didn't receive the password field in the request body.

**Most likely cause:** Flutter app is not including password in the JSON payload.

**Quick fix:** 
1. Check password TextEditingController is not null
2. Ensure Dio is using `application/json` content type
3. Add logging interceptor to see what's being sent
4. Test with cURL to verify server-side validation works
