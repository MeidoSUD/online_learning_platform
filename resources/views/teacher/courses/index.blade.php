<!-- View: teacher/courses/index -->
@extends('layouts.app')

@section('title', app()->getLocale() == 'ar' ? 'دوراتي' : 'My Courses')

@section('content')
<div class="container-fluid py-4">
    <!-- Page Header -->
    <div class="row mb-4">
        <div class="col-12">
            <div class="d-flex justify-content-between align-items-center flex-wrap">
                <div class="mb-3 mb-md-0">
                    <h2 class="mb-1">{{ app()->getLocale() == 'ar' ? 'دوراتي' : 'My Courses' }}</h2>
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item"><a href="{{ route('teacher.dashboard') }}">{{ app()->getLocale() == 'ar' ? 'الرئيسية' : 'Dashboard' }}</a></li>
                            <li class="breadcrumb-item active">{{ app()->getLocale() == 'ar' ? 'الدورات' : 'Courses' }}</li>
                        </ol>
                    </nav>
                </div>
                <a href="{{ route('teacher.courses.create') }}" class="btn btn-primary">
                    <i class="fas fa-plus me-2"></i>{{ app()->getLocale() == 'ar' ? 'إنشاء دورة جديدة' : 'Create New Course' }}
                </a>
            </div>
        </div>
    </div>

    <!-- Statistics Cards -->
    <div class="row g-4 mb-4">
        <div class="col-md-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="icon-box bg-primary bg-opacity-10 text-primary rounded-circle p-3 me-3">
                            <i class="fas fa-book fs-4"></i>
                        </div>
                        <div>
                            <h6 class="text-muted mb-1">{{ app()->getLocale() == 'ar' ? 'إجمالي الدورات' : 'Total Courses' }}</h6>
                            <h3 class="mb-0">{{ $stats['total_courses'] }}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="icon-box bg-success bg-opacity-10 text-success rounded-circle p-3 me-3">
                            <i class="fas fa-check-circle fs-4"></i>
                        </div>
                        <div>
                            <h6 class="text-muted mb-1">{{ app()->getLocale() == 'ar' ? 'الدورات النشطة' : 'Active Courses' }}</h6>
                            <h3 class="mb-0">{{ $stats['active_courses'] }}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="icon-box bg-info bg-opacity-10 text-info rounded-circle p-3 me-3">
                            <i class="fas fa-users fs-4"></i>
                        </div>
                        <div>
                            <h6 class="text-muted mb-1">{{ app()->getLocale() == 'ar' ? 'إجمالي الطلاب' : 'Total Students' }}</h6>
                            <h3 class="mb-0">{{ $stats['total_students'] }}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="icon-box bg-warning bg-opacity-10 text-warning rounded-circle p-3 me-3">
                            <i class="fas fa-chalkboard-teacher fs-4"></i>
                        </div>
                        <div>
                            <h6 class="text-muted mb-1">{{ app()->getLocale() == 'ar' ? 'إجمالي الجلسات' : 'Total Sessions' }}</h6>
                            <h3 class="mb-0">{{ $stats['total_sessions'] }}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Alerts -->
    @if(session('success'))
    <div class="alert alert-success alert-dismissible fade show" role="alert">
        <i class="fas fa-check-circle me-2"></i>{{ session('success') }}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
    @endif

    @if(session('error'))
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <i class="fas fa-exclamation-circle me-2"></i>{{ session('error') }}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
    @endif

    <!-- Filters -->
    <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
            <form method="GET" action="{{ route('teacher.courses.index') }}" class="row g-3">
                <div class="col-md-3">
                    <input type="text" name="search" class="form-control" placeholder="{{ app()->getLocale() == 'ar' ? 'ابحث...' : 'Search...' }}" value="{{ request('search') }}">
                </div>
                <div class="col-md-2">
                    <select name="status" class="form-select">
                        <option value="">{{ app()->getLocale() == 'ar' ? 'جميع الحالات' : 'All Statuses' }}</option>
                        @foreach($statuses as $status)
                        <option value="{{ $status }}" {{ request('status') == $status ? 'selected' : '' }}>
                            {{ app()->getLocale() == 'ar' ? 'الحالة ' . $status : 'Status ' . $status }}
                        </option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-2">
                    <select name="course_type" class="form-select">
                        <option value="">{{ app()->getLocale() == 'ar' ? 'جميع الأنواع' : 'All Types' }}</option>
                        @foreach($courseTypes as $type)
                        <option value="{{ $type }}" {{ request('course_type') == $type ? 'selected' : '' }}>
                            {{ app()->getLocale() == 'ar' ? 'نوع الدورة ' . $type : 'Course Type ' . $type }}
                        </option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-3">
                    <select name="category_id" class="form-select">
                        <option value="">{{ app()->getLocale() == 'ar' ? 'جميع الفئات' : 'All Categories' }}</option>
                        @foreach($categories as $category)
                        <option value="{{ $category->id }}" {{ request('category_id') == $category->id ? 'selected' : '' }}>
                            {{ app()->getLocale() == 'ar' ? $category->name_ar : $category->name_en }}
                        </option>
                        @endforeach
                    </select>
                </div>
                <div class="col-md-2">
                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-filter me-2"></i>{{ app()->getLocale() == 'ar' ? 'تصفية' : 'Filter' }}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <!-- Courses Grid -->
    @if($courses->count() > 0)
    <div class="row g-4">
        @foreach($courses as $course)
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 border-0 shadow-sm course-card">
                <!-- Course Image -->
                <div class="course-image position-relative">
                    @if($course->coverImage)
                    <img src="{{ Storage::url($course->coverImage->file_path) }}" class="card-img-top" alt="{{ $course->name }}">
                    @else
                    <img src="https://via.placeholder.com/400x250?text=No+Image" class="card-img-top" alt="{{ $course->name }}">
                    @endif
                    
                    <!-- Status Badge -->
                    <span class="badge position-absolute top-0 end-0 m-3 badge-{{ $course->status == 'active' ? 'success' : ($course->status == 'inactive' ? 'secondary' : 'warning') }}">
                        {{ app()->getLocale() == 'ar' ? 'الحالة ' . $course->status : 'Status ' . $course->status }}
                    </span>

                    <!-- Course Type Badge -->
                    <span class="badge position-absolute top-0 start-0 m-3 bg-dark">
                        <i class="fas fa-{{ $course->course_type == 'individual' ? 'user' : 'users' }} me-1"></i>
                        {{ app()->getLocale() == 'ar' ? 'نوع الدورة ' . $course->course_type : 'Course Type ' . $course->course_type }}
                    </span>
                </div>

                <div class="card-body d-flex flex-column">
                    <!-- Category -->
                    @if($course->category)
                    <div class="mb-2">
                        <span class="badge bg-primary bg-opacity-10 text-primary">
                            {{ $course->category->name }}
                        </span>
                    </div>
                    @endif

                    <!-- Course Name -->
                    <h5 class="card-title mb-2">{{ Str::limit($course->name, 50) }}</h5>

                    <!-- Course Description -->
                    <p class="card-text text-muted small mb-3">
                        {{ Str::limit($course->description, 100) }}
                    </p>

                    <!-- Course Details -->
                    <div class="course-details mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="text-muted small">
                                <i class="fas fa-clock me-1"></i>{{ $course->duration_hours }} {{ app()->getLocale() == 'ar' ? 'ساعة' : 'Hours' }}
                            </span>
                            <span class="text-primary fw-bold">
                                {{ number_format($course->price, 2) }} {{ app()->getLocale() == 'ar' ? 'ريال سعودي' : 'SAR' }}
                            </span>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-muted small">
                                <i class="fas fa-users me-1"></i>
                                {{ $course->enrollments->count() }} {{ app()->getLocale() == 'ar' ? 'طالب' : 'Students' }}
                            </span>
                            @if($course->subject)
                            <span class="text-muted small">
                                <i class="fas fa-book me-1"></i>{{ $course->subject->name }}
                            </span>
                            @endif
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="mt-auto">
                        <div class="d-flex gap-2 flex-wrap">
                            <a href="{{ route('teacher.courses.show', $course->id) }}" class="btn btn-sm btn-outline-primary flex-fill">
                                <i class="fas fa-eye me-1"></i>{{ app()->getLocale() == 'ar' ? 'عرض' : 'View' }}
                            </a>
                            <a href="{{ route('teacher.courses.edit', $course->id) }}" class="btn btn-sm btn-outline-warning flex-fill">
                                <i class="fas fa-edit me-1"></i>{{ app()->getLocale() == 'ar' ? 'تعديل' : 'Edit' }}
                            </a>
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteCourse({{ $course->id }})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div class="d-grid mt-2">
                            <a href="{{ route('teacher.courses.sessions', $course->id) }}" class="btn btn-sm btn-success">
                                <i class="fas fa-chalkboard-teacher me-1"></i>{{ app()->getLocale() == 'ar' ? 'إدارة الجلسات' : 'Manage Sessions' }}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        @endforeach
    </div>

    <!-- Pagination -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="d-flex justify-content-center">
                {{ $courses->links() }}
            </div>
        </div>
    </div>
    @else
    <!-- Empty State -->
    <div class="row">
        <div class="col-12">
            <div class="card border-0 shadow-sm">
                <div class="card-body text-center py-5">
                    <div class="mb-4">
                        <i class="fas fa-book-open fa-5x text-muted"></i>
                    </div>
                    <h4 class="text-muted mb-3">{{ app()->getLocale() == 'ar' ? 'لا توجد دورات' : 'No Courses' }}</h4>
                    <p class="text-muted mb-4">{{ app()->getLocale() == 'ar' ? 'لا توجد دورات متاحة في الوقت الحالي.' : 'There are no courses available at the moment.' }}</p>
                    <a href="{{ route('teacher.courses.create') }}" class="btn btn-primary">
                        <i class="fas fa-plus me-2"></i>{{ app()->getLocale() == 'ar' ? 'إنشاء دورة جديدة' : 'Create First Course' }}
                    </a>
                </div>
            </div>
        </div>
    </div>
    @endif
