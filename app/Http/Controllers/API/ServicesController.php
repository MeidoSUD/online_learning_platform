<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Subject;
use App\Models\TeacherServices;
use App\Models\Attachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ServicesController extends Controller
{

    public function listServices()
    {
        $services = \App\Models\Services::where('status', 1)->get(['key_name', 'name_en', 'name_ar', 'description_en', 'description_ar', 'id']);
        return response()->json($services);
    }

    public function studentIndex()
    {
        //
        $services = \App\Models\Services::where('status', 1)
            ->where('role_id', 4)
            ->get();
        return response()->json($services);
    }

    /**
     * Get subjects by service ID
     */
    public function getSubjectsByService($serviceId): JsonResponse
    {
        $subjects = Subject::select('id', 'name_en', 'name_ar')
            ->where('service_id', $serviceId)
            ->where('status', true)
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $subjects
        ]);
    }

    public function teacherIndex()
    {
        //
        $services = \App\Models\Services::where('status', 1)
            ->where('role_id', 3)
            ->get();
        return response()->json($services);
    }

    public function listSubjects($serviceId)
    {
        $subjects = Subject::where('service_id', $serviceId)
            ->where('status', 1)
            ->get(['id', 'name_en', 'name_ar']);
        return response()->json($subjects);
    }

    public function subjectDetails($id)
    {
        $subject = Subject::with('service')->find($id);
        if (!$subject) {
            return response()->json(['message' => 'Subject not found'], 404);
        }
        return response()->json($subject);
    }

    public function getAllSubjects()
    {
        $subjects = Subject::where('status', 1)
            ->get(['id', 'name_en', 'name_ar', 'class_id', 'education_level_id']);

        // Wrap in array to match repository expectation (List<List<Subject>>)
        return response()->json([$subjects]);
    }

    /**
     * GET /api/teacher/get-services
     * Get all services available for a teacher
     * 
     * @return JsonResponse
     */
    public function teacherServices(): JsonResponse
    {
        try {
            $teacher = auth()->user();

            // Get teacher's current services
            $teacherServices = TeacherServices::where('teacher_id', $teacher->id)
                ->with('service')
                ->get()
                ->pluck('service');

            // Get all available services for teachers
            $allServices = \App\Models\Services::where('status', 1)
                ->where('role_id', 3)
                ->get(['id', 'name_en', 'name_ar', 'description_en', 'description_ar']);

            return response()->json([
                'success' => true,
                'data' => [
                    'current_services' => $teacherServices,
                    'all_services' => $allServices,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch teacher services', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch services',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/teacher/teacher-service
     * Add or update a service for the teacher
     * 
     * Request body:
     * {
     *   "service_id": 1,          // Required - ID of service to add
     *   "languages": [1, 2, 3],   // Optional - Language IDs (for language_study service)
     *   "subjects": [1, 2],       // Optional - Subject IDs (for language_study service)
     *   "price": 50.00            // Optional - Price per hour for this service
     * }
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function addTeacherService(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'service_id' => 'required|integer|exists:services,id',
            ]);

            $teacher = auth()->user();
            $serviceId = $request->service_id;

            // Check if teacher already has this service
            $existingService = TeacherServices::where('teacher_id', $teacher->id)
                ->where('service_id', $serviceId)
                ->first();

            if ($existingService) {
                return response()->json([
                    'success' => false,
                    'message' => 'You already have this service added',
                    'error' => 'SERVICE_ALREADY_EXISTS'
                ], 409);
            }

            DB::beginTransaction();

            try {
                // Add service to teacher
                $teacherService = TeacherServices::create([
                    'teacher_id' => $teacher->id,
                    'service_id' => $serviceId,
                ]);

                Log::info('Teacher service added', [
                    'teacher_id' => $teacher->id,
                    'service_id' => $serviceId,
                ]);

                // Get service details
                $service = \App\Models\Services::find($serviceId);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => "Service '{$service->name_en}' added successfully",
                    'data' => [
                        'id' => $teacherService->id,
                        'service_id' => $serviceId,
                        'service' => [
                            'id' => $service->id,
                            'name_en' => $service->name_en,
                            'name_ar' => $service->name_ar,
                            'key_name' => $service->key_name ?? null,
                        ]
                    ]
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to add teacher service', [
                'teacher_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to add service',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/teacher/teacher-upload-certificate
     * Upload a certificate for the teacher
     * 
     * Request body (multipart/form-data):
     * {
     *   "certificate": File,      // Required - PDF or image file
     *   "title": "String",        // Optional - Certificate title
     *   "issuer": "String",       // Optional - Issuing organization
     *   "issue_date": "2026-01-15", // Optional - Date certificate was issued
     * }
     * 
     * Accepted file types: PDF, JPG, PNG, JPEG
     * Max file size: 5MB
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function uploadTeacherCertificate(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'certificate' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            ]);

            $teacher = auth()->user();

            DB::beginTransaction();

            try {
                $file = $request->file('certificate');
                $originalName = $file->getClientOriginalName();
                $fileName = time() . '_' . $originalName;
                
                // Store file in public storage
                $path = $file->storeAs('certificates', $fileName, 'public');

                if (!$path) {
                    throw new \Exception('Failed to store certificate file');
                }

                // Create attachment record
                $attachment = Attachment::create([
                    'user_id' => $teacher->id,
                    'file_path' => $path,
                    'file_name' => $fileName,
                    'file_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                    'attached_to_type' => 'certificate',
                ]);

                Log::info('Teacher certificate uploaded', [
                    'teacher_id' => $teacher->id,
                    'attachment_id' => $attachment->id,
                    'file_name' => $fileName,
                    'file_size' => $file->getSize(),
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Certificate uploaded successfully',
                    'data' => [
                        'id' => $attachment->id,
                        'file_name' => $attachment->file_name,
                        'file_path' => $path,
                        'url' => asset('storage/' . $path),
                        'file_size' => $attachment->file_size,
                        'uploaded_at' => $attachment->created_at->format('Y-m-d H:i:s'),
                    ]
                ], 201);

            } catch (\Exception $e) {
                DB::rollBack();
                
                // Clean up file if upload was partially successful
                if (isset($path)) {
                    Storage::disk('public')->delete($path);
                }
                
                throw $e;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to upload certificate', [
                'teacher_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload certificate',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

