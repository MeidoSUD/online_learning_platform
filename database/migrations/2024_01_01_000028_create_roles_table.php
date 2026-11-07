<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('roles')) {
            return;
        }

        Schema::create('roles', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name_key', 255);
            $table->string('name_en', 255);
            $table->string('name_ar', 255);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique('name_key', 'roles_name_key_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
