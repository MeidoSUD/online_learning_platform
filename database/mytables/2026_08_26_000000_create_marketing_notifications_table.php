<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('body');
            $table->enum('channel', ['push', 'sms', 'both']);
            $table->enum('target_type', ['all', 'teachers', 'students', 'single_user']);
            $table->foreignId('target_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('scheduled_at')->nullable()->index();
            $table->enum('status', ['pending', 'sent', 'failed'])->default('pending')->index();
            $table->unsignedInteger('total_targeted')->default(0);
            $table->unsignedInteger('total_sent')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_notifications');
    }
};
