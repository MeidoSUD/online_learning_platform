<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Add columns to track teacher rate and platform percentage breakdown
            $table->decimal('teacher_rate_per_session', 10, 2)->nullable()->after('session_duration');
            $table->decimal('platform_percentage', 10, 2)->nullable()->default(0)->after('teacher_rate_per_session');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('teacher_rate_per_session');
            $table->dropColumn('platform_percentage');
        });
    }
};
