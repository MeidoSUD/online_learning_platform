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
            ->where('status', 'published');

        if (!empty($filters['service_id'])) {
            $query->where('service_id', $filters['service_id']);
        }

        // Price range
        if (isset($filters['min_price'])) {
            $query->where('price', '>=', $filters['min_price']);
        }
        if (isset($filters['max_price'])) {
            $query->where('price', '<=', $filters['max_price']);
        }

        // Category filter
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
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
                $query->whereIn('teacher_id', $teacherIds);
            } else {
                // no teacher meets rating -> return empty paginator
                return $query->whereRaw('0 = 1')->paginate($perPage);
            }
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
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
