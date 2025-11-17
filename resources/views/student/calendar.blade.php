
@extends('layouts.app')

@section('title', app()->getLocale() == 'ar' ? 'التقويم الدراسي' : 'Academic Calendar')

@section('content')
<div class="container-fluid">
    <!-- Header -->
    <div class="row mb-4">
        <div class="col-md-12">
            <h2 class="mb-1">{{ app()->getLocale() == 'ar' ? 'التقويم الدراسي' : 'My Calendar' }}</h2>
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="{{ route('student.dashboard') }}">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}</a></li>
                    <li class="breadcrumb-item active">{{ app()->getLocale() == 'ar' ? 'التقويم' : 'Calendar' }}</li>
                </ol>
            </nav>
        </div>
    </div>

    <!-- Statistics Cards -->
    <div class="row mb-4">
        <div class="col-md-3 mb-3">
            <div class="card shadow-sm border-primary">
                <div class="card-body text-center">
                    <i class="bi bi-calendar-check text-primary" style="font-size: 2rem;"></i>
                    <h3 class="mt-2 mb-0">{{ $stats['total_sessions'] }}</h3>
                    <p class="text-muted mb-0">{{ app()->getLocale() == 'ar' ? 'إجمالي الجلسات' : 'Total Sessions' }}</p>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="card shadow-sm border-success">
                <div class="card-body text-center">
                    <i class="bi bi-check-circle text-success" style="font-size: 2rem;"></i>
                    <h3 class="mt-2 mb-0">{{ $stats['completed_sessions'] }}</h3>
                    <p class="text-muted mb-0">{{ app()->getLocale() == 'ar' ? 'جلسات مكتملة' : 'Completed' }}</p>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="card shadow-sm border-warning">
                <div class="card-body text-center">
                    <i class="bi bi-clock text-warning" style="font-size: 2rem;"></i>
                    <h3 class="mt-2 mb-0">{{ $stats['upcoming_sessions'] }}</h3>
                    <p class="text-muted mb-0">{{ app()->getLocale() == 'ar' ? 'جلسات قادمة' : 'Upcoming' }}</p>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="card shadow-sm border-danger">
                <div class="card-body text-center">
                    <i class="bi bi-x-circle text-danger" style="font-size: 2rem;"></i>
                    <h3 class="mt-2 mb-0">{{ $stats['cancelled_sessions'] }}</h3>
                    <p class="text-muted mb-0">{{ app()->getLocale() == 'ar' ? 'جلسات ملغاة' : 'Cancelled' }}</p>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <!-- Calendar Section -->
        <div class="col-lg-8 mb-4">
            <div class="card shadow-sm">
                <div class="card-header bg-primary text-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
                            <i class="bi bi-calendar3 me-2"></i>
                            {{ $date->translatedFormat('F Y') }}
                        </h5>
                        <div class="btn-group">
                            <a href="{{ route('student.calendar', ['month' => $date->copy()->subMonth()->month, 'year' => $date->copy()->subMonth()->year]) }}" 
                               class="btn btn-sm btn-light">
                                <i class="bi bi-chevron-left"></i>
                            </a>
                            <a href="{{ route('student.calendar') }}" class="btn btn-sm btn-light">
                                {{ app()->getLocale() == 'ar' ? 'اليوم' : 'Today' }}
                            </a>
                            <a href="{{ route('student.calendar', ['month' => $date->copy()->addMonth()->month, 'year' => $date->copy()->addMonth()->year]) }}" 
                               class="btn btn-sm btn-light">
                                <i class="bi bi-chevron-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-bordered mb-0 calendar-table">
                            <thead class="bg-light">
                                <tr>
                                    <th class="text-center">{{ app()->getLocale() == 'ar' ? 'الأحد' : 'Sun' }}</th>
                                    <th class="text-center">{{ app()->getLocale() == 'ar' ? 'الإثنين' : 'Mon' }}</th>
                                    <th class="text-center">{{ app()->getLocale() == 'ar' ? 'الثلاثاء' : 'Tue' }}</th>
                                    <th class="text-center">{{ app()->getLocale() == 'ar' ? 'الأربعاء' : 'Wed' }}</th>
                                    <th class="text-center">{{ app()->getLocale() == 'ar' ? 'الخميس' : 'Thu' }}</th>
                                    <th class="text-center">{{ app()->getLocale() == 'ar' ? 'الجمعة' : 'Fri' }}</th>
                                    <th class="text-center">{{ app()->getLocale() == 'ar' ? 'السبت' : 'Sat' }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @php
                                    $startOfMonth = $date->copy()->startOfMonth();
                                    $endOfMonth = $date->copy()->endOfMonth();
                                    $startDay = $startOfMonth->dayOfWeek;
                                    $daysInMonth = $date->daysInMonth;
                                    $currentDay = 1;
                                    $totalCells = ceil(($daysInMonth + $startDay) / 7) * 7;
                                @endphp
                                
                                @for ($week = 0; $week < ($totalCells / 7); $week++)
                                    <tr>
                                        @for ($day = 0; $day < 7; $day++)
                                            @php
                                                $cellNumber = ($week * 7) + $day;
                                                $dayNumber = $cellNumber - $startDay + 1;
                                                $isValidDay = $dayNumber > 0 && $dayNumber <= $daysInMonth;
                                                
                                                if ($isValidDay) {
                                                    $currentDate = $date->copy()->day($dayNumber)->format('Y-m-d');
                                                    $daySessions = $sessionsByDate->get($currentDate, collect());
                                                    $isToday = $currentDate === now()->format('Y-m-d');
                                                } else {
                                                    $daySessions = collect();
                                                    $isToday = false;
                                                }
                                            @endphp
                                            
                                            <td class="calendar-day {{ $isToday ? 'today' : '' }} {{ $isValidDay ? '' : 'empty-day' }}" 
                                                style="height: 100px; vertical-align: top; position: relative;">
                                                @if($isValidDay)
                                                    <div class="day-number {{ $isToday ? 'text-primary fw-bold' : '' }}">
                                                        {{ $dayNumber }}
                                                    </div>
                                                    
                                                    @if($daySessions->count() > 0)
                                                        <div class="sessions-container mt-1">
                                                            @foreach($daySessions as $session)
                                                                <a href="{{ route('student.session.details', $session->id) }}" 
                                                                   class="session-item d-block text-decoration-none mb-1 p-1 rounded 
                                                                   @if($session->status == 'completed') bg-success text-white
                                                                   @elseif($session->status == 'cancelled') bg-danger text-white
                                                                   @elseif($session->status == 'scheduled') bg-primary text-white
                                                                   @else bg-warning text-dark
                                                                   @endif"
                                                                   style="font-size: 0.75rem;"
                                                                   title="{{ app()->getLocale() == 'ar' ? 'المعلم' : 'Teacher' }}: {{ $session->teacher->name ?? 'N/A' }}">
                                                                    <i class="bi bi-clock"></i> {{ \Carbon\Carbon::parse($session->start_time)->format('h:i A') }}
                                                                </a>
                                                            @endforeach
                                                        </div>
                                                    @endif
                                                @endif
                                            </td>
                                        @endfor
                                    </tr>
                                @endfor
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Legend -->
            <div class="card shadow-sm mt-3">
                <div class="card-body">
                    <h6 class="mb-3">{{ app()->getLocale() == 'ar' ? 'مفتاح الألوان' : 'Legend' }}</h6>
                    <div class="d-flex flex-wrap gap-3">
                        <div><span class="badge bg-primary">{{ app()->getLocale() == 'ar' ? 'مجدولة' : 'Scheduled' }}</span></div>
                        <div><span class="badge bg-success">{{ app()->getLocale() == 'ar' ? 'مكتملة' : 'Completed' }}</span></div>
                        <div><span class="badge bg-warning text-dark">{{ app()->getLocale() == 'ar' ? 'قيد التقدم' : 'In Progress' }}</span></div>
                        <div><span class="badge bg-danger">{{ app()->getLocale() == 'ar' ? 'ملغاة' : 'Cancelled' }}</span></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Upcoming Sessions Sidebar -->
        <div class="col-lg-4">
            <!-- Upcoming Sessions -->
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-warning text-dark">
                    <h6 class="mb-0">
                        <i class="bi bi-calendar-event me-2"></i>
                        {{ app()->getLocale() == 'ar' ? 'الجلسات القادمة' : 'Upcoming Sessions' }}
                    </h6>
                </div>
                <div class="card-body p-0">
                    @if($upcomingSessions->count() > 0)
                        <div class="list-group list-group-flush">
                            @foreach($upcomingSessions as $session)
                                <a href="{{ route('student.session.details', $session->id) }}" 
                                   class="list-group-item list-group-item-action">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div class="flex-grow-1">
                                            <h6 class="mb-1">
                                                {{ app()->getLocale() == 'ar' ? 'جلسة رقم' : 'Session' }} #{{ $session->session_number }}
                                            </h6>
                                            <p class="mb-1 text-muted small">
                                                <i class="bi bi-person"></i> {{ $session->teacher->name ?? 'N/A' }}
                                            </p>
                                            <p class="mb-0 small">
                                                <i class="bi bi-calendar"></i> {{ \Carbon\Carbon::parse($session->session_date)->format('M d, Y') }}
                                                <br>
                                                <i class="bi bi-clock"></i> {{ \Carbon\Carbon::parse($session->start_time)->format('h:i A') }} - {{ \Carbon\Carbon::parse($session->end_time)->format('h:i A') }}
                                            </p>
                                        </div>
                                        <span class="badge bg-primary">{{ ucfirst($session->status) }}</span>
                                    </div>
                                </a>
                            @endforeach
                        </div>
                    @else
                        <div class="p-4 text-center text-muted">
                            <i class="bi bi-calendar-x display-4"></i>
                            <p class="mt-2 mb-0">{{ app()->getLocale() == 'ar' ? 'لا توجد جلسات قادمة' : 'No upcoming sessions' }}</p>
                        </div>
                    @endif
                </div>
            </div>

            <!-- Past Sessions -->
            <div class="card shadow-sm">
                <div class="card-header bg-success text-white">
                    <h6 class="mb-0">
                        <i class="bi bi-check-circle me-2"></i>
                        {{ app()->getLocale() == 'ar' ? 'الجلسات السابقة' : 'Recent Past Sessions' }}
                    </h6>
                </div>
                <div class="card-body p-0">
                    @if($pastSessions->count() > 0)
                        <div class="list-group list-group-flush">
                            @foreach($pastSessions as $session)
                                <a href="{{ route('student.session.details', $session->id) }}" 
                                   class="list-group-item list-group-item-action">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div class="flex-grow-1">
                                            <h6 class="mb-1">
                                                {{ app()->getLocale() == 'ar' ? 'جلسة رقم' : 'Session' }} #{{ $session->session_number }}
                                            </h6>
                                            <p class="mb-1 text-muted small">
                                                <i class="bi bi-person"></i> {{ $session->teacher->name ?? 'N/A' }}
                                            </p>
                                            <p class="mb-0 small">
                                                <i class="bi bi-calendar"></i> {{ \Carbon\Carbon::parse($session->session_date)->format('M d, Y') }}
                                            </p>
                                        </div>
                                        <span class="badge bg-success">{{ app()->getLocale() == 'ar' ? 'مكتملة' : 'Completed' }}</span>
                                    </div>
                                </a>
                            @endforeach
                        </div>
                    @else
                        <div class="p-4 text-center text-muted">
                            <i class="bi bi-inbox display-4"></i>
                            <p class="mt-2 mb-0">{{ app()->getLocale() == 'ar' ? 'لا توجد جلسات سابقة' : 'No past sessions' }}</p>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.calendar-table {
    font-size: 0.9rem;
}

.calendar-day {
    padding: 5px;
    min-height: 100px;
}

.calendar-day.today {
    background-color: #fff3cd;
}

.calendar-day.empty-day {
    background-color: #f8f9fa;
}

.day-number {
    font-weight: 600;
    margin-bottom: 5px;
}

.session-item {
    transition: all 0.2s;
}

.session-item:hover {
    opacity: 0.8;
    transform: translateX(2px);
}

.sessions-container {
    max-height: 80px;
    overflow-y: auto;
}

.sessions-container::-webkit-scrollbar {
    width: 4px;
}

.sessions-container::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
}
</style>
@endsection

