<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        // $schedule->command('inspire')->hourly();
        // dispatch reminders for sessions starting in 1 hour
        $schedule->call(function () {
            $target = now()->addHour()->format('Y-m-d H:00:00'); // tune window
            $sessions = \App\Models\Sessions::where('status','scheduled')
                ->whereRaw("TIMESTAMP(session_date, start_time) BETWEEN ? AND ?", [now()->addHour()->subMinutes(5)->format('Y-m-d H:i:s'), now()->addHour()->addMinutes(5)->format('Y-m-d H:i:s')])
                ->pluck('id');
            foreach ($sessions as $id) {
                \App\Jobs\SendSessionReminderJob::dispatch($id);
            }
        })->everyFiveMinutes();


        $schedule->job(new \App\Jobs\MakeZoomMeeting())->everyMinute();
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
    protected $commands = [\App\Console\Commands\MakeViewCommand::class,];
}
