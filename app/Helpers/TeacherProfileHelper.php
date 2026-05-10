<?php

namespace App\Helpers;

use App\Models\User;
use App\Models\Course;
use Illuminate\Support\Facades\Log;

/**
 * TeacherProfileHelper
 * 
 * Validates and manages teacher profile completeness based on their services.
 * Different services have different requirements:
 * 
 * - COURSES: Must have at least one course created
 * - LANGUAGE_STUDY: Must have available slots + at least one language + hour price set
 * - PRIVATE_LESSONS: Must have available slots + at least one subject + hour price set
 */
class TeacherProfileHelper
{
    // Service key names
    const SERVICE_COURSES = 'courses';
    const SERVICE_LANGUAGE_STUDY = 'language_learning';
    const SERVICE_PRIVATE_LESSONS = 'private_lesson';

    /**
     * Check and update the profile_completed status based on service requirements
     * 
     * @param int $teacher_id
     * @return bool - true if profile is complete, false otherwise
     */
    public static function checkAndUpdateProfileCompleted($teacher_id): bool
    {
        $user = User::find($teacher_id);
        if (!$user) {
            return false;
        }

        $isComplete = self::isProfileComplete($teacher_id);
        
        User::where('id', $teacher_id)->update(['profile_completed' => $isComplete]);

        return $isComplete;
    }

    /**
     * Check if a teacher's profile is complete without updating the database
     * 
     * @param int $teacher_id
     * @return bool - true if profile meets all service requirements
     */
    public static function isProfileComplete($teacher_id): bool
    {
        $user = User::find($teacher_id);
        if (!$user) {
            Log::warning("TeacherProfileHelper: Teacher not found", ['teacher_id' => $teacher_id]);
            return false;
        }

        $serviceKeys = self::getTeacherServiceKeys($teacher_id);

        // If no services selected, profile is incomplete
        if (empty($serviceKeys)) {
            Log::warning("TeacherProfileHelper: No services selected", ['teacher_id' => $teacher_id]);
            return false;
        }

        // Check if each service has complete data
        foreach ($serviceKeys as $serviceKey) {
            if (!self::isServiceComplete($user, $serviceKey)) {
                $reason = self::getServiceIncompleteReason($user, $serviceKey);
                Log::warning("TeacherProfileHelper: Service incomplete", [
                    'teacher_id' => $teacher_id,
                    'teacher_name' => $user->first_name . ' ' . $user->last_name,
                    'service' => $serviceKey,
                    'reason' => $reason
                ]);
                return false;
            }
        }

        Log::info("TeacherProfileHelper: Profile complete", [
            'teacher_id' => $teacher_id,
            'teacher_name' => $user->first_name . ' ' . $user->last_name,
            'services' => $serviceKeys
        ]);

        return true;
    }

    /**
     * Check if a specific service has complete data
     * 
     * @param User $user
     * @param string $serviceKey
     * @return bool - true if service requirements are met
     */
    public static function isServiceComplete(User $user, string $serviceKey): bool
    {
        $serviceKey = strtolower($serviceKey);

        switch ($serviceKey) {
            case self::SERVICE_COURSES:
                return self::isCoursesServiceComplete($user);
                
            case self::SERVICE_LANGUAGE_STUDY:
            case 'language_study': // Support both old and new names
                return self::isLanguageStudyServiceComplete($user);
                
            case self::SERVICE_PRIVATE_LESSONS:
            case 'private_lessons': // Support both old and new names
                return self::isPrivateLessonsServiceComplete($user);
                
            default:
                return false;
        }
    }

    /**
     * Check if COURSES service has complete data
     * Requirements:
     * - At least one course must be created
     * 
     * @param User $user
     * @return bool
     */
    private static function isCoursesServiceComplete(User $user): bool
    {
        $coursesCount = Course::where('teacher_id', $user->id)->count();
        
        if ($coursesCount == 0) {
            Log::debug("TeacherProfileHelper: No courses created", ['teacher_id' => $user->id]);
            return false;
        }

        Log::debug("TeacherProfileHelper: Courses service complete", [
            'teacher_id' => $user->id,
            'courses_count' => $coursesCount
        ]);

        return true;
    }

