<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\ConsultationCategory;
use App\Models\TeacherInfo;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * ============================================================================
 * CONSULTATION ADMIN CONTROLLER
 * ============================================================================
 *
 * PURPOSE:
 * Lets admins manage the consultation service end to end:
 * - Manage consultation categories (International Exams, Research, Homework...)
 * - Review student consultation requests
 * - Assign a teacher for each request (technical support finds the right fit)
 * - Track status through to the scheduled online session
 *
 * BUSINESS FLOW:
 * pending → under_review (admin reviewing) → assigned (teacher picked)
 * → scheduled (booking + online session created by teacher) → completed
 * Any → cancelled / rejected
 *
 * ============================================================================
 */
class ConsultationAdminController extends Controller
{
    // ------------------------------------------------------------------
    // Categories
    // ------------------------------------------------------------------

    public function categories(): JsonResponse
    {
        $categories = ConsultationCategory::withCount('consultations')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name_en' => 'required|string|max:255',
            'name_ar' => 'required|string|max:255',
            'description_en' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $category = ConsultationCategory::create([
            'name_en' => $validated['name_en'],
            'name_ar' => $validated['name_ar'],
            'description_en' => $validated['description_en'] ?? null,
            'description_ar' => $validated['description_ar'] ?? null,
            'icon' => $validated['icon'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully',
            'data' => $category,
        ], 201);
    }

    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $category = ConsultationCategory::findOrFail($id);

        $validated = $request->validate([
            'name_en' => 'sometimes|required|string|max:255',
            'name_ar' => 'sometimes|required|string|max:255',
            'description_en' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully',
            'data' => $category,
        ]);
    }

