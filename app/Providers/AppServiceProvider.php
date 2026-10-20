<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        if (
            (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
            request()->header('x-forwarded-proto') === 'https' ||
            request()->isSecure()
        ) {
            URL::forceScheme('https');
        }

        View::composer('*', function ($view) {
            $menuData = [];
            if (Auth::check()) {
                $role = Auth::user()->role_id; // role id
                $roleMap = [
                    1 => 'admin',
                    2 => 'visitor',
                    3 => 'teacher',
                    4 => 'student',
                ];

                $rolename = $roleMap[$role] ?? 'student';

                $menuPath = resource_path("menus/{$rolename}.json");
                if (file_exists($menuPath)) {
                    $json = json_decode(file_get_contents($menuPath));
                    $menuData = $json->menu ?? [];
                }
            }
            $view->with('menuData', $menuData);
        });
    }
}
