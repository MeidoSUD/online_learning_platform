<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EducationLevel;
use App\Models\ClassModel; // Assuming Class is renamed to ClassModel to avoid conflict with PHP reserved word
use App\Models\Subject;

class EducationLevelController extends Controller
{
    public function educationLevels()
    {
        $educationLevels = EducationLevel::with('classes.subjects')->get();

        return response()->json([
            'education_levels' => $educationLevels
        ]);
    }

    public function getSubjectsByClass($class_id)
    {
        $subjects = Subject::select('id', 'name_en', 'name_ar')->where('class_id', $class_id)->get();

        if ($subjects->isEmpty()) {
            return response()->json([
                'message' => 'Class not found'
            ], 404);
        }

        return response()->json([
            'subject' => $subjects
        ]);
    }

    public function classes($education_level_id)
    {
        $classes = ClassModel::where('education_level_id', $education_level_id)->get();

        return response()->json([
            'classes' => $classes
        ]);
    }

    public function levelsWithClassesAndSubjects()
    {
        $educationLevels = EducationLevel::select('id', 'name_en', 'name_ar') ->with([
       'classes:id,name_en,name_ar,education_level_id',
       'classes.subjects:id,name_en,name_ar,class_id'
   ])   ->get();

        return response()->json([
            'education_levels' => $educationLevels
        ]);
    }
}
