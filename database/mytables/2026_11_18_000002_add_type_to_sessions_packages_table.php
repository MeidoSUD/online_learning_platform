<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sessions_packages', function (Blueprint $table) {
            $table->enum('type', ['paid', 'free'])->default('paid')->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('sessions_packages', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
