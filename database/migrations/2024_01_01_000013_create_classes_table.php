<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('classes')) {
            return;
        }

        Schema::create('classes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('education_level_id');
            $table->string('name_en', 255);
            $table->string('name_ar', 255);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('education_level_id', 'classes_education_level_id_foreign');
            $table->foreign('education_level_id', 'classes_education_level_id_foreign')->references('id')->on('education_levels');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};
