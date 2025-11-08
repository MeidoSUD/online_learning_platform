@extends('layouts.app')

@section('title', app()->getLocale() == 'en' ? 'Edit Student Profile' : 'تعديل الملف الشخصي للطالب')

@section('content')
<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-md-12">
            <h2 class="mb-1">{{ app()->getLocale() == 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile' }}</h2>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('student.dashboard') }}">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</a></li>
                    <li class="breadcrumb-item"><a href="{{ route('student.profile.show') }}">{{ app()->getLocale() == 'ar' ? 'الملف الشخصي' : 'Profile' }}</a></li>
                    <li class="breadcrumb-item active">{{ app()->getLocale() == 'ar' ? 'تعديل' : 'Edit' }}</li>
                </ol>
            </nav>
        </div>
    </div>

    <div class="row">
        <div class="col-md-8 offset-md-2">
            <div class="card shadow-sm">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">
                        <i class="bi bi-person-circle me-2"></i>
                        {{ app()->getLocale() == 'ar' ? 'تحديث معلومات الملف الشخصي' : 'Update Profile Information' }}
                    </h5>
                </div>
                <div class="card-body">
                    @if($errors->any())
                        <div class="alert alert-danger">
                            <strong>{{ app()->getLocale() == 'ar' ? 'أخطاء التحقق:' : 'Validation Errors:' }}</strong>
                            <ul class="mb-0">
                                @foreach($errors->all() as $error)
                                    <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif

                    @if(session('email_error'))
                        <div class="alert alert-warning">
                            <i class="bi bi-exclamation-triangle me-2"></i>{{ session('email_error') }}
                        </div>
                    @endif

                    <form action="{{ route('student.profile.update') }}" method="POST" enctype="multipart/form-data">
                        @csrf
                        @method('PUT')

                        <!-- Profile Picture -->
                        <div class="text-center mb-4">
                            <div class="position-relative d-inline-block">
                                <img src="{{ $student->profile_picture ?? asset('images/default-avatar.png') }}" 
                                     alt="Profile Picture" 
                                     class="rounded-circle" 
                                     style="width: 120px; height: 120px; object-fit: cover;">
                                <label for="profile_picture" class="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2 cursor-pointer">
                                    <i class="bi bi-camera"></i>
                                    <input type="file" 
                                           id="profile_picture" 
                                           name="profile_picture" 
                                           class="d-none" 
                                           accept="image/*"
                                           onchange="previewImage(this)">
                                </label>
                            </div>
                        </div>

                        <!-- Name -->
                        <div class="mb-4">
                            <label for="first_name" class="form-label fw-bold">
                                {{ app()->getLocale() == 'ar' ? 'الاسم الاول' : 'First Name' }} 
                                <span class="text-danger">*</span>
                            </label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-person"></i></span>
                                <input type="text" 
                                       name="first_name" 
                                       id="first_name" 
                                       class="form-control @error('first_name') is-invalid @enderror" 
                                       value="{{ old('first_name', $student->first_name) }}"
                                       placeholder="{{ app()->getLocale() == 'ar' ? 'أدخل اسمك الاول' : 'Enter your first name' }}"
                                       required>
                                @error('first_name')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>
                        </div>

                        <!-- Last Name -->
                        <div class="mb-4">
                            <label for="last_name" class="form-label fw-bold">
                                {{ app()->getLocale() == 'ar' ? 'الاسم الاخير' : 'Last Name' }} 
                                <span class="text-danger">*</span>
                            </label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-person"></i></span>
                                <input type="text" 
                                       name="last_name" 
                                       id="last_name" 
                                       class="form-control @error('last_name') is-invalid @enderror" 
                                       value="{{ old('last_name', $student->last_name) }}"
                                       placeholder="{{ app()->getLocale() == 'ar' ? 'أدخل اسمك الاخير' : 'Enter your last name' }}"
                                       required>
                                @error('last_name')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>
                        </div>

                        <!-- Email -->
                        <div class="mb-4">
                            <label for="email" class="form-label fw-bold">
                                {{ app()->getLocale() == 'ar' ? 'البريد الإلكتروني' : 'Email Address' }} 
                                <span class="text-danger">*</span>
                            </label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                                <input type="email" 
                                       name="email" 
                                       id="email" 
                                       class="form-control @error('email') is-invalid @enderror" 
                                       value="{{ old('email', $student->email) }}"
                                       placeholder="{{ app()->getLocale() == 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email' }}"
                                       required>
                                @error('email')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>
                            @if($student->email_verified_at)
                                <small class="text-success">
                                    <i class="bi bi-check-circle-fill"></i> 
                                    {{ app()->getLocale() == 'ar' ? 'البريد مُفعّل' : 'Email verified' }}
                                </small>
                            @else
                                <small class="text-warning">
                                    <i class="bi bi-exclamation-circle-fill"></i> 
                                    {{ app()->getLocale() == 'ar' ? 'البريد غير مُفعّل' : 'Email not verified' }}
                                </small>
                            @endif
                            <small class="d-block text-muted mt-1">
                                {{ app()->getLocale() == 'ar' ? 'إذا قمت بتغيير بريدك الإلكتروني، ستحتاج للتحقق منه مرة أخرى' : 'If you change your email, you will need to verify it again' }}
                            </small>
                        </div>

                        <!-- Phone -->
                        <div class="mb-4">
                            <label for="phone" class="form-label fw-bold">
                                {{ app()->getLocale() == 'ar' ? 'رقم الهاتف' : 'Phone Number' }} 
                                <span class="text-danger">*</span>
                            </label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-phone"></i></span>
                                <input type="tel" 
                                       name="phone_number" 
                                       id="phone" 
                                       class="form-control @error('phone') is-invalid @enderror" 
                                       value="{{ old('phone', $student->phone_number) }}"
                                       placeholder="{{ app()->getLocale() == 'ar' ? '+966 5X XXX XXXX' : '+966 5X XXX XXXX' }}"
                                       required>
                                @error('phone')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>
                            @if($student->phone_verified_at)
                                <small class="text-success">
                                    <i class="bi bi-check-circle-fill"></i> 
                                    {{ app()->getLocale() == 'ar' ? 'الهاتف مُفعّل' : 'Phone verified' }}
                                </small>
                            @else
                                <small class="text-warning">
                                    <i class="bi bi-exclamation-circle-fill"></i> 
                                    {{ app()->getLocale() == 'ar' ? 'الهاتف غير مُفعّل' : 'Phone not verified' }}
                                </small>
                            @endif
                            <small class="d-block text-muted mt-1">
                                {{ app()->getLocale() == 'ar' ? 'إذا قمت بتغيير رقمك، ستحتاج للتحقق منه مرة أخرى' : 'If you change your phone number, you will need to verify it again' }}
                            </small>
                        </div>

                        <!-- Gender -->
                        <div class="mb-4">
                            <label for="gender" class="form-label fw-bold">
                                {{ app()->getLocale() == 'ar' ? 'الجنس' : 'Gender' }} 
                                <span class="text-danger">*</span>
                            </label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-gender-ambiguous"></i></span>
                                <select name="gender" 
                                        id="gender" 
                                        class="form-select @error('gender') is-invalid @enderror" 
                                        required>
                                    <option value="">{{ app()->getLocale() == 'ar' ? 'اختر الجنس' : 'Select Gender' }}</option>
                                    <option value="male" {{ old('gender', $student->gender) == 'male' ? 'selected' : '' }}>
                                        {{ app()->getLocale() == 'ar' ? 'ذكر' : 'Male' }}
                                    </option>
                                    <option value="female" {{ old('gender', $student->gender) == 'female' ? 'selected' : '' }}>
                                        {{ app()->getLocale() == 'ar' ? 'أنثى' : 'Female' }}
                                    </option>
                                    <option value="other" {{ old('gender', $student->gender) == 'other' ? 'selected' : '' }}>
                                        {{ app()->getLocale() == 'ar' ? 'آخر' : 'Other' }}
                                    </option>
                                </select>
                                @error('gender')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>
                        </div>

                        <!-- Nationality -->
                        <div class="mb-4">
                            <label for="nationality" class="form-label fw-bold">
                                {{ app()->getLocale() == 'ar' ? 'الجنسية' : 'Nationality' }} 
                                <span class="text-danger">*</span>
                            </label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-flag"></i></span>
                                <input type="text" 
                                       name="nationality" 
                                       id="nationality" 
                                       class="form-control @error('nationality') is-invalid @enderror" 
                                       value="{{ old('nationality', $student->nationality) }}"
                                       placeholder="{{ app()->getLocale() == 'ar' ? 'مثال: سعودي، مصري، أردني' : 'e.g., Saudi, Egyptian, Jordanian' }}"
                                       required>
                                @error('nationality')
                                    <div class="invalid-feedback">{{ $message }}</div>
                                @enderror
                            </div>
                        </div>

                        <hr class="my-4">

                        <!-- Action Buttons -->
                        <div class="d-flex justify-content-between">
                            <a href="{{ route('student.profile.show') }}" class="btn btn-secondary">
                                <i class="bi bi-arrow-left"></i> 
                                {{ app()->getLocale() == 'ar' ? 'إلغاء' : 'Cancel' }}
                            </a>
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-check-circle"></i> 
                                {{ app()->getLocale() == 'ar' ? 'حفظ التغييرات' : 'Save Changes' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Information Card -->
            <div class="card shadow-sm mt-4">
                <div class="card-body">
                    <h6 class="card-title">
                        <i class="bi bi-info-circle text-info"></i> 
                        {{ app()->getLocale() == 'ar' ? 'معلومات مهمة' : 'Important Information' }}
                    </h6>
                    <ul class="mb-0">
                        <li>{{ app()->getLocale() == 'ar' ? 'عند تغيير البريد الإلكتروني، سيتم إرسال رابط تحقق إلى البريد الجديد' : 'When you change your email, a verification link will be sent to the new email' }}</li>
                        <li>{{ app()->getLocale() == 'ar' ? 'عند تغيير رقم الهاتف، سيتم إرسال رمز تحقق إلى الرقم الجديد' : 'When you change your phone, a verification code will be sent to the new number' }}</li>
                        <li>{{ app()->getLocale() == 'ar' ? 'يجب عليك التحقق من معلومات الاتصال الجديدة لضمان أمان حسابك' : 'You must verify new contact information to ensure your account security' }}</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            input.closest('.position-relative').querySelector('img').src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}
</script>
@endpush