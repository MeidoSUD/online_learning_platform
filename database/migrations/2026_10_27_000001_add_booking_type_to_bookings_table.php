<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->enum('booking_type', ['individual', 'group'])->default('individual')->after('session_type')->index();
            $table->unsignedBigInteger('group_class_id')->nullable()->after('course_id');
            $table->foreign('group_class_id')->references('id')->on('group_classes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['group_class_id']);
            $table->dropColumn('group_class_id');
            $table->dropIndex(['booking_type']);
            $table->dropColumn('booking_type');
        });
    }
};
