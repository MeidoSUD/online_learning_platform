<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payouts')) {
            return;
        }

        Schema::create('payouts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('teacher_id');
            $table->decimal('amount', 13, 2);
            $table->unsignedBigInteger('payment_method_id')->nullable();
            $table->unsignedBigInteger('card_id')->nullable();
            $table->string('status', 100)->nullable();
            $table->string('receipt', 255)->nullable();
            $table->string('reject_reason', 255)->nullable();
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('teacher_id', 'payouts_teacher_id_foreign');
            $table->index('payment_method_id', 'payouts_payment_method_id_foreign');
            $table->index('card_id', 'payouts_card_id_foreign');
            $table->foreign('card_id', 'payouts_card_id_foreign')->references('id')->on('cards')->onDelete('set null');
            $table->foreign('payment_method_id', 'payouts_payment_method_id_foreign')->references('id')->on('user_payment_methods')->onUpdate('cascade');
            $table->foreign('teacher_id', 'payouts_teacher_id_foreign')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payouts');
    }
};
