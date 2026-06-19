<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;

class CheckUserRole
{
    public function handle($request, Closure $next)
    {
        $user = Auth::user();

        // ✅ 1. Force profile completion first
        if ($user->role_id == 2) { // visitor
            if (Route::has('profile.complete')) {
                return redirect()->route('profile.complete');
            }
            return redirect(URL::to('/profile/complete'));
        }

        // ✅ 2. Redirect based on role
        switch ($user->role_id ?? '') {
            case 1: // Admin
                return redirect()->route('admin.dashboard');
            case 3: // teacher
                return redirect()->route('teacher.dashboard');
            case 4: // student
                return redirect()->route('student.dashboard');
            default:
                // If role not recognized → logout or error
                Auth::logout();
                if (Route::has('login')) {
                    return redirect()->route('login')->withErrors('Invalid user Role.');
                }
                return redirect(URL::to('/login'))->withErrors('Invalid user Role.');
        }

        return $next($request);
    }
}
