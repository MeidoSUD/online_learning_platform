<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('teacher_general_services')) {
            return;
        }

        Schema::create('teacher_general_services', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedBigInteger('general_service_id');
            $table->decimal('price', 10, 2);
            $table->boolean('is_active')->default(1);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique(['teacher_id', 'general_service_id'], 'teacher_general_services_teacher_id_general_service_id_unique');
            $table->index('general_service_id', 'teacher_general_services_general_service_id_foreign');
            $table->foreign('general_service_id', 'teacher_general_services_general_service_id_foreign')->references('id')->on('general_services')->onDelete('cascade');
            $table->foreign('teacher_id', 'teacher_general_services_teacher_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_general_services');
    }
};
