<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Services;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

/**
 * ============================================================================
 * SERVICES ADMIN CONTROLLER - Complete MVC Implementation
 * ============================================================================
 * 
 * PURPOSE:
 * Manages all educational services/courses on the platform (Private Lessons,
 * Language Study, Online Courses, etc.). Provides CRUD operations with:
 * - Automatic slug generation from service names (URL-safe)
 * - Multi-language support (Arabic/English)
 * - Soft deletes (preserves historical data)
 * - Status management (active/inactive)
 * - Role-based access control (admin only)
 * 
 * ARCHITECTURE:
 * - Request Validation → Business Logic → Database Operation → JSON Response
 * - All responses include 'success', 'message', and 'data' fields
 * - Errors include 'errors' array for frontend form validation
 * 
 * ROUTES:
 * GET    /api/admin/services              → index()     # List all services
 * POST   /api/admin/services              → store()     # Create new service
 * GET    /api/admin/services/{id}         → show()      # Get single service
 * PUT    /api/admin/services/{id}         → update()    # Update service
 * DELETE /api/admin/services/{id}         → destroy()   # Soft delete service
 * 
 * ============================================================================
 */

class ServiceAdminController extends Controller
{
    /**
     * ========================================================================
     * GET /api/admin/services
     * ========================================================================
     * List all services with filtering, searching, and pagination
     * 
     * Query Parameters:
     * - search:    Filter by name_en/name_ar (case-insensitive)
     * - status:    Filter by status (1=active, 0=inactive)
     * - role_id:   Filter by role_id (3=teacher, 4=student)
     * - per_page:  Results per page (default: 15)
     * - page:      Page number (default: 1)
     * 
     * Response Structure:
     * {
     *   "success": true,
     *   "message": "Services retrieved successfully",
     *   "data": [
     *     {
     *       "id": "1",                          # String for consistency
     *       "key_name": "private_lessons",      # URL-safe identifier
     *       "name_en": "Private Lessons",       # English display name
     *       "name_ar": "دروس خاصة",              # Arabic display name
     *       "description_en": "1-on-1 lessons", # English description
     *       "description_ar": "دروس فردية",     # Arabic description
     *       "image": "storage/services/...",    # Image URL
     *       "status": "1",                      # "1" or "0" as string
     *       "role_id": "3",                     # "3"=teacher, "4"=student
     *       "created_at": "2026-04-08T...",
     *       "updated_at": "2026-04-08T..."
     *     }
     *   ],
     *   "pagination": {
     *     "total": 4,
     *     "per_page": 15,
     *     "current_page": 1,
     *     "last_page": 1
     *   }
     * }
     */
    public function index(Request $request)
    {
        try {
            $query = Services::query();

            // Search filter
            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name_en', 'like', "%{$search}%")
                      ->orWhere('name_ar', 'like', "%{$search}%")
                      ->orWhere('key_name', 'like', "%{$search}%");
                });
            }

            // Status filter
            if ($request->filled('status')) {
                $query->where('status', (int)$request->input('status'));
            }

            // Role filter
            if ($request->filled('role_id')) {
                $query->where('role_id', (int)$request->input('role_id'));
            }

            // Pagination
            $perPage = $request->input('per_page', 15);
            $services = $query->orderByDesc('id')->paginate($perPage);

            // Format response with string IDs
            $formattedServices = $services->map(function ($service) {
                return $this->formatServiceResponse($service);
            });

            return response()->json([
                'success' => true,
                'message' => 'Services retrieved successfully',
                'data' => $formattedServices,
                'pagination' => [
                    'total' => $services->total(),
                    'per_page' => $services->perPage(),
                    'current_page' => $services->currentPage(),
                    'last_page' => $services->lastPage(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve services', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve services',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ========================================================================
     * POST /api/admin/services
     * ========================================================================
     * Create a new service
     * 
     * Request Body (JSON):
     * {
     *   "name_en": "Private Lessons",       # Required, max 255 chars
     *   "name_ar": "دروس خاصة",              # Required, max 255 chars
     *   "description_en": "1-on-1 tutoring",# Optional, max 1000 chars
     *   "description_ar": "تدريس فردي",      # Optional, max 1000 chars
     *   "key_name": "private_lessons",      # Optional - auto-generated if not provided
     *   "role_id": 3,                       # Optional (3=teacher, 4=student)
     *   "status": 1                         # Optional (default: 1 = active)
     * }
     * 
     * Auto-Generated Fields:
     * - key_name: Slug generated from name_en if not provided
     *   Example: "Private Lessons" → "private-lessons"
     * 
     * Response (201 Created):
     * {
     *   "success": true,
     *   "message": "Service created successfully",
     *   "data": {
     *     "id": "5",
     *     "key_name": "private-lessons",
     *     "name_en": "Private Lessons",
     *     "name_ar": "دروس خاصة",
     *     ...
     *   }
     * }
     * 
     * Error Response (422 Validation Error):
     * {
     *   "success": false,
     *   "message": "Validation failed",
     *   "errors": {
     *     "name_en": ["The name_en field is required."],
     *     "name_ar": ["The name_ar field is required."]
     *   }
     * }
     */
    public function store(Request $request)
    {
        try {
            // Validate input
            $validated = $request->validate([
                'name_en' => 'required|string|max:255|unique:services,name_en',
                'name_ar' => 'required|string|max:255|unique:services,name_ar',
                'description_en' => 'nullable|string|max:1000',
                'description_ar' => 'nullable|string|max:1000',
                'key_name' => 'nullable|string|max:255|unique:services,key_name',
                'role_id' => 'nullable|integer|in:3,4',
                'status' => 'nullable|integer|in:0,1',
                'image' => 'nullable|string'
            ]);

            // Auto-generate key_name from name_en if not provided
            if (empty($validated['key_name'])) {
                $validated['key_name'] = Str::slug($validated['name_en'], '-');
                
                // Handle duplicate slugs
                $counter = 1;
                $original = $validated['key_name'];
                while (Services::where('key_name', $validated['key_name'])->exists()) {
                    $validated['key_name'] = "{$original}-{$counter}";
                    $counter++;
                }
            }

            // Set defaults
            $validated['status'] = $validated['status'] ?? 1;
            $validated['role_id'] = $validated['role_id'] ?? null;

            // Create service
            $service = Services::create($validated);

            Log::info('Service created', [
                'service_id' => $service->id,
                'name_en' => $service->name_en,
                'key_name' => $service->key_name
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Service created successfully',
                'data' => $this->formatServiceResponse($service)
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Failed to create service', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create service',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ========================================================================
     * GET /api/admin/services/{id}
     * ========================================================================
     * Get a single service by ID
     * 
     * Response (200 OK):
     * {
     *   "success": true,
     *   "message": "Service retrieved successfully",
     *   "data": { ... service details ... }
     * }
     * 
     * Error (404 Not Found):
     * {
     *   "success": false,
     *   "message": "Service not found"
     * }
     */
    public function show($id)
    {
        try {
            $service = Services::findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Service retrieved successfully',
                'data' => $this->formatServiceResponse($service)
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Service not found'
            ], 404);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve service', [
                'service_id' => $id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve service',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ========================================================================
     * PUT /api/admin/services/{id}
     * ========================================================================
     * Update an existing service
     * 
     * Request Body (JSON) - all fields optional:
     * {
     *   "name_en": "Updated Name",
     *   "name_ar": "الاسم المحدّث",
     *   "description_en": "New description",
     *   "description_ar": "وصف جديد",
     *   "key_name": "updated-key",          # Changing name? Update slug too
     *   "status": 1,                        # Set to 0 to deactivate
     *   "role_id": 3
     * }
     * 
     * Response (200 OK):
     * {
     *   "success": true,
     *   "message": "Service updated successfully",
     *   "data": { ... updated service ... }
     * }
     * 
     * Important Note - URL Integrity:
     * If updating name_en/name_ar, also update key_name to maintain
     * URL integrity. Otherwise, old slugs in bookmarks/links will break.
     * 
     * Example:
     * Old: GET /services/private-lessons
     * After update with new key_name:
     * New: GET /services/one-on-one-tutoring
     */
    public function update(Request $request, $id)
    {
        try {
            $service = Services::findOrFail($id);

            // Validate update
            $validated = $request->validate([
                'name_en' => 'nullable|string|max:255|unique:services,name_en,' . $id,
                'name_ar' => 'nullable|string|max:255|unique:services,name_ar,' . $id,
                'description_en' => 'nullable|string|max:1000',
                'description_ar' => 'nullable|string|max:1000',
                'key_name' => 'nullable|string|max:255|unique:services,key_name,' . $id,
                'role_id' => 'nullable|integer|in:3,4',
                'status' => 'nullable|integer|in:0,1',
                'image' => 'nullable|string'
            ]);

            // If name_en is updated but key_name isn't, auto-update key_name
            if ($request->filled('name_en') && !$request->filled('key_name')) {
                $validated['key_name'] = Str::slug($request->input('name_en'), '-');
                
                // Handle duplicate slugs
                $counter = 1;
                $original = $validated['key_name'];
                while (Services::where('key_name', $validated['key_name'])
                    ->where('id', '!=', $id)->exists()) {
                    $validated['key_name'] = "{$original}-{$counter}";
                    $counter++;
                }
            }

            // Remove null values from update
            $validated = array_filter($validated, function ($value) {
                return $value !== null;
            });

            $service->update($validated);

            Log::info('Service updated', [
                'service_id' => $service->id,
                'updated_fields' => array_keys($validated)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Service updated successfully',
                'data' => $this->formatServiceResponse($service)
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Service not found'
            ], 404);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Failed to update service', [
                'service_id' => $id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update service',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ========================================================================
     * DELETE /api/admin/services/{id}
     * ========================================================================
     * Soft delete a service (preserves historical data)
     * 
     * What is Soft Delete?
     * - Service is marked as deleted (deleted_at timestamp set)
     * - Data remains in database (not physically removed)
     * - Old orders still reference this service correctly
     * - Service no longer appears in frontend listings
     * 
     * Why use Soft Delete?
     * - Historical data preservation for reporting
     * - Referential integrity (FK constraints still work)
     * - Ability to recover deleted services
     * - Compliance with data retention policies
     * 
     * Database Migration Required:
     * $table->softDeletes(); // Adds 'deleted_at' column
     * 
     * Response (200 OK):
     * {
     *   "success": true,
     *   "message": "Service deleted successfully"
     * }
     * 
     * Error (404 Not Found):
     * {
     *   "success": false,
     *   "message": "Service not found"
     * }
     */
    public function destroy($id)
    {
        try {
            $service = Services::findOrFail($id);

            Log::info('Service deleted', [
                'service_id' => $service->id,
                'name_en' => $service->name_en
            ]);

            $service->delete(); // Soft delete

            return response()->json([
                'success' => true,
                'message' => 'Service deleted successfully'
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Service not found'
            ], 404);

        } catch (\Exception $e) {
            Log::error('Failed to delete service', [
                'service_id' => $id,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete service',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ========================================================================
     * HELPER METHOD: Format Service Response
     * ========================================================================
     * Converts database record to frontend-ready JSON format
     * 
     * Ensures:
     * - All IDs are strings (app stability)
     * - Consistent boolean values
     * - Proper date formatting
     * - Null handling for optional fields
     */
    private function formatServiceResponse($service)
    {
        return [
            'id' => (string) $service->id,
            'key_name' => $service->key_name,
            'name_en' => $service->name_en,
            'name_ar' => $service->name_ar,
            'description_en' => $service->description_en ?? null,
            'description_ar' => $service->description_ar ?? null,
            'image' => $service->image ?? null,
            'status' => (string) ($service->status ?? 1),
            'role_id' => $service->role_id ? (string) $service->role_id : null,
            'created_at' => $service->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $service->updated_at->format('Y-m-d H:i:s'),
        ];
    }
}
