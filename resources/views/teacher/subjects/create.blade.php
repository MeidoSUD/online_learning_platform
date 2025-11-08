

@extends('layouts.app')

@section('title', app()->getLocale() == 'en' ? 'Add Subject' : 'إضافة مادة')

@section('content')
<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-md-12">
            <h2 class="mb-1">{{ app()->getLocale() == 'ar' ? 'إضافة مادة' : 'Add Subject' }}</h2>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('teacher.dashboard') }}">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</a></li>
                    <li class="breadcrumb-item"><a href="{{ route('teacher.subjects.index') }}">{{ app()->getLocale() == 'ar' ? 'المواد الدراسية' : 'Subjects' }}</a></li>
                    <li class="breadcrumb-item active">{{ app()->getLocale() == 'ar' ? 'إضافة' : 'Add' }}</li>
                </ol>
            </nav>
        </div>
    </div>

    <div class="row">
        <div class="col-md-8 offset-md-2">
            <div class="card shadow-sm">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="bi bi-plus-circle me-2"></i>{{ app()->getLocale() == 'ar' ? 'اختر المادة التي ترغب في تدريسها' : 'Select Subject to Teach' }}</h5>
                </div>
                <div class="card-body">
                    @if($errors->any())
                        <div class="alert alert-danger">
                            <ul class="mb-0">
                                @foreach($errors->all() as $error)
                                    <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif

                    @if(session('error'))
                        <div class="alert alert-danger">
                            {{ session('error') }}
                        </div>
                    @endif

                    <form action="{{ route('teacher.subjects.store') }}" method="POST" id="subjectForm">
                        @csrf

                        <!-- Education Level -->
                        <div class="mb-4">
                            <label for="education_level_id" class="form-label fw-bold">
                                {{ app()->getLocale() == 'ar' ? 'المرحلة الدراسية' : 'Education Level' }} 
                                <span class="text-danger">*</span>
                            </label>
                            <select name="education_level_id" id="education_level_id" class="form-select" required>
                                <option value="">{{ app()->getLocale() == 'ar' ? 'اختر المرحلة الدراسية' : 'Select Education Level' }}</option>
                                @foreach($educationLevels as $level)
                                    <option value="{{ $level->id }}" {{ old('education_level_id') == $level->id ? 'selected' : '' }}>
                                        {{ app()->getLocale() == 'ar' ? $level->name_ar : $level->name }}
                                    </option>
                                @endforeach
                            </select>
                        </div>

                        <!-- Class -->
                        <div class="mb-4">
                            <label for="class_id" class="form-label fw-bold">
                                {{ app()->getLocale() == 'ar' ? 'الصف' : 'Class' }} 
                                <span class="text-danger">*</span>
                            </label>
                            <select name="class_id" id="class_id" class="form-select" required disabled>
                                <option value="">{{ app()->getLocale() == 'ar' ? 'اختر الصف' : 'Select Class' }}</option>
                            </select>
                            <div class="form-text text-muted">
                                <i class="bi bi-info-circle"></i> 
                                {{ app()->getLocale() == 'ar' ? 'الرجاء اختيار المرحلة الدراسية أولاً' : 'Please select education level first' }}
                            </div>
                        </div>

                        <!-- Subject -->
                        <div class="mb-4">
                            <label for="subject_id" class="form-label fw-bold">
                                {{ app()->getLocale() == 'ar' ? 'المادة' : 'Subject' }} 
                                <span class="text-danger">*</span>
                            </label>
                            <select name="subject_id" id="subject_id" class="form-select" required disabled>
                                <option value="">{{ app()->getLocale() == 'ar' ? 'اختر المادة' : 'Select Subject' }}</option>
                            </select>
                            <div class="form-text text-muted">
                                <i class="bi bi-info-circle"></i> 
                                {{ app()->getLocale() == 'ar' ? 'الرجاء اختيار الصف أولاً' : 'Please select class first' }}
                            </div>
                        </div>

                        <div class="d-flex justify-content-between">
                            <a href="{{ route('teacher.subjects.index') }}" class="btn btn-secondary">
                                <i class="bi bi-arrow-left"></i> {{ app()->getLocale() == 'ar' ? 'رجوع' : 'Back' }}
                            </a>
                            <button type="submit" class="btn btn-primary" id="submitBtn" disabled>
                                <i class="bi bi-check-circle"></i> {{ app()->getLocale() == 'ar' ? 'حفظ' : 'Save' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const locale = '{{ app()->getLocale() }}';
    const educationLevelSelect = document.getElementById('education_level_id');
    const classSelect = document.getElementById('class_id');
    const subjectSelect = document.getElementById('subject_id');
    const submitBtn = document.getElementById('submitBtn');

    // Get classes when education level changes
    educationLevelSelect.addEventListener('change', function() {
        const levelId = this.value;
        
        // Reset and disable dependent selects
        classSelect.innerHTML = `<option value="">${locale === 'ar' ? 'اختر الصف' : 'Select Class'}</option>`;
        subjectSelect.innerHTML = `<option value="">${locale === 'ar' ? 'اختر المادة' : 'Select Subject'}</option>`;
        classSelect.disabled = true;
        subjectSelect.disabled = true;
        submitBtn.disabled = true;

        if (levelId) {
            // Show loading
            classSelect.innerHTML = `<option value="">${locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</option>`;
            
            fetch(`{{ route('teacher.subjects.get-classes') }}?education_level_id=${levelId}`)
                .then(response => response.json())
                .then(data => {
                    classSelect.innerHTML = `<option value="">${locale === 'ar' ? 'اختر الصف' : 'Select Class'}</option>`;
                    
                    if (data.length > 0) {
                        data.forEach(cls => {
                            const option = document.createElement('option');
                            option.value = cls.id;
                            option.textContent = locale === 'ar' ? cls.name_ar : cls.name_en;
                            classSelect.appendChild(option);
                        });
                        classSelect.disabled = false;
                    } else {
                        classSelect.innerHTML = `<option value="">${locale === 'ar' ? 'لا توجد صفوف متاحة' : 'No classes available'}</option>`;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    classSelect.innerHTML = `<option value="">${locale === 'ar' ? 'حدث خطأ' : 'Error occurred'}</option>`;
                });
        }
    });

    // Get subjects when class changes
    classSelect.addEventListener('change', function() {
        const classId = this.value;
        
        // Reset and disable subject select
        subjectSelect.innerHTML = `<option value="">${locale === 'ar' ? 'اختر المادة' : 'Select Subject'}</option>`;
        subjectSelect.disabled = true;
        submitBtn.disabled = true;

        if (classId) {
            // Show loading
            subjectSelect.innerHTML = `<option value="">${locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</option>`;
            
            fetch(`{{ route('teacher.subjects.get-subjects') }}?class_id=${classId}`)
                .then(response => response.json())
                .then(data => {
                    subjectSelect.innerHTML = `<option value="">${locale === 'ar' ? 'اختر المادة' : 'Select Subject'}</option>`;
                    
                    if (data.length > 0) {
                        data.forEach(subject => {
                            const option = document.createElement('option');
                            option.value = subject.id;
                            option.textContent = `${locale === 'ar' ? subject.name_ar : subject.name_en} (${subject.code})`;
                            subjectSelect.appendChild(option);
                        });
                        subjectSelect.disabled = false;
                    } else {
                        subjectSelect.innerHTML = `<option value="">${locale === 'ar' ? 'لا توجد مواد متاحة' : 'No subjects available'}</option>`;
                    }
                })
                .catch(error => {
                    console.log('Error fetching subjects:', error);
                    console.error('Error:', error);
                    subjectSelect.innerHTML = `<option value="">${locale === 'ar' ? 'حدث خطأ' : 'Error occurred'}</option>`;
                });
        }
    });

    // Enable submit button when subject is selected
    subjectSelect.addEventListener('change', function() {
        submitBtn.disabled = !this.value;
    });
});
</script>
@endpush





