<!-- View: teacher/lessons/edit -->
@section('content')
<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-md-12">
            <h2 class="mb-1">{{ app()->getLocale() == 'ar' ? 'تعديل الصف' : 'Edit Class' }}</h2>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('teacher.dashboard') }}">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</a></li>
                    <li class="breadcrumb-item"><a href="{{ route('teacher.classes.index') }}">{{ app()->getLocale() == 'ar' ? 'الفصول الدراسية' : 'Classes' }}</a></li>
                    <li class="breadcrumb-item active">{{ app()->getLocale() == 'ar' ? 'تعديل' : 'Edit' }}</li>
                </ol>
            </nav>
        </div>
    </div>

    <div class="row">
        <div class="col-md-8 offset-md-2">
            <div class="card shadow-sm">
                <div class="card-header bg-warning text-dark">
                    <h5 class="mb-0"><i class="bi bi-pencil me-2"></i>{{ app()->getLocale() == 'ar' ? 'تحديث تعيين الصف' : 'Update Class Assignment' }}</h5>
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

                    <form action="{{ route('teacher.classes.update', $teacherClass->id) }}" method="POST">
                        @csrf
                        @method('PUT')

                        <div class="mb-3">
                            <label class="form-label fw-bold">{{ app()->getLocale() == 'ar' ? 'الصف الحالي' : 'Current Class' }}</label>
                            <p class="form-control-plaintext bg-light p-2 rounded">
                                {{ $teacherClass->class->name ?? 'N/A' }} 
                                <span class="badge bg-success">{{ app()->getLocale() == 'ar' ? 'الصف' : 'Grade' }} {{ $teacherClass->class->grade ?? 'N/A' }}</span>
                            </p>
                        </div>

                        <div class="mb-4">
                            <label for="class_id" class="form-label fw-bold">
                                {{ app()->getLocale() == 'ar' ? 'تغيير إلى الصف' : 'Change to Class' }} <span class="text-danger">*</span>
                            </label>
                            <select name="class_id" 
                                    id="class_id" 
                                    class="form-select @error('class_id') is-invalid @enderror" 
                                    required>
                                <option value="">-- {{ app()->getLocale() == 'ar' ? 'اختر صفًا' : 'Select Class' }} --</option>
                                @foreach($allClasses as $class)
                                    <option value="{{ $class->id }}" 
                                            {{ old('class_id', $teacherClass->class_id) == $class->id ? 'selected' : '' }}>
                                        {{ $class->name }} ({{ app()->getLocale() == 'ar' ? 'الصف' : 'Grade' }} {{ $class->grade }})
                                    </option>
                                @endforeach
                            </select>
                            @error('class_id')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <div class="d-flex justify-content-between">
                            <a href="{{ route('teacher.classes.index') }}" class="btn btn-secondary">
                                <i class="bi bi-arrow-left"></i> {{ app()->getLocale() == 'ar' ? 'إلغاء' : 'Cancel' }}
                            </a>
                            <button type="submit" class="btn btn-warning text-dark">
                                <i class="bi bi-check-circle"></i> {{ app()->getLocale() == 'ar' ? 'تحديث الصف' : 'Update Class' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
    <!-- END: Content-->

    <script src="{{ asset('/app-assets/vendors/js/vendors.min.js') }}"></script>
    <script src="{{ asset('/app-assets/js/core/app-menu.js') }}"></script>
    <script src="{{ asset('/app-assets/js/core/app.js') }}"></script>
    <script src="{{ asset('/app-assets/js/scripts/customizer.js') }}"></script>
    