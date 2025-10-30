<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;

class LocaleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $locale = Session::get('locale', config('app.locale', 'ar'));
        app()->setLocale($locale);
        config(['app.locale_direction' => $locale === 'ar' ? 'rtl' : 'ltr']);

        return $next($request);
    }
}