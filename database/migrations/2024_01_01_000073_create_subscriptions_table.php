<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('subscriptions')) {
            return;
        }

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('package_id')->nullable();
            $table->integer('sessions_remaining');
            $table->integer('sessions_used')->default(0);
            $table->string('status', 255)->default('active');
            $table->timestamp('start_date')->useCurrent();
            $table->timestamp('expiry_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->decimal('total_paid', 10, 2);
            $table->string('currency', 3)->default('SAR');
            $table->unsignedBigInteger('payment_id')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('package_id', 'subscriptions_package_id_foreign');
            $table->index('payment_id', 'subscriptions_payment_id_foreign');
            $table->index(['student_id', 'status'], 'subscriptions_student_id_status_index');
            $table->foreign('package_id', 'subscriptions_package_id_foreign')->references('id')->on('sessions_packages')->onDelete('set null');
            $table->foreign('payment_id', 'subscriptions_payment_id_foreign')->references('id')->on('payments')->onDelete('set null');
            $table->foreign('student_id', 'subscriptions_student_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
