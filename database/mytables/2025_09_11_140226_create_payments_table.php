<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePaymentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('payer_id');
            $table->unsignedBigInteger('booking_id')->nullable();
            $table->unsignedBigInteger('subscription_id')->nullable();
            $table->decimal('amount', 13, 2);
            $table->string('currency', 3)->default('SAR');
            $table->unsignedBigInteger('method_id');
            $table->string('transaction_ref')->unique()->nullable();
            $table->json('provider_response')->nullable();
            $table->decimal('platform_fee', 10, 2)->nullable();
            $table->decimal('teacher_earnings', 10, 2)->nullable();
            $table->enum('status', ['pending','succeeded','failed','refunded']);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('payer_id')->references('id')->on('users');
            $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('set null');
            $table->foreign('subscription_id')->references('id')->on('subscriptions');
            $table->foreign('method_id')->references('id')->on('payment_methods');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('payments');
    }
};
