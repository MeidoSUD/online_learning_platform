<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user_achievements')) {
            return;
        }

        Schema::create('user_achievements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('achievement_id');
            $table->timestamp('earned_at')->useCurrent();
            $table->index('user_id', 'user_achievements_user_id_foreign');
            $table->index('achievement_id', 'user_achievements_achievement_id_foreign');
            $table->foreign('achievement_id', 'user_achievements_achievement_id_foreign')->references('id')->on('achievements')->onDelete('cascade');
            $table->foreign('user_id', 'user_achievements_user_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_achievements');
    }
};
