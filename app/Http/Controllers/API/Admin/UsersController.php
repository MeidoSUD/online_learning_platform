<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\API\UserController;
use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Booking;
use App\Models\Sessions;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\Orders;
use App\Models\Course;
use App\Models\WalletTransaction;
use App\Models\Payout;
use App\Models\Review;
use App\Models\Complaint;
use App\Models\Dispute;
use App\Models\Enrollment;
use Illuminate\Support\Facades\Hash;

class UsersController extends Controller
{
    public function index(Request $request)
    {
        $q = User::query()->select(['id','first_name','last_name','email','created_at','phone_number','gender','role_id','is_active','nationality']);
        if ($request->filled('role_id')) $q->where('role_id', $request->role_id);

        // Filter by is_active if provided (accepts true/false or 1/0)
        if ($request->has('is_active')) {
            $isActive = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if (!is_null($isActive)) {
                $q->where('is_active', $isActive);
            }
        }

        // Filter by verified status via the related profile
        if ($request->has('verified')) {
            $verified = filter_var($request->verified, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if (!is_null($verified)) {
                $q->whereHas('profile', function ($query) use ($verified) {
                    $query->where('verified', $verified);
                });
            }
        }

        // Eager-load attachments and profile but only the ones that matter for the admin table (profile_photo, certificate)
        $q->with(['attachments' => function ($query) {
            $query->whereIn('attached_to_type', ['profile_picture', 'certificate'])
                ->select(['id','user_id','file_path','file_name','attached_to_type','attached_to_id']);
        }]);

        // Also eager-load profile to avoid N+1 when checking verified
        $q->with('profile');

        $paginated = $q->orderBy('id', 'desc')->paginate(25);

        // Transform the paginator collection to include profile_photo and certificate urls
        $paginated->getCollection()->transform(function ($user) {
            $profilePhoto = null;
            $certificate = null;

            if ($user->attachments) {
                $pp = $user->attachments->firstWhere('attached_to_type', 'profile_picture');
                $cert = $user->attachments->firstWhere('attached_to_type', 'certificate');
                $profilePhoto = $pp->file_path ?? null;
                $certificate = $cert->file_path ?? null;
            }

            return [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'gender' => $user->gender,
                'role_id' => $user->role_id,
                'nationality'=> $user->nationality,
                'is_active' => $user->is_active,
                'verified' => $user->profile->verified ?? false,
                'profile_photo' => $profilePhoto,
                'certificate' => $certificate,
                'created_at' => $user->created_at
            ];
        });

        return response()->json(['success' => true, 'data' => $paginated]);
    }

    public function teachers(Request $request)
    {
        $teacherRole = Role::where('name_key', 'teacher')->first();
        $q = User::query()->select(['id','first_name','last_name','email','phone_number','gender','role_id','is_active']);
        $q->where('role_id', $teacherRole->id);

        // Eager-load attachments and teacherServices with service
        $q->with([
            'attachments' => function ($query) {
                $query->whereIn('attached_to_type', ['profile_picture', 'certificate'])
                    ->select(['id','user_id','file_path','file_name','attached_to_type','attached_to_id']);
            },
            'teacherServices.service'
        ]);

        $paginated = $q->orderBy('id', 'desc')->paginate(25);

        // Transform the paginator collection to include profile_photo, certificate, and services
        $paginated->getCollection()->transform(function ($user) {
            $profilePhoto = null;
            $certificate = null;
            $services = [];

            if ($user->attachments) {
                $pp = $user->attachments->firstWhere('attached_to_type', 'profile_picture');
                $cert = $user->attachments->firstWhere('attached_to_type', 'certificate');
                $profilePhoto = $pp->file_path ?? null;
                $certificate = $cert->file_path ?? null;
            }

            if ($user->teacherServices) {
                foreach ($user->teacherServices as $ts) {
                    if ($ts->service) {
                        $services[] = [
                            'id' => $ts->service->id,
                            'key_name' => $ts->service->key_name ?? null,
                            'name_ar' => $ts->service->name_ar ?? null,
                            'name_en' => $ts->service->name_en ?? null,
                            'description_ar' => $ts->service->description_ar ?? null,
                            'description_en' => $ts->service->description_en ?? null,
                            'image' => $ts->service->image ?? null,
                            'status' => $ts->service->status ?? null,
                        ];
                    }
                }
            }

            return [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'gender' => $user->gender,
                'role_id' => $user->role_id,
                'is_active' => $user->is_active,
                'verified' => $user->profile->verified ?? false,
                'profile_photo' => $profilePhoto,
                'certificate' => $certificate,
                'services' => $services,
            ];
        });

        return response()->json(['success' => true, 'data' => $paginated]);
    }

    public function teacherDetails(Request $request, $id)
    {
        
        $user = User::with('profile')->findOrFail($id);
        $userController = new UserController();
        $user = $userController->getFullTeacherData($user);
        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }


    public function show(Request $request, $id)
    {
        $user = User::with('profile')->findOrFail($id);
        return response()->json(['success' => true, 'data' => $user]);
    }

    public function profile(Request $request, $id)
    {
        $user = User::with([
            'profile',
            'attachments',
            'teacherInfo',
            'wallet',
            'teacherServices.service',
            'teacherSubjects.subject',
            'teacherLanguages.language',
            'teacherBankAccount',
            'supportTickets',
        ])->findOrFail($id);

        $bookingsAsStudent = Booking::where('student_id', $id)->with(['teacher', 'subject', 'service', 'sessions'])->orderByDesc('id')->get();
        $bookingsAsTeacher = Booking::where('teacher_id', $id)->with(['student', 'subject', 'service', 'sessions'])->orderByDesc('id')->get();

        $sessionsAsStudent = Sessions::where('student_id', $id)->with(['teacher', 'booking'])->orderByDesc('id')->get();
        $sessionsAsTeacher = Sessions::where('teacher_id', $id)->with(['student', 'subject', 'booking'])->orderByDesc('id')->get();

        $payments = Payment::where('student_id', $id)->with(['booking'])->orderByDesc('id')->get();

        $subscriptions = Subscription::where('student_id', $id)->with(['package', 'payment'])->orderByDesc('id')->get();

        $orders = Orders::where('user_id', $id)->with(['subject', 'applications'])->orderByDesc('id')->get();

        $courses = Course::where('teacher_id', $id)->with(['category'])->orderByDesc('id')->get();

        $walletTransactions = [];
        if ($user->wallet) {
            $walletTransactions = WalletTransaction::where('wallet_id', $user->wallet->id)->orderByDesc('id')->get();
        }

        $payouts = Payout::where('teacher_id', $id)->with(['paymentMethod'])->orderByDesc('id')->get();

        $reviewsGiven = Review::where('reviewer_id', $id)->with(['reviewedUser', 'course'])->orderByDesc('id')->get();
        $reviewsReceived = Review::where('reviewed_id', $id)->with(['reviewer', 'course'])->orderByDesc('id')->get();

        $complaintsAsStudent = Complaint::where('student_id', $id)->with(['session', 'teacher'])->orderByDesc('id')->get();
        $complaintsAsTeacher = Complaint::where('teacher_id', $id)->with(['session', 'student'])->orderByDesc('id')->get();

        $disputes = Dispute::where('raised_by', $id)->orWhere('against_user_id', $id)->with(['booking', 'payment'])->orderByDesc('id')->get();

        $enrollments = Enrollment::where('student_id', $id)->with(['course'])->orderByDesc('id')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'bookings_as_student' => $bookingsAsStudent,
                'bookings_as_teacher' => $bookingsAsTeacher,
                'sessions_as_student' => $sessionsAsStudent,
                'sessions_as_teacher' => $sessionsAsTeacher,
                'payments' => $payments,
                'subscriptions' => $subscriptions,
                'orders' => $orders,
                'courses' => $courses,
                'wallet' => $user->wallet,
                'wallet_transactions' => $walletTransactions,
                'payouts' => $payouts,
                'reviews_given' => $reviewsGiven,
                'reviews_received' => $reviewsReceived,
                'complaints_as_student' => $complaintsAsStudent,
                'complaints_as_teacher' => $complaintsAsTeacher,
                'disputes' => $disputes,
                'enrollments' => $enrollments,
                'support_tickets' => $user->supportTickets,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'phone_number' => 'required|string',
            'gender' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role_id' => 'nullable|integer',
            'nationality'=> 'nullable|string'
        ]);

        $data['password'] = Hash::make($data['password']);
        $user = User::create($data);

        return response()->json(['success' => true, 'data' => $user], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $data = $request->only(['first_name','last_name','gender','email','phone_number','role_id','is_active','nationality']);
        if ($request->filled('password')) $data['password'] = Hash::make($request->password);
        $user->update(array_filter($data, function($v){ return $v !== null; }));
        return response()->json(['success' => true, 'data' => $user]);
    }

    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['success' => true]);
    }

    public function resetPassword(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $new = substr(bin2hex(random_bytes(4)),0,8);
        $user->password = Hash::make($new);
        $user->save();
        return response()->json(['success' => true, 'new_password' => $new]);
    }

    public function verifyTeacher(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $profile = UserProfile::firstOrCreate(['user_id' => $user->id]);
        $profile->verified = $request->verified;
        $profile->save();
        return response()->json(['success' => true, 'message' => 'Teacher verified']);
    }

    public function suspend(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => false]);
        return response()->json(['success' => true]);
    }

    public function activate(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => true]);
        return response()->json(['success' => true]);
    }
}
