<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->string('consultation_reference')->unique();
            $table->foreignId('category_id')->constrained('consultation_categories')->restrictOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('service_id')->nullable()->constrained('services')->nullOnDelete();
            $table->foreignId('booking_id')->nullable()->constrained('bookings')->nullOnDelete();
            $table->string('title')->nullable();
            $table->text('description');
            $table->foreignId('preferred_language_id')->nullable()->constrained('languages')->nullOnDelete();
            $table->foreignId('education_level_id')->nullable()->constrained('education_levels')->nullOnDelete();
            $table->foreignId('class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->json('preferred_slots')->nullable();
            $table->unsignedInteger('duration_minutes')->default(60);
            $table->unsignedInteger('sessions_count')->default(1);
            $table->decimal('budget_min', 10, 2)->nullable();
            $table->decimal('budget_max', 10, 2)->nullable();
            $table->decimal('price_per_session', 10, 2)->nullable();
            $table->enum('status', ['pending', 'under_review', 'assigned', 'scheduled', 'completed', 'cancelled', 'rejected'])->default('pending')->index();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('assigned_at')->nullable();
            $table->text('admin_notes')->nullable();
            $table->date('scheduled_date')->nullable();
            $table->time('scheduled_start_time')->nullable();
            $table->time('scheduled_end_time')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamps();

            $table->index(['status', 'teacher_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};