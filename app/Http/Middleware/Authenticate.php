<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string|null
     */
    protected function redirectTo($request)
    {
        if (! $request->expectsJson()) {
            // If a named 'login' route exists, use it. Otherwise, fall back to a simple /login URL.
            try {
                if (Route::has('login')) {
                    return route('login');
                }
            } catch (\Exception $e) {
                // ignore and fallback
            }

            return URL::to('/login');
        }
    }
}
