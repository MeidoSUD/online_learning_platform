<?php

namespace App\Services\User;

use App\Models\User;
use App\Models\Course;
use App\Models\TeacherServices;
use App\Models\TeacherSubject;
use App\Models\TeacherLanguage;
use App\Models\AvailabilitySlot;
use App\Models\PlatformPercentage;
use App\Models\Review;
use App\Helpers\TeacherProfileHelper;
use App\Helpers\PackageBookingHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\PersonalAccessToken;

class TeacherProfileService
{
    /**
     * Get all teachers with advanced filtering and pagination.
     */
    public function listTeachers(Request $request): array
    {
        $allTeachersWithServices = User::where('role_id', 3)
            ->where('is_active', 1)
            ->whereHas('teacherServices')
            ->pluck('id');

        foreach ($allTeachersWithServices as $teacherId) {
            TeacherProfileHelper::checkAndUpdateProfileCompleted($teacherId);
        }

        $query = User::where('role_id', 3)
            ->where('is_active', 1)
            ->where('profile_completed', 1)
            ->with(['teacherInfo', 'teacherServices', 'subjects', 'teacherLanguages']);

        /* Service Filter */
        if ($request->filled('service_id') || $request->filled('service')) {
            $serviceParam = $request->input('service_id') ?? $request->input('service');
            $query->whereHas('teacherServices', function ($q) use ($serviceParam) {
                if (is_numeric($serviceParam)) {
                    $q->where('service_id', $serviceParam);
                } else {
                    $q->whereHas('service', function ($subQ) use ($serviceParam) {
                        $subQ->where('key_name', strtolower($serviceParam));
                    });
                }
            });
        }

        /* Price Filter */
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

        /* Subject / Class / Level Filter */
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

        /* Language Filter */
        if ($request->filled('language_id')) {
            $query->whereHas('teacherLanguages', function ($q) use ($request) {
                $q->where('language_id', $request->language_id);
            });
        }

        /* Rating Filter */
        if ($request->filled('min_rate')) {
            $query->whereHas('reviews', function ($q) use ($request) {
                $q->groupBy('reviewed_id')
                    ->havingRaw('AVG(rating) >= ?', [$request->min_rate]);
            });
        }

        /* Search Filter */
        if ($request->filled('search')) {
            $search = $request->search;
            if (preg_match('/^[A-Za-z]{3}\d+$/', $search)) {
                $query->whereHas('teacherInfo', function ($q) use ($search) {
                    $q->where('code', strtoupper($search));
                });
            } else {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }
        }

        // Favorites check for authenticated student
        $favoritedIds = [];
        $authUser = null;
        if ($token = $request->bearerToken()) {
            $accessToken = PersonalAccessToken::findToken($token);
            if ($accessToken) {
                $authUser = $accessToken->tokenable;
            }
        }
        if ($authUser && $authUser->role_id == 4) {
            $favoritedIds = $authUser
                ->favorites()
                ->where('favoriteable_type', User::class)
                ->pluck('favoriteable_id')
                ->toArray();
        }

        $addHasFavorited = function ($teacherData, $teacherId) use ($favoritedIds) {
            $teacherData['has_favorited'] = in_array($teacherId, $favoritedIds);
            return $teacherData;
        };

        $getAll = $request->boolean('all') || $request->get('all') === '1';

        if ($getAll) {
            $teachers = $query->orderByDesc('id')->get();
            $transformedTeachers = $teachers->map(function ($teacher) use ($addHasFavorited) {
                $data = $this->getFullTeacherData($teacher);
                return $addHasFavorited($data, $teacher->id);
            });

            return [
                'success' => true,
                'status_code' => 200,
                'data' => $transformedTeachers,
                'pagination' => [
                    'total' => count($transformedTeachers),
                    'count' => count($transformedTeachers),
                ],
            ];
        }

        $perPage = $request->get('per_page', 10);
        $teachers = $query->orderByDesc('id')->paginate($perPage);

        $teachers->getCollection()->transform(function ($teacher) use ($addHasFavorited) {
            $data = $this->getFullTeacherData($teacher);
            return $addHasFavorited($data, $teacher->id);
        });

        return [
            'success' => true,
            'status_code' => 200,
            'data' => $teachers->items(),
            'pagination' => [
                'current_page' => $teachers->currentPage(),
                'last_page' => $teachers->lastPage(),
                'per_page' => $teachers->perPage(),
                'total' => $teachers->total(),
            ],
        ];
    }

