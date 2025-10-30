<!DOCTYPE html>
<html class="loading" lang="{{ app()->getLocale() }}" data-textdirection="{{ app()->getLocale() == 'ar' ? 'rtl' : 'ltr' }}">
<!-- BEGIN: Head-->

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0, minimal-ui">
    <meta name="description"
        content="Vuexy admin is super flexible, powerful, clean &amp; modern responsive bootstrap 4 admin template with unlimited possibilities.">
    <meta name="keywords"
        content="admin template, Vuexy admin template, dashboard template, flat admin template, responsive admin template, web app">
    <meta name="author" content="PIXINVENT">
    <title>{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }} - @yield('title')</title>
    <link rel="apple-touch-icon" href="{{ asset('/app-assets/images/ico/apple-icon-120.png') }}">
    <link rel="shortcut icon" type="image/x-icon" href="{{ asset('logo.png') }}">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,500,600" rel="stylesheet">

    <!-- BEGIN: Vendor CSS-->
    @if(app()->getLocale() == 'ar')
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/vendors/css/vendors-rtl.min.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/bootstrap.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/bootstrap-extended.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/colors.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/components.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/themes/dark-layout.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/themes/semi-dark-layout.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/core/menu/menu-types/vertical-menu.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/assets/css/style-rtl.css') }}">
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700&display=swap" rel="stylesheet">
    @else
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/vendors/css/vendors.min.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/bootstrap.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/bootstrap-extended.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/colors.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/components.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/themes/dark-layout.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/themes/semi-dark-layout.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/core/menu/menu-types/vertical-menu.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/assets/css/style.css') }}">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,500,600" rel="stylesheet">
    @endif
    <link rel="stylesheet" href="{{ asset('assets/vendor/fonts/tabler-icons.css') }}" />
    <link rel="stylesheet" href="{{ asset('assets/vendor/css/core.css') }}" />
    <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/vendors/css/ui/prism.min.css') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    @include('partials.sidebarStyle')

</head>
<!-- END: Head-->

<!-- BEGIN: Body-->
<style>
    a,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
    span {
        font-family: '{{ app()->getLocale() == 'ar' ? 'Tajawal' : 'Montserrat' }}', sans-serif
    }
</style>
<body class="vertical-layout vertical-menu-modern 2-columns navbar-sticky footer-static" data-open="click"
    data-menu="vertical-menu-modern" data-col="2-columns" style="font-family: '{{ app()->getLocale() == 'ar' ? 'Tajawal' : 'Montserrat' }}', sans-serif;">
    <!-- Navbar -->
    @include('partials.navbar')

    <!-- Sidebar -->
    <div class="main-menu menu-fixed menu-light menu-accordion menu-shadow" data-scroll-to-active="true">
        <div class="navbar-header">
            <ul class="nav navbar-nav flex-row">
                <li class="nav-item mr-auto"><a class="navbar-brand"
                        href="../../../html/rtl/vertical-menu-template/index.html">
                        <h2 class="brand-text mb-0">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</h2>
                    </a></li>
                <li class="nav-item nav-toggle">
                    <a class="nav-link modern-nav-toggle pr-0" data-toggle="collapse">
                        <i class="feather icon-x d-block d-xl-none font-medium-4 primary toggle-icon"></i><i
                            class="toggle-icon feather icon-disc font-medium-4 d-none d-xl-block primary"
                            data-ticon="icon-disc">
                        </i>
                    </a>
                </li>
            </ul>
        </div>
        <div class="shadow-bottom"></div>
        <div class="main-menu-content">
            @include('partials.sidebar')
        </div>
    </div>

    <!-- Overlay for sidebar (for mobile) -->
    <div class="sidebar-overlay" onclick="closeSidebar()"></div>

    <!-- Main Page Content -->
    <div class="app-content content">
        <div class="content-wrapper">
            @yield('content')
        </div>
    </div>

    @include('partials.footer')
    <!-- small helper to avoid "toggleSubmenu is not defined" stopping other scripts -->
    <script>
    function toggleSubmenu(el){
      try {
        const submenu = el.nextElementSibling;
        if(!submenu) return;
        submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
      } catch(e){ console.error(e); }
    }
    console.log('layout base scripts loaded');
    </script>

    <!-- include Bootstrap bundle if your modals rely on it (optional, remove if you load elsewhere) -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="" crossorigin="anonymous"></script>

    <!-- render all pushed scripts from views -->
    @stack('scripts')
</body>
</html>

