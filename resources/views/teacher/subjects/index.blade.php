
@extends('layouts.app')

@section('title', app()->getLocale() == 'en' ? 'My Subjects' : 'المواد الدراسية الخاصة بي')

@section('content')
<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h2 class="mb-1">{{ app()->getLocale() == 'en' ? 'My Subjects' : 'المواد الدراسية الخاصة بي' }}</h2>
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item"><a href="{{ route('teacher.dashboard') }}">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</a></li>
                            <li class="breadcrumb-item active">{{ app()->getLocale() == 'en' ? 'Subjects' : 'المواد الدراسية' }}</li>
                        </ol>
                    </nav>
                </div>
                <a href="{{ route('teacher.subjects.create') }}" class="btn btn-primary">
                    <i class="bi bi-plus-circle"></i> {{ app()->getLocale() == 'en' ? 'Add Subject' : 'أضف مادة' }}
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

    @if(session('error'))
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>{{ session('error') }}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    @if($subjects->count() > 0)
        <div class="row g-4">
            @foreach($subjects as $teacherSubject)
                <div class="col-md-6 col-lg-4">
                    <div class="card subject-card h-100 shadow-sm">
                        <div class="card-header bg-gradient text-white">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">
                                        <i class="bi bi-mortarboard-fill me-1"></i>
                                        {{ app()->getLocale() == 'ar' ? $teacherSubject->educationLevel->name_ar : $teacherSubject->educationLevel->name_en }}
                                    </h6>
                                    <p class="mb-0 small opacity-90">
                                        <i class="bi bi-building me-1"></i>
                                        {{ app()->getLocale() == 'ar' ? $teacherSubject->class->name_ar : $teacherSubject->class->name }}
                                    </p>
                                </div>
                                <span class="badge bg-white text-primary">{{ $teacherSubject->subject->code }}</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title mb-3">
                                <i class="bi bi-book me-2 text-primary"></i>
                                {{ app()->getLocale() == 'ar' ? $teacherSubject->subject->name_ar : $teacherSubject->subject->name }}
                            </h5>
                            <p class="card-text text-muted small">
                                <i class="bi bi-calendar-plus me-1"></i>
                                {{ app()->getLocale() == 'ar' ? 'أضيفت في:' : 'Added on:' }} 
                                {{ $teacherSubject->created_at->format('M d, Y') }}
                            </p>
                        </div>
                        <div class="card-footer bg-transparent border-top-0">
                            <div class="d-flex justify-content-between gap-2">
                                <a href="{{ route('teacher.subjects.edit', $teacherSubject->id) }}" 
                                   class="btn btn-sm btn-outline-primary flex-fill">
                                    <i class="bi bi-pencil-square"></i> 
                                    {{ app()->getLocale() == 'ar' ? 'تعديل' : 'Edit' }}
                                </a>
                                <form action="{{ route('teacher.subjects.destroy', $teacherSubject->id) }}" 
                                      method="POST" 
                                      class="flex-fill"
                                      onsubmit="return confirm('{{ app()->getLocale() == 'ar' ? 'هل أنت متأكد من حذف هذه المادة؟' : 'Are you sure you want to remove this subject?' }}');">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="btn btn-sm btn-outline-danger w-100">
                                        <i class="bi bi-trash"></i> 
                                        {{ app()->getLocale() == 'ar' ? 'حذف' : 'Delete' }}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            @endforeach
        </div>

        {{-- <div class="d-flex justify-content-center mt-4">
            {{ $subjects->links() }}
        </div> --}}
    @else
        <div class="text-center py-5">
            <div class="empty-state">
                <i class="bi bi-book display-1 text-muted mb-3"></i>
                <h4 class="text-muted">{{ app()->getLocale() == 'en' ? 'No subjects assigned yet' : 'لا توجد مواد مخصصة بعد' }}</h4>
                <p class="text-muted mb-4">{{ app()->getLocale() == 'en' ? 'Start by adding your first subject to teach' : 'ابدأ بإضافة أول مادة لتدريسها' }}</p>
                <a href="{{ route('teacher.subjects.create') }}" class="btn btn-primary btn-lg">
                    <i class="bi bi-plus-circle me-2"></i>
                    {{ app()->getLocale() == 'en' ? 'Add Your First Subject' : 'إضافة أول مادة لك' }}
                </a>
            </div>
        </div>
    @endif
</div>
@endsection

@push('styles')
<style>
    .subject-card {
        border: none;
        border-radius: 12px;
        transition: transform 0.2s, box-shadow 0.2s;
        overflow: hidden;
    }
    
    .subject-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15) !important;
    }
    
    .card-header.bg-gradient {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        padding: 1.25rem;
    }
    
    .card-title {
        font-weight: 600;
        color: #2d3748;
    }
    
    .card-footer {
        padding: 1rem;
    }
    
    .btn-outline-primary:hover {
        background-color: #667eea;
        border-color: #667eea;
    }
    
    .btn-outline-danger:hover {
        background-color: #dc3545;
        border-color: #dc3545;
    }
    
    .empty-state {
        max-width: 500px;
        margin: 0 auto;
        padding: 3rem 1rem;
    }
    
    .empty-state i {
        opacity: 0.5;
    }

    @media (max-width: 768px) {
        .col-md-6 {
            padding: 0.5rem;
        }
    }
</style>
@endpush
