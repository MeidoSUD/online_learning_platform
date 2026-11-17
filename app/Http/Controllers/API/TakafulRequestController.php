<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\TakafulRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TakafulRequestController extends Controller
{
    public function myStatus(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $takafulRequest = TakafulRequest::where('user_id', $userId)->latest()->first();

        return response()->json([
            'status' => true,
            'data' => $takafulRequest,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $existing = TakafulRequest::where('user_id', $userId)->latest()->first();

        $rules = [
            'identity_proof_file' => $existing ? 'nullable|file|mimes:jpeg,png,jpg,webp,pdf|max:10240' : 'required|file|mimes:jpeg,png,jpg,webp,pdf|max:10240',
            'death_certificate_file' => $existing ? 'nullable|file|mimes:jpeg,png,jpg,webp,pdf|max:10240' : 'required|file|mimes:jpeg,png,jpg,webp,pdf|max:10240',
        ];

        $request->validate($rules);

        $identityPath = $existing ? $existing->identity_proof_file : null;
        if ($request->hasFile('identity_proof_file')) {
            if ($existing && $existing->identity_proof_file && Storage::disk('public')->exists($existing->identity_proof_file)) {
                Storage::disk('public')->delete($existing->identity_proof_file);
            }
            $identityPath = $request->file('identity_proof_file')->store('takaful', 'public');
        }

        $deathPath = $existing ? $existing->death_certificate_file : null;
        if ($request->hasFile('death_certificate_file')) {
            if ($existing && $existing->death_certificate_file && Storage::disk('public')->exists($existing->death_certificate_file)) {
                Storage::disk('public')->delete($existing->death_certificate_file);
            }
            $deathPath = $request->file('death_certificate_file')->store('takaful', 'public');
        }

        if ($existing) {
            $existing->update([
                'identity_proof_file' => $identityPath,
                'death_certificate_file' => $deathPath,
                'status' => 'pending',
                'rejection_reason' => null,
            ]);

            return response()->json([
                'status' => true,
                'message' => 'تم إرسال الطلب بنجاح',
                'data' => $existing,
            ], 200);
        }

        $takafulRequest = TakafulRequest::create([
            'user_id' => $userId,
            'identity_proof_file' => $identityPath,
            'death_certificate_file' => $deathPath,
            'status' => 'pending',
            'rejection_reason' => null,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'تم إرسال الطلب بنجاح',
            'data' => $takafulRequest,
        ], 201);
    }

    public function adminIndex(Request $request): JsonResponse
    {
        $query = TakafulRequest::with(['user.profile']);

        if ($request->filled('status') && $request->status !== 'all' && $request->status !== 'undefined') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search') && $request->search !== 'undefined') {
            $search = trim($request->search);
            $query->whereHas('user', function ($uq) use ($search) {
                $uq->where('first_name', 'like', "%{$search}%")
                   ->orWhere('last_name', 'like', "%{$search}%")
                   ->orWhere('email', 'like', "%{$search}%")
                   ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->input('per_page', 15);
        $requests = $query->latest()->paginate($perPage);

        return response()->json([
            'status' => true,
            'data' => $requests,
        ]);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:pending,accepted,suspended,rejected',
            'rejection_reason' => 'required_if:status,rejected|nullable|string|max:1000',
        ]);

        $takafulRequest = TakafulRequest::findOrFail($id);

        $takafulRequest->status = $request->status;
        if ($request->status === 'rejected') {
            $takafulRequest->rejection_reason = $request->rejection_reason;
        } else if ($request->status === 'accepted') {
            $takafulRequest->rejection_reason = null;
        }

        $takafulRequest->save();

        return response()->json([
            'status' => true,
            'message' => 'تم تحديث حالة الطلب بنجاح',
            'data' => $takafulRequest,
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $takafulRequest = TakafulRequest::findOrFail($id);

        if ($takafulRequest->identity_proof_file && Storage::disk('public')->exists($takafulRequest->identity_proof_file)) {
            Storage::disk('public')->delete($takafulRequest->identity_proof_file);
        }

        if ($takafulRequest->death_certificate_file && Storage::disk('public')->exists($takafulRequest->death_certificate_file)) {
            Storage::disk('public')->delete($takafulRequest->death_certificate_file);
        }

        $takafulRequest->delete();

        return response()->json([
            'status' => true,
            'message' => 'تم حذف الطلب بنجاح',
        ]);
    }
}
