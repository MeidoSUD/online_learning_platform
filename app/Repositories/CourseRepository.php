<?php

namespace App\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CourseRepository
{
    /**
     * Paginate published courses with optional filters
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function paginate(array $filters = [], int $perPage = 10): LengthAwarePaginator;

    public function find(int $id);

    public function create(array $data);

    public function enroll(int $courseId, int $userId, array $meta = []): bool;
}
