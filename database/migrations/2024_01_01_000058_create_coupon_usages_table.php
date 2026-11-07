<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('coupon_usages')) {
            return;
        }

        Schema::create('coupon_usages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('coupon_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('booking_id')->nullable();
            $table->timestamp('used_at')->nullable();
            $table->index('coupon_id', 'coupon_usages_coupon_id_foreign');
            $table->index('user_id', 'coupon_usages_user_id_foreign');
            $table->index('booking_id', 'coupon_usages_booking_id_foreign');
            $table->foreign('booking_id', 'coupon_usages_booking_id_foreign')->references('id')->on('bookings');
            $table->foreign('coupon_id', 'coupon_usages_coupon_id_foreign')->references('id')->on('coupons');
            $table->foreign('user_id', 'coupon_usages_user_id_foreign')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupon_usages');
    }
};
