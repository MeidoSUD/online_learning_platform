<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('group_class_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('group_class_id');
            $table->unsignedBigInteger('group_class_lesson_id');
            $table->unsignedBigInteger('teacher_id');
            $table->string('session_title');
            $table->date('session_date')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->integer('duration')->default(60);
            $table->string('status')->default('scheduled');
            $table->text('join_url')->nullable();
            $table->text('host_url')->nullable();
            $table->string('meeting_id')->nullable();
            $table->string('chat_room_id')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->text('teacher_notes')->nullable();
            $table->json('materials_shared')->nullable();
            $table->timestamps();

            $table->foreign('group_class_id')->references('id')->on('group_classes')->onDelete('cascade');
            $table->foreign('group_class_lesson_id')->references('id')->on('group_class_lessons')->onDelete('cascade');
            $table->foreign('teacher_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['teacher_id', 'session_date']);
            $table->index(['group_class_id', 'group_class_lesson_id']);
            $table->index('status');
        });

        Schema::create('group_class_session_students', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('group_class_session_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('booking_id');
            $table->string('status')->default('scheduled');
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->timestamps();

            $table->foreign('group_class_session_id')->references('id')->on('group_class_sessions')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('cascade');
            $table->unique(['group_class_session_id', 'student_id']);
            $table->index(['student_id', 'status']);
            $table->index('booking_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_class_session_students');
        Schema::dropIfExists('group_class_sessions');
    }
};
