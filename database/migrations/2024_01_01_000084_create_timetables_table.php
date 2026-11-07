<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('timetables')) {
            return;
        }

        Schema::create('timetables', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('course_id')->nullable();
            $table->unsignedBigInteger('lesson_id')->nullable();
            $table->integer('day_of_week')->nullable();
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamp('created_at')->nullable();
            $table->index('course_id', 'timetables_course_id_foreign');
            $table->index('lesson_id', 'timetables_lesson_id_foreign');
            $table->foreign('course_id', 'timetables_course_id_foreign')->references('id')->on('courses');
            $table->foreign('lesson_id', 'timetables_lesson_id_foreign')->references('id')->on('course_lessons');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timetables');
    }
};
