<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sessions', function (Blueprint $table) {
            // Add the column (nullable or required)
            $table->unsignedBigInteger('availability_slot_id')->nullable()->after('id');

            // Add foreign key
            $table->foreign('availability_slot_id')
                ->references('id')
                ->on('availability_slots')
                ->onDelete('cascade'); // or restrict / set null
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sessions', function (Blueprint $table) {
            // Drop foreign key then column
            $table->dropForeign(['availability_slot_id']);
            $table->dropColumn('availability_slot_id');
        });
    }
};
