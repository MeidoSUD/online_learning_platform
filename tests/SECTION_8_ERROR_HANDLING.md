

================================================================================
SECTION 8: COMPREHENSIVE API ERROR HANDLING & EXCEPTION GUIDE
================================================================================

This section provides Flutter developers with complete error handling patterns
for all authentication and API endpoints, including verification error cases,
validation exceptions, and exception scenarios.

─────────────────────────────────────────────────────────────────────────────
8.1) HTTP STATUS CODES & MEANINGS
─────────────────────────────────────────────────────────────────────────────

200 - OK / Success
  Meaning: Request successful, data returned as expected
  Action: Process response normally, show success UI

201 - Created
  Meaning: Resource created successfully (POST requests)
  Action: Show success message, navigate or refresh list

401 - Unauthorized
  Meaning: Token missing, expired, or invalid
  Action: Clear stored token, redirect to login screen
  Handling:
    if (response.statusCode == 401) {
      SecureStorage.deleteToken();
      Navigator.pushReplacementNamed(context, '/login');
    }

403 - Forbidden
  Meaning: User authenticated but not allowed

404 - Not Found
  Meaning: Resource doesn't exist

422 - Unprocessable Entity (Validation Error)
  Meaning: Invalid data in request
  Structure:
    {
      "message": "The given data was invalid.",
      "errors": {
        "email": ["Email is required"],
        "phone_number": ["Invalid format"]
      }
    }

500 - Internal Server Error
  Meaning: Unexpected server error
  Action: Show generic message, allow retry

503 - Service Unavailable
  Meaning: Server temporarily down
  Action: Show "Try again later"

─────────────────────────────────────────────────────────────────────────────
8.2) PHONE NUMBER VERIFICATION ERRORS
─────────────────────────────────────────────────────────────────────────────

Invalid Phone Format:
  Response (422):
    {
      "success": false,
      "message": "Invalid phone number format. Must be a valid KSA phone number."
    }
  UI: Show "Invalid format. Use: 501234567, 0501234567, or +966501234567"

Phone Already Registered:
  Response (422):
    { "success": false, "message": "Phone number already registered." }
  UI: Show "Phone already registered. Use Login or recover account."

Wrong Verification Code:
  Response (422):
    { "message": "Invalid verification code." }
  UI: Show "Wrong code. Try again or request new code."

Duplicate Phone in Update:
  Response (422):
    {
      "success": false,
      "message": "Phone number already in use by another account."
    }
  UI: Show "Phone in use. Try different number."

─────────────────────────────────────────────────────────────────────────────
8.3) REGISTRATION & LOGIN VALIDATION ERRORS
─────────────────────────────────────────────────────────────────────────────

Missing Required Fields:
  Response (422):
    {
      "errors": {
        "last_name": ["The last name field is required."],
        "phone_number": ["The phone number field is required."]
      }
    }
  UI: Mark missing fields with red border. Disable submit button.

Invalid Email Format:
  Response (422):
    { "errors": { "email": ["Must be valid email address."] } }
  UI: Show "Valid email required (e.g., user@example.com)"

Duplicate Email:
  Response (422):
    { "errors": { "email": ["The email has already been taken."] } }
  UI: Show "Email already registered"

Wrong Login Credentials:
  Response (422):
    {
      "errors": {
        "email": ["The provided credentials are incorrect."]
      }
    }
  UI: Show "Email or password incorrect" (don't reveal which)

Missing Email/Phone at Login:
  Response (422):
    {
      "errors": {
        "email": ["Either email or phone_number must be provided."]
      }
    }
  UI: Show toggle: "Login with Email" / "Login with Phone"

─────────────────────────────────────────────────────────────────────────────
8.4) PASSWORD RESET ERROR SCENARIOS
─────────────────────────────────────────────────────────────────────────────

Email/Phone Not Found:
  Response (404):
    { "success": false, "message": "Email not found in our system." }
  UI: Show "No account found with this email"

Neither Email nor Phone:
  Response (422):
    {
      "success": false,
      "message": "Either email or phone_number must be provided."
    }
  UI: Show "Enter email or phone number"

