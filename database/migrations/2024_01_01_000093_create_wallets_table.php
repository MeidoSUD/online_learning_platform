<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('wallets')) {
            return;
        }

        Schema::create('wallets', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->decimal('balance', 13, 2)->default(0.00);
            $table->decimal('pending_balance', 13, 2)->default(0.00);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique('user_id', 'wallets_user_id_unique');
            $table->foreign('user_id', 'wallets_user_id_foreign')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallets');
    }
};
