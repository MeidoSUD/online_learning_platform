<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('platform_percentages')) {
            return;
        }

        Schema::create('platform_percentages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('type', 255)->default('student_percentage');
            $table->decimal('value', 10, 2)->default(0.00);
            $table->date('effective_date');
            $table->boolean('is_active')->default(1);
            $table->string('description', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_percentages');
    }
};
