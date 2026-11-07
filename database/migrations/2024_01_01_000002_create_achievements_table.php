<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('achievements')) {
            return;
        }

        Schema::create('achievements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('title_en', 255);
            $table->string('title_ar', 255);
            $table->text('description')->nullable();
            $table->string('badge_icon', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('achievements');
    }
};
