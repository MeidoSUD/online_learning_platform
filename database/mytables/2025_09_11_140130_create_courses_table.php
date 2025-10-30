<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCoursesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->string('title_en');
            $table->string('title_ar');
            $table->text('description')->nullable();
            $table->enum('course_type', ['single', 'package', 'subscription']);
            $table->decimal('price', 10, 2)->nullable();
            $table->integer('duration_hours')->nullable();
            $table->enum('status', ['draft', 'published', 'archived']);
            $table->unsignedBigInteger('cover_image_id')->nullable();
            $table->timestamps();

            $table->foreign('teacher_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('category_id')->references('id')->on('course_categories');
            $table->foreign('cover_image_id')->references('id')->on('attachments');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('courses');
    }
};
