<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPendingBalanceToWalletsTable extends Migration
{
    public function up()
    {
        if (!Schema::hasColumn('wallets', 'pending_balance')) {
            Schema::table('wallets', function (Blueprint $table) {
                $table->decimal('pending_balance', 13, 2)->default(0)->after('balance');
            });
        }
    }

    public function down()
    {
        if (Schema::hasColumn('wallets', 'pending_balance')) {
            Schema::table('wallets', function (Blueprint $table) {
                $table->dropColumn('pending_balance');
            });
        }
    }
}
