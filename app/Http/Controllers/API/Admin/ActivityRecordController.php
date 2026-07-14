<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ActivityRecordController extends Controller
{
    public function stats()
    {
        $total = ActivityRecord::count();
        $today = ActivityRecord::whereDate('created_at', today())->count();
        $thisWeek = ActivityRecord::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count();
        $thisMonth = ActivityRecord::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        $uniqueUsers = ActivityRecord::whereNotNull('user_id')->distinct('user_id')->count('user_id');
        $uniqueTeachers = ActivityRecord::whereNotNull('teacher_id')->distinct('teacher_id')->count('teacher_id');
        $categories = ActivityRecord::whereNotNull('category')->distinct('category')->count('category');

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'today' => $today,
                'this_week' => $thisWeek,
                'this_month' => $thisMonth,
                'unique_users' => $uniqueUsers,
                'unique_teachers' => $uniqueTeachers,
                'categories' => $categories,
            ],
        ]);
    }

    public function groupedStats()
    {
        $users = ActivityRecord::whereNotNull('user_id')
            ->selectRaw('user_id, count(*) as total')
            ->with('user:id,first_name,last_name')
            ->groupBy('user_id')
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => [
                'id' => $r->user_id,
                'name' => $r->user ? $r->user->first_name . ' ' . $r->user->last_name : '—',
                'total' => (int) $r->total,
            ]);

        $services = ActivityRecord::whereNotNull('service_id')
            ->selectRaw('service_id, count(*) as total')
            ->with('service:id,name_en,name_ar')
            ->groupBy('service_id')
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => [
                'id' => $r->service_id,
                'name' => $r->service ? ($r->service->name_en ?? '—') : '—',
                'name_ar' => $r->service ? ($r->service->name_ar ?? '—') : '—',
                'total' => (int) $r->total,
            ]);

        $subjects = ActivityRecord::whereNotNull('subject_id')
            ->selectRaw('subject_id, count(*) as total')
            ->with('subject:id,name_en,name_ar')
            ->groupBy('subject_id')
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => [
                'id' => $r->subject_id,
                'name' => $r->subject ? ($r->subject->name_en ?? '—') : '—',
                'name_ar' => $r->subject ? ($r->subject->name_ar ?? '—') : '—',
                'total' => (int) $r->total,
            ]);

        $teachers = ActivityRecord::whereNotNull('teacher_id')
            ->selectRaw('teacher_id, count(*) as total')
            ->with('teacher:id,first_name,last_name')
            ->groupBy('teacher_id')
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => [
                'id' => $r->teacher_id,
                'name' => $r->teacher ? $r->teacher->first_name . ' ' . $r->teacher->last_name : '—',
                'total' => (int) $r->total,
            ]);

        $languages = ActivityRecord::whereNotNull('language_id')
            ->selectRaw('language_id, count(*) as total')
            ->with('language:id,name_en,name_ar')
            ->groupBy('language_id')
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => [
                'id' => $r->language_id,
                'name' => $r->language ? ($r->language->name_en ?? '—') : '—',
                'name_ar' => $r->language ? ($r->language->name_ar ?? '—') : '—',
                'total' => (int) $r->total,
            ]);

        $courses = ActivityRecord::whereNotNull('course_id')
            ->selectRaw('course_id, count(*) as total')
            ->with('course:id,name_en,name_ar')
            ->groupBy('course_id')
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => [
                'id' => $r->course_id,
                'name' => $r->course ? ($r->course->name_en ?? '—') : '—',
                'name_ar' => $r->course ? ($r->course->name_ar ?? '—') : '—',
                'total' => (int) $r->total,
            ]);

        $sessionTypes = ActivityRecord::whereNotNull('session_type')
            ->selectRaw('session_type, count(*) as total')
            ->groupBy('session_type')
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => [
                'name' => $r->session_type,
                'total' => (int) $r->total,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'users' => $users,
                'services' => $services,
                'subjects' => $subjects,
                'teachers' => $teachers,
                'languages' => $languages,
                'courses' => $courses,
                'session_types' => $sessionTypes,
            ],
        ]);
    }

    public function index(Request $request)
    {
        $query = ActivityRecord::query()
            ->with(['user', 'teacher', 'booking', 'service', 'subject', 'language', 'course']);

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%");
            });
        }

        $query->latest();

        $records = $query->paginate($request->get('per_page', 10));

        return response()->json([
            'success' => true,
            'data' => $records->items(),
            'meta' => [
                'current_page' => $records->currentPage(),
                'last_page' => $records->lastPage(),
                'per_page' => $records->perPage(),
                'total' => $records->total(),
            ],
        ]);
    }

    public function show($id)
    {
        $record = ActivityRecord::with(['user', 'teacher', 'booking', 'service', 'subject', 'language', 'course'])
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $record]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'user_id' => 'nullable|exists:users,id',
            'booking_id' => 'nullable|exists:bookings,id',
            'service_id' => 'nullable|exists:services,id',
            'subject_id' => 'nullable|exists:subjects,id',
            'teacher_id' => 'nullable|exists:users,id',
            'language_id' => 'nullable|exists:languages,id',
            'course_id' => 'nullable|exists:courses,id',
            'session_type' => 'nullable|string|max:50',
            'sessions_count' => 'nullable|integer|min:0',
            'data' => 'nullable|json',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $record = ActivityRecord::create([
            'title' => $request->title,
            'category' => $request->category,
            'user_id' => $request->user_id,
            'booking_id' => $request->booking_id,
            'service_id' => $request->service_id,
            'subject_id' => $request->subject_id,
            'teacher_id' => $request->teacher_id,
            'language_id' => $request->language_id,
            'course_id' => $request->course_id,
            'session_type' => $request->session_type,
            'sessions_count' => $request->sessions_count,
            'data' => $request->data ? json_decode($request->data, true) : [],
        ]);

        $record->load(['user', 'teacher', 'booking', 'service', 'subject', 'language', 'course']);

        return response()->json(['success' => true, 'data' => $record, 'message' => 'Activity record created'], 201);
    }

    public function update(Request $request, $id)
    {
        $record = ActivityRecord::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'user_id' => 'nullable|exists:users,id',
            'booking_id' => 'nullable|exists:bookings,id',
            'service_id' => 'nullable|exists:services,id',
            'subject_id' => 'nullable|exists:subjects,id',
            'teacher_id' => 'nullable|exists:users,id',
            'language_id' => 'nullable|exists:languages,id',
            'course_id' => 'nullable|exists:courses,id',
            'session_type' => 'nullable|string|max:50',
            'sessions_count' => 'nullable|integer|min:0',
            'data' => 'nullable|json',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $record->update([
            'title' => $request->title,
            'category' => $request->category,
            'user_id' => $request->user_id,
            'booking_id' => $request->booking_id,
            'service_id' => $request->service_id,
            'subject_id' => $request->subject_id,
            'teacher_id' => $request->teacher_id,
            'language_id' => $request->language_id,
            'course_id' => $request->course_id,
            'session_type' => $request->session_type,
            'sessions_count' => $request->sessions_count,
            'data' => $request->data ? json_decode($request->data, true) : [],
        ]);

        $record->load(['user', 'teacher', 'booking', 'service', 'subject', 'language', 'course']);

        return response()->json(['success' => true, 'data' => $record, 'message' => 'Activity record updated']);
    }

    public function destroy($id)
    {
        ActivityRecord::findOrFail($id)->delete();

        return response()->json(['success' => true, 'message' => 'Activity record deleted']);
    }

    public function clear()
    {
        ActivityRecord::truncate();

        return response()->json(['success' => true, 'message' => 'All activity records cleared']);
    }
}
