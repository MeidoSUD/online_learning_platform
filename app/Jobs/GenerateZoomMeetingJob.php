<?php

namespace App\Jobs;

use App\Models\Booking;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\ZoomService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\Sessions;

class GenerateZoomMeetingJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected int $sessionId;

    /**
     * Create a new job instance.
     *
     * @param int $sessionId
     */
    public function __construct(int $sessionId)
    {
        $this->sessionId = $sessionId;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        try {
            $session = Sessions::with(['booking.teacher','student','teacher'])->findOrFail($this->sessionId);
            Log::info("GenerateZoomMeetingJob: Processing session #{$session->id}");

            // Check if meeting already exists
            if ($session->meeting_id && $session->join_url) {
                Log::info("GenerateZoomMeetingJob: Meeting already exists for session #{$session->id}");
                return;
            }

            // Build meeting payload using session date/time
            $sessionDate = $session->session_date instanceof \Carbon\Carbon
                ? $session->session_date->format('Y-m-d')
                : substr((string)$session->session_date, 0, 10);

            $startTime = $session->start_time instanceof \Carbon\Carbon
                ? $session->start_time->format('H:i:s')
                : (preg_match('/\d{2}:\d{2}/', (string)$session->start_time) ? \Carbon\Carbon::parse($session->start_time)->format('H:i:s') : (string)$session->start_time);

            $startDateTime = \Carbon\Carbon::parse($sessionDate . ' ' . $startTime);

            // Prepare meeting data
            $meetingData = [
                'topic' => $session->booking->course->subject->name_en ?? "Lesson #{$session->session_number}",
                'type' => 2, // Scheduled meeting
                'start_time' => $startDateTime->toIso8601String(),
                'duration' => $session->duration ?: 60,
                'timezone' => config('app.timezone', 'Asia/Riyadh'),
                'agenda' => "Lesson between {$session->teacher->first_name} and {$session->student->first_name}",
                'settings' => [
                    'host_video' => true,
                    'participant_video' => true,
                    'join_before_host' => false,
                    'mute_upon_entry' => true,
                    'waiting_room' => false,
                    'audio' => 'both',
                    'auto_recording' => 'none',
                ],
            ];

            // Create meeting via Zoom API
            $zoomService = new ZoomService();
            $hostIdentifier = $session->teacher->zoom_user_id ?? $session->teacher->email; // prefer zoom_user_id if stored
            $meeting = $zoomService->createMeeting($hostIdentifier, $meetingData);

            if (! $meeting || empty($meeting['id'])) {
                Log::error("GenerateZoomMeetingJob: ZoomService returned invalid meeting for session {$session->id}", ['meeting' => $meeting]);
                return;
            }

            // Save meeting info on session
            $session->update([
                'meeting_id' => $meeting['id'],
                'join_url' => $meeting['join_url'] ?? ($meeting['joinUrl'] ?? null),
                'host_url' => $meeting['start_url'] ?? ($meeting['startUrl'] ?? null),
            ]);

            Log::info("GenerateZoomMeetingJob: Meeting saved for session {$session->id}", ['meeting_id' => $meeting['id']]);

            // Send notifications to student and teacher
            $ns = new NotificationService();
            $titleStudent = app()->getLocale() == 'ar' ? 'رابط الحصة جاهز' : 'Lesson Link Ready';
            $msgStudent = app()->getLocale() == 'ar'
                ? "رابط الزوم جاهز للحصة (#{$session->booking->booking_reference}). يمكنك الانضمام عبر: {$session->join_url}"
                : "Your Zoom link is ready for booking ({$session->booking->booking_reference}). Join here: {$session->join_url}";
            $ns->send($session->student, 'zoom_link_ready', $titleStudent, $msgStudent, [
                'session_id' => $session->id,
                'join_url' => $session->join_url,
                'session_date' => $session->session_date,
                'session_time' => $session->start_time,
            ]);

            $titleTeacher = app()->getLocale() == 'ar' ? 'رابط الحصة جاهز' : 'Lesson Link Ready';
            $msgTeacher = app()->getLocale() == 'ar'
                ? "رابط الزوم جاهز للحصة (#{$session->booking->booking_reference}). ابدأ الحصة عبر: {$session->host_url}"
                : "Your Zoom link is ready for booking ({$session->booking->booking_reference}). Start lesson here: {$session->host_url}";
            $ns->send($session->teacher, 'zoom_link_ready', $titleTeacher, $msgTeacher, [
                'session_id' => $session->id,
                'start_url' => $session->host_url,
                'session_date' => $session->session_date,
                'session_time' => $session->start_time,
            ]);

            Log::info("GenerateZoomMeetingJob: Notifications sent for session {$session->id}");
        } catch (\Exception $e) {
            Log::error("GenerateZoomMeetingJob: Error processing session {$this->sessionId}: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     *
     * @param \Throwable $exception
     * @return void
     */
    public function failed(\Throwable $exception)
    {
        Log::error("GenerateZoomMeetingJob FAILED for session {$this->sessionId}: " . $exception->getMessage());
        try {
            $session = Sessions::find($this->sessionId);
            if ($session) $session->update(['zoom_generation_failed' => true]);
        } catch (\Exception $e) {
            Log::error("Failed to mark session as failed: " . $e->getMessage());
        }
    }
}