</div>

<!-- Delete Confirmation Modal -->
<div class="modal fade" id="deleteCourseModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <form id="deleteCourseForm" method="POST">
                @csrf
                @method('DELETE')
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-exclamation-triangle me-2"></i>{{ app()->getLocale() == 'ar' ? 'تأكيد الحذف' : 'Delete Confirmation' }}
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>{{ app()->getLocale() == 'ar' ? 'هل أنت متأكد أنك تريد حذف هذه الدورة؟' : 'Are you sure you want to delete this course?' }}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ app()->getLocale() == 'ar' ? 'إلغاء' : 'Cancel' }}</button>
                    <button type="submit" class="btn btn-danger">
                        <i class="fas fa-trash me-2"></i>{{ app()->getLocale() == 'ar' ? 'حذف' : 'Delete' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

@push('styles')
<style>
    .icon-box {
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .course-card {
        transition: all 0.3s ease;
    }

    .course-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
    }

    .course-image {
        height: 200px;
        overflow: hidden;
    }

    .course-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
    }

    .course-card:hover .course-image img {
        transform: scale(1.05);
    }

    [dir="rtl"] .icon-box {
        margin-right: 0;
        margin-left: 1rem;
    }
</style>
@endpush

@push('scripts')
<script>
    function deleteCourse(id) {
        const form = document.getElementById('deleteCourseForm');
        form.action = `{{ route('teacher.courses.destroy', ':id') }}`.replace(':id', id);
        const modal = new bootstrap.Modal(document.getElementById('deleteCourseModal'));
        modal.show();
    }
</script>
@endpush
@endsection