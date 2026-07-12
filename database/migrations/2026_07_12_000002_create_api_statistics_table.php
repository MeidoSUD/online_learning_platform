<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_statistics', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->string('endpoint');
            $table->string('uri');
            $table->string('method', 10);
            $table->string('module')->nullable();
            $table->date('date');

            $table->unsignedBigInteger('hits')->default(0);
            $table->unsignedBigInteger('authenticated_hits')->default(0);
            $table->unsignedBigInteger('guest_hits')->default(0);
            $table->unsignedBigInteger('success_hits')->default(0);
            $table->unsignedBigInteger('client_error_hits')->default(0);
            $table->unsignedBigInteger('server_error_hits')->default(0);

            $table->double('total_response_time', 14, 4)->default(0);
            $table->double('min_response_time', 10, 4)->default(0);
            $table->double('max_response_time', 10, 4)->default(0);

            $table->double('total_memory_usage', 14, 4)->default(0);
            $table->double('max_memory_usage', 10, 4)->default(0);

            $table->unsignedBigInteger('web_hits')->default(0);
            $table->unsignedBigInteger('android_hits')->default(0);
            $table->unsignedBigInteger('ios_hits')->default(0);
            $table->unsignedBigInteger('other_hits')->default(0);

            $table->unsignedSmallInteger('last_status_code')->nullable();
            $table->timestamp('last_hit_at')->nullable();

            $table->timestamps();

            $table->unique(['endpoint', 'method', 'date'], 'uq_api_stats_endpoint_method_date');
            $table->index('date');
            $table->index('module');
            $table->index('method');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_statistics');
    }
};
