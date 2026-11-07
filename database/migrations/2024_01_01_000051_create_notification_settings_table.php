<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('notification_settings')) {
            return;
        }

        Schema::create('notification_settings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->boolean('push_enabled')->default(1);
            $table->boolean('email_enabled')->default(1);
            $table->boolean('sms_enabled')->default(1);
            $table->boolean('order_notifications')->default(1);
            $table->boolean('application_notifications')->default(1);
            $table->boolean('payment_notifications')->default(1);
            $table->boolean('session_notifications')->default(1);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique('user_id', 'notification_settings_user_id_unique');
            $table->foreign('user_id', 'notification_settings_user_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_settings');
    }
};
