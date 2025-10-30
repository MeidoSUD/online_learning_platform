
@extends('layouts.app')

@section('title', $course->name . ' - ' . (app()->getLocale() == 'ar' ? 'تعديل الدورة' : 'Edit Course'))

@section('content')
<div class="container-fluid py-4">
    <div class="row mb-4">
        <div class="col-12">
            <h2 class="mb-1">{{ app()->getLocale() == 'ar' ? 'تعديل الدورة' : 'Edit Course' }}</h2>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item"><a href="{{ route('teacher.dashboard') }}">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</a></li>
                    <li class="breadcrumb-item"><a href="{{ route('teacher.courses.index') }}">{{ app()->getLocale() == 'ar' ? 'الدورات' : 'Courses' }}</a></li>
                    <li class="breadcrumb-item active">{{ $course->name }}</li>
                </ol>
            </nav>
        </div>
    </div>

    @if($errors->any())
    <div class="alert alert-danger">
        <ul class="mb-0">
            @foreach($errors->all() as $err)<li>{{ $err }}</li>@endforeach
        </ul>
    </div>
    @endif

    <div class="row">
        <div class="col-lg-10 mx-auto">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-warning text-dark">
                    <h5 class="mb-0"><i class="fas fa-edit me-2"></i>{{ app()->getLocale() == 'ar' ? 'تعديل الدورة' : 'Edit Course' }}</h5>
                </div>
                <div class="card-body">
                    <form action="{{ route('teacher.courses.update', $course->id) }}" method="POST" enctype="multipart/form-data">
                        @csrf
                        @method('PATCH')

                        <div class="row g-3">
                            <div class="col-md-12">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'اسم الدورة' : 'Course Name' }} <span class="text-danger">*</span></label>
                                <input type="text" name="name" class="form-control" value="{{ old('name', $course->name) }}" required>
                            </div>

                            <div class="col-md-12">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'وصف الدورة' : 'Course Description' }} <span class="text-danger">*</span></label>
                                <textarea name="description" rows="4" class="form-control" required>{{ old('description', $course->description) }}</textarea>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'الفئة' : 'Category' }}</label>
                                <select name="category_id" class="form-select">
                                    <option value="">{{ app()->getLocale() == 'ar' ? 'اختر الفئة' : 'Select Category' }}</option>
                                    @foreach($categories as $category)
                                    <option value="{{ $category->id }}" {{ old('category_id', $course->category_id) == $category->id ? 'selected' : '' }}>{{ $category->name }}</option>
                                    @endforeach
                                </select>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">{{ __('courses.subject') }}</label>
                                <select name="subject_id" class="form-select">
                                    <option value="">{{ __('courses.select_subject') }}</option>
                                    @foreach($subjects as $subject)
                                    <option value="{{ $subject->id }}" {{ old('subject_id', $course->subject_id) == $subject->id ? 'selected' : '' }}>{{ $subject->name }}</option>
                                    @endforeach
                                </select>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'المستوى التعليمي' : 'Education Level' }}</label>
                                <select name="education_level_id" class="form-select">
                                    <option value="">{{ app()->getLocale() == 'ar' ? 'اختر المستوى التعليمي' : 'Select Education Level' }}</option>
                                    @foreach($educationLevels as $level)
                                    <option value="{{ $level->id }}" {{ old('education_level_id', $course->education_level_id) == $level->id ? 'selected' : '' }}>{{ $level->name }}</option>
                                    @endforeach
                                </select>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'المستوى الدراسي' : 'Class Level' }}</label>
                                <select name="class_id" class="form-select">
                                    <option value="">{{ app()->getLocale() == 'ar' ? 'اختر المستوى الدراسي' : 'Select Class Level' }}</option>
                                    @foreach($classLevels as $class)
                                    <option value="{{ $class->id }}" {{ old('class_id', $course->class_id) == $class->id ? 'selected' : '' }}>{{ $class->name }}</option>
                                    @endforeach
                                </select>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'الخدمة' : 'Service' }}</label>
                                <select name="service_id" class="form-select">
                                    <option value="">{{ app()->getLocale() == 'ar' ? 'اختر الخدمة' : 'Select Service' }}</option>
                                    @foreach($services as $service)
                                    <option value="{{ $service->id }}" {{ old('service_id', $course->service_id) == $service->id ? 'selected' : '' }}>{{ $service->name }}</option>
                                    @endforeach
                                </select>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'نوع الدورة' : 'Course Type' }}</label>
                                <select name="course_type" class="form-select">
                                    <option value="individual" {{ old('course_type', $course->course_type) == 'individual' ? 'selected' : '' }}>{{ app()->getLocale() == 'ar' ? 'فردي' : 'Individual' }}</option>
                                    <option value="group" {{ old('course_type', $course->course_type) == 'group' ? 'selected' : '' }}>{{ app()->getLocale() == 'ar' ? 'مجموعة' : 'Group' }}</option>
                                </select>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'السعر' : 'Price' }}</label>
                                <input type="number" step="0.01" name="price" class="form-control" value="{{ old('price', $course->price) }}" required>
                            </div>

                            <div class="col-md-6">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'مدة الدورة (بالساعات)' : 'Duration (hours)' }}</label>
                                <input type="number" step="0.5" name="duration_hours" class="form-control" value="{{ old('duration_hours', $course->duration_hours) }}" required>
                            </div>

                            <div class="col-md-12">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'صورة الغلاف' : 'Cover Image' }}</label>
                                <input class="form-control" type="file" name="cover_image" accept="image/*">
                                <div class="mt-2">
                                    @if($course->coverImage)
                                        <img id="coverPreview" src="{{ Storage::url($course->coverImage->file_path) }}" alt="cover preview" style="max-width:240px;max-height:160px;border-radius:6px;">
                                    @else
                                        <img id="coverPreview" src="{{ asset('images/course-placeholder.jpg') }}" alt="cover preview" style="max-width:240px;max-height:160px;border-radius:6px;">
                                    @endif
                                </div>
                            </div>
                        </div>

                        <div class="card-footer text-end mt-3">
                            <a href="{{ route('teacher.courses.show', $course->id) }}" class="btn btn-outline-secondary">{{ app()->getLocale() == 'ar' ? 'إلغاء' : 'Cancel' }}</a>
                            <button type="submit" class="btn btn-success">{{ app()->getLocale() == 'ar' ? 'حفظ التغييرات' : 'Save Changes' }}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
document.querySelectorAll('input[type="file"][name="cover_image"]').forEach(function(el){
    el.addEventListener('change', function(e){
        const img = document.getElementById('coverPreview');
        const file = e.target.files[0];
        if (!file || !img) return;
        const reader = new FileReader();
        reader.onload = function(ev){ img.src = ev.target.result; }
        reader.readAsDataURL(file);
    });
});
</script>
@endpush
@endsection
