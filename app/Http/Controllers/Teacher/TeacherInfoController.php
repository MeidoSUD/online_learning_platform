<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TeacherTeachClasses;
use App\Models\TeacherSubject;
use App\Models\TeacherInfo;
use App\Models\Subject;
use App\Models\ClassModel;
use Illuminate\Support\Facades\Auth;

class TeacherInfoController extends Controller
{
    // ============== SUBJECTS MANAGEMENT ==============
    
    /**
     * Display a listing of teacher subjects
     */
    public function indexSubjects()
    {
        $teacherId = Auth::id();
        $subjects = TeacherSubject::where('teacher_id', $teacherId)
            ->with('subject')
            ->paginate(10);

        return view('teacher.subjects.index', compact('subjects'));
    }

    /**
     * Show the form for creating a new subject
     */
    public function createSubject()
    {
        $teacherId = Auth::id();
        $allSubjects = Subject::all();
        
        // Get already assigned subjects to exclude them
        $assignedSubjectIds = TeacherSubject::where('teacher_id', $teacherId)
            ->pluck('subject_id')
            ->toArray();

        return view('teacher.subjects.create', compact('allSubjects', 'assignedSubjectIds'));
    }

    /**
     * Store newly created subjects
     */
    public function storeSubject(Request $request)
    {
        $request->validate([
            'subjects_id' => 'required|array|min:1',
            'subjects_id.*' => 'exists:subjects,id',
        ], [
            'subjects_id.required' => 'Please select at least one subject.',
            'subjects_id.*.exists' => 'One or more selected subjects are invalid.',
        ]);

        $teacherId = Auth::id();

        foreach ($request->subjects_id as $subjectId) {
            TeacherSubject::firstOrCreate([
                'teacher_id' => $teacherId,
                'subject_id' => $subjectId,
            ]);
        }

        return redirect()->route('teacher.subjects.index')
            ->with('success', 'Subjects assigned successfully!');
    }

    /**
     * Show the form for editing a subject
     */
    public function editSubject($id)
    {
        $teacherId = Auth::id();
        $teacherSubject = TeacherSubject::where('id', $id)
            ->where('teacher_id', $teacherId)
            ->with('subject')
            ->firstOrFail();
        
        $allSubjects = Subject::all();

        return view('teacher.subjects.edit', compact('teacherSubject', 'allSubjects'));
    }

