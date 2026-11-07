<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user_profiles')) {
            return;
        }

        Schema::create('user_profiles', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->text('bio')->nullable();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('profile_photo_id')->nullable();
            $table->boolean('terms_accepted')->default(0);
            $table->boolean('contract_accepted')->default(0);
            $table->timestamp('contract_accepted_at')->nullable();
            $table->boolean('verified')->default(0);
            $table->string('language_pref', 255)->default('ar');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique('user_id', 'user_profiles_user_id_unique');
            $table->index('profile_photo_id', 'user_profiles_profile_photo_id_foreign');
            $table->foreign('profile_photo_id', 'user_profiles_profile_photo_id_foreign')->references('id')->on('attachments');
            $table->foreign('user_id', 'user_profiles_user_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
