<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ensure support role exists
        if (Schema::hasTable('roles')) {
            $existingSupport = DB::table('roles')->where('name_key', 'support')->first();
            if (!$existingSupport) {
                // If ID 5 is free, use 5; otherwise auto-increment
                $hasId5 = DB::table('roles')->where('id', 5)->exists();
                if (!$hasId5) {
                    DB::table('roles')->insert([
                        'id' => 5,
                        'name_key' => 'support',
                        'name_en' => 'Customer Support',
                        'name_ar' => 'خدمة العملاء',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    DB::table('roles')->insert([
                        'name_key' => 'support',
                        'name_en' => 'Customer Support',
                        'name_ar' => 'خدمة العملاء',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        // 2. Expand channel column on marketing_notifications to allow 'email', 'all', etc.
        if (Schema::hasTable('marketing_notifications')) {
            try {
                DB::statement("ALTER TABLE `marketing_notifications` MODIFY COLUMN `channel` VARCHAR(50) NOT NULL DEFAULT 'push'");
            } catch (\Throwable $e) {
                // Fallback for sqlite or drivers where modify is different
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('marketing_notifications')) {
            try {
                DB::statement("ALTER TABLE `marketing_notifications` MODIFY COLUMN `channel` ENUM('push', 'sms', 'both') NOT NULL DEFAULT 'push'");
            } catch (\Throwable $e) {
            }
        }
    }
};
