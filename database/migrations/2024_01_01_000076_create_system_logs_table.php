<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('system_logs')) {
            return;
        }

        Schema::create('system_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('level', 255);
            $table->string('type', 255)->nullable();
            $table->string('title', 255);
            $table->longText('message');
            $table->text('file')->nullable();
            $table->integer('line')->nullable();
            $table->longText('trace')->nullable();
            $table->string('url', 255)->nullable();
            $table->string('method', 255)->nullable();
            $table->string('ip', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->json('context')->nullable();
            $table->string('hash', 255);
            $table->unsignedInteger('occurrences')->default(1);
            $table->timestamp('last_occurred_at')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique('hash', 'system_logs_hash_unique');
            $table->index('user_id', 'system_logs_user_id_foreign');
            $table->index('last_occurred_at', 'system_logs_last_occurred_at_index');
            $table->index('level', 'system_logs_level_index');
            $table->foreign('user_id', 'system_logs_user_id_foreign')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_logs');
    }
};