Invalid Reset Code:
  Response (422):
    { "message": "Invalid verification code." }
  UI: Show "Code incorrect or expired"

Password Mismatch:
  Response (422):
    { "errors": { "new_password": ["Does not match."] } }
  UI: Show "Passwords don't match"

Password Too Weak:
  Response (422):
    { "errors": { "new_password": ["Must be at least 8 characters."] } }
  UI: Show "Min 8 chars (use letters, numbers, symbols)"

─────────────────────────────────────────────────────────────────────────────
8.5) PROFILE UPDATE ERROR SCENARIOS
─────────────────────────────────────────────────────────────────────────────

Missing Authorization Token:
  Response (401):
    { "message": "Unauthenticated." }
  UI: Redirect to login. Show "Session expired"

Expired/Invalid Token:
  Response (401):
    { "message": "Token has expired or is invalid." }
  UI: Force logout. Clear token. Redirect to login.

Invalid Phone Format:
  Response (422):
    {
      "success": false,
      "message": "Invalid phone number format."
    }
  UI: Show error below phone field. Allow retry.

File Too Large:
  Response (422):
    { "errors": { "profile_photo": ["Must not exceed 4MB."] } }
  UI: Show "Image too large (max 4MB)"

Invalid File Type:
  Response (422):
    { "errors": { "profile_photo": ["Must be an image."] } }
  UI: Show "Only images allowed (JPG, PNG)"

─────────────────────────────────────────────────────────────────────────────
8.6) GENERAL EXCEPTION HANDLING PATTERNS
─────────────────────────────────────────────────────────────────────────────

Network/Connection Errors:
  Exception: SocketException, TimeoutException
  Cause: No internet, server unreachable, slow connection
  UI: Show "No connection. Check internet and retry."

Server Error (500, 503):
  Cause: Unexpected error, maintenance, database issue
  UI: Show "Server error. Please try again later."

JSON Parse Error:
  Cause: Invalid JSON (likely 500 error page)
  UI: Show "Server error. Please try again."

Dart Handling Example:
  ```dart
  try {
    final response = await http.post(url).timeout(Duration(seconds: 30));
  } on SocketException {
    showError('No internet connection');
  } on TimeoutException {
    showError('Connection timeout. Try again.');
  } catch (e) {
    showError('An error occurred');
  }
  ```

─────────────────────────────────────────────────────────────────────────────
8.7) COMPLETE ERROR HANDLING IMPLEMENTATION
─────────────────────────────────────────────────────────────────────────────

```dart
class ApiErrorHandler {
  static void handleHttpResponse(http.Response response, 
                                 BuildContext context) {
    if (response.statusCode == 200 || response.statusCode == 201) {
      return; // Success
    }

    try {
      var data = json.decode(response.body);
      
      switch (response.statusCode) {
        case 401:
          SecureStorage.deleteToken();
          Navigator.pushReplacementNamed(context, '/login');
          showSnackBar(context, 'Session expired. Please login again');
          break;
        case 403:
          showSnackBar(context, data['message'] ?? 'Access denied');
          break;
        case 404:
          showSnackBar(context, data['message'] ?? 'Not found');
          break;
        case 422:
          if (data['errors'] != null) {
            (data['errors'] as Map).forEach((field, messages) {
              showFieldError(field, messages[0]);
            });
          } else {
            showSnackBar(context, data['message'] ?? 'Validation error');
          }
          break;
        case >= 500:
          showSnackBar(context, 'Server error. Please try again later.');
          break;
      }
    } catch (e) {
      showSnackBar(context, 'An error occurred');
    }
  }

  static void handleError(dynamic error, BuildContext context) {
    if (error is SocketException) {
      showSnackBar(context, 'No internet connection');
    } else if (error is TimeoutException) {
      showSnackBar(context, 'Request timed out');
    } else {
      showSnackBar(context, 'An error occurred');
    }
  }
}

// Usage in LoginScreen:
void login() async {
  setState(() => isLoading = true);
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'email': emailController.text,
        'password': passwordController.text,
      }),
    ).timeout(Duration(seconds: 30));

    if (response.statusCode == 200) {
      var data = json.decode(response.body);
      await SecureStorage.saveToken(data['token']);
      Navigator.pushReplacementNamed(context, '/home');
    } else {
      ApiErrorHandler.handleHttpResponse(response, context);
    }
  } catch (e) {
    ApiErrorHandler.handleError(e, context);
  } finally {
    setState(() => isLoading = false);
  }
}
```

