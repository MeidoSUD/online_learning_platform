@extends('layouts.app')

@section('title', app()->getLocale() == 'en' ? 'Edit Teacher Profile' : 'تعديل ملف المعلم')
<!-- View: teacher/availability/edit -->
@section('content')
<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-md-12">
            <h2 class="mb-1">{{ app()->getLocale() == 'ar' ? 'تعديل ملف المعلم' : 'Edit Teacher Profile' }}</h2>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('teacher.dashboard') }}">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</a></li>
                    <li class="breadcrumb-item"><a href="{{ route('teacher.info.show') }}">{{ app()->getLocale() == 'ar' ? 'الملف الشخصي' : 'Profile' }}</a></li>
                    <li class="breadcrumb-item active">{{ app()->getLocale() == 'ar' ? 'تعديل' : 'Edit' }}</li>
                </ol>
            </nav>
        </div>
    </div>

    <div class="row">
        <div class="col-md-10 offset-md-1">
            <div class="card shadow-sm">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="bi bi-pencil me-2"></i>{{ app()->getLocale() == 'ar' ? 'تحديث معلومات الملف الشخصي' : 'Update Your Profile Information' }}</h5>
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

                    <form action="{{ route('teacher.info.update') }}" method="POST">
                        @csrf
                        @method('PUT')

                        <div class="mb-4">
                            <label for="bio" class="form-label fw-bold">{{ app()->getLocale() == 'ar' ? 'السيرة الذاتية' : 'Biography' }}</label>
                            <textarea name="bio" 
                                      id="bio" 
                                      class="form-control @error('bio') is-invalid @enderror" 
                                      rows="5" 
                                      placeholder="{{ app()->getLocale() == 'ar' ? 'أخبر الطلاب عن نفسك، خبرتك في التدريس، مؤهلاتك، إلخ.' : 'Tell students about yourself, your teaching experience, qualifications, etc.' }}">{{ old('bio', $teacherInfo->bio) }}</textarea>
                            @error('bio')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                            <small class="text-muted">{{ app()->getLocale() == 'ar' ? 'الحد الأقصى 1000 حرف' : 'Maximum 1000 characters' }}</small>
                        </div>

                        <hr class="my-4">

                        <h5 class="mb-3"><i class="bi bi-person me-2"></i>{{ app()->getLocale() == 'ar' ? 'جلسات التدريس الفردية' : 'Individual Teaching Sessions' }}</h5>

                        <div class="mb-3">
                            <div class="form-check form-switch">
                                <input class="form-check-input" 
                                       type="checkbox" 
                                       name="teach_individual" 
                                       id="teach_individual" 
                                       value="1"
                                       {{ old('teach_individual', $teacherInfo->teach_individual) ? 'checked' : '' }}
                                       onchange="toggleIndividualFields()">
                                <label class="form-check-label fw-bold" for="teach_individual">
                                    {{ app()->getLocale() == 'ar' ? 'أقدم جلسات تدريس فردية (وجهًا لوجه)' : 'I offer individual (one-on-one) teaching sessions' }}
                                </label>
                            </div>
                        </div>

                        <div id="individual_fields" style="display: {{ old('teach_individual', $teacherInfo->teach_individual) ? 'block' : 'none' }};">
                            <div class="mb-3 ms-4">
                                <label for="individual_hour_price" class="form-label">
                                    {{ app()->getLocale() == 'ar' ? 'سعر الساعة (فردي)' : 'Hourly Rate (Individual)' }} <span class="text-danger">*</span>
                                </label>
                                <div class="input-group">
                                    <span class="input-group-text">$</span>
                                    <input type="number" 
                                           name="individual_hour_price" 
                                           id="individual_hour_price" 
                                           class="form-control @error('individual_hour_price') is-invalid @enderror" 
                                           step="0.01" 
                                           min="0"
                                           value="{{ old('individual_hour_price', $teacherInfo->individual_hour_price) }}"
                                           placeholder="0.00">
                                    <span class="input-group-text">{{ app()->getLocale() == 'ar' ? 'ريال سعودي' : 'SAR' }}</span>
                                    @error('individual_hour_price')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>
                        </div>

                        <hr class="my-4">

                        <h5 class="mb-3"><i class="bi bi-people me-2"></i>{{ app()->getLocale() == 'ar' ? 'جلسات التدريس الجماعي' : 'Group Teaching Sessions' }}</h5>

                        <div class="mb-3">
                            <div class="form-check form-switch">
                                <input class="form-check-input" 
                                       type="checkbox" 
                                       name="teach_group" 
                                       id="teach_group" 
                                       value="1"
                                       {{ old('teach_group', $teacherInfo->teach_group) ? 'checked' : '' }}
                                       onchange="toggleGroupFields()">
                                <label class="form-check-label fw-bold" for="teach_group">
                                    {{ app()->getLocale() == 'ar' ? 'أقدم جلسات تدريس جماعي' : 'I offer group teaching sessions' }}
                                </label>
                            </div>
                        </div>

                        <div id="group_fields" style="display: {{ old('teach_group', $teacherInfo->teach_group) ? 'block' : 'none' }};">
                            <div class="mb-3 ms-4">
                                <label for="group_hour_price" class="form-label">
                                    {{ app()->getLocale() == 'ar' ? 'سعر الساعة (جماعي)' : 'Hourly Rate (Group)' }} <span class="text-danger">*</span>
                                </label>
                                <div class="input-group">
                                    <span class="input-group-text">{{ app()->getLocale() == 'ar' ? 'ريال سعودي' : 'SAR' }}</span>
                                    <input type="number" 
                                           name="group_hour_price" 
                                           id="group_hour_price" 
                                           class="form-control @error('group_hour_price') is-invalid @enderror" 
                                           step="0.01" 
                                           min="0"
                                           value="{{ old('group_hour_price', $teacherInfo->group_hour_price) }}"
                                           placeholder="0.00">
                                    <span class="input-group-text">{{ app()->getLocale() == 'ar' ? 'لكل ساعة' : 'per hour' }}</span>
                                    @error('group_hour_price')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                </div>
                            </div>

                            <div class="row ms-4">
                                <div class="col-md-6 mb-3">
                                    <label for="min_group_size" class="form-label">
                                        {{ app()->getLocale() == 'ar' ? 'الحد الأدنى لحجم المجموعة' : 'Minimum Group Size' }} <span class="text-danger">*</span>
                                    </label>
                                    <input type="number" 
                                           name="min_group_size" 
                                           id="min_group_size" 
                                           class="form-control @error('min_group_size') is-invalid @enderror" 
                                           min="1"
                                           value="{{ old('min_group_size', $teacherInfo->min_group_size) }}"
                                           placeholder="e.g., 2">
                                    @error('min_group_size')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                    <small class="text-muted">{{ app()->getLocale() == 'ar' ? 'الحد الأدنى لعدد الطلاب المطلوب' : 'Minimum number of students required' }}</small>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="max_group_size" class="form-label">
                                        {{ app()->getLocale() == 'ar' ? 'الحد الأقصى لحجم المجموعة' : 'Maximum Group Size' }} <span class="text-danger">*</span>
                                    </label>
                                    <input type="number" 
                                           name="max_group_size" 
                                           id="max_group_size" 
                                           class="form-control @error('max_group_size') is-invalid @enderror" 
                                           min="1"
                                           value="{{ old('max_group_size', $teacherInfo->max_group_size) }}"
                                           placeholder="e.g., 10">
                                    @error('max_group_size')
                                        <div class="invalid-feedback">{{ $message }}</div>
                                    @enderror
                                    <small class="text-muted">{{ app()->getLocale() == 'ar' ? 'الحد الأقصى لعدد الطلاب المسموح به' : 'Maximum number of students allowed' }}</small>
                                </div>
                            </div>
                        </div>

                        <hr class="my-4">

                        <div class="d-flex justify-content-between">
                            <a href="{{ route('teacher.info.show') }}" class="btn btn-secondary">
                                <i class="bi bi-arrow-left"></i> {{ app()->getLocale() == 'ar' ? 'إلغاء' : 'Cancel' }}
                            </a>
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-check-circle"></i> {{ app()->getLocale() == 'ar' ? 'حفظ الملف الشخصي' : 'Save Profile' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    function toggleIndividualFields() {
        const checkbox = document.getElementById('teach_individual');
        const fields = document.getElementById('individual_fields');
        fields.style.display = checkbox.checked ? 'block' : 'none';
        
        if (!checkbox.checked) {
            document.getElementById('individual_hour_price').value = '';
        }
    }

    function toggleGroupFields() {
        const checkbox = document.getElementById('teach_group');
        const fields = document.getElementById('group_fields');
        fields.style.display = checkbox.checked ? 'block' : 'none';
        
        if (!checkbox.checked) {
            document.getElementById('group_hour_price').value = '';
            document.getElementById('min_group_size').value = '';
            document.getElementById('max_group_size').value = '';
        }
    }
</script>
@endsection