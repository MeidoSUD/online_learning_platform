<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use App\Models\SupportTicketReply;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SupportTicketController extends Controller
{
    /**
     * List all support tickets (admin only)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $validated = $request->validate([
                'status' => 'nullable|in:open,in_progress,resolved,closed',
                'per_page' => 'nullable|integer|min:1|max:100',
                'sort_by' => 'nullable|in:created_at,updated_at,user_id',
                'order' => 'nullable|in:asc,desc',
            ]);

            $perPage = $validated['per_page'] ?? 15;
            $sortBy = $validated['sort_by'] ?? 'created_at';
            $order = $validated['order'] ?? 'desc';

            $query = SupportTicket::with('user', 'replies.user')
                ->orderBy($sortBy, $order);

            if (isset($validated['status'])) {
                $query->where('status', $validated['status']);
            }

            $tickets = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Support tickets retrieved successfully',
                'data' => $tickets
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve support tickets: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve support tickets',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single support ticket with all replies
     * 
     * @param int $ticketId
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($ticketId)
    {
        try {
            $ticket = SupportTicket::with(['user', 'replies' => function ($query) {
                $query->with('user')->orderBy('created_at', 'asc');
            }])->find($ticketId);

            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Support ticket not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Support ticket retrieved successfully',
                'data' => $ticket
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve support ticket: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve support ticket',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update support ticket status
     * 
     * @param Request $request
     * @param int $ticketId
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateStatus(Request $request, $ticketId)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:open,in_progress,resolved,closed',
                'internal_note' => 'nullable|string|max:1000',
            ]);

            $ticket = SupportTicket::find($ticketId);

            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Support ticket not found'
                ], 404);
            }

            $oldStatus = $ticket->status;
            $ticket->update([
                'status' => $validated['status'],
                'internal_note' => $validated['internal_note'] ?? $ticket->internal_note,
            ]);

            Log::info("Support ticket #{$ticketId} status changed from {$oldStatus} to {$validated['status']}");

            return response()->json([
                'success' => true,
                'message' => 'Support ticket status updated successfully',
                'data' => $ticket->fresh()
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to update support ticket status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update support ticket status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add a reply to a support ticket
     * 
     * @param Request $request
     * @param int $ticketId
     * @return \Illuminate\Http\JsonResponse
     */
    public function addReply(Request $request, $ticketId)
    {
        try {
            $validated = $request->validate([
                'message' => 'required|string|min:10|max:5000',
            ]);

            $ticket = SupportTicket::find($ticketId);

            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Support ticket not found'
                ], 404);
            }

            // Get authenticated admin user
            $adminUser = $request->user();
            if (!$adminUser || $adminUser->role_id != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: Admin access required'
                ], 403);
            }

            $reply = SupportTicketReply::create([
                'support_ticket_id' => $ticketId,
                'user_id' => $adminUser->id,
                'message' => $validated['message'],
                'is_admin_reply' => true,
            ]);

            // Update ticket status to in_progress if it was open
            if ($ticket->status === 'open') {
                $ticket->update(['status' => 'in_progress']);
            }

            Log::info("Admin reply added to support ticket #{$ticketId}");

            return response()->json([
                'success' => true,
                'message' => 'Reply added successfully',
                'data' => $reply->fresh()->load('user')
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to add reply to support ticket: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add reply',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resolve a support ticket
     * 
     * @param Request $request
     * @param int $ticketId
     * @return \Illuminate\Http\JsonResponse
     */
    public function resolve(Request $request, $ticketId)
    {
        try {
            $validated = $request->validate([
                'resolution_message' => 'required|string|min:10|max:5000',
            ]);

            $ticket = SupportTicket::find($ticketId);

            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Support ticket not found'
                ], 404);
            }

            $adminUser = $request->user();

            // Add final resolution reply
            SupportTicketReply::create([
                'support_ticket_id' => $ticketId,
                'user_id' => $adminUser->id,
                'message' => $validated['resolution_message'],
                'is_admin_reply' => true,
            ]);

            // Mark as resolved
            $ticket->update(['status' => 'resolved']);

            Log::info("Support ticket #{$ticketId} marked as resolved");

            return response()->json([
                'success' => true,
                'message' => 'Support ticket resolved successfully',
                'data' => $ticket->fresh()
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to resolve support ticket: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to resolve support ticket',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Close a support ticket
     * 
     * @param int $ticketId
     * @return \Illuminate\Http\JsonResponse
     */
    public function close($ticketId)
    {
        try {
            $ticket = SupportTicket::find($ticketId);

            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Support ticket not found'
                ], 404);
            }

            $ticket->update(['status' => 'closed']);

            Log::info("Support ticket #{$ticketId} closed");

            return response()->json([
                'success' => true,
                'message' => 'Support ticket closed successfully',
                'data' => $ticket->fresh()
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to close support ticket: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to close support ticket',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a support ticket and all its replies
     * 
     * @param int $ticketId
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($ticketId)
    {
        try {
            $ticket = SupportTicket::find($ticketId);

            if (!$ticket) {
                return response()->json([
                    'success' => false,
                    'message' => 'Support ticket not found'
                ], 404);
            }

            DB::beginTransaction();

            // Delete all replies first
            SupportTicketReply::where('support_ticket_id', $ticketId)->delete();

            // Delete ticket
            $ticket->delete();

            DB::commit();

            Log::info("Support ticket #{$ticketId} deleted");

            return response()->json([
                'success' => true,
                'message' => 'Support ticket deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete support ticket: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete support ticket',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get support ticket statistics
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStats()
    {
        try {
            $stats = [
                'total' => SupportTicket::count(),
                'open' => SupportTicket::where('status', 'open')->count(),
                'in_progress' => SupportTicket::where('status', 'in_progress')->count(),
                'resolved' => SupportTicket::where('status', 'resolved')->count(),
                'closed' => SupportTicket::where('status', 'closed')->count(),
                'today' => SupportTicket::whereDate('created_at', today())->count(),
                'this_week' => SupportTicket::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count(),
                'this_month' => SupportTicket::whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])->count(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Support ticket statistics retrieved successfully',
                'data' => $stats
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve support ticket statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
