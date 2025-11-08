@extends('layouts.app')

@section('title', app()->getLocale() == 'ar' ? 'الملف الشخصي' : 'Profile')

@section('content')
<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-12 d-flex justify-content-between align-items-center">
            <h3>{{ app()->getLocale() == 'ar' ? 'الملف الشخصي' : 'Profile' }}</h3>
            <a href="{{ route('teacher.profile.edit') }}" class="btn btn-primary">
                {{ app()->getLocale() == 'ar' ? 'تعديل' : 'Edit' }}
            </a>
        </div>
    </div>
        <div class="alert alert-success">
            {{ session('status') }}
        </div>
    <div class="row">
        <div class="col-lg-4">
            <div class="card text-center p-4">
                @php
                    $profilePic = optional($teacherProfile->attachments
                        ->where('attached_to_type', 'profile_picture')
                        ->first())->file_path ?? asset('images/default-avatar.png');
                    // ensure absolute URL if file_path stored as relative
                    $profilePicUrl = (Str::startsWith($profilePic, ['http://','https://','/storage'])) ? url($profilePic) : $profilePic;
                @endphp

                <img src="{{ $profilePicUrl }}" alt="Profile Photo" class="rounded-circle mb-3" style="width:160px;height:160px;object-fit:cover;">
                <h5 class="mb-0">{{ $teacherProfile->first_name }} {{ $teacherProfile->last_name }}</h5>
                <p class="text-muted mb-1">{{ $teacherProfile->email }}</p>
                <p class="text-muted">{{ $teacherProfile->phone_number ?? '-' }}</p>
            </div>

            <div class="card mt-3">
                <div class="card-header">
                    <strong>{{ app()->getLocale() == 'ar' ? 'الخدمات' : 'Services' }}</strong>
                </div>
                <div class="card-body">
                    @if(isset($services) && $services->count())
                        @foreach($services as $svc)
                            <span class="badge bg-primary me-1 mb-1">
                                {{ app()->getLocale() == 'ar' ? ($svc->name_ar ?? $svc->name_en) : ($svc->name_en ?? $svc->name_ar) }}
                            </span>
                        @endforeach
                    @else
                        <div class="text-muted">{{ app()->getLocale() == 'ar' ? 'لم يتم تحديد خدمات.' : 'No services specified.' }}</div>
                    @endif
                </div>
            </div>
        </div>

        <div class="col-lg-8">
            <div class="card p-3">
                <div class="card-body">
                    <h5>{{ app()->getLocale() == 'ar' ? 'السيرة الذاتية' : 'Bio' }}</h5>
                    <p class="text-muted">{{ optional($teacherProfile->teacherInfo)->bio ?? (app()->getLocale() == 'ar' ? 'لا يوجد سيرة ذاتية.' : 'No bio available.') }}</p>

                    <hr>

                    <h6>{{ app()->getLocale() == 'ar' ? 'خيارات التدريس' : 'Teaching Options' }}</h6>
                    <ul class="list-unstyled">
                        <li>
                            {{ app()->getLocale() == 'ar' ? 'تدريس فردي:' : 'Individual:' }}
                            <strong>{{ optional($teacherProfile->teacherInfo)->teach_individual ? (app()->getLocale() == 'ar' ? 'نعم' : 'Yes') : (app()->getLocale() == 'ar' ? 'لا' : 'No') }}</strong>
                            @if(optional($teacherProfile->teacherInfo)->individual_hour_price)
                                — {{ number_format(optional($teacherProfile->teacherInfo)->individual_hour_price, 2) }} SAR/hr
                            @endif
                        </li>
                        <li class="mt-2">
                            {{ app()->getLocale() == 'ar' ? 'تدريس جماعي:' : 'Group:' }}
                            <strong>{{ optional($teacherProfile->teacherInfo)->teach_group ? (app()->getLocale() == 'ar' ? 'نعم' : 'Yes') : (app()->getLocale() == 'ar' ? 'لا' : 'No') }}</strong>
                            @if(optional($teacherProfile->teacherInfo)->group_hour_price)
                                — {{ number_format(optional($teacherProfile->teacherInfo)->group_hour_price, 2) }} SAR/hr
                            @endif
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection