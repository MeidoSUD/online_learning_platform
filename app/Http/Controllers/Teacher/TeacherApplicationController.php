<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Orders;
use App\Models\TeacherInfo;
use App\Models\TeachersApplications;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherApplicationController extends Controller
{
    public function browseOrders(Request $request): JsonResponse
    {
        $teacherId = $request->user()->id;
        
        $query = Orders::with(['subject', 'student', 'availableSlots'])
            ->where('status', 'pending');

        $query->whereIn('subject_id', function($subQuery) use ($teacherId) {
            $subQuery->select('subject_id')
                ->from('teacher_subjects')
                ->where('teacher_id', $teacherId);
        });

        $query->whereIn('class_id', function($subQuery) use ($teacherId) {
            $subQuery->select('class_id')
                ->from('teacher_teach_classes')
                ->where('teacher_id', $teacherId);
        });

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->input('subject_id'));
        }

        if ($request->has('education_level_id')) {
            $query->where('education_level_id', $request->input('education_level_id'));
        }

        if ($request->has('class_id')) {
            $query->where('class_id', $request->input('class_id'));
        }

        if ($request->has('min_price')) {
            $query->where('max_price', '>=', $request->input('min_price'));
        }

        if ($request->has('max_price')) {
            $query->where('min_price', '<=', $request->input('max_price'));
        }

        $query->whereDoesntHave('applications', function($q) use ($teacherId) {
            $q->where('teacher_id', $teacherId);
        });

        $orders = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $orders->items(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'total_pages' => $orders->lastPage(),
                'total_items' => $orders->total(),
                'per_page' => $orders->perPage()
            ]
        ]);
    }

    // Teacher: Apply for order
    public function apply(Request $request, int $order_id): JsonResponse
{
    $request->validate([
        'message' => 'nullable|string|max:500',
    ]);

    $user = $request->user();

    $order = Orders::where('status', 'pending')->findOrFail($order_id);

    // Check if already applied
    $existingApplication = TeachersApplications::where('order_id', $order_id)
        ->where('teacher_id', $user->id)
        ->first();

    if ($existingApplication) {
        return response()->json([
            'success' => false,
            'message' => 'You have already applied for this order'
        ], 400);
    }

    // Fetch teacher price from teacher_info table
    $teacherInfo = TeacherInfo::where('teacher_id', $user->id)->first();

    if (!$teacherInfo) {
        return response()->json([
            'success' => false,
            'message' => 'Teacher pricing info not found'
        ], 400);
    }

    // Determine which price to use
    $proposedPrice = null;

    if ($order->type === 'single') {
        $proposedPrice = $teacherInfo->individual_hour_price;
    } elseif ($order->type === 'group') {
        $proposedPrice = $teacherInfo->group_hour_price;
    } else {
        return response()->json([
            'success' => false,
            'message' => 'Invalid order type'
        ], 400);
    }

    // Optional: Validate price is within student's budget
    if ($order->min_price && $proposedPrice < $order->min_price) {
        return response()->json([
            'success' => false,
            'message' => 'Your price is below the student\'s minimum budget'
        ], 400);
    }

    if ($order->max_price && $proposedPrice > $order->max_price) {
        return response()->json([
            'success' => false,
            'message' => 'Your price exceeds the student\'s maximum budget'
        ], 400);
    }

    $application = TeachersApplications::create([
        'order_id' => $order_id,
        'teacher_id' => $user->id,
        'proposed_price' => $proposedPrice,
        'message' => $request->input('message'),
        'status' => 'pending'
    ]);

    // TODO: Notify student about new application
    // NotificationHelper::newApplication($order->student, $application);

    return response()->json([
        'success' => true,
        'message' => 'Application submitted successfully',
        'data' => $application
    ], 200);
}


    // Teacher: Get my applications
    public function myApplications(Request $request): JsonResponse
    {
        $applications = TeachersApplications::with(['order.subject', 'order.student'])
            ->where('teacher_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $applications
        ]);
    }

    // Teacher: Cancel application
    public function cancelApplication(Request $request, int $application_id): JsonResponse
    {
        $application = TeachersApplications::where('teacher_id', $request->user()->id)
            ->where('status', 'pending')
            ->findOrFail($application_id);

        $application->delete();

        return response()->json([
            'success' => true,
            'message' => 'Application cancelled successfully'
        ]);
    }
}