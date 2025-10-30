{{-- resources/views/student/teachers/index.blade.php --}}
@extends('layouts.app')

@section('title', app()->getLocale() == 'ar' ? 'الدروس الخصوصية' : 'Private Lessons')

@section('content')
<div class="content-wrapper">
    <div class="container-xxl flex-grow-1 container-p-y">
        {{-- Header --}}
        <div class="row mb-4">
            <div class="col-12">
                <h4 class="fw-bold">
                    {{ app()->getLocale() == 'ar' ? 'الدروس الخصوصية' : 'Private Lessons' }}
                </h4>
                <p class="text-muted mb-0">
                    {{ app()->getLocale() == 'ar' ? 'اختر المعلم المناسب لك' : 'Find the perfect teacher for you' }}
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

                        <form method="GET" action="{{ route('student.teachers.index') }}" id="filterForm">
                            {{-- Service Filter --}}
                            <div class="mb-3">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'الخدمة' : 'Service' }}</label>
                                <select name="service_id" class="form-select">
                                    <option value="">{{ app()->getLocale() == 'ar' ? 'جميع الخدمات' : 'All Services' }}</option>
                                    @foreach($services as $service)
                                    <option value="{{ $service->id }}" {{ request('service_id') == $service->id ? 'selected' : '' }}>
                                        {{ app()->getLocale() == 'ar' ? $service->name_ar : $service->name_en }}
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
                                        {{ app()->getLocale() == 'ar' ? $subject->name_ar : $subject->name_en }}
                                    </option>
                                    @endforeach
                                </select>
                            </div>

                            {{-- Education Level Filter --}}
                            <div class="mb-3">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'المرحلة التعليمية' : 'Education Level' }}</label>
                                <select name="education_level_id" class="form-select">
                                    <option value="">{{ app()->getLocale() == 'ar' ? 'جميع المراحل' : 'All Levels' }}</option>
                                    @foreach($educationLevels as $level)
                                    <option value="{{ $level->id }}" {{ request('education_level_id') == $level->id ? 'selected' : '' }}>
                                        {{ app()->getLocale() == 'ar' ? $level->name_ar : $level->name_en }}
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

                            {{-- Gender Filter --}}
                            <div class="mb-3">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'الجنس' : 'Gender' }}</label>
                                <div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="radio" name="gender" value="" id="gender_all" {{ request('gender') == '' ? 'checked' : '' }}>
                                        <label class="form-check-label" for="gender_all">
                                            {{ app()->getLocale() == 'ar' ? 'الكل' : 'All' }}
                                        </label>
                                    </div>
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="radio" name="gender" value="male" id="gender_male" {{ request('gender') == 'male' ? 'checked' : '' }}>
                                        <label class="form-check-label" for="gender_male">
                                            {{ app()->getLocale() == 'ar' ? 'ذكر' : 'Male' }}
                                        </label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="radio" name="gender" value="female" id="gender_female" {{ request('gender') == 'female' ? 'checked' : '' }}>
                                        <label class="form-check-label" for="gender_female">
                                            {{ app()->getLocale() == 'ar' ? 'أنثى' : 'Female' }}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {{-- Rating Filter --}}
                            <div class="mb-3">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'التقييم' : 'Rating' }}</label>
                                <select name="min_rating" class="form-select">
                                    <option value="">{{ app()->getLocale() == 'ar' ? 'جميع التقييمات' : 'All Ratings' }}</option>
                                    <option value="4" {{ request('min_rating') == '4' ? 'selected' : '' }}>4+ ⭐</option>
                                    <option value="4.5" {{ request('min_rating') == '4.5' ? 'selected' : '' }}>4.5+ ⭐</option>
                                </select>
                            </div>

                            {{-- Filter Buttons --}}
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary waves-effect waves-light">
                                    {{ app()->getLocale() == 'ar' ? 'تطبيق' : 'Apply' }}
                                </button>
                                <a href="{{ route('student.teachers.index') }}" class="btn btn-label-secondary waves-effect">
                                    {{ app()->getLocale() == 'ar' ? 'إعادة تعيين' : 'Reset' }}
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {{-- Teachers Grid --}}
            <div class="col-lg-9 col-md-8">
                {{-- Sort & Results Count --}}
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <p class="mb-0">
                        {{ app()->getLocale() == 'ar' ? 'عرض' : 'Showing' }} 
                        <span class="fw-semibold">{{ $teachers->total() }}</span>
                        {{ app()->getLocale() == 'ar' ? 'معلم' : 'teachers' }}
                    </p>
                    <select name="sort_by" onchange="document.getElementById('filterForm').submit()" class="form-select" style="width: auto;">
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

                {{-- Teachers List --}}
                @if($teachers->count() > 0)
                    <div class="row g-4 mb-4">
                        @foreach($teachers as $teacher)
                            <div class="col-12">
                                <x-teacher-card :teacher="$teacher" />
                            </div>
                        @endforeach
                    </div>

                    {{-- Pagination --}}
                    <div class="mt-4">
                        {{ $teachers->links() }}
                    </div>
                @else
                    <div class="card">
                        <div class="card-body text-center py-5">
                            <i class="ti ti-mood-sad mb-3" style="font-size: 4rem; color: #ddd;"></i>
                            <h5 class="mb-2">
                                {{ app()->getLocale() == 'ar' ? 'لم يتم العثور على معلمين' : 'No Teachers Found' }}
                            </h5>
                            <p class="text-muted mb-4">
                                {{ app()->getLocale() == 'ar' ? 'حاول تعديل معايير البحث' : 'Try adjusting your filters' }}
                            </p>
                            <a href="{{ route('student.teachers.index') }}" class="btn btn-primary waves-effect waves-light">
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
    document.querySelectorAll('select[name="service_id"], select[name="subject_id"], select[name="education_level_id"], select[name="min_rating"]').forEach(select => {
        select.addEventListener('change', function() {
            document.getElementById('filterForm').submit();
        });
    });
</script>
@endpush
@endsection