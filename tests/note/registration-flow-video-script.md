# Registration Video Script — Phase 1

> Based on `app/Http/Controllers/API/AuthController.php` and `routes/api.php`

---

## Student Registration (3 API calls, ~90 seconds of video)

### Step 1 — Create Account `POST /api/auth/register-student`

The user opens the app and taps "Register as Student". They fill in:

| Field | Required | Note |
|---|---|---|
| `first_name` | Yes | Max 255 chars |
| `last_name` | Yes | Max 255 chars |
| `phone_number` | Yes | Saudi mobile preferred (05XX...) — will be normalized to 966XX |
| `password` | Yes | Minimum 8 characters |
| `email` | No | Optional |
| `gender` | No | `male` / `female` / `other` |
| `nationality` | No | Free text |

*Show user typing their name, entering a Saudi phone number, setting a password, and tapping Submit.*

**What happens behind the scenes:**
- The app sends a POST request to `https://api.yourapp.com/api/auth/register-student` with `Content-Type: application/json`
- Backend normalizes the phone (e.g. `0512345678` → `966512345678`)
- Backend checks: is this phone already registered? If yes → error: "This phone number is already registered"
- Backend creates the user with `role_id = 4` (Student) and `verified = false`
- Backend generates a random 4-digit verification code and sends it via SMS to the phone number
- Backend responds: `{"success": true, "status": "unverified", "user": {"id": 42, "first_name": "...", ...}, ...}`

*Show a success screen: "Account created! Please check your phone for a verification code (SMS)."*

---

### Step 2 — Verify Phone `POST /api/auth/verify`

The user receives an SMS with a 4-digit code. They enter it in the app.

| Field | Required | Note |
|---|---|---|
| `user_id` | Yes | Returned from Step 1 response |
| `code` | Yes | Received via SMS — exactly 4 digits |

*Show SMS notification appearing, user reading the code, and typing it into 4 input boxes in the app. Then they tap "Verify".*

**What happens behind the scenes:**
- The app sends `POST /api/auth/verify` with `{user_id: 42, code: "1234"}`
- Backend compares `code` against `user.verification_code`
- If correct: sets `user.verified = true`, clears the verification code, creates an API authentication token
- Backend responds: `{"message": "Verification successful.", "token": "1|abc123...", "user": {full user object}}`

*Show a success animation: "Phone verified! Welcome to the platform." The app auto-navigates to the main dashboard.*

---

### Step 3 — Resend Code (if needed) `POST /api/auth/resend-code`

If the SMS didn't arrive or the code expired, the user taps "Resend Code".

| Field | Required |
|---|---|
| `user_id` | Yes |

*Show "Didn't receive the code? Resend code" link under the verification screen. User taps it.*

**What happens behind the scenes:**
- Backend generates a NEW 4-digit code, saves it, and sends a fresh SMS
- Responds: `{"message": "Verification code resent."}`
- User can now enter the new code in Step 2

*Show a toast: "Code resent" and the timer resetting.*

---

### After Verification — The student can immediately:
- Browse teachers, subjects, courses
- Book sessions (single or package)
- Make payments via Moyasar
- View their schedule and history
- Request custom orders for teachers

---

## Teacher Registration (same 3 steps + extra setup)

### Step 1 — Create Account `POST /api/auth/register-teacher`

Same as student but ADDITIONAL required/optional fields:

| Field | Required | Note |
|---|---|---|
| `first_name` | Yes | Max 255 chars |
| `last_name` | Yes | Max 255 chars |
| `phone_number` | Yes | Will receive SMS verification code |
| `password` | Yes | Minimum 8 characters |
| `email` | Highly recommended | Will receive verification code via email too |
| `service_id` | Recommended | Choose one of the available services (see below) |
| `certificate` | Highly recommended | Upload file (PDF, JPG, PNG, DOC — max 5MB) |
| `bio` | No | Brief about section (max 2000 chars) |
| `cv` | No | Upload file (PDF, DOC — max 5MB) |
| `gender` | No | `male` / `female` / `other` |
| `nationality` | No | Free text |

*Show the teacher registration screen with a more detailed form. Key differences highlighted:*

**Available Services (pick one at registration):**
1. **Private Lessons** — One-on-one tutoring, set your hourly rate
2. **Language Study** — Teach languages, set your rate
3. **Courses** — Create structured courses with groups

*Show teacher selecting a service, writing their bio, uploading a certificate file (e.g. a diploma PDF), and optionally uploading a CV. Then tapping Submit.*

NOTE: The service is a radio-button choice. After registration, the app will show additional setup screens (subjects, availability, pricing) based on which service was selected.

