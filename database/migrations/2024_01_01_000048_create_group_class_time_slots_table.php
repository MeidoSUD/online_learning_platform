<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('group_class_time_slots')) {
            return;
        }

        Schema::create('group_class_time_slots', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('teacher_id');
            $table->tinyInteger('day_number')->nullable();
            $table->date('date')->nullable();
            $table->time('start_time');
            $table->time('end_time')->nullable();
            $table->integer('duration')->default(60);
            $table->enum('repeat_type', ['none', 'weekly', 'daily'])->default('weekly');
            $table->boolean('is_available')->default(1);
            $table->boolean('is_booked')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index(['teacher_id', 'day_number', 'start_time'], 'group_class_time_slots_teacher_id_day_number_start_time_index');
            $table->foreign('teacher_id', 'group_class_time_slots_teacher_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_class_time_slots');
    }
};
