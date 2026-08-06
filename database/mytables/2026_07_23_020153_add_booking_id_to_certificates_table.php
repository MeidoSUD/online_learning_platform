<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->unsignedBigInteger('booking_id')->nullable()->after('course_id');
            $table->foreign('booking_id')->references('id')->on('bookings')->onDelete('set null');
            $table->index('booking_id');
            $table->unique(['student_id', 'booking_id'], 'cert_unique_per_booking');
        });
    }

    public function down()
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropForeign(['booking_id']);
            $table->dropIndex('cert_unique_per_booking');
            $table->dropColumn('booking_id');
        });
    }
};
