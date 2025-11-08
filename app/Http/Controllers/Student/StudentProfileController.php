<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use App\Models\User;
use App\Models\PhoneVerification;
use App\Models\EmailVerification;
use App\Models\Attachment;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\EmailVerificationMail;
use Exception;
use Illuminate\Support\Facades\Storage;

class StudentProfileController extends Controller
{
    /**
     * Display the student profile
     */
    public function show()
    {
        $student = Auth::user();
        return view('student.profile.show', compact('student'));
    }

    /**
     * Show the edit profile form
     */
    public function edit()
    {
        $student = Auth::user();
        return view('student.profile.edit', compact('student'));
    }

    /**
     * Update the student profile
     */
    public function update(Request $request)
    {
        $student = Auth::user();
        
        // Validation rules
        $rules = [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'gender' => ['required', 'in:male,female,other'],
            'nationality' => ['required', 'string', 'max:100'],
            'phone_number' => ['required', 'string', 'max:20', Rule::unique('users')->ignore($student->id)],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($student->id)],
            'profile_picture' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
        ];

        $messages = [
            'first_name.required' => app()->getLocale() == 'ar' ? 'الاسم الأول مطلوب' : 'First name is required',
            'last_name.required' => app()->getLocale() == 'ar' ? 'اسم العائلة مطلوب' : 'Last name is required',
            'gender.required' => app()->getLocale() == 'ar' ? 'الجنس مطلوب' : 'Gender is required',
            'nationality.required' => app()->getLocale() == 'ar' ? 'الجنسية مطلوبة' : 'Nationality is required',
            'phone_number.required' => app()->getLocale() == 'ar' ? 'رقم الهاتف مطلوب' : 'Phone number is required',
            'phone_number.unique' => app()->getLocale() == 'ar' ? 'رقم الهاتف مستخدم بالفعل' : 'Phone number already taken',
            'email.required' => app()->getLocale() == 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required',
            'email.email' => app()->getLocale() == 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email format',
            'email.unique' => app()->getLocale() == 'ar' ? 'البريد الإلكتروني مستخدم بالفعل' : 'Email already taken',
        ];

        $validated = $request->validate($rules, $messages);

        $phoneChanged = $student->phone_number !== $validated['phone_number'];
        $emailChanged = $student->email !== $validated['email'];

        // Update basic information
        $student->first_name = $validated['first_name'];
        $student->last_name = $validated['last_name'];
        $student->gender = $validated['gender'];
        $student->nationality = $validated['nationality'];

        // Handle phone change
        if ($phoneChanged) {
            $student->phone_number = $validated['phone_number'];
            $student->phone_verified_at = null; // Unverify phone
            
            // Generate verification code
            $code = rand(100000, 999999);
            
            PhoneVerification::updateOrCreate(
                ['user_id' => $student->id],
                [
                    'phone' => $validated['phone_number'],
                    'code' => $code,
                    'expires_at' => now()->addMinutes(10)
                ]
            );

            // TODO: Send SMS with verification code
            // You can integrate with services like Twilio, Nexmo, etc.
            
            session()->flash('phone_verification_needed', true);
            session()->flash('phone_to_verify', $validated['phone_number']);
        }

        // Handle email change
        if ($emailChanged) {
            $student->email = $validated['email'];
            $student->email_verified_at = null; // Unverify email
            
            // Generate verification token
            $token = Str::random(60);
            
            EmailVerification::updateOrCreate(
                ['user_id' => $student->id],
                [
                    'email' => $validated['email'],
                    'token' => $token,
                    'expires_at' => now()->addHours(24)
                ]
            );

            // Send verification email
            try {
                Mail::to($validated['email'])->send(new EmailVerificationMail($student, $token));
                session()->flash('email_verification_needed', true);
            } catch (Exception $e) {
                session()->flash('email_error', app()->getLocale() == 'ar' 
                    ? 'فشل إرسال بريد التحقق. الرجاء المحاولة لاحقاً.' 
                    : 'Failed to send verification email. Please try again later.');
            }
        }

        // Handle profile picture upload
        if ($request->hasFile('profile_picture')) {
            $file = $request->file('profile_picture');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('public/profile_pictures', $fileName);
            
            // Create or update attachment record
            $attachment = Attachment::updateOrCreate(
                [
                    'user_id' => $student->id,
                    'type' => 'profile_picture'
                ],
                [
                    'file_name' => $fileName,
                    'file_path' => Storage::url($filePath), // This will give you the full URL
                    'file_type' => $file->getMimeType(),
                    'file_size' => $file->getSize()
                ]
            );
        }

        $student->save();

