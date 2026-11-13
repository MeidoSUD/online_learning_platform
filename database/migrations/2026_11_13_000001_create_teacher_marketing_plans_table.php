<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('teacher_marketing_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name_ar');
            $table->string('name_en');
            $table->text('description_ar')->nullable();
            $table->text('description_en')->nullable();
            $table->integer('duration_months')->default(1); // 1 or 3 months
            $table->integer('duration_days')->default(30);   // 30 or 90 days
            $table->decimal('price', 10, 2)->default(0.00);
            $table->string('badge_text_ar')->default('مميز');
            $table->string('badge_text_en')->default('Featured');
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_marketing_plans');
    }
};

