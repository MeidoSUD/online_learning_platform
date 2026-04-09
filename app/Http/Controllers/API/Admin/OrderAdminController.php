<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Orders;
use App\Models\TeachersApplications;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

/**
 * ============================================================================
 * ORDER ADMIN CONTROLLER - Marketplace Management
 * ============================================================================
 * 
 * PURPOSE:
 * Central dashboard for Admins to monitor and manage the teacher-student
 * matching marketplace. Provides complete visibility into:
 * - Student orders (requests for teachers)
 * - Teacher applications (responses from teachers)
 * - Assignment and approval workflows
 * - Order status tracking throughout lifecycle
 * 
 * BUSINESS LOGIC:
 * 1. Student posts an Order → Status: "pending"
 * 2. Teachers view order → Submit applications
 * 3. Admin reviews applications → Accepts/rejects teachers
 * 4. Accepted teacher assigned → Status: "confirmed"
 * 5. Sessions created → Status: "in_progress"
 * 6. Sessions completed → Status: "completed"
 * 
 * ADMIN CAPABILITIES:
 * - View all orders with detailed student/teacher information
 * - View all applications for a specific order
 * - Accept/reject teacher applications
 * - Manually assign teachers to orders
 * - Filter and search orders
 * - Track order status and timeline
 * 
 * ROUTES:
 * GET    /api/admin/orders                          → index()              # List all orders
 * GET    /api/admin/orders/{id}                     → show()               # Order details
 * GET    /api/admin/orders/{order_id}/applications → viewApplications()   # Teacher applications
 * POST   /api/admin/orders/{order_id}/assign       → assignTeacher()      # Assign teacher
 * PUT    /api/admin/orders/{order_id}/status       → updateStatus()       # Update status
 * 
 * ============================================================================
 */

