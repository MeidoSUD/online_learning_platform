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
        Schema::table('users', function (Blueprint $table) {
            // Add teacher_type column after role
            $table->enum('teacher_type', ['individual', 'institute'])->nullable()->after('role')->default('individual')->comment('Type of teacher: individual or institute');
        });
    }

    /**
     * Rollback the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('teacher_type');
        });
    }
};
