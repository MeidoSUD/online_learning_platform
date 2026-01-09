<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone_number')->unique()->nullable();
            $table->string('password')->nullable();
            $table->unsignedBigInteger('role_id');
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('teacher_type')->nullable(); // e.g. 'individual', 'institute'
            $table->date('date_of_birth')->nullable();
            $table->string('timezone')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('social_provider')->nullable();
            $table->string('social_provider_id')->nullable();
            $table->string('remember_token')->nullable();
            $table->tinyInteger('is_active')->default(1);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('role_id')->references('id')->on('roles')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('users');
    }
}
