<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ProfileComplete;
use App\Models\User;
use App\Models\TeacherInfo;
use Illuminate\Http\JsonResponse;

class ProfileCompleteController extends Controller
{
    /**
     * Return the authenticated user's profile complete record and ensure it's synced.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        // Sync profile complete values
        \App\Helpers\ProfileCompleteHelper::sync((int) $user->id);

        $record = ProfileComplete::where('user_id', $user->id)->first();

        return response()->json(['success' => true, 'data' => $record]);
    }
}

