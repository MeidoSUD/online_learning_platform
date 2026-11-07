<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('saved_cards')) {
            return;
        }

        Schema::create('saved_cards', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->string('registration_id', 255);
            $table->string('card_brand', 255);
            $table->string('last4', 4);
            $table->string('expiry_month', 2);
            $table->string('expiry_year', 4);
            $table->string('nickname', 255)->nullable();
            $table->boolean('is_default')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->unique('registration_id', 'saved_cards_registration_id_unique');
            $table->index('user_id', 'saved_cards_user_id_index');
            $table->index('is_default', 'saved_cards_is_default_index');
            $table->index(['user_id', 'is_default'], 'saved_cards_user_id_is_default_index');
            $table->foreign('user_id', 'saved_cards_user_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_cards');
    }
};
