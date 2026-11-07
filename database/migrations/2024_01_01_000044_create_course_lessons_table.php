<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('course_lessons')) {
            return;
        }

        Schema::create('course_lessons', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('course_id');
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->integer('order_index')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->index('course_id', 'course_lessons_course_id_foreign');
            $table->foreign('course_id', 'course_lessons_course_id_foreign')->references('id')->on('courses');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_lessons');
    }
};
