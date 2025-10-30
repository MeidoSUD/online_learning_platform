<!-- View: teacher/lessons/index -->
@section('content')
<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h2 class="mb-1">{{ app()->getLocale() == 'ar' ? 'صفوفي' : 'My Classes' }}</h2>
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item"><a href="{{ route('teacher.dashboard') }}">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</a></li>
                            <li class="breadcrumb-item active">{{ app()->getLocale() == 'ar' ? 'الفصول الدراسية' : 'Classes' }}</li>
                        </ol>
                    </nav>
                </div>
                <a href="{{ route('teacher.classes.create') }}" class="btn btn-primary">
                    <i class="bi bi-plus-circle"></i> {{ app()->getLocale() == 'ar' ? 'إضافة صف' : 'Add Class' }}
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
                    @if($classes->count() > 0)
                        <div class="table-responsive">
                            <table class="table table-hover align-middle">
                                <thead class="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>{{ app()->getLocale() == 'ar' ? 'اسم الصف' : 'Class Name' }}</th>
                                        <th>{{ app()->getLocale() == 'ar' ? 'الصف الدراسي' : 'Grade Level' }}</th>
                                        <th>{{ app()->getLocale() == 'ar' ? 'تاريخ الإضافة' : 'Added On' }}</th>
                                        <th class="text-center">{{ app()->getLocale() == 'ar' ? 'الإجراءات' : 'Actions' }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($classes as $index => $teacherClass)
                                        <tr>
                                            <td>{{ $classes->firstItem() + $index }}</td>
                                            <td>
                                                <strong>{{ $teacherClass->class->name ?? 'N/A' }}</strong>
                                            </td>
                                            <td>
                                                <span class="badge bg-success">{{ $teacherClass->class->grade ?? 'N/A' }}</span>
                                            </td>
                                            <td>{{ $teacherClass->created_at->format('M d, Y') }}</td>
                                            <td class="text-center">
                                                <div class="btn-group" role="group">
                                                    <a href="{{ route('teacher.classes.edit', $teacherClass->id) }}" 
                                                       class="btn btn-sm btn-outline-primary" 
                                                       title="Edit">
                                                        <i class="bi bi-pencil"></i>
                                                    </a>
                                                    <form action="{{ route('teacher.classes.destroy', $teacherClass->id) }}" 
                                                          method="POST" 
                                                          class="d-inline"
                                                          onsubmit="return confirm('Are you sure you want to remove this class?');">
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
                            {{ $classes->links() }}
                        </div>
                    @else
                        <div class="text-center py-5">
                            <i class="bi bi-people display-1 text-muted"></i>
                            <p class="mt-3 text-muted">No classes assigned yet.</p>
                            <a href="{{ route('teacher.classes.create') }}" class="btn btn-primary">
                                {{ app()->getLocale() == 'ar' ? 'إضافة صف' : 'Add Class' }}
                            </a>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
@endsection