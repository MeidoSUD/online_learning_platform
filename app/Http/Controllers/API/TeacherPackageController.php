<?php

namespace App\Http\Controllers\API;

use App\Helpers\TeacherProfileHelper;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
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
            // Use the authenticated user as the teacher
            $teacher = \App\Models\TeacherInfo::findOrFail($user->id);
            // Set the package availability based on the request value (1 = on, 0 = off)
            $value = $request->input('package_on_off');
            // Normalize incoming value to boolean then to integer 1 or 0
            $bool = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($bool === null) {
                // If PHP couldn't parse it as boolean, attempt numeric cast
                $bool = intval($value) === 1;
            }
            $teacher->package_on_off = $bool ? 1 : 0;
            $teacher->save();

            return $this->success([
                'user_id' => $teacher->id,
                'package_on_off' => (int) $teacher->package_on_off,
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