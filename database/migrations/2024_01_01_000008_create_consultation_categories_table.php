<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('consultation_categories')) {
            return;
        }

        Schema::create('consultation_categories', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name_en', 255);
            $table->string('name_ar', 255);
            $table->text('description_en')->nullable();
            $table->text('description_ar')->nullable();
            $table->string('icon', 255)->nullable();
            $table->boolean('is_active')->default(1);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultation_categories');
    }
};
