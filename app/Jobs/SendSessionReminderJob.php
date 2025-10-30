<?php
namespace App\Jobs;

use App\Models\Sessions;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendSessionReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected int $sessionId;
    public function __construct(int $sessionId) { $this->sessionId = $sessionId; }

    public function handle()
    {
        $session = Sessions::with(['student','teacher','booking'])->find($this->sessionId);
        if (! $session) return;

        $title = 'Upcoming session';
        $message = "Your session (#{$session->session_number}) starts at {$session->start_time} on {$session->session_date}";

        $ns = new NotificationService();
        // notify student and teacher
        $ns->send($session->student, 'session_reminder', $title, $message, ['session_id' => $session->id]);
        $ns->send($session->teacher, 'session_reminder', $title, $message, ['session_id' => $session->id]);
    }
}