    /**
     * Check if LANGUAGE_STUDY service has complete data
     * Requirements:
     * - At least one available slot
     * - At least one language added
     * - Hour price set (individual_hour_price > 0)
     * - Teacher info exists
     * 
     * @param User $user
     * @return bool
     */
    private static function isLanguageStudyServiceComplete(User $user): bool
    {
        // Check 1: Teacher info exists and has hour price
        $teacherInfo = $user->teacherInfo()->first();
        if (!$teacherInfo) {
            Log::debug("TeacherProfileHelper: No TeacherInfo record", ['teacher_id' => $user->id]);
            return false;
        }
        if (!$teacherInfo->individual_hour_price || $teacherInfo->individual_hour_price <= 0) {
            Log::debug("TeacherProfileHelper: No hour price set", [
                'teacher_id' => $user->id,
                'hour_price' => $teacherInfo->individual_hour_price
            ]);
            return false;
        }

        // Check 2: At least one available slot
        $slotsCount = $user->availableSlots()->count();
        if ($slotsCount == 0) {
            Log::debug("TeacherProfileHelper: No available slots", ['teacher_id' => $user->id]);
            return false;
        }

        // Check 3: At least one language added
        $languagesCount = $user->teacherLanguages()->count();
        if ($languagesCount == 0) {
            Log::debug("TeacherProfileHelper: No languages added", ['teacher_id' => $user->id]);
            return false;
        }

        Log::debug("TeacherProfileHelper: Language Study complete", [
            'teacher_id' => $user->id,
            'hour_price' => $teacherInfo->individual_hour_price,
            'slots_count' => $slotsCount,
            'languages_count' => $languagesCount
        ]);

        return true;
    }

    /**
     * Check if PRIVATE_LESSONS service has complete data
     * Requirements:
     * - At least one available slot
     * - At least one subject added
     * - Hour price set (individual_hour_price > 0)
     * - Teacher info exists
     * 
     * @param User $user
     * @return bool
     */
    private static function isPrivateLessonsServiceComplete(User $user): bool
    {
        // Check 1: Teacher info exists and has hour price
        $teacherInfo = $user->teacherInfo()->first();
        if (!$teacherInfo) {
            Log::debug("TeacherProfileHelper: No TeacherInfo record", ['teacher_id' => $user->id]);
            return false;
        }
        if (!$teacherInfo->individual_hour_price || $teacherInfo->individual_hour_price <= 0) {
            Log::debug("TeacherProfileHelper: No hour price set", [
                'teacher_id' => $user->id,
                'hour_price' => $teacherInfo->individual_hour_price
            ]);
            return false;
        }

        // Check 2: At least one available slot
        $slotsCount = $user->availableSlots()->count();
        if ($slotsCount == 0) {
            Log::debug("TeacherProfileHelper: No available slots", ['teacher_id' => $user->id]);
            return false;
        }

        // Check 3: At least one subject added
        $subjectsCount = $user->subjects()->count();
        if ($subjectsCount == 0) {
            Log::debug("TeacherProfileHelper: No subjects added", ['teacher_id' => $user->id]);
            return false;
        }

        Log::debug("TeacherProfileHelper: Private Lessons complete", [
            'teacher_id' => $user->id,
            'hour_price' => $teacherInfo->individual_hour_price,
            'slots_count' => $slotsCount,
            'subjects_count' => $subjectsCount
        ]);

        return true;
    }

    /**
     * Get the reason why a teacher's profile is incomplete
     * Useful for showing error messages to teachers
     * 
     * @param int $teacher_id
     * @return string|null - Reason message or null if complete
     */
    public static function getIncompleteReason($teacher_id): ?string
    {
        $user = User::find($teacher_id);
        if (!$user) {
            return 'Teacher not found';
        }

        $serviceKeys = self::getTeacherServiceKeys($teacher_id);

        if (empty($serviceKeys)) {
            return 'No services selected. Please select at least one service (Courses, Language Study, or Private Lessons).';
        }

        foreach ($serviceKeys as $serviceKey) {
            $reason = self::getServiceIncompleteReason($user, $serviceKey);
            if ($reason) {
                return $reason;
            }
        }

        return null; // Profile is complete
    }

