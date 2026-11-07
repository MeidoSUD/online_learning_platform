<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('refund_reasons')) {
            return;
        }

        Schema::create('refund_reasons', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name_en', 255);
            $table->string('name_ar', 255);
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refund_reasons');
    }
};
