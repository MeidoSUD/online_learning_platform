<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('session_students')) {
            return;
        }

        Schema::create('session_students', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('session_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('booking_id')->nullable();
            $table->unsignedBigInteger('group_class_lesson_id')->nullable();
            $table->string('status', 255)->default('scheduled');
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique(['session_id', 'student_id'], 'session_students_session_id_student_id_unique');
            $table->index(['student_id', 'status'], 'session_students_student_id_status_index');
            $table->index('booking_id', 'session_students_booking_id_index');
            $table->index('group_class_lesson_id', 'session_students_group_class_lesson_id_index');
            $table->foreign('booking_id', 'session_students_booking_id_foreign')->references('id')->on('bookings')->onDelete('cascade');
            $table->foreign('group_class_lesson_id', 'session_students_group_class_lesson_id_foreign')->references('id')->on('group_class_lessons')->onDelete('cascade');
            $table->foreign('session_id', 'session_students_session_id_foreign')->references('id')->on('sessions')->onDelete('cascade');
            $table->foreign('student_id', 'session_students_student_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_students');
    }
};