    public function destroyCategory(int $id): JsonResponse
    {
        $category = ConsultationCategory::findOrFail($id);

        if ($category->consultations()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete a category that has consultation requests',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully',
        ]);
    }

    // ------------------------------------------------------------------
    // Consultations
    // ------------------------------------------------------------------

    public function index(Request $request): JsonResponse
    {
        $query = Consultation::with([
            'category',
            'student:id,first_name,last_name,email,phone_number',
            'teacher:id,first_name,last_name,email',
            'booking',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('consultation_reference', 'like', "%{$search}%")
                    ->orWhereHas('student', function ($subQ) use ($search) {
                        $subQ->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('category', function ($subQ) use ($search) {
                        $subQ->where('name_en', 'like', "%{$search}%")
                            ->orWhere('name_ar', 'like', "%{$search}%");
                    });
            });
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'DESC');
        if (in_array($sortBy, ['id', 'status', 'created_at', 'updated_at', 'assigned_at'])) {
            $query->orderBy($sortBy, $sortOrder);
        }

        $perPage = $request->input('per_page', 20);
        $consultations = $query->paginate($perPage);

        $formatted = collect($consultations->items())->map(fn ($c) => $this->formatConsultation($c))->values();

        return response()->json([
            'success' => true,
            'message' => 'Consultations retrieved successfully',
            'data' => $formatted,
            'pagination' => [
                'total' => $consultations->total(),
                'per_page' => $consultations->perPage(),
                'current_page' => $consultations->currentPage(),
                'last_page' => $consultations->lastPage(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $consultation = Consultation::with([
            'category',
            'student',
            'teacher.teacherInfo',
            'assignedBy',
            'booking.sessions',
            'preferredLanguage',
            'educationLevel',
            'class',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $this->formatConsultation($consultation),
        ]);
    }

    /**
     * GET /api/admin/consultations/teachers
     * Candidate teachers for assignment, with their hourly consultation rate.
     */
    public function teachers(): JsonResponse
    {
        $teachers = User::where('role_id', 3)
            ->where('is_active', 1)
            ->with('teacherInfo')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'email', 'phone_number', 'verified']);

        $formatted = $teachers->map(function ($teacher) {
            return [
                'id' => (string) $teacher->id,
                'first_name' => $teacher->first_name,
                'last_name' => $teacher->last_name,
                'email' => $teacher->email,
                'phone_number' => (string) $teacher->phone_number,
                'verified' => (bool) $teacher->verified,
                'hourly_rate' => (float) (optional($teacher->teacherInfo)->individual_hour_price ?? 0),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formatted,
        ]);
    }

    /**
     * POST /api/admin/consultations/{id}/assign-teacher
     * Assign a teacher to a consultation request.
     */
    public function assignTeacher(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'teacher_id' => 'required|exists:users,id',
                'admin_notes' => 'nullable|string|max:2000',
            ]);

            DB::beginTransaction();

            $consultation = Consultation::findOrFail($id);

            if (!in_array($consultation->status, [Consultation::STATUS_PENDING, Consultation::STATUS_UNDER_REVIEW, Consultation::STATUS_ASSIGNED])) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot assign a teacher while the consultation is '{$consultation->status}'",
                ], 422);
            }

            $teacher = User::where('role_id', 3)->findOrFail($validated['teacher_id']);

            $consultation->update([
                'teacher_id' => $teacher->id,
                'assigned_by' => $request->user()->id,
                'assigned_at' => now(),
                'admin_notes' => $validated['admin_notes'] ?? $consultation->admin_notes,
                'status' => Consultation::STATUS_ASSIGNED,
            ]);

            DB::commit();
        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Consultation or teacher not found',
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to assign teacher to consultation', [
                'consultation_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to assign teacher',
                'error' => $e->getMessage(),
            ], 500);
        }

        try {
            $notificationService = app(NotificationService::class);
            $notificationService->send(
                $teacher,
                'consultation',
                'New consultation assigned to you',
                "A student consultation ('{$consultation->category?->name_en}') has been assigned to you. Please review it and schedule the online session.",
                ['consultation_id' => $consultation->id]
            );
            $notificationService->send(
                $consultation->student,
                'consultation',
                'Teacher assigned to your consultation',
                "Our team matched a teacher for your consultation request. They will contact you to schedule the online session.",
                ['consultation_id' => $consultation->id]
            );
        } catch (\Throwable $e) {
            Log::warning('Failed to send consultation assignment notifications', ['error' => $e->getMessage()]);
        }

        $consultation->load(['category', 'student', 'teacher', 'booking']);

        return response()->json([
            'success' => true,
            'message' => 'Teacher assigned successfully',
            'data' => $this->formatConsultation($consultation),
        ]);
    }

    /**
     * PUT /api/admin/consultations/{id}/status
     * Valid transitions:
     * pending → under_review, rejected, cancelled
     * under_review → assigned, rejected, cancelled
     * assigned → scheduled, cancelled
     * scheduled → completed, cancelled
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:pending,under_review,assigned,scheduled,completed,cancelled,rejected',
                'admin_notes' => 'nullable|string|max:2000',
            ]);

            $consultation = Consultation::findOrFail($id);

            $validTransitions = [
                Consultation::STATUS_PENDING => [Consultation::STATUS_UNDER_REVIEW, Consultation::STATUS_REJECTED, Consultation::STATUS_CANCELLED],
                Consultation::STATUS_UNDER_REVIEW => [Consultation::STATUS_ASSIGNED, Consultation::STATUS_REJECTED, Consultation::STATUS_CANCELLED],
                Consultation::STATUS_ASSIGNED => [Consultation::STATUS_SCHEDULED, Consultation::STATUS_CANCELLED],
                Consultation::STATUS_SCHEDULED => [Consultation::STATUS_COMPLETED, Consultation::STATUS_CANCELLED],
                Consultation::STATUS_COMPLETED => [Consultation::STATUS_CANCELLED],
                Consultation::STATUS_REJECTED => [],
                Consultation::STATUS_CANCELLED => [],
            ];

            if (!in_array($validated['status'], $validTransitions[$consultation->status] ?? [])) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot transition from '{$consultation->status}' to '{$validated['status']}'",
                ], 422);
            }

            $consultation->update([
                'status' => $validated['status'],
                'admin_notes' => $validated['admin_notes'] ?? $consultation->admin_notes,
                'cancelled_at' => in_array($validated['status'], [Consultation::STATUS_CANCELLED, Consultation::STATUS_REJECTED]) ? now() : $consultation->cancelled_at,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Consultation status updated',
                'data' => $this->formatConsultation($consultation->load(['category', 'student', 'teacher', 'booking'])),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Consultation not found',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Failed to update consultation status', [
                'consultation_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update consultation status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/admin/consultations/stats
     * Quick counts for the admin dashboard.
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total' => Consultation::count(),
                'pending' => Consultation::where('status', Consultation::STATUS_PENDING)->count(),
                'under_review' => Consultation::where('status', Consultation::STATUS_UNDER_REVIEW)->count(),
                'assigned' => Consultation::where('status', Consultation::STATUS_ASSIGNED)->count(),
                'scheduled' => Consultation::where('status', Consultation::STATUS_SCHEDULED)->count(),
                'completed' => Consultation::where('status', Consultation::STATUS_COMPLETED)->count(),
                'cancelled' => Consultation::where('status', Consultation::STATUS_CANCELLED)->count(),
            ],
        ]);
    }

    private function formatConsultation($consultation): array
    {
        $teacher = null;
        if ($consultation->teacher) {
            $teacher = [
                'id' => (string) $consultation->teacher->id,
                'first_name' => $consultation->teacher->first_name,
                'last_name' => $consultation->teacher->last_name,
                'email' => $consultation->teacher->email,
            ];
        }

        return [
            'id' => (string) $consultation->id,
            'consultation_reference' => $consultation->consultation_reference,
            'category' => $consultation->category ? [
                'id' => (string) $consultation->category->id,
                'name_en' => $consultation->category->name_en,
                'name_ar' => $consultation->category->name_ar,
            ] : null,
            'student' => [
                'id' => (string) $consultation->student->id,
                'first_name' => $consultation->student->first_name,
                'last_name' => $consultation->student->last_name,
                'email' => $consultation->student->email,
                'phone_number' => (string) ($consultation->student->phone_number ?? ''),
            ],
            'teacher' => $teacher,
            'title' => $consultation->title,
            'description' => $consultation->description,
            'preferred_slots' => $consultation->preferred_slots,
            'duration_minutes' => (int) $consultation->duration_minutes,
            'sessions_count' => (int) $consultation->sessions_count,
            'budget_min' => $consultation->budget_min,
            'budget_max' => $consultation->budget_max,
            'price_per_session' => $consultation->price_per_session,
            'status' => $consultation->status,
            'status_label' => $consultation->status_label,
            'admin_notes' => $consultation->admin_notes,
            'scheduled_date' => $consultation->scheduled_date,
            'scheduled_start_time' => $consultation->scheduled_start_time,
            'scheduled_end_time' => $consultation->scheduled_end_time,
            'booking_id' => $consultation->booking_id ? (string) $consultation->booking_id : null,
            'assigned_at' => $consultation->assigned_at?->format('Y-m-d H:i:s'),
            'created_at' => $consultation->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $consultation->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}