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

    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $perPage = $request->get('per_page', 10);
        $teachers = $user->getFavoriteItems(User::class)
            ->where('role_id', 3)
            ->paginate($perPage);

        $userController = new UserController();

        $transformed = $teachers->getCollection()->map(function ($teacher) use ($userController) {
            $teacherData = $userController->getFullTeacherData($teacher);
            $teacherData['has_favorited'] = true;
            return $teacherData;
        });

        return response()->json([
            'success' => true,
            'data' => $transformed->values(),
            'pagination' => [
                'current_page' => $teachers->currentPage(),
                'last_page' => $teachers->lastPage(),
                'per_page' => $teachers->perPage(),
                'total' => $teachers->total(),
            ],
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
