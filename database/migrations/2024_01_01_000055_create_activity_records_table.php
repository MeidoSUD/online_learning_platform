<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('activity_records')) {
            return;
        }

        Schema::create('activity_records', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('title', 255);
            $table->string('category', 255)->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('booking_id')->nullable();
            $table->unsignedBigInteger('service_id')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->unsignedBigInteger('language_id')->nullable();
            $table->unsignedBigInteger('course_id')->nullable();
            $table->string('session_type', 255)->nullable();
            $table->integer('sessions_count')->nullable();
            $table->json('data');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('user_id', 'activity_records_user_id_foreign');
            $table->index('booking_id', 'activity_records_booking_id_foreign');
            $table->index('service_id', 'activity_records_service_id_foreign');
            $table->index('subject_id', 'activity_records_subject_id_foreign');
            $table->index('teacher_id', 'activity_records_teacher_id_foreign');
            $table->index('language_id', 'activity_records_language_id_foreign');
            $table->index('course_id', 'activity_records_course_id_foreign');
            $table->index('title', 'activity_records_title_index');
            $table->index('category', 'activity_records_category_index');
            $table->index('created_at', 'activity_records_created_at_index');
            $table->foreign('booking_id', 'activity_records_booking_id_foreign')->references('id')->on('bookings')->onDelete('set null');
            $table->foreign('course_id', 'activity_records_course_id_foreign')->references('id')->on('courses')->onDelete('set null');
            $table->foreign('language_id', 'activity_records_language_id_foreign')->references('id')->on('languages')->onDelete('set null');
            $table->foreign('service_id', 'activity_records_service_id_foreign')->references('id')->on('services')->onDelete('set null');
            $table->foreign('subject_id', 'activity_records_subject_id_foreign')->references('id')->on('subjects')->onDelete('set null');
            $table->foreign('teacher_id', 'activity_records_teacher_id_foreign')->references('id')->on('users')->onDelete('set null');
            $table->foreign('user_id', 'activity_records_user_id_foreign')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_records');
    }
};
