<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Check if column already exists before attempting to add
        if (!Schema::hasColumn('bookings', 'course_group_id')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->unsignedBigInteger('course_group_id')->nullable()->after('course_id');
                $table->foreign('course_group_id')->references('id')->on('course_groups')->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('bookings', 'course_group_id')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->dropForeign(['course_group_id']);
                $table->dropColumn('course_group_id');
            });
        }
    }
};
