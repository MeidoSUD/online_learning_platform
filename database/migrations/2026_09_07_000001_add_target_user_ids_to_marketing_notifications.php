<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('marketing_notifications', 'target_user_ids')) {
            DB::statement('ALTER TABLE `marketing_notifications` ADD COLUMN `target_user_ids` JSON NULL AFTER `target_user_id`');
        }

        DB::statement(
            "ALTER TABLE `marketing_notifications`
             MODIFY `target_type` ENUM('all','teachers','students','single_user','multi_teachers','multi_students') NOT NULL"
        );
    }

    public function down(): void
    {
        DB::statement(
            "ALTER TABLE `marketing_notifications`
             MODIFY `target_type` ENUM('all','teachers','students','single_user') NOT NULL"
        );

        if (Schema::hasColumn('marketing_notifications', 'target_user_ids')) {
            DB::statement('ALTER TABLE `marketing_notifications` DROP COLUMN `target_user_ids`');
        }
    }
};