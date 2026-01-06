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

class AuthController extends Controller
{
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
    // Register
    public function register(Request $request)
    {
        $request->validate([
            'first_name'    => 'required|string|max:255',
            'last_name'     => 'required|string|max:255',
            'email'         => 'required|string|email|unique:users',
            'phone_number'  => 'required|string|max:15',
            'gender'        => 'required|in:male,female',
            'nationality'   => 'nullable|string|max:255',
            'role_id'       => 'required',
        ]);

        // Normalize phone number
        $normalizedPhone = PhoneHelper::normalize($request->phone_number);
        if (!$normalizedPhone) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid phone number format. Must be a valid KSA phone number.'
            ], 422);
        }

        // Check if phone already exists
        $existingUser = User::where('phone_number', $normalizedPhone)->first();
        if ($existingUser) {
            return response()->json([
                'success' => false,
                'message' => 'Phone number already registered.'
            ], 422);
        }

        $password = 'password'; // Default password
        $verification_code = rand(100000, 999999);

        $user = User::create([
            'first_name'    => $request->first_name,
            'last_name'     => $request->last_name,
            'email'         => $request->email,
            'phone_number'  => $normalizedPhone,
            'gender'        => $request->gender,
            'nationality'   => $request->nationality,
            'password'      => Hash::make($password),
            'role_id'       => $request->role_id,
            'verified'      => false,
            'verification_code' => $verification_code,
        ]);
        
        $user_response = [
            "id" => $user->id,
            "first_name" => $user->first_name,
            "last_name" => $user->last_name,
            "email" => $user->email,
            "phone_number" => $user->phone_number,
            "gender" => $user->gender,
            "role_id" => $user->role_id,
        ];

        // Send verification code via SMS (normalize for SMS format without +)
        $smsPhone = PhoneHelper::normalizeForSMS($normalizedPhone);
        $smsResponse = $this->sendVerificationSMS($smsPhone, $verification_code);

        // Also send email notification
        try {
            Mail::to($user->email)->send(new VerificationCodeMail($user, $verification_code, 'register'));
        } catch (\Exception $e) {
            Log::warning('Failed to send verification email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Verification code sent. Please verify via SMS or email.',
            'user' => $user_response,
            'sms_response' => $smsResponse // For debugging, remove in production
        ]);
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

            'new_password'     => 'required|min:8|confirmed',
        ]);
        $user = $request->user();
        $user->password = Hash::make($request->new_password);
        $user->save();
        return response()->json(['message' => 'Password updated successfully']);
    }
    
    public function login(Request $request)
    {
        // Accept either email OR phone_number, not both required
        $request->validate([
            'email' => 'nullable|email',
            'phone_number' => 'nullable|string|max:15',
            'password' => 'required',
            'fcm_token' => 'nullable|string'
        ]);

        // Must provide at least one of email or phone_number
        if (!$request->filled('email') && !$request->filled('phone_number')) {
            throw ValidationException::withMessages([
                'email' => ['Either email or phone_number must be provided.'],
            ]);
        }

        // Find user by email OR phone_number
        $user = null;
        if ($request->filled('email')) {
            $user = User::where('email', $request->email)->first();
        } elseif ($request->filled('phone_number')) {
            // Normalize phone number before querying
            $normalizedPhone = PhoneHelper::normalize($request->phone_number);
            $user = User::where('phone_number', $normalizedPhone)->first();
        }

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $role = Role::find($user->role_id);

        if ($role->name_key == 'visitor') {
            throw ValidationException::withMessages([
                'email' => ['Please complete your profile first.'],
            ]);
        }

        if ($user->role_id == 3) {
            $userController = new UserController();
            $fullTeacherData = $userController->getFullTeacherData($user);

            $userData = [
                "role" => $role->name_key,
                "data" => $fullTeacherData,
            ];
        } else {
            //  For non-teacher roles
            $userProfile = $user->profile;
            $userData = [
                "role" => $role->name_key,
                "data" => $user,
                "profile" => $userProfile,
            ];
        }

        // if client provided a device token at login, save it
        if ($request->filled('fcm_token')) {
            try {
                $user->fcm_token = $request->input('fcm_token');
                $user->save();
            } catch (\Throwable $e) {
                // non-fatal; log but continue
                Log::warning('Failed to save fcm_token on login: ' . $e->getMessage());
            }
        }

        $token = $user->createToken('mobile-app-token')->plainTextToken;

        // Send a welcome notification (best-effort)
        $notificationSent = false;
        try {
            $firebase = new FirebaseNotificationService();
            $title = app()->getLocale() === 'ar' ? 'مرحبًا بك' : 'Welcome';
            $body = app()->getLocale() === 'ar' ? 'مرحبًا بك في منصتنا' : 'Welcome to our platform!';
            $notificationSent = $firebase->sendToUser($user, $title, $body, ['type' => 'welcome']);
        } catch (\Throwable $e) {
            Log::error('Failed to send welcome notification: ' . $e->getMessage());
        }

        return response()->json([
            'user' => $userData,
            'token' => $token,
            'notification_sent' => $notificationSent,
        ]);
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
            'code'    => 'required|digits:6'
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

        $verification_code = rand(100000, 999999);
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
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'code'    => 'required|digits:6'
        ]);
        $user = User::find($request->user_id);
        if (! $user) {
            return response()->json([
                'message' => 'User not found.'
            ], 404);
        }
        if ($user->verification_code == $request->code) {
            return response()->json([
                'message' => 'Code verified. You can now reset your password.',
                'user_id' => $user->id
            ], 200);
        } else {
            return response()->json([
                'message' => 'Invalid verification code.'
            ], 422);
        }
    }

    // Confirm Reset Password
    public function confirmResetPassword(Request $request)
    {
        $request->validate([
            'code' => 'required|digits:6,users,verification_code',
            'user_id' => 'required|exists:users,id',
            'new_password' => 'required|min:8|confirmed',
        ]);

        $user = User::find($request->user_id);

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.'
            ], 404);
        }

        // Update password and clear verification code
        $user->password = Hash::make($request->new_password);
        $user->verification_code = null;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully.'
        ]);
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

        $verification_code = rand(100000, 999999);
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
