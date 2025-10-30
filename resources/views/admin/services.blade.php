@extends('layouts/contentLayoutMaster')

@section('title', 'Services List')

@section('vendor-style')
  {{-- Page Css files --}}
  <link rel="stylesheet" href="{{ asset(mix('vendors/css/forms/select/select2.min.css')) }}">
  <link rel="stylesheet" href="{{ asset(mix('vendors/css/tables/datatable/dataTables.bootstrap5.min.css')) }}">
  <link rel="stylesheet" href="{{ asset(mix('vendors/css/tables/datatable/responsive.bootstrap5.min.css')) }}">
  <link rel="stylesheet" href="{{ asset(mix('vendors/css/tables/datatable/buttons.bootstrap5.min.css')) }}">
  <link rel="stylesheet" href="{{ asset(mix('vendors/css/tables/datatable/rowGroup.bootstrap5.min.css')) }}">
@endsection

@section('page-style')
  {{-- Page Css files --}}
  <link rel="stylesheet" href="{{ asset(mix('css/base/plugins/forms/form-validation.css')) }}">
@endsection
<!-- users list start -->
@section('content')
<section class="app-user-list">
  <div class="card">
    <div class="card-header">
      <h4 class="card-title">Services</h4>
      @if(session('status'))
        <div class="alert alert-success">
          {{ session('status') }}
        </div>
       @endif
      <a href="javascript:void(0);" class="btn btn-primary float-end" data-bs-toggle="modal" data-bs-target="#exampleModal">
        Add Service
      </a>
    </div>
    <div class="card-datatable table-responsive pt-0">
      <table class="table">
        <thead class="table-light">
          <tr>
            <th>No</th>
            <th>Role</th>
            <th>Name (AR)</th>
            <th>Name (EN)</th>
            <th>Description (AR)</th>
            <th>Description (EN)</th>
            <th>Image</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @foreach($services as $index => $service)
            <tr>
                
              <td>{{ $index + 1 }}</td>
              <td>{{ $service->role_id }}</td>
              <td>{{ $service->name_ar }}</td>
              <td>{{ $service->name_en }}</td>
              <td>{{ Str::limit($service->description_ar, 50) }}</td>
              <td>{{ Str::limit($service->description_en, 50) }}</td>
              <td>
                @if($service->image)
                    <img src="{{ asset('storage/' . $service->image) }}" alt="Service Image" width="60">
                @else
                  N/A
                @endif
              </td>
              <td>
                @if($service->is_active)
                  <span class="badge bg-success">Active</span>
                @else
                  <span class="badge bg-secondary">Stopped</span>
                @endif
              </td>
              <td>
                <a href="{{ route('admin.services.edit', $service->id) }}" class="btn btn-sm btn-info">Edit</a>
                <form action="{{ route('admin.services.destroy', $service->id) }}" method="POST" style="display:inline-block;">
                  @csrf
                  @method('DELETE')
                  <button type="submit" class="btn btn-sm btn-danger" onclick="return confirm('Delete this service?')">Delete</button>
                </form>
                @if($service->is_active)
                  <form action="{{ route('admin.services.status', $service->id) }}" method="POST" style="display:inline-block;">
                    @csrf
                    <input type="hidden" name="is_active" value="0">
                    <button type="submit" class="btn btn-sm btn-warning">Stop</button>
                  </form>
                @else
                  <form action="{{ route('admin.services.status', $service->id) }}" method="POST" style="display:inline-block;">
                    @csrf
                    <input type="hidden" name="is_active" value="1">
                    <button type="submit" class="btn btn-sm btn-success">Activate</button>
                  </form>
                @endif
              </td>
            </tr>
          @endforeach
        </tbody>
      </table>
    </div>
    <!-- Add Service Inline Form -->
    <div class="card mb-2">
      <div class="card-header">
        <h4 class="card-title">Add Service</h4>
      </div>
      <div class="card-body">
        <form action="{{ route('admin.services.store') }}" method="POST" enctype="multipart/form-data">
          @csrf
          <div class="row">
            <div class="col-md-6 mb-1">
              <label class="form-label" for="name_en">Role</label>
              <select id="role" name="role" class="form-select" required>
                @foreach($role as $r)
                  <option value="{{ $r->id }}">{{ $r->name_key }}</option>
                @endforeach
              </select>
            </div>
            <div class="col-md-6 mb-1">
              <label class="form-label" for="name_en">English Name</label>
              <input type="text" class="form-control" id="name_en" name="name_en" required>
            </div>
            <div class="col-md-6 mb-1">
              <label class="form-label" for="name_ar">Arabic Name</label>
              <input type="text" class="form-control" id="name_ar" name="name_ar" required>
            </div>
            <div class="col-md-6 mb-1">
              <label class="form-label" for="description_en">Description (EN)</label>
              <textarea class="form-control" id="description_en" name="description_en" rows="2" required></textarea>
            </div>
            <div class="col-md-6 mb-1">
              <label class="form-label" for="description_ar">Description (AR)</label>
              <textarea class="form-control" id="description_ar" name="description_ar" rows="2" required></textarea>
            </div>
            <div class="col-md-6 mb-1">
              <label class="form-label" for="image">Service Icon</label>
              <input type="file" class="form-control" id="image" name="image" accept="image/*">
            </div>
            <div class="col-md-6 mb-1">
              <label class="form-label" for="is_active">Status</label>
              <select id="is_active" name="is_active" class="form-select" required>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>
          <button type="submit" class="btn btn-primary mt-1">Submit</button>
        </form>
      </div>
    </div>
  </div>
