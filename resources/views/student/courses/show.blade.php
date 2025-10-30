<!-- View: student/courses/show -->
{{-- resources/views/student/teachers/show.blade.php --}}
@extends('layouts.app')

@section('title', $course->name ?? (app()->getLocale() == 'ar' ? 'تفاصيل الدورة' : 'Course Details'))

@section('content')
<div class="content-wrapper">
    <div class="container-xxl flex-grow-1 container-p-y">
        <div class="row">
            <div class="col-lg-8 mb-4">
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="d-flex gap-3">
                            <img src="{{ optional($course->thumbnail)->file_path ?? asset('images/course-placeholder.jpg') }}" alt="{{ $course->name }}" style="width:150px;height:100px;object-fit:cover;border-radius:6px;">
                            <div class="flex-grow-1">
                                <h3 class="mb-1">{{ $course->name }}</h3>
                                <p class="text-muted mb-2">
                                    {{ app()->getLocale() == 'ar' ? 'المعلم:' : 'Teacher:' }}
                                    <a href="{{ route('student.teachers.show', $course->teacher->id) }}">
                                        {{ $course->teacher->first_name ?? '' }} {{ $course->teacher->last_name ?? '' }}
                                    </a>
                                </p>
                                <div class="mb-2">
                                    <strong class="text-primary">{{ number_format($course->price ?? 0, 2) }} SAR</strong>
                                </div>
                                <p>{{ $course->description ?? (app()->getLocale() == 'ar' ? 'لا يوجد وصف.' : 'No description available.') }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {{-- Lessons / Curriculum --}}
                @if($course->lessons && $course->lessons->count() > 0)
                <div class="card mb-4">
                    <div class="card-header"><h5 class="card-title mb-0">{{ app()->getLocale() == 'ar' ? 'منهج الدورة' : 'Curriculum' }}</h5></div>
                    <div class="card-body">
                        <ul class="list-group list-group-flush">
                            @foreach($course->lessons as $lesson)
                                <li class="list-group-item">
                                    <strong>{{ $lesson->title }}</strong>
                                    <div class="text-muted small">{{ \Illuminate\Support\Str::limit($lesson->description ?? '', 150) }}</div>
                                </li>
                            @endforeach
                        </ul>
                    </div>
                </div>
                @endif

                {{-- Reviews --}}
                @if($course->reviews && $course->reviews->count() > 0)
                <div class="card mb-4">
                    <div class="card-header"><h5 class="card-title mb-0">{{ app()->getLocale() == 'ar' ? 'التقييمات' : 'Reviews' }}</h5></div>
                    <div class="card-body">
                        @foreach($course->reviews as $review)
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <strong>{{ $review->reviewer->first_name ?? 'User' }}</strong>
                                <span class="text-muted small">{{ $review->created_at->diffForHumans() }}</span>
                            </div>
                            <div class="small text-muted">{{ $review->comment }}</div>
                        </div>
                        @endforeach
                    </div>
                </div>
                @endif
            </div>

            <div class="col-lg-4">
                <div class="card sticky-top" style="top:20px;">
                    <div class="card-body">
                        <h5 class="mb-3">{{ app()->getLocale() == 'ar' ? 'تفاصيل الاشتراك' : 'Enrollment' }}</h5>
                        <p class="mb-2"><strong>{{ number_format($course->price ?? 0, 2) }} SAR</strong></p>

                        <a href="{{ route('student.teachers.show', $course->teacher->id) }}" class="btn btn-outline-primary w-100 mb-2">
                            {{ app()->getLocale() == 'ar' ? 'عرض المعلم' : 'View Teacher' }}
                        </a>

                        {{-- If you have an enroll/book route, replace below --}}
                        @if (Route::has('student.courses.enroll'))
                        <form action="{{ route('student.courses.enroll', $course->id) }}" method="POST">
                            @csrf
                            <button type="submit" class="btn btn-primary w-100">
                                {{ app()->getLocale() == 'ar' ? 'التسجيل الآن' : 'Enroll Now' }}
                            </button>
                        </form>
                        @else
                        <a href="{{ route('student.teachers.show', $course->teacher->id) }}" class="btn btn-primary w-100">
                            {{ app()->getLocale() == 'ar' ? 'احجز عند المعلم' : 'Book with Teacher' }}
                        </a>
                        @endif
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

@endsection