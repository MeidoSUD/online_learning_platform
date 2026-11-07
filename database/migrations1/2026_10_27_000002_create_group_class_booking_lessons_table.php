<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('group_class_booking_lessons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('booking_id');
            $table->unsignedBigInteger('group_class_lesson_id');
            $table->timestamps();

            $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('cascade');
            $table->foreign('group_class_lesson_id')->references('id')->on('group_class_lessons')->onDelete('cascade');
            $table->unique(['booking_id', 'group_class_lesson_id'], 'uq_gc_booking_lesson');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_class_booking_lessons');
    }
};
