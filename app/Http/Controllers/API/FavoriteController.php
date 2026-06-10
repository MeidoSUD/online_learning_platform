<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FavoriteController extends Controller
{
    public function toggle(User $teacher): JsonResponse
    {
        $user = Auth::user();
        $isFavorited = $user->hasFavorited($teacher);

        if ($isFavorited) {
            $user->unfavorite($teacher);
            $message = 'Teacher removed from favorites';
            $favorited = false;
        } else {
            $user->favorite($teacher);
            $message = 'Teacher added to favorites';
            $favorited = true;
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => ['favorited' => $favorited],
        ]);
    }

    public function index(): JsonResponse
    {
        $user = Auth::user();
        $favoriteTeachers = $user->getFavoriteItems(User::class)
            ->where('role_id', 3)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $favoriteTeachers,
        ]);
    }

    public function status(User $teacher): JsonResponse
    {
        $user = Auth::user();
        $favorited = $user->hasFavorited($teacher);

        return response()->json([
            'success' => true,
            'data' => ['favorited' => $favorited],
        ]);
    }
}
