<?php

namespace App\Helpers;

use App\Models\User;
use App\Models\Course;

class TeacherProfileHelper
{
    public static function checkAndUpdateProfileCompleted($teacher_id): bool
    {
        $hasCourses = Course::where('teacher_id', $teacher_id)->exists();
        User::where('id', $teacher_id)->update(['profile_completed' => $hasCourses]);
       
        return $hasCourses;
    }

    public static function isProfileCompleted(User $teacher): bool
    {
        return (bool) $teacher->profile_completed;
    }
}