    /**
     * Get full details for a teacher by ID.
     */
    public function teacherDetails($id): array
    {
        $teacher = User::where('role_id', 3)->find($id);

        if (!$teacher) {
            return [
                'success' => false,
                'status_code' => 404,
                'message' => 'Teacher not found',
            ];
        }

        if (!$teacher->is_active) {
            return [
                'success' => false,
                'status_code' => 403,
                'message' => 'Teacher is inactive',
            ];
        }

        TeacherProfileHelper::checkAndUpdateProfileCompleted($teacher->id);

        return [
            'success' => true,
            'status_code' => 200,
            'data' => $this->getFullTeacherData($teacher),
        ];
    }

    /**
     * Build the complete structured teacher data payload.
     */
    public function getFullTeacherData(User $teacher): array
    {
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
        $introVideoRaw = $teacher->attachments()
            ->where('attached_to_type', 'intro_video')
            ->latest()
            ->value('file_path');
        $coverImageRaw = $teacher->attachments()
            ->where('attached_to_type', 'cover_image')
            ->latest()
            ->value('file_path');

        $main_service_key = null;
        $s = TeacherServices::where('teacher_id', $teacher->id)
            ->with('service')
            ->first();
        if ($s && $s->service) {
            $main_service_key = $s->service->key_name;
        }

        $toPublicUrl = function ($path) {
            if (empty($path)) {
                return null;
            }
            if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
                return $path;
            }
            $clean = ltrim($path, '/');
            if (str_starts_with($clean, 'storage/')) {
                $clean = substr($clean, strlen('storage/'));
            }
            return asset('storage/' . $clean);
        };

        $introVideo = $toPublicUrl($introVideoRaw);
        $coverImage = $toPublicUrl($coverImageRaw);

        $certificateAttachment = $teacher->attachments()
            ->where('attached_to_type', 'certificate')
            ->latest()
            ->first(['id', 'file_name', 'file_path', 'created_at']);

