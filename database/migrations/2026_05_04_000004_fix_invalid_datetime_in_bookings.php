<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Fix invalid datetime values in bookings table before adding constraints
     */
    public function up(): void
    {
        // Fix invalid created_at timestamps
        DB::statement("
            UPDATE bookings 
            SET created_at = NOW()
            WHERE created_at = '0000-00-00 00:00:00' 
               OR created_at IS NULL
        ");

        // Fix invalid updated_at timestamps
        DB::statement("
            UPDATE bookings 
            SET updated_at = NOW()
            WHERE updated_at = '0000-00-00 00:00:00' 
               OR updated_at IS NULL
        ");

        // Fix invalid booking_date timestamps if they exist
        DB::statement("
            UPDATE bookings 
            SET booking_date = NOW()
            WHERE (booking_date = '0000-00-00 00:00:00' OR booking_date IS NULL)
            AND booking_date IS NOT NULL
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Can't revert this - the bad data is now fixed
        // This is a data cleanup migration
    }
};
