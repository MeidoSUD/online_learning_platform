@extends('layouts.app')

@section('title', app()->getLocale() == 'en' ? 'Edit Teacher Profile' : 'تعديل ملف المعلم')
<!-- View: teacher/availability/create -->
@section('content')
<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h2 class="mb-1">{{ app()->getLocale() == 'ar' ? 'الملف الشخصي للمعلم' : 'Teacher Profile' }}</h2>
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item"><a href="{{ route('teacher.dashboard') }}">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</a></li>
                            <li class="breadcrumb-item active">{{ app()->getLocale() == 'ar' ? 'الملف الشخصي' : 'Profile' }}</li>
                        </ol>
                    </nav>
                </div>
                <a href="{{ route('teacher.info.edit') }}" class="btn btn-primary">
                    <i class="bi bi-pencil"></i> {{ app()->getLocale() == 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile' }}
                </a>
            </div>
        </div>
    </div>

    @if(session('success'))
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="bi bi-check-circle me-2"></i>{{ session('success') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    <div class="row">
        <div class="col-md-8 offset-md-2">
            @if($teacherInfo)
                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0"><i class="bi bi-person-badge me-2"></i>{{ app()->getLocale() == 'ar' ? 'معلومات الملف الشخصي' : 'Profile Information' }}</h5>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-md-3">
                                <strong>{{ app()->getLocale() == 'ar' ? 'السيرة الذاتية:' : 'Bio:' }}</strong>
                            </div>
                            <div class="col-md-9">
                                <p class="mb-0">{{ $teacherInfo->bio ?: 'No bio provided yet.' }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-info text-white">
                        <h5 class="mb-0"><i class="bi bi-person me-2"></i>{{ app()->getLocale() == 'ar' ? 'التدريس الفردي' : 'Individual Teaching' }}</h5>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <strong>{{ app()->getLocale() == 'ar' ? 'أقدم جلسات تدريس فردية:' : 'Offers Individual Sessions:' }}</strong>
                            </div>
                            <div class="col-md-8">
                                @if($teacherInfo->teach_individual)
                                    <span class="badge bg-success">{{ app()->getLocale() == 'ar' ? 'نعم' : 'Yes' }}</span>
                                @else
                                    <span class="badge bg-secondary">{{ app()->getLocale() == 'ar' ? 'لا' : 'No' }}</span>
                                @endif
                            </div>
                        </div>

                        @if($teacherInfo->teach_individual)
                            <div class="row">
                                <div class="col-md-4">
                                    <strong>{{ app()->getLocale() == 'ar' ? 'سعر الساعة:' : 'Hourly Rate:' }}</strong>
                                </div>
                                <div class="col-md-8">
                                    <span class="text-success fw-bold">${{ number_format($teacherInfo->individual_hour_price, 2) }}</span> per hour
                                </div>
                            </div>
                        @endif
                    </div>
                </div>

                <div class="card shadow-sm">
                    <div class="card-header bg-warning text-dark">
                        <h5 class="mb-0"><i class="bi bi-people me-2"></i>{{ app()->getLocale() == 'ar' ? 'التدريس الجماعي' : 'Group Teaching' }}</h5>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <strong>{{ app()->getLocale() == 'ar' ? 'أقدم جلسات تدريس جماعي:' : 'Offers Group Sessions:' }}</strong>
                            </div>
                            <div class="col-md-8">
                                @if($teacherInfo->teach_group)
                                    <span class="badge bg-success">{{ app()->getLocale() == 'ar' ? 'نعم' : 'Yes' }}</span>
                                @else
                                    <span class="badge bg-secondary">{{ app()->getLocale() == 'ar' ? 'لا' : 'No' }}</span>
                                @endif
                            </div>
                        </div>

                        @if($teacherInfo->teach_group)
                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <strong>{{ app()->getLocale() == 'ar' ? 'سعر الساعة:' : 'Hourly Rate:' }}</strong>
                                </div>
                                <div class="col-md-8">
                                    <span class="text-success fw-bold">${{ number_format($teacherInfo->group_hour_price, 2) }}</span> per hour
                                </div>
                            </div>

                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <strong>{{ app()->getLocale() == 'ar' ? 'نطاق حجم المجموعة:' : 'Group Size Range:' }}</strong>
                                </div>
                                <div class="col-md-8">
                                    <span class="badge bg-info">{{ $teacherInfo->min_group_size }} - {{ $teacherInfo->max_group_size }} students</span>
                                </div>
                            </div>
                        @endif
                    </div>
                </div>
            @else
                <div class="card shadow-sm">
                    <div class="card-body text-center py-5">
                        <i class="bi bi-exclamation-circle display-1 text-muted"></i>
                        <h4 class="mt-3">{{ app()->getLocale() == 'ar' ? 'لا توجد معلومات ملف' : 'No Profile Information' }}</h4>
                        <p class="text-muted">{{ app()->getLocale() == 'ar' ? 'أكمل ملف المعلم الخاص بك للبدء.' : 'Complete your teacher profile to get started.' }}</p>
                        <a href="{{ route('teacher.info.edit') }}" class="btn btn-primary mt-2">
                            <i class="bi bi-pencil"></i> {{ app()->getLocale() == 'ar' ? 'إنشاء ملف' : 'Create Profile' }}
                        </a>
                    </div>
                </div>
            @endif
        </div>
    </div>
</div>
@endsection