</section>
@endsection
<!-- users list ends -->
@endsection

@section('vendor-script')
  {{-- Vendor js files --}}
  <script src="{{ asset(mix('vendors/js/forms/select/select2.full.min.js')) }}"></script>
  <script src="{{ asset(mix('vendors/js/tables/datatable/jquery.dataTables.min.js')) }}"></script>
  <script src="{{ asset(mix('vendors/js/tables/datatable/dataTables.bootstrap5.min.js')) }}"></script>
  <script src="{{ asset(mix('vendors/js/tables/datatable/dataTables.responsive.min.js')) }}"></script>
  <script src="{{ asset(mix('vendors/js/tables/datatable/responsive.bootstrap5.js')) }}"></script>
  <script src="{{ asset(mix('vendors/js/tables/datatable/datatables.buttons.min.js')) }}"></script>
  <script src="{{ asset(mix('vendors/js/tables/datatable/jszip.min.js')) }}"></script>
  <script src="{{ asset(mix('vendors/js/tables/datatable/pdfmake.min.js')) }}"></script>
  <script src="{{ asset(mix('vendors/js/tables/datatable/vfs_fonts.js')) }}"></script>
  <script src="{{ asset(mix('vendors/js/tables/datatable/buttons.html5.min.js')) }}"></script>
  <script src="{{ asset(mix('vendors/js/tables/datatable/buttons.print.min.js')) }}"></script>
  <script src="{{ asset(mix('vendors/js/tables/datatable/dataTables.rowGroup.min.js')) }}"></script>
  <script src="{{ asset(mix('vendors/js/forms/validation/jquery.validate.min.js')) }}"></script>
  <script src="{{ asset(mix('vendors/js/forms/cleave/cleave.min.js')) }}"></script>
  <script src="{{ asset(mix('vendors/js/forms/cleave/addons/cleave-phone.us.js')) }}"></script>
@endsection

@section('page-script')
  {{-- Page js files --}}
  <script src="{{ asset(mix('js/scripts/pages/app-user-list.js')) }}"></script>
  <script>
    $('#exampleModal').on('hidden.bs.modal', function () {
      // Move focus to the Add Service button after modal closes
      $('.btn[data-bs-target="#exampleModal"]').focus();
    });
    $('.form-add').validate();
    $('.form-add').on('submit', function(e) {
      e.preventDefault();
        this.submit();
    });
  </script>
@endsection
