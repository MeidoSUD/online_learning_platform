<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AvailabilitySlot;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class TeacherAvailabilityController extends Controller
{
    /**
     * Display availability management page with week view
     */
    public function index()
    {
        $teacher = Auth::user();
        $teacherTimezone = $teacher->timezone_name;
        $teacherOffset = $teacher->timezone_offset;

        $platformTimezone = config('app.timezone', 'Asia/Riyadh');
        $platformOffset = \App\Helpers\CountryTimezone::getOffset($platformTimezone);

        // Get all availability slots for this teacher and convert to teacher local time
        $slots = AvailabilitySlot::forTeacher($teacher->id)
            ->orderBy('day_number')
            ->orderBy('start_time')
            ->get();

        $convertedSlots = $slots->map(function ($slot) use ($platformOffset, $teacherOffset) {
            $rawTime = $slot->start_time instanceof Carbon
                ? $slot->start_time->format('H:i')
                : substr((string) $slot->start_time, 0, 5);

            $converted = \App\Helpers\CountryTimezone::convertSlotBetweenOffsets(
                $rawTime,
                (int) $slot->day_number,
                $platformOffset,
                $teacherOffset
            );

            $slot->converted_day = $converted['day'];
            $slot->display_start_time = $converted['start_time'];
            $slot->display_end_time = $converted['end_time'];
            return $slot;
        });

        $availabilitySlots = $convertedSlots->groupBy('converted_day');

        // Define days of week
        $daysOfWeek = [
            1 => app()->getLocale() == 'ar' ? 'السبت' : 'Saturday',
            2 => app()->getLocale() == 'ar' ? 'الأحد' : 'Sunday',
            3 => app()->getLocale() == 'ar' ? 'الإثنين' : 'Monday',
            4 => app()->getLocale() == 'ar' ? 'الثلاثاء' : 'Tuesday',
            5 => app()->getLocale() == 'ar' ? 'الأربعاء' : 'Wednesday',
            6 => app()->getLocale() == 'ar' ? 'الخميس' : 'Thursday',
            7 => app()->getLocale() == 'ar' ? 'الجمعة' : 'Friday',
        ];

        // Generate time slots 
        for ($hour = 0; $hour <= 23; $hour++) {
            $timeSlots[] = sprintf('%02d:00', $hour);
        }

        return view('teacher.availability.index', compact('availabilitySlots', 'daysOfWeek', 'timeSlots', 'teacherTimezone', 'teacherOffset'));
    }

    /**
     * Store a new availability slot
     */
    public function store(Request $request)
    {
        $request->validate([
            'day_number' => 'required|integer|between:1,7',
            'start_time' => 'required|date_format:H:i',
            'timezone' => 'nullable|string',
            'timezone_name' => 'nullable|string',
            'timezone_offset' => 'nullable|string',
            'teacher_timezone_offset' => 'nullable|string',
        ]);

        $teacher = Auth::user();

        $inTimezone = $request->input('timezone') ?? $request->input('timezone_name') ?? $request->header('X-Timezone');
        $inOffset = $request->input('timezone_offset') ?? $request->input('teacher_timezone_offset');

        $teacherTimezone = \App\Helpers\CountryTimezone::fromInput($inTimezone, $inOffset, $teacher->timezone_name);
        $teacherOffset = $inOffset ?: \App\Helpers\CountryTimezone::getOffset($teacherTimezone);

        if ($teacherTimezone && $teacher->timezone !== $teacherTimezone) {
            $teacher->update(['timezone' => $teacherTimezone]);
        }

        $platformTimezone = config('app.timezone', 'Asia/Riyadh');
        $platformOffset = \App\Helpers\CountryTimezone::getOffset($platformTimezone);

        $startTime = $request->start_time;

        // Convert from teacher local time to platform base storage time
        $converted = \App\Helpers\CountryTimezone::convertSlotBetweenOffsets(
            $startTime,
            (int) $request->day_number,
            $teacherOffset,
            $platformOffset
        );

        $storageDay = $converted['day'];
        $storageStartTime = $converted['start_time'];
        $storageEndTime = $converted['end_time'];

        // Check for overlapping slots in storage
        $exists = AvailabilitySlot::where('teacher_id', $teacher->id)
            ->where('day_number', $storageDay)
            ->where('start_time', $storageStartTime)
            ->exists();

        if ($exists) {
            return back()->with('error', 
                app()->getLocale() == 'ar' 
                    ? 'هذا الوقت محجوز بالفعل'
                    : 'This time slot already exists'
            );
        }

        AvailabilitySlot::create([
            'teacher_id' => $teacher->id,
            'day_number' => $storageDay,
            'start_time' => $storageStartTime,
            'end_time' => $storageEndTime,
            'is_available' => true,
            'is_booked' => false,
            'repeat_type' => 'weekly',
            'duration' => 60,
        ]);

        return back()->with('success', 
            app()->getLocale() == 'ar' 
                ? 'تم إضافة وقت الحصة بنجاح'
                : 'Availability slot added successfully'
        );
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $teacher = Auth::user();
        $slot = AvailabilitySlot::where('id', $id)
            ->where('teacher_id', $teacher->id)
            ->firstOrFail();

        return response()->json(['data' => $slot]);
    }

    /**
     * Show form for editing availability slot
     */
    public function edit($id)
    {
        $teacher = Auth::user();
        $slot = AvailabilitySlot::where('id', $id)
            ->where('teacher_id', $teacher->id)
            ->firstOrFail();

        $daysOfWeek = [
            1 => app()->getLocale() == 'ar' ? 'السبت' : 'Saturday',
            2 => app()->getLocale() == 'ar' ? 'الأحد' : 'Sunday',
            3 => app()->getLocale() == 'ar' ? 'الإثنين' : 'Monday',
            4 => app()->getLocale() == 'ar' ? 'الثلاثاء' : 'Tuesday',
            5 => app()->getLocale() == 'ar' ? 'الأربعاء' : 'Wednesday',
            6 => app()->getLocale() == 'ar' ? 'الخميس' : 'Thursday',
            7 => app()->getLocale() == 'ar' ? 'الجمعة' : 'Friday',
        ];

        // Generate time slots
        $timeSlots = [];
        for ($hour = 8; $hour < 20; $hour++) {
            $timeSlots[] = sprintf('%02d:00', $hour);
        }

        return view('teacher.availability.edit', compact('slot', 'daysOfWeek', 'timeSlots'));
    }

    /**
     * Update availability slot
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'day_number' => 'required|integer|between:1,7',
            'start_time' => 'required|date_format:H:i',
            'timezone' => 'nullable|string',
            'timezone_name' => 'nullable|string',
            'timezone_offset' => 'nullable|string',
            'teacher_timezone_offset' => 'nullable|string',
        ]);

        $teacher = Auth::user();

        $inTimezone = $request->input('timezone') ?? $request->input('timezone_name') ?? $request->header('X-Timezone');
        $inOffset = $request->input('timezone_offset') ?? $request->input('teacher_timezone_offset');

        $teacherTimezone = \App\Helpers\CountryTimezone::fromInput($inTimezone, $inOffset, $teacher->timezone_name);
        $teacherOffset = $inOffset ?: \App\Helpers\CountryTimezone::getOffset($teacherTimezone);

        if ($teacherTimezone && $teacher->timezone !== $teacherTimezone) {
            $teacher->update(['timezone' => $teacherTimezone]);
        }

        $platformTimezone = config('app.timezone', 'Asia/Riyadh');
        $platformOffset = \App\Helpers\CountryTimezone::getOffset($platformTimezone);

        $slot = AvailabilitySlot::where('id', $id)
            ->where('teacher_id', $teacher->id)
            ->firstOrFail();

        // Check if slot is booked, prevent update
        if ($slot->is_booked) {
            return back()->with('error',
                app()->getLocale() == 'ar'
                    ? 'لا يمكن تعديل وقت محجوز'
                    : 'Cannot edit booked time slot'
            );
        }

        $startTime = $request->start_time;

        // Convert from teacher local time to platform base storage time
        $converted = \App\Helpers\CountryTimezone::convertSlotBetweenOffsets(
            $startTime,
            (int) $request->day_number,
            $teacherOffset,
            $platformOffset
        );

        $storageDay = $converted['day'];
        $storageStartTime = $converted['start_time'];
        $storageEndTime = $converted['end_time'];

        // Check for overlapping slots (exclude current slot)
        $exists = AvailabilitySlot::where('teacher_id', $teacher->id)
            ->where('day_number', $storageDay)
            ->where('start_time', $storageStartTime)
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            return back()->with('error',
                app()->getLocale() == 'ar'
                    ? 'هذا الوقت محجوز بالفعل'
                    : 'This time slot already exists'
            );
        }

        $slot->update([
            'day_number' => $storageDay,
            'start_time' => $storageStartTime,
            'end_time' => $storageEndTime,
        ]);

        return back()->with('success',
            app()->getLocale() == 'ar'
                ? 'تم تحديث وقت الحصة بنجاح'
                : 'Availability slot updated successfully'
        );
    }

    /**
     * Delete availability slot
     */
    public function destroy($id)
    {
        $teacher = Auth::user();
        $slot = AvailabilitySlot::where('id', $id)
            ->where('teacher_id', $teacher->id)
            ->firstOrFail();

        // Check if slot is booked
        if ($slot->is_booked) {
            return back()->with('error',
                app()->getLocale() == 'ar'
                    ? 'لا يمكن حذف وقت محجوز'
                    : 'Cannot delete booked time slot'
            );
        }

        $slot->delete();

        return back()->with('success',
            app()->getLocale() == 'ar'
                ? 'تم حذف وقت الحصة بنجاح'
                : 'Availability slot deleted successfully'
        );
    }
}