    /**
     * Update the specified subject
     */
    public function updateSubject(Request $request, $id)
    {
        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
        ], [
            'subject_id.required' => 'Please select a subject.',
            'subject_id.exists' => 'The selected subject is invalid.',
        ]);

        $teacherId = Auth::id();
        $teacherSubject = TeacherSubject::where('id', $id)
            ->where('teacher_id', $teacherId)
            ->firstOrFail();

        $teacherSubject->update([
            'subject_id' => $request->subject_id,
        ]);

        return redirect()->route('teacher.subjects.index')
            ->with('success', 'Subject updated successfully!');
    }

    /**
     * Remove the specified subject
     */
    public function destroySubject($id)
    {
        $teacherId = Auth::id();
        $teacherSubject = TeacherSubject::where('id', $id)
            ->where('teacher_id', $teacherId)
            ->firstOrFail();
        
        $teacherSubject->delete();

        return redirect()->route('teacher.subjects.index')
            ->with('success', 'Subject removed successfully!');
    }

    // ============== CLASSES MANAGEMENT ==============

    /**
     * Display a listing of teacher classes
     */
    public function indexClasses()
    {
        $teacherId = Auth::id();
        $classes = TeacherTeachClasses::where('teacher_id', $teacherId)
            ->with('class')
            ->paginate(10);

        return view('teacher.classes.index', compact('classes'));
    }

    /**
     * Show the form for creating a new class
     */
    public function createClass()
    {
        $teacherId = Auth::id();
        $allClasses = ClassModel::all();
        
        // Get already assigned classes to exclude them
        $assignedClassIds = TeacherTeachClasses::where('teacher_id', $teacherId)
            ->pluck('class_id')
            ->toArray();

        return view('teacher.classes.create', compact('allClasses', 'assignedClassIds'));
    }

    /**
     * Store newly created classes
     */
    public function storeClass(Request $request)
    {
        $request->validate([
            'class_id' => 'required|array|min:1',
            'class_id.*' => 'exists:classes,id',
        ], [
            'class_id.required' => 'Please select at least one class.',
            'class_id.*.exists' => 'One or more selected classes are invalid.',
        ]);

        $teacherId = Auth::id();

        foreach ($request->class_id as $classId) {
            TeacherTeachClasses::firstOrCreate([
                'teacher_id' => $teacherId,
                'class_id' => $classId,
            ]);
        }

        return redirect()->route('teacher.classes.index')
            ->with('success', 'Classes assigned successfully!');
    }

    /**
     * Show the form for editing a class
     */
    public function editClass($id)
    {
        $teacherId = Auth::id();
        $teacherClass = TeacherTeachClasses::where('id', $id)
            ->where('teacher_id', $teacherId)
            ->with('class')
            ->firstOrFail();
        
        $allClasses = ClassModel::all();

        return view('teacher.classes.edit', compact('teacherClass', 'allClasses'));
    }

    /**
     * Update the specified class
     */
    public function updateClass(Request $request, $id)
    {
        $request->validate([
            'class_id' => 'required|exists:classes,id',
        ], [
            'class_id.required' => 'Please select a class.',
            'class_id.exists' => 'The selected class is invalid.',
        ]);

        $teacherId = Auth::id();
        $teacherClass = TeacherTeachClasses::where('id', $id)
            ->where('teacher_id', $teacherId)
            ->firstOrFail();

        $teacherClass->update([
            'class_id' => $request->class_id,
        ]);

        return redirect()->route('teacher.classes.index')
            ->with('success', 'Class updated successfully!');
    }

    /**
     * Remove the specified class
     */
    public function destroyClass($id)
    {
        $teacherId = Auth::id();
        $teacherClass = TeacherTeachClasses::where('id', $id)
            ->where('teacher_id', $teacherId)
            ->firstOrFail();
        
        $teacherClass->delete();

        return redirect()->route('teacher.classes.index')
            ->with('success', 'Class removed successfully!');
    }

    // ============== TEACHER INFO MANAGEMENT ==============

    /**
     * Show teacher profile/info
     */
    public function showInfo()
    {
        $teacherId = Auth::id();
        $teacherInfo = TeacherInfo::where('teacher_id', $teacherId)->first();

        return view('teacher.info.show', compact('teacherInfo'));
    }

    /**
     * Show the form for editing teacher info
     */
    public function editInfo()
    {
        $teacherId = Auth::id();
        $teacherInfo = TeacherInfo::firstOrCreate(
            ['teacher_id' => $teacherId],
            [
                'bio' => '',
                'teach_individual' => false,
                'teach_group' => false,
            ]
        );

        return view('teacher.info.edit', compact('teacherInfo'));
    }

    /**
     * Update teacher info
     */
    public function updateInfo(Request $request)
    {
        $teacherId = Auth::id();

        $request->validate([
            'bio' => 'nullable|string|max:1000',
            'teach_individual' => 'boolean',
            'individual_hour_price' => 'nullable|numeric|min:0|required_if:teach_individual,1',
            'teach_group' => 'boolean',
            'group_hour_price' => 'nullable|numeric|min:0|required_if:teach_group,1',
            'max_group_size' => 'nullable|integer|min:1|required_if:teach_group,1',
            'min_group_size' => 'nullable|integer|min:1|required_if:teach_group,1|lte:max_group_size',
        ], [
            'individual_hour_price.required_if' => 'Individual hour price is required when teaching individual sessions.',
            'group_hour_price.required_if' => 'Group hour price is required when teaching group sessions.',
            'max_group_size.required_if' => 'Maximum group size is required when teaching group sessions.',
            'min_group_size.required_if' => 'Minimum group size is required when teaching group sessions.',
            'min_group_size.lte' => 'Minimum group size must be less than or equal to maximum group size.',
        ]);

        $teacherInfo = TeacherInfo::updateOrCreate(
            ['teacher_id' => $teacherId],
            [
                'bio' => $request->bio,
                'teach_individual' => $request->has('teach_individual'),
                'individual_hour_price' => $request->teach_individual ? $request->individual_hour_price : null,
                'teach_group' => $request->has('teach_group'),
                'group_hour_price' => $request->teach_group ? $request->group_hour_price : null,
                'max_group_size' => $request->teach_group ? $request->max_group_size : null,
                'min_group_size' => $request->teach_group ? $request->min_group_size : null,
            ]
        );

        return redirect()->route('teacher.info.show')
            ->with('success', 'Teacher information updated successfully!');
    }
}