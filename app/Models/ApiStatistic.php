<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApiStatistic extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'last_hit_at' => 'datetime',
        'hits' => 'integer',
        'authenticated_hits' => 'integer',
        'guest_hits' => 'integer',
        'success_hits' => 'integer',
        'client_error_hits' => 'integer',
        'server_error_hits' => 'integer',
        'total_response_time' => 'float',
        'min_response_time' => 'float',
        'max_response_time' => 'float',
        'total_memory_usage' => 'float',
        'max_memory_usage' => 'float',
        'web_hits' => 'integer',
        'android_hits' => 'integer',
        'ios_hits' => 'integer',
        'other_hits' => 'integer',
        'last_status_code' => 'integer',
    ];

    public function getAverageResponseTimeAttribute(): ?float
    {
        return $this->hits > 0
            ? round($this->total_response_time / $this->hits, 4)
            : null;
    }

    public function getSuccessRateAttribute(): ?float
    {
        if ($this->hits === 0) {
            return null;
        }

        return round(($this->success_hits / $this->hits) * 100, 2);
    }

    public function getFailureRateAttribute(): ?float
    {
        if ($this->hits === 0) {
            return null;
        }

        $failures = $this->client_error_hits + $this->server_error_hits;

        return round(($failures / $this->hits) * 100, 2);
    }

    public function getErrorRateAttribute(): ?float
    {
        return $this->failure_rate;
    }

    public function getAverageMemoryUsageAttribute(): ?float
    {
        return $this->hits > 0
            ? round($this->total_memory_usage / $this->hits, 4)
            : null;
    }
}
