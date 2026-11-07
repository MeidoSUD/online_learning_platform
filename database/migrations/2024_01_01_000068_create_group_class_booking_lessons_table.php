<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('group_class_booking_lessons')) {
            return;
        }

        Schema::create('group_class_booking_lessons', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('booking_id');
            $table->unsignedBigInteger('group_class_lesson_id');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique(['booking_id', 'group_class_lesson_id'], 'uq_gc_booking_lesson');
            $table->index('group_class_lesson_id', 'group_class_booking_lessons_group_class_lesson_id_foreign');
            $table->foreign('booking_id', 'group_class_booking_lessons_booking_id_foreign')->references('id')->on('bookings')->onDelete('cascade');
            $table->foreign('group_class_lesson_id', 'group_class_booking_lessons_group_class_lesson_id_foreign')->references('id')->on('group_class_lessons')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_class_booking_lessons');
    }
};
