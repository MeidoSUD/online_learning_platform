<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use App\Http\Controllers\API\UserController;
use App\Services\FirebaseNotificationService;
use App\Helpers\PhoneHelper;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\VerificationCodeMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\Attachment;
use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\UserProfile;
use App\Models\TeacherServices;
use App\Traits\ApiResponse;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * @OA\Get(
     *     path="/api/",
     *     summary="Get all ",
     *     tags={""},
     *     @OA\Response(
     *         response=200,
     *         description="List of "
     *     )
     * )
     */
    // Register - Comprehensive error handling
    /**
     * Unified registration endpoint - routes to teacher or student based on role_id
     * This is the backward-compatible endpoint used in existing clients
     * 
     * @OA\Post(
     *     path="/api/auth/register",
     *     summary="Register user (teacher or student)",
     *     tags={"Auth"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(type="object",
     *             @OA\Property(property="first_name", type="string"),
     *             @OA\Property(property="last_name", type="string"),
     *             @OA\Property(property="email", type="string", format="email"),
     *             @OA\Property(property="phone_number", type="string"),
     *             @OA\Property(property="role_id", type="integer", enum={3,4}),
     *             @OA\Property(property="password", type="string", format="password"),
     *             @OA\Property(property="service_id", type="integer"),
     *             @OA\Property(property="bio", type="string"),
     *             @OA\Property(property="certificate", type="string", format="binary"),
     *             @OA\Property(property="cv", type="string", format="binary")
     *         )
     *     ),
     *     @OA\Response(response=201, description="User registered successfully"),
     *     @OA\Response(response=409, description="User already registered"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function register(Request $request)
    {
        // Route to appropriate registration function based on role_id
        $roleId = $request->input('role_id');
        
        if ($roleId == 3) {
            return $this->registerTeacher($request);
        } elseif ($roleId == 4) {
            return $this->registerStudent($request);
        } else {
            return response()->json([
                'success' => false,
                'code' => 'INVALID_ROLE',
                'status' => 'invalid_input',
                'message_en' => 'Invalid role. Use 3 for teacher or 4 for student.',
                'message_ar' => 'دور غير صالح. استخدم 3 للمعلم أو 4 للطالب.',
            ], 422);
        }
    }

    /**
     * Teacher Registration
     * 
     * Registers a teacher with additional data:
     * - service_id: Saved in teacher_services table
     * - certificate: File saved in attachments table
     * - cv: File saved in attachments table
     * - bio: Saved in user_profiles table
     * 
     * @OA\Post(
     *     path="/api/auth/register-teacher",
     *     summary="Register as a teacher",
     *     tags={"Auth"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(type="object",
     *             @OA\Property(property="first_name", type="string"),
     *             @OA\Property(property="last_name", type="string"),
     *             @OA\Property(property="email", type="string", format="email"),
     *             @OA\Property(property="phone_number", type="string"),
     *             @OA\Property(property="password", type="string", format="password"),
     *             @OA\Property(property="service_id", type="integer", description="Service ID (1=private_lessons, 2=language_study, 3=courses, 4=language_study)"),
     *             @OA\Property(property="bio", type="string", description="Teacher bio/about"),
     *             @OA\Property(property="certificate", type="string", format="binary", description="Certificate file (PDF, image, etc)"),
     *             @OA\Property(property="cv", type="string", format="binary", description="CV file (PDF, etc)"),
     *             @OA\Property(property="gender", type="string", enum={"male", "female", "other"}),
     *             @OA\Property(property="nationality", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Teacher registered successfully"),
     *     @OA\Response(response=409, description="Teacher already registered"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function registerTeacher(Request $request)
    {
        try {
            Log::info('Teacher registration request received', [
                'has_service_id' => $request->filled('service_id'),
                'has_certificate' => $request->hasFile('certificate'),
                'has_cv' => $request->hasFile('cv'),
                'has_bio' => $request->filled('bio'),
            ]);

            // Validate teacher-specific input
            $validated = $request->validate([
                'first_name'    => 'required|string|max:255',
                'last_name'     => 'required|string|max:255',
                'email'         => 'nullable|string|email',
                'phone_number'  => 'required|string',
                'password'      => 'required|string|min:8',
                'gender'        => 'nullable|in:male,female,other',
                'nationality'   => 'nullable|string|max:255',
                'service_id'    => 'nullable|exists:services,id',
                'bio'           => 'nullable|string|max:2000',
                'certificate'   => 'nullable|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:5120', // 5MB
                'cv'            => 'nullable|file|mimes:pdf,doc,docx|max:5120', // 5MB
            ]);

            // Check if email already exists
            if ($request->filled('email')) {
                $existingByEmail = User::where('email', $validated['email'])->first();
                if ($existingByEmail) {
                    Log::warning('Teacher registration - email already exists', [
                        'email' => $validated['email'],
                    ]);
                    
                    return response()->json([
                        'success' => false,
                        'code' => 'ALREADY_REGISTERED',
                        'status' => 'already_registered',
                        'message_en' => 'This email is already registered. Please log in or use a different email.',
                        'message_ar' => 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد إلكتروني مختلف.',
                        'field' => 'email'
                    ], 409);
                }
            }

            // Normalize and check phone
            $normalizedPhone = PhoneHelper::normalize($request->phone_number);
            
            if (!$normalizedPhone) {
                Log::warning('Teacher registration - failed to normalize phone', [
                    'phone_input' => $request->phone_number,
                ]);
                
                return response()->json([
                    'success' => false,
                    'code' => 'INVALID_PHONE',
                    'status' => 'invalid',
                    'message_en' => 'Invalid phone number format.',
                    'message_ar' => 'صيغة رقم الهاتف غير صحيحة.',
                    'field' => 'phone_number'
                ], 422);
            }

            $existingByPhone = User::where('phone_number', $normalizedPhone)->first();
            if ($existingByPhone) {
                Log::warning('Teacher registration - phone already exists', [
                    'phone' => $normalizedPhone,
                ]);
                
                return response()->json([
                    'success' => false,
                    'code' => 'ALREADY_REGISTERED',
                    'status' => 'already_registered',
                    'message_en' => 'This phone number is already registered. Please log in or use a different phone number.',
                    'message_ar' => 'رقم الهاتف هذا مسجل بالفعل. يرجى تسجيل الدخول أو استخدام رقم هاتف مختلف.',
                    'field' => 'phone_number'
                ], 409);
            }

            DB::beginTransaction();

            $verification_code = rand(1000, 9999);
            
            // Create teacher user
            $user = User::create([
                'first_name'    => $validated['first_name'],
                'last_name'     => $validated['last_name'],
                'email'         => $validated['email'],
                'phone_number'  => $normalizedPhone,
                'gender'        => $validated['gender'] ?? null,
                'nationality'   => $validated['nationality'] ?? null,
                'password'      => Hash::make($validated['password']),
                'role_id'       => 3, // Teacher
                'verified'      => false,
                'verification_code' => $verification_code,
            ]);

            Log::info('Teacher user created', ['user_id' => $user->id]);

            // Create user profile with bio
            if ($request->filled('bio')) {
                UserProfile::create([
                    'user_id' => $user->id,
                    'bio' => $validated['bio'],
                    'verified' => false,
                ]);
                Log::info('Teacher profile created with bio', ['user_id' => $user->id]);
            }

            // Add service if provided
            if ($request->filled('service_id')) {
                TeacherServices::create([
                    'teacher_id' => $user->id,
                    'service_id' => $validated['service_id'],
                ]);
                Log::info('Teacher service added', [
                    'user_id' => $user->id,
                    'service_id' => $validated['service_id']
                ]);
            }

            // Handle certificate upload
            if ($request->hasFile('certificate')) {
                try {
                    $certificateFile = $request->file('certificate');
                    $certificatePath = $certificateFile->store('teacher-certificates', 'public');
                    
                    Attachment::create([
                        'user_id' => $user->id,
                        'type' => 'certificate',
                        'file_path' => $certificatePath,
                        'file_name' => $certificateFile->getClientOriginalName(),
                        'file_size' => $certificateFile->getSize(),
                        'mime_type' => $certificateFile->getMimeType(),
                    ]);
                    
                    Log::info('Teacher certificate uploaded', [
                        'user_id' => $user->id,
                        'file_path' => $certificatePath
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to upload certificate', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage()
                    ]);
                    // Don't fail registration if file upload fails
                }
            }

            // Handle CV upload
            if ($request->hasFile('cv')) {
                try {
                    $cvFile = $request->file('cv');
                    $cvPath = $cvFile->store('teacher-cvs', 'public');
                    
                    Attachment::create([
                        'user_id' => $user->id,
                        'type' => 'cv',
                        'file_path' => $cvPath,
                        'file_name' => $cvFile->getClientOriginalName(),
                        'file_size' => $cvFile->getSize(),
                        'mime_type' => $cvFile->getMimeType(),
                    ]);
                    
                    Log::info('Teacher CV uploaded', [
                        'user_id' => $user->id,
                        'file_path' => $cvPath
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to upload CV', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage()
                    ]);
                    // Don't fail registration if file upload fails
                }
            }

            DB::commit();

            // Send verification code
            $smsPhone = PhoneHelper::normalizeForSMS($normalizedPhone);
            try {
                $this->sendVerificationSMS($smsPhone, $verification_code);
            } catch (\Exception $e) {
                Log::warning('Failed to send SMS', ['error' => $e->getMessage()]);
            }

            try {
                Mail::to($user->email)->send(new VerificationCodeMail($user, $verification_code, 'register'));
            } catch (\Exception $e) {
                Log::warning('Failed to send verification email', ['error' => $e->getMessage()]);
            }

            // Same response structure (backward compatible)
            $user_response = [
                "id" => $user->id,
                "first_name" => $user->first_name,
                "last_name" => $user->last_name,
                "email" => $user->email,
                "phone_number" => $user->phone_number,
                "gender" => $user->gender,
                "role_id" => $user->role_id,
            ];

            return response()->json([
                'success' => true,
                'code' => 'REGISTRATION_SUCCESS',
                'status' => 'unverified',
                'message_en' => 'Teacher registration successful. Verification code sent via SMS and email.',
                'message_ar' => 'تم تسجيل المعلم بنجاح. تم إرسال رمز التحقق عبر الرسائل النصية والبريد الإلكتروني.',
                'user' => $user_response,
            ], 201);

        } catch (ValidationException $e) {
            Log::warning('Teacher registration validation failed', [
                'errors' => $e->errors(),
            ]);
            
            return response()->json([
                'success' => false,
                'code' => 'VALIDATION_ERROR',
                'status' => 'invalid_input',
                'message_en' => 'Please check your input and try again.',
                'message_ar' => 'يرجى التحقق من مدخلاتك والمحاولة مرة أخرى.',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Teacher registration error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'code' => 'REGISTRATION_ERROR',
                'status' => 'error',
                'message_en' => 'An error occurred during registration. Please try again later.',
                'message_ar' => 'حدث خطأ أثناء التسجيل. يرجى المحاولة لاحقًا.',
            ], 500);
        }
    }

    /**
     * Student Registration
     * 
     * Registers a student with basic information only
     * 
     * @OA\Post(
     *     path="/api/auth/register-student",
     *     summary="Register as a student",
     *     tags={"Auth"},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(type="object",
     *             @OA\Property(property="first_name", type="string"),
     *             @OA\Property(property="last_name", type="string"),
     *             @OA\Property(property="email", type="string", format="email"),
     *             @OA\Property(property="phone_number", type="string"),
     *             @OA\Property(property="password", type="string", format="password"),
     *             @OA\Property(property="gender", type="string", enum={"male", "female", "other"}),
     *             @OA\Property(property="nationality", type="string")
     *         )
     *     ),
     *     @OA\Response(response=201, description="Student registered successfully"),
     *     @OA\Response(response=409, description="Student already registered"),
     *     @OA\Response(response=422, description="Validation error")
     * )
     */
    public function registerStudent(Request $request)
    {
        try {
            Log::info('Student registration request received', [
                'email' => $request->input('email'),
                'phone' => $request->input('phone_number'),
            ]);

            // Validate student input
            $validated = $request->validate([
                'first_name'    => 'required|string|max:255',
                'last_name'     => 'required|string|max:255',
                'email'         => 'nullable|string|email',
                'phone_number'  => 'required|string',
                'password'      => 'required|string|min:8',
                'gender'        => 'nullable|in:male,female,other',
                'nationality'   => 'nullable|string|max:255',
            ]);

            // Check if email already exists
            if ($request->filled('email')) {
                $existingByEmail = User::where('email', $validated['email'])->first();
                if ($existingByEmail) {
                    Log::warning('Student registration - email already exists', [
                        'email' => $validated['email'],
                    ]);
                    
                    return response()->json([
                        'success' => false,
                        'code' => 'ALREADY_REGISTERED',
                        'status' => 'already_registered',
                        'message_en' => 'This email is already registered. Please log in or use a different email.',
                        'message_ar' => 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد إلكتروني مختلف.',
                        'field' => 'email'
                    ], 409);
                }
            }

            // Normalize and check phone
            $normalizedPhone = PhoneHelper::normalize($request->phone_number);
            
            if (!$normalizedPhone) {
                Log::warning('Student registration - failed to normalize phone', [
                    'phone_input' => $request->phone_number,
                ]);
                
                return response()->json([
                    'success' => false,
                    'code' => 'INVALID_PHONE',
                    'status' => 'invalid',
                    'message_en' => 'Invalid phone number format.',
                    'message_ar' => 'صيغة رقم الهاتف غير صحيحة.',
                    'field' => 'phone_number'
                ], 422);
            }

            $existingByPhone = User::where('phone_number', $normalizedPhone)->first();
            if ($existingByPhone) {
                Log::warning('Student registration - phone already exists', [
                    'phone' => $normalizedPhone,
                ]);
                
                return response()->json([
                    'success' => false,
                    'code' => 'ALREADY_REGISTERED',
                    'status' => 'already_registered',
                    'message_en' => 'This phone number is already registered. Please log in or use a different phone number.',
                    'message_ar' => 'رقم الهاتف هذا مسجل بالفعل. يرجى تسجيل الدخول أو استخدام رقم هاتف مختلف.',
                    'field' => 'phone_number'
                ], 409);
            }

            DB::beginTransaction();

            $verification_code = rand(1000, 9999);
            
            // Create student user
            $user = User::create([
                'first_name'    => $validated['first_name'],
                'last_name'     => $validated['last_name'],
                'email'         => $validated['email'],
                'phone_number'  => $normalizedPhone,
                'gender'        => $validated['gender'] ?? null,
                'nationality'   => $validated['nationality'] ?? null,
                'password'      => Hash::make($validated['password']),
                'role_id'       => 4, // Student
                'verified'      => false,
                'verification_code' => $verification_code,
            ]);

            Log::info('Student user created', ['user_id' => $user->id]);

            DB::commit();

            // Send verification code
            $smsPhone = PhoneHelper::normalizeForSMS($normalizedPhone);
            try {
                $this->sendVerificationSMS($smsPhone, $verification_code);
            } catch (\Exception $e) {
                Log::warning('Failed to send SMS', ['error' => $e->getMessage()]);
            }

            try {
                Mail::to($user->email)->send(new VerificationCodeMail($user, $verification_code, 'register'));
            } catch (\Exception $e) {
                Log::warning('Failed to send verification email', ['error' => $e->getMessage()]);
            }

            // Same response structure (backward compatible)
            $user_response = [
                "id" => $user->id,
                "first_name" => $user->first_name,
                "last_name" => $user->last_name,
                "email" => $user->email,
                "phone_number" => $user->phone_number,
                "gender" => $user->gender,
                "role_id" => $user->role_id,
            ];

            return response()->json([
                'success' => true,
                'code' => 'REGISTRATION_SUCCESS',
                'status' => 'unverified',
                'message_en' => 'Student registration successful. Verification code sent via SMS and email.',
                'message_ar' => 'تم تسجيل الطالب بنجاح. تم إرسال رمز التحقق عبر الرسائل النصية والبريد الإلكتروني.',
                'user' => $user_response,
            ], 201);

        } catch (ValidationException $e) {
            Log::warning('Student registration validation failed', [
                'errors' => $e->errors(),
            ]);
            
            return response()->json([
                'success' => false,
                'code' => 'VALIDATION_ERROR',
                'status' => 'invalid_input',
                'message_en' => 'Please check your input and try again.',
                'message_ar' => 'يرجى التحقق من مدخلاتك والمحاولة مرة أخرى.',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Student registration error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'code' => 'REGISTRATION_ERROR',
                'status' => 'error',
                'message_en' => 'An error occurred during registration. Please try again later.',
                'message_ar' => 'حدث خطأ أثناء التسجيل. يرجى المحاولة لاحقًا.',
            ], 500);
        }
    }



    /**
     * Send SMS using dreams.sa API
     * Accepts phone in any format and normalizes for SMS (966XXXXXXXXX format)
     */
    protected function sendVerificationSMS($to, $code)
    {
        // Ensure we have the SMS format (without +)
        $smsPhone = str_starts_with($to, '+') ? substr($to, 1) : $to;
        
        $client = new \GuzzleHttp\Client();
        $response = $client->post('https://www.dreams.sa/index.php/api/sendsms/', [
            'form_params' => [
                'user'       => config('services.sms.user'),
                'secret_key' => config('services.sms.secret_key'),
                'sender'     => config('services.sms.sender'),
                'to'         => $smsPhone,
                'message'   => "Welcome to the Geniuses Family! Your verification code is: $code\n مرحبًا بك في عائلة العباقرة! رمز التحقق الخاص بك هو: $code\n"
            ]
        ]);
        return json_decode($response->getBody(), true);
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password'     => 'required|min:8|confirmed',
        ], [
            'current_password.required' => 'كلمة المرور الحالية مطلوبة',
            'new_password.required' => 'كلمة المرور الجديدة مطلوبة',
            'new_password.min' => 'يجب أن لا تقل كلمة المرور عن 8 أحرف',
            'new_password.confirmed' => 'كلمة المرور الجديدة غير متطابقة مع التأكيد',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message_ar' => 'كلمة المرور الحالية غير صحيحة',
                'message_en' => 'Current password is incorrect',
                'errors' => [
                    'current_password' => ['كلمة المرور الحالية غير صحيحة']
                ]
            ], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true,
            'message_ar' => 'تم تحديث كلمة المرور بنجاح',
            'message_en' => 'Password updated successfully'
        ]);
    }
    
    public function login(Request $request)
    {
        try {
            // Validate input - use looser validation for password since it can come as number/string
            $validated = $request->validate([
                'email' => 'nullable|email',
                'phone_number' => 'nullable|max:15',
                'password' => 'required',
                'fcm_token' => 'nullable|string'
            ]);

            // Must provide at least one of email or phone_number
            if (!$request->filled('email') && !$request->filled('phone_number')) {
                return $this->validationErrorArray(
                    [
                        'email' => ['Either email or phone_number must be provided.'],
                        'phone_number' => ['Either email or phone_number must be provided.']
                    ],
                    'Please provide email or phone number'
                );
            }

            // Find user by email OR phone_number
            $user = null;
            if ($request->filled('email')) {
                $user = User::where('email', $request->email)->first();
            } elseif ($request->filled('phone_number')) {
                // Normalize phone number before querying
                $normalizedPhone = PhoneHelper::normalize($request->phone_number);
                if (!$normalizedPhone) {
                    return $this->validationErrorArray(
                        ['phone_number' => ['Invalid phone number format']],
                        'Invalid phone number'
                    );
                }
                $user = User::where('phone_number', $normalizedPhone)->first();
            }

            // Check credentials
            if (!$user || !Hash::check($request->password, $user->password)) {
                return $this->authError('Invalid email/phone or password');
            }

            // Get user role
            $role = Role::find($user->role_id);
            if (!$role) {
                return $this->serverError(
                    new \Exception('User role not found'),
                    'Invalid user role'
                );
            }

            // Check if profile is complete
            if ($role->name_key == 'visitor') {
                return $this->validationErrorArray(
                    ['profile' => ['Please complete your profile first.']],
                    'Profile incomplete'
                );
            }

            // Get user data based on role
            try {
                if ($user->role_id == 3) {
                    // Teacher role
                    $userController = new UserController();
                    $fullTeacherData = $userController->getFullTeacherData($user);
                    $userData = [
                        "role" => $role->name_key,
                        "data" => $fullTeacherData,
                    ];
                } else {
                    // Other roles (student, etc.)
                    $userProfile = $user->profile;
                    $userData = [
                        "role" => $role->name_key,
                        "data" => $user,
                        "profile" => $userProfile,
                    ];
                }
            } catch (\Exception $e) {
                Log::error('Failed to fetch user data during login: ' . $e->getMessage());
                return $this->serverError($e, 'Failed to fetch user data');
            }

            // Save FCM token (non-fatal if fails)
            if ($request->filled('fcm_token')) {
                try {
                    $user->fcm_token = $request->input('fcm_token');
                    $user->save();
                } catch (\Exception $e) {
                    Log::warning('Failed to save fcm_token: ' . $e->getMessage());
                }
            }

            // Create authentication token
            try {
                $token = $user->createToken('mobile-app-token')->plainTextToken;
            } catch (\Exception $e) {
                Log::error('Failed to create token: ' . $e->getMessage());
                return $this->serverError($e, 'Failed to create authentication token');
            }

            // Send welcome notification (best-effort, non-fatal)
            $notificationSent = false;
            try {
                $firebase = new FirebaseNotificationService();
                $title = app()->getLocale() === 'ar' ? 'مرحبًا بك' : 'Welcome';
                $body = app()->getLocale() === 'ar' ? 'مرحبًا بك في منصتنا' : 'Welcome to our platform!';
                $notificationSent = $firebase->sendToUser($user, $title, $body, ['type' => 'welcome']);
            } catch (\Exception $e) {
                Log::warning('Failed to send welcome notification: ' . $e->getMessage());
            }

            return $this->success([
                'user' => $userData,
                'token' => $token,
                'notification_sent' => $notificationSent,
            ], 'Login successful');

        } catch (ValidationException $e) {
            return $this->validationError($e, 'Login validation failed');
        } catch (\Exception $e) {
            Log::error('Login error: ' . $e->getMessage());
            return $this->serverError($e, 'Login failed. Please try again.');
        }
    }


    // Profile
    public function profile(Request $request)
    {
        return response()->json($request->user());
    }

    // Logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    // Verify Code
    public function verifyCode(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'code'    => 'required|digits:4'
        ]);

        $user = User::find($request->user_id);
        if (! $user) {
            return response()->json([
                'message' => 'User not found.'
            ], 404);
        }

        if ($user->verification_code == $request->code) {
            $user->verified = true;
            $user->verification_code = null;
            $user->save();

            $token = $user->createToken('mobile-app-token')->plainTextToken;

            return response()->json([
                'message' => 'Verification successful.',
                'token'   => $token,
                'user'    => $user
            ]);
        } else {
            return response()->json([
                'message' => 'Invalid verification code.'
            ], 422);
        }
    }

    public function resetPassword(Request $request)
    {
        // Accept either phone_number OR email for sending reset code
        $request->validate([
            'phone_number' => 'nullable|string|max:15',
            'email' => 'nullable|email',
        ]);

        // Must provide at least one of email or phone_number
        if (!$request->filled('email') && !$request->filled('phone_number')) {
            return response()->json([
                'success' => false,
                'message' => 'Either email or phone_number must be provided.'
            ], 422);
        }

        // Find user by email OR phone_number
        $user = null;
        $sentVia = null;  // Track how code was sent

        if ($request->filled('email')) {
            $user = User::where('email', $request->email)->first();
            $sentVia = 'email';
        } elseif ($request->filled('phone_number')) {
            // Normalize phone number before querying
            $normalizedPhone = PhoneHelper::normalize($request->phone_number);
            $user = User::where('phone_number', $normalizedPhone)->first();
            $sentVia = 'phone_number';
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => ucfirst($sentVia) . ' not found in our system.'
            ], 404);
        }

        $verification_code = rand(0000, 9999);
        $user->verification_code = $verification_code;
        $user->save();

        // Send SMS if reset via phone_number
        $smsResponse = null;
        if ($sentVia === 'phone_number') {
            // Use normalized phone for SMS
            $smsPhone = PhoneHelper::normalizeForSMS($user->phone_number);
            $smsResponse = $this->sendVerificationSMS($smsPhone, $verification_code);
        } else {
            // Send email verification code
            try {
                Mail::to($user->email)->send(new VerificationCodeMail($user, $verification_code, 'reset'));
                $smsResponse = ['message' => 'Verification code sent to email'];
            } catch (\Exception $e) {
                Log::warning('Failed to send password reset email: ' . $e->getMessage());
                $smsResponse = ['message' => 'Email sending failed, please try again.'];
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Verification code sent. Please check your ' . $sentVia . '.',
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone_number' => $user->phone_number
            ],
            'sms_response' => $smsResponse
        ]);
    }

    // verify code for reset password
    public function verifyResetCode(Request $request)
    {
        try {
            // Validate input - use looser validation for code since it can come as number/string
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
                'code'    => 'required'
            ]);

            $user = User::find($validated['user_id']);
            if (!$user) {
                return $this->notFoundError('User not found');
            }

            // Compare code as string (convert to string if it comes as number)
            if ((string)$user->verification_code === (string)$validated['code']) {
                return $this->success(
                    ['user_id' => $user->id],
                    'Code verified. You can now reset your password.'
                );
            } else {
                return $this->validationErrorArray(
                    ['code' => ['Invalid or expired verification code']],
                    'Invalid verification code'
                );
            }

        } catch (ValidationException $e) {
            return $this->validationError($e);
        } catch (\Exception $e) {
            return $this->serverError($e);
        }
    }

    // Confirm Reset Password
    // Confirm Reset Password - Verify code and reset password
    public function confirmResetPassword(Request $request)
    {
        try {
            // Validate input - use looser validation for code/password since they can come as number/string
            $validated = $request->validate([
                'user_id' => 'required|integer|exists:users,id',
                'code' => 'required',
                'new_password' => 'required|min:8|confirmed',
            ]);

            // Find user
            $user = User::findOrFail($validated['user_id']);

            // Verify the reset code matches (compare as string)
            if ((string)$user->verification_code !== (string)$validated['code']) {
                Log::warning('Invalid reset code attempt', [
                    'user_id' => $user->id,
                    'provided_code' => $validated['code'],
                ]);
                
                return $this->validationErrorArray(
                    ['code' => ['Invalid or expired verification code']],
                    'Invalid verification code'
                );
            }

            // Start transaction for atomic operation
            DB::beginTransaction();

            // Update password and clear verification code
            $user->password = Hash::make($validated['new_password']);
            $user->verification_code = null;
            $user->save();

            // Revoke all existing tokens (logout from all devices)
            $user->tokens()->delete();

            DB::commit();

            Log::info('Password reset successful', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);

            return $this->success(
                ['user_id' => $user->id],
                'Password reset successfully. Please login with your new password.'
            );

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->notFoundError('User not found');
        } catch (ValidationException $e) {
            return $this->validationError($e, 'Password reset validation failed');
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            Log::error('Database error during password reset: ' . $e->getMessage());
            return $this->databaseError($e, 'Failed to reset password');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Password reset error: ' . $e->getMessage());
            return $this->serverError($e, 'Failed to reset password. Please try again.');
        }
    }

    // resend code
    public function resendCode(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);
        $user = User::find($request->user_id);
        if (! $user) {
            return response()->json([
                'message' => 'User not found.'
            ], 404);
        }

        $verification_code = rand(0000, 9999);
        $user->verification_code = $verification_code;
        $user->save();

        // Send SMS
        $smsResponse = $this->sendVerificationSMS($user->phone_number, $verification_code);

        return response()->json([
            'message' => 'Verification code resent.',
            'sms_response' => $smsResponse // For debugging, remove in production
        ]);
    }

    
    // Get User Details
    public function getUserDetails(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated.'
            ], 401);
        }
        if( $user->role_id == 3 ) { // Teacher
            $userController = new UserController();
            $user = $userController->getFullTeacherData($user);
        } else {
            $profilePhoto = $user->attachments()
                ->where('attached_to_type', 'profile_picture')
                ->latest()
                ->value('file_path');
            // For other roles, you can customize the data as needed
            $user = [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'nationality' => $user->nationality,
                'phone_number' => $user->phone_number,
                'role_id' => $user->role_id,
                'profile' => 
                    ['profile_photo' => $profilePhoto]
            ];
        }
        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    /**
     * Delete user account and all associated data
     * 
     * Deletes:
     * - User profile
     * - User attachments
     * - User account
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteAccount(Request $request)
    {
        try {
            $request->validate([
                'password' => 'required|string',
                'confirmation' => 'required|accepted', // User must explicitly accept deletion
            ]);

            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Verify password
            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid password. Account deletion cancelled.'
                ], 422);
            }

            // Start database transaction
            DB::beginTransaction();

            $userId = $user->id;
            $userEmail = $user->email;

            // Log deletion request
            Log::warning("User account deletion initiated - User ID: {$userId}, Email: {$userEmail}");

            // Delete all attachments associated with the user
            $attachments = Attachment::where('user_id', $userId)->get();
            foreach ($attachments as $attachment) {
                try {
                    // Delete file from storage if it exists
                    if (Storage::exists($attachment->file_path)) {
                        Storage::delete($attachment->file_path);
                    }
                } catch (\Exception $e) {
                    Log::warning("Failed to delete attachment file: {$attachment->file_path}");
                }
                $attachment->delete();
            }

            // Delete user profile
            if ($user->profile) {
                $user->profile()->delete();
            }

            // Delete all support tickets and replies
            $tickets = SupportTicket::where('user_id', $userId)->get();
            foreach ($tickets as $ticket) {
                SupportTicketReply::where('support_ticket_id', $ticket->id)->delete();
                $ticket->delete();
            }

            // Delete all support ticket replies made by this user
            SupportTicketReply::where('user_id', $userId)->delete();

            // Revoke all API tokens
            $user->tokens()->delete();

            // Delete user account
            $user->delete();

            DB::commit();

            Log::error("User account successfully deleted - User ID: {$userId}, Email: {$userEmail}");

            return response()->json([
                'success' => true,
                'message' => 'Your account has been permanently deleted. All associated data has been removed from our system.',
                'deleted_user_id' => $userId,
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Account deletion failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete account. Please try again later.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
