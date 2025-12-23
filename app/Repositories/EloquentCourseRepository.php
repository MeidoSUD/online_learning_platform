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
