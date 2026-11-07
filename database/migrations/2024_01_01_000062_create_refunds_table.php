<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('refunds')) {
            return;
        }

        Schema::create('refunds', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('payment_id');
            $table->unsignedBigInteger('requester_id');
            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->unsignedBigInteger('course_id')->nullable();
            $table->decimal('amount', 13, 2);
            $table->unsignedBigInteger('refund_reason_id');
            $table->enum('status', ['pending', 'approved', 'rejected', 'processed']);
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->index('payment_id', 'refunds_payment_id_foreign');
            $table->index('requester_id', 'refunds_requester_id_foreign');
            $table->index('teacher_id', 'refunds_teacher_id_foreign');
            $table->index('course_id', 'refunds_course_id_foreign');
            $table->index('refund_reason_id', 'refunds_refund_reason_id_foreign');
            $table->foreign('course_id', 'refunds_course_id_foreign')->references('id')->on('courses');
            $table->foreign('payment_id', 'refunds_payment_id_foreign')->references('id')->on('payments');
            $table->foreign('refund_reason_id', 'refunds_refund_reason_id_foreign')->references('id')->on('refund_reasons');
            $table->foreign('requester_id', 'refunds_requester_id_foreign')->references('id')->on('users');
            $table->foreign('teacher_id', 'refunds_teacher_id_foreign')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refunds');
    }
};
