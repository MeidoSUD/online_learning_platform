<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\TeacherAbility;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TeacherAbilityController extends Controller
{
    public function index($teacherId): JsonResponse
    {
        $abilities = TeacherAbility::where('teacher_id', $teacherId)
            ->with('ability')
            ->get()
            ->pluck('ability')
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Teacher abilities retrieved successfully',
            'data' => [
                'teacher_id' => (int) $teacherId,
                'abilities' => $abilities,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        return $this->sync($request);
    }

    public function update(Request $request): JsonResponse
    {
        return $this->sync($request);
    }

    private function sync(Request $request): JsonResponse
    {
        $user = auth()->user();

        if (!$user || $user->role_id != 3) {
            return response()->json([
                'success' => false,
                'message' => 'Only teachers can manage abilities',
            ], 403);
        }

        $data = $request->validate([
            'ability_ids' => 'required|array|min:1',
            'ability_ids.*' => 'required|integer|distinct|exists:abilities,id',
        ]);

        DB::transaction(function () use ($user, $data) {
            TeacherAbility::where('teacher_id', $user->id)->delete();

            foreach ($data['ability_ids'] as $abilityId) {
                TeacherAbility::create([
                    'teacher_id' => $user->id,
                    'ability_id' => $abilityId,
                ]);
            }
        });

        return $this->teacherAbilitiesResponse($user->id);
    }

    public function destroy($abilityId): JsonResponse
    {
        $user = auth()->user();

        if (!$user || $user->role_id != 3) {
            return response()->json([
                'success' => false,
                'message' => 'Only teachers can manage abilities',
            ], 403);
        }

        $deleted = TeacherAbility::where('teacher_id', $user->id)
            ->where('ability_id', $abilityId)
            ->delete();

        if (!$deleted) {
            return response()->json([
                'success' => false,
                'message' => 'Ability not found in your abilities',
            ], 404);
        }

        return $this->teacherAbilitiesResponse($user->id);
    }

    private function teacherAbilitiesResponse(int $teacherId): JsonResponse
    {
        $abilities = TeacherAbility::where('teacher_id', $teacherId)
            ->with('ability')
            ->get()
            ->pluck('ability')
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Teacher abilities updated successfully',
            'data' => [
                'teacher_id' => $teacherId,
                'abilities' => $abilities,
            ],
        ]);
    }
}
