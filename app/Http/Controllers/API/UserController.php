<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\User\TeacherProfileService;
use App\Services\User\UserProfileService;
use App\Services\User\UserAttachmentService;
use App\Services\User\TeacherManagementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    protected TeacherProfileService $teacherProfileService;
    protected UserProfileService $userProfileService;
    protected UserAttachmentService $attachmentService;
    protected TeacherManagementService $teacherManagementService;

    public function __construct(
        ?TeacherProfileService $teacherProfileService = null,
        ?UserProfileService $userProfileService = null,
        ?UserAttachmentService $attachmentService = null,
        ?TeacherManagementService $teacherManagementService = null
    ) {
        $this->teacherProfileService = $teacherProfileService ?? app(TeacherProfileService::class);
        $this->userProfileService = $userProfileService ?? app(UserProfileService::class);
        $this->attachmentService = $attachmentService ?? app(UserAttachmentService::class);
        $this->teacherManagementService = $teacherManagementService ?? app(TeacherManagementService::class);
    }

    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => User::all()
        ]);
    }

    public function educationLevels()
    {
        $levels = DB::table('education_levels')
            ->select('id', 'name_en', 'name_ar')
            ->where('status', true)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $levels
        ]);
    }

    public function classes($education_level_id)
    {
        $classes = DB::table('classes')
            ->select('id', 'name_en', 'name_ar')
            ->where('education_level_id', $education_level_id)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $classes
        ]);
    }

    public function showProfile(Request $request)
    {
        $result = $this->userProfileService->showProfile($request);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function storeProfile(Request $request)
    {
        $request->validate([
            'role_id' => 'required|in:3,4',
            'profile_photo' => 'nullable|image|max:2048',
            'certificate' => 'nullable|mimes:pdf,doc,docx|max:5120',
            'resume' => 'nullable|mimes:pdf,doc,docx|max:5120',
            'language_pref' => 'nullable|string|max:255',
            'terms_accepted' => 'required|boolean|in:1',
            'bio' => 'nullable|string|max:1000',
            'education_level' => 'nullable|string|max:255',
            'class_id' => 'nullable|exists:classes,id',
            'subjects' => 'nullable|array',
            'email' => 'required|string|email|unique:users,email,' . $request->user()->id,
            'phone_number' => 'required|string|max:15|unique:users,phone_number,' . $request->user()->id,
        ]);

        $result = $this->userProfileService->storeProfile($request);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function updateProfile(Request $request)
    {
        $result = $this->userProfileService->updateProfile($request);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function deleteAttachment(Request $request, $id)
    {
        $result = $this->attachmentService->deleteAttachment($request, $id);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function listTeachers(Request $request)
    {
        $result = $this->teacherProfileService->listTeachers($request);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function teacherDetails($id)
    {
        $result = $this->teacherProfileService->teacherDetails($id);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function createOrUpdateTeacherInfo(Request $request)
    {
        $request->validate([
            'bio' => 'nullable|string|max:2000',
            'teach_individual' => 'required|boolean',
            'individual_hour_price' => 'nullable|numeric|min:0',
            'package_on_off' => 'nullable|boolean',
            'teach_group' => 'required|boolean',
            'group_hour_price' => 'nullable|numeric|min:0',
            'max_group_size' => 'nullable|integer|min:0|max:100',
            'min_group_size' => 'nullable|integer|min:0|max:100',
            'class_ids' => 'required|array',
            'class_ids.*' => 'exists:classes,id',
            'subject_ids' => 'required|array',
            'subject_ids.*' => 'exists:subjects,id',
        ]);

        $result = $this->teacherManagementService->createOrUpdateTeacherInfo($request, $request->user());
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function updateTeacherInfo(Request $request)
    {
        if ($request->hasAny(['teach_individual', 'teach_group', 'individual_hour_price', 'group_hour_price', 'max_group_size', 'min_group_size'])) {
            $request->validate([
                'bio' => 'nullable|string|max:2000',
                'teach_individual' => 'required|boolean',
                'package_on_off' => 'nullable|boolean',
                'individual_hour_price' => 'nullable|numeric|min:0',
                'teach_group' => 'required|boolean',
                'group_hour_price' => 'nullable|numeric|min:0',
                'max_group_size' => 'nullable|integer|min:0|max:100',
                'min_group_size' => 'nullable|integer|min:0|max:100',
            ]);

            $result = $this->teacherManagementService->updateTeacherInfo($request, $request->user());
            return response()->json($result, $result['status_code'] ?? 200);
        }

        return response()->json(['success' => false, 'message' => 'No teacher fields provided'], 422);
    }

    public function updateTeacherClasses(Request $request)
    {
        $request->validate([
            'class_ids' => 'required|array',
            'class_ids.*' => 'exists:classes,id',
        ]);

        $result = $this->teacherManagementService->updateTeacherClasses($request, $request->user());
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function updateTeacherServices(Request $request)
    {
        $result = $this->teacherManagementService->updateTeacherServices($request, $request->user());
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function updateTeacherSubjects(Request $request)
    {
        $request->validate([
            'subject_ids' => 'required|array',
            'subject_ids.*' => 'exists:subjects,id',
        ]);

        $result = $this->teacherManagementService->updateTeacherSubjects($request, $request->user());
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function deleteAccount(Request $request)
    {
        $result = $this->userProfileService->deleteAccount($request);
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function getFullTeacherData(User $teacher)
    {
        return $this->teacherProfileService->getFullTeacherData($teacher);
    }

    public function listCertificates(Request $request)
    {
        $result = $this->teacherManagementService->listCertificates($request->user());
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function updateActiveStatus(Request $request)
    {
        $request->validate([
            'is_active' => 'required|boolean',
        ]);

        $result = $this->teacherManagementService->updateActiveStatus($request, $request->user());
        return response()->json($result, $result['status_code'] ?? 200);
    }

    public function getActiveStatus(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'is_active' => $request->user()->is_active,
            ],
        ]);
    }
}
