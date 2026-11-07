<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('lesson_sessions')) {
            return;
        }

        Schema::create('lesson_sessions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('booking_id');
            $table->enum('meeting_provider', ['zoom', 'google_meet', 'jitsi', 'builtin']);
            $table->text('meeting_link');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->enum('attendance_status', ['pending', 'attended', 'absent']);
            $table->text('recording_url')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique('booking_id', 'lesson_sessions_booking_id_unique');
            $table->foreign('booking_id', 'lesson_sessions_booking_id_foreign')->references('id')->on('bookings')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lesson_sessions');
    }
};
