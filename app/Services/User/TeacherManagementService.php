<?php

namespace App\Services\User;

use App\Models\User;
use App\Models\TeacherInfo;
use App\Models\TeacherTeachClasses;
use App\Models\TeacherSubject;
use App\Models\TeacherServices;
use App\Models\UserProfile;
use App\Models\Attachment;
use App\Helpers\TeacherProfileHelper;
use App\Helpers\ProfileCompleteHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TeacherManagementService
{
    /**
     * Create or update full teacher info, classes, and subjects.
     */
    public function createOrUpdateTeacherInfo(Request $request, User $teacher): array
    {
        $info = TeacherInfo::updateOrCreate(
            ['teacher_id' => $teacher->id],
            $request->only([
                'bio',
                'teach_individual',
                'package_on_off',
                'individual_hour_price',
                'teach_group',
                'group_hour_price',
                'max_group_size',
                'min_group_size'
            ])
        );

        if ($request->filled('class_ids')) {
            TeacherTeachClasses::where('teacher_id', $teacher->id)->delete();
            foreach ($request->class_ids as $class_id) {
                TeacherTeachClasses::create([
                    'teacher_id' => $teacher->id,
                    'class_id' => $class_id,
                ]);
            }
        }

        if ($request->filled('subject_ids')) {
            TeacherSubject::where('teacher_id', $teacher->id)->delete();
            foreach ($request->subject_ids as $subject_id) {
                TeacherSubject::create([
                    'teacher_id' => $teacher->id,
                    'subject_id' => $subject_id,
                ]);
            }
        }

        TeacherProfileHelper::checkAndUpdateProfileCompleted($teacher->id);

        try {
            ProfileCompleteHelper::sync($teacher->id);
        } catch (\Exception $e) {
            Log::warning('Failed to sync ProfileComplete after teacher info update', ['teacher_id' => $teacher->id, 'error' => $e->getMessage()]);
        }

        return [
            'success' => true,
            'status_code' => 200,
            'message' => 'Teacher info, classes, and subjects updated successfully',
            'data' => [
                'info' => $info,
                'classes' => $request->class_ids ?? [],
                'subjects' => $request->subject_ids ?? [],
            ],
        ];
    }

    /**
     * Update teacher info only.
     */
    public function updateTeacherInfo(Request $request, User $teacher): array
    {
        $info = TeacherInfo::updateOrCreate(
            ['teacher_id' => $teacher->id],
            $request->only([
                'bio',
                'teach_individual',
                'package_on_off',
                'individual_hour_price',
                'teach_group',
                'group_hour_price',
                'max_group_size',
                'min_group_size'
            ])
        );

        return [
            'success' => true,
            'status_code' => 200,
            'data' => $info,
        ];
    }

    /**
     * Update teacher classes only.
     */
    public function updateTeacherClasses(Request $request, User $teacher): array
    {
        TeacherTeachClasses::where('teacher_id', $teacher->id)->delete();
        foreach ($request->class_ids as $class_id) {
            TeacherTeachClasses::create([
                'teacher_id' => $teacher->id,
                'class_id' => $class_id,
            ]);
        }

        return [
            'success' => true,
            'status_code' => 200,
            'data' => $request->class_ids,
        ];
    }

    /**
     * Update teacher services.
     */
    public function updateTeacherServices(Request $request, User $teacher): array
    {
        $servicesKey = $request->has('services_id') ? 'services_id' : 'services';
        $servicesInput = $request->input($servicesKey);

        if (!is_array($servicesInput)) {
            if (is_string($servicesInput) && !empty($servicesInput)) {
                $servicesInput = array_map('trim', explode(',', $servicesInput));
            } else {
                $servicesInput = [];
            }
        }

        if (empty($servicesInput)) {
            return [
                'success' => false,
                'status_code' => 422,
                'message' => 'No services provided',
                'error' => 'At least one service must be selected',
            ];
        }

        try {
            TeacherServices::where('teacher_id', $teacher->id)->delete();

            foreach ($servicesInput as $service_id) {
                $service_id = (int) $service_id;
                $serviceExists = DB::table('services')->where('id', $service_id)->exists();
                if (!$serviceExists) {
                    continue;
                }

                TeacherServices::create([
                    'teacher_id' => $teacher->id,
                    'service_id' => $service_id,
                ]);
            }

            return [
                'success' => true,
                'status_code' => 200,
                'message' => 'Services updated successfully',
                'data' => $servicesInput,
            ];
        } catch (\Exception $e) {
            Log::error('TeacherServices save error: ' . $e->getMessage());
            return [
                'success' => false,
                'status_code' => 500,
                'error' => 'Failed to save services: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Update teacher subjects only.
     */
    public function updateTeacherSubjects(Request $request, User $teacher): array
    {
        TeacherSubject::where('teacher_id', $teacher->id)->delete();
        foreach ($request->subject_ids as $subject_id) {
            TeacherSubject::create([
                'teacher_id' => $teacher->id,
                'subject_id' => $subject_id,
            ]);
        }

        return [
            'success' => true,
            'status_code' => 200,
            'data' => $request->subject_ids,
        ];
    }

    /**
     * Update active status for teacher.
     */
    public function updateActiveStatus(Request $request, User $user): array
    {
        $isActive = $request->boolean('is_active');

        if ($isActive) {
            $userProfile = UserProfile::where('user_id', $user->id)->first();
            if (!$userProfile || !$userProfile->verified) {
                return [
                    'success' => false,
                    'status_code' => 422,
                    'message' => 'Cannot activate account. User profile must be verified first.',
                    'error' => 'Profile not verified',
                ];
            }
        }

        $user->is_active = $isActive;
        $user->save();

        return [
            'success' => true,
            'status_code' => 200,
            'message' => 'Active status updated successfully',
            'data' => [
                'is_active' => (bool) $user->is_active,
                'verified' => (bool) optional($user->profile)->verified,
            ],
        ];
    }

    /**
     * List user certificates.
     */
    public function listCertificates(User $user): array
    {
        $certificates = Attachment::where('user_id', $user->id)
            ->where('attached_to_type', 'certificate')
            ->get(['id', 'file_name', 'file_path', 'created_at']);

        return [
            'success' => true,
            'status_code' => 200,
            'data' => $certificates,
        ];
    }
}
