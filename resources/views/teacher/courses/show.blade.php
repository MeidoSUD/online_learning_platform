<!-- View: teacher/courses/show -->
@extends('layouts.app')

@section('title', $course->name . ' - ' . (app()->getLocale() == 'ar' ? 'المعلم' : 'Teacher'))
@section('content')
<div class="container-fluid py-4">
    <!-- Page Header -->
    <div class="row mb-4">
        <div class="col-12">
            <div class="d-flex justify-content-between align-items-center flex-wrap">
                <div class="mb-3 mb-md-0">
                    <h2 class="mb-1">{{ $course->name }}</h2>
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item"><a href="{{ route('teacher.dashboard') }}">{{ __('common.dashboard') }}</a></li>
                            <li class="breadcrumb-item"><a href="{{ route('teacher.courses.index') }}">{{ __('courses.courses') }}</a></li>
                            <li class="breadcrumb-item active">{{ $course->name }}</li>
                        </ol>
                    </nav>
                </div>
                <div class="d-flex gap-2">
                    <a href="{{ route('teacher.courses.edit', $course->id) }}" class="btn btn-warning">
                        <i class="fas fa-edit me-2"></i>{{ app()->getLocale() == 'ar' ? 'تعديل' : 'Edit' }}
                    </a>
                    <a href="{{ route('teacher.courses.sessions', $course->id) }}" class="btn btn-success">
                        <i class="fas fa-chalkboard-teacher me-2"></i>{{ app()->getLocale() == 'ar' ? 'الجلسات' : 'Sessions' }}
                    </a>
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

    <!-- Course Statistics -->
    <div class="row g-4 mb-4">
        <div class="col-md-3">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="icon-box bg-primary bg-opacity-10 text-primary rounded-circle p-3 me-3">
                            <i class="fas fa-users fs-4"></i>
                        </div>
                        <div>
                            <h6 class="text-muted mb-1">{{ app()->getLocale() == 'ar' ? 'إجمالي التسجيلات' : 'Total Enrollments' }}</h6>
                            <h3 class="mb-0">{{ $stats['total_enrollments'] }}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="icon-box bg-success bg-opacity-10 text-success rounded-circle p-3 me-3">
                            <i class="fas fa-user-check fs-4"></i>
                        </div>
                        <div>
                            <h6 class="text-muted mb-1">{{ app()->getLocale() == 'ar' ? 'الطلاب النشطون' : 'Active Students' }}</h6>
                            <h3 class="mb-0">{{ $stats['active_enrollments'] }}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="icon-box bg-info bg-opacity-10 text-info rounded-circle p-3 me-3">
                            <i class="fas fa-chalkboard fs-4"></i>
                        </div>
                        <div>
                            <h6 class="text-muted mb-1">{{ app()->getLocale() == 'ar' ? 'إجمالي الجلسات' : 'Total Sessions' }}</h6>
                            <h3 class="mb-0">{{ $stats['total_sessions'] }}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="icon-box bg-success bg-opacity-10 text-success rounded-circle p-3 me-3">
                            <i class="fas fa-check-circle fs-4"></i>
                        </div>
                        <div>
                            <h6 class="text-muted mb-1">{{ app()->getLocale() == 'ar' ? 'الجلسات المكتملة' : 'Completed Sessions' }}</h6>
                            <h3 class="mb-0">{{ $stats['completed_sessions'] }}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="row g-4">
        <!-- Course Details -->
        <div class="col-lg-4">
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="fas fa-info-circle me-2"></i>{{ app()->getLocale() == 'ar' ? 'تفاصيل الدورة' : 'Course Details' }}</h5>
                </div>
                <div class="card-body">
                    @if($course->coverImage)
                    <img src="{{ Storage::url($course->coverImage->file_path) }}" class="img-fluid rounded mb-3" alt="{{ $course->name }}">
                    @endif

                    <div class="detail-item mb-3">
                        <small class="text-muted d-block">{{ app()->getLocale() == 'ar' ? 'حالة الدورة' : 'Course Status' }}</small>
                        <span class="badge badge-{{ $course->status == 'active' ? 'success' : ($course->status == 'inactive' ? 'secondary' : 'warning') }}">
                            {{ __('courses.status_' . $course->status) }}
                        </span>
                    </div>

                    <div class="detail-item mb-3">
                        <small class="text-muted d-block">{{ app()->getLocale() == 'ar' ? 'نوع الدورة' : 'Course Type' }}</small>
                        <strong>
                            <i class="fas fa-{{ $course->course_type == 'individual' ? 'user' : 'users' }} me-1"></i>
                            {{ __('courses.type_' . $course->course_type) }}
                        </strong>
                    </div>

                    @if($course->category)
                    <div class="detail-item mb-3">
                        <small class="text-muted d-block">{{ app()->getLocale() == 'ar' ? 'فئة الدورة' : 'Course Category' }}</small>
                        <strong>{{ $course->category->name }}</strong>
                    </div>
                    @endif

                    @if($course->subject)
                    <div class="detail-item mb-3">
                        <small class="text-muted d-block">{{ app()->getLocale() == 'ar' ? 'موضوع الدورة' : 'Course Subject' }}</small>
                        <strong>{{ $course->subject->name }}</strong>
                    </div>
                    @endif

                    <div class="detail-item mb-3">
                        <small class="text-muted d-block">{{ app()->getLocale() == 'ar' ? 'سعر الدورة' : 'Course Price' }}</small>
                        <strong class="text-primary fs-5">{{ number_format($course->price, 2) }} {{ __('common.currency') }}</strong>
                    </div>

                    <div class="detail-item mb-3">
                        <small class="text-muted d-block">{{ app()->getLocale() == 'ar' ? 'مدة الدورة' : 'Course Duration' }}</small>
                        <strong>{{ $course->duration_hours }} {{ __('courses.hours') }}</strong>
                    </div>

                    <div class="detail-item mb-3">
                        <small class="text-muted d-block">{{ app()->getLocale() == 'ar' ? 'وصف الدورة' : 'Course Description' }}</small>
                        <p class="mb-0">{{ $course->description }}</p>
                    </div>

                    <!-- Status Change -->
                    <hr>
                    <form action="{{ route('teacher.courses.update-status', $course->id) }}" method="POST">
                        @csrf
                        @method('PATCH')
                        <label class="form-label">{{ app()->getLocale() == 'ar' ? 'تغيير الحالة' : 'Change Status' }}</label>
                        <div class="input-group">
                            <select name="status" class="form-select">
                                <option value="active" {{ $course->status == 'active' ? 'selected' : '' }}>{{ __('courses.status_active') }}</option>
                                <option value="inactive" {{ $course->status == 'inactive' ? 'selected' : '' }}>{{ __('courses.status_inactive') }}</option>
                                <option value="draft" {{ $course->status == 'draft' ? 'selected' : '' }}>{{ __('courses.status_draft') }}</option>
                                <option value="completed" {{ $course->status == 'completed' ? 'selected' : '' }}>{{ __('courses.status_completed') }}</option>
                            </select>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Enrolled Students -->
        <div class="col-lg-8">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="fas fa-users me-2"></i>{{ app()->getLocale() == 'ar' ? 'الطلاب المسجلين' : 'Enrolled Students' }}</h5>
                    <a href="{{ route('teacher.courses.students', $course->id) }}" class="btn btn-sm btn-outline-primary">
                        {{ app()->getLocale() == 'ar' ? 'عرض الكل' : 'View All' }}
                    </a>
                </div>
                <div class="card-body p-0">
                    @if($enrollments->count() > 0)
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>{{ app()->getLocale() == 'ar' ? 'الطالب' : 'Student' }}</th>
                                    <th>{{ app()->getLocale() == 'ar' ? 'تاريخ التسجيل' : 'Enrollment Date' }}</th>
                                    <th>{{ app()->getLocale() == 'ar' ? 'الحالة' : 'Status' }}</th>
                                    <th>{{ app()->getLocale() == 'ar' ? 'التقدم' : 'Progress' }}</th>
                                    <th>{{ app()->getLocale() == 'ar' ? 'الجلسات' : 'Sessions' }}</th>
                                    <th>{{ app()->getLocale() == 'ar' ? 'الإجراءات' : 'Actions' }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($enrollments as $enrollment)
                                <tr>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <div class="avatar-circle bg-primary text-white me-2">
                                                {{ substr($enrollment->student->first_name, 0, 1) }}{{ substr($enrollment->student->last_name, 0, 1) }}
                                            </div>
                                            <div>
                                                <strong>{{ $enrollment->student->first_name }} {{ $enrollment->student->last_name }}</strong>
                                                <br>
                                                <small class="text-muted">{{ $enrollment->student->email }}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{{ $enrollment->enrollment_date ? \Carbon\Carbon::parse($enrollment->enrollment_date)->format('M d, Y') : '-' }}</td>
                                    <td>
                                        <span class="badge badge-{{ $enrollment->status == 'active' ? 'success' : ($enrollment->status == 'completed' ? 'primary' : 'secondary') }}">
                                            {{ app()->getLocale() == 'ar' ? 'الحالة' : 'Status' }}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="progress" style="height: 20px;">
                                            <div class="progress-bar" role="progressbar" style="width: {{ $enrollment->progress ?? 0 }}%">
                                                {{ $enrollment->progress ?? 0 }}%
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="badge bg-info">{{ $enrollment->sessions->count() }} {{ app()->getLocale() == 'ar' ? 'جلسة' : 'Sessions' }}</span>
                                    </td>
                                    <td>
                                        <a href="{{ route('teacher.courses.sessions', ['course' => $course->id, 'student_id' => $enrollment->student_id]) }}" class="btn btn-sm btn-outline-primary">
                                            <i class="fas fa-eye"></i>
                                        </a>
                                    </td>
                                </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                    <div class="p-3">
                        {{ $enrollments->links() }}
                    </div>
                    @else
                    <div class="text-center py-5">
                        <i class="fas fa-user-slash fa-3x text-muted mb-3"></i>
                        <p class="text-muted">{{ app()->getLocale() == 'ar' ? 'لا يوجد طلاب مسجلين' : 'No Students Enrolled' }}</p>
                    </div>
                    @endif
                </div>
            </div>
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

    .detail-item {
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
    }

    .detail-item:last-child {
        border-bottom: none;
    }

    .avatar-circle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
    }

    [dir="rtl"] .icon-box {
        margin-right: 0;
        margin-left: 1rem;
    }
</style>
@endpush
@endsection