<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('consultations')) {
            return;
        }

        Schema::create('consultations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('consultation_reference', 255);
            $table->unsignedBigInteger('category_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->unsignedBigInteger('service_id')->nullable();
            $table->unsignedBigInteger('booking_id')->nullable();
            $table->string('title', 255)->nullable();
            $table->text('description');
            $table->unsignedBigInteger('preferred_language_id')->nullable();
            $table->unsignedBigInteger('education_level_id')->nullable();
            $table->unsignedBigInteger('class_id')->nullable();
            $table->json('preferred_slots')->nullable();
            $table->unsignedInteger('duration_minutes')->default(60);
            $table->unsignedInteger('sessions_count')->default(1);
            $table->decimal('budget_min', 10, 2)->nullable();
            $table->decimal('budget_max', 10, 2)->nullable();
            $table->decimal('price_per_session', 10, 2)->nullable();
            $table->enum('status', ['pending', 'under_review', 'assigned', 'scheduled', 'completed', 'cancelled', 'rejected'])->default('pending');
            $table->unsignedBigInteger('assigned_by')->nullable();
            $table->timestamp('assigned_at')->nullable();
            $table->text('admin_notes')->nullable();
            $table->date('scheduled_date')->nullable();
            $table->time('scheduled_start_time')->nullable();
            $table->time('scheduled_end_time')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique('consultation_reference', 'consultations_consultation_reference_unique');
            $table->index('category_id', 'consultations_category_id_foreign');
            $table->index('student_id', 'consultations_student_id_foreign');
            $table->index('teacher_id', 'consultations_teacher_id_foreign');
            $table->index('service_id', 'consultations_service_id_foreign');
            $table->index('booking_id', 'consultations_booking_id_foreign');
            $table->index('preferred_language_id', 'consultations_preferred_language_id_foreign');
            $table->index('education_level_id', 'consultations_education_level_id_foreign');
            $table->index('class_id', 'consultations_class_id_foreign');
            $table->index('assigned_by', 'consultations_assigned_by_foreign');
            $table->index(['status', 'teacher_id'], 'consultations_status_teacher_id_index');
            $table->index('status', 'consultations_status_index');
            $table->foreign('assigned_by', 'consultations_assigned_by_foreign')->references('id')->on('users')->onDelete('set null');
            $table->foreign('booking_id', 'consultations_booking_id_foreign')->references('id')->on('bookings')->onDelete('set null');
            $table->foreign('category_id', 'consultations_category_id_foreign')->references('id')->on('consultation_categories');
            $table->foreign('class_id', 'consultations_class_id_foreign')->references('id')->on('classes')->onDelete('set null');
            $table->foreign('education_level_id', 'consultations_education_level_id_foreign')->references('id')->on('education_levels')->onDelete('set null');
            $table->foreign('preferred_language_id', 'consultations_preferred_language_id_foreign')->references('id')->on('languages')->onDelete('set null');
            $table->foreign('service_id', 'consultations_service_id_foreign')->references('id')->on('services')->onDelete('set null');
            $table->foreign('student_id', 'consultations_student_id_foreign')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('teacher_id', 'consultations_teacher_id_foreign')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};
