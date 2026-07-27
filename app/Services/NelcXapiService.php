<?php

namespace App\Services;

use App\Models\User;
use App\Models\Course;
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

    protected function baseData(User $student, Course $course): array
    {
        $teacher = $course->teacher;
        return [
            'name'              => $student->notional_id ?? $student->phone_number,
            'email'             => $student->email ?? 'student@example.com',
            'courseId'          => url('/') . '/course/' . $course->id,
            'courseName'        => $course->name,
            'courseDesc'        => strip_tags($course->description ?? ''),
            'instructor'        => $teacher->name ?? 'Instructor',
            'inst_email'        => $teacher->email ?? 'instructor@example.com',
            'learneMobileNo'    => $student->phone_number ?? '',
            'learnerFullName'   => $student->name,
            'learnerNationality'=> $student->nationality ?? '',
            'lmsUrl'            => url('/'),
            'duration'          => $course->duration_hours ? 'PT' . $course->duration_hours . 'H00M00S' : '',
        ];
    }

    protected function logToSystem(string $verb, int $studentId, ?int $courseId, array $data, array $response): void
    {
        try {
            $status = $response['status'] ?? 0;
            $isError = $status < 200 || $status >= 300;

            SystemLog::create([
                'level'   => $isError ? 'error' : 'info',
                'type'    => 'nelc_xapi',
                'title'   => "NELC xAPI: {$verb}",
                'message' => ($isError ? "FAILED (HTTP {$status})" : "SUCCESS (HTTP {$status})") . "\n" . ($response['message'] ?? ''),
                'context' => [
                    'verb'       => $verb,
                    'student_id' => $studentId,
                    'course_id'  => $courseId,
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

    protected function logErrorToSystem(string $verb, int $studentId, ?int $courseId, \Throwable $e): void
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
                    'course_id'  => $courseId,
                ],
                'occurrences' => 1,
                'last_occurred_at' => now(),
            ]);
        } catch (\Throwable $inner) {
            Log::warning('NELC xAPI: failed to write exception to system_logs', ['error' => $inner->getMessage()]);
        }
    }

    public function registered(User $student, Course $course): void
    {
        try {
            $data = $this->baseData($student, $course);
            $response = $this->xapi->Registered($data);
            $this->logToSystem('registered', $student->id, $course->id, $data, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem('registered', $student->id, $course->id, $e);
        }
    }

    public function initialized(User $student, Course $course): void
    {
        try {
            $data = $this->baseData($student, $course);
            $response = $this->xapi->Initialized($data);
            $this->logToSystem('initialized', $student->id, $course->id, $data, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem('initialized', $student->id, $course->id, $e);
        }
    }

    public function completedLesson(User $student, Course $course, string $lessonUrl, string $lessonName, ?int $durationMinutes = null): void
    {
        try {
            $base = $this->baseData($student, $course);
            $data = array_merge($base, [
                'lessonUrl'      => $lessonUrl,
                'lessonName'     => $lessonName,
                'lessonDesc'     => '',
                'lessonDuration' => $durationMinutes ? 'PT' . $durationMinutes . 'M0S' : 'PT15M0S',
            ]);
            $response = $this->xapi->CompletedLesson($data);
            $this->logToSystem('completedLesson', $student->id, $course->id, $data, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem('completedLesson', $student->id, $course->id, $e);
        }
    }

    public function watched(User $student, Course $course, string $videoUrl, string $videoName, bool $completion, string $duration): void
    {
        try {
            $base = $this->baseData($student, $course);
            $data = array_merge($base, [
                'lessonUrl'   => $videoUrl,
                'lessonName'  => $videoName,
                'lessonDesc'  => '',
                'completion'  => $completion,
                'duration'    => $duration,
            ]);
            $response = $this->xapi->Watched($data);
            $this->logToSystem('watched', $student->id, $course->id, $data, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem('watched', $student->id, $course->id, $e);
        }
    }

    public function attended(User $student, Course $course, string $sessionUrl, string $sessionName, string $duration): void
    {
        try {
            $base = $this->baseData($student, $course);
            $data = array_merge($base, [
                'lessonUrl'   => $sessionUrl,
                'lessonName'  => $sessionName,
                'lessonDesc'  => '',
                'completion'  => true,
                'duration'    => $duration,
            ]);
            $response = $this->xapi->Watched($data);
            $this->logToSystem('attended', $student->id, $course->id, $data, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem('attended', $student->id, $course->id, $e);
        }
    }

    public function progressed(User $student, Course $course, float $scaled, bool $completion = false): void
    {
        try {
            $data = array_merge($this->baseData($student, $course), [
                'scaled'     => $scaled,
                'completion' => $completion,
            ]);
            $response = $this->xapi->Progressed($data);
            $this->logToSystem('progressed', $student->id, $course->id, $data, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem('progressed', $student->id, $course->id, $e);
        }
    }

    public function completedCourse(User $student, Course $course): void
    {
        try {
            $data = $this->baseData($student, $course);
            $response = $this->xapi->CompletedCourse($data);
            $this->logToSystem('completedCourse', $student->id, $course->id, $data, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem('completedCourse', $student->id, $course->id, $e);
        }
    }

    public function attempted(User $student, Course $course, string $quizUrl, string $quizName, int $attemptNumber, float $scaled, float $raw, float $min, float $max, bool $completion, bool $success): void
    {
        try {
            $base = $this->baseData($student, $course);
            $data = array_merge($base, [
                'quizUrl'       => $quizUrl,
                'quizName'      => $quizName,
                'quizDesc'      => '',
                'attempNumber'  => $attemptNumber,
                'scaled'        => $scaled,
                'raw'           => $raw,
                'min'           => $min,
                'max'           => $max,
                'completion'    => $completion,
                'success'       => $success,
            ]);
            $response = $this->xapi->Attempted($data);
            $this->logToSystem('attempted', $student->id, $course->id, $data, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem('attempted', $student->id, $course->id, $e);
        }
    }

    public function earned(User $student, Course $course, string $certUrl, string $certName): void
    {
        try {
            $base = $this->baseData($student, $course);
            $data = array_merge($base, [
                'certUrl'  => $certUrl,
                'certName' => $certName,
            ]);
            $response = $this->xapi->Earned($data);
            $this->logToSystem('earned', $student->id, $course->id, $data, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem('earned', $student->id, $course->id, $e);
        }
    }

    public function rated(User $student, Course $course, float $scaled, float $raw, string $comment = ''): void
    {
        try {
            $base = $this->baseData($student, $course);
            $data = array_merge($base, [
                'scaled'   => $scaled,
                'raw'      => $raw,
                'comment'  => $comment,
            ]);
            $response = $this->xapi->Rated($data);
            $this->logToSystem('rated', $student->id, $course->id, $data, $response);
        } catch (\Throwable $e) {
            $this->logErrorToSystem('rated', $student->id, $course->id, $e);
        }
    }
}
