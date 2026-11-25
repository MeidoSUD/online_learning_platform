<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teacher_info', function (Blueprint $table) {
            $table->boolean('takaful_on_off')->default(0)->after('package_on_off');
        });
    }

    public function down(): void
    {
        Schema::table('teacher_info', function (Blueprint $table) {
            $table->dropColumn('takaful_on_off');
        });
    }
};