        if ($phoneChanged || $emailChanged) {
            $message = app()->getLocale() == 'ar' 
                ? 'تم تحديث الملف الشخصي. الرجاء التحقق من معلومات الاتصال الجديدة.' 
                : 'Profile updated. Please verify your new contact information.';
        } else {
            $message = app()->getLocale() == 'ar' 
                ? 'تم تحديث الملف الشخصي بنجاح!' 
                : 'Profile updated successfully!';
        }

        return redirect()->route('student.profile.show')->with('success', $message);
    }

    /**
     * Show phone verification form
     */
    public function showPhoneVerification()
    {
        $student = Auth::user();
        
        if ($student->phone_verified_at) {
            return redirect()->route('student.profile.show')
                ->with('info', app()->getLocale() == 'ar' 
                    ? 'رقم هاتفك مُفعّل بالفعل' 
                    : 'Your phone is already verified');
        }

        return view('student.profile.verify-phone');
    }

    /**
     * Verify phone number
     */
    public function verifyPhone(Request $request)
    {
        $request->validate([
            'code' => 'required|digits:6'
        ]);

        $student = Auth::user();
        
        $verification = PhoneVerification::where('user_id', $student->id)
            ->where('code', $request->code)
            ->where('expires_at', '>', now())
            ->first();

        if (!$verification) {
            return back()->withErrors([
                'code' => app()->getLocale() == 'ar' 
                    ? 'رمز التحقق غير صحيح أو منتهي الصلاحية' 
                    : 'Invalid or expired verification code'
            ]);
        }

        $student->phone_verified_at = now();
        $student->save();

        $verification->delete();

        return redirect()->route('student.profile.show')
            ->with('success', app()->getLocale() == 'ar' 
                ? 'تم التحقق من رقم الهاتف بنجاح!' 
                : 'Phone number verified successfully!');
    }

    /**
     * Resend phone verification code
     */
    public function resendPhoneCode()
    {
        $student = Auth::user();
        
        $verification = PhoneVerification::where('user_id', $student->id)->first();
        
        if (!$verification) {
            return back()->withErrors([
                'code' => app()->getLocale() == 'ar' 
                    ? 'لا توجد عملية تحقق نشطة' 
                    : 'No active verification found'
            ]);
        }

        // Generate new code
        $code = rand(100000, 999999);
        $verification->code = $code;
        $verification->expires_at = now()->addMinutes(10);
        $verification->save();

        // TODO: Send SMS with new verification code

        return back()->with('success', app()->getLocale() == 'ar' 
            ? 'تم إرسال رمز جديد' 
            : 'New code sent');
    }

    /**
     * Verify email
     */
    public function verifyEmail($token)
    {
        $verification = EmailVerification::where('token', $token)
            ->where('expires_at', '>', now())
            ->first();

        if (!$verification) {
            return redirect()->route('student.profile.show')
                ->with('error', app()->getLocale() == 'ar' 
                    ? 'رابط التحقق غير صحيح أو منتهي الصلاحية' 
                    : 'Invalid or expired verification link');
        }

        $student = User::find($verification->user_id);
        $student->email_verified_at = now();
        $student->save();

        $verification->delete();

        return redirect()->route('student.profile.show')
            ->with('success', app()->getLocale() == 'ar' 
                ? 'تم التحقق من البريد الإلكتروني بنجاح!' 
                : 'Email verified successfully!');
    }

    /**
     * Resend email verification
     */
    public function resendEmailVerification()
    {
        $student = Auth::user();
        
        if ($student->email_verified_at) {
            return back()->with('info', app()->getLocale() == 'ar' 
                ? 'بريدك الإلكتروني مُفعّل بالفعل' 
                : 'Your email is already verified');
        }

        $verification = EmailVerification::where('user_id', $student->id)->first();
        
        if (!$verification) {
            return back()->withErrors([
                'email' => app()->getLocale() == 'ar' 
                    ? 'لا توجد عملية تحقق نشطة' 
                    : 'No active verification found'
            ]);
        }

        // Generate new token
        $token = Str::random(60);
        $verification->token = $token;
        $verification->expires_at = now()->addHours(24);
        $verification->save();

        try {
            Mail::to($student->email)->send(new EmailVerificationMail($student, $token));
            return back()->with('success', app()->getLocale() == 'ar' 
                ? 'تم إرسال بريد التحقق' 
                : 'Verification email sent');
        } catch (Exception $e) {
            return back()->withErrors([
                'email' => app()->getLocale() == 'ar' 
                    ? 'فشل إرسال البريد. الرجاء المحاولة لاحقاً.' 
                    : 'Failed to send email. Please try again later.'
            ]);
        }
    }

    /**
     * Get profile picture URL
     */
    public function getProfilePicture()
    {
        $attachment = Attachment::where('user_id', auth()->id())
            ->where('type', 'profile_picture')
            ->latest()
            ->first();

        return $attachment ? $attachment->file_path : null;
    }
}