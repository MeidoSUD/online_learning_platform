<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\SessionNotificationService;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ProcessUpcomingSessions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sessions:process-upcoming';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process upcoming sessions: send reminders and create Zoom meetings';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to process upcoming sessions...');
        // Print debug times to help troubleshooting
        $now = Carbon::now();
        $twoHoursFromNow = $now->copy()->addMinutes(115);
        $twoHoursBuffer = $now->copy()->addMinutes(125);
        $oneHourFromNow = $now->copy()->addMinutes(55);
        $oneHourBuffer = $now->copy()->addMinutes(65);

        $this->info('Current time: ' . $now->toDateTimeString());
        $this->info('2-hour window from: ' . $twoHoursFromNow->toDateTimeString() . ' to: ' . $twoHoursBuffer->toDateTimeString());
        $this->info('1-hour window from: ' . $oneHourFromNow->toDateTimeString() . ' to: ' . $oneHourBuffer->toDateTimeString());
        Log::info('ProcessUpcomingSessions command started');

        try {
            $service = new SessionNotificationService();
            $results = $service->processUpcomingSessions();

            // Output results
            $this->info("2-hour reminders sent: {$results['two_hour_reminders']}");
            $this->info("Zoom meetings created: {$results['one_hour_zoom_created']}");
            
            if ($results['errors'] > 0) {
                $this->error("Errors encountered: {$results['errors']}");
                Log::warning('ProcessUpcomingSessions completed with errors', $results);
            } else {
                $this->info('All sessions processed successfully!');
                Log::info('ProcessUpcomingSessions completed successfully', $results);
            }

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Critical error: ' . $e->getMessage());
            Log::error('ProcessUpcomingSessions command failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return Command::FAILURE;
        }
    }
}