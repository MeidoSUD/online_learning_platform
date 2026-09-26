<?php

namespace App\Services\User;

use App\Models\User;
use App\Models\UserProfile;
use App\Models\TeacherInstitute;
use App\Models\Attachment;
use App\Helpers\PhoneHelper;
use App\Helpers\TeacherProfileHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UserProfileService
{
    protected TeacherProfileService $teacherProfileService;
    protected UserAttachmentService $attachmentService;
    protected TeacherManagementService $teacherManagementService;

    public function __construct(
        TeacherProfileService $teacherProfileService,
        UserAttachmentService $attachmentService,
        TeacherManagementService $teacherManagementService
    ) {
        $this->teacherProfileService = $teacherProfileService;
        $this->attachmentService = $attachmentService;
        $this->teacherManagementService = $teacherManagementService;
    }

    /**
     * Show basic user profile.
     */
    public function showProfile(Request $request): array
    {
        $user = $request->user();

        $profile = UserProfile::with(['profilePhoto'])
            ->where('user_id', $user->id)
            ->first();

        if (!$profile) {
            $profile = UserProfile::create([
                'user_id' => $user->id,
                'language_pref' => 'ar',
            ]);
        }

        return [
            'success' => true,
            'status_code' => 200,
            'data' => [
                'id' => $profile->id,
                'bio' => $profile->bio,
                'description' => $profile->description,
                'profile_photo' => $profile->profilePhoto,
                'terms_accepted' => $profile->terms_accepted,
                'verified' => $profile->verified,
                'language_pref' => $profile->language_pref,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ],
        ];
    }

    /**
     * Complete / Store profile for first time.
     */
    public function storeProfile(Request $request): array
    {
        $user = $request->user();

        $profileData = $request->only(['bio', 'language_pref', 'terms_accepted']);
        $profileData['verified'] = $user->role_id == 3 ? 0 : 1;

        $profile = UserProfile::updateOrCreate(
            ['user_id' => $user->id],
            $profileData
        );

        $user->update($request->only(['email', 'phone_number']));

        try {
            if ($request->hasFile('profile_photo')) {
                $this->attachmentService->saveAttachmentFile($request, 'profile_photo', 'profile_photos', $user, 'profile_picture');
            }
        } catch (\Exception $e) {
            return [
                'success' => false,
                'status_code' => 500,
                'message' => 'Failed to upload profile photo',
                'error' => $e->getMessage(),
            ];
        }

        if ($user->role && $user->role->name_key === 'teacher') {
            try {
                if ($request->hasFile('certificate')) {
                    $this->attachmentService->saveAttachmentFile($request, 'certificate', 'certificates', $user, 'certificate');
                }
                if ($request->hasFile('resume')) {
                    $this->attachmentService->saveAttachmentFile($request, 'resume', 'resumes', $user, 'resume');
                }
            } catch (\Exception $e) {
                return [
                    'success' => false,
                    'status_code' => 500,
                    'message' => 'Failed to upload teacher files',
                    'error' => $e->getMessage(),
                ];
            }
        }

        $user->refresh();

        if ($user->role_id == 3) {
            $user->load([
                'profile',
                'teacherInfo',
                'teacherClasses',
                'teacherSubjects',
                'availableSlots',
                'reviews',
                'attachments',
            ]);
            return [
                'success' => true,
                'status_code' => 200,
                'message' => 'Profile created successfully',
                'data' => $this->teacherProfileService->getFullTeacherData($user),
            ];
        } else {
            $profilePhoto = $user->attachments()
                ->where('attached_to_type', 'profile_picture')
                ->latest()
                ->value('file_path');

            return [
                'success' => true,
                'status_code' => 200,
                'message' => 'Profile created successfully',
                'data' => [
                    'id' => $profile->id,
                    'user_id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number,
                    'bio' => $profile->bio,
                    'language_pref' => $profile->language_pref,
                    'terms_accepted' => $profile->terms_accepted,
                    'verified' => $profile->verified,
                    'profile_photo' => $profilePhoto,
                ],
            ];
        }
    }

    /**
     * Update user profile routing to teacher or student.
     */
    public function updateProfile(Request $request): array
    {
        Log::info('Update Profile Request: ', $request->all());
        $user = $request->user();

        if ($request->has('role_id')) {
            if ($user->role_id === 2 || $user->role_id === null) {
                $user->role_id = (int) $request->input('role_id');
                $user->save();
            } else if ($user->role_id != $request->input('role_id')) {
                return [
                    'success' => false,
                    'status_code' => 422,
                    'message' => 'Cannot change role after initial setup',
                ];
            }
        } elseif ($user->role_id === null) {
            return [
                'success' => false,
                'status_code' => 422,
                'message' => 'role_id is required for first-time profile setup',
                'errors' => ['role_id' => ['The role_id field is required.']],
            ];
        }

        if ($user->role_id == 3) {
            return $this->updateTeacherProfile($request, $user);
        } elseif ($user->role_id == 4) {
            return $this->updateStudentProfile($request, $user);
        } else {
            return [
                'success' => false,
                'status_code' => 422,
                'message' => 'Invalid user role',
            ];
        }
    }

    /**
     * Update student profile.
     */
    public function updateStudentProfile(Request $request, User $user): array
    {
        DB::beginTransaction();
        try {
            $profileData = $request->only(['bio', 'description', 'profile_photo_id', 'language_pref', 'terms_accepted']);
            $profileData['verified'] = $request->input('verified', 0);

            $profile = UserProfile::updateOrCreate(
                ['user_id' => $user->id],
                $profileData
            );

            if ($request->hasAny(['first_name', 'last_name', 'email', 'phone_number'])) {
                $updateData = $request->only(['first_name', 'last_name', 'email', 'phone_number']);

                if (isset($updateData['phone_number'])) {
                    $normalizedPhone = PhoneHelper::normalize($updateData['phone_number']);
                    if (!$normalizedPhone) {
                        DB::rollBack();
                        return [
                            'success' => false,
                            'status_code' => 422,
                            'message' => 'Invalid phone number format.',
                        ];
                    }

                    $existingPhone = User::where('phone_number', $normalizedPhone)
                        ->where('id', '!=', $user->id)
                        ->first();
                    if ($existingPhone) {
                        DB::rollBack();
                        return [
                            'success' => false,
                            'status_code' => 422,
                            'message' => 'Phone number already in use.',
                        ];
                    }

                    $updateData['phone_number'] = $normalizedPhone;
                }

                $user->update($updateData);
            }

            if ($request->hasFile('profile_photo')) {
                $this->attachmentService->saveAttachmentFile($request, 'profile_photo', 'profile_photos', $user, 'profile_picture');
            }

            DB::commit();

            $user->refresh();
            $profilePhoto = $user->attachments()
                ->where('attached_to_type', 'profile_picture')
                ->latest()
                ->value('file_path');

            return [
                'success' => true,
                'status_code' => 200,
                'message' => 'Profile updated successfully',
                'data' => [
                    'role_id' => $user->role_id,
                    'id' => $profile->id,
                    'user_id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'nationality' => $user->nationality,
                    'phone_number' => $user->phone_number,
                    'terms_accepted' => $profile->terms_accepted,
                    'verified' => $profile->verified,
                    'language_pref' => $profile->language_pref,
                    'profile' => [
                        'profile_photo' => $profilePhoto,
                    ],
                ],
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Student profile update error: ' . $e->getMessage());
            return [
                'success' => false,
                'status_code' => 500,
                'message' => 'Failed to update profile',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Update teacher profile.
     */
    public function updateTeacherProfile(Request $request, User $user): array
    {
        DB::beginTransaction();
        try {
            $profileData = $request->only(['bio', 'description', 'profile_photo_id', 'language_pref', 'terms_accepted']);

            $profile = UserProfile::updateOrCreate(
                ['user_id' => $user->id],
                $profileData
            );

            if ($request->hasAny(['first_name', 'last_name', 'email', 'phone_number'])) {
                $updateData = $request->only(['first_name', 'last_name', 'email', 'phone_number']);

                if (isset($updateData['phone_number'])) {
                    $normalizedPhone = PhoneHelper::normalize($updateData['phone_number']);
                    if (!$normalizedPhone) {
                        DB::rollBack();
                        return [
                            'success' => false,
                            'status_code' => 422,
                            'message' => 'Invalid phone number format.',
                        ];
                    }

                    $existingPhone = User::where('phone_number', $normalizedPhone)
                        ->where('id', '!=', $user->id)
                        ->first();
                    if ($existingPhone) {
                        DB::rollBack();
                        return [
                            'success' => false,
                            'status_code' => 422,
                            'message' => 'Phone number already in use.',
                        ];
                    }

                    $updateData['phone_number'] = $normalizedPhone;
                }

                $user->update($updateData);
            }

            if ($request->input('teacher_type') === 'institute') {
                $this->updateInstituteProfile($request, $user);
            } else {
                $this->updateIndividualTeacherProfile($request, $user);
            }

            if ($request->hasFile('profile_photo')) {
                $this->attachmentService->saveAttachmentFile($request, 'profile_photo', 'profile_photos', $user, 'profile_picture');
            }
            if ($request->hasFile('certificate')) {
                $this->attachmentService->saveAttachmentFile($request, 'certificate', 'certificates', $user, 'certificate');
            }
            if ($request->hasFile('resume')) {
                $this->attachmentService->saveAttachmentFile($request, 'resume', 'resumes', $user, 'resume');
            }

            DB::commit();

            $user->refresh();
            $user->load([
                'profile.profilePhoto:id,file_path',
                'teacherInfo',
                'teacherClasses',
                'teacherSubjects',
                'availableSlots',
                'reviews',
            ]);
            $teacherId = $user->id;
            TeacherProfileHelper::checkAndUpdateProfileCompleted($teacherId);

            return [
                'success' => true,
                'status_code' => 200,
                'message' => 'Profile updated successfully',
                'data' => $this->teacherProfileService->getFullTeacherData($user),
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Teacher profile update error: ' . $e->getMessage());
            return [
                'success' => false,
                'status_code' => 500,
                'message' => 'Failed to update profile',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Update individual teacher profile details.
     */
    private function updateIndividualTeacherProfile(Request $request, User $user): void
    {
        if ($request->hasAny(['teach_individual', 'teach_group', 'individual_hour_price', 'package_on_off', 'group_hour_price', 'max_group_size', 'min_group_size'])) {
            $this->teacherManagementService->updateTeacherInfo($request, $user);
        }

        if ($request->has('class_ids')) {
            $this->teacherManagementService->updateTeacherClasses($request, $user);
        }

        if ($request->has('subject_ids')) {
            $this->teacherManagementService->updateTeacherSubjects($request, $user);
        }

        if ($request->has('services_id') || $request->has('services')) {
            $this->teacherManagementService->updateTeacherServices($request, $user);
        }

        if ($request->hasFile('cover_image')) {
            $this->attachmentService->saveUserAttachment($request, 'cover_image', 'teachers/covers', $user, 'cover_image');
        }

        if ($request->hasFile('intro_video')) {
            $this->attachmentService->saveUserAttachment($request, 'intro_video', 'teachers/videos', $user, 'intro_video');
        }
    }

    /**
     * Update institute profile.
     */
    private function updateInstituteProfile(Request $request, User $user): void
    {
        $institute = TeacherInstitute::firstOrCreate(
            ['user_id' => $user->id],
            ['status' => 'pending']
        );

        $updateData = $request->only([
            'institute_name',
            'commercial_register',
            'license_number',
            'description',
            'website'
        ]);

        if (!empty($updateData)) {
            $institute->update(array_filter($updateData));
        }

        if ($request->hasFile('cover_image')) {
            $this->attachmentService->saveInstituteAttachment($request, 'cover_image', 'institutes/covers', $institute, 'cover_image');
        }

        if ($request->hasFile('intro_video')) {
            $this->attachmentService->saveInstituteAttachment($request, 'intro_video', 'institutes/videos', $institute, 'intro_video');
        }

        if ($request->hasFile('certificates')) {
            $certificates = $request->file('certificates');
            if (!is_array($certificates)) {
                $certificates = [$certificates];
            }
            foreach ($certificates as $cert) {
                $path = $cert->store('institutes/certificates', 'public');
                Attachment::create([
                    'user_id' => $user->id,
                    'file_path' => $path,
                    'attached_to_type' => 'institute_certificate',
                    'attached_to_id' => $institute->id,
                ]);
            }
        }
    }

    /**
     * Delete user account.
     */
    public function deleteAccount(Request $request): array
    {
        $user = $request->user();
        try {
            $user->tokens()->delete();
            $user->delete();
            return [
                'success' => true,
                'status_code' => 200,
                'message' => 'Account deleted successfully',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'status_code' => 500,
                'message' => 'Failed to delete account',
                'error' => $e->getMessage(),
            ];
        }
    }
}
