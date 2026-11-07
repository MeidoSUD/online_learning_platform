<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('activity_logs')) {
            return;
        }

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('action_key', 255);
            $table->string('target_table', 255)->nullable();
            $table->bigInteger('target_id')->nullable();
            $table->json('data')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->index('user_id', 'activity_logs_user_id_foreign');
            $table->foreign('user_id', 'activity_logs_user_id_foreign')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
