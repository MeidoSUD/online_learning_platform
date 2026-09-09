<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Abilities;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AbilityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Abilities::query();

        if ($request->boolean('include_deleted')) {
            $query->withTrashed();
        }

        if ($request->has('status')) {
            $query->where('status', $request->boolean('status'));
        }

        $abilities = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Abilities retrieved successfully',
            'total' => $abilities->count(),
            'data' => $abilities,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name_en' => 'required|string|unique:abilities,name_en',
            'name_ar' => 'required|string|unique:abilities,name_ar',
            'status' => 'nullable|boolean',
        ]);

        $ability = Abilities::create($data + ['status' => $data['status'] ?? true]);

        return response()->json([
            'success' => true,
            'message' => 'Ability created successfully',
            'data' => $ability,
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $ability = Abilities::find($id);

        if (!$ability) {
            return response()->json(['success' => false, 'message' => 'Ability not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $ability]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $ability = Abilities::find($id);

        if (!$ability) {
            return response()->json(['success' => false, 'message' => 'Ability not found'], 404);
        }

        $data = $request->validate([
            'name_en' => ['sometimes', 'string', Rule::unique('abilities', 'name_en')->ignore($id)],
            'name_ar' => ['sometimes', 'string', Rule::unique('abilities', 'name_ar')->ignore($id)],
            'status' => 'sometimes|boolean',
        ]);

        $ability->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Ability updated successfully',
            'data' => $ability->fresh(),
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $ability = Abilities::find($id);

        if (!$ability) {
            return response()->json(['success' => false, 'message' => 'Ability not found'], 404);
        }

        if ($ability->teacherAbilities()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete ability that is assigned to teachers',
            ], 409);
        }

        $ability->delete();

        return response()->json(['success' => true, 'message' => 'Ability deleted successfully']);
    }

    public function forceDestroy($id): JsonResponse
    {
        $ability = Abilities::withTrashed()->find($id);

        if (!$ability) {
            return response()->json(['success' => false, 'message' => 'Ability not found'], 404);
        }

        $ability->forceDelete();

        return response()->json(['success' => true, 'message' => 'Ability permanently deleted successfully']);
    }

    public function restore($id): JsonResponse
    {
        $ability = Abilities::withTrashed()->find($id);

        if (!$ability) {
            return response()->json(['success' => false, 'message' => 'Ability not found'], 404);
        }

        $ability->restore();

        return response()->json(['success' => true, 'message' => 'Ability restored successfully', 'data' => $ability]);
    }
}
