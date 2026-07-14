<?php

namespace App\Traits;

use App\Models\ActivityRecord;
use Illuminate\Database\Eloquent\Model;

trait ActivityRecorder
{
    protected array $activityDedicatedColumns = [
        'booking_id',
        'service_id',
        'subject_id',
        'teacher_id',
        'user_id',
        'language_id',
        'course_id',
        'session_type',
        'sessions_count',
    ];

    public function recordActivity(string $title, array $data = []): ActivityRecord
    {
        $record = [
            'title' => $title,
            'data' => $data,
        ];

        foreach ($this->activityDedicatedColumns as $column) {
            if (array_key_exists($column, $data)) {
                $record[$column] = $data[$column];
            }
        }

        if (method_exists($this, 'getActivityUserId')) {
            $record['user_id'] = $this->getActivityUserId();
        }

        if (method_exists($this, 'getActivityCategory')) {
            $record['category'] = $this->getActivityCategory();
        }

        return ActivityRecord::create($record);
    }
}
