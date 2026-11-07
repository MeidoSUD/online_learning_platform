<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('subjects')) {
            return;
        }

        Schema::create('subjects', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('service_id')->nullable();
            $table->string('name_en', 255);
            $table->string('name_ar', 255);
            $table->unsignedBigInteger('class_id')->nullable();
            $table->unsignedBigInteger('education_level_id')->nullable();
            $table->boolean('status')->default(1);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('education_level_id', 'subjects_education_level_id_foreign');
            $table->index('service_id', 'foreign_service_id');
            $table->index('class_id', 'fk_subjects_class_id');
            $table->foreign('class_id', 'fk_subjects_class_id')->references('id')->on('classes')->onDelete('cascade');
            $table->foreign('education_level_id', 'subjects_education_level_id_foreign')->references('id')->on('education_levels');
            $table->foreign('service_id', 'subjects_ibfk_1')->references('id')->on('services')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};
