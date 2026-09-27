<?php

namespace Tests\Feature;

use App\Models\AvailabilitySlot;
use App\Models\Booking;
use App\Models\Services;
use App\Models\Subject;
use App\Models\User;
use App\Services\Booking\BookingService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\Request;
use Tests\TestCase;

class BookingResponseTest extends TestCase
{
    use DatabaseTransactions;

    public function test_create_booking_service_returns_valid_string_types_and_message(): void
    {
        $student = User::firstOrCreate(
            ['email' => 'student_test_booking@example.com'],
            [
                'first_name' => 'Student',
                'last_name' => 'Test',
                'password' => bcrypt('password'),
                'role_id' => 4,
            ]
        );

        $teacher = User::firstOrCreate(
            ['email' => 'teacher_test_booking@example.com'],
            [
                'first_name' => 'Teacher',
                'last_name' => 'Test',
                'password' => bcrypt('password'),
                'role_id' => 3,
                'phone_number' => '1234567890',
            ]
        );

        $service = Services::firstOrCreate(
            ['key_name' => 'general-tutoring'],
            [
                'name_en' => 'General Tutoring',
                'name_ar' => 'دروس عامة',
                'description_en' => 'General Tutoring Service',
                'description_ar' => 'خدمة دروس عامة',
            ]
        );

        $slot = AvailabilitySlot::create([
            'teacher_id' => $teacher->id,
            'day_number' => 3,
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'duration' => 60,
            'is_available' => true,
            'is_booked' => false,
        ]);

        $bookingService = app(BookingService::class);
        $request = new Request([
            'service_id' => $service->id,
            'teacher_id' => $teacher->id,
            'timeslot_id' => $slot->id,
            'type' => 'single',
            'sessions_count' => 1,
        ]);

        $result = $bookingService->createBooking($request, $student->id);

        $this->assertTrue($result['success']);
        $this->assertIsString($result['message']);
        $this->assertEquals('Booking created successfully', $result['message']);
        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('booking', $result['data']);

        $booking = $result['data']['booking'];
        $this->assertIsString($booking['reference']);
        $this->assertIsString($booking['booking_reference']);
        $this->assertIsString($booking['first_session_date']);
        $this->assertIsString($booking['first_session_start_time']);
        $this->assertIsString($booking['first_session_end_time']);
        $this->assertIsString($booking['status']);
        $this->assertIsString($booking['session_type']);

        $this->assertArrayHasKey('teacher', $booking);
        $teacherData = $booking['teacher'];
        $this->assertIsString($teacherData['name']);
        $this->assertIsString($teacherData['first_name']);
        $this->assertIsString($teacherData['last_name']);
        $this->assertIsString($teacherData['email']);
        $this->assertIsString($teacherData['phone_number']);
        $this->assertIsString($teacherData['image']);
        $this->assertIsString($teacherData['profile_photo']);

        $this->assertArrayHasKey('meta', $result['data']);
        $this->assertArrayHasKey('timeslot', $result['data']['meta']);
        $timeslot = $result['data']['meta']['timeslot'];
        $this->assertIsString($timeslot['day_name']);
        $this->assertIsString($timeslot['start_time']);
        $this->assertIsString($timeslot['end_time']);
    }
}
