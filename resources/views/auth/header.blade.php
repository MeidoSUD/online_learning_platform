<!DOCTYPE html>
<html class="loading" lang="{{ app()->getLocale() }}"
    data-textdirection="{{ app()->getLocale() == 'ar' ? 'rtl' : 'ltr' }}">
<!-- BEGIN: Head-->

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0, minimal-ui">
    <meta name="description" content="App - control panel.">
    <meta name="author" content="Ewan Geniuses">
    <title>{{ app()->getLocale() == 'ar' ? 'تسجيل الدخول' : 'Login' }}</title>
    <link rel="apple-touch-icon" href="{{ asset('/app-assets/images/ico/apple-icon-120.png') }}">
    <link rel="shortcut icon" type="image/x-icon" href="{{ asset('logo.png') }}">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,500,600" rel="stylesheet">

    <!-- BEGIN: Vendor CSS-->
    @if (app()->getLocale() == 'ar')
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/vendors/css/vendors-rtl.min.css') }}">
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700&display=swap"
            rel="stylesheet">
    @else
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/vendors/css/vendors.min.css') }}">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,500,600" rel="stylesheet">
    @endif
    <!-- END: Vendor CSS-->

    <!-- BEGIN: Theme CSS-->
    @if (app()->getLocale() == 'ar')
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/bootstrap.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/bootstrap-extended.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/colors.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/components.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/themes/dark-layout.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/themes/semi-dark-layout.css') }}">
        <link rel="stylesheet" type="text/css"
            href="{{ asset('/app-assets/css-rtl/core/menu/menu-types/vertical-menu.css') }}">
        <link rel="stylesheet" type="text/css"
            href="{{ asset('/app-assets/css-rtl/core/colors/palette-gradient.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/pages/authentication.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/custom-rtl.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/assets/css/style-rtl.css') }}">
    @else
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/bootstrap.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/bootstrap-extended.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/colors.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/components.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/themes/dark-layout.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/themes/semi-dark-layout.css') }}">
        <link rel="stylesheet" type="text/css"
            href="{{ asset('/app-assets/css/core/menu/menu-types/vertical-menu.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/core/colors/palette-gradient.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/pages/authentication.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/assets/css/style.css') }}">
    @endif
    <!-- END: Theme CSS-->

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
</head>
<!-- END: Head-->

<!-- BEGIN: Body-->

<body
    class="vertical-layout vertical-menu-modern 1-column  navbar-floating footer-static bg-full-screen-image blank-page blank-page"
    data-open="click" data-menu="vertical-menu-modern" data-col="1-column"
    style="font-family: '{{ app()->getLocale() == 'ar' ? 'Tajawal' : 'Montserrat' }}', sans-serif;">
    <!-- BEGIN: Content-->
    <div class="app-content content">
        <div class="content-overlay"></div>
        <div class="header-navbar-shadow"></div>
        <div class="content-wrapper">
            <div class="content-header row"></div>
            <div class="content-body">
                <!-- Language Switcher -->
                <div class="language-switcher">
    @if(App::getLocale() == 'en')
        <a href="{{ route('lang.switch', ['locale' => 'ar']) }}" class="btn btn-sm btn-outline-secondary">
            <i class="flag-icon flag-icon-sa"></i> العربية
        </a>
    @else
        <a href="{{ route('lang.switch', ['locale' => 'en']) }}" class="btn btn-sm btn-outline-secondary">
            <i class="flag-icon flag-icon-us"></i> English
        </a>
    @endif
</div>
