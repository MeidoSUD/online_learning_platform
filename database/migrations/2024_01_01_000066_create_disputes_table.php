<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('disputes')) {
            return;
        }

        Schema::create('disputes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('booking_id')->nullable();
            $table->unsignedBigInteger('session_id')->nullable();
            $table->unsignedBigInteger('payment_id')->nullable();
            $table->unsignedBigInteger('raised_by');
            $table->unsignedBigInteger('against_user_id');
            $table->text('reason');
            $table->enum('status', ['open', 'under_review', 'resolved', 'rejected']);
            $table->text('resolution_note')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('booking_id', 'disputes_booking_id_foreign');
            $table->index('payment_id', 'disputes_payment_id_foreign');
            $table->index('raised_by', 'disputes_raised_by_foreign');
            $table->index('against_user_id', 'disputes_against_user_id_foreign');
            $table->index('session_id', 'disputes_session_id_foreign');
            $table->foreign('against_user_id', 'disputes_against_user_id_foreign')->references('id')->on('users');
            $table->foreign('booking_id', 'disputes_booking_id_foreign')->references('id')->on('bookings');
            $table->foreign('payment_id', 'disputes_payment_id_foreign')->references('id')->on('payments');
            $table->foreign('raised_by', 'disputes_raised_by_foreign')->references('id')->on('users');
            $table->foreign('session_id', 'disputes_session_id_foreign')->references('id')->on('sessions')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('disputes');
    }
};
