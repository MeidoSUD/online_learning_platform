<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Dispute;

class DisputeController extends Controller
{
    /**
     * List all disputes raised by the authenticated user.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $disputes = Dispute::where('raised_by', $userId)->with(['booking', 'payment'])->get();

        return response()->json([
            'success' => true,
            'data' => $disputes
        ]);
    }

    /**
     * Store a new dispute.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'booking_id'      => 'required|exists:bookings,id',
            'payment_id'      => 'nullable|exists:payments,id',
            'against_user_id' => 'required|exists:users,id',
            'reason'          => 'required|string|max:1000',
        ]);

        $dispute = Dispute::create([
            'booking_id'      => $validated['booking_id'],
            'payment_id'      => $validated['payment_id'] ?? null,
            'raised_by'       => $request->user()->id,
            'against_user_id' => $validated['against_user_id'],
            'reason'          => $validated['reason'],
            'status'          => 'open',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Dispute created successfully',
            'data' => $dispute
        ], 201);
    }

    /**
     * Show a specific dispute (only if raised by the user).
     */
    public function show(Request $request, $id)
    {
        $userId = $request->user()->id;
        $dispute = Dispute::where('id', $id)
            ->where('raised_by', $userId)
            ->with(['booking', 'payment'])
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $dispute
        ]);
    }

    /**
     * Update a dispute (only if raised by the user and still open).
     */
    public function update(Request $request, $id)
    {
        $userId = $request->user()->id;
        $dispute = Dispute::where('id', $id)
            ->where('raised_by', $userId)
            ->where('status', 'open')
            ->firstOrFail();

        $validated = $request->validate([
            'reason'           => 'sometimes|required|string|max:1000',
            'resolution_note'  => 'nullable|string|max:1000',
            'status'           => 'sometimes|in:open,resolved,closed',
        ]);

        $dispute->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Dispute updated successfully',
            'data' => $dispute
        ]);
    }

    /**
     * Delete a dispute (only if raised by the user and still open).
     */
    public function destroy(Request $request, $id)
    {
        $userId = $request->user()->id;
        $dispute = Dispute::where('id', $id)
            ->where('raised_by', $userId)
            ->where('status', 'open')
            ->firstOrFail();

        $dispute->delete();

        return response()->json([
            'success' => true,
            'message' => 'Dispute deleted successfully'
        ]);
    }
}
