<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->string('course_format')->default('individual')->after('course_type');
            $table->integer('max_students')->nullable()->after('duration_hours');
            $table->integer('min_students')->nullable()->after('max_students');
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['course_format', 'max_students', 'min_students']);
        });
    }
};
