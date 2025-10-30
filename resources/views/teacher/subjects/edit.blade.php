@extends('layouts.app')

@section('title', app()->getLocale() == 'en' ? 'Edit Subject' : 'تعديل المادة')
<!-- View: teacher/lessons/edit -->
@section('content')
<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-md-12">
            <h2 class="mb-1">{{ app()->getLocale() == 'ar' ? 'تعديل المادة' : 'Edit Subject' }}</h2>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('teacher.dashboard') }}">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</a></li>
                    <li class="breadcrumb-item"><a href="{{ route('teacher.subjects.index') }}">{{ app()->getLocale() == 'ar' ? 'المواد الدراسية' : 'Subjects' }}</a></li>
                    <li class="breadcrumb-item active">{{ app()->getLocale() == 'ar' ? 'تعديل' : 'Edit' }}</li>
                </ol>
            </nav>
        </div>
    </div>

    <div class="row">
        <div class="col-md-8 offset-md-2">
            <div class="card shadow-sm">
                <div class="card-header bg-warning text-dark">
                    <h5 class="mb-0"><i class="bi bi-pencil me-2"></i>{{ app()->getLocale() == 'ar' ? 'تحديث تعيين المادة' : 'Update Subject Assignment' }}</h5>
                </div>
                <div class="card-body">
                    @if($errors->any())
                        <div class="alert alert-danger">
                            <ul class="mb-0">
                                @foreach($errors->all() as $error)
                                    <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif

                    <form action="{{ route('teacher.subjects.update', $teacherSubject->id) }}" method="POST">
                        @csrf
                        @method('PUT')

                        <div class="mb-3">
                            <label class="form-label fw-bold">{{ app()->getLocale() == 'ar' ? 'المادة الحالية' : 'Current Subject' }}</label>
                            <p class="form-control-plaintext bg-light p-2 rounded">
                                {{ app()->getLocale() == 'ar' ? $teacherSubject->subject->name_ar ?? 'N/A' : $teacherSubject->subject->name_en ?? 'N/A' }} 
                            </p>
                        </div>

                        <div class="mb-4">
                            <label for="subject_id" class="form-label fw-bold">
                                {{ app()->getLocale() == 'ar' ? 'تغيير إلى مادة' : 'Change to Subject' }} <span class="text-danger">*</span>
                            </label>
                            <select name="subject_id" 
                                    id="subject_id" 
                                    class="form-select @error('subject_id') is-invalid @enderror" 
                                    required>
                                <option value="">-- {{ app()->getLocale() == 'ar' ? 'اختر مادة' : 'Select Subject' }} --</option>
                                @foreach($allSubjects as $subject)
                                    <option value="{{ $subject->id }}" 
                                            {{ old('subject_id', $teacherSubject->subject_id) == $subject->id ? 'selected' : '' }}>
                                        {{ app()->getLocale() == 'ar' ? $subject->name_ar : $subject->name_en }}
                                    </option>
                                @endforeach
                            </select>
                            @error('subject_id')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="d-flex justify-content-between">
                            <a href="{{ route('teacher.subjects.index') }}" class="btn btn-secondary">
                                <i class="bi bi-arrow-left"></i> Cancel
                            </a>
                            <button type="submit" class="btn btn-warning text-dark">
                                <i class="bi bi-check-circle"></i> {{ app()->getLocale() == 'ar' ? 'تحديث' : 'Update' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection