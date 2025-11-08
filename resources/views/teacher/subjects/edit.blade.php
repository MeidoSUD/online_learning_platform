
@extends('layouts.app')

@section('title', app()->getLocale() == 'en' ? 'Edit Subject' : 'تعديل المادة')

@section('content')
<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-md-12">
            <h2 class="mb-1">{{ app()->getLocale() == 'ar' ? 'تعديل المادة' : 'Edit Subject' }}</h2>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('teacher.dashboard') }}">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</a></li>
                    <li class="breadcrumb-item"><a href="{{ route('teacher.subjects.index') }}">{{ app()->getLocale() == 'ar' ? 'المواد الدراسية' : 'Subjects' }}</a></li>
                    <li class="breadcrumb-item active">{{ app()->getLocale() == 'ar' ? 'تعديل' : 'Edit' }}</li>
                </ol>
            </nav>
        </div>
    </div>

    <div class="row">
        <div class="col-md-8 offset-md-2">
            <div class="card shadow-sm">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="bi bi-pencil-square me-2"></i>{{ app()->getLocale() == 'ar' ? 'تعديل المادة' : 'Edit Subject' }}</h5>
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

                    <form action="{{ route('teacher.subjects.update', $teacherSubject->id) }}" method="POST" id="subjectForm">
                        @csrf
                        @method('PUT')

                        <!-- Education Level -->
                        <div class="mb-4">
                            <label for="education_level_id" class="form-label fw-bold">
                                {{ app()->getLocale() == 'ar' ? 'المرحلة الدراسية' : 'Education Level' }} 
                                <span class="text-danger">*</span>
                            </label>
                            <select name="education_level_id" id="education_level_id" class="form-select" required>
                                <option value="">{{ app()->getLocale() == 'ar' ? 'اختر المرحلة الدراسية' : 'Select Education Level' }}</option>
                                @foreach($educationLevels as $level)
                                    <option value="{{ $level->id }}" 
                                        {{ (old('education_level_id', $teacherSubject->education_level_id) == $level->id) ? 'selected' : '' }}>
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
                            <select name="class_id" id="class_id" class="form-select" required>
                                <option value="">{{ app()->getLocale() == 'ar' ? 'اختر الصف' : 'Select Class' }}</option>
                                @foreach($classes as $class)
                                    <option value="{{ $class->id }}" 
                                        {{ (old('class_id', $teacherSubject->class_id) == $class->id) ? 'selected' : '' }}>
                                        {{ app()->getLocale() == 'ar' ? $class->name_ar : $class->name }}
                                    </option>
                                @endforeach
                            </select>
                        </div>

                        <!-- Subject -->
                        <div class="mb-4">
                            <label for="subject_id" class="form-label fw-bold">
                                {{ app()->getLocale() == 'ar' ? 'المادة' : 'Subject' }} 
                                <span class="text-danger">*</span>
                            </label>
                            <select name="subject_id" id="subject_id" class="form-select" required>
                                <option value="">{{ app()->getLocale() == 'ar' ? 'اختر المادة' : 'Select Subject' }}</option>
                                @foreach($subjects as $subject)
                                    <option value="{{ $subject->id }}" 
                                        {{ (old('subject_id', $teacherSubject->subject_id) == $subject->id) ? 'selected' : '' }}>
                                        {{ app()->getLocale() == 'ar' ? $subject->name_ar : $subject->name }} ({{ $subject->code }})
                                    </option>
                                @endforeach
                            </select>
                        </div>

                        <div class="d-flex justify-content-between">
                            <a href="{{ route('teacher.subjects.index') }}" class="btn btn-secondary">
                                <i class="bi bi-arrow-left"></i> {{ app()->getLocale() == 'ar' ? 'رجوع' : 'Back' }}
                            </a>
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-check-circle"></i> {{ app()->getLocale() == 'ar' ? 'تحديث' : 'Update' }}
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

    // Get classes when education level changes
    educationLevelSelect.addEventListener('change', function() {
        const levelId = this.value;
        
        // Reset dependent selects
        classSelect.innerHTML = `<option value="">${locale === 'ar' ? 'اختر الصف' : 'Select Class'}</option>`;
        subjectSelect.innerHTML = `<option value="">${locale === 'ar' ? 'اختر المادة' : 'Select Subject'}</option>`;

        if (levelId) {
            classSelect.innerHTML = `<option value="">${locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</option>`;
            
            fetch(`{{ route('teacher.subjects.get-classes') }}?education_level_id=${levelId}`)
                .then(response => response.json())
                .then(data => {
                    classSelect.innerHTML = `<option value="">${locale === 'ar' ? 'اختر الصف' : 'Select Class'}</option>`;
                    
                    if (data.length > 0) {
                        data.forEach(cls => {
                            const option = document.createElement('option');
                            option.value = cls.id;
                            option.textContent = locale === 'ar' ? cls.name_ar : cls.name;
                            classSelect.appendChild(option);
                        });
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
        
        subjectSelect.innerHTML = `<option value="">${locale === 'ar' ? 'اختر المادة' : 'Select Subject'}</option>`;

        if (classId) {
            subjectSelect.innerHTML = `<option value="">${locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</option>`;
            
            fetch(`{{ route('teacher.subjects.get-subjects') }}?class_id=${classId}`)
                .then(response => response.json())
                .then(data => {
                    subjectSelect.innerHTML = `<option value="">${locale === 'ar' ? 'اختر المادة' : 'Select Subject'}</option>`;
                    
                    if (data.length > 0) {
                        data.forEach(subject => {
                            const option = document.createElement('option');
                            option.value = subject.id;
                            option.textContent = `${locale === 'ar' ? subject.name_ar : subject.name} (${subject.code})`;
                            subjectSelect.appendChild(option);
                        });
                    } else {
                        subjectSelect.innerHTML = `<option value="">${locale === 'ar' ? 'لا توجد مواد متاحة' : 'No subjects available'}</option>`;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    subjectSelect.innerHTML = `<option value="">${locale === 'ar' ? 'حدث خطأ' : 'Error occurred'}</option>`;
                });
        }
    });
});
</script>
@endpush