    /**
     * Get the reason why a specific service is incomplete
     * 
     * @param User $user
     * @param string $serviceKey
     * @return string|null - Reason message or null if complete
     */
    public static function getServiceIncompleteReason(User $user, string $serviceKey): ?string
    {
        $serviceKey = strtolower($serviceKey);

        switch ($serviceKey) {
            case self::SERVICE_COURSES:
                if (!Course::where('teacher_id', $user->id)->exists()) {
                    return 'Courses Service: You must create at least one course.';
                }
                return null;

            case self::SERVICE_LANGUAGE_STUDY:
            case 'language_study':
                $teacherInfo = $user->teacherInfo()->first();
                if (!$teacherInfo) {
                    return 'Language Learning Service: Please complete your teacher profile information.';
                }
                if (!$teacherInfo->individual_hour_price || $teacherInfo->individual_hour_price <= 0) {
                    return 'Language Learning Service: Please set your hourly rate.';
                }
                if (!$user->availableSlots()->exists()) {
                    return 'Language Learning Service: You must add at least one available time slot.';
                }
                if (!$user->teacherLanguages()->exists()) {
                    return 'Language Learning Service: You must add at least one language.';
                }
                return null;

            case self::SERVICE_PRIVATE_LESSONS:
            case 'private_lessons':
                $teacherInfo = $user->teacherInfo()->first();
                if (!$teacherInfo) {
                    return 'Private Lesson Service: Please complete your teacher profile information.';
                }
                if (!$teacherInfo->individual_hour_price || $teacherInfo->individual_hour_price <= 0) {
                    return 'Private Lesson Service: Please set your hourly rate.';
                }
                if (!$user->availableSlots()->exists()) {
                    return 'Private Lesson Service: You must add at least one available time slot.';
                }
                if (!$user->subjects()->exists()) {
                    return 'Private Lesson Service: You must add at least one subject.';
                }
                return null;

            default:
                return null;
        }
    }

    /**
     * Get all service keys for a teacher
     * 
     * @param int $teacher_id
     * @return array - Array of service key names (e.g., ['courses', 'private_lessons'])
     */
    public static function getTeacherServiceKeys($teacher_id): array
    {
        $user = User::find($teacher_id);
        if (!$user) {
            return [];
        }

        return $user->teacherServices()
            ->with('service')
            ->get()
            ->pluck('service.key_name')
            ->filter()
            ->values()
            ->toArray();
    }

    /**
     * Get all services for a teacher with their completion status
     * Useful for showing which services are ready and which need completion
     * 
     * @param int $teacher_id
     * @return array - Array of services with completion status
     */
    public static function getTeacherServicesStatus($teacher_id): array
    {
        $user = User::find($teacher_id);
        if (!$user) {
            return [];
        }

        $services = $user->teacherServices()
            ->with('service')
            ->get();

        return $services->map(function ($teacherService) use ($user) {
            $serviceKey = $teacherService->service->key_name;
            $isComplete = self::isServiceComplete($user, $serviceKey);
            $reason = !$isComplete ? self::getServiceIncompleteReason($user, $serviceKey) : null;

            return [
                'service_id' => $teacherService->service->id,
                'service_name' => $teacherService->service->name_en ?? $teacherService->service->key_name,
                'service_key' => $serviceKey,
                'is_complete' => $isComplete,
                'incomplete_reason' => $reason,
            ];
        })->toArray();
    }

    /**
     * Check if a teacher can be displayed to students in listings
     * Returns false if profile is incomplete
     * 
     * @param User $teacher
     * @return bool
     */
    public static function canDisplayToStudents(User $teacher): bool
    {
        return $teacher->profile_completed === true;
    }

    /**
     * Validate teacher profile status and log any issues
     * Useful for background jobs or debugging
     * 
     * @param int $teacher_id
     * @return array - Status information
     */
    public static function validateTeacherProfile($teacher_id): array
    {
        $user = User::find($teacher_id);
        if (!$user) {
            return [
                'valid' => false,
                'teacher_id' => $teacher_id,
                'error' => 'Teacher not found',
            ];
        }

        $isComplete = self::isProfileComplete($teacher_id);
        $reason = !$isComplete ? self::getIncompleteReason($teacher_id) : null;
        $services = self::getTeacherServicesStatus($teacher_id);

        return [
            'valid' => $isComplete,
            'teacher_id' => $teacher_id,
            'teacher_name' => $user->first_name . ' ' . $user->last_name,
            'profile_completed_flag' => $user->profile_completed,
            'services' => $services,
            'incomplete_reason' => $reason,
        ];
    }
}
