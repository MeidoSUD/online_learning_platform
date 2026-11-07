<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user_classes')) {
            return;
        }

        Schema::create('user_classes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('education_level_id')->nullable();
            $table->unsignedBigInteger('user_education_level_id')->nullable();
            $table->unsignedBigInteger('class_id');
            $table->timestamp('created_at')->nullable();
            $table->index('class_id', 'user_classes_class_id_foreign');
            $table->index('user_education_level_id', 'user_classes_user_education_level_id_foreign');
            $table->foreign('class_id', 'user_classes_class_id_foreign')->references('id')->on('classes');
            $table->foreign('user_education_level_id', 'user_classes_user_education_level_id_foreign')->references('id')->on('user_education_levels');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_classes');
    }
};
