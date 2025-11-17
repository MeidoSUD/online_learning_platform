<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Course;
use App\Models\Services;
use App\Models\Subject;
use App\Models\Enrollment;
use App\Models\TeacherServices;

class StudentCourseController extends Controller
{
    /**
     * List all courses with filters
     */
    public function index(Request $request)
    {
        $query = Course::with(['teacher', 'teacher.profile.profilePhoto'])
            ->where('status', 'published');

        // Filter by service
        if ($request->has('service_id') && $request->service_id) {
            $query->where('service_id', $request->service_id);
        }

        // Filter by subject
        if ($request->has('subject_id') && $request->subject_id) {
            $query->where('subject_id', $request->subject_id);
        }

        // Filter by price
        if ($request->has('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }
        if ($request->has('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'latest');
        switch ($sortBy) {
            case 'price_low':
                $query->orderBy('price', 'asc');
                break;
            case 'price_high':
                $query->orderBy('price', 'desc');
                break;
            case 'popular':
                $query->orderBy('students_count', 'desc');
                break;
            case 'latest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $courses = $query->paginate(12);

        $services = Services::where('status', 1)->get();
        $subjects = Subject::where('status', 1)->get();

        return view('student.courses.index', compact('courses', 'services', 'subjects'));
    }

    /**
     * Show course details
     */
    public function show($id)
    {
        $course = Course::with([
            'teacher',
            'teacher.profile.profilePhoto',
            'teacher.reviews',
            'courseLessons',
            'enrollments',
        ])->findOrFail($id);

        return view('student.courses.show', compact('course'));
    }

    public function language(Request $request)
    {
        // list of teachers with language service
        $query = TeacherServices::with(['teacher', 'teacher.profile.profilePhoto'])
            ->where('service_id', Services::where('name_en', 'Language Study')->first()->id);

        // Filter by service
        if ($request->has('service_id') && $request->service_id) {
            $query->where('service_id', $request->service_id);
        }

        // Filter by subject
        if ($request->has('subject_id') && $request->subject_id) {
            $query->where('subject_id', $request->subject_id);
        }

        // Filter by price
        if ($request->has('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }
        if ($request->has('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'latest');
        switch ($sortBy) {
            case 'price_low':
                $query->orderBy('price', 'asc');
                break;
            case 'price_high':
                $query->orderBy('price', 'desc');
                break;
            case 'popular':
                $query->orderBy('students_count', 'desc');
                break;
            case 'latest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $languages = $query->paginate(12);
        $title = ['en' => 'Language Study', 'ar' => 'دراسة اللغة'];
        $services = Services::where('status', 1)->get();
        $subjects = Subject::where('status', 1)->get();

        return view('student.courses.index', compact('languages', 'services', 'subjects', 'title'));
    }

    public function languageShow($id)
    {
        $language = TeacherServices::with([
            'teacher',
            'teacher.profile.profilePhoto',
            'teacher.reviews',
            'teacher.courseLessons',
            'teacher.enrollments',
        ])->findOrFail($id);

        return view('student.courses.show', compact('language'));
    }   
}
        