@extends('layouts.app')

@section('title', app()->getLocale() == 'ar' ? 'إنشاء دورة جديدة' : 'Create New Course')

@section('content')
<div class="container-fluid py-4">
    <!-- Page Header -->
    <div class="row mb-4">
        <div class="col-12">
            <h2 class="mb-1">{{ app()->getLocale() == 'ar' ? 'إنشاء دورة جديدة' : 'Create New Course' }}</h2>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item"><a href="{{ route('teacher.dashboard') }}">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</a></li>
                    <li class="breadcrumb-item"><a href="{{ route('teacher.courses.index') }}">{{ app()->getLocale() == 'ar' ? 'الدورات' : 'Courses' }}</a></li>
                    <li class="breadcrumb-item active">{{ app()->getLocale() == 'ar' ? 'إنشاء' : 'Create' }}</li>
                </ol>
            </nav>
        </div>
    </div>

    <!-- Alerts -->
    @if($errors->any())
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <i class="fas fa-exclamation-circle me-2"></i>
        <strong>{{ app()->getLocale() == 'ar' ? 'حدثت أخطاء' : 'Errors Occurred' }}</strong>
        <ul class="mb-0 mt-2">
            @foreach($errors->all() as $error)
            <li>{{ $error }}</li>
            @endforeach
        </ul>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
    @endif

    <!-- Form Card -->
    <div class="row">
        <div class="col-lg-10 mx-auto">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="fas fa-plus-circle me-2"></i>{{ app()->getLocale() == 'ar' ? 'إنشاء دورة جديدة' : 'Create New Course' }}</h5>
                </div>
                <div class="card-body">
                    <form action="{{ route('teacher.courses.store') }}" method="POST" enctype="multipart/form-data">
                        @csrf
                        
                        <div class="row g-3">
                            <div class="col-md-12">
                                <label for="name" class="form-label">{{ app()->getLocale() == 'ar' ? 'اسم الدورة' : 'Course Name' }} <span class="text-danger">*</span></label>
                                <input type="text" name="name" id="name" class="form-control @error('name') is-invalid @enderror" value="{{ old('name') }}" required>
                                @error('name')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-md-12">
                                <label for="description" class="form-label">{{ app()->getLocale() == 'ar' ? 'وصف الدورة' : 'Course Description' }} <span class="text-danger">*</span></label>
                                <textarea name="description" id="description" rows="4" class="form-control @error('description') is-invalid @enderror" required>{{ old('description') }}</textarea>
                                @error('description')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-md-6">
                                <label for="category_id" class="form-label">{{ app()->getLocale() == 'ar' ? 'الفئة' : 'Category' }} <span class="text-danger">*</span></label>
                                <select name="category_id" id="category_id" class="form-select @error('category_id') is-invalid @enderror" required>
                                    <option value="">{{ app()->getLocale() == 'ar' ? 'اختر الفئة' : 'Select Category' }}</option>
                                    @foreach($categories as $category)
                                    <option value="{{ $category->id }}" {{ old('category_id') == $category->id ? 'selected' : '' }}>{{ app()->getLocale() == 'ar' ? $category->name_ar : $category->name_en }}</option>
                                    @endforeach
                                </select>
                                @error('category_id')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-md-6">
                                <label for="subject_id" class="form-label">{{ __('courses.subject') }}</label>
                                <select name="subject_id" id="subject_id" class="form-select @error('subject_id') is-invalid @enderror">
                                    <option value="">{{ __('courses.select_subject') }}</option>
                                    @foreach($subjects as $subject)
                                    <option value="{{ $subject->id }}" {{ old('subject_id') == $subject->id ? 'selected' : '' }}>{{ app()->getLocale() == 'ar' ? $subject->name_ar : $subject->name_en }}</option>
                                    @endforeach
                                </select>
                                @error('subject_id')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-md-6">
                                <label for="education_level_id" class="form-label">{{ app()->getLocale() == 'ar' ? 'المستوى التعليمي' : 'Education Level' }}</label>
                                <select name="education_level_id" id="education_level_id" class="form-select @error('education_level_id') is-invalid @enderror">
                                    <option value="">{{ app()->getLocale() == 'ar' ? 'اختر المستوى التعليمي' : 'Select Education Level' }}</option>
                                    @foreach($educationLevels as $level)
                                    <option value="{{ $level->id }}" {{ old('education_level_id') == $level->id ? 'selected' : '' }}>{{ app()->getLocale() == 'ar' ? $level->name_ar : $level->name_en }}</option>
                                    @endforeach
                                </select>
                                @error('education_level_id')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-md-6">
                                <label for="class_id" class="form-label">{{ app()->getLocale() == 'ar' ? 'المستوى الدراسي' : 'Class Level' }}</label>
                                <select name="class_id" id="class_id" class="form-select @error('class_id') is-invalid @enderror">
                                    <option value="">{{ app()->getLocale() == 'ar' ? 'اختر المستوى الدراسي' : 'Select Class Level' }}</option>
                                    @foreach($classLevels as $class)
                                    <option value="{{ $class->id }}" {{ old('class_id') == $class->id ? 'selected' : '' }}>{{ app()->getLocale() == 'ar' ? $class->name_ar : $class->name_en }}</option>
                                    @endforeach
                                </select>
                                @error('class_id')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-md-6">
                                <label for="service_id" class="form-label">{{ app()->getLocale() == 'ar' ? 'الخدمة' : 'Service' }}</label>
                                <select name="service_id" id="service_id" class="form-select @error('service_id') is-invalid @enderror">
                                    <option value="">{{ app()->getLocale() == 'ar' ? 'اختر الخدمة' : 'Select Service' }}</option>
                                    @foreach($services as $service)
                                    <option value="{{ $service->id }}" {{ old('service_id') == $service->id ? 'selected' : '' }}>{{ app()->getLocale() == 'ar' ? $service->name_ar : $service->name_en }}</option>
                                    @endforeach
                                </select>
                                @error('service_id')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-md-6">
                                <label for="course_type" class="form-label">{{ app()->getLocale() == 'ar' ? 'نوع الدورة' : 'Course Type' }} <span class="text-danger">*</span></label>
                                <select name="course_type" id="course_type" class="form-select @error('course_type') is-invalid @enderror" required>
                                    <option value="">{{ app()->getLocale() == 'ar' ? 'اختر النوع' : 'Select Type' }}</option>
                                    <option value="individual" {{ old('course_type') == 'individual' ? 'selected' : '' }}>{{ app()->getLocale() == 'ar' ? 'فردي' : 'Individual' }}</option>
                                    <option value="group" {{ old('course_type') == 'group' ? 'selected' : '' }}>{{ app()->getLocale() == 'ar' ? 'مجموعة' : 'Group' }}</option>
                                </select>
                                @error('course_type')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-md-6">
                                <label for="price" class="form-label">{{ app()->getLocale() == 'ar' ? 'السعر' : 'Price' }} <span class="text-danger">*</span></label>
                                <input type="number" step="0.01" name="price" id="price" class="form-control @error('price') is-invalid @enderror" value="{{ old('price') }}" required>
                                @error('price')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-md-6">
                                <label for="duration_hours" class="form-label">{{ app()->getLocale() == 'ar' ? 'مدة الدورة (بالساعات)' : 'Duration (hours)' }} <span class="text-danger">*</span></label>
                                <input type="number" step="0.5" name="duration_hours" id="duration_hours" class="form-control @error('duration_hours') is-invalid @enderror" value="{{ old('duration_hours', 1) }}" required>
                                @error('duration_hours')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-md-6">
                                <label for="status" class="form-label">{{ app()->getLocale() == 'ar' ? 'الحالة' : 'Status' }}</label>
                                <select name="status" id="status" class="form-select @error('status') is-invalid @enderror">
                                    <option value="active" {{ old('status') == 'active' ? 'selected' : '' }}>{{ __('courses.status_active') }}</option>
                                    <option value="inactive" {{ old('status') == 'inactive' ? 'selected' : '' }}>{{ __('courses.status_inactive') }}</option>
                                    <option value="draft" {{ old('status') == 'draft' ? 'selected' : '' }}>{{ __('courses.status_draft') }}</option>
                                </select>
                                @error('status')<div class="invalid-feedback">{{ $message }}</div>@enderror
                            </div>

                            <div class="col-md-12">
                                <label for="cover_image" class="form-label">{{ app()->getLocale() == 'ar' ? 'صورة الغلاف' : 'Cover Image' }}</label>
                                <input class="form-control @error('cover_image') is-invalid @enderror" type="file" id="cover_image" name="cover_image" accept="image/*">
                                @error('cover_image')<div class="invalid-feedback">{{ $message }}</div>@enderror
                                <div class="mt-2">
                                    <img id="coverPreview" src="{{ asset('images/course-placeholder.jpg') }}" alt="cover preview" style="max-width:240px;max-height:160px;border-radius:6px;">
                                </div>
                            </div>
                        </div>

                        <div class="card-footer text-end mt-3">
                            <a href="{{ route('teacher.courses.index') }}" class="btn btn-outline-secondary">{{ app()->getLocale() == 'ar' ? 'إلغاء' : 'Cancel' }}</a>
                            <button type="submit" class="btn btn-primary">{{ app()->getLocale() == 'ar' ? 'إنشاء' : 'Create' }}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
document.getElementById('cover_image').addEventListener('change', function(e){
    const el = document.getElementById('coverPreview');
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev){ el.src = ev.target.result; }
    reader.readAsDataURL(file);
});
</script>
@endpush
@endsection
