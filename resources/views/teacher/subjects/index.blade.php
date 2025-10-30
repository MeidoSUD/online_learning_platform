
@extends('layouts.app')

@section('title', app()->getLocale() == 'en' ? 'My Subjects' : 'المواد الدراسية الخاصة بي')
<!-- View: teacher/subjects/index -->
@section('content')
<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h2 class="mb-1">{{app()->getLocale() == 'en' ? 'My Subjects' : 'المواد الدراسية الخاصة بي'}}</h2>
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item"><a href="{{ route('teacher.dashboard') }}">Dashboard</a></li>
                            <li class="breadcrumb-item active">{{app()->getLocale() == 'en' ? 'Subjects' : 'المواد الدراسية'}}</li>
                        </ol>
                    </nav>
                </div>
                <a href="{{ route('teacher.subjects.create') }}" class="btn btn-primary">
                    <i class="bi bi-plus-circle"></i> {{app()->getLocale() == 'en' ? 'Add Subject' : 'أضف مادة'}}
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

    <div class="row">
        <div class="col-md-12">
            <div class="card shadow-sm">
                <div class="card-body">
                    @if($subjects->count() > 0)
                        <div class="table-responsive">
                            <table class="table table-hover align-middle">
                                <thead class="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>{{app()->getLocale() == 'en' ? 'Subject Name' : 'اسم المادة'}}</th>
                                        <th>{{app()->getLocale() == 'en' ? 'Subject Code' : 'رمز المادة'}}</th>
                                        <th>{{app()->getLocale() == 'en' ? 'Added On' : 'تاريخ الإضافة'}}</th>
                                        <th class="text-center">{{app()->getLocale() == 'en' ? 'Actions' : 'الإجراءات'}}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($subjects as $index => $teacherSubject)
                                        <tr>
                                            <td>{{ $subjects->firstItem() + $index }}</td>
                                            <td>
                                                <strong>{{ app()->getLocale() == 'ar' ? $teacherSubject->subject->name_ar ?? 'N/A' : $teacherSubject->subject->name_en ?? 'N/A' }}</strong>
                                            </td>
                                            <td>
                                                <span class="badge bg-info">{{ $teacherSubject->subject->code ?? 'N/A' }}</span>
                                            </td>
                                            <td>{{ $teacherSubject->created_at->format('M d, Y') }}</td>
                                            <td class="text-center">
                                                <div class="btn-group" role="group">
                                                    <a href="{{ route('teacher.subjects.edit', $teacherSubject->id) }}" 
                                                       class="btn btn-sm btn-outline-primary" 
                                                       title="Edit">
                                                        <i class="edit-icon"></i>
                                                    </a>
                                                    <form action="{{ route('teacher.subjects.destroy', $teacherSubject->id) }}" 
                                                          method="POST" 
                                                          class="d-inline"
                                                          onsubmit="return confirm('Are you sure you want to remove this subject?');">
                                                        @csrf
                                                        @method('DELETE')
                                                        <button type="submit" class="btn btn-sm btn-outline-danger" title="Delete">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>

                        <div class="d-flex justify-content-center mt-3">
                            {{ $subjects->links() }}
                        </div>
                    @else
                        <div class="text-center py-5">
                            <i class="bi bi-book display-1 text-muted"></i>
                            <p class="mt-3 text-muted">{{app()->getLocale() == 'en' ? 'No subjects assigned yet.' : 'لا توجد مواد مخصصة بعد.'}}</p>
                            <a href="{{ route('teacher.subjects.create') }}" class="btn btn-primary">
                                {{app()->getLocale() == 'en' ? 'Add Your First Subject' : 'إضافة أول مادة لك'}}
                            </a>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
@push('styles')
<style>
    .card {
        border: none;
        border-radius: 10px;
    }
    
    .table th {
        font-weight: 600;
        color: #495057;
        border-bottom: 2px solid #dee2e6;
    }
    
    .btn-group .btn {
        margin: 0 2px;
    }
</style>
@endpush
<!-- End of View: teacher/subjects/index -->