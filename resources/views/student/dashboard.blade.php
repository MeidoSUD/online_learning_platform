{{-- resources/views/student/dashboard.blade.php --}}
@extends('layouts.app')

@section('title', app()->getLocale() == 'ar' ? 'لوحة الطالب' : 'Student Dashboard')

@section('content')
<div class="content-wrapper">
    <div class="container-xxl flex-grow-1 container-p-y">
        {{-- Welcome Header --}}
        <div class="card bg-primary text-white mb-4">
            <div class="card-body">
                <h2 class="text-white mb-2">
                    {{ app()->getLocale() == 'ar' ? 'مرحباً بك' : 'Welcome' }}, {{ auth()->user()->first_name }}! 👋
                </h2>
                <p class="mb-0 opacity-40">
                    {{ app()->getLocale() == 'ar' ? 'ابحث عن المعلمين والدورات المناسبة لك' : 'Find the perfect teachers and courses for you' }}
                </p>
            </div>
        </div>

        {{-- Services Section --}}
        <section class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="mb-0">{{ app()->getLocale() == 'ar' ? 'خدماتنا' : 'Our Services' }}</h4>
            </div>
            <div class="row g-4">
                @foreach($services as $service)
                <div class="col-md-4">
                    <a href="{{ route('student.teachers.index', ['service_id' => $service->id]) }}" 
                       class="card h-100 text-decoration-none">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="avatar avatar-md bg-label-primary me-3">
                                    <i class="ti ti-book-2 ti-lg"></i>
                                </div>
                                <div>
                                    <h5 class="mb-0">
                                        {{ app()->getLocale() == 'ar' ? $service->name_ar : $service->name_en }}
                                    </h5>
                                    <small class="text-muted">
                                        {{ app()->getLocale() == 'ar' ? 'استكشف المعلمين' : 'Explore teachers' }}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
                @endforeach
            </div>
        </section>

        {{-- Featured Teachers Section --}}
        <section class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="mb-0">{{ app()->getLocale() == 'ar' ? 'المعلمون المميزون' : 'Featured Teachers' }}</h4>
                <a href="{{ route('student.teachers.index') }}" class="btn btn-sm btn-label-primary">
                    {{ app()->getLocale() == 'ar' ? 'عرض الكل' : 'View All' }}
                    <i class="ti ti-chevron-{{ app()->getLocale() == 'ar' ? 'left' : 'right' }} ms-1"></i>
                </a>
            </div>
            <div class="row g-4">
                @foreach($featuredTeachers as $teacher)
                <div class="col-lg-4 col-md-6">
                    <x-teacher-card :teacher="$teacher" />
                </div>
                @endforeach
            </div>
        </section>

        {{-- Featured Courses Section --}}
        <section class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="mb-0">{{ app()->getLocale() == 'ar' ? 'الدورات المميزة' : 'Featured Courses' }}</h4>
                <a href="{{ route('student.courses.index') }}" class="btn btn-sm btn-label-primary">
                    {{ app()->getLocale() == 'ar' ? 'عرض الكل' : 'View All' }}
                    <i class="ti ti-chevron-{{ app()->getLocale() == 'ar' ? 'left' : 'right' }} ms-1"></i>
                </a>
            </div>
            <div class="row g-4">
                @foreach($featuredCourses as $course)
                <div class="col-lg-4 col-md-6">
                    <div class="card h-100">
                        @if($course->thumbnail)
                        <img src="{{ $course->thumbnail }}" alt="{{ $course->title }}" class="card-img-top" style="height: 200px; object-fit: cover;">
                        @else
                        <div class="card-img-top bg-primary" style="height: 200px;"></div>
                        @endif
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title text-truncate mb-2">
                                {{ app()->getLocale() == 'ar' ? $course->title_ar : $course->title_en }}
                            </h5>
                            <p class="card-text text-muted small mb-3">
                                <i class="ti ti-user me-1"></i>
                                {{ $course->teacher->first_name }} {{ $course->teacher->last_name }}
                            </p>
                            <div class="mt-auto d-flex justify-content-between align-items-center">
                                <h4 class="text-primary mb-0">
                                    {{ number_format($course->price) }}
                                    <small class="text-muted">{{ app()->getLocale() == 'ar' ? 'ريال' : 'SAR' }}</small>
                                </h4>
                                <a href="{{ route('student.courses.show', $course->id) }}" 
                                   class="btn btn-sm btn-primary waves-effect waves-light">
                                    {{ app()->getLocale() == 'ar' ? 'التفاصيل' : 'Details' }}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
        </section>

        {{-- Quick Actions --}}
        <section>
            <h4 class="mb-3">{{ app()->getLocale() == 'ar' ? 'إجراءات سريعة' : 'Quick Actions' }}</h4>
            <div class="row g-4">
                <div class="col-xl-3 col-lg-4 col-md-6">
                    <a href="{{ route('student.teachers.index') }}" class="card text-center text-decoration-none h-100">
                        <div class="card-body">
                            <div class="avatar avatar-lg bg-label-primary mx-auto mb-3">
                                <i class="ti ti-users ti-lg"></i>
                            </div>
                            <h5 class="mb-0">
                                {{ app()->getLocale() == 'ar' ? 'تصفح المعلمين' : 'Browse Teachers' }}
                            </h5>
                        </div>
                    </a>
                </div>

                <div class="col-xl-3 col-lg-4 col-md-6">
                    <a href="{{ route('student.courses.index') }}" class="card text-center text-decoration-none h-100">
                        <div class="card-body">
                            <div class="avatar avatar-lg bg-label-success mx-auto mb-3">
                                <i class="ti ti-book-2 ti-lg"></i>
                            </div>
                            <h5 class="mb-0">
                                {{ app()->getLocale() == 'ar' ? 'الدورات التعليمية' : 'All Courses' }}
                            </h5>
                        </div>
                    </a>
                </div>

                <div class="col-xl-3 col-lg-4 col-md-6">
                    <a href="{{ route('student.languages') }}" class="card text-center text-decoration-none h-100">
                        <div class="card-body">
                            <div class="avatar avatar-lg bg-label-info mx-auto mb-3">
                                <i class="ti ti-language ti-lg"></i>
                            </div>
                            <h5 class="mb-0">
                                {{ app()->getLocale() == 'ar' ? 'تعلم اللغات' : 'Learn Languages' }}
                            </h5>
                        </div>
                    </a>
                </div>

                <div class="col-xl-3 col-lg-4 col-md-6">
                    <a href="{{ route('student.bookings.index') }}" class="card text-center text-decoration-none h-100">
                        <div class="card-body">
                            <div class="avatar avatar-lg bg-label-warning mx-auto mb-3">
                                <i class="ti ti-calendar ti-lg"></i>
                            </div>
                            <h5 class="mb-0">
                                {{ app()->getLocale() == 'ar' ? 'حجوزاتي' : 'My Bookings' }}
                            </h5>
                        </div>
                    </a>
                </div>
            </div>
        </section>
    </div>
</div>
@endsection