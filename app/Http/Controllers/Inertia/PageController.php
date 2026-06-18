<?php

namespace App\Http\Controllers\Inertia;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PageController extends Controller
{
    /**
     * Public website pages
     */
    public function home()
    {
        return Inertia::render('Home');
    }

    public function services()
    {
        return Inertia::render('Services');
    }

    public function about()
    {
        return Inertia::render('About');
    }

    public function contact()
    {
        return Inertia::render('Contact');
    }

    public function eProfile()
    {
        return Inertia::render('EProfile');
    }

    public function ecosystem()
    {
        return Inertia::render('Ecosystem');
    }

    public function ewanLanding()
    {
        return Inertia::render('EwanLanding');
    }

    /**
     * Auth pages
     */
    public function login()
    {
        return Inertia::render('Login');
    }

    public function register()
    {
        return Inertia::render('Register');
    }

    /**
     * Dashboard (handles all roles)
     */
    public function dashboard()
    {
        return Inertia::render('Dashboard');
    }
}
