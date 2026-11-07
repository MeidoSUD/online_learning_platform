<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            return;
        }

        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('first_name', 255)->nullable();
            $table->string('last_name', 255)->nullable();
            $table->string('email', 255)->nullable();
            $table->string('phone_number', 255)->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password', 255);
            $table->unsignedBigInteger('role_id')->nullable();
            $table->unsignedBigInteger('company_id')->nullable();
            $table->boolean('profile_completed')->default(0);
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('teacher_type', 100)->nullable();
            $table->string('nationality', 255)->nullable();
            $table->string('fcm_token', 255)->nullable();
            $table->boolean('verified')->default(0);
            $table->bigInteger('verification_code')->nullable();
            $table->string('social_provider', 255)->nullable();
            $table->string('social_provider_id', 255)->nullable();
            $table->boolean('is_active')->default(0);
            $table->string('remember_token', 100)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->string('agora_chat_uid', 222)->nullable();
            $table->unique('email', 'users_email_unique');
            $table->index('role_id', 'role_id_foreign');
            $table->index('company_id', 'users_company_id_index');
            $table->foreign('role_id', 'role_id_foreign')->references('id')->on('roles')->onDelete('cascade');
        });
        DB::statement("ALTER TABLE `users` MODIFY `verification_code` bigint(10) NULL DEFAULT NULL");
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
