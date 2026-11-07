<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('profile_completes')) {
            return;
        }

        Schema::create('profile_completes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->boolean('is_bio')->nullable()->default(0);
            $table->boolean('is_profile_picture')->nullable()->default(0);
            $table->boolean('is_phone_number')->nullable()->default(0);
            $table->boolean('is_email')->nullable()->default(0);
            $table->boolean('is_hourly_rate')->nullable()->default(0);
            $table->boolean('time_slots')->nullable()->default(0);
            $table->boolean('package_on')->nullable()->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('user_id', 'profile_completes_user_id_foreign');
            $table->foreign('user_id', 'profile_completes_user_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_completes');
    }
};
