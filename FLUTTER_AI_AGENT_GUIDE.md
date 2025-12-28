================================================================================
FLUTTER AI AGENT PROMPT — QUICK REFERENCE
================================================================================

The comprehensive prompts.txt file has been created for your Flutter AI agent.
Below is a quick overview of what's included:

📋 SECTIONS COVERED:
────────────────────────────────────────────────────────────────────────────

1. LOGIN & AUTHENTICATION
   ✓ Login (email OR phone_number)
   ✓ Register (with SMS verification)
   ✓ Verify code (6-digit OTP)
   ✓ Resend verification code

2. PASSWORD MANAGEMENT
   ✓ Reset password (email OR phone_number)
   ✓ Verify reset code (6-digit OTP)
   ✓ Confirm password reset
   ✓ Change password (logged-in users)

3. PROFILE UPDATES
   ✓ Get user profile
   ✓ Create/complete profile (first-time)
   ✓ Update profile (ongoing)
   ✓ File uploads (photo, resume, certificate)

4. TEACHER-SPECIFIC
   ✓ Update teacher info (pricing, subjects, classes)
   ✓ Complete teacher profile setup

5. SESSION MANAGEMENT
   ✓ Logout (invalidate token)

────────────────────────────────────────────────────────────────────────────

📍 KEY FEATURES:

✅ Flexible Login:
   - Accept email: POST /api/auth/login { "email": "...", "password": "..." }
   - Accept phone: POST /api/auth/login { "phone_number": "...", "password": "..." }
   - Both flows return same response structure

✅ Flexible Password Reset:
   - Reset via email: POST /api/auth/reset-password { "email": "..." }
   - Reset via phone: POST /api/auth/reset-password { "phone_number": "..." }
   - Code sent to appropriate channel

✅ Profile Updates:
   - Basic profile: name, email, phone, bio, language preference
   - File uploads: profile photo, resume (teachers), certificate (teachers)
   - Teacher pricing: hourly rates, group size, subjects, classes

✅ No Breaking Changes:
   - All original response structures preserved
   - Backward compatible with existing client code
   - fcm_token integration for push notifications

────────────────────────────────────────────────────────────────────────────

📝 FOR EACH ENDPOINT, YOU GET:

✓ Purpose description
✓ Request JSON examples
✓ Validation rules
✓ Success response (200)
✓ Error response (422/404)
✓ UI implementation notes

────────────────────────────────────────────────────────────────────────────

🔑 KEY ENDPOINTS SUMMARY:

LOGIN:
  POST /api/auth/login
  Body: { "email": "user@example.com", "password": "pass123", "fcm_token": "..." }
  Response: token + full user data

REGISTER:
  POST /api/auth/register
  Body: { "first_name": "...", "email": "...", "phone_number": "...", "role_id": 3 }
  Response: user + SMS verification sent

VERIFY PHONE (after register):
  POST /api/auth/verify
  Body: { "user_id": 1, "code": "123456" }
  Response: token + verified user

RESET PASSWORD (step 1):
  POST /api/auth/reset-password
  Body: { "email": "..." } OR { "phone_number": "..." }
  Response: code sent to email/phone

RESET PASSWORD (step 2):
  POST /api/auth/verify-reset-code
  Body: { "user_id": 1, "code": "123456" }
  Response: code verified, ready to set new password

RESET PASSWORD (step 3):
  POST /api/auth/confirm-password
  Body: { "user_id": 1, "code": "123456", "new_password": "...", "new_password_confirmation": "..." }
  Response: password reset successfully

CHANGE PASSWORD (logged-in):
  POST /api/auth/change-password
  Headers: Authorization: Bearer <token>
  Body: { "current_password": "...", "new_password": "...", "new_password_confirmation": "..." }
  Response: password updated successfully

UPDATE PROFILE:
  PUT /api/profile/profile/update
  Headers: Authorization: Bearer <token>
  Body: { "first_name": "...", "bio": "...", "profile_photo": <file> }
  Response: updated profile data

LOGOUT:
  POST /api/auth/logout
  Headers: Authorization: Bearer <token>
  Response: logged out successfully

────────────────────────────────────────────────────────────────────────────

🎯 FLUTTER AI AGENT USAGE:

Copy the prompts.txt content into your AI Studio or Chat System.
The prompt includes:
  • Clear endpoint descriptions
  • Request/response examples
  • Validation rules
  • UI implementation guidance
  • Error handling recommendations
  • Complete workflow example

Use this to automatically:
  ✓ Generate update screens
  ✓ Build authentication flows
  ✓ Create password reset dialogs
  ✓ Implement profile editors
  ✓ Handle file uploads
  ✓ Generate validation logic
  ✓ Handle error messages

────────────────────────────────────────────────────────────────────────────

💡 IMPLEMENTATION TIPS:

1. Login Screen:
   - Add toggle: "Email" / "Phone"
   - Show only relevant input based on selection
   - Both options submit to same /api/auth/login endpoint

2. Forgot Password Screen:
   - Add toggle: "Reset via Email" / "Reset via Phone"
   - Show OTP entry after code sent
   - Verify code, then show new password form

3. Profile Screen:
   - Fetch current data with GET /api/profile/profile
   - Pre-fill form with returned data
   - Allow selective updates (user can update only some fields)
   - Handle file uploads with multipart/form-data

4. Settings Screen:
   - Add "Change Password" option for logged-in users
   - Require current password verification
   - Show password strength indicator
   - Log out after password change (optional)

════════════════════════════════════════════════════════════════════════════

Files Modified:
  ✓ prompts.txt — Added comprehensive Flutter AI agent guide
  ✓ AuthController.php — Enhanced login & reset-password for email/phone

Ready to integrate with your Flutter AI agent system!

════════════════════════════════════════════════════════════════════════════
