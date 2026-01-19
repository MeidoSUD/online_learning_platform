<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserProfile;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Review;
use App\Models\Course;
use App\Models\TeacherInfo;
use App\Models\TeacherTeachClasses;
use App\Models\TeacherSubject;
use App\Models\Attachment;
use App\Models\TeacherServices;
use App\Models\AvailabilitySlot;
use App\Models\TeacherLanguage;
use Illuminate\Support\Facades\Log;
use App\Helpers\PhoneHelper;
use App\Models\TeacherInstitute;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    private function getFileUrl($path)
    {
        return asset('storage/' . $path);
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        //
    }

    // select education levels
    public function educationLevels()
    {
        $levels = DB::table('education_levels')
            ->select('id', 'name_en', 'name_ar')
            ->where('status', true)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $levels
        ]);
    }

    // select classes based on education level
    public function classes($education_level_id)
    {
        $classes = DB::table('classes')
            ->select('id', 'name_en', 'name_ar')
            ->where('education_level_id', $education_level_id)
            ->get();
        return response()->json([
            'success' => true,
            'data' => $classes
        ]);
    }

    public function showProfile(Request $request)
    {
        $user = $request->user();

        $profile = UserProfile::with(['profilePhoto'])
            ->where('user_id', $user->id)
            ->first();

        if (!$profile) {
            // Create profile if doesn't exist
            $profile = UserProfile::create([
                'user_id' => $user->id,
                'language_pref' => 'ar'
            ]);
        }

        return response()->json([
            'success' => true,
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
                ]
            ]
        ]);
    }

    // store profile

    // Complete Profile
    public function storeProfile(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'role_id'      => 'required|in:3,4', // Must be teacher or student
            'profile_photo' => 'nullable|image|max:2048', // Optional profile photo
            'certificate'   => 'nullable|mimes:pdf,doc,docx|max:5120', // Optional certificate
            'resume'        => 'nullable|mimes:pdf,doc,docx|max:5120', // Optional resume
            'language_pref' => 'nullable|string|max:255', // Optional language preference
            'terms_accepted' => 'required|boolean|in:1', // Must accept terms
            'bio'           => 'nullable|string|max:1000', // Optional bio
            'education_level' => 'nullable|string|max:255', // Optional education level
            'class_id'      => 'nullable|exists:classes,id', // Optional class association
            'subjects'      => 'nullable|array', // Optional subjects array
            'email'         => 'required|string|email|unique:users,email,' . $request->user()->id,
            'phone_number'   => 'required|string|max:15|unique:users,phone_number,' . $request->user()->id,
        ]);

        // Role-specific validation
        $rules = [];
        if ($user->role && $user->role->name_key === 'teacher') {
            $rules['profile_photo'] = 'nullable|image|max:2048';
            $rules['certificate']   = 'nullable|mimes:pdf,doc,docx|max:5120';
            $rules['resume'] = 'nullable|mimes:pdf,doc,docx|max:5120';
        } elseif ($user->role && $user->role->name_key === 'student') {
            $rules['profile_photo'] = 'nullable|image|max:2048';
        }

        $validated = $request->validate($rules);

        // Prepare profile data (exclude file uploads from direct user update)
        $profileData = $request->only(['bio', 'language_pref', 'terms_accepted']);
        $profileData['verified'] = $user->role_id == 3 ? 0 : 1; // Teachers start unverified

        // Create or update user profile
        $profile = UserProfile::updateOrCreate(
            ['user_id' => $user->id],
            $profileData
        );

        // Update user basic info
        $user->update($request->only(['email', 'phone_number']));

        // Handle file uploads and save to attachments table
        try {
            if ($request->hasFile('profile_photo')) {
                $this->saveAttachmentFile($request, 'profile_photo', 'profile_photos', $user, 'profile_picture');
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload profile photo',
                'error' => $e->getMessage()
            ], 500);
        }

        if ($user->role && $user->role->name_key === 'teacher') {
            try {
                if ($request->hasFile('certificate')) {
                    $this->saveAttachmentFile($request, 'certificate', 'certificates', $user, 'certificate');
                }
                if ($request->hasFile('resume')) {
                    $this->saveAttachmentFile($request, 'resume', 'resumes', $user, 'resume');
                }
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload teacher files',
                    'error' => $e->getMessage()
                ], 500);
            }
        }

        $user->refresh();

        if ($user->role_id == 3) {
            // Teacher: return full teacher data
            $user->load([
                'profile',
                'teacherInfo',
                'teacherClasses',
                'teacherSubjects',
                'availableSlots',
                'reviews',
                'attachments',
            ]);
            return response()->json([
                'success' => true,
                'message' => 'Profile created successfully',
                'data' => $this->getFullTeacherData($user)
            ]);
        } else {
            // Student: return basic profile data with profile photo from attachments
            $profilePhoto = $user->attachments()
                ->where('attached_to_type', 'profile_picture')
                ->latest()
                ->value('file_path');

            return response()->json([
                'success' => true,
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
                ]
            ]);
        }
    }

    // update profile
    /**
     * Update user profile
     * Routes to separate handlers based on role:
     * - role_id = 3 (teacher): updateTeacherProfile
     * - role_id = 4 (student): updateStudentProfile
     */
    public function updateProfile(Request $request)
    {
        Log::info('Update Profile Request: ', $request->all());
        $user = $request->user();

        // Validate and set role_id if needed
        if ($request->has('role_id')) {
            $request->validate([
                'role_id' => 'required|in:3,4',
            ]);

            // Only allow updating role_id if it's currently null (first-time setup)
            if ($user->role_id === 2 || $user->role_id === null) {
                $user->role_id = (int)$request->input('role_id');
                $user->save();
                Log::info('User role set to: ' . $user->role_id);
            } else if ($user->role_id != $request->input('role_id')) {
                // Prevent changing role after initial setup
                Log::warning('Attempt to change user role blocked', ['user_id' => $user->id]);
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot change role after initial setup'
                ], 422);
            }
        } elseif ($user->role_id === null) {
            // role_id is required if not already set
            return response()->json([
                'success' => false,
                'message' => 'role_id is required for first-time profile setup',
                'errors' => ['role_id' => ['The role_id field is required.']]
            ], 422);
        }

        // Route to appropriate handler based on role
        try {
            if ($user->role_id == 3) {
                // Teacher profile update
                return $this->updateTeacherProfile($request, $user);
            } else if ($user->role_id == 4) {
                // Student profile update
                return $this->updateStudentProfile($request, $user);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid user role'
                ], 422);
            }
        } catch (\Exception $e) {
            Log::error('Profile update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update student profile
     * 
     * Handles:
     * - Basic profile info
     * - Profile photo upload
     * - User info updates
     */
    private function updateStudentProfile(Request $request, User $user)
    {
        try {
            DB::beginTransaction();

            // Update basic profile
            $profileData = $request->only(['bio', 'description', 'profile_photo_id', 'language_pref', 'terms_accepted']);
            $profileData['verified'] = $request->input('verified', 0);

            $profile = UserProfile::updateOrCreate(
                ['user_id' => $user->id],
                $profileData
            );

            // Update user basic info if provided
            if ($request->hasAny(['first_name', 'last_name', 'email', 'phone_number'])) {
                $updateData = $request->only(['first_name', 'last_name', 'email', 'phone_number']);
                
                // Normalize phone if provided
                if (isset($updateData['phone_number'])) {
                    $normalizedPhone = PhoneHelper::normalize($updateData['phone_number']);
                    if (!$normalizedPhone) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => 'Invalid phone number format.'
                        ], 422);
                    }
                    
                    // Check if phone already exists
                    $existingPhone = User::where('phone_number', $normalizedPhone)
                        ->where('id', '!=', $user->id)
                        ->first();
                    if ($existingPhone) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => 'Phone number already in use.'
                        ], 422);
                    }
                    
                    $updateData['phone_number'] = $normalizedPhone;
                }
                
                $user->update($updateData);
            }

            // Handle profile photo upload
            if ($request->hasFile('profile_photo')) {
                $this->saveAttachmentFile($request, 'profile_photo', 'profile_photos', $user, 'profile_picture');
            }

            DB::commit();

            // Prepare response
            $user->refresh();
            $profilePhoto = $user->attachments()
                ->where('attached_to_type', 'profile_picture')
                ->latest()
                ->value('file_path');

            return response()->json([
                'success' => true,
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
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Student profile update error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update teacher profile
     * 
     * Handles:
     * - Teacher basic info (services, pricing, classes, subjects)
     * - Individual teacher profile
     * - Institute teacher profile (if teacher_type = institute)
     */
    private function updateTeacherProfile(Request $request, User $user)
    {
        try {
            DB::beginTransaction();

            // Update basic profile
            $profileData = $request->only(['bio', 'description', 'profile_photo_id', 'language_pref', 'terms_accepted']);
            $profileData['verified'] = $request->input('verified', 0);

            $profile = UserProfile::updateOrCreate(
                ['user_id' => $user->id],
                $profileData
            );

            // Update user basic info
            if ($request->hasAny(['first_name', 'last_name', 'email', 'phone_number'])) {
                $updateData = $request->only(['first_name', 'last_name', 'email', 'phone_number']);
                
                if (isset($updateData['phone_number'])) {
                    $normalizedPhone = PhoneHelper::normalize($updateData['phone_number']);
                    if (!$normalizedPhone) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => 'Invalid phone number format.'
                        ], 422);
                    }
                    
                    $existingPhone = User::where('phone_number', $normalizedPhone)
                        ->where('id', '!=', $user->id)
                        ->first();
                    if ($existingPhone) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => 'Phone number already in use.'
                        ], 422);
                    }
                    
                    $updateData['phone_number'] = $normalizedPhone;
                }
                
                $user->update($updateData);
            }

            // Check if this is institute registration
            if ($request->input('teacher_type') === 'institute') {
                $this->updateInstituteProfile($request, $user);
            } else {
                // Individual teacher profile update
                $this->updateIndividualTeacherProfile($request, $user);
            }

            // Handle common teacher file uploads
            if ($request->hasFile('profile_photo')) {
                $this->saveAttachmentFile($request, 'profile_photo', 'profile_photos', $user, 'profile_picture');
            }
            if ($request->hasFile('certificate')) {
                $this->saveAttachmentFile($request, 'certificate', 'certificates', $user, 'certificate');
            }
            if ($request->hasFile('resume')) {
                $this->saveAttachmentFile($request, 'resume', 'resumes', $user, 'resume');
            }

            DB::commit();

            // Return full teacher data
            $user->refresh();
            $user->load([
                'profile.profilePhoto:id,file_path',
                'teacherInfo',
                'teacherClasses',
                'teacherSubjects',
                'availableSlots',
                'reviews',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => $this->getFullTeacherData($user)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Teacher profile update error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update individual teacher profile
     * 
     * Handles:
     * - Teaching info (prices, group size, services)
     * - Classes and subjects
     * - Availability slots
     */
    private function updateIndividualTeacherProfile(Request $request, User $user)
    {
        // Update teacher info if provided
        if ($request->hasAny(['bio', 'teach_individual', 'individual_hour_price', 'teach_group', 'group_hour_price', 'max_group_size', 'min_group_size'])) {
            $this->updateTeacherInfo($request);
        }

        // Update classes
        if ($request->has('class_ids')) {
            $this->updateTeacherClasses($request);
        }

        // Update subjects
        if ($request->has('subject_ids')) {
            $this->updateTeacherSubjects($request);
        }

        // Update services
        if ($request->has('services_id')) {
            $this->updateTeacherServices($request);
        }

        Log::info('Individual teacher profile updated', ['user_id' => $user->id]);
    }

    /**
     * Update institute teacher profile
     * 
     * Handles:
     * - Institute information
     * - Cover image and intro video uploads
     * - Status management
     * - Certificate uploads
     */
    private function updateInstituteProfile(Request $request, User $user)
    {
        // Validate institute fields
        $request->validate([
            'institute_name'        => 'nullable|string|max:255',
            'commercial_register'   => 'nullable|string|max:255',
            'license_number'        => 'nullable|string|max:255',
            'description'           => 'nullable|string|max:5000',
            'website'               => 'nullable|url|max:255',
        ]);

        // Find or create institute record
        $institute = TeacherInstitute::firstOrCreate(
            ['user_id' => $user->id],
            ['status' => 'pending']
        );

        // Update institute fields
        $updateData = $request->only([
            'institute_name',
            'commercial_register',
            'license_number',
            'description',
            'website'
        ]);

        if (!empty($updateData)) {
            $institute->update(array_filter($updateData)); // Only update non-null values
        }

        // Handle institute-specific file uploads
        if ($request->hasFile('cover_image')) {
            $this->saveInstituteAttachment($request, 'cover_image', 'institutes/covers', $institute, 'cover_image');
        }

        if ($request->hasFile('intro_video')) {
            $this->saveInstituteAttachment($request, 'intro_video', 'institutes/videos', $institute, 'intro_video');
        }

        // Certificates can be uploaded multiple times
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

        Log::info('Institute profile updated', [
            'user_id' => $user->id,
            'institute_id' => $institute->id,
            'status' => $institute->status
        ]);
    }

    /**
     * Save institute-specific attachments
     */
    private function saveInstituteAttachment(Request $request, $fieldName, $path, TeacherInstitute $institute, $attachmentType)
    {
        if (!$request->hasFile($fieldName)) {
            return;
        }

        try {
            // Delete old attachment if exists
            $oldAttachment = Attachment::where('user_id', $institute->user_id)
                ->where('attached_to_type', $attachmentType)
                ->where('attached_to_id', $institute->id)
                ->first();

            if ($oldAttachment && Storage::exists($oldAttachment->file_path)) {
                Storage::delete($oldAttachment->file_path);
            }

            // Upload new file
            $file = $request->file($fieldName);
            $filePath = $file->store($path, 'public');

            // Update or create attachment
            Attachment::updateOrCreate(
                [
                    'user_id' => $institute->user_id,
                    'attached_to_type' => $attachmentType,
                    'attached_to_id' => $institute->id,
                ],
                [
                    'file_path' => $filePath,
                ]
            );

            // Update institute table if applicable
            if ($attachmentType === 'cover_image') {
                $institute->update(['cover_image' => $filePath]);
            } elseif ($attachmentType === 'intro_video') {
                $institute->update(['intro_video' => $filePath]);
            }

            Log::info("Institute $attachmentType uploaded", [
                'user_id' => $institute->user_id,
                'path' => $filePath
            ]);

        } catch (\Exception $e) {
            Log::error("Failed to upload institute $attachmentType: " . $e->getMessage());
            throw $e;
        }
    }

    // List all teachers with optional filters
    public function listTeachers(Request $request)
    {
        $query = User::where('role_id', 3)
            ->where('is_active', 1)
            ->with(['teacherInfo', 'teacherServices', 'subjects', 'teacherLanguages']);

        /* =======================
         | Service Filter (Private Lessons, Language Study, Courses)
         ======================= */
        if ($request->filled('service_id') || $request->filled('service')) {
            $serviceParam = $request->input('service_id') ?? $request->input('service');

            $query->whereHas('teacherServices', function ($q) use ($serviceParam) {
                if (is_numeric($serviceParam)) {
                    // Filter by service ID (e.g., 1, 2, 3)
                    $q->where('service_id', $serviceParam);
                } else {
                    // Filter by service key_name (e.g., 'private_lessons', 'language_study', 'courses')
                    $q->whereHas('service', function ($subQ) use ($serviceParam) {
                        $subQ->where('key_name', strtolower($serviceParam));
                    });
                }
            });
        }

        /* =======================
         | Price Filter
         ======================= */
        if ($request->filled('min_price') || $request->filled('max_price')) {
            $query->whereHas('teacherInfo', function ($q) use ($request) {
                if ($request->filled('min_price')) {
                    $q->where(function ($x) use ($request) {
                        $x->where('individual_hour_price', '>=', $request->min_price)
                          ->orWhere('group_hour_price', '>=', $request->min_price);
                    });
                }

                if ($request->filled('max_price')) {
                    $q->where(function ($x) use ($request) {
                        $x->where('individual_hour_price', '<=', $request->max_price)
                          ->orWhere('group_hour_price', '<=', $request->max_price);
                    });
                }
            });
        }

        /* =======================
         | Subject / Class / Level Filter
         ======================= */
        if ($request->filled('subject_id') || $request->filled('class_id') || $request->filled('education_level_id')) {
            $query->whereHas('subjects', function ($q) use ($request) {
                if ($request->filled('subject_id')) {
                    $q->where('subjects.id', $request->subject_id);
                }
                if ($request->filled('class_id')) {
                    $q->where('subjects.class_id', $request->class_id);
                }
                if ($request->filled('education_level_id')) {
                    $q->where('subjects.education_level_id', $request->education_level_id);
                }
            });
        }

        /* =======================
         | Language Filter (for Language Study service)
         ======================= */
        if ($request->filled('language_id')) {
            $query->whereHas('teacherLanguages', function ($q) use ($request) {
                $q->where('language_id', $request->language_id);
            });
        }

        /* =======================
         | Rating Filter
         ======================= */
        if ($request->filled('min_rate')) {
            $query->whereHas('reviews', function ($q) use ($request) {
                $q->groupBy('reviewed_id')
                  ->havingRaw('AVG(rating) >= ?', [$request->min_rate]);
            });
        }

        /* =======================
         | Search Filter (by name or email)
         ======================= */
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        /* =======================
         | Pagination & Ordering
         ======================= */
        $teachers = $query->orderByDesc('id')
            ->paginate($request->get('per_page', 10));

        $teachers->getCollection()->transform(function ($teacher) {
            return $this->getFullTeacherData($teacher);
        });

        return response()->json([
            'success' => true,
            'data' => $teachers->items(),
            'pagination' => [
                'current_page' => $teachers->currentPage(),
                'last_page' => $teachers->lastPage(),
                'per_page' => $teachers->perPage(),
                'total' => $teachers->total(),
            ],
        ]);
    }




    public function teacherDetails($id)
    {
        $teacher = User::where('role_id', 3)
            ->where('is_active', 1)
            ->find($id);

        if (!$teacher) {
            return response()->json([
                'success' => false,
                'message' => 'Teacher not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->getFullTeacherData($teacher)
        ]);
    }

    public function createOrUpdateTeacherInfo(Request $request)
    {
        $request->validate([
            'bio' => 'nullable|string|max:2000',
            'teach_individual' => 'required|boolean',
            'individual_hour_price' => 'nullable|numeric|min:0',
            'teach_group' => 'required|boolean',
            'group_hour_price' => 'nullable|numeric|min:0',
            'max_group_size' => 'nullable|integer|max:5',
            'min_group_size' => 'nullable|integer|min:1',
            'class_ids' => 'required|array',
            'class_ids.*' => 'exists:classes,id',
            'subject_ids' => 'required|array',
            'subject_ids.*' => 'exists:subjects,id',
        ]);

        $teacher = $request->user();

        // Update or create TeacherInfo
        $info = TeacherInfo::updateOrCreate(
            ['teacher_id' => $teacher->id],
            $request->only([
                'bio',
                'teach_individual',
                'individual_hour_price',
                'teach_group',
                'group_hour_price',
                'max_group_size',
                'min_group_size'
            ])
        );

        // Sync classes
        TeacherTeachClasses::where('teacher_id', $teacher->id)->delete();
        foreach ($request->class_ids as $class_id) {
            TeacherTeachClasses::create([
                'teacher_id' => $teacher->id,
                'class_id' => $class_id,
            ]);
        }

        // Sync subjects
        TeacherSubject::where('teacher_id', $teacher->id)->delete();
        foreach ($request->subject_ids as $subject_id) {
            TeacherSubject::create([
                'teacher_id' => $teacher->id,
                'subject_id' => $subject_id,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Teacher info, classes, and subjects updated successfully',
            'data' => [
                'info' => $info,
                'classes' => $request->class_ids,
                'subjects' => $request->subject_ids,
            ]
        ]);
    }

    // Update or create teacher info only
    public function updateTeacherInfo(Request $request)
    {
        $request->validate([
            'bio' => 'nullable|string|max:2000',
            'teach_individual' => 'required|boolean',
            'individual_hour_price' => 'nullable|numeric|min:0',
            'teach_group' => 'required|boolean',
            'group_hour_price' => 'nullable|numeric|min:0',
            'max_group_size' => 'nullable|integer|max:5',
            'min_group_size' => 'nullable|integer|min:1',
        ]);

        $teacher = $request->user();
        $info = TeacherInfo::updateOrCreate(
            ['teacher_id' => $teacher->id],
            $request->only([
                'bio',
                'teach_individual',
                'individual_hour_price',
                'teach_group',
                'group_hour_price',
                'max_group_size',
                'min_group_size'
            ])
        );

        return response()->json([
            'success' => true,
            'data' => $info
        ]);
    }

    // Update or create teacher classes only
    public function updateTeacherClasses(Request $request)
    {
        $request->validate([
            'class_ids' => 'required|array',
            'class_ids.*' => 'exists:classes,id',
        ]);

        $teacher = $request->user();
        TeacherTeachClasses::where('teacher_id', $teacher->id)->delete();
        foreach ($request->class_ids as $class_id) {
            TeacherTeachClasses::create([
                'teacher_id' => $teacher->id,
                'class_id' => $class_id,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $request->class_ids
        ]);
    }

    // Update or create teacher services only
    public function updateTeacherServices(Request $request)
    {
        $request->validate([
            'services_id' => 'required|array',
            'services_id.*' => 'exists:services,id',
        ]);

        $teacher = $request->user();
        TeacherServices::where('teacher_id', $teacher->id)->delete();

        try {
            foreach ($request->services_id as $service_id) {
                TeacherServices::create([
                    'teacher_id' => $teacher->id,
                    'service_id' => $service_id,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('TeacherServices save error: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }

        return response()->json([
            'success' => true,
            'data' => $request->services_id
        ]);
    }

    // Update or create teacher subjects only
    public function updateTeacherSubjects(Request $request)
    {
        $request->validate([
            'subject_ids' => 'required|array',
            'subject_ids.*' => 'exists:subjects,id',
        ]);

        $teacher = $request->user();
        TeacherSubject::where('teacher_id', $teacher->id)->delete();
        foreach ($request->subject_ids as $subject_id) {
            TeacherSubject::create([
                'teacher_id' => $teacher->id,
                'subject_id' => $subject_id,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $request->subject_ids
        ]);
    }


    // Delete account
    public function deleteAccount(Request $request)
    {
        $user = $request->user();
        
        try {
            // Revoke all tokens
            $user->tokens()->delete();
            
            // Delete the user
            $user->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Account deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete account',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Helper to get full teacher data
    public function getFullTeacherData(User $teacher)
    {
        // Get latest attachments
        $profilePhoto = $teacher->attachments()
            ->where('attached_to_type', 'profile_picture')
            ->latest()
            ->value('file_path');
        $resume = $teacher->attachments()
            ->where('attached_to_type', 'resume')
            ->latest()
            ->value('file_path');
        $certificate = $teacher->attachments()
            ->where('attached_to_type', 'certificate')
            ->latest()
            ->value('file_path');

        // Return the certificate attachment record (if exists) so client can show filename / id
        $certificateAttachment = $teacher->attachments()
            ->where('attached_to_type', 'certificate')
            ->latest()
            ->first(['id', 'file_name', 'file_path', 'created_at']);

        // Get teacher services (teacher_services pivot) with related service details
        $rawTS = TeacherServices::where('teacher_id', $teacher->id)
            ->with('service')
            ->get();

        // Deduplicate by service_id to avoid duplicate service entries when the pivot was inserted twice
        $uniqueTS = $rawTS->unique('service_id')->values();

        $teacherServices = $uniqueTS->map(function ($ts) use ($teacher) {
            $svc = $ts->service;
            return [
                'id' => $ts->id,
                'teacher_id' => $ts->teacher_id,
                'service_id' => $ts->service_id,
                'key_name' => $svc->key_name ?? null,
                'name_en' => $svc->name_en ?? null,
                'name_ar' => $svc->name_ar ?? null,
                'description_en' => $svc->description_en ?? null,
                'description_ar' => $svc->description_ar ?? null,
                'image' => $svc->image ?? null,
                'status' => $svc->status ?? null,
                // There is currently no per-service verification column in teacher_services.
                // We use the teacher profile verified flag as a fallback. To support per-service
                // verification, add a `verified` column to `teacher_services` and include it here.
                'verified' => (bool) optional($teacher->profile)->verified,
            ];
        })->values()->toArray();

        // Determine primary service for this teacher (teachers are expected to have at most one)
        // Use the first unique service if multiple were mistakenly added
        $primaryTS = $uniqueTS->first();

        $primaryServiceId = 0;
        $primaryServiceDetails = null;
        $courses = [];
        $languages = [];
        $isPrivateService = false;

        if ($primaryTS && $primaryTS->service) {
            $svc = $primaryTS->service;
            $primaryServiceId = (int) $svc->id;
            $primaryServiceDetails = [
                'id' => $svc->id,
                'key_name' => $svc->key_name ?? null,
                'name_en' => $svc->name_en ?? null,
                'name_ar' => $svc->name_ar ?? null,
                'description_en' => $svc->description_en ?? null,
                'description_ar' => $svc->description_ar ?? null,
                'image' => $svc->image ?? null,
                'status' => $svc->status ?? null,
                // use profile verified as fallback for now
                'verified' => (bool) optional($teacher->profile)->verified,
            ];

            // Conditional details depending on service type
            $key = strtolower($svc->key_name ?? '');

            // Private lessons: include subjects and courses
            if (str_contains($key, 'private') || $key === 'private_lessons') {
                $isPrivateService = true;
                // $teacherSubjects already contains subject details
                // Fetch courses with basic fields and cover image, but only those matching the primary service
                if ($primaryServiceId) {
                    $courses = Course::where('teacher_id', $teacher->id)
                        ->where('service_id', $primaryServiceId)
                        ->with(['coverImage'])
                        ->get()
                        ->map(function ($c) {
                            return [
                                'id' => $c->id,
                                'name' => $c->name,
                                'description' => $c->description,
                                'price' => $c->price,
                                'duration_hours' => $c->duration_hours,
                                'status' => $c->status,
                                'cover_image' => optional($c->coverImage)->file_path ?? null,
                            ];
                        })->values()->toArray();
                }
            }

            // Language study service: include teacher languages
            if (str_contains($key, 'lang') || str_contains($key, 'language') || str_contains($key, 'languages')) {
                $languages = TeacherLanguage::where('teacher_id', $teacher->id)
                    ->with('language')
                    ->get()
                    ->map(function ($tl) {
                        return [
                            'id' => $tl->id,
                            'language_id' => $tl->language_id,
                            'name_en' => optional($tl->language)->name_en ?? null,
                            'name_ar' => optional($tl->language)->name_ar ?? null,
                        ];
                    })->values()->toArray();
            }
        }

        // Get earnings data
        $earnings = DB::table('wallets')
            ->where('user_id', $teacher->id)
            ->select(
                DB::raw('balance as total_earnings'),
            )
            ->first();

        // Current lessons count
        $currentLessons = DB::table('bookings')
            ->where('teacher_id', $teacher->id)
            ->where('status', 'active')
            ->count();

        // Total bookings (all statuses)
        $totalBookings = DB::table('bookings')
            ->where('teacher_id', $teacher->id)
            ->count();

        // Get reviews
        $reviews = Review::where('reviewed_id', $teacher->id)->get();
        $rating = round($reviews->avg('rating') ?? 0, 1);

        // Get teacher subjects with detailed info
        $teacherSubjects = TeacherSubject::where('teacher_id', $teacher->id)
            ->with([
                'subject' => function ($q) {
                    $q->select('id', 'name_en', 'name_ar', 'class_id', 'education_level_id');
                },
                'subject.class' => function ($q) {
                    $q->select('id', 'name_en', 'name_ar', 'education_level_id');
                },
                'subject.educationLevel' => function ($q) {
                    $q->select('id', 'name_en', 'name_ar');
                }
            ])
            ->get()
            ->map(function ($teacherSubject) {
                return [
                    'id' => $teacherSubject->id,
                    'teacher_id' => $teacherSubject->teacher_id,
                    'subject_id' => optional($teacherSubject->subject)->id ?? $teacherSubject->subject_id,
                    'title' => $teacherSubject->subject->name_ar ?? $teacherSubject->subject->name_en,
                    'class_id' => $teacherSubject->subject->class_id,
                    'class_level_id' => $teacherSubject->subject->education_level_id,
                    'class_level_title' => optional($teacherSubject->subject->educationLevel)->name_ar,
                    'class_title' => optional($teacherSubject->subject->class)->name_ar,
                ];
            })
            ->values()
            ->toArray();

        // Get availability slots grouped by day
        $availabilitySlots = AvailabilitySlot::where('teacher_id', $teacher->id)
            ->where('is_available', true)
            ->get()
            ->groupBy('day_number');

        // Map day numbers to Arabic day names
        $dayNames = [
            1 => 'الاحد',      // Sunday
            2 => 'الاتنين',     // Monday
            3 => 'الثلاثاء',    // Tuesday
            4 => 'الاربعاء',    // Wednesday
            5 => 'الخميس',      // Thursday
            6 => 'الجمعة',      // Friday
            7 => 'السبت',       // Saturday
        ];

        $availableTimes = [];
        foreach ($availabilitySlots as $dayNumber => $slots) {
            $dayName = $dayNames[$dayNumber] ?? 'unknown';
            $times = $slots->map(function ($slot) {
                return [
                    'id' => $slot->id,
                    'time' => $slot->start_time->format('h:i A') // Format time as "5:00 PM"
                ];
            })->values()->toArray();

            $availableTimes[] = [
                'id' => $dayNumber,
                'day' => $dayName,
                'times' => $times
            ];
        }

        // Return complete teacher data structure
        return [
            'id' => $teacher->id,
            'first_name' => $teacher->first_name,
            'last_name' => $teacher->last_name,
            'email' => $teacher->email,
            'phone_number' => $teacher->phone_number,
            'email_verified_at' => $teacher->email_verified_at,
            'role_id' => $teacher->role_id,
            'gender' => $teacher->gender,
            'nationality' => $teacher->nationality,
            'verified' => (bool) optional($teacher->profile)->verified,
            'verification_code' => $teacher->verification_code,
            'social_provider' => $teacher->social_provider,
            'social_provider_id' => $teacher->social_provider_id,
            'profile' => [
                'is_active' => (int) $teacher->is_active,
                'profile_photo' => $profilePhoto,
                'resume' => $resume,
                'certificate' => $certificate,
                'reviews' => $reviews,
                'rating' => $rating,
                'bio' => optional($teacher->profile)->bio,
                'total_students' => (int) (optional($teacher->teacherInfo)->total_students ?? 0),
                'verified' => (bool) optional($teacher->profile)->verified,
                'service' => $primaryServiceId,
                'services' => $teacherServices,
                'courses' => $courses,
                'languages' => $languages,
                'available_times' => $availableTimes,
                'certificate_attachment' => $certificateAttachment,
                'earnings' => $earnings,
                'currentLessons' => $currentLessons,
                // Counts requested by client
                'bookings_count' => (int) $totalBookings,
                'subjects_count' => (int) count($teacherSubjects),
                'languages_count' => (int) count($languages),
                'courses_count' => (int) count($courses),
                'teach_individual' => (bool) optional($teacher->teacherInfo)->teach_individual,
                'individual_hour_price' => (float) (optional($teacher->teacherInfo)->individual_hour_price ?? 0),
                'teach_group' => (bool) optional($teacher->teacherInfo)->teach_group,
                'group_hour_price' => (float) (optional($teacher->teacherInfo)->group_hour_price ?? 0),
                'max_group_size' => (int) (optional($teacher->teacherInfo)->max_group_size ?? 0),
                'min_group_size' => (int) (optional($teacher->teacherInfo)->min_group_size ?? 0),
                'teacher_subjects' => $teacherSubjects,
            ]
        ];
    }


    private function handleFileUpload(Request $request, string $key, string $folder, User $user)
    {
        if (!$request->hasFile($key)) {
            return null;
        }

        $file = $request->file($key);
        $path = $file->store($folder, 'public'); // Saves to storage/app/public/$folder

        $attachment = \App\Models\Attachment::create([
            'user_id'   => $user->id,
            'file_path' => asset('storage/' . $path), // Full URL for mobile apps
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $file->getClientMimeType(),
        ]);

        return $attachment->file_path;
    }


    private function saveAttachmentFile(Request $request, string $key, string $folder, User $user, string $attachedToType): ?string
    {
        if (!$request->hasFile($key)) {
            return null;
        }

        try {
            $file = $request->file($key);
            $path = $file->store($folder, 'public'); // Saves to storage/app/public/$folder
            $fileUrl = asset('storage/' . $path);

            // Create attachment record in database
            $attachment = Attachment::create([
                'user_id'           => $user->id,
                'file_path'         => $fileUrl,
                'file_name'         => $file->getClientOriginalName(),
                'file_type'         => $file->getClientMimeType(),
                'file_size'         => $file->getSize(),
                'attached_to_type'      => $attachedToType, // Store as profile-related attachment
            ]);

            Log::info('File uploaded and attachment created', [
                'user_id' => $user->id,
                'file_name' => $file->getClientOriginalName(),
                'attachment_id' => $attachment->id,
                'file_path' => $fileUrl
            ]);

            return $fileUrl;
        } catch (\Exception $e) {
            Log::error('Failed to save attachment file', [
                'user_id' => $user->id,
                'key' => $key,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    public function listCertificates(Request $request)
    {
        $user = $request->user();

        $certificates = Attachment::where('user_id', $user->id)
            ->where('attached_to_type', 'certificate')
            ->get(['id', 'file_name', 'file_path', 'created_at']);

        return response()->json([
            'success' => true,
            'data' => $certificates
        ]);
    }
}
