<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('group_class_time_slots', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('teacher_id');
            $table->tinyInteger('day_number')->nullable();
            $table->date('date')->nullable();
            $table->time('start_time');
            $table->time('end_time')->nullable();
            $table->integer('duration')->default(60);
            $table->enum('repeat_type', ['none', 'weekly', 'daily'])->default('weekly');
            $table->boolean('is_available')->default(true);
            $table->boolean('is_booked')->default(false);
            $table->timestamps();

            $table->foreign('teacher_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['teacher_id', 'day_number', 'start_time']);
        });

        Schema::create('group_classes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedBigInteger('education_level_id');
            $table->unsignedBigInteger('class_id');
            $table->unsignedBigInteger('subject_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->unsignedInteger('total_sessions')->default(1);
            $table->string('status')->default('active');
            $table->timestamps();

            $table->foreign('teacher_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('education_level_id')->references('id')->on('education_levels')->onDelete('cascade');
            $table->foreign('class_id')->references('id')->on('classes')->onDelete('cascade');
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->index('teacher_id');
            $table->index(['education_level_id', 'class_id', 'subject_id']);
        });

        Schema::create('group_class_lessons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('group_class_id');
            $table->unsignedBigInteger('group_class_time_slot_id')->nullable();
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedInteger('lesson_number')->default(1);
            $table->string('title')->nullable();
            $table->text('topic')->nullable();
            $table->date('lesson_date')->nullable();
            $table->time('start_time');
            $table->time('end_time')->nullable();
            $table->integer('duration')->default(60);
            $table->string('status')->default('scheduled');
            $table->timestamps();

            $table->foreign('group_class_id')->references('id')->on('group_classes')->onDelete('cascade');
            $table->foreign('group_class_time_slot_id')->references('id')->on('group_class_time_slots')->nullOnDelete();
            $table->foreign('teacher_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['group_class_id', 'lesson_number']);
            $table->index(['teacher_id', 'lesson_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_class_lessons');
        Schema::dropIfExists('group_classes');
        Schema::dropIfExists('group_class_time_slots');
    }
};
