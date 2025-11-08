@extends('layouts.app')

@section('title', app()->getLocale() == 'en' ? 'Verify Phone Number' : 'التحقق من رقم الهاتف')

@section('content')
<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-md-12">
            <h2 class="mb-1">{{ app()->getLocale() == 'ar' ? 'التحقق من رقم الهاتف' : 'Verify Phone Number' }}</h2>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('student.dashboard') }}">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</a></li>
                    <li class="breadcrumb-item"><a href="{{ route('student.profile.show') }}">{{ app()->getLocale() == 'ar' ? 'الملف الشخصي' : 'Profile' }}</a></li>
                    <li class="breadcrumb-item active">{{ app()->getLocale() == 'ar' ? 'التحقق من الهاتف' : 'Verify Phone' }}</li>
                </ol>
            </nav>
        </div>
    </div>

    <div class="row">
        <div class="col-md-6 offset-md-3">
            <div class="card shadow-sm">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">
                        <i class="bi bi-phone-vibrate me-2"></i>
                        {{ app()->getLocale() == 'ar' ? 'أدخل رمز التحقق' : 'Enter Verification Code' }}
                    </h5>
                </div>
                <div class="card-body">
                    @if(session('success'))
                        <div class="alert alert-success">
                            <i class="bi bi-check-circle me-2"></i>{{ session('success') }}
                        </div>
                    @endif

                    @if($errors->any())
                        <div class="alert alert-danger">
                            <strong>{{ app()->getLocale() == 'ar' ? 'خطأ:' : 'Error:' }}</strong>
                            <ul class="mb-0">
                                @foreach($errors->all() as $error)
                                    <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif

                    <div class="text-center mb-4">
                        <i class="bi bi-phone text-primary" style="font-size: 4rem;"></i>
                        <p class="mt-3">
                            {{ app()->getLocale() == 'ar' 
                                ? 'لقد أرسلنا رمز التحقق المكون من 6 أرقام إلى' 
                                : 'We have sent a 6-digit verification code to' }}
                        </p>
                        <strong class="text-primary">{{ Auth::user()->phone }}</strong>
                    </div>

                    <form action="{{ route('student.profile.verify-phone.submit') }}" method="POST">
                        @csrf
                        
                        <div class="mb-4">
                            <label for="code" class="form-label fw-bold text-center d-block">
                                {{ app()->getLocale() == 'ar' ? 'رمز التحقق' : 'Verification Code' }}
                            </label>
                            <input type="text" 
                                   name="code" 
                                   id="code" 
                                   class="form-control form-control-lg text-center @error('code') is-invalid @enderror" 
                                   placeholder="000000"
                                   maxlength="6"
                                   pattern="[0-9]{6}"
                                   inputmode="numeric"
                                   required
                                   autofocus
                                   style="letter-spacing: 1rem; font-size: 2rem; font-weight: bold;">
                            @error('code')
                                <div class="invalid-feedback text-center">{{ $message }}</div>
                            @enderror
                            <small class="text-muted d-block text-center mt-2">
                                {{ app()->getLocale() == 'ar' ? 'أدخل الرمز المكون من 6 أرقام' : 'Enter the 6-digit code' }}
                            </small>
                        </div>

                        <div class="d-grid gap-2">
                            <button type="submit" class="btn btn-primary btn-lg">
                                <i class="bi bi-check-circle"></i> 
                                {{ app()->getLocale() == 'ar' ? 'تحقق من الرقم' : 'Verify Number' }}
                            </button>
                        </div>
                    </form>

                    <hr class="my-4">

                    <div class="text-center">
                        <p class="mb-2">{{ app()->getLocale() == 'ar' ? 'لم تستلم الرمز؟' : "Didn't receive the code?" }}</p>
                        <form action="{{ route('student.profile.resend-phone-code') }}" method="POST" class="d-inline">
                            @csrf
                            <button type="submit" class="btn btn-link">
                                <i class="bi bi-arrow-clockwise"></i> 
                                {{ app()->getLocale() == 'ar' ? 'إعادة إرسال الرمز' : 'Resend Code' }}
                            </button>
                        </form>
                    </div>

                    <div class="text-center mt-3">
                        <a href="{{ route('student.profile.show') }}" class="btn btn-secondary">
                            <i class="bi bi-arrow-left"></i> 
                            {{ app()->getLocale() == 'ar' ? 'العودة للملف الشخصي' : 'Back to Profile' }}
                        </a>
                    </div>
                </div>
            </div>

            <!-- Help Card -->
            <div class="card shadow-sm mt-4">
                <div class="card-body">
                    <h6 class="card-title">
                        <i class="bi bi-info-circle text-info"></i> 
                        {{ app()->getLocale() == 'ar' ? 'معلومات مساعدة' : 'Help Information' }}
                    </h6>
                    <ul class="mb-0 small">
                        <li>{{ app()->getLocale() == 'ar' ? 'يصل الرمز عادة خلال دقيقة واحدة' : 'The code usually arrives within 1 minute' }}</li>
                        <li>{{ app()->getLocale() == 'ar' ? 'الرمز صالح لمدة 10 دقائق' : 'The code is valid for 10 minutes' }}</li>
                        <li>{{ app()->getLocale() == 'ar' ? 'تحقق من مجلد الرسائل غير المرغوب فيها إذا لم تجد الرسالة' : 'Check your spam folder if you don\'t see the message' }}</li>
                        <li>{{ app()->getLocale() == 'ar' ? 'يمكنك طلب رمز جديد في أي وقت' : 'You can request a new code at any time' }}</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    // Auto-focus on the code input
    document.getElementById('code').focus();
    
    // Only allow numbers
    document.getElementById('code').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
</script>
@endsection