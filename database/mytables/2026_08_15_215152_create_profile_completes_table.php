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
        Schema::create('profile_completes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->boolean('is_bio')->nullable()->default(false);
            $table->boolean('is_profile_picture')->nullable()->default(false);
            $table->boolean('is_phone_number')->nullable()->default(false);
            $table->boolean('is_email')->nullable()->default(false);
            $table->boolean('is_hourly_rate')->nullable()->default(false);
            $table->boolean('time_slots')->nullable()->default(false);
            $table->boolean('package_on')->nullable()->default(false);

            $table->reference('user_id')->on('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('profile_completes');
    }
};
