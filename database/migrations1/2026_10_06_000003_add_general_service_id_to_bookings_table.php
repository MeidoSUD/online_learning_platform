<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            if (!Schema::hasColumn('bookings', 'general_service_id')) {
                $table->foreignId('general_service_id')
                    ->nullable()
                    ->after('service_id')
                    ->constrained('general_services')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            if (Schema::hasColumn('bookings', 'general_service_id')) {
                $table->dropForeign(['general_service_id']);
                $table->dropColumn('general_service_id');
            }
        });
    }
};