**What happens behind the scenes:**
- Same phone/email duplicate check as student
- Backend creates `User` with `role_id = 3` (Teacher)
- Backend creates a `UserProfile` record with the bio if provided
- Backend creates a `TeacherServices` record linking the teacher to the chosen service
- Backend uploads the certificate file to `storage/app/public/teacher-certificates/` and saves the path in `attachments` table
- Backend uploads the CV file (if any) to `storage/app/public/teacher-cvs/`
- Verification code sent via BOTH SMS and email (if email provided)
- Response: same format as student

---

### Step 2 — Verify Phone `POST /api/auth/verify`

Identical to student flow — enter the 4-digit SMS or email code.

*Show teacher receiving SMS + email simultaneously, entering the code.*

On successful verification: teacher receives a welcome push notification + SMS with onboarding message.

---

### Step 3 — Resend Code `POST /api/auth/resend-code`

Identical to student flow.

---

### After Verification — The teacher MUST complete these before accepting students:
1. Go to dashboard → complete profile verification (admin reviews certificate)
2. Add subjects you teach (via `POST /api/teacher/subjects`)
3. Set your availability slots (via `POST /api/teacher/availability`)
4. Set your hourly price (via `POST /api/teacher/info`)
5. Add a bank account to receive payouts (via `POST /api/teacher/payment-methods`)

*Note:* The teacher cannot see students or get bookings until the admin verifies their certificate/identity.

---

## Visual suggestions for the video

| Scene | Duration | Content |
|---|---|---|
| Intro | 10s | App logo + "Register in 2 minutes" |
| Student: Create | 20s | Show form fields filling, tap Submit |
| Student: Verify | 15s | SMS arrives, enter code, done |
| Transition | 5s | "Teachers need a few more details" |
| Teacher: Create | 25s | Show extra fields: service selector, certificate upload, bio |
| Teacher: Verify | 10s | Same verify screen |
| Teacher: Next steps | 10s | Dashboard overview: complete profile, add subjects, set schedule |
| Outro | 5s | "Start your journey now!" |

---

## API Reference Card

| Purpose | Method | Endpoint | Auth |
|---|---|---|---|
| Student register | POST | `/api/auth/register-student` | No |
| Teacher register | POST | `/api/auth/register-teacher` | No |
| Unified register | POST | `/api/auth/register` | No (routes by `role_id: 3\|4`) |
| Verify code | POST | `/api/auth/verify` | No |
| Resend code | POST | `/api/auth/resend-code` | No |
| Login | POST | `/api/auth/login` | No (returns token) |
| Password reset | POST | `/api/auth/reset-password` | No |

---

## Auth Code Structure (`AuthController.php`)

- `register()` — Unified endpoint, dispatches to `registerTeacher` or `registerStudent` based on `role_id`
- `registerTeacher()` — Creates user (role_id=3), UserProfile, TeacherServices, uploads certificate/cv, sends SMS+email verification
- `registerStudent()` — Creates user (role_id=4), sends SMS+email verification
- `verifyCode()` — Validates 4-digit code, sets `verified=true`, creates Sanctum token, sends teacher welcome notification
- `resendCode()` — Generates new 4-digit code, re-sends SMS



أهلاً بك في تطبيق ايوان التعلم ، المنصة التعليمية المتكاملة ! أول ما تفتح التطبيق، تقدر تتصفح كل شيء وتدخل كـ 'زائر' وتشوف الخدمات المتاحة. لكن عشان تقدر تحجز حصة، أو تتواصل مع معلّم، أو تستفيد من أي خدمة فعلية، لازم تسجل حسابك.

إذا كان عندك حساب من الأول؟ الموضوع بسيط جداً: اضغط على تسجيل الدخول، واكتب بريدك الإلكتروني أو رقم جوالك، بعدين كلمة المرور، واضغط دخول.. وبس!

طيب، لو أنت مستخدم جديد وتبغى تسجل كطالب؟ اتبع هذه الخطوات البسيطة:
اضغط على 'تسجيل حساب جديد'، واختار 'طالب'.

أول شيء، اكتب اسمك الأول واسم العائلة.
بعدها، أدخل رقم جوالك..
حط كلمة مرور قوية وتكون حافظها، وما تقل عن 8 خانات.


خلاص عبّيت البيانات؟ اضغط على زر التسجيل.


الحين راح تجيك رسالة نصية (SMS)
 على جوالك فيها رمز تفعيل مكون من 4 أرقام.
 كل اللي عليك إنك تاخذ الرمز وتكتبه في الخانات الأربعة اللي تظهر
 قدامك على الشاشة، واضغط 'تفعيل'.
لحظة! لو ما وصلتك الرسالة أو انتهى وقتها؟ لا تشيل هم، بتلاقي رابط تحت مكتوب فيه 'إعادة إرسال الرمز'، اضغط عليه وراح يوصلك رمز جديد فوراً.
 وبكذا مبروك! تفّعل حسابك وتدخل مباشرة على التطبيق وتتصفح الخدمات عشان تبدأ تختار معلمينك وتجدول حصصك.


سجل الحين، وابدأ رحلتك التعليمية معنا