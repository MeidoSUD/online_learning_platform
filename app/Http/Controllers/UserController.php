<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\UserStoreRequest;
use App\Http\Requests\UserUpdateRequest;
use App\Models\User;
use App\Models\UserType;
use App\Models\Topic;
use Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{

    public function index()
    {
        $users = User::orderBy('id','Desc')->where('id','!=',1)->get();
        $user_types = UserType::all();

        return view('admin.users.index')
        ->with('users',$users)
        ->with('user_types',$user_types)
        ;
    }

    public function store(Request $request)
    {
    
        $users = new User();
        $users->name = $request->name;
        $users->email = $request->email;
        $users->password =  Hash::make($request->password);
        $users->user_type_id = $request->user_type_id;
        $users->phone = $request->phone;
        $users->is_active = $request->is_active;
        if ($request->hasFile('profile_pic')) {
            if ($request->file('profile_pic')->isValid()) {
                $path = $request->file('profile_pic')->store('users','public_file');
                $users->profile_pic = 'files/'.$path;
            }
        }

        $users->save();

        toastr()->success('تم حفظ بيانات المستخدم بنجاح !!');
        return back();
    }


    public function edit($id)
    {
        $user = User::find($id);
        $user_types = UserType::all();

        return view('users.edit')
        ->with('user',$user)
        ->with('user_types',$user_types)
        ;
    }



    public function update(Request $request,$id)
    {
    
        $users =  User::find($id);
        $users->name = $request->name;
        $users->email = $request->email;
        if(isset($request->password) && $request->password != null)
        {
            $users->password =  Hash::make($request->password);
        }
        $users->user_type_id = $request->user_type_id;
        $users->phone = $request->phone;
        $users->is_active = $request->is_active;
        if ($request->hasFile('profile_pic')) {
            if ($request->file('profile_pic')->isValid()) {
                $path = $request->file('profile_pic')->store('users','public_file');
                $users->profile_pic = 'files/'.$path;
            }
        }

        $users->update();

        toastr()->success('تم حفظ بيانات المستخدم بنجاح !!');
        return back();
    }

    public function destroy($id)
    {
     
            $users =  User::find($id)->delete();
            toastr()->success('تم حذف بيانات المستخدم بنجاح !!');
            return back();
        
    }
    public function completeProfile()
    {
        // Fetch education levels, classes, subjects, and degrees from DB
        $educationLevels = DB::table('education_levels')->get();
        $classes = DB::table('classes')->get();
        $subjects = DB::table('subjects')->get();
        $degrees = DB::table('education_degrees')->get(); // Assuming you have this table for teacher degrees
        $achievements = DB::table('achievements')->get(); // For teacher achievements

        return view('complete-profile', [
            'educationLevels' => $educationLevels,
            'classes' => $classes,
            'subjects' => $subjects,
            'degrees' => $degrees,
            'achievements' => $achievements,
        ]);
    }
    public function storeProfile(Request $request)
    {
        $user = Auth::user();

        // Validate common fields
        $request->validate([
            'role_id' => 'required|in:3,4', // 3: Teacher, 4: Student
            'profile_photo' => 'nullable|image|max:2048',
        ]);

        // Update user role
        $user->role_id = $request->role_id;

        // Handle profile photo upload
        if ($request->hasFile('profile_photo')) {
            $path = $request->file('profile_photo')->store('files/profile_photos', 'public');
            $profile_photo = $path;
        } else {
            $profile_photo = null;
        }

        // Prepare profile data
        $profileData = [
            'user_id' => $user->id,
            'profile_photo' => $profile_photo,
        ];

        // Student-specific fields
        if ($request->role_id == 4) {
            $request->validate([
                'education_level' => 'required',
                'class_grade' => 'required',
                'learning_subjects' => 'required',
            ]);
            $profileData['education_level'] = $request->education_level;
            $profileData['class_grade'] = $request->class_grade;
            $profileData['learning_subjects'] = implode(',', $request->learning_subjects);

            // Save user_education_level
            DB::table('user_education_levels')->updateOrInsert(
                ['user_id' => $user->id],
                ['education_level_id' => $request->education_level]
            );

            // Save user_classes (supporting multiple classes if needed)
            DB::table('user_classes')->where('user_id', $user->id)->delete();
            $classIds = is_array($request->class_grade) ? $request->class_grade : [$request->class_grade];
            foreach ($classIds as $classId) {
                DB::table('user_classes')->insert([
                    'user_id' => $user->id,
                    'education_level_id' => $request->education_level,
                    'class_id' => $classId,
                ]);
            }
        }

        // Teacher-specific fields
        if ($request->role_id == 3) {
            $request->validate([
                'degree' => 'required',
                'bio' => 'required',
                'teaching_type' => 'required',
            ]);
            $profileData['degree'] = $request->degree;
            $profileData['awards'] = $request->awards;
            $profileData['bio'] = $request->bio;
            $profileData['teaching_type'] = $request->teaching_type;

            // Certificates upload (store each certificate in user_ceretifactes table)
            if ($request->hasFile('certificates')) {
                foreach ($request->file('certificates') as $file) {
                    $certificatePath = $file->store('certificates', 'public');
                    DB::table('user_ceretifactes')->insert([
                        'user_id' => $user->id,
                        'certificate_name' => $file->getClientOriginalName(),
                        'certificate_file' => $certificatePath,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // Resume upload
            if ($request->hasFile('resume')) {
                $profileData['resume'] = $request->file('resume')->store('resumes', 'public');
            }
        }

        // Save or update user_profile
        $userProfile = $user->profile ?? new \App\Models\UserProfile();
        $userProfile->fill($profileData);
        $userProfile->save();

        // Save user changes
        $user->save();

        // Redirect to dashboard based on role
        if ($user->role_id == 3) {
            return redirect()->route('teacher.dashboard')->with('success', __('Profile completed!'));
        } elseif ($user->role_id == 4) {
            return redirect()->route('student.dashboard')->with('success', __('Profile completed!'));
        } else {
            return redirect('/')->with('success', __('Profile completed!'));
        }
    }
}