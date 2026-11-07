<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user_education_levels')) {
            return;
        }

        Schema::create('user_education_levels', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('education_level_id');
            $table->timestamp('created_at')->nullable();
            $table->index('education_level_id', 'user_education_levels_education_level_id_foreign');
            $table->index('user_id', 'user_education_levels_user_id_foreign');
            $table->foreign('education_level_id', 'user_education_levels_education_level_id_foreign')->references('id')->on('education_levels');
            $table->foreign('user_id', 'user_education_levels_user_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_education_levels');
    }
};
