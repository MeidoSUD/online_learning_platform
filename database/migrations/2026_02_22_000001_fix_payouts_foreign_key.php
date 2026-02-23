<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class FixPayoutsForeignKey extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('payouts', function (Blueprint $table) {
            // Drop the old foreign key constraint
            $table->dropForeign(['payment_method_id']);
        });

        Schema::table('payouts', function (Blueprint $table) {
            // Add the correct foreign key constraint
            $table->foreign('payment_method_id')
                  ->references('id')
                  ->on('user_payment_methods')
                  ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('payouts', function (Blueprint $table) {
            // Drop the new foreign key constraint
            $table->dropForeign(['payment_method_id']);
        });

        Schema::table('payouts', function (Blueprint $table) {
            // Restore the old foreign key constraint (if needed)
            $table->foreign('payment_method_id')
                  ->references('id')
                  ->on('payment_methods')
                  ->onDelete('restrict');
        });
    }
}
