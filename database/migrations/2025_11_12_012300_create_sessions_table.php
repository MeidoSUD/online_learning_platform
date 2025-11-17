<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->timestamp('two_hour_reminder_sent_at')->nullable()->after('status');
            $table->timestamp('zoom_creation_attempted_at')->nullable()->after('two_hour_reminder_sent_at');
            $table->boolean('zoom_generation_failed')->default(false)->after('zoom_creation_attempted_at');
        });
    }

    public function down()
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->dropColumn([
                'two_hour_reminder_sent_at',
                'zoom_creation_attempted_at',
                'zoom_generation_failed'
            ]);
        });
    }
};