<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('education_degrees')) {
            return;
        }

        Schema::create('education_degrees', function (Blueprint $table) {
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_general_ci';
            $table->integer('id', true);
            $table->string('name_en', 100);
            $table->string('name_ar', 100);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('education_degrees');
    }
};
