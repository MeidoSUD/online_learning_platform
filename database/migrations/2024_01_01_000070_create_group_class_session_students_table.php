<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('group_class_session_students')) {
            return;
        }

        Schema::create('group_class_session_students', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('group_class_session_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('booking_id');
            $table->string('status', 255)->default('scheduled');
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique(['group_class_session_id', 'student_id'], 'uq_gcss_session_student');
            $table->index(['student_id', 'status'], 'idx_gcss_student_status');
            $table->index('booking_id', 'idx_gcss_booking');
            $table->foreign('booking_id', 'group_class_session_students_booking_id_foreign')->references('id')->on('bookings')->onDelete('cascade');
            $table->foreign('group_class_session_id', 'group_class_session_students_group_class_session_id_foreign')->references('id')->on('group_class_sessions')->onDelete('cascade');
            $table->foreign('student_id', 'group_class_session_students_student_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_class_session_students');
    }
};
