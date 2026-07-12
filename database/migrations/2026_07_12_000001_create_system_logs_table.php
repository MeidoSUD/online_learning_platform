<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_logs', function (Blueprint $table) {
            $table->id();

            $table->string('level')->index();
            $table->string('type')->nullable();

            $table->string('title');

            $table->longText('message');

            $table->text('file')->nullable();
            $table->integer('line')->nullable();

            $table->longText('trace')->nullable();

            $table->string('url')->nullable();
            $table->string('method')->nullable();

            $table->ipAddress('ip')->nullable();

            $table->text('user_agent')->nullable();

            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            $table->json('context')->nullable();

            $table->string('hash')->unique();

            $table->unsignedInteger('occurrences')->default(1);

            $table->timestamp('last_occurred_at');

            $table->timestamps();

            $table->index(['last_occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_logs');
    }
};
