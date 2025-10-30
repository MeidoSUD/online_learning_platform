<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AvailabilitySlot;

class AvailabilityController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        // Get all slots for authenticated teacher
        $teacherId = $request->user()->id;
        $slots = AvailabilitySlot::forTeacher($teacherId)->orderBy('date')->orderBy('start_time')->get();

        return response()->json([
            'success' => true,
            'data' => $slots
        ]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $request->validate([
            'available_times' => 'required|array',
            'available_times.*.day_number' => 'required|integer|between:1,7',
            'available_times.*.times' => 'required|array',
            'available_times.*.times.*' => 'required|date_format:H:i',
            'course_id' => 'nullable|exists:courses,id',
            'order_id' => 'nullable|exists:orders,id',
            'repeat_type' => 'nullable|in:none,weekly,daily',
        ]);

        $teacherId = $request->user()->id;
        $createdSlots = [];

        foreach ($request->available_times as $dayEntry) {
            $day = $dayEntry['day_number'];
            foreach ($dayEntry['times'] as $time) {
                // Calculate end_time (+1 hour)
                $endTime = \Carbon\Carbon::createFromFormat('H:i', trim($time))->addHour()->format('H:i');
                $slot = AvailabilitySlot::create([
                    'teacher_id' => $teacherId,
                    'course_id' => $request->course_id,
                    'order_id' => $request->order_id,
                    'day_number' => $dayEntry['day_number'],
                    'start_time' => trim($time),
                    'end_time' => $endTime,
                    'is_available' => true,
                    'is_booked' => false,
                    'repeat_type' => $request->repeat_type ?? AvailabilitySlot::REPEAT_NONE,
                ]);
                $createdSlots[] = $slot;
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'success'
        ]);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, $id)
    {
        $teacherId = $request->user()->id;
        $slot = AvailabilitySlot::where('id', $id)->where('teacher_id', $teacherId)->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $slot
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    public function update(Request $request, $id)
    {
        $teacherId = $request->user()->id;
        $slot = AvailabilitySlot::where('id', $id)->where('teacher_id', $teacherId)->firstOrFail();

        $request->validate([
            'day_number' => 'sometimes|integer|between:1,7',
            'start_time' => 'sometimes|date_format:H:i',
            'is_available' => 'sometimes|boolean',
            'repeat_type' => 'nullable|in:none,weekly,daily',
            'course_id' => 'nullable|exists:courses,id',
            'order_id' => 'nullable|exists:orders,id',
        ]);

        $data = $request->only(['day_number', 'start_time', 'is_available', 'repeat_type', 'course_id', 'order_id']);

        // If start_time is present, set end_time to start_time + 1 hour
        if (isset($data['start_time'])) {
            $data['end_time'] = \Carbon\Carbon::createFromFormat('H:i', trim($data['start_time']))->addHour()->format('H:i');
        }

        $slot->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Slot updated successfully',
            'data' => $slot
        ]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $id)
    {
        $teacherId = $request->user()->id;
        $slot = AvailabilitySlot::where('id', $id)->where('teacher_id', $teacherId)->firstOrFail();

        // Prevent deletion of booked slots (handled in model boot)
        $slot->delete();

        return response()->json([
            'success' => true,
            'message' => 'Slot deleted successfully'
        ]);
    }
}
