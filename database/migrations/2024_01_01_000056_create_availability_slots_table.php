<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('availability_slots')) {
            return;
        }

        Schema::create('availability_slots', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->unsignedBigInteger('course_id')->nullable();
            $table->unsignedBigInteger('order_id')->nullable();
            $table->date('date')->nullable();
            $table->integer('day_number')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->integer('duration')->nullable();
            $table->enum('repeat_type', ['none', 'weekly', 'daily'])->default('none');
            $table->boolean('is_available')->default(1);
            $table->boolean('is_booked')->nullable()->default(0);
            $table->unsignedBigInteger('booking_id')->nullable();
            $table->json('recurring_rule')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index(['teacher_id', 'start_time'], 'availability_slots_teacher_id_start_time_index');
            $table->index('course_id', 'availability_slots_course_id_foreign');
            $table->index('booking_id', 'availability_slots_booking_id_foreign');
            $table->index('order_id', 'fk_order_id');
            $table->foreign('booking_id', 'availability_slots_booking_id_foreign')->references('id')->on('bookings')->onDelete('set null');
            $table->foreign('course_id', 'availability_slots_course_id_foreign')->references('id')->on('courses')->onDelete('cascade');
            $table->foreign('teacher_id', 'availability_slots_teacher_id_foreign')->references('id')->on('users');
            $table->foreign('order_id', 'fk_order_id')->references('id')->on('orders')->onDelete('cascade');
        });
        DB::statement("ALTER TABLE `availability_slots` MODIFY `day_number` int(2) NULL DEFAULT NULL");
        DB::statement("ALTER TABLE `availability_slots` MODIFY `duration` int(20) NULL DEFAULT NULL");
    }

    public function down(): void
    {
        Schema::dropIfExists('availability_slots');
    }
};
