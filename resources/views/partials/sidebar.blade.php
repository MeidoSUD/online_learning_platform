@php
    $user = Auth::user();
@endphp

@if($user)
    @php
        // You can use role_id or role name depending on your setup
        // Example: 1 = admin, 3 = teacher, 4 = student
    @endphp

    @if($user->role_id == 1)
        @include('partials.sidebar-admin')
    @elseif($user->role_id == 3)
        @include('partials.sidebar-teacher')
    @elseif($user->role_id == 4)
        @include('partials.sidebar-student')
    @else
        {{-- Default sidebar or nothing --}}
    @endif
@endif