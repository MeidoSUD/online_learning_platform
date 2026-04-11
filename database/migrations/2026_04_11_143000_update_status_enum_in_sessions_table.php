<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE `sessions` MODIFY COLUMN `status` ENUM('scheduled', 'in_progress', 'live', 'ended', 'completed', 'cancelled', 'no_show', 'wait_for_teacher') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE `sessions` MODIFY COLUMN `status` ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show') NOT NULL");
    }
};
