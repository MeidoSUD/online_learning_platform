<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemLog;
use Illuminate\Http\Request;

class SystemLogController extends Controller
{
    public function index(Request $request)
    {
        $query = SystemLog::query();

        if ($request->filled('level')) {
            $query->where('level', $request->level);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        $sortField = $request->get('sort', 'last_occurred_at');
        $sortDir = $request->get('direction', 'desc');
        $query->orderBy($sortField, $sortDir);

        $logs = $query->paginate($request->get('per_page', 25));

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    public function show($id)
    {
        $log = SystemLog::findOrFail($id);
        return response()->json(['success' => true, 'data' => $log]);
    }

    public function destroy($id)
    {
        SystemLog::findOrFail($id)->delete();
        return response()->json(['success' => true, 'message' => 'Log deleted']);
    }

    public function clear()
    {
        SystemLog::truncate();
        return response()->json(['success' => true, 'message' => 'All logs cleared']);
    }
}
