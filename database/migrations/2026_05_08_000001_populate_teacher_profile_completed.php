<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Update profile_completed status for all existing teachers based on their current data.
     * This ensures teachers with complete data will appear in student listings.
     */
    public function up(): void
    {
        // Get the helper class
        $helper = '\App\Helpers\TeacherProfileHelper';

        // Get all teachers (role_id = 3)
        $teachers = DB::table('users')
            ->where('role_id', 3)
            ->where('is_active', 1)
            ->pluck('id');

        foreach ($teachers as $teacherId) {
            try {
                // Use the helper to check and update profile completion
                if (class_exists($helper)) {
                    $helper::checkAndUpdateProfileCompleted($teacherId);
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning("Failed to update teacher profile completion", [
                    'teacher_id' => $teacherId,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reset all teachers' profile_completed to 0
        DB::table('users')
            ->where('role_id', 3)
            ->update(['profile_completed' => 0]);
    }
};
