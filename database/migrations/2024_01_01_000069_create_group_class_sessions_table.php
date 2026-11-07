<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('group_class_sessions')) {
            return;
        }

        Schema::create('group_class_sessions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('group_class_id');
            $table->unsignedBigInteger('group_class_lesson_id');
            $table->unsignedBigInteger('teacher_id');
            $table->string('session_title', 255);
            $table->date('session_date')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->integer('duration')->default(60);
            $table->enum('status', ['scheduled', 'in_progress', 'live', 'ended', 'completed', 'cancelled', 'no_show', 'wait_for_teacher'])->default('scheduled');
            $table->text('join_url')->nullable();
            $table->text('host_url')->nullable();
            $table->string('meeting_id', 255)->nullable();
            $table->string('chat_room_id', 255)->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->text('teacher_notes')->nullable();
            $table->json('materials_shared')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('group_class_lesson_id', 'group_class_sessions_group_class_lesson_id_foreign');
            $table->index(['teacher_id', 'session_date'], 'group_class_sessions_teacher_id_session_date_index');
            $table->index(['group_class_id', 'group_class_lesson_id'], 'group_class_sessions_group_class_id_group_class_lesson_id_index');
            $table->index('status', 'group_class_sessions_status_index');
            $table->foreign('group_class_id', 'group_class_sessions_group_class_id_foreign')->references('id')->on('group_classes')->onDelete('cascade');
            $table->foreign('group_class_lesson_id', 'group_class_sessions_group_class_lesson_id_foreign')->references('id')->on('group_class_lessons')->onDelete('cascade');
            $table->foreign('teacher_id', 'group_class_sessions_teacher_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_class_sessions');
    }
};
