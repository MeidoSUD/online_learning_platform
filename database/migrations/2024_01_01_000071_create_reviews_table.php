<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('reviews')) {
            return;
        }

        Schema::create('reviews', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('session_id')->nullable();
            $table->unsignedBigInteger('reviewer_id');
            $table->unsignedBigInteger('reviewed_id')->nullable();
            $table->unsignedBigInteger('course_id')->nullable();
            $table->integer('rating');
            $table->text('comment')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('reviewer_id', 'reviews_reviewer_id_foreign');
            $table->index('reviewed_id', 'reviews_reviewed_id_foreign', 'btree');
            $table->index('course_id', 'availability_slots_course_id_foreign');
            $table->index('session_id', 'reviews_session_id_foreign');
            $table->foreign('course_id', 'reviews_course_id_foreign')->references('id')->on('courses')->onDelete('cascade');
            $table->foreign('reviewed_id', 'reviews_reviewee_id_foreign')->references('id')->on('users');
            $table->foreign('reviewer_id', 'reviews_reviewer_id_foreign')->references('id')->on('users');
            $table->foreign('session_id', 'reviews_session_id_foreign')->references('id')->on('sessions')->onDelete('no action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
