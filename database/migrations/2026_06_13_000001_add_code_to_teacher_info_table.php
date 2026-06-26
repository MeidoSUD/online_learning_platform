<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teacher_info', function (Blueprint $table) {
            $table->string('code', 20)->unique()->nullable()->after('id');
            $table->boolean('package_on_off')->default(false)->after('code');
        });
    }

    public function down(): void
    {
        Schema::table('teacher_info', function (Blueprint $table) {
            $table->dropColumn('code');
            $table->dropColumn('package_on_off');
        });
    }
};
