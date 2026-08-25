<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Instruction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class InstructionAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Instruction::query();

            if ($request->filled('type')) {
                $query->where('type', $request->type);
            }

            if ($request->filled('target_audience')) {
                $query->where('target_audience', $request->target_audience);
            }

            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('content', 'like', "%{$search}%")
                      ->orWhere('type', 'like', "%{$search}%");
                });
            }

            $instructions = $query->latest()->get();

            return response()->json([
                'success' => true,
                'data' => $instructions,
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching instructions', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch instructions',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'type' => 'required|string|max:255',
                'target_audience' => 'required|in:student,teacher,both',
                'is_active' => 'required|boolean',
            ]);

            $instruction = Instruction::create($validated);

            Log::info('Instruction created', ['id' => $instruction->id]);

            return response()->json([
                'success' => true,
                'message' => 'Instruction created successfully',
                'data' => $instruction,
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error creating instruction', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create instruction',
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $instruction = Instruction::find($id);

            if (!$instruction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Instruction not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $instruction,
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching instruction', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch instruction',
            ], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $instruction = Instruction::find($id);

            if (!$instruction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Instruction not found',
                ], 404);
            }

            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'content' => 'sometimes|string',
                'type' => 'sometimes|string|max:255',
                'target_audience' => 'sometimes|in:student,teacher,both',
                'is_active' => 'sometimes|boolean',
            ]);

            $instruction->update($validated);

            Log::info('Instruction updated', ['id' => $instruction->id]);

            return response()->json([
                'success' => true,
                'message' => 'Instruction updated successfully',
                'data' => $instruction,
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error updating instruction', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update instruction',
            ], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $instruction = Instruction::find($id);

            if (!$instruction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Instruction not found',
                ], 404);
            }

            $instruction->delete();

            Log::info('Instruction deleted', ['id' => $id]);

            return response()->json([
                'success' => true,
                'message' => 'Instruction deleted successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Error deleting instruction', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete instruction',
            ], 500);
        }
    }

    public function toggleActive(int $id): JsonResponse
    {
        try {
            $instruction = Instruction::find($id);

            if (!$instruction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Instruction not found',
                ], 404);
            }

            $instruction->update(['is_active' => !$instruction->is_active]);

            Log::info('Instruction status toggled', [
                'id' => $instruction->id,
                'is_active' => $instruction->is_active,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Instruction status updated',
                'data' => $instruction,
            ]);

        } catch (\Exception $e) {
            Log::error('Error toggling instruction status', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update instruction status',
            ], 500);
        }
    }
}
