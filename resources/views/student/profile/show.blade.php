@extends('layouts.app')

@section('title', app()->getLocale() == 'en' ? 'Student Profile' : 'الملف الشخصي للطالب')

@section('content')
<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h2 class="mb-1">{{ app()->getLocale() == 'ar' ? 'الملف الشخصي' : 'My Profile' }}</h2>
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item"><a href="{{ route('student.dashboard') }}">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</a></li>
                            <li class="breadcrumb-item active">{{ app()->getLocale() == 'ar' ? 'الملف الشخصي' : 'Profile' }}</li>
                        </ol>
                    </nav>
                </div>
                <a href="{{ route('student.profile.edit') }}" class="btn btn-primary">
                    <i class="bi bi-pencil"></i> {{ app()->getLocale() == 'ar' ? 'تعديل الملف' : 'Edit Profile' }}
                </a>
            </div>
        </div>
    </div>

    <!-- Success Message -->
    @if(session('success'))
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="bi bi-check-circle me-2"></i>{{ session('success') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    <!-- Info Message -->
    @if(session('info'))
        <div class="alert alert-info alert-dismissible fade show" role="alert">
            <i class="bi bi-info-circle me-2"></i>{{ session('info') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    <!-- Error Message -->
    @if(session('error'))
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>{{ session('error') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    <!-- Phone Verification Needed Alert -->
    @if(session('phone_verification_needed'))
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>{{ app()->getLocale() == 'ar' ? 'التحقق من الهاتف مطلوب!' : 'Phone Verification Required!' }}</strong>
            {{ app()->getLocale() == 'ar' ? 'لقد قمت بتغيير رقم هاتفك. الرجاء التحقق من الرقم الجديد.' : 'You have changed your phone number. Please verify your new number.' }}
            <a href="{{ route('student.profile.verify-phone') }}" class="alert-link">
                {{ app()->getLocale() == 'ar' ? 'تحقق الآن' : 'Verify Now' }}
            </a>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    <!-- Email Verification Needed Alert -->
    @if(session('email_verification_needed'))
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>{{ app()->getLocale() == 'ar' ? 'التحقق من البريد الإلكتروني مطلوب!' : 'Email Verification Required!' }}</strong>
            {{ app()->getLocale() == 'ar' ? 'لقد قمت بتغيير بريدك الإلكتروني. تم إرسال رابط التحقق إلى بريدك الجديد.' : 'You have changed your email. A verification link has been sent to your new email.' }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    <div class="row">
        <div class="col-md-8 offset-md-2">
            <!-- Profile Information Card -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">
                        <i class="bi bi-person-badge me-2"></i>
                        {{ app()->getLocale() == 'ar' ? 'المعلومات الشخصية' : 'Personal Information' }}
                    </h5>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <strong><i class="bi bi-person me-2"></i>{{ app()->getLocale() == 'ar' ? 'الاسم الاول:' : 'First Name:' }}</strong>
                        </div>
                        <div class="col-md-8">
                            <p class="mb-0">{{ $student->first_name }}</p>
                        </div>
                    </div>

                    <hr>
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <strong><i class="bi bi-person me-2"></i>{{ app()->getLocale() == 'ar' ? 'الاسم الاخير:' : 'Last Name:' }}</strong>
                        </div>
                        <div class="col-md-8">
                            <p class="mb-0">{{ $student->last_name }}</p>
                        </div>
                    </div>

                    <hr>

                    <div class="row mb-3">
                        <div class="col-md-4">
                            <strong><i class="bi bi-envelope me-2"></i>{{ app()->getLocale() == 'ar' ? 'البريد الإلكتروني:' : 'Email:' }}</strong>
                        </div>
                        <div class="col-md-8">
                            <p class="mb-1">{{ $student->email }}</p>
                            @if($student->email_verified_at)
                                <span class="badge bg-success">
                                    <i class="bi bi-check-circle-fill"></i> {{ app()->getLocale() == 'ar' ? 'مُفعّل' : 'Verified' }}
                                </span>
                            @else
                                <span class="badge bg-warning">
                                    <i class="bi bi-exclamation-circle-fill"></i> {{ app()->getLocale() == 'ar' ? 'غير مُفعّل' : 'Not Verified' }}
                                </span>
                                <form action="{{ route('student.profile.resend-email') }}" method="POST" class="d-inline">
                                    @csrf
                                    <button type="submit" class="btn btn-sm btn-link p-0 ms-2">
                                        {{ app()->getLocale() == 'ar' ? 'إعادة إرسال رابط التحقق' : 'Resend Verification Link' }}
                                    </button>
                                </form>
                            @endif
                        </div>
                    </div>

                    <hr>

                    <div class="row mb-3">
                        <div class="col-md-4">
                            <strong><i class="bi bi-phone me-2"></i>{{ app()->getLocale() == 'ar' ? 'رقم الهاتف:' : 'Phone Number:' }}</strong>
                        </div>
                        <div class="col-md-8">
                            <p class="mb-1">{{ $student->phone_number }}</p>
                            @if($student->phone_verified_at)
                                <span class="badge bg-success">
                                    <i class="bi bi-check-circle-fill"></i> {{ app()->getLocale() == 'ar' ? 'مُفعّل' : 'Verified' }}
                                </span>
                            @else
                                <span class="badge bg-warning">
                                    <i class="bi bi-exclamation-circle-fill"></i> {{ app()->getLocale() == 'ar' ? 'غير مُفعّل' : 'Not Verified' }}
                                </span>
                                <a href="{{ route('student.profile.verify-phone') }}" class="btn btn-sm btn-link p-0 ms-2">
                                    {{ app()->getLocale() == 'ar' ? 'تحقق الآن' : 'Verify Now' }}
                                </a>
                            @endif
                        </div>
                    </div>

                    <hr>

                    <div class="row mb-3">
                        <div class="col-md-4">
                            <strong><i class="bi bi-gender-ambiguous me-2"></i>{{ app()->getLocale() == 'ar' ? 'الجنس:' : 'Gender:' }}</strong>
                        </div>
                        <div class="col-md-8">
                            <p class="mb-0">
                                @if($student->gender == 'male')
                                    {{ app()->getLocale() == 'ar' ? 'ذكر' : 'Male' }}
                                @elseif($student->gender == 'female')
                                    {{ app()->getLocale() == 'ar' ? 'أنثى' : 'Female' }}
                                @else
                                    {{ app()->getLocale() == 'ar' ? 'آخر' : 'Other' }}
                                @endif
                            </p>
                        </div>
                    </div>

                    <hr>

                    <div class="row">
                        <div class="col-md-4">
                            <strong><i class="bi bi-flag me-2"></i>{{ app()->getLocale() == 'ar' ? 'الجنسية:' : 'Nationality:' }}</strong>
                        </div>
                        <div class="col-md-8">
                            <p class="mb-0">{{ $student->nationality }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Account Status Card -->
            <div class="card shadow-sm">
                <div class="card-header bg-info text-white">
                    <h5 class="mb-0">
                        <i class="bi bi-shield-check me-2"></i>
                        {{ app()->getLocale() == 'ar' ? 'حالة الحساب' : 'Account Status' }}
                    </h5>
                </div>
                <div class="card-body">
                    <div class="row mb-2">
                        <div class="col-md-6">
                            <strong>{{ app()->getLocale() == 'ar' ? 'تاريخ التسجيل:' : 'Member Since:' }}</strong>
                        </div>
                        <div class="col-md-6">
                            {{ $student->created_at->format('F d, Y') }}
                        </div>
                    </div>

                    <div class="row mb-2">
                        <div class="col-md-6">
                            <strong>{{ app()->getLocale() == 'ar' ? 'حالة البريد:' : 'Email Status:' }}</strong>
                        </div>
                        <div class="col-md-6">
                            @if($student->email_verified_at)
                                <span class="text-success"><i class="bi bi-check-circle-fill"></i> {{ app()->getLocale() == 'ar' ? 'مُفعّل' : 'Verified' }}</span>
                            @else
                                <span class="text-warning"><i class="bi bi-exclamation-circle-fill"></i> {{ app()->getLocale() == 'ar' ? 'في انتظار التحقق' : 'Pending Verification' }}</span>
                            @endif
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <strong>{{ app()->getLocale() == 'ar' ? 'حالة الهاتف:' : 'Phone Status:' }}</strong>
                        </div>
                        <div class="col-md-6">
                            @if($student->phone_verified_at)
                                <span class="text-success"><i class="bi bi-check-circle-fill"></i> {{ app()->getLocale() == 'ar' ? 'مُفعّل' : 'Verified' }}</span>
                            @else
                                <span class="text-warning"><i class="bi bi-exclamation-circle-fill"></i> {{ app()->getLocale() == 'ar' ? 'في انتظار التحقق' : 'Pending Verification' }}</span>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection