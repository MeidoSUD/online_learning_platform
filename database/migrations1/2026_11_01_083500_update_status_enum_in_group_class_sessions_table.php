<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE `group_class_sessions` MODIFY COLUMN `status` ENUM('scheduled', 'in_progress', 'live', 'ended', 'completed', 'cancelled', 'no_show', 'wait_for_teacher') NOT NULL DEFAULT 'scheduled'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE `group_class_sessions` MODIFY COLUMN `status` VARCHAR(255) NOT NULL DEFAULT 'scheduled'");
    }
};

