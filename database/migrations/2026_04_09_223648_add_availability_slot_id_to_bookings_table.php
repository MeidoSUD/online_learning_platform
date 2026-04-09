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
    public function up()
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedBigInteger('availability_slot_id')->nullable()->after('id');
            // Assuming the table is availability_slots
            // $table->foreign('availability_slot_id')->references('id')->on('availability_slots')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('bookings', function (Blueprint $table) {
            // $table->dropForeign(['availability_slot_id']);
            $table->dropColumn('availability_slot_id');
        });
    }
};
