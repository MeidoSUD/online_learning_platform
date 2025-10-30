<!-- View: student/courses/index -->
{{-- resources/views/student/teachers/index.blade.php --}}
@extends('layouts.app')

@section('title', app()->getLocale() == 'ar' ? 'الدورات التدريبية' : 'Courses')

@section('content')
<div class="content-wrapper">
    <div class="container-xxl flex-grow-1 container-p-y">
        {{-- Header --}}
        <div class="row mb-4">
            <div class="col-12">
                <h4 class="fw-bold">
                    {{ app()->getLocale() == 'ar' ? 'الدورات التدريبية' : 'Courses' }}
                </h4>
                <p class="text-muted mb-0">
                    {{ app()->getLocale() == 'ar' ? 'اختر الدورة المناسبة لك' : 'Find the perfect course for you' }}
                </p>
            </div>
        </div>

        <div class="row">
            {{-- Filters Sidebar --}}
            <div class="col-lg-3 col-md-4 mb-4">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title mb-4">
                            {{ app()->getLocale() == 'ar' ? 'تصفية النتائج' : 'Filter Results' }}
                        </h5>

                        <form method="GET" action="{{ route('student.courses.index') }}" id="filterForm">
                            {{-- Service Filter --}}
                            <div class="mb-3">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'الخدمة' : 'Service' }}</label>
                                <select name="service_id" class="form-select">
                                    <option value="">{{ app()->getLocale() == 'ar' ? 'جميع الخدمات' : 'All Services' }}</option>
                                    @foreach($services as $service)
                                    <option value="{{ $service->id }}" {{ request('service_id') == $service->id ? 'selected' : '' }}>
                                        {{ app()->getLocale() == 'ar' ? ($service->name_ar ?? $service->name_en) : ($service->name_en ?? $service->name_ar) }}
                                    </option>
                                    @endforeach
                                </select>
                            </div>

                            {{-- Subject Filter --}}
                            <div class="mb-3">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'المادة' : 'Subject' }}</label>
                                <select name="subject_id" class="form-select">
                                    <option value="">{{ app()->getLocale() == 'ar' ? 'جميع المواد' : 'All Subjects' }}</option>
                                    @foreach($subjects as $subject)
                                    <option value="{{ $subject->id }}" {{ request('subject_id') == $subject->id ? 'selected' : '' }}>
                                        {{ app()->getLocale() == 'ar' ? ($subject->name_ar ?? $subject->name_en) : ($subject->name_en ?? $subject->name_ar) }}
                                    </option>
                                    @endforeach
                                </select>
                            </div>

                            {{-- Price Range --}}
                            <div class="mb-3">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'السعر (للساعة)' : 'Price (per hour)' }}</label>
                                <div class="row g-2">
                                    <div class="col-6">
                                        <input type="number" name="min_price" placeholder="{{ app()->getLocale() == 'ar' ? 'من' : 'Min' }}" 
                                               value="{{ request('min_price') }}" class="form-control">
                                    </div>
                                    <div class="col-6">
                                        <input type="number" name="max_price" placeholder="{{ app()->getLocale() == 'ar' ? 'إلى' : 'Max' }}" 
                                               value="{{ request('max_price') }}" class="form-control">
                                    </div>
                                </div>
                            </div>

                            {{-- Sort --}}
                            <div class="mb-3">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'ترتيب' : 'Sort' }}</label>
                                <select name="sort_by" class="form-select">
                                    <option value="rating" {{ request('sort_by') == 'rating' ? 'selected' : '' }}>
                                        {{ app()->getLocale() == 'ar' ? 'الأعلى تقييماً' : 'Highest Rated' }}
                                    </option>
                                    <option value="price_low" {{ request('sort_by') == 'price_low' ? 'selected' : '' }}>
                                        {{ app()->getLocale() == 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High' }}
                                    </option>
                                    <option value="price_high" {{ request('sort_by') == 'price_high' ? 'selected' : '' }}>
                                        {{ app()->getLocale() == 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low' }}
                                    </option>
                                    <option value="newest" {{ request('sort_by') == 'newest' ? 'selected' : '' }}>
                                        {{ app()->getLocale() == 'ar' ? 'الأحدث' : 'Newest' }}
                                    </option>
                                </select>
                            </div>

                            {{-- Filter Buttons --}}
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary waves-effect waves-light">
                                    {{ app()->getLocale() == 'ar' ? 'تطبيق' : 'Apply' }}
                                </button>
                                <a href="{{ route('student.courses.index') }}" class="btn btn-label-secondary waves-effect">
                                    {{ app()->getLocale() == 'ar' ? 'إعادة تعيين' : 'Reset' }}
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {{-- Courses Grid --}}
            <div class="col-lg-9 col-md-8">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <p class="mb-0">
                        {{ app()->getLocale() == 'ar' ? 'عرض' : 'Showing' }} 
                        <span class="fw-semibold">{{ $courses->total() }}</span>
                        {{ app()->getLocale() == 'ar' ? 'دورة' : 'courses' }}
                    </p>

                    <div>
                        {{-- optional toolbar --}}
                    </div>
                </div>

                @if($courses->count() > 0)
                    <div class="row g-4 mb-4">
                        @foreach($courses as $course)
                            <div class="col-md-6 col-lg-4">
                                <div class="card h-100">
                                    <img src="{{ optional($course->thumbnail)->file_path ?? asset('images/course-placeholder.jpg') }}" class="card-img-top" alt="{{ $course->name }}">
                                    <div class="card-body d-flex flex-column">
                                        <h5 class="card-title">{{ $course->name }}</h5>
                                        <p class="small text-muted mb-2">
                                            {{ app()->getLocale() == 'ar' ? 'المعلم:' : 'Teacher:' }}
                                            {{ $course->teacher->first_name ?? '' }} {{ $course->teacher->last_name ?? '' }}
                                        </p>
                                        <p class="text-truncate mb-3">{{ \Illuminate\Support\Str::limit($course->description ?? '', 120) }}</p>

                                        <div class="mt-auto d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong class="text-primary">{{ number_format($course->price ?? 0, 2) }} <small class="text-muted">SAR</small></strong>
                                            </div>
                                            <div>
                                                <a href="{{ route('student.courses.show', $course->id) }}" class="btn btn-sm btn-outline-primary">
                                                    {{ app()->getLocale() == 'ar' ? 'عرض' : 'View' }}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    </div>

                    {{-- Pagination --}}
                    <div class="mt-4">
                        {{ $courses->withQueryString()->links() }}
                    </div>
                @else
                    <div class="card">
                        <div class="card-body text-center py-5">
                            <i class="ti ti-mood-sad mb-3" style="font-size: 4rem; color: #ddd;"></i>
                            <h5 class="mb-2">
                                {{ app()->getLocale() == 'ar' ? 'لم يتم العثور على دورات' : 'No Courses Found' }}
                            </h5>
                            <p class="text-muted mb-4">
                                {{ app()->getLocale() == 'ar' ? 'حاول تعديل معايير البحث' : 'Try adjusting your filters' }}
                            </p>
                            <a href="{{ route('student.courses.index') }}" class="btn btn-primary waves-effect waves-light">
                                {{ app()->getLocale() == 'ar' ? 'إعادة تعيين الفلاتر' : 'Reset Filters' }}
                            </a>
                        </div>
                    </div>
                @endif
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
    // Auto-submit form on select change
    document.querySelectorAll('#filterForm select').forEach(select => {
        select.addEventListener('change', function() {
            document.getElementById('filterForm').submit();
        });
    });
</script>
@endpush
@endsection