        $rawTS = TeacherServices::where('teacher_id', $teacher->id)
            ->with('service')
            ->get();

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
                'verified' => (bool) optional($teacher->profile)->verified,
            ];
        })->values()->toArray();

        $primaryTS = $uniqueTS->first();
        $primaryServiceId = 0;
        $courses = [];
        $languages = [];

        if ($primaryTS && $primaryTS->service) {
            $svc = $primaryTS->service;
            $primaryServiceId = (int) $svc->id;
        }

        $serviceKeys = $uniqueTS
            ->map(fn($ts) => strtolower((string) optional($ts->service)->key_name))
            ->filter()
            ->values();

        $isPrivateService = $serviceKeys->contains(fn($key) => $key === 'private_lessons' || str_contains($key, 'private'));
        $isCourseService = $serviceKeys->contains(
            fn($key) => $key === 'courses'
            || $key === 'training_courses'
            || str_contains($key, 'course')
            || str_contains($key, 'training')
        );
        $isLanguageService = $serviceKeys->contains(fn($key) => str_contains($key, 'lang') || str_contains($key, 'language'));
        $isAbilityService = $serviceKeys->contains(fn($key) => str_contains($key, 'abilit'));

        if ($primaryTS && $primaryTS->service && !empty($primaryTS->service->key_name)) {
            $main_service_key = $primaryTS->service->key_name;
        } elseif (!empty($teacherServices)) {
            $main_service_key = $teacherServices[0]['key_name'] ?? $main_service_key;
        }

        $courseServiceIds = $uniqueTS
            ->filter(function ($ts) {
                $key = strtolower((string) optional($ts->service)->key_name);
                return $key === 'private_lessons'
                    || str_contains($key, 'private')
                    || str_contains($key, 'course')
                    || str_contains($key, 'training');
            })
            ->pluck('service_id')
            ->filter()
            ->values()
            ->all();

        if ($isPrivateService || $isCourseService) {
            $query = Course::where('teacher_id', $teacher->id)
                ->with(['coverImage']);

            if (!empty($courseServiceIds)) {
                $query->whereIn('service_id', $courseServiceIds);
            }

            $courses = $query->get()->map(function ($c) {
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

        if ($isLanguageService) {
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

        $abilities = [];
        if ($isAbilityService) {
            $abilities = $teacher->teacherAbilities()->with('ability')->get()
                ->map(function ($ta) {
                    return [
                        'id' => $ta->id,
                        'ability_id' => $ta->ability_id,
                        'name_en' => optional($ta->ability)->name_en ?? null,
                        'name_ar' => optional($ta->ability)->name_ar ?? null,
                    ];
                })->values()->toArray();
        }

        $earnings = DB::table('wallets')
            ->where('user_id', $teacher->id)
            ->select(
                DB::raw('balance as total_earnings'),
            )
            ->first();

        $platformPercentage = PlatformPercentage::getActive();
        $percentageValue = $platformPercentage ? ($platformPercentage->value / 100) : 0;
        $authenticatedUser = request()->user();
        $isOwnTeacherProfile = $authenticatedUser
            && (int) $authenticatedUser->id === (int) $teacher->id
            && (int) $authenticatedUser->role_id === 3;
        $priceMultiplier = $isOwnTeacherProfile ? 1 : (1 + $percentageValue);

        $currentLessons = DB::table('bookings')
            ->where('teacher_id', $teacher->id)
            ->where('status', 'active')
            ->count();

        $totalBookings = DB::table('bookings')
            ->where('teacher_id', $teacher->id)
            ->count();

        $reviewsData = Review::where('reviewed_id', $teacher->id)
            ->with('reviewer:id,first_name,last_name')
            ->latest()
            ->get();
        $rating = round($reviewsData->avg('rating') ?? 0, 1);
        $reviews = $reviewsData->map(function ($r) {
            $reviewer = $r->reviewer;
            $name = $reviewer
                ? trim(($reviewer->first_name ?? '') . ' ' . ($reviewer->last_name ?? ''))
                : '';
            if ($name === '') {
                $name = 'طالب';
            }
            $arr = $r->toArray();
            $arr['student_name'] = $name;
            $arr['date'] = $r->created_at ? $r->created_at->toDateString() : ($arr['created_at'] ?? null);
            $arr['reviewer'] = $reviewer ? [
                'id' => $reviewer->id,
                'first_name' => $reviewer->first_name,
                'last_name' => $reviewer->last_name,
                'name' => $name,
            ] : null;
            return $arr;
        })->values()->toArray();

        if ($isPrivateService) {
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
                        'name_en' => $teacherSubject->subject->name_en ?? null,
                        'name_ar' => $teacherSubject->subject->name_ar ?? null,
                        'title' => $teacherSubject->subject->name_ar ?? $teacherSubject->subject->name_en,
                        'title_ar' => $teacherSubject->subject->name_ar ?? null,
                        'title_en' => $teacherSubject->subject->name_en ?? null,
                        'class_id' => $teacherSubject->subject->class_id,
                        'class_level_id' => $teacherSubject->subject->education_level_id,
                        'class_level_title' => optional($teacherSubject->subject->educationLevel)->name_ar,
                        'class_level_title_ar' => optional($teacherSubject->subject->educationLevel)->name_ar,
                        'class_level_title_en' => optional($teacherSubject->subject->educationLevel)->name_en,
                        'class_title' => optional($teacherSubject->subject->class)->name_ar,
                        'class_title_ar' => optional($teacherSubject->subject->class)->name_ar,
                        'class_title_en' => optional($teacherSubject->subject->class)->name_en,
                    ];
                })
                ->values()
                ->toArray();
        } else {
            $teacherSubjects = [];
        }

        $availabilitySlots = AvailabilitySlot::where('teacher_id', $teacher->id)
            ->get()
            ->groupBy('day_number');

        $dayNamesAr = [
            1 => 'السبت',
            2 => 'الأحد',
            3 => 'الإثنين',
            4 => 'الثلاثاء',
            5 => 'الأربعاء',
            6 => 'الخميس',
            7 => 'الجمعة',
        ];

        $dayNamesEn = [
            1 => 'Saturday',
            2 => 'Sunday',
            3 => 'Monday',
            4 => 'Tuesday',
            5 => 'Wednesday',
            6 => 'Thursday',
            7 => 'Friday',
        ];

        $availableTimes = [];
        foreach ($availabilitySlots as $dayNumber => $slots) {
            $dayNameAr = $dayNamesAr[$dayNumber] ?? 'unknown';
            $dayNameEn = $dayNamesEn[$dayNumber] ?? 'unknown';

            $times = $slots->map(function ($slot) {
                $recurringSlot = PackageBookingHelper::isRecurringSlot($slot);
                return [
                    'id' => $slot->id,
                    'is_booked' => $recurringSlot ? false : $slot->is_booked,
                    'is_available' => $recurringSlot ? true : $slot->is_available,
                    'time' => $slot->start_time instanceof \Carbon\Carbon ? $slot->start_time->format('h:i A') : $slot->start_time,
                    'start_time' => $slot->start_time instanceof \Carbon\Carbon ? $slot->start_time->format('H:i:s') : $slot->start_time,
                    'end_time' => $slot->end_time instanceof \Carbon\Carbon ? $slot->end_time->format('H:i:s') : $slot->end_time,
                    'duration' => $slot->duration ?? 60,
                ];
            })->values()->toArray();

            $availableTimes[] = [
                'id' => $dayNumber,
                'day' => $dayNameAr,
                'day_ar' => $dayNameAr,
                'day_en' => $dayNameEn,
                'day_name' => $dayNameAr,
                'day_name_ar' => $dayNameAr,
                'day_name_en' => $dayNameEn,
                'times' => $times
            ];
        }

        $bookingStudentIds = DB::table('bookings')
            ->where('teacher_id', $teacher->id)
            ->where('status', '!=', 'cancelled')
            ->pluck('student_id');

        $sessionStudentIds = DB::table('sessions')
            ->where('teacher_id', $teacher->id)
            ->where('status', '!=', 'cancelled')
            ->pluck('student_id');

        $courseStudentIds = DB::table('enrollments')
            ->join('courses', 'enrollments.course_id', '=', 'courses.id')
            ->where('courses.teacher_id', $teacher->id)
            ->where('enrollments.status', '!=', 'cancelled')
            ->pluck('enrollments.student_id');

        $totalStudents = $bookingStudentIds
            ->concat($sessionStudentIds)
            ->concat($courseStudentIds)
            ->unique()
            ->filter()
            ->count();

        $completedLessons = DB::table('sessions')
            ->where('teacher_id', $teacher->id)
            ->where('status', 'completed')
            ->count();

        $totalLessons = DB::table('sessions')
            ->where('teacher_id', $teacher->id)
            ->where('status', '!=', 'cancelled')
            ->count();

        if ($totalLessons === 0) {
            $totalLessons = (int) $totalBookings;
        }

        $d = [
            'id' => $teacher->id,
            'main_service_key' => $main_service_key,
            'first_name' => $teacher->first_name,
            'last_name' => $teacher->last_name,
            'email' => $teacher->email,
            'phone_number' => $teacher->phone_number,
            'email_verified_at' => $teacher->email_verified_at,
            'role_id' => $teacher->role_id,
            'gender' => $teacher->gender,
            'nationality' => $teacher->nationality,
            'teacher_type' => $teacher->teacher_type,
            'verified' => (bool) optional($teacher->profile)->verified,
            'verification_code' => (string) $teacher->verification_code,
            'social_provider' => $teacher->social_provider,
            'social_provider_id' => (string) ($teacher->social_provider_id ?? ''),
            'phone_number' => (string) $teacher->phone_number,
            'total_students' => (int) $totalStudents,
            'students_count' => (int) $totalStudents,
            'total_lessons' => (int) $totalLessons,
            'completed_lessons' => (int) $completedLessons,
            'lessons_count' => (int) $totalLessons,
            'profile' => [
                'main_service_key' => $main_service_key,
                'is_active' => (int) $teacher->is_active,
                'profile_photo' => $profilePhoto,
                'resume' => $resume,
                'certificate' => $certificate,
                'reviews' => $reviews,
                'rating' => $rating,
                'bio' => optional($teacher->profile)->bio,
                'founder' => $teacher->teacherInfo ? (bool) $teacher->teacherInfo->founder : false,
                'offer_packages' => $teacher->teacherInfo ? (bool) $teacher->teacherInfo->offer_packages : false,
                'package_on_off' => $teacher->teacherInfo ? (bool) $teacher->teacherInfo->package_on_off : false,
                'packages_approved' => $teacher->teacherInfo ? (bool) $teacher->teacherInfo->packages_approved : false,
                'total_students' => (int) $totalStudents,
                'students_count' => (int) $totalStudents,
                'total_lessons' => (int) $totalLessons,
                'completed_lessons' => (int) $completedLessons,
                'lessons_count' => (int) $totalLessons,
                'verified' => (bool) optional($teacher->profile)->verified,
                'service' => $primaryServiceId,
                'services' => $teacherServices,
                'courses' => $courses,
                'languages' => $languages,
                'abilities' => $abilities,
                'available_times' => $availableTimes,
                'certificate_attachment' => $certificateAttachment,
                'earnings' => $earnings,
                'currentLessons' => $currentLessons,
                'bookings_count' => (int) $totalBookings,
                'subjects_count' => (int) count($teacherSubjects),
                'languages_count' => (int) count($languages),
                'abilities_count' => (int) count($abilities),
                'courses_count' => (int) count($courses),
                'teach_individual' => (bool) optional($teacher->teacherInfo)->teach_individual,
                'package_on_off' => (bool) optional($teacher->teacherInfo)->package_on_off,
                'individual_hour_price' => (float) ((optional($teacher->teacherInfo)->individual_hour_price ?? 0) * $priceMultiplier),
                'teach_group' => (bool) optional($teacher->teacherInfo)->teach_group,
                'group_hour_price' => (float) ((optional($teacher->teacherInfo)->group_hour_price ?? 0) * $priceMultiplier),
                'max_group_size' => (int) (optional($teacher->teacherInfo)->max_group_size ?? 0),
                'min_group_size' => (int) (optional($teacher->teacherInfo)->min_group_size ?? 0),
                'code' => optional($teacher->teacherInfo)->code,
                'teacher_subjects' => $teacherSubjects,
                'intro_video' => $introVideo,
                'cover_image' => $coverImage,
            ],
            'intro_video' => $introVideo,
            'cover_image' => $coverImage,
        ];

        return $d;
    }
}
