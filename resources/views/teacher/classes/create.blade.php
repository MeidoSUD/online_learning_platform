<!-- View: teacher/lessons/create -->
@section('content')
<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-md-12">
            <h2 class="mb-1">{{ app()->getLocale() == 'ar' ? 'إضافة فصول' : 'Add Classes' }}</h2>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('teacher.dashboard') }}">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</a></li>
                    <li class="breadcrumb-item"><a href="{{ route('teacher.classes.index') }}">{{ app()->getLocale() == 'ar' ? 'الفصول الدراسية' : 'Classes' }}</a></li>
                    <li class="breadcrumb-item active">{{ app()->getLocale() == 'ar' ? 'إضافة' : 'Add' }}</li>
                </ol>
            </nav>
        </div>
    </div>

    <div class="row">
        <div class="col-md-8 offset-md-2">
            <div class="card shadow-sm">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="bi bi-plus-circle me-2"></i>{{ app()->getLocale() == 'ar' ? 'اختر الفصول لتدريسها' : 'Select Classes to Teach' }}</h5>
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

                    <form action="{{ route('teacher.classes.store') }}" method="POST">
                        @csrf

                        <div class="mb-4">
                            <label class="form-label fw-bold">{{ app()->getLocale() == 'ar' ? 'اختر الفصول' : 'Select Classes' }} <span class="text-danger">*</span></label>
                            <p class="text-muted small">{{ app()->getLocale() == 'ar' ? 'اختر واحدًا أو أكثر من الفصول التي ترغب في تدريسها.' : 'Choose one or more classes you would like to teach.' }}</p>

                            <div class="row">
                                @forelse($allClasses as $class)
                                    @if(!in_array($class->id, $assignedClassIds))
                                        <div class="col-md-6 mb-2">
                                            <div class="form-check">
                                                <input class="form-check-input" 
                                                       type="checkbox" 
                                                       name="class_id[]" 
                                                       value="{{ $class->id }}" 
                                                       id="class_{{ $class->id }}"
                                                       {{ in_array($class->id, old('class_id', [])) ? 'checked' : '' }}>
                                                    <label class="form-check-label" for="class_{{ $class->id }}">{{ $class->name }}</label>
                                                    <label class="form-check-label" for="class_{{ $class->id }}">
                                                    {{ $class->name }} 
                                                    <span class="badge bg-secondary">{{ app()->getLocale() == 'ar' ? 'الصف' : 'Grade' }} {{ $class->grade }}</span>
                                                </label>
                                            </div>
                                        </div>
                                    @endif
                                @empty
                                    <div class="col-12">
                                        <div class="alert alert-info">
                                            {{ app()->getLocale() == 'ar' ? 'لا توجد فصول متاحة في الوقت الحالي.' : 'No classes available at the moment.' }}
                                        </div>
                                    </div>
                                @endforelse
                            </div>

                            @if($allClasses->count() == count($assignedClassIds))
                                <div class="alert alert-warning mt-3">
                                    <i class="bi bi-info-circle me-2"></i>{{ app()->getLocale() == 'ar' ? 'لقد تم تعيينك بالفعل لجميع الفصول المتاحة.' : 'You have already been assigned all available classes.' }}
                                </div>
                            @endif
                        </div>

                        <div class="d-flex justify-content-between">
                            <a href="{{ route('teacher.classes.index') }}" class="btn btn-secondary">
                                <i class="bi bi-arrow-left"></i> Cancel
                            </a>
                            @if($allClasses->count() > count($assignedClassIds))
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-check-circle"></i> {{ app()->getLocale() == 'ar' ? 'حفظ الفصول' : 'Save Classes' }}
                                </button>
                            @endif
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection