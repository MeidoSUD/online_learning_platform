<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sessions')) {
            return;
        }

        Schema::create('sessions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('availability_slot_id')->nullable();
            $table->unsignedBigInteger('booking_id')->nullable();
            $table->unsignedBigInteger('student_id')->nullable();
            $table->unsignedBigInteger('teacher_id');
            $table->integer('session_number');
            $table->date('session_date');
            $table->string('session_title', 255)->nullable();
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('duration')->nullable();
            $table->enum('status', ['scheduled', 'in_progress', 'live', 'ended', 'completed', 'cancelled', 'no_show', 'wait_for_teacher']);
            $table->timestamp('two_hour_reminder_sent_at')->nullable();
            $table->timestamp('one_hour_reminder_sent_at')->nullable();
            $table->timestamp('zoom_creation_attempted_at')->nullable();
            $table->boolean('zoom_generation_failed')->default(0);
            $table->longText('join_url')->nullable();
            $table->longText('host_url')->nullable();
            $table->string('meeting_id', 255)->nullable();
            $table->string('chat_room_id', 255)->nullable();
            $table->dateTime('started_at')->nullable();
            $table->dateTime('ended_at')->nullable();
            $table->text('teacher_notes')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('student_id', 'sessions_student_id_foreign');
            $table->index('teacher_id', 'sessions_teacher_id_foreign');
            $table->index(['booking_id', 'session_number'], 'sessions_booking_id_session_number_index');
            $table->index(['session_date', 'status'], 'sessions_session_date_status_index');
            $table->index('availability_slot_id', 'sessions_availability_slot_id_foreign');
            $table->foreign('availability_slot_id', 'sessions_availability_slot_id_foreign')->references('id')->on('availability_slots')->onDelete('cascade');
            $table->foreign('booking_id', 'sessions_booking_id_foreign')->references('id')->on('bookings')->onDelete('cascade');
            $table->foreign('student_id', 'sessions_student_id_foreign')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('teacher_id', 'sessions_teacher_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};
