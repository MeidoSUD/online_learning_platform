<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('bookings')) {
            return;
        }

        Schema::create('bookings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('timeslot_id')->nullable();
            $table->unsignedBigInteger('availability_slot_id')->nullable();
            $table->unsignedBigInteger('service_id')->nullable();
            $table->unsignedBigInteger('general_service_id')->nullable();
            $table->string('booking_reference', 255)->nullable();
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedBigInteger('course_id')->nullable();
            $table->unsignedBigInteger('group_class_id')->nullable();
            $table->unsignedBigInteger('course_group_id')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->unsignedBigInteger('language_id')->nullable();
            $table->unsignedBigInteger('order_id')->nullable();
            $table->enum('session_type', ['single', 'package'])->nullable();
            $table->enum('booking_type', ['individual', 'group'])->default('individual');
            $table->integer('sessions_count')->nullable()->default(1);
            $table->integer('sessions_completed')->nullable()->default(0);
            $table->date('first_session_date')->nullable();
            $table->time('first_session_start_time')->nullable();
            $table->time('first_session_end_time')->nullable();
            $table->integer('session_duration')->nullable();
            $table->decimal('teacher_rate_per_session', 10, 2)->nullable();
            $table->decimal('platform_percentage', 10, 2)->nullable()->default(0.00);
            $table->decimal('price_per_session', 10, 2)->nullable();
            $table->decimal('subtotal', 10, 2)->nullable();
            $table->decimal('discount_percentage', 5, 2)->nullable()->default(0.00);
            $table->decimal('discount_amount', 10, 2)->nullable()->default(0.00);
            $table->decimal('total_amount', 10, 2)->nullable();
            $table->string('currency', 3)->nullable()->default('SAR');
            $table->text('special_requests')->nullable();
            $table->enum('status', ['pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled'])->nullable();
            $table->dateTime('booking_date')->nullable();
            $table->string('cancellation_reason', 255)->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->decimal('refund_percentage', 5, 2)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unsignedBigInteger('subscription_id')->nullable();
            $table->json('sessions_per_slot')->nullable();
            $table->unique('booking_reference', 'booking_reference');
            $table->index(['student_id', 'status'], 'idx_student_status');
            $table->index(['teacher_id', 'status'], 'idx_teacher_status');
            $table->index('course_id', 'bookings_course_id_foreign');
            $table->index('order_id', 'fk_orders_id');
            $table->index('subscription_id', 'bookings_subscription_id_foreign');
            $table->index('general_service_id', 'bookings_general_service_id_foreign');
            $table->index('group_class_id', 'bookings_group_class_id_foreign');
            $table->index('booking_type', 'bookings_booking_type_index');
            $table->foreign('course_id', 'bookings_course_id_foreign')->references('id')->on('courses')->onDelete('cascade');
            $table->foreign('general_service_id', 'bookings_general_service_id_foreign')->references('id')->on('general_services')->onDelete('set null');
            $table->foreign('group_class_id', 'bookings_group_class_id_foreign')->references('id')->on('group_classes')->onDelete('set null');
            $table->foreign('student_id', 'bookings_student_id_foreign')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('teacher_id', 'bookings_teacher_id_foreign')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('order_id', 'fk_orders_id')->references('id')->on('orders')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
