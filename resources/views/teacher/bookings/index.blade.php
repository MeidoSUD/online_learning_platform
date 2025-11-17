<!-- View: teacher/bookings/index -->
@extends('layouts.app')

@section('content')
<div class="container">

    <h3 class="mb-4">
        {{ app()->getLocale() == 'ar' ? 'حجوزاتي' : 'My Bookings' }}
    </h3>

    @if($bookings->count() > 0)

        <table class="table table-bordered table-striped">
            <thead>
                <tr>
                    <th>{{ app()->getLocale() == 'ar' ? 'التاريخ' : 'Date' }}</th>
                    <th>{{ app()->getLocale() == 'ar' ? 'الوقت' : 'Time' }}</th>
                    <th>{{ app()->getLocale() == 'ar' ? 'الطالب' : 'Student' }}</th>
                    <th>{{ app()->getLocale() == 'ar' ? 'نوع الجلسة' : 'Session Type' }}</th>
                    <th>{{ app()->getLocale() == 'ar' ? 'الحالة' : 'Status' }}</th>
                    <th>{{ app()->getLocale() == 'ar' ? 'التقييم' : 'Rating' }}</th>
                </tr>
            </thead>

            <tbody>

                @foreach($bookings as $booking)
                    <tr>
                        {{-- Date --}}
                        <td>{{ $booking->first_session_date }}</td>

                        {{-- Time --}}
                        <td>{{ $booking->first_session_start_time }} - {{ $booking->first_session_end_time }}</td>

                        {{-- Student --}}
                        <td>
                            {{ $booking->student->name ?? (app()->getLocale() == 'ar' ? 'غير معروف' : 'Unknown') }}
                        </td>

                        {{-- Session Type --}}
                        <td>
                            @if($booking->session_type == 'group')
                                {{ app()->getLocale() == 'ar' ? 'جلسة جماعية' : 'Group Session' }}
                            @else
                                {{ app()->getLocale() == 'ar' ? 'جلسة فردية' : 'Individual Session' }}
                            @endif
                        </td>

                        {{-- Status --}}
                        <td>
                            @switch($booking->status)
                                @case('pending')
                                    {{ app()->getLocale() == 'ar' ? 'قيد الانتظار' : 'Pending' }}
                                    @break

                                @case('confirmed')
                                    {{ app()->getLocale() == 'ar' ? 'مؤكدة' : 'Confirmed' }}
                                    @break

                                @case('completed')
                                    {{ app()->getLocale() == 'ar' ? 'مكتملة' : 'Completed' }}
                                    @break

                                @case('cancelled')
                                    {{ app()->getLocale() == 'ar' ? 'ملغاة' : 'Cancelled' }}
                                    @break
                            @endswitch
                        </td>

                        {{-- Rating --}}
                        <td>
                            @if($booking->rating)
                                {{ $booking->rating }} ⭐
                            @else
                                {{ app()->getLocale() == 'ar' ? 'لم تقم بالتقييم بعد' : 'Not rated yet' }}
                            @endif
                        </td>

                    </tr>
                @endforeach

            </tbody>
        </table>

    @else
        <p class="text-center mt-4">
            {{ app()->getLocale() == 'ar' ? 'لا توجد حجوزات' : 'No bookings available' }}
        </p>
    @endif

</div>
@endsection
