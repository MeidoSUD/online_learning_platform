<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user_hidden_services')) {
            return;
        }

        Schema::create('user_hidden_services', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('service_id');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique(['user_id', 'service_id'], 'user_hidden_services_user_id_service_id_unique');
            $table->index('service_id', 'user_hidden_services_service_id_foreign');
            $table->foreign('service_id', 'user_hidden_services_service_id_foreign')->references('id')->on('services')->onDelete('cascade');
            $table->foreign('user_id', 'user_hidden_services_user_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_hidden_services');
    }
};
