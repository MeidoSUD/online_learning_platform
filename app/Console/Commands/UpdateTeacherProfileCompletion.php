<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Helpers\TeacherProfileHelper;
use Illuminate\Support\Facades\Log;

class UpdateTeacherProfileCompletion extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'teachers:update-profile-completion
                            {teacher_id? : Optional teacher ID to update specific teacher}
                            {--all : Update all teachers}
                            {--verbose : Show detailed output}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Update profile_completed status for teachers based on their current data. 
                              Usage: php artisan teachers:update-profile-completion --all';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $teacherId = $this->argument('teacher_id');
        $updateAll = $this->option('all');
        $verbose = $this->option('verbose');

        if ($teacherId) {
            // Update specific teacher
            return $this->updateSingleTeacher($teacherId, $verbose);
        } elseif ($updateAll) {
            // Update all teachers
            return $this->updateAllTeachers($verbose);
        } else {
            // No option provided - show help
            $this->error('Please provide either a teacher_id or use --all flag');
            $this->line('Examples:');
            $this->line('  php artisan teachers:update-profile-completion 27');
            $this->line('  php artisan teachers:update-profile-completion --all');
            $this->line('  php artisan teachers:update-profile-completion --all --verbose');
            return 1;
        }
    }

    /**
     * Update a single teacher's profile completion status
     */
    private function updateSingleTeacher($teacherId, $verbose = false): int
    {
        $teacher = User::where('role_id', 3)->find($teacherId);

        if (!$teacher) {
            $this->error("Teacher with ID {$teacherId} not found");
            return 1;
        }

        try {
            $isComplete = TeacherProfileHelper::checkAndUpdateProfileCompleted($teacherId);
            $services = TeacherProfileHelper::getTeacherServiceKeys($teacherId);
            $reason = !$isComplete ? TeacherProfileHelper::getIncompleteReason($teacherId) : null;

            $this->info("Teacher: {$teacher->first_name} {$teacher->last_name} (ID: {$teacherId})");
            $this->line("Services: " . implode(', ', $services));
            $this->line("Profile Complete: " . ($isComplete ? 'YES ✅' : 'NO ❌'));

            if (!$isComplete && $reason) {
                $this->line("Reason: $reason");
            }

            if ($verbose) {
                $status = TeacherProfileHelper::getTeacherServicesStatus($teacherId);
                $this->line("\nDetailed Service Status:");
                foreach ($status as $service) {
                    $completeStatus = $service['is_complete'] ? '✅' : '❌';
                    $this->line("  {$completeStatus} {$service['service_name']}");
                    if ($service['incomplete_reason']) {
                        $this->line("     → {$service['incomplete_reason']}");
                    }
                }
            }

            return 0;
        } catch (\Exception $e) {
            $this->error("Error updating teacher {$teacherId}: " . $e->getMessage());
            return 1;
        }
    }

    /**
     * Update all teachers' profile completion status
     */
    private function updateAllTeachers($verbose = false): int
    {
        $teachers = User::where('role_id', 3)->get();

        if ($teachers->isEmpty()) {
            $this->info('No teachers found');
            return 0;
        }

        $this->info("Updating {$teachers->count()} teachers...");

        $completeCount = 0;
        $incompleteCount = 0;
        $errorCount = 0;

        $progressBar = $this->output->createProgressBar($teachers->count());

        foreach ($teachers as $teacher) {
            try {
                $isComplete = TeacherProfileHelper::checkAndUpdateProfileCompleted($teacher->id);
                
                if ($isComplete) {
                    $completeCount++;
                } else {
                    $incompleteCount++;
                }

                if ($verbose) {
                    $progressBar->clear();
                    $services = TeacherProfileHelper::getTeacherServiceKeys($teacher->id);
                    $status = $isComplete ? '✅' : '❌';
                    $this->line("{$status} {$teacher->first_name} {$teacher->last_name} - Services: " . implode(', ', $services));
                    $progressBar->display();
                }
            } catch (\Exception $e) {
                $errorCount++;
                if ($verbose) {
                    $progressBar->clear();
                    $this->error("❌ Error updating teacher {$teacher->id}: " . $e->getMessage());
                    $progressBar->display();
                }
                Log::error('Failed to update teacher profile completion', [
                    'teacher_id' => $teacher->id,
                    'error' => $e->getMessage()
                ]);
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine();

        // Summary
        $this->info("\n========== Update Complete ==========");
        $this->line("Total Teachers: {$teachers->count()}");
        $this->line("<fg=green>Complete Profiles: {$completeCount}</>");
        $this->line("<fg=red>Incomplete Profiles: {$incompleteCount}</>");
        if ($errorCount > 0) {
            $this->line("<fg=red>Errors: {$errorCount}</>");
        }
        $this->line("====================================\n");

        return $errorCount > 0 ? 1 : 0;
    }
}
