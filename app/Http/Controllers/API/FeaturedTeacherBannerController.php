<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TeacherMarketingSubscription;
use App\Models\User;
use Illuminate\Http\Request;

class FeaturedTeacherBannerController extends Controller
{
    /**
     * Get active featured teacher banners for student/guest homepage.
     * 
     * Public endpoint - no authentication required.
     */
    public function getBanners(Request $request)
    {
        $limit = $request->get('limit', 10);

        // Fetch active marketing subscriptions whose teachers are active
        $subscriptions = TeacherMarketingSubscription::with([
            'teacher.profile',
            'teacher.teacherInfo',
            'teacher.subjects',
            'teacher.teacherLanguages.language',
            'plan',
        ])
        ->whereHas('teacher', function ($q) {
            $q->where('is_active', 1)
              ->where('role_id', 3);
        })
        ->active()
        ->inRandomOrder() // randomize so all featured teachers get fair exposure
        ->take($limit)
        ->get();

        // Increment views count in background/bulk
        if ($subscriptions->isNotEmpty()) {
            TeacherMarketingSubscription::whereIn('id', $subscriptions->pluck('id'))
                ->increment('views_count');
        }

        $banners = $subscriptions->map(function ($sub) {
            $teacher = $sub->teacher;
            $info = $teacher->teacherInfo;

            // Profile photo
            $profilePhoto = null;
            $photoPath = $teacher->attachments()
                ->where('attached_to_type', 'profile_picture')
                ->latest()
                ->value('file_path');
            if ($photoPath) {
                if (str_starts_with($photoPath, 'http://') || str_starts_with($photoPath, 'https://')) {
                    $profilePhoto = $photoPath;
                } else {
                    $clean = ltrim($photoPath, '/');
                    if (str_starts_with($clean, 'storage/')) {
                        $clean = substr($clean, strlen('storage/'));
                    }
                    $profilePhoto = asset('storage/' . $clean);
                }
            }

            // Cover or Custom Banner
            $bannerUrl = $sub->banner_url;

            // Subjects list
            $subjects = $teacher->subjects->map(function ($s) {
                return [
                    'id' => $s->id,
                    'name_en' => $s->name_en,
                    'name_ar' => $s->name_ar,
                ];
            })->values();

            // Rating
            $reviewsAvg = $teacher->reviews()->avg('rating') ?? 5.0;
            $reviewsCount = $teacher->reviews()->count();

            // Bio fallback
            $bio = $sub->marketing_bio ?: ($info->bio ?? $teacher->profile?->bio ?? '');

            // Title fallback
            $title = $sub->marketing_title;
            if (empty($title)) {
                $firstSubject = $teacher->subjects->first();
                $title = $firstSubject
                    ? (app()->getLocale() == 'ar' ? 'معلم متميز في ' . $firstSubject->name_ar : 'Featured ' . $firstSubject->name_en . ' Teacher')
                    : (app()->getLocale() == 'ar' ? 'معلم متميز وموصى به' : 'Featured & Recommended Teacher');
            }

            return [
                'subscription_id' => $sub->id,
                'teacher_id' => $teacher->id,
                'name' => $teacher->name,
                'email' => $teacher->email,
                'avatar' => $profilePhoto,
                'banner_image_url' => $bannerUrl,
                'marketing_title' => $title,
                'marketing_bio' => $bio,
                'badge_text_ar' => $sub->plan->badge_text_ar ?? 'معلم مميز',
                'badge_text_en' => $sub->plan->badge_text_en ?? 'Featured Teacher',
                'rating' => round((float) $reviewsAvg, 1),
                'reviews_count' => (int) $reviewsCount,
                'individual_hour_price' => $info ? (float) $info->individual_hour_price : 0,
                'group_hour_price' => $info ? (float) $info->group_hour_price : 0,
                'subjects' => $subjects,
                'action' => [
                    'type' => 'open_teacher_profile',
                    'teacher_id' => $teacher->id,
                    'profile_endpoint' => '/api/teachers/' . $teacher->id,
                    'web_url' => url('/teachers/' . $teacher->id),
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'status' => 'success',
            'code' => 'FEATURED_TEACHERS_RETRIEVED',
            'message_en' => 'Featured teacher banners retrieved successfully',
            'message_ar' => 'تم استرجاع بنرات المعلمين المميزين بنجاح',
            'data' => [
                'count' => $banners->count(),
                'banners' => $banners,
            ],
        ], 200);
    }

    /**
     * Record a click on a featured teacher banner.
     */
    public function recordClick($subscriptionId)
    {
        $subscription = TeacherMarketingSubscription::find($subscriptionId);

        if ($subscription) {
            $subscription->recordClick();
        }

        return response()->json([
            'success' => true,
            'message' => 'Click recorded',
        ]);
    }
}
