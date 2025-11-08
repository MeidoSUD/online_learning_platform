<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\EducationLevel;
use App\Models\ClassModel as Classes;
use App\Models\Subject;
use App\Models\TeacherSubject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TeacherSubjectController extends Controller
{
    /**
     * Display a listing of the teacher's subjects.
     */
    public function index()
{
    $subjects = TeacherSubject::where('teacher_id', Auth::id())
        ->with([
            'subject.educationLevel:id,name_en,name_ar',
            'subject.class:id,name_en,name_ar',
            'subject:id,name_en,name_ar,education_level_id,class_id'
        ])
        ->get();

    return view('teacher.subjects.index', compact('subjects'));
}

    /**
     * Show the form for creating a new subject assignment.
     */
    public function create()
    {
        $educationLevels = EducationLevel::all();
        return view('teacher.subjects.create', compact('educationLevels'));
    }

    /**
     * Store a newly created subject assignment.
     */
    public function store(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
        ]);

        // Check if teacher already has this subject assignment
        $exists = TeacherSubject::where('teacher_id', Auth::id())
            ->where('subject_id', $request->subject_id)
            ->exists();

        if ($exists) {
            return back()->with('error', app()->getLocale() == 'ar' 
                ? 'هذه المادة مضافة بالفعل' 
                : 'This subject is already assigned to you');
        }

        TeacherSubject::create([
            'teacher_id' => Auth::id(),
            'subject_id' => $request->subject_id,
        ]);

        return redirect()->route('teacher.subjects.index')
            ->with('success', app()->getLocale() == 'ar' 
                ? 'تمت إضافة المادة بنجاح' 
                : 'Subject added successfully');
    }

    /**
     * Show the form for editing the specified subject assignment.
     */
    public function edit($id)
    {
        $teacherSubject = TeacherSubject::where('teacher_id', Auth::id())
            ->findOrFail($id);
        
        $educationLevels = EducationLevel::all();
        $classes = Classes::where('education_level_id', $teacherSubject->education_level_id)->get();
        $subjects = Subject::where('class_id', $teacherSubject->class_id)->get();

        return view('teacher.subjects.edit', compact('teacherSubject', 'educationLevels', 'classes', 'subjects'));
    }

    /**
     * Update the specified subject assignment.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
        ]);

        $teacherSubject = TeacherSubject::where('teacher_id', Auth::id())
            ->findOrFail($id);

        // Check for duplicates (excluding current record)
        $exists = TeacherSubject::where('teacher_id', Auth::id())
            ->where('subject_id', $request->subject_id)
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            return back()->with('error', app()->getLocale() == 'ar' 
                ? 'هذه المادة مضافة بالفعل' 
                : 'This subject is already assigned to you');
        }

        $teacherSubject->update([
            'subject_id' => $request->subject_id,
        ]);

        return redirect()->route('teacher.subjects.index')
            ->with('success', app()->getLocale() == 'ar' 
                ? 'تم تحديث المادة بنجاح' 
                : 'Subject updated successfully');
    }

    /**
     * Remove the specified subject assignment.
     */
    public function destroy($id)
    {
        $teacherSubject = TeacherSubject::where('teacher_id', Auth::id())
            ->findOrFail($id);
        
        $teacherSubject->delete();

        return redirect()->route('teacher.subjects.index')
            ->with('success', app()->getLocale() == 'ar' 
                ? 'تم حذف المادة بنجاح' 
                : 'Subject removed successfully');
    }

    /**
     * AJAX: Get classes based on education level.
     */
    public function getClasses(Request $request)
    {
        $classes = Classes::where('education_level_id', $request->education_level_id)
            ->select('id', 'name_en', 'name_ar')
            ->get();

        return response()->json($classes);
    }

    /**
     * AJAX: Get subjects based on class.
     */
    public function getSubjects(Request $request)
    {
        $subjects = Subject::where('class_id', $request->class_id)
            ->select('id', 'name_en', 'name_ar')
            ->get();

        return response()->json($subjects);
    }
}