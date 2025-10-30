<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUserClassesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('user_classes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_education_level_id');
            $table->unsignedBigInteger('class_id');
            $table->timestamp('created_at')->nullable();

            $table->foreign('user_education_level_id')->references('id')->on('user_education_levels');
            $table->foreign('class_id')->references('id')->on('classes');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('user_classes');
    }
}