─────────────────────────────────────────────────────────────────────────────
8.8) ERROR MESSAGE MAPPING & USER-FRIENDLY TRANSLATIONS
─────────────────────────────────────────────────────────────────────────────

Backend Message → User-Friendly Message Mapping:

"The provided credentials are incorrect."
  → "Email or password is incorrect"

"The email has already been taken."
  → "This email is already registered"

"Invalid phone number format. Must be a valid KSA phone number."
  → "Invalid phone format. Use: 501234567"

"Phone number already registered."
  → "This phone is already registered"

"Phone number already in use by another account."
  → "Phone already in use. Try different number"

"The new password confirmation does not match."
  → "Passwords do not match"

"The new password must be at least 8 characters."
  → "Password must be at least 8 characters"

"Unauthenticated."
  → "Please log in to continue"

"Token has expired or is invalid."
  → "Your session has expired. Please login again"

"Please complete your profile first."
  → "Complete your profile setup first"

"Invalid verification code."
  → "Code is incorrect or has expired"

"Email not found in our system."
  → "No account found with this email"

"The profile photo must not be greater than 4MB."
  → "Image is too large (max 4MB)"

"The profile photo must be an image."
  → "Only images allowed (JPG, PNG, etc.)"

================================================================================
CRITICAL FINAL CHECKLIST FOR FLUTTER AI AGENT
================================================================================

Phone Number Handling (KSA Format):
  ✓ Accept ALL formats: 501234567, 0501234567, 966501234567, +966501234567
  ✓ Server normalizes to: +966XXXXXXXXX (with + prefix)
  ✓ SMS API uses: 966XXXXXXXXX (without + prefix)
  ✓ Validate: exactly 9 digits required
  ✓ Show examples in UI
  ✓ Store normalized version in app

Authentication:
  ✓ Store token in Keychain/SecureStorage (NOT SharedPreferences)
  ✓ Include "Authorization: Bearer <token>" in all auth requests
  ✓ On 401: Clear token → Redirect to login
  ✓ On 422: Show field-level validation errors
  ✓ Timeout: 30 seconds for all requests

Verification Codes:
  ✓ Handle both SMS and email codes (6 digits)
  ✓ Show countdown timer for resend (30 seconds)
  ✓ Clear code on failed attempt
  ✓ Show "Code expired" for 422 errors
  ✓ Allow retry without blocking

Password Reset:
  ✓ Support both email and phone reset
  ✓ Separate UI for each method
  ✓ Verify code before password change
  ✓ Validate password strength (8+ chars)
  ✓ Require confirmation match

Profile Updates:
  ✓ Support file uploads (multipart/form-data)
  ✓ Validate before upload (4MB images)
  ✓ Handle duplicate phone error
  ✓ Show success message after save

Error Display:
  ✓ Validation errors → Red border + text
  ✓ Server errors → Snackbar message
  ✓ Network errors → Retry button
  ✓ 401 errors → Force login immediately

Forms:
  ✓ Client-side validation before submit
  ✓ Disable submit if invalid
  ✓ Show loading spinner during request
  ✓ Prevent duplicate submissions

UI/UX:
  ✓ Loading spinners on all operations
  ✓ Success messages 2-3 seconds
  ✓ Error messages dismissible
  ✓ Touch targets 48x48dp minimum
  ✓ Proper RTL for Arabic

Logging:
  ✓ Log all API errors
  ✓ DON'T log tokens/passwords/codes
  ✓ Log status codes and messages
  ✓ Use analytics for critical failures

================================================================================

