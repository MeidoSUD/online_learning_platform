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
        Schema::table('courses', function (Blueprint $table) {
            // Add education_level_id column if it doesn't exist
            if (!Schema::hasColumn('courses', 'education_level_id')) {
                $table->unsignedBigInteger('education_level_id')->nullable()->after('subject_id');
                
                // Add foreign key constraint
                $table->foreign('education_level_id')
                    ->references('id')
                    ->on('education_levels')
                    ->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            // Drop the foreign key and column
            if (Schema::hasColumn('courses', 'education_level_id')) {
                $table->dropForeign(['education_level_id']);
                $table->dropColumn('education_level_id');
            }
        });
    }
};
