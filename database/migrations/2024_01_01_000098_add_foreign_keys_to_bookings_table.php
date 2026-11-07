<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $foreignKeys = DB::select("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND CONSTRAINT_NAME = 'bookings_subscription_id_foreign'");
        if (!empty($foreignKeys)) {
            return;
        }
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreign('subscription_id', 'bookings_subscription_id_foreign')->references('id')->on('subscriptions')->onDelete('set null');
        });
    }

    public function down(): void
    {
        $foreignKeys = DB::select("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND CONSTRAINT_NAME = 'bookings_subscription_id_foreign'");
        if (empty($foreignKeys)) {
            return;
        }
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign('bookings_subscription_id_foreign');
        });
    }
};
