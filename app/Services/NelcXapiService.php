<?php

namespace App\Services;

use App\Models\User;
use App\Models\Booking;
use App\Models\SystemLog;
use Bzzix\LaravelLrsPackage\XapiIntegration;
use Illuminate\Support\Facades\Log;

class NelcXapiService
{
    protected XapiIntegration $xapi;

    public function __construct()
    {
        $this->xapi = new XapiIntegration();
    }

    /**
     * Build xAPI actor from student — National ID is the NELC identity.
     */
    protected function actorData(User $student): array
    {
        return [
            'name'           => $student->notional_id ?? $student->phone_number,
            'email'          => $student->email ?? 'student@example.com',
            'learnerFullName'=> $student->first_name . ' ' . $student->last_name,
            'learneMobileNo' => $student->phone_number ?? '',
            'learnerNationality' => $student->nationality ?? '',
        ];
    }

    /**
     * Build the xAPI "object" — represents the private lesson learning experience.
     * For NELC, the object is the teacher + subject, not a course.
     */
    protected function lessonObjectData(Booking $booking): array
    {
        $teacher = $booking->teacher;
        $subject = $booking->subject;
        $service = $booking->service;

        $teacherName = $teacher ? ($teacher->first_name . ' ' . $teacher->last_name) : 'Instructor';
        $subjectName = $subject ? ($subject->name_en ?? $subject->name_ar ?? '') : '';
        $serviceName = $service ? ($service->name_en ?? $service->name_ar ?? '') : '';

        $objectName = $teacherName;
        if ($subjectName) $objectName .= ' - ' . $subjectName;
        elseif ($serviceName) $objectName .= ' - ' . $serviceName;

        return [
            'courseId'   => url('/') . '/booking/' . $booking->booking_reference,
            'courseName' => $objectName,
            'courseDesc' => "Private lesson with {$teacherName}" . ($subjectName ? " — {$subjectName}" : ''),
            'instructor' => $teacherName,
            'inst_email' => $teacher->email ?? 'instructor@example.com',
            'lmsUrl'     => url('/'),
        ];
    }

    protected function baseData(User $student, Booking $booking): array
    {
        return array_merge($this->actorData($student), $this->lessonObjectData($booking));
    }

    /**
     * Write a successful xAPI response to the system_logs table.
     */
    protected function logToSystem(string $verb, int $studentId, ?int $bookingId, array $data, array $response): void
    {
        try {
            $status = $response['status'] ?? 0;
            $isError = $status < 200 || $status >= 300;

            SystemLog::create([
                'level'   => $isError ? 'error' : 'info',
                'type'    => 'nelc_xapi',
                'title'   => "NELC xAPI: {$verb}",
                'message' => ($isError ? "FAILED (HTTPS {$status})" : "SUCCESS (HTTPS {$status})") . "\n" . ($response['message'] ?? ''),
                'context' => [
                    'verb'       => $verb,
                    'student_id' => $studentId,
                    'booking_id' => $bookingId,
                    'http_status'=> $status,
                    'response_message' => $response['message'] ?? '',
                    'response_body' => is_string($response['body'] ?? '') ? substr($response['body'] ?? '', 0, 2000) : '',
                    'xapi_payload' => $data,
                ],
                'occurrences' => 1,
                'last_occurred_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('NELC xAPI: failed to write to system_logs', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Write an exception to the system_logs table.
     */
    protected function logErrorToSystem(string $verb, int $studentId, ?int $bookingId, \Throwable $e): void
    {
        try {
            SystemLog::create([
                'level'   => 'error',
                'type'    => 'nelc_xapi',
                'title'   => "NELC xAPI: {$verb} — EXCEPTION",
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
                'trace'   => $e->getTraceAsString(),
                'context' => [
                    'verb'       => $verb,
                    'student_id' => $studentId,
                    'booking_id' => $bookingId,
                ],
                'occurrences' => 1,
                'last_occurred_at' => now(),
            ]);
        } catch (\Throwable $inner) {
            Log::warning('NELC xAPI: failed to write exception to system_logs', ['error' => $inner->getMessage()]);
        }
    }

    // ─── Private Lesson xAPI Verbs ───────────────────────────────────

    /**
     * Student registers for a private lesson package.
     * Fires when the booking is confirmed after payment.
     */
    public function registered(User $student, Booking $booking): void
    {
        try {
            $data = $this->baseData($student, $booking);
            $response = $this->xapi->Registered($data);
            $this->logToSystem('registered', $student->id, $booking->id, $data, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem('registered', $student->id, $booking->id, $e);
        }
    }

    /**
     * Learning session initialized (teacher confirms / first session starts).
     */
    public function initialized(User $student, Booking $booking): void
    {
        try {
            $data = $this->baseData($student, $booking);
            $response = $this->xapi->Initialized($data);
            $this->logToSystem('initialized', $student->id, $booking->id, $data, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem('initialized', $student->id, $booking->id, $e);
        }
    }

    /**
     * Student attended / watched a private lesson session.
     * Fires each time the teacher ends a session.
     */
    public function attended(User $student, Booking $booking, string $sessionUrl, string $sessionName, string $duration): void
    {
        try {
            $base = $this->baseData($student, $booking);
            $data = array_merge($base, [
                'lessonUrl'   => $sessionUrl,
                'lessonName'  => $sessionName,
                'lessonDesc'  => '',
                'completion'  => true,
                'duration'    => $duration,
            ]);
            $response = $this->xapi->Watched($data);
            $this->logToSystem('attended', $student->id, $booking->id, $data, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem('attended', $student->id, $booking->id, $e);
        }
    }

    /**
     * Progress through the private lesson package.
     * Fires on each session completion with updated progress.
     */
    public function progressed(User $student, Booking $booking, float $scaled, bool $completion = false): void
    {
        try {
            $data = array_merge($this->baseData($student, $booking), [
                'scaled'     => $scaled,
                'completion' => $completion,
            ]);
            $response = $this->xapi->Progressed($data);
            $this->logToSystem('progressed', $student->id, $booking->id, $data, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem('progressed', $student->id, $booking->id, $e);
        }
    }

    /**
     * All sessions in the private lesson package are completed.
     */
    public function completedCourse(User $student, Booking $booking): void
    {
        try {
            $data = $this->baseData($student, $booking);
            $response = $this->xapi->CompletedCourse($data);
            $this->logToSystem('completedCourse', $student->id, $booking->id, $data, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem('completedCourse', $student->id, $booking->id, $e);
        }
    }

    /**
     * Student rates the teacher after a private lesson.
     */
    public function rated(User $student, Booking $booking, float $scaled, float $raw, string $comment = ''): void
    {
        try {
            $base = $this->baseData($student, $booking);
            $data = array_merge($base, [
                'scaled'  => $scaled,
                'raw'     => $raw,
                'comment' => $comment,
            ]);
            $response = $this->xapi->Rated($data);
            $this->logToSystem('rated', $student->id, $booking->id, $data, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem('rated', $student->id, $booking->id, $e);
        }
    }

    /**
     * Admin issues a certificate — the final "earned" statement.
     */
    public function earned(User $student, Booking $booking, string $certUrl, string $certNumber): void
    {
        try {
            $base = $this->baseData($student, $booking);
            $data = array_merge($base, [
                'certUrl'  => $certUrl,
                'certName' => $certNumber,
            ]);
            $response = $this->xapi->Earned($data);
            $this->logToSystem('earned', $student->id, $booking->id, $data, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem('earned', $student->id, $booking->id, $e);
        }
    }
}
