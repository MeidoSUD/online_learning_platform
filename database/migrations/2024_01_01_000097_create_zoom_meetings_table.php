<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('zoom_meetings')) {
            return;
        }

        Schema::create('zoom_meetings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('meeting_id', 255)->nullable();
            $table->string('topic', 255);
            $table->longText('start_url')->nullable();
            $table->longText('join_url')->nullable();
            $table->timestamp('start_time')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zoom_meetings');
    }
};
