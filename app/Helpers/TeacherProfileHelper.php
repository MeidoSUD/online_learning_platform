<?php

namespace App\Helpers;

use App\Models\User;
use App\Models\Course;
use Illuminate\Support\Facades\Log;
class TeacherProfileHelper
{
    public static function checkAndUpdateProfileCompleted($teacher_id): bool
    {
        $user = User::find($teacher_id);
        if (!$user) {
            return false;
        }

        $serviceKeys = self::getTeacherServiceKeys($teacher_id);

        if (in_array('courses', $serviceKeys)) {
            $profileCompleted = Course::where('teacher_id', $teacher_id)->exists();
        } elseif (in_array('private_lesson', $serviceKeys)) {
            $profileCompleted = $user->subjects()->exists();
        } else {
            $profileCompleted = false;
        }
 
        User::where('id', $teacher_id)->update(['profile_completed' => $profileCompleted]);

        return $profileCompleted;
    }

    public static function isProfileCompleted(User $teacher): bool
    {
        return (bool) $teacher->profile_completed;
    }

    public static function getTeacherServiceKeys($teacher_id): array
    {
        $user = User::find($teacher_id);
        if (!$user) {
            return [];
        }

        return $user->teacherServices()->with('service')->get()->pluck('service.key_name')->filter()->values()->toArray();
    }
}
