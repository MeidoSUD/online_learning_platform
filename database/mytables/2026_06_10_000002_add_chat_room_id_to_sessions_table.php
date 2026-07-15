<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        if (! Schema::hasColumn('sessions', 'chat_room_id')) {
            Schema::table('sessions', function (Blueprint $table) {
                // store Agora Chat Room ID (string to be safe)
                $table->string('chat_room_id')->nullable()->after('meeting_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        if (Schema::hasColumn('sessions', 'chat_room_id')) {
            Schema::table('sessions', function (Blueprint $table) {
                $table->dropColumn('chat_room_id');
            });
        }
    }
};
