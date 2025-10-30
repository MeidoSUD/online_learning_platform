<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTimetablesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('timetables', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('course_id')->nullable();
            $table->unsignedBigInteger('lesson_id')->nullable();
            $table->integer('day_of_week')->nullable();
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamp('created_at')->nullable();

            $table->foreign('course_id')->references('id')->on('courses');
            $table->foreign('lesson_id')->references('id')->on('course_lessons');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('timetables');
    }
};
