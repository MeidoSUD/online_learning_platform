<?php

namespace App\Http\Controllers\API;

use App\Helpers\TeacherProfileHelper;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use App\Models\TeacherInfo;
use App\Models\TeacherTeachClasses;
use App\Models\TeacherSubject;
use App\Models\Subject;
use Illuminate\Support\Facades\Log;

class TeacherPackageController extends Controller
{
    use ApiResponse;

    /**
     * Switch the availability of a teacher's package on or off.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function switchPackageOnOff(Request $request)
    {
        // Identify the user via the authenticated token
        $user = $request->user() ?? auth()->user();

        if (!$user) {
            return $this->authError('Unauthenticated. Provide a valid token.');
        }

        $request->validate([
            // Accept 0/1 or boolean values from the request
            'package_on_off' => ['required', 'in:0,1,true,false,True,False,TRUE,FALSE'],
        ]);

        try {
            // Look up TeacherInfo by teacher_id rather than by the primary key.
            $teacherInfo = TeacherInfo::where('teacher_id', $user->id)->first();

            // Set the package availability based on the request value (1 = on, 0 = off)
            $value = $request->input('package_on_off');

            // Normalize incoming value to boolean then to integer 1 or 0
            $bool = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($bool === null) {
                $bool = intval($value) === 1;
            }

            if (!$teacherInfo) {
                $teacherInfo = TeacherInfo::create([
                    'teacher_id' => $user->id,
                    'package_on_off' => $bool ? 1 : 0,
                ]);
            } else {
                $teacherInfo->package_on_off = $bool ? 1 : 0;
                $teacherInfo->save();
            }

            return $this->success([
                'user_id' => $teacherInfo->teacher_id,
                'package_on_off' => (int) $teacherInfo->package_on_off,
            ], 'Package availability switched successfully');
        } catch (\Exception $e) {
            // Log with context and return server error
            Log::error('Failed to switch package availability', [
                'user_id' => $user->id ?? null,
                'request' => $request->all(),
                'exception' => $e->getMessage(),
            ]);

            return $this->serverError($e, 'Failed to switch package availability');
        }
    }
}