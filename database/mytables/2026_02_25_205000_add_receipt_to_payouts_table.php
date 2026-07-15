<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddReceiptToPayoutsTable extends Migration
{
    public function up()
    {
        Schema::table('payouts', function (Blueprint $table) {
            $table->string('reject_reason')->nullable()->after('status');
            $table->string('receipt')->nullable()->after('status');
        });
    }

    public function down()
    {
        Schema::table('payouts', function (Blueprint $table) {
            $table->dropColumn('receipt');
        });
    }
}
