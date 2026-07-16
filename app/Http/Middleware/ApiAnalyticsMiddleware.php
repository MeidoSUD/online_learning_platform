<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\ApiAnalyticsService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApiAnalyticsMiddleware
{
    private ApiAnalyticsService $analyticsService;

    public function __construct(ApiAnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    public function handle(Request $request, Closure $next): mixed
    {
        $startTime = microtime(true);

        $response = $next($request);

        if ($response instanceof JsonResponse) {
            $this->analyticsService->record($request, $response, $startTime);
        }

        return $response;
    }
}
