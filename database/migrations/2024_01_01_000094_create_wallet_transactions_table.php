<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('wallet_transactions')) {
            return;
        }

        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('wallet_id');
            $table->enum('type', ['credit', 'debit']);
            $table->decimal('amount', 13, 2);
            $table->decimal('balance_before', 13, 2);
            $table->decimal('balance_after', 13, 2);
            $table->text('description')->nullable();
            $table->json('meta')->nullable();
            $table->unsignedBigInteger('related_payment_id')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('wallet_id', 'wallet_transactions_wallet_id_foreign');
            $table->index('related_payment_id', 'wallet_transactions_related_payment_id_foreign');
            $table->foreign('related_payment_id', 'wallet_transactions_related_payment_id_foreign')->references('id')->on('payments');
            $table->foreign('wallet_id', 'wallet_transactions_wallet_id_foreign')->references('id')->on('wallets')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
