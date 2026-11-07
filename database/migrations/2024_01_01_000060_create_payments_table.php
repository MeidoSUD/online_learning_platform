<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payments')) {
            return;
        }

        Schema::create('payments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('booking_id')->nullable();
            $table->unsignedBigInteger('student_id')->nullable();
            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->decimal('amount', 13, 2);
            $table->string('currency', 3)->default('SAR');
            $table->string('payment_method', 100)->nullable();
            $table->string('transaction_reference', 255)->nullable();
            $table->string('gateway_reference', 255)->nullable();
            $table->json('gateway_response')->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->enum('refund_status', ['none', 'processing', 'completed', 'failed'])->nullable()->default('none');
            $table->dateTime('refund_processed_at')->nullable();
            $table->string('status', 20)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->unique('transaction_reference', 'payments_transaction_ref_unique');
            $table->unique('transaction_reference', 'transaction_reference');
            $table->index(['student_id', 'status'], 'idx_student_status');
            $table->index('teacher_id', 'payments_teacher_id_foreign');
            $table->index('booking_id', 'payments_booking_id_foreign');
            $table->foreign('booking_id', 'payments_booking_id_foreign')->references('id')->on('bookings')->onDelete('cascade');
            $table->foreign('student_id', 'payments_student_id_foreign')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('teacher_id', 'payments_teacher_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
