<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('marketing_notifications')) {
            return;
        }

        Schema::create('marketing_notifications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('title', 255);
            $table->text('body');
            $table->string('channel', 50)->default('push');
            $table->enum('target_type', ['all', 'teachers', 'students', 'single_user', 'multi_teachers', 'multi_students']);
            $table->unsignedBigInteger('target_user_id')->nullable();
            $table->json('target_user_ids')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->enum('status', ['pending', 'sent', 'failed'])->default('pending');
            $table->unsignedInteger('total_targeted')->default(0);
            $table->unsignedInteger('total_sent')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('target_user_id', 'marketing_notifications_target_user_id_foreign');
            $table->index('scheduled_at', 'marketing_notifications_scheduled_at_index');
            $table->index('status', 'marketing_notifications_status_index');
            $table->foreign('target_user_id', 'marketing_notifications_target_user_id_foreign')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_notifications');
    }
};