class OrderAdminController extends Controller
{
    /**
     * ========================================================================
     * GET /api/admin/orders
     * ========================================================================
     * List all orders with complete student/teacher details and filters
     * 
     * Query Parameters:
     * - status:      Filter by status (pending, confirmed, in_progress, completed, cancelled)
     * - search:      Search by student name, subject, or order ID
     * - per_page:    Results per page (default: 20)
     * - sort_by:     Sort field (id, created_at, updated_at, status)
     * - sort_order:  ASC or DESC (default: DESC)
     * 
     * Response Structure:
     * {
     *   "success": true,
     *   "message": "Orders retrieved successfully",
     *   "data": [
     *     {
     *       "id": "42",
     *       "student": {
     *         "id": "5",
     *         "first_name": "Ahmed",
     *         "last_name": "Smith",
     *         "email": "ahmed@example.com",
     *         "phone_number": "966501234567",
     *         "avatar": "storage/profile-photos/student.jpg"
     *       },
     *       "subject": {
     *         "id": "12",
     *         "name_en": "Mathematics",
     *         "name_ar": "الرياضيات"
     *       },
     *       "class": {
     *         "id": "3",
     *         "name_en": "Grade 10",
     *         "name_ar": "الصف العاشر"
     *       },
     *       "education_level": {
     *         "id": "2",
     *         "name_en": "Secondary",
     *         "name_ar": "المرحلة الثانوية"
     *       },
     *       "assigned_teacher": {
     *         "id": "8",
     *         "first_name": "Fatima",
     *         "last_name": "Johnson",
     *         "rating": "4.8",
     *         "experience_years": "5"
     *       } || null,      # null if not yet assigned
     *       "status": "pending",     # pending, confirmed, in_progress, completed, cancelled
     *       "min_price": "50.00",
     *       "max_price": "100.00",
     *       "notes": "Needs help with calculus",
     *       "application_count": 3,  # Number of teachers who applied
     *       "created_at": "2026-04-08T10:30:00",
     *       "updated_at": "2026-04-08T11:45:00"
     *     }
     *   ],
     *   "pagination": { ... }
     * }
     */
    public function index(Request $request)
    {
        try {
            $query = Orders::with([
                'student:id,first_name,last_name,email,phone_number',
                'subject:id,name_en,name_ar',
                'preferredTeacher:id,first_name,last_name',
                'applications:id,order_id,teacher_id'
            ]);

            // Status filter
            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            // Search filter
            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->whereHas('student', function ($subQ) use ($search) {
                        $subQ->where('first_name', 'like', "%{$search}%")
                             ->orWhere('last_name', 'like', "%{$search}%");
                    })->orWhereHas('subject', function ($subQ) use ($search) {
                        $subQ->where('name_en', 'like', "%{$search}%")
                             ->orWhere('name_ar', 'like', "%{$search}%");
                    })->orWhere('id', 'like', "%{$search}%");
                });
            }

            // Sorting
            $sortBy = $request->input('sort_by', 'id');
            $sortOrder = $request->input('sort_order', 'DESC');
            
            if (in_array($sortBy, ['id', 'status', 'created_at', 'updated_at'])) {
                $query->orderBy($sortBy, $sortOrder);
            }

            $perPage = $request->input('per_page', 20);
            $orders = $query->paginate($perPage);

            // Format response - use paginator items() wrapped in a collection to avoid calling getCollection()
            $formattedOrders = collect($orders->items())->map(function ($order) {
                return $this->formatOrderResponse($order);
            })->values();

            return response()->json([
                'success' => true,
                'message' => 'Orders retrieved successfully',
                'data' => $formattedOrders,
                'pagination' => [
                    'total' => $orders->total(),
                    'per_page' => $orders->perPage(),
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve orders', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve orders',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ========================================================================
     * GET /api/admin/orders/{id}
     * ========================================================================
     * Get detailed view of a single order with all related data
     * 
     * Response:
     * {
     *   "success": true,
     *   "data": { ... order details ... },
     *   "applications": [ ... teacher applications with profiles ... ]
     * }
     */
    public function show($id)
    {
        try {
            $order = Orders::with([
                'student',
                'subject',
                'applications.teacher:id,first_name,last_name,email',
                'sessions',
                'applications'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $this->formatOrderResponse($order),
                'applications' => $order->applications->map(function ($app) {
                    return $this->formatApplicationResponse($app);
                })
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve order', [
                'order_id' => $id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ========================================================================
     * GET /api/admin/orders/{order_id}/applications
     * ========================================================================
     * View all teacher applications for a specific order
     * 
     * CRITICAL INFO - Include Teacher Profile for Quick Admin Decision:
     * - Teacher ID, Name, Email
     * - Rating (average of all reviews)
     * - Experience Years
     * - Qualifications (certificates, subjects)
     * - Response time
     * 
     * This allows admins to quickly evaluate which teacher to approve.
     * 
     * Response Structure:
     * {
     *   "success": true,
     *   "order": { ... order details ... },
     *   "applications": [
     *     {
     *       "id": "1",
     *       "teacher": {
     *         "id": "8",
     *         "first_name": "Fatima",
     *         "last_name": "Johnson",
     *         "email": "fatima@example.com",
     *         "phone_number": "966509876543",
     *         "rating": "4.8",
     *         "experience_years": "5",
     *         "verified": true,
     *         "certificates": [ ... ],
     *         "subjects": [ ... ],
     *         "profile_photo": "storage/profile-photos/..."
     *       },
     *       "applied_at": "2026-04-08T10:30:00",
     *       "status": "pending",    # pending, accepted, rejected
     *       "is_preferred": false
     *     }
     *   ]
     * }
     */
    public function viewApplications($orderId)
    {
        try {
            $order = Orders::with('applications.teacher')->findOrFail($orderId);

            $applications = $order->applications->map(function ($app) {
                return $this->formatApplicationResponse($app);
            });

            return response()->json([
                'success' => true,
                'order' => $this->formatOrderResponse($order),
                'applications' => $applications,
                'application_count' => count($applications)
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve applications', [
                'order_id' => $orderId,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve applications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ========================================================================
     * POST /api/admin/orders/{order_id}/assign
     * ========================================================================
     * Assign a teacher to an order (manual approval)
     * 
     * Business Logic:
     * 1. Admin approves a teacher application
     * 2. Order status changes to "confirmed"
     * 3. Teacher becomes the assigned teacher
     * 4. Other applications are marked as "rejected"
     * 5. Sessions are created for available slots
     * 
     * Request Body:
     * {
     *   "teacher_id": 8,                # Required - the teacher to assign
     *   "reason": "Best fit for student" # Optional - admin notes
     * }
     * 
     * Response (200 OK):
     * {
     *   "success": true,
     *   "message": "Teacher assigned successfully",
     *   "order": { ... updated order with new teacher_id ... }
     * }
     */
    public function assignTeacher(Request $request, $orderId)
    {
        try {
            $validated = $request->validate([
                'teacher_id' => 'required|exists:users,id',
                'reason' => 'nullable|string|max:500'
            ]);

            DB::beginTransaction();

            // Get order
            $order = Orders::findOrFail($orderId);

            // Verify teacher applied for this order
            $application = TeachersApplications::where('order_id', $orderId)
                ->where('teacher_id', $validated['teacher_id'])
                ->firstOrFail();

            // Update order
            $order->update([
                'teacher_id' => $validated['teacher_id'],
                'status' => 'confirmed'
            ]);

            // Mark application as accepted
            $application->update(['status' => 'accepted']);

            // Reject all other applications
            TeachersApplications::where('order_id', $orderId)
                ->where('teacher_id', '!=', $validated['teacher_id'])
                ->update(['status' => 'rejected']);

            DB::commit();

            Log::info('Teacher assigned to order', [
                'order_id' => $orderId,
                'teacher_id' => $validated['teacher_id'],
                'admin_reason' => $validated['reason'] ?? 'N/A'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Teacher assigned successfully',
                'order' => $this->formatOrderResponse($order->refresh())
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Order or teacher not found'
            ], 404);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to assign teacher', [
                'order_id' => $orderId,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign teacher',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ========================================================================
     * PUT /api/admin/orders/{order_id}/status
     * ========================================================================
     * Update order status and track workflow
     * 
     * Valid Status Transitions:
     * pending → confirmed (teacher assigned)
     * confirmed → in_progress (first session started)
     * in_progress → completed (all sessions completed)
     * any → cancelled (admin cancellation)
     * 
     * Request Body:
     * {
     *   "status": "completed",
     *   "notes": "All sessions completed successfully"
     * }
     * 
     * Response (200 OK):
     * {
     *   "success": true,
     *   "message": "Order status updated",
     *   "order": { ... }
     * }
     */
    public function updateStatus(Request $request, $orderId)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:pending,confirmed,in_progress,completed,cancelled',
                'notes' => 'nullable|string|max:500'
            ]);

            $order = Orders::findOrFail($orderId);

            // Validate status transition
            $validTransitions = [
                'pending' => ['confirmed', 'cancelled'],
                'confirmed' => ['in_progress', 'cancelled'],
                'in_progress' => ['completed', 'cancelled'],
                'completed' => ['cancelled'],
                'cancelled' => []
            ];

            if (!in_array($validated['status'], $validTransitions[$order->status] ?? [])) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot transition from '{$order->status}' to '{$validated['status']}'"
                ], 422);
            }

            $order->update([
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? $order->notes
            ]);

            Log::info('Order status updated', [
                'order_id' => $orderId,
                'old_status' => $order->getOriginal('status'),
                'new_status' => $validated['status']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Order status updated successfully',
                'order' => $this->formatOrderResponse($order)
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Failed to update order status', [
                'order_id' => $orderId,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update order status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ========================================================================
     * HELPER METHODS
     * ========================================================================
     */

    /**
     * Format order response with all related data
     */
    private function formatOrderResponse($order)
    {
        $teacher = $order->preferredTeacher;
        $assignedTeacher = null;
        
        if ($teacher) {
            $rating = $teacher->reviews()->avg('rating') ?? 0;
            $assignedTeacher = [
                'id' => (string) $teacher->id,
                'first_name' => $teacher->first_name,
                'last_name' => $teacher->last_name,
                'rating' => number_format($rating, 1),
                'experience_years' => (string) (optional($teacher->teacherInfo)->years_experience ?? 0),
                'email' => $teacher->email
            ];
        }

        return [
            'id' => (string) $order->id,
            'student' => [
                'id' => (string) $order->student->id,
                'first_name' => $order->student->first_name,
                'last_name' => $order->student->last_name,
                'email' => $order->student->email,
                'phone_number' => (string) $order->student->phone_number
            ],
            'subject' => $order->subject ? [
                'id' => (string) $order->subject->id,
                'name_en' => $order->subject->name_en,
                'name_ar' => $order->subject->name_ar
            ] : null,
            'assigned_teacher' => $assignedTeacher,
            'status' => $order->status,
            'min_price' => (string) $order->min_price,
            'max_price' => (string) $order->max_price,
            'notes' => $order->notes,
            'application_count' => (int) ($order->applications->count() ?? 0),
            'created_at' => $order->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $order->updated_at->format('Y-m-d H:i:s')
        ];
    }

    /**
     * Format teacher application with profile details
     */
    private function formatApplicationResponse($application)
    {
        $teacher = $application->teacher;
        $rating = $teacher->reviews()->avg('rating') ?? 0;

        return [
            'id' => (string) $application->id,
            'teacher' => [
                'id' => (string) $teacher->id,
                'first_name' => $teacher->first_name,
                'last_name' => $teacher->last_name,
                'email' => $teacher->email,
                'phone_number' => (string) $teacher->phone_number,
                'rating' => number_format($rating, 1),
                'experience_years' => (string) (optional($teacher->teacherInfo)->years_experience ?? 0),
                'verified' => (bool) $teacher->verified,
                'profile_photo' => optional($teacher->attachments()->where('attached_to_type', 'profile_picture')->latest()->first())->file_path
            ],
            'applied_at' => $application->created_at->format('Y-m-d H:i:s'),
            'status' => $application->status ?? 'pending',
            'is_preferred' => $application->order->teacher_id === $teacher->id
        ];
    }
}
