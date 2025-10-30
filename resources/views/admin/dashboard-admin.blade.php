@extends('layouts/app')

@section('title', 'Dashboard Admin')

@section('vendor-style')
  {{-- vendor css files --}}
  <link rel="stylesheet" href="{{ asset(mix('vendors/css/charts/apexcharts.css')) }}">
  <link rel="stylesheet" href="{{ asset(mix('vendors/css/extensions/toastr.min.css')) }}">
@endsection
@section('page-style')
  {{-- Page css files --}}
  <link rel="stylesheet" href="{{ asset(mix('css/base/pages/dashboard-ecommerce.css')) }}">
  <link rel="stylesheet" href="{{ asset(mix('css/base/plugins/charts/chart-apex.css')) }}">
  <link rel="stylesheet" href="{{ asset(mix('css/base/plugins/extensions/ext-component-toastr.css')) }}">
@endsection


@section('content')
<!-- Dashboard Ecommerce Starts -->
<section id="dashboard-ecommerce">
  <div class="row match-height">
    <!-- Statistics Card -->
    <div class="col-xl-3 col-sm-6 col-12 mb-2 mb-xl-0">
      <div class="d-flex flex-row">
        <div class="avatar bg-light-info me-2">
          <div class="avatar-content">
            <i data-feather="user" class="avatar-icon"></i>
          </div>
        </div>
        <div class="my-auto">
          <h4 class="fw-bolder mb-0">{{ $teachersCount }}</h4>
          <p class="card-text font-small-3 mb-0">Teachers</p>
        </div>
      </div>
    </div>
    <div class="col-xl-3 col-sm-6 col-12 mb-2 mb-xl-0">
      <div class="d-flex flex-row">
        <div class="avatar bg-light-info me-2">
          <div class="avatar-content">
            <i data-feather="user" class="avatar-icon"></i>
          </div>
        </div>
        <div class="my-auto">
          <h4 class="fw-bolder mb-0">{{ $studentsCount }}</h4>
          <p class="card-text font-small-3 mb-0">Students</p>
        </div>
      </div>
    </div>
    <div class="col-xl-3 col-sm-6 col-12 mb-2 mb-sm-0">
      <div class="d-flex flex-row">
        <div class="avatar bg-light-danger me-2">
          <div class="avatar-content">
            <i data-feather="book" class="avatar-icon"></i>
          </div>
        </div>
        <div class="my-auto">
          <h4 class="fw-bolder mb-0">{{ $coursesCount }}</h4>
          <p class="card-text font-small-3 mb-0">Courses</p>
        </div>
      </div>
    </div>
    <div class="col-xl-3 col-sm-6 col-12">
      <div class="d-flex flex-row">
        <div class="avatar bg-light-success me-2">
          <div class="avatar-content">
            <i data-feather="clipboard" class="avatar-icon"></i>
          </div>
        </div>
        <div class="my-auto">
          <h4 class="fw-bolder mb-0">{{ $lessonsCount }}</h4>
          <p class="card-text font-small-3 mb-0">Lessons</p>
        </div>
      </div>
    </div>
    <!-- Add similar cards for bookings, disputes, payouts, revenue, etc. -->
  </div>

  <div class="row match-height">
    <!-- Recent Teachers Table Card -->
    <div class="col-lg-8 col-12">
      <div class="card card-recent-teachers">
        <div class="card-header">
          <h4 class="card-title">Recent Teachers</h4>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                @foreach($recentTeachers as $teacher)
                  <tr>
                    <td>{{ $teacher->first_name }} {{ $teacher->last_name }}</td>
                    <td>{{ $teacher->email }}</td>
                    <td>{{ $teacher->created_at->format('Y-m-d') }}</td>
                  </tr>
                @endforeach
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <!--/ Recent Teachers Table Card -->
  </div>
</section>
<!-- Dashboard Ecommerce ends -->
@endsection

@section('vendor-script')
  {{-- vendor files --}}
  <script src="{{ asset(mix('vendors/js/charts/apexcharts.min.js')) }}"></script>
  <script src="{{ asset(mix('vendors/js/extensions/toastr.min.js')) }}"></script>
@endsection
@section('page-script')
  {{-- Page js files --}}
  <script src="{{ asset(mix('js/scripts/pages/dashboard-ecommerce.js')) }}"></script>
@endsection
