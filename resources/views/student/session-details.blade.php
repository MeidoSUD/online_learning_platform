
@extends('layouts.app')

@section('title', app()->getLocale() == 'ar' ? 'تفاصيل الجلسة' : 'Session Details')

@section('content')
<div class="container-fluid">
    <!-- Header -->
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h2 class="mb-1">
                        {{ app()->getLocale() == 'ar' ? 'تفاصيل الجلسة' : 'Session Details' }} #{{ $session->session_number }}
                    </h2>
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item"><a href="{{ route('student.dashboard') }}">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</a></li>
                            <li class="breadcrumb-item"><a href="{{ route('student.calendar') }}">{{ app()->getLocale() == 'ar' ? 'التقويم' : 'Calendar' }}</a></li>
                            <li class="breadcrumb-item active">{{ app()->getLocale() == 'ar' ? 'تفاصيل الجلسة' : 'Session Details' }}</li>
                        </ol>
                    </nav>
                </div>
                <a href="{{ route('student.calendar') }}" class="btn btn-secondary">
                    <i class="bi bi-arrow-left"></i> {{ app()->getLocale() == 'ar' ? 'العودة للتقويم' : 'Back to Calendar' }}
                </a>
            </div>
        </div>
    </div>

    <div class="row">
        <!-- Main Session Info -->
        <div class="col-lg-8 mb-4">
            <!-- Session Status Card -->
            <div class="card shadow-sm mb-4">
                <div class="card-header 
                    @if($session->status == 'completed') bg-success text-white
                    @elseif($session->status == 'cancelled') bg-danger text-white
                    @elseif($session->status == 'in_progress') bg-warning text-dark
                    @else bg-primary text-white
                    @endif">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
                            <i class="bi bi-info-circle me-2"></i>
                            {{ app()->getLocale() == 'ar' ? 'معلومات الجلسة' : 'Session Information' }}
                        </h5>
                        <span class="badge 
                            @if($session->status == 'completed') bg-light text-success
                            @elseif($session->status == 'cancelled') bg-light text-danger
                            @elseif($session->status == 'in_progress') bg-light text-warning
                            @else bg-light text-primary
                            @endif fs-6">
                            {{ ucfirst($session->status) }}
                        </span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <p class="mb-2">
                                <strong><i class="bi bi-hash text-primary"></i> {{ app()->getLocale() == 'ar' ? 'رقم الجلسة:' : 'Session Number:' }}</strong><br>
                                <span class="ms-4">{{ $session->session_number }}</span>
                            </p>
                            <p class="mb-2">
                                <strong><i class="bi bi-calendar text-primary"></i> {{ app()->getLocale() == 'ar' ? 'التاريخ:' : 'Date:' }}</strong><br>
                                <span class="ms-4">{{ \Carbon\Carbon::parse($session->session_date)->format('l, F d, Y') }}</span>
                            </p>
                            <p class="mb-2">
                                <strong><i class="bi bi-clock text-primary"></i> {{ app()->getLocale() == 'ar' ? 'الوقت:' : 'Time:' }}</strong><br>
                                <span class="ms-4">{{ \Carbon\Carbon::parse($session->start_time)->format('h:i A') }} - {{ \Carbon\Carbon::parse($session->end_time)->format('h:i A') }}</span>
                            </p>
                        </div>
                        <div class="col-md-6">
                            <p class="mb-2">
                                <strong><i class="bi bi-hourglass text-primary"></i> {{ app()->getLocale() == 'ar' ? 'المدة:' : 'Duration:' }}</strong><br>
                                <span class="ms-4">{{ $session->duration }} {{ app()->getLocale() == 'ar' ? 'دقيقة' : 'minutes' }}</span>
                            </p>
                            <p class="mb-2">
                                <strong><i class="bi bi-person text-primary"></i> {{ app()->getLocale() == 'ar' ? 'المعلم:' : 'Teacher:' }}</strong><br>
                                <span class="ms-4">{{ $session->teacher->name ?? 'N/A' }}</span>
                            </p>
                            <p class="mb-2">
                                <strong><i class="bi bi-tag text-primary"></i> {{ app()->getLocale() == 'ar' ? 'الحالة:' : 'Status:' }}</strong><br>
                                <span class="ms-4">
                                    <span class="badge 
                                        @if($session->status == 'completed') bg-success
                                        @elseif($session->status == 'cancelled') bg-danger
                                        @elseif($session->status == 'in_progress') bg-warning
                                        @else bg-primary
                                        @endif">
                                        {{ ucfirst($session->status) }}
                                    </span>
                                </span>
                            </p>
                        </div>
                    </div>

                    @if($session->started_at)
                        <hr>
                        <div class="row">
                            <div class="col-md-6">
                                <p class="mb-0">
                                    <strong><i class="bi bi-play-circle text-success"></i> {{ app()->getLocale() == 'ar' ? 'بدأت في:' : 'Started At:' }}</strong><br>
                                    <span class="ms-4">{{ \Carbon\Carbon::parse($session->started_at)->format('h:i A') }}</span>
                                </p>
                            </div>
                            @if($session->ended_at)
                                <div class="col-md-6">
                                    <p class="mb-0">
                                        <strong><i class="bi bi-stop-circle text-danger"></i> {{ app()->getLocale() == 'ar' ? 'انتهت في:' : 'Ended At:' }}</strong><br>
                                        <span class="ms-4">{{ \Carbon\Carbon::parse($session->ended_at)->format('h:i A') }}</span>
                                    </p>
                                </div>
                            @endif
                        </div>
                    @endif
                </div>
            </div>

            <!-- Host Meeting Card -->
            @if($session->host_url && $session->status != 'completed' && $session->status != 'cancelled')
                <div class="card shadow-sm mb-4 border-success">
                    <div class="card-header bg-success text-white">
                        <h5 class="mb-0">
                            <i class="bi bi-camera-video me-2"></i>
                            {{ app()->getLocale() == 'ar' ? 'بدء الجلسة' : 'Start Session' }}
                        </h5>
                    </div>
                    <div class="card-body text-center">
                        <i class="bi bi-camera-video-fill text-success" style="font-size: 3rem;"></i>
                        <h5 class="mt-3">{{ app()->getLocale() == 'ar' ? 'جاهز للبدء!' : 'Ready to Start!' }}</h5>
                        <p class="text-muted">
                            {{ app()->getLocale() == 'ar' ? 'انقر على الزر أدناه لبدء الجلسة كمضيف' : 'Click the button below to start the session as host' }}
                        </p>
                        <a href="{{ $session->host_url }}" target="_blank" class="btn btn-success btn-lg">
                            <i class="bi bi-box-arrow-up-right me-2"></i>
                            {{ app()->getLocale() == 'ar' ? 'بدء الجلسة الآن' : 'Start Session Now' }}
                        </a>
                        @if($session->meeting_id)
                            <p class="mt-3 mb-0 small text-muted">
                                {{ app()->getLocale() == 'ar' ? 'رقم الاجتماع:' : 'Meeting ID:' }} <strong>{{ $session->meeting_id }}</strong>
                            </p>
                        @endif
                    </div>
                </div>
            @endif

            <!-- Add/Edit Notes Form -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-info text-white">
                    <h6 class="mb-0">
                        <i class="bi bi-journal-text me-2"></i>
                        {{ app()->getLocale() == 'ar' ? 'ملاحظات المعلم' : 'Teacher Notes' }}
                    </h6>
                </div>
                <div class="card-body">
                    @if($session->teacher_notes)
                        <div class="alert alert-info">
                            <strong>{{ app()->getLocale() == 'ar' ? 'الملاحظات الحالية:' : 'Current Notes:' }}</strong>
                            <p class="mb-0 mt-2">{{ $session->teacher_notes }}</p>
                        </div>
                    @else
                        <p class="text-muted">{{ app()->getLocale() == 'ar' ? 'لم تتم إضافة ملاحظات بعد' : 'No notes added yet' }}</p>
                    @endif
                </div>
            </div>

            <!-- Homework Section -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-warning text-dark">
                    <h6 class="mb-0">
                        <i class="bi bi-clipboard-check me-2"></i>
                        {{ app()->getLocale() == 'ar' ? 'الواجب المنزلي' : 'Homework' }}
                    </h6>
                </div>
                <div class="card-body">
                    @if($session->homework)
                        <div class="alert alert-warning">
                            <strong>{{ app()->getLocale() == 'ar' ? 'الواجب المنزلي:' : 'Homework:' }}</strong>
                            <p class="mb-0 mt-2">{{ $session->homework }}</p>
                        </div>
                    @else
                        <p class="text-muted">{{ app()->getLocale() == 'ar' ? 'لم يتم تعيين واجب منزلي' : 'No homework assigned' }}</p>
                    @endif
                </div>
            </div>

            <!-- Materials Shared -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-secondary text-white">
                    <h6 class="mb-0">
                        <i class="bi bi-file-earmark-text me-2"></i>
                        {{ app()->getLocale() == 'ar' ? 'المواد المشتركة' : 'Materials Shared' }}
                    </h6>
                </div>
                <div class="card-body">
                    @if($session->materials_shared)
                        <div class="alert alert-secondary">
                            <p class="mb-0">{{ $session->materials_shared }}</p>
                        </div>
                    @else
                        <p class="text-muted">{{ app()->getLocale() == 'ar' ? 'لم تتم مشاركة مواد' : 'No materials shared' }}</p>
                    @endif
                </div>
            </div>

            <!-- Rating Section -->
            @if($session->status == 'completed')
                <div class="card shadow-sm">
                    <div class="card-header bg-warning text-dark">
                        <h6 class="mb-0">
                            <i class="bi bi-star me-2"></i>
                            {{ app()->getLocale() == 'ar' ? 'التقييمات' : 'Ratings' }}
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <strong>{{ app()->getLocale() == 'ar' ? 'تقييم الطالب للجلسة:' : 'Student Rating:' }}</strong>
                                <div class="mt-2">
                                    @if($session->student_rating)
                                        @for($i = 1; $i <= 5; $i++)
                                            <i class="bi bi-star-fill {{ $i <= $session->student_rating ? 'text-warning' : 'text-muted' }}"></i>
                                        @endfor
                                        <span class="ms-2">({{ $session->student_rating }}/5)</span>
                                    @else
                                        <span class="text-muted">{{ app()->getLocale() == 'ar' ? 'لم يقيم الطالب بعد' : 'Not rated yet' }}</span>
                                    @endif
                                </div>
                            </div>
                            <div class="col-md-6">
                                <strong>{{ app()->getLocale() == 'ar' ? 'تقييمك للطالب:' : 'Your Rating for Student:' }}</strong>
                                <div class="mt-2">
                                    @if($session->teacher_rating)
                                        @for($i = 1; $i <= 5; $i++)
                                            <i class="bi bi-star-fill {{ $i <= $session->teacher_rating ? 'text-warning' : 'text-muted' }}"></i>
                                        @endfor
                                        <span class="ms-2">({{ $session->teacher_rating }}/5)</span>
                                    @else
                                        <span class="text-muted">{{ app()->getLocale() == 'ar' ? 'لم تقم بالتقييم بعد' : 'Not rated yet' }}</span>
                                    @endif
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            @endif
        </div>

        <!-- Sidebar -->
        <div class="col-lg-4">
            <!-- Student Info -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-primary text-white">
                    <h6 class="mb-0">
                        <i class="bi bi-person me-2"></i>
                        {{ app()->getLocale() == 'ar' ? 'معلومات الطالب' : 'Student Information' }}
                    </h6>
                </div>
                <div class="card-body">
                    @if($session->student)
                        <div class="text-center mb-3">
                            <div class="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 80px; height: 80px;">
                                <i class="bi bi-person-fill" style="font-size: 2.5rem;"></i>
                            </div>
                        </div>
                        <h5 class="text-center mb-3">{{ $session->student->name }}</h5>
                        <p class="mb-2">
                            <strong><i class="bi bi-envelope"></i> {{ app()->getLocale() == 'ar' ? 'البريد:' : 'Email:' }}</strong><br>
                            <span class="small">{{ $session->student->email }}</span>
                        </p>
                        @if($session->student->phone)
                            <p class="mb-0">
                                <strong><i class="bi bi-phone"></i> {{ app()->getLocale() == 'ar' ? 'الهاتف:' : 'Phone:' }}</strong><br>
                                <span class="small">{{ $session->student->phone }}</span>
                            </p>
                        @endif
                    @else
                        <p class="text-muted mb-0">{{ app()->getLocale() == 'ar' ? 'لا توجد معلومات متاحة' : 'No information available' }}</p>
                    @endif
                </div>
            </div>

            <!-- Booking Info -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-dark text-white">
                    <h6 class="mb-0">
                        <i class="bi bi-book me-2"></i>
                        {{ app()->getLocale() == 'ar' ? 'معلومات الحجز' : 'Booking Information' }}
                    </h6>
                </div>
                <div class="card-body">
                    <p class="mb-2">
                        <strong>{{ app()->getLocale() == 'ar' ? 'رقم الحجز:' : 'Booking ID:' }}</strong><br>
                        <span>#{{ $session->booking_id }}</span>
                    </p>
                    @if($session->booking)
                        <p class="mb-2">
                            <strong>{{ app()->getLocale() == 'ar' ? 'نوع الحجز:' : 'Booking Type:' }}</strong><br>
                            <span>{{ $session->booking->booking_type ?? 'N/A' }}</span>
                        </p>
                        <p class="mb-0">
                            <strong>{{ app()->getLocale() == 'ar' ? 'تاريخ الحجز:' : 'Booked On:' }}</strong><br>
                            <span>{{ $session->booking->created_at ? \Carbon\Carbon::parse($session->booking->created_at)->format('M d, Y') : 'N/A' }}</span>
                        </p>
                    @endif
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-success text-white">
                    <h6 class="mb-0">
                        <i class="bi bi-lightning me-2"></i>
                        {{ app()->getLocale() == 'ar' ? 'إجراءات سريعة' : 'Quick Actions' }}
                    </h6>
                </div>
                <div class="card-body">
                    <div class="d-grid gap-2">
                        @if($session->host_url && $session->status != 'completed' && $session->status != 'cancelled')
                            <a href="{{ $session->host_url }}" target="_blank" class="btn btn-success">
                                <i class="bi bi-camera-video"></i> {{ app()->getLocale() == 'ar' ? 'بدء الجلسة' : 'Start Session' }}
                            </a>
                        @endif
                        
                        <a href="{{ route('teacher.calendar') }}" class="btn btn-primary">
                            <i class="bi bi-calendar3"></i> {{ app()->getLocale() == 'ar' ? 'عرض التقويم' : 'View Calendar' }}
                        </a>
                        
                        @if($session->student)
                            <a href="#" class="btn btn-outline-primary">
                                <i class="bi bi-person"></i> {{ app()->getLocale() == 'ar' ? 'ملف الطالب' : 'Student Profile' }}
                            </a>
                        @endif
                    </div>
                </div>
            </div>

            <!-- Session Timeline -->
            @if($session->status == 'completed' || $session->started_at)
                <div class="card shadow-sm">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0">
                            <i class="bi bi-clock-history me-2"></i>
                            {{ app()->getLocale() == 'ar' ? 'المخطط الزمني' : 'Timeline' }}
                        </h6>
                    </div>
                    <div class="card-body">
                        <ul class="timeline">
                            <li class="timeline-item">
                                <i class="bi bi-check-circle-fill text-success"></i>
                                <strong>{{ app()->getLocale() == 'ar' ? 'تم الحجز' : 'Booked' }}</strong><br>
                                <small class="text-muted">{{ $session->created_at->format('M d, Y h:i A') }}</small>
                            </li>
                            @if($session->started_at)
                                <li class="timeline-item">
                                    <i class="bi bi-play-circle-fill text-primary"></i>
                                    <strong>{{ app()->getLocale() == 'ar' ? 'بدأت الجلسة' : 'Session Started' }}</strong><br>
                                    <small class="text-muted">{{ \Carbon\Carbon::parse($session->started_at)->format('M d, Y h:i A') }}</small>
                                </li>
                            @endif
                            @if($session->ended_at)
                                <li class="timeline-item">
                                    <i class="bi bi-stop-circle-fill text-danger"></i>
                                    <strong>{{ app()->getLocale() == 'ar' ? 'انتهت الجلسة' : 'Session Ended' }}</strong><br>
                                    <small class="text-muted">{{ \Carbon\Carbon::parse($session->ended_at)->format('M d, Y h:i A') }}</small>
                                </li>
                            @endif
                        </ul>
                    </div>
                </div>
            @endif
        </div>
    </div>
</div>

<style>
.timeline {
    list-style: none;
    padding-left: 0;
    position: relative;
}

.timeline-item {
    padding-left: 35px;
    padding-bottom: 20px;
    position: relative;
}

.timeline-item:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 20px;
    height: calc(100% - 10px);
    width: 2px;
    background-color: #dee2e6;
}

.timeline-item i {
    position: absolute;
    left: 0;
    top: 2px;
    font-size: 1rem;
}
</style>
@endsection

