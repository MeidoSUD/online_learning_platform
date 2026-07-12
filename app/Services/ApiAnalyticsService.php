<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\Platform;
use App\Models\ApiStatistic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ApiAnalyticsService
{
    public static array $excludedPrefixes = [
        'api/admin',
    ];

    public function record(Request $request, Response $response, float $startTime): void
    {
        $uri = $this->resolveUri($request);

        if ($this->shouldExclude($uri)) {
            return;
        }

        $endpoint = $this->resolveEndpoint($request);
        $method = $request->method();
        $module = $this->resolveModule($uri);
        $date = now()->toDateString();
        $statusCode = $response->getStatusCode();
        $responseTime = $this->getResponseTime($startTime);
        $memoryUsage = $this->getMemoryUsage();
        $platform = $this->detectPlatform($request);
        $isAuthenticated = $request->user() !== null;
        $timestamp = now();

        $record = ApiStatistic::where('endpoint', $endpoint)
            ->where('method', $method)
            ->where('date', $date)
            ->first();

        if ($record) {
            $this->updateExistingRecord($record, $uri, $statusCode, $responseTime, $memoryUsage, $platform, $isAuthenticated, $timestamp);
        } else {
            $this->createNewRecord($endpoint, $uri, $method, $module, $date, $statusCode, $responseTime, $memoryUsage, $platform, $isAuthenticated, $timestamp);
        }
    }

    private function updateExistingRecord(
        ApiStatistic $record,
        string $uri,
        int $statusCode,
        float $responseTime,
        float $memoryUsage,
        Platform $platform,
        bool $isAuthenticated,
        \Illuminate\Support\Carbon $timestamp,
    ): void {
        $updates = [
            'uri' => $uri,
            'hits' => DB::raw('hits + 1'),
            'total_response_time' => DB::raw("total_response_time + {$responseTime}"),
            'total_memory_usage' => DB::raw("total_memory_usage + {$memoryUsage}"),
            'max_response_time' => DB::raw("GREATEST(max_response_time, {$responseTime})"),
            'max_memory_usage' => DB::raw("GREATEST(max_memory_usage, {$memoryUsage})"),
            'last_status_code' => $statusCode,
            'last_hit_at' => $timestamp,
        ];

        if ($responseTime < $record->min_response_time) {
            $updates['min_response_time'] = $responseTime;
        }

        if ($isAuthenticated) {
            $updates['authenticated_hits'] = DB::raw('authenticated_hits + 1');
        } else {
            $updates['guest_hits'] = DB::raw('guest_hits + 1');
        }

        if ($statusCode >= 200 && $statusCode < 300) {
            $updates['success_hits'] = DB::raw('success_hits + 1');
        } elseif ($statusCode >= 400 && $statusCode < 500) {
            $updates['client_error_hits'] = DB::raw('client_error_hits + 1');
        } elseif ($statusCode >= 500) {
            $updates['server_error_hits'] = DB::raw('server_error_hits + 1');
        }

        $platformField = match ($platform) {
            Platform::Android => 'android_hits',
            Platform::IOS => 'ios_hits',
            Platform::Web => 'web_hits',
            default => 'other_hits',
        };
        $updates[$platformField] = DB::raw("{$platformField} + 1");

        ApiStatistic::where('id', $record->id)->update($updates);
    }

    private function createNewRecord(
        string $endpoint,
        string $uri,
        string $method,
        ?string $module,
        string $date,
        int $statusCode,
        float $responseTime,
        float $memoryUsage,
        Platform $platform,
        bool $isAuthenticated,
        \Illuminate\Support\Carbon $timestamp,
    ): void {
        $data = [
            'endpoint' => $endpoint,
            'uri' => $uri,
            'method' => $method,
            'module' => $module,
            'date' => $date,
            'hits' => 1,
            'authenticated_hits' => $isAuthenticated ? 1 : 0,
            'guest_hits' => $isAuthenticated ? 0 : 1,
            'success_hits' => 0,
            'client_error_hits' => 0,
            'server_error_hits' => 0,
            'total_response_time' => $responseTime,
            'min_response_time' => $responseTime,
            'max_response_time' => $responseTime,
            'total_memory_usage' => $memoryUsage,
            'max_memory_usage' => $memoryUsage,
            'web_hits' => 0,
            'android_hits' => 0,
            'ios_hits' => 0,
            'other_hits' => 0,
            'last_status_code' => $statusCode,
            'last_hit_at' => $timestamp,
        ];

        if ($statusCode >= 200 && $statusCode < 300) {
            $data['success_hits'] = 1;
        } elseif ($statusCode >= 400 && $statusCode < 500) {
            $data['client_error_hits'] = 1;
        } elseif ($statusCode >= 500) {
            $data['server_error_hits'] = 1;
        }

        $data[match ($platform) {
            Platform::Android => 'android_hits',
            Platform::IOS => 'ios_hits',
            Platform::Web => 'web_hits',
            default => 'other_hits',
        }] = 1;

        ApiStatistic::create($data);
    }

    public function resolveEndpoint(Request $request): string
    {
        $route = $request->route();

        if ($route) {
            $name = $route->getName();

            if ($name) {
                return $name;
            }

            $uri = $route->uri();

            if ($uri) {
                return $uri;
            }
        }

        return $request->path();
    }

    public function resolveUri(Request $request): string
    {
        $route = $request->route();

        if ($route) {
            $uri = $route->uri();

            if ($uri) {
                return $uri;
            }
        }

        return $request->path();
    }

    public function resolveModule(string $uri): ?string
    {
        $segments = explode('/', $uri);

        if (isset($segments[0]) && $segments[0] === 'api') {
            return $segments[1] ?? null;
        }

        return $segments[0] ?? null;
    }

    public function detectPlatform(Request $request): Platform
    {
        $userAgent = $request->userAgent();

        if ($userAgent === null || $userAgent === '') {
            return Platform::Other;
        }

        $userAgent = strtolower($userAgent);

        if (str_contains($userAgent, 'android')) {
            return Platform::Android;
        }

        if (str_contains($userAgent, 'ios') || str_contains($userAgent, 'ipad') || str_contains($userAgent, 'iphone')) {
            return Platform::IOS;
        }

        return Platform::Web;
    }

    public function shouldExclude(string $uri): bool
    {
        foreach (static::$excludedPrefixes as $prefix) {
            if (str_starts_with($uri, $prefix)) {
                return true;
            }
        }

        return false;
    }

    private function getResponseTime(float $startTime): float
    {
        return (microtime(true) - $startTime) * 1000;
    }

    private function getMemoryUsage(): float
    {
        return memory_get_peak_usage(true) / 1024;
    }

    public function getTotalRequests(): int
    {
        return (int) ApiStatistic::sum('hits');
    }

    public function getTodayRequests(): int
    {
        return (int) ApiStatistic::whereDate('date', today())->sum('hits');
    }

    public function getThisWeekRequests(): int
    {
        return (int) ApiStatistic::whereBetween('date', [now()->startOfWeek(), now()->endOfWeek()])->sum('hits');
    }

    public function getThisMonthRequests(): int
    {
        return (int) ApiStatistic::whereYear('date', now()->year)
            ->whereMonth('date', now()->month)
            ->sum('hits');
    }

    public function getMostPopularEndpoint(): ?ApiStatistic
    {
        return ApiStatistic::orderByDesc('hits')->first();
    }

    public function getLeastPopularEndpoint(): ?ApiStatistic
    {
        return ApiStatistic::where('hits', '>', 0)->orderBy('hits')->first();
    }

    public function getSuccessfulRequests(): int
    {
        return (int) ApiStatistic::sum('success_hits');
    }

    public function getFailedRequests(): int
    {
        return $this->getClientErrors() + $this->getServerErrors();
    }

    public function getClientErrors(): int
    {
        return (int) ApiStatistic::sum('client_error_hits');
    }

    public function getServerErrors(): int
    {
        return (int) ApiStatistic::sum('server_error_hits');
    }

    public function getAverageResponseTime(): ?float
    {
        $totalHits = ApiStatistic::sum('hits');

        if ($totalHits === 0) {
            return null;
        }

        $totalTime = ApiStatistic::sum('total_response_time');

        return round($totalTime / $totalHits, 2);
    }

    public function getFastestEndpoint(): ?ApiStatistic
    {
        return ApiStatistic::where('hits', '>', 0)
            ->orderBy('min_response_time')
            ->first();
    }

    public function getSlowestEndpoint(): ?ApiStatistic
    {
        return ApiStatistic::where('hits', '>', 0)
            ->orderByDesc('max_response_time')
            ->first();
    }

    public function getHighestMemoryUsage(): ?ApiStatistic
    {
        return ApiStatistic::orderByDesc('max_memory_usage')->first();
    }

    public function getPlatformUsage(string $platform): int
    {
        $field = match ($platform) {
            'android' => 'android_hits',
            'ios' => 'ios_hits',
            'web' => 'web_hits',
            default => 'other_hits',
        };

        return (int) ApiStatistic::sum($field);
    }

    public function getAuthenticatedCount(): int
    {
        return (int) ApiStatistic::sum('authenticated_hits');
    }

    public function getGuestCount(): int
    {
        return (int) ApiStatistic::sum('guest_hits');
    }

    public function getDashboardStats(): array
    {
        return [
            'total_requests' => $this->getTotalRequests(),
            'today_requests' => $this->getTodayRequests(),
            'this_week_requests' => $this->getThisWeekRequests(),
            'this_month_requests' => $this->getThisMonthRequests(),
            'most_popular_endpoint' => $this->getMostPopularEndpoint(),
            'least_popular_endpoint' => $this->getLeastPopularEndpoint(),
            'successful_requests' => $this->getSuccessfulRequests(),
            'failed_requests' => $this->getFailedRequests(),
            'client_errors' => $this->getClientErrors(),
            'server_errors' => $this->getServerErrors(),
            'average_response_time_ms' => $this->getAverageResponseTime(),
            'fastest_endpoint' => $this->getFastestEndpoint(),
            'slowest_endpoint' => $this->getSlowestEndpoint(),
            'highest_memory_usage_kb' => $this->getHighestMemoryUsage(),
            'android_usage' => $this->getPlatformUsage('android'),
            'ios_usage' => $this->getPlatformUsage('ios'),
            'web_usage' => $this->getPlatformUsage('web'),
            'other_platform_usage' => $this->getPlatformUsage('other'),
            'authenticated_count' => $this->getAuthenticatedCount(),
            'guest_count' => $this->getGuestCount(),
        ];
    }
}
