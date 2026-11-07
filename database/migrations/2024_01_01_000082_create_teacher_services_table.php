<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('teacher_services')) {
            return;
        }

        Schema::create('teacher_services', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedBigInteger('service_id');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('service_id', 'teacher_services_service_id_foreign');
            $table->index('teacher_id', 'teacher_services_teacher_id_foreign');
            $table->foreign('service_id', 'teacher_services_service_id_foreign')->references('id')->on('services')->onDelete('cascade');
            $table->foreign('teacher_id', 'teacher_services_teacher_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_services');
    }
};
