<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('app_versions')) {
            return;
        }

        Schema::create('app_versions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('platform', 255);
            $table->string('version', 255);
            $table->boolean('force_update')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_versions');
    }
};
