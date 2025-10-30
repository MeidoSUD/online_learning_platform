{{-- resources/views/student/teachers/show.blade.php --}}
@extends('layouts.app')

@section('title', $teacherData['first_name'] . ' ' . $teacherData['last_name'])

@section('content')
<div class="content-wrapper">
    <div class="container-xxl flex-grow-1 container-p-y">
        {{-- Back Button --}}
        <div class="mb-4">
            <a href="{{ route('student.teachers.index') }}" class="btn btn-sm btn-label-secondary">
                <i class="ti ti-arrow-left {{ app()->getLocale() == 'ar' ? 'ti-flip-horizontal' : '' }} me-1"></i>
                {{ app()->getLocale() == 'ar' ? 'العودة للمعلمين' : 'Back to Teachers' }}
            </a>
        </div>

        <div class="row">
            {{-- Main Content --}}
            <div class="col-lg-8 mb-4">
                {{-- Teacher Header Card --}}
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="d-flex align-items-start gap-4">
                            <div class="avatar avatar-xl">
                                <img src="{{ $teacherData['profile_photo']->file_path ?? asset('images/default-avatar.png') }}" 
                                     alt="{{ $teacherData['first_name'] }}"
                                     class="rounded-circle">
                            </div>
                            
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h3 class="mb-2">
                                            {{ $teacherData['first_name'] }} {{ $teacherData['last_name'] }}
                                            @if($teacherData['verified'])
                                                <i class="ti ti-circle-check text-primary" style="font-size: 1.5rem;"></i>
                                            @endif
                                        </h3>
                                        <div class="d-flex align-items-center gap-3 text-muted">
                                            @if($teacherData['nationality'])
                                            <span class="d-flex align-items-center gap-2">
                                                <img src="{{ asset('flags/' . strtolower($teacherData['nationality']) . '.png') }}" 
                                                     alt="{{ $teacherData['nationality'] }}"
                                                     style="width: 20px; height: 20px; border-radius: 3px;">
                                                {{ $teacherData['nationality'] }}
                                            </span>
                                            @endif
                                            <span class="d-flex align-items-center gap-1">
                                                <i class="ti ti-star-filled text-warning"></i>
                                                <strong class="text-dark">{{ $teacherData['rating'] }}</strong>
                                                <small>({{ $teacherData['reviews_count'] }} {{ app()->getLocale() == 'ar' ? 'تقييم' : 'reviews' }})</small>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <p class="mb-3">
                                    {{ $teacherData['bio'] ?? (app()->getLocale() == 'ar' ? 'معلم محترف ومتخصص' : 'Professional and specialized teacher') }}
                                </p>

                                {{-- Subjects --}}
                                <div class="d-flex flex-wrap gap-2">
                                    @foreach($teacherData['teacher_subjects'] as $subject)
                                        <span class="badge bg-label-primary">{{ $subject['title'] }}</span>
                                    @endforeach
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {{-- Teaching Services --}}
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">{{ app()->getLocale() == 'ar' ? 'الخدمات المتاحة' : 'Available Services' }}</h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            @if($teacherData['teach_individual'])
                            <div class="col-md-6">
                                <div class="border rounded p-3">
                                    <div class="d-flex align-items-center gap-3 mb-3">
                                        <div class="avatar avatar-md bg-label-primary">
                                            <i class="ti ti-user ti-md"></i>
                                        </div>
                                        <div>
                                            <h6 class="mb-0">{{ app()->getLocale() == 'ar' ? 'دروس فردية' : 'Individual Lessons' }}</h6>
                                            <small class="text-muted">{{ app()->getLocale() == 'ar' ? 'واحد لواحد' : 'One-on-one' }}</small>
                                        </div>
                                    </div>
                                    <div class="text-end">
                                        <h4 class="text-primary mb-0">
                                            {{ number_format($teacherData['individual_hour_price']) }}
                                            <small class="text-muted">{{ app()->getLocale() == 'ar' ? 'ريال/ساعة' : 'SAR/hour' }}</small>
                                        </h4>
                                    </div>
                                </div>
                            </div>
                            @endif

                            @if($teacherData['teach_group'])
                            <div class="col-md-6">
                                <div class="border rounded p-3">
                                    <div class="d-flex align-items-center gap-3 mb-3">
                                        <div class="avatar avatar-md bg-label-success">
                                            <i class="ti ti-users ti-md"></i>
                                        </div>
                                        <div>
                                            <h6 class="mb-0">{{ app()->getLocale() == 'ar' ? 'دروس جماعية' : 'Group Lessons' }}</h6>
                                            <small class="text-muted">{{ $teacherData['min_group_size'] }}-{{ $teacherData['max_group_size'] }} {{ app()->getLocale() == 'ar' ? 'طلاب' : 'students' }}</small>
                                        </div>
                                    </div>
                                    <div class="text-end">
                                        <h4 class="text-success mb-0">
                                            {{ number_format($teacherData['group_hour_price']) }}
                                            <small class="text-muted">{{ app()->getLocale() == 'ar' ? 'ريال/ساعة' : 'SAR/hour' }}</small>
                                        </h4>
                                    </div>
                                </div>
                            </div>
                            @endif
                        </div>
                    </div>
                </div>

                {{-- Education Levels & Classes --}}
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">{{ app()->getLocale() == 'ar' ? 'المراحل والصفوف الدراسية' : 'Education Levels & Classes' }}</h5>
                    </div>
                    <div class="card-body">
                        @foreach($teacherData['teacher_levels'] as $level)
                        <div class="mb-3 pb-3 {{ !$loop->last ? 'border-bottom' : '' }}">
                            <h6 class="mb-2">{{ $level['title'] }}</h6>
                            <div class="d-flex flex-wrap gap-2">
                                @foreach($teacherData['teacher_classes']->where('level_id', $level['id']) as $class)
                                    <span class="badge bg-label-secondary">{{ $class['title'] }}</span>
                                @endforeach
                            </div>
                        </div>
                        @endforeach
                    </div>
                </div>

                {{-- Reviews Section --}}
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">{{ app()->getLocale() == 'ar' ? 'التقييمات' : 'Reviews' }} ({{ $teacherData['reviews_count'] }})</h5>
                    </div>
                    <div class="card-body">
                        @if($teacherData['reviews']->count() > 0)
                            @foreach($teacherData['reviews']->take(5) as $review)
                            <div class="d-flex align-items-start gap-3 {{ !$loop->last ? 'mb-4 pb-4 border-bottom' : '' }}">
                                <div class="avatar">
                                    <img src="{{ $review->reviewer->profile->profilePhoto->file_path ?? asset('images/default-avatar.png') }}" 
                                         alt="{{ $review->reviewer->first_name }}"
                                         class="rounded-circle">
                                </div>
                                <div class="flex-grow-1">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <h6 class="mb-0">{{ $review->reviewer->first_name }} {{ $review->reviewer->last_name }}</h6>
                                        <div class="d-flex gap-1">
                                            @for($i = 1; $i <= 5; $i++)
                                                <i class="ti ti-star{{ $i <= $review->rating ? '-filled' : '' }} {{ $i <= $review->rating ? 'text-warning' : 'text-muted' }}" style="font-size: 1rem;"></i>
                                            @endfor
                                        </div>
                                    </div>
                                    <p class="mb-1 small">{{ $review->comment }}</p>
                                    <small class="text-muted">{{ $review->created_at->diffForHumans() }}</small>
                                </div>
                            </div>
                            @endforeach
                        @else
                            <div class="text-center py-4">
                                <i class="ti ti-message-off mb-2" style="font-size: 3rem; color: #ddd;"></i>
                                <p class="text-muted mb-0">{{ app()->getLocale() == 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews yet' }}</p>
                            </div>
                        @endif
                    </div>
                </div>
            </div>

            {{-- Sidebar: Booking Section --}}
            <div class="col-lg-4">
                <div class="card sticky-top" style="top: 20px;">
                    <div class="card-header">
                        <h5 class="card-title mb-0">{{ app()->getLocale() == 'ar' ? 'احجز درساً' : 'Book a Lesson' }}</h5>
                    </div>
                    <div class="card-body">
                        <form action="{{ route('student.bookings.store') }}" method="POST" id="bookingForm">
                            @csrf
                            <input type="hidden" name="teacher_id" value="{{ $teacherData['id'] }}">

                            {{-- Lesson Type --}}
                            <div class="mb-3">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'نوع الدرس' : 'Lesson Type' }}</label>
                                <select name="lesson_type" id="lessonType" required class="form-select">
                                    @if($teacherData['teach_individual'])
                                    <option value="individual" data-price="{{ $teacherData['individual_hour_price'] }}">
                                        {{ app()->getLocale() == 'ar' ? 'درس فردي' : 'Individual' }} - {{ number_format($teacherData['individual_hour_price']) }} {{ app()->getLocale() == 'ar' ? 'ريال' : 'SAR' }}
                                    </option>
                                    @endif
                                    @if($teacherData['teach_group'])
                                    <option value="group" data-price="{{ $teacherData['group_hour_price'] }}">
                                        {{ app()->getLocale() == 'ar' ? 'درس جماعي' : 'Group' }} - {{ number_format($teacherData['group_hour_price']) }} {{ app()->getLocale() == 'ar' ? 'ريال' : 'SAR' }}
                                    </option>
                                    @endif
                                </select>
                            </div>

                            {{-- Available Days --}}
                            <div class="mb-3">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'اختر اليوم' : 'Select Day' }}</label>
                                @php
                                    $days = [
                                        1 => app()->getLocale() == 'ar' ? 'الأحد' : 'Sunday',
                                        2 => app()->getLocale() == 'ar' ? 'الاثنين' : 'Monday',
                                        3 => app()->getLocale() == 'ar' ? 'الثلاثاء' : 'Tuesday',
                                        4 => app()->getLocale() == 'ar' ? 'الأربعاء' : 'Wednesday',
                                        5 => app()->getLocale() == 'ar' ? 'الخميس' : 'Thursday',
                                        6 => app()->getLocale() == 'ar' ? 'الجمعة' : 'Friday',
                                        7 => app()->getLocale() == 'ar' ? 'السبت' : 'Saturday',
                                    ];
                                @endphp
                                <div class="list-group" id="daySelection">
                                    @foreach($availableSlots as $dayNumber => $slots)
                                    <label class="list-group-item list-group-item-action cursor-pointer">
                                        <div class="d-flex align-items-center">
                                            <input type="radio" name="day_number" value="{{ $dayNumber }}" 
                                                   data-slots="{{ json_encode($slots) }}"
                                                   required class="form-check-input me-2">
                                            <div class="flex-grow-1">
                                                <strong>{{ $days[$dayNumber] ?? '' }}</strong>
                                                <small class="text-muted ms-2">({{ $slots->count() }} {{ app()->getLocale() == 'ar' ? 'وقت متاح' : 'slots' }})</small>
                                            </div>
                                        </div>
                                    </label>
                                    @endforeach
                                </div>
                            </div>

                            {{-- Available Times --}}
                            <div class="mb-3" id="timeSelectionContainer" style="display: none;">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'اختر الوقت' : 'Select Time' }}</label>
                                <div class="row g-2" id="timeSelection">
                                    <!-- Times will be populated via JavaScript -->
                                </div>
                            </div>

                            {{-- Duration --}}
                            <div class="mb-3">
                                <label class="form-label">{{ app()->getLocale() == 'ar' ? 'المدة' : 'Duration' }}</label>
                                <select name="duration" id="duration" required class="form-select">
                                    <option value="1">1 {{ app()->getLocale() == 'ar' ? 'ساعة' : 'hour' }}</option>
                                    <option value="1.5">1.5 {{ app()->getLocale() == 'ar' ? 'ساعة' : 'hours' }}</option>
                                    <option value="2">2 {{ app()->getLocale() == 'ar' ? 'ساعات' : 'hours' }}</option>
                                </select>
                            </div>

                            {{-- Total Price --}}
                            <div class="alert alert-primary mb-3">
                                <div class="d-flex justify-content-between mb-2">
                                    <span>{{ app()->getLocale() == 'ar' ? 'السعر الأساسي' : 'Base Price' }}</span>
                                    <strong id="basePrice">0</strong>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>{{ app()->getLocale() == 'ar' ? 'المدة' : 'Duration' }}</span>
                                    <strong id="durationDisplay">1 {{ app()->getLocale() == 'ar' ? 'ساعة' : 'hour' }}</strong>
                                </div>
                                <hr class="my-2">
                                <div class="d-flex justify-content-between">
                                    <h6 class="mb-0">{{ app()->getLocale() == 'ar' ? 'المجموع' : 'Total' }}</h6>
                                    <h5 class="text-primary mb-0" id="totalPrice">0 {{ app()->getLocale() == 'ar' ? 'ريال' : 'SAR' }}</h5>
                                </div>
                            </div>

                            {{-- Submit Button --}}
                            <button type="submit" class="btn btn-primary w-100 waves-effect waves-light">
                                <i class="ti ti-check me-1"></i>
                                {{ app()->getLocale() == 'ar' ? 'تأكيد الحجز' : 'Confirm Booking' }}
                            </button>
                        </form>
                    </div>
                    
                    {{-- Contact Teacher --}}
                    <div class="card-footer">
                        <a href="#" class="btn btn-label-secondary w-100 waves-effect">
                            <i class="ti ti-message-circle me-1"></i>
                            {{ app()->getLocale() == 'ar' ? 'مراسلة المعلم' : 'Message Teacher' }}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    const lessonTypeSelect = document.getElementById('lessonType');
    const durationSelect = document.getElementById('duration');
    const dayRadios = document.querySelectorAll('input[name="day_number"]');
    const timeContainer = document.getElementById('timeSelectionContainer');
    const timeSelection = document.getElementById('timeSelection');
    
    // Calculate price
    function updatePrice() {
        const selectedOption = lessonTypeSelect.options[lessonTypeSelect.selectedIndex];
        const basePrice = parseFloat(selectedOption.dataset.price) || 0;
        const duration = parseFloat(durationSelect.value) || 1;
        const total = basePrice * duration;
        
        document.getElementById('basePrice').textContent = basePrice.toLocaleString() + ' {{ app()->getLocale() == "ar" ? "ريال" : "SAR" }}';
        document.getElementById('durationDisplay').textContent = duration + ' {{ app()->getLocale() == "ar" ? "ساعة" : "hour(s)" }}';
        document.getElementById('totalPrice').textContent = total.toLocaleString() + ' {{ app()->getLocale() == "ar" ? "ريال" : "SAR" }}';
    }
    
    // Show available times when day is selected
    dayRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const slots = JSON.parse(this.dataset.slots);
            timeSelection.innerHTML = '';
            
            slots.forEach(slot => {
                const col = document.createElement('div');
                col.className = 'col-6';
                
                const label = document.createElement('label');
                label.className = 'btn btn-outline-primary w-100 p-2';
                label.style.cursor = 'pointer';
                
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = 'slot_id';
                input.value = slot.id;
                input.required = true;
                input.className = 'd-none';
                
                const span = document.createElement('span');
                span.className = 'small';
                span.textContent = slot.start_time;
                
                input.addEventListener('change', function() {
                    document.querySelectorAll('#timeSelection label').forEach(l => {
                        l.classList.remove('active');
                        l.classList.replace('btn-primary', 'btn-outline-primary');
                    });
                    if(this.checked) {
                        label.classList.add('active');
                        label.classList.replace('btn-outline-primary', 'btn-primary');
                    }
                });
                
                label.appendChild(input);
                label.appendChild(span);
                col.appendChild(label);
                timeSelection.appendChild(col);
            });
            
            timeContainer.style.display = 'block';
        });
    });
    
    lessonTypeSelect.addEventListener('change', updatePrice);
    durationSelect.addEventListener('change', updatePrice);
    
    // Initial price calculation
    updatePrice();
});
</script>
@endpush
@endsection