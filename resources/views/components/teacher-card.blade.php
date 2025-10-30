{{-- resources/views/components/teacher-card.blade.php --}}
@props(['teacher'])

<div class="card">
    <div class="card-body">
        <div class="d-flex align-items-start">
            {{-- Teacher Photo --}}
            <div class="avatar avatar-lg me-3">
                <img src="{{ $teacher['profile_photo']->file_path ?? asset('images/default-avatar.png') }}" 
                     alt="{{ $teacher['first_name'] }}"
                     class="rounded-circle">
            </div>

            {{-- Teacher Info --}}
            <div class="flex-grow-1">
                {{-- Name and Price Row --}}
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h5 class="mb-1">
                            {{ $teacher['first_name'] }} {{ $teacher['last_name'] }}
                            @if($teacher['verified'])
                                <i class="ti ti-circle-check text-primary" style="font-size: 1.2rem;"></i>
                            @endif
                        </h5>
                        <div class="d-flex align-items-center gap-2 text-muted small">
                            @if($teacher['nationality'])
                                <img src="{{ asset('flags/' . strtolower($teacher['nationality']) . '.png') }}" 
                                     alt="{{ $teacher['nationality'] }}"
                                     style="width: 18px; height: 18px; border-radius: 2px;">
                            @endif
                            <span>{{ app()->getLocale() == 'ar' ? 'دروس خصوصية' : 'Private Lessons' }}</span>
                        </div>
                    </div>
                    
                    {{-- Price Badge --}}
                    <div class="text-end">
                        <h4 class="text-primary mb-0">
                            {{ number_format($teacher['individual_hour_price'] ?? 0) }}
                            <small class="text-muted">{{ app()->getLocale() == 'ar' ? 'ريال' : 'SAR' }}</small>
                        </h4>
                        <small class="text-muted">{{ app()->getLocale() == 'ar' ? 'للساعة' : 'per hour' }}</small>
                    </div>
                </div>

                {{-- Rating and Availability --}}
                <div class="d-flex align-items-center gap-3 mb-2">
                    <div class="d-flex align-items-center">
                        <i class="ti ti-star-filled text-warning me-1" style="font-size: 1rem;"></i>
                        <span class="fw-semibold">{{ $teacher['rating'] }}</span>
                    </div>
                    
                    <div class="d-flex align-items-center text-muted">
                        <i class="ti ti-clock me-1" style="font-size: 1rem;"></i>
                        <small>{{ $teacher['available_times']->count() ?? 0 }} {{ app()->getLocale() == 'ar' ? 'أيام متاحة' : 'days available' }}</small>
                    </div>
                </div>

                {{-- Bio --}}
                <p class="text-muted mb-3 text-truncate-2" style="line-height: 1.5; max-height: 3em; overflow: hidden;">
                    {{ $teacher['bio'] ?? (app()->getLocale() == 'ar' ? 'مدرس متخصص في المواد الدراسية' : 'Specialized teacher') }}
                </p>

                {{-- Action Button --}}
                <a href="{{ route('student.teachers.show', $teacher['id']) }}" 
                   class="btn btn-primary w-100 waves-effect waves-light">
                    {{ app()->getLocale() == 'ar' ? 'عرض الأوقات المتاحة' : 'View Available Times' }}
                </a>
            </div>
        </div>
    </div>
</div>

<style>
.text-truncate-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>