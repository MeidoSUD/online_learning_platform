<?php

namespace App\Repositories;

use App\Models\Course;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EloquentCourseRepository implements CourseRepository
{
    public function paginate(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = Course::with(['teacher', 'category', 'coverImage'])
            ->where('courses.status', 'published');

        if (!empty($filters['service_id'])) {
            $query->where('courses.service_id', $filters['service_id']);
        }

        // Price range
        if (isset($filters['min_price'])) {
            $query->where('courses.price', '>=', $filters['min_price']);
        }
        if (isset($filters['max_price'])) {
            $query->where('courses.price', '<=', $filters['max_price']);
        }

        // Category filter
        if (!empty($filters['category_id'])) {
            $query->where('courses.category_id', $filters['category_id']);
        }

        // Education Level filter
        if (!empty($filters['level'])) {
            $query->whereHas('teacher', function($q) use ($filters) {
                // if we don't have direct level on course, we check subjects related to the course
            });
            
            // Correction: Join with subjects to get the level
            $query->join('subjects', 'courses.subject_id', '=', 'subjects.id')
                  ->where('subjects.education_level_id', $filters['level'])
                  ->select('courses.*');
        }

        // Rating filter (teacher average rating)
        if (!empty($filters['min_rate'])) {
            // get teacher ids that meet rating threshold
            $minRate = (float) $filters['min_rate'];
            $teacherIds = \App\Models\Review::select('reviewed_id', DB::raw('avg(rating) as avg_rating'))
                ->groupBy('reviewed_id')
                ->havingRaw('avg(rating) >= ?', [$minRate])
                ->pluck('reviewed_id')
                ->toArray();

            if (!empty($teacherIds)) {
                $query->whereIn('courses.teacher_id', $teacherIds);
            } else {
                // no teacher meets rating -> return empty paginator
                return $query->whereRaw('0 = 1')->paginate($perPage);
            }
        }

        return $query->orderByDesc('courses.created_at')->paginate($perPage);
    }

    public function find(int $id)
    {
        return Course::with(['teacher', 'category', 'availabilitySlots', 'coverImage', 'courselessons'])
            ->where('status', 'published')
            ->findOrFail($id);
    }

    public function create(array $data)
    {
        return Course::create($data);
    }

    public function enroll(int $courseId, int $userId, array $meta = []): bool
    {
        $exists = DB::table('course_student')
            ->where('course_id', $courseId)
            ->where('user_id', $userId)
            ->exists();

        if ($exists) return false;

        $insert = array_merge([
            'course_id' => $courseId,
            'user_id' => $userId,
            'created_at' => now(),
            'updated_at' => now(),
        ], $meta);

        DB::table('course_student')->insert($insert);
        return true;
    }
}
