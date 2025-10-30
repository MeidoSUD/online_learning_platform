<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRefundsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('refunds', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('payment_id');
            $table->unsignedBigInteger('requester_id');
            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->unsignedBigInteger('course_id')->nullable();
            $table->decimal('amount', 13, 2);
            $table->unsignedBigInteger('refund_reason_id');
            $table->enum('status', ['pending','approved','rejected','processed']);
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->foreign('payment_id')->references('id')->on('payments');
            $table->foreign('requester_id')->references('id')->on('users');
            $table->foreign('teacher_id')->references('id')->on('users');
            $table->foreign('course_id')->references('id')->on('courses');
            $table->foreign('refund_reason_id')->references('id')->on('refund_reasons');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('refunds');
    }
};
