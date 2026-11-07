<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('education_levels')) {
            return;
        }

        Schema::create('education_levels', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name_en', 255);
            $table->string('name_ar', 255);
            $table->text('description')->nullable();
            $table->boolean('status')->default(1);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('education_levels');
    }
};
