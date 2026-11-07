<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sessions_packages')) {
            return;
        }

        Schema::create('sessions_packages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name_ar', 255);
            $table->string('name_en', 255);
            $table->text('description_ar')->nullable();
            $table->text('description_en')->nullable();
            $table->integer('sessions_count');
            $table->decimal('price', 10, 2);
            $table->integer('discount_percentage')->default(0);
            $table->boolean('is_active')->default(1);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions_packages');
    }
};
