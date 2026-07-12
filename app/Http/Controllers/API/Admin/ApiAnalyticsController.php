<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApiStatistic;
use App\Services\ApiAnalyticsService;
use Illuminate\Http\Request;

class ApiAnalyticsController extends Controller
{
    public function __construct(
        private readonly ApiAnalyticsService $analyticsService,
    ) {
    }

    public function index()
    {
        return response()->json([
            'data' => $this->analyticsService->getDashboardStats(),
        ]);
    }

    public function records(Request $request)
    {
        $perPage = (int) $request->input('per_page', 25);
        $search = $request->input('search');

        $query = ApiStatistic::orderByDesc('date')->orderByDesc('hits');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('endpoint', 'like', "%{$search}%")
                  ->orWhere('uri', 'like', "%{$search}%")
                  ->orWhere('module', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage);
    }
}
