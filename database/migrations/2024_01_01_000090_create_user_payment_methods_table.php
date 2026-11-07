<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user_payment_methods')) {
            return;
        }

        Schema::create('user_payment_methods', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('payment_method_id')->nullable();
            $table->unsignedBigInteger('bank_id')->nullable();
            $table->string('account_number', 255)->nullable();
            $table->string('account_holder_name', 255)->nullable();
            $table->string('iban', 255)->nullable();
            $table->string('swift_code', 100)->nullable();
            $table->string('card_brand', 255)->nullable();
            $table->string('card_number', 255)->nullable();
            $table->string('card_holder_name', 255)->nullable();
            $table->string('card_cvc', 255)->nullable();
            $table->integer('card_expiry_month')->nullable();
            $table->integer('card_expiry_year')->nullable();
            $table->boolean('is_default')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('user_id', 'user_payment_methods_user_id_foreign');
            $table->index('payment_method_id', 'user_payment_methods_payment_method_id_foreign');
            $table->index('bank_id', 'fk_bank_id');
            $table->foreign('bank_id', 'fk_bank_id')->references('id')->on('banks')->onDelete('cascade');
            $table->foreign('payment_method_id', 'user_payment_methods_payment_method_id_foreign')->references('id')->on('payment_methods')->onDelete('cascade');
            $table->foreign('user_id', 'user_payment_methods_user_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_payment_methods');
    }
};
