<?php

use Google\Cloud\Core\Timestamp;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_percentages', function (Blueprint $table) {
            $table->id();
            $table->decimal('value', 10, 2)->default(0.00);
            $table->date('effective_date');
            $table->boolean('is_active')->default(true);
            $table->string('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_percentages');
    }
};
