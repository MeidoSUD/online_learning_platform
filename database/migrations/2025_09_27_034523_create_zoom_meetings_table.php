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
    Schema::create('zoom_meetings', function (Blueprint $table) {
        $table->id();
        $table->string('meeting_id')->nullable();   // Zoom meeting ID
        $table->string('topic');
        $table->string('start_url')->nullable();
        $table->string('join_url')->nullable();
        $table->timestamp('start_time')->nullable();
        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('zoom_meetings');
    }
};
