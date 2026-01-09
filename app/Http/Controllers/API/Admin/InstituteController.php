<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\TeacherInstitute;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InstituteController extends Controller
{
    /**
     * Get all institute registrations with pagination
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $status = $request->query('status'); // Filter by status: pending, approved, rejected
            $perPage = $request->query('per_page', 20);

            $query = TeacherInstitute::with('user');

            // Filter by status if provided
            if ($status && in_array($status, ['pending', 'approved', 'rejected'])) {
                $query->where('status', $status);
            }

            $institutes = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $institutes->items(),
                'pagination' => [
                    'total' => $institutes->total(),
                    'per_page' => $institutes->perPage(),
                    'current_page' => $institutes->currentPage(),
                    'last_page' => $institutes->lastPage(),
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching institutes: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch institutes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single institute details
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $institute = TeacherInstitute::with('user')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $institute
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Institute not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching institute: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch institute',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve an institute registration
     * 
     * @param int $id
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function approve($id, Request $request)
    {
        try {
            $institute = TeacherInstitute::findOrFail($id);

            $institute->update([
                'status' => 'approved',
                'rejection_reason' => null,
            ]);

            // Optionally set commission percentage
            if ($request->has('commission_percentage')) {
                $institute->update(['commission_percentage' => $request->commission_percentage]);
            }

            Log::info('Institute approved', [
                'institute_id' => $id,
                'user_id' => $institute->user_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Institute approved successfully',
                'data' => $institute
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Institute not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error approving institute: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve institute',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject an institute registration
     * 
     * @param int $id
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function reject($id, Request $request)
    {
        $request->validate([
            'rejection_reason' => 'required|string|min:10|max:1000',
        ]);

        try {
            $institute = TeacherInstitute::findOrFail($id);

            $institute->update([
                'status' => 'rejected',
                'rejection_reason' => $request->rejection_reason,
            ]);

            Log::info('Institute rejected', [
                'institute_id' => $id,
                'user_id' => $institute->user_id,
                'reason' => $request->rejection_reason,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Institute rejected successfully',
                'data' => $institute
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Institute not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error rejecting institute: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject institute',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update institute details (admin can edit)
     * 
     * @param int $id
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function update($id, Request $request)
    {
        $request->validate([
            'institute_name'        => 'nullable|string|max:255',
            'commercial_register'   => 'nullable|string|max:255',
            'license_number'        => 'nullable|string|max:255',
            'description'           => 'nullable|string|max:5000',
            'website'               => 'nullable|url|max:255',
            'commission_percentage' => 'nullable|numeric|min:0|max:100',
            'status'                => 'nullable|in:pending,approved,rejected',
        ]);

        try {
            $institute = TeacherInstitute::findOrFail($id);

            $institute->update($request->only([
                'institute_name',
                'commercial_register',
                'license_number',
                'description',
                'website',
                'commission_percentage',
                'status',
            ]));

            Log::info('Institute updated', [
                'institute_id' => $id,
                'updated_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Institute updated successfully',
                'data' => $institute
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Institute not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error updating institute: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update institute',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get statistics about institute registrations
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStats()
    {
        try {
            $stats = [
                'total' => TeacherInstitute::count(),
                'pending' => TeacherInstitute::pending()->count(),
                'approved' => TeacherInstitute::approved()->count(),
                'rejected' => TeacherInstitute::rejected()->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error fetching institute stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an institute (soft delete behavior through cascade)
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $institute = TeacherInstitute::findOrFail($id);
            $instituteName = $institute->institute_name;

            $institute->delete();

            Log::info('Institute deleted', [
                'institute_id' => $id,
                'institute_name' => $instituteName,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Institute deleted successfully'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Institute not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting institute: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete institute',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
