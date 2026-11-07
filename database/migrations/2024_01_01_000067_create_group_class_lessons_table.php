<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('group_class_lessons')) {
            return;
        }

        Schema::create('group_class_lessons', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('group_class_id');
            $table->unsignedBigInteger('group_class_time_slot_id')->nullable();
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedInteger('lesson_number')->default(1);
            $table->string('title', 255)->nullable();
            $table->text('topic')->nullable();
            $table->date('lesson_date')->nullable();
            $table->time('start_time');
            $table->time('end_time')->nullable();
            $table->integer('duration')->default(60);
            $table->string('status', 255)->default('scheduled');
            $table->unsignedBigInteger('session_id')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('group_class_time_slot_id', 'group_class_lessons_group_class_time_slot_id_foreign');
            $table->index(['group_class_id', 'lesson_number'], 'group_class_lessons_group_class_id_lesson_number_index');
            $table->index(['teacher_id', 'lesson_date'], 'group_class_lessons_teacher_id_lesson_date_index');
            $table->index('session_id', 'group_class_lessons_session_id_foreign');
            $table->foreign('group_class_id', 'group_class_lessons_group_class_id_foreign')->references('id')->on('group_classes')->onDelete('cascade');
            $table->foreign('group_class_time_slot_id', 'group_class_lessons_group_class_time_slot_id_foreign')->references('id')->on('group_class_time_slots')->onDelete('set null');
            $table->foreign('session_id', 'group_class_lessons_session_id_foreign')->references('id')->on('sessions')->onDelete('set null');
            $table->foreign('teacher_id', 'group_class_lessons_teacher_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_class_lessons');
    }
};
