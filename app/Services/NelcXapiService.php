<?php

namespace App\Services;

use App\Models\User;
use App\Models\Course;
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

    public function registered(User $student, Course $course): void
    {
        try {
            $data = $this->baseData($student, $course);
            $response = $this->xapi->Registered($data);
            Log::info('NELC xAPI: registered', ['student' => $student->id, 'course' => $course->id, 'status' => $response['status']]);
        } catch (\Throwable $e) {
            Log::warning('NELC xAPI: registered failed', ['error' => $e->getMessage()]);
        }
    }

    public function initialized(User $student, Course $course): void
    {
        try {
            $data = $this->baseData($student, $course);
            $response = $this->xapi->Initialized($data);
            Log::info('NELC xAPI: initialized', ['student' => $student->id, 'course' => $course->id, 'status' => $response['status']]);
        } catch (\Throwable $e) {
            Log::warning('NELC xAPI: initialized failed', ['error' => $e->getMessage()]);
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
            Log::info('NELC xAPI: completed lesson', ['student' => $student->id, 'lesson' => $lessonName, 'status' => $response['status']]);
        } catch (\Throwable $e) {
            Log::warning('NELC xAPI: completed lesson failed', ['error' => $e->getMessage()]);
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
            Log::info('NELC xAPI: watched', ['student' => $student->id, 'video' => $videoName, 'status' => $response['status']]);
        } catch (\Throwable $e) {
            Log::warning('NELC xAPI: watched failed', ['error' => $e->getMessage()]);
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
            Log::info('NELC xAPI: attended (via watched)', ['student' => $student->id, 'session' => $sessionName, 'status' => $response['status']]);
        } catch (\Throwable $e) {
            Log::warning('NELC xAPI: attended failed', ['error' => $e->getMessage()]);
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
            Log::info('NELC xAPI: progressed', ['student' => $student->id, 'course' => $course->id, 'scaled' => $scaled, 'status' => $response['status']]);
        } catch (\Throwable $e) {
            Log::warning('NELC xAPI: progressed failed', ['error' => $e->getMessage()]);
        }
    }

    public function completedCourse(User $student, Course $course): void
    {
        try {
            $data = $this->baseData($student, $course);
            $response = $this->xapi->CompletedCourse($data);
            Log::info('NELC xAPI: completed course', ['student' => $student->id, 'course' => $course->id, 'status' => $response['status']]);
        } catch (\Throwable $e) {
            Log::warning('NELC xAPI: completed course failed', ['error' => $e->getMessage()]);
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
            Log::info('NELC xAPI: attempted quiz', ['student' => $student->id, 'quiz' => $quizName, 'status' => $response['status']]);
        } catch (\Throwable $e) {
            Log::warning('NELC xAPI: attempted quiz failed', ['error' => $e->getMessage()]);
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
            Log::info('NELC xAPI: earned certificate', ['student' => $student->id, 'cert' => $certName, 'status' => $response['status']]);
        } catch (\Throwable $e) {
            Log::warning('NELC xAPI: earned certificate failed', ['error' => $e->getMessage()]);
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
            Log::info('NELC xAPI: rated course', ['student' => $student->id, 'course' => $course->id, 'rating' => $raw, 'status' => $response['status']]);
        } catch (\Throwable $e) {
            Log::warning('NELC xAPI: rated course failed', ['error' => $e->getMessage()]);
        }
    }
}
