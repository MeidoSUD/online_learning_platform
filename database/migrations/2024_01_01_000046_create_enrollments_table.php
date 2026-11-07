<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('enrollments')) {
            return;
        }

        Schema::create('enrollments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('course_id');
            $table->timestamp('enrollment_date')->nullable();
            $table->enum('status', ['pending', 'active', 'completed', 'canceled'])->default('pending');
            $table->unsignedTinyInteger('progress')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('student_id', 'enrollments_student_id_foreign');
            $table->index('course_id', 'enrollments_course_id_foreign');
            $table->foreign('course_id', 'enrollments_course_id_foreign')->references('id')->on('courses')->onDelete('cascade');
            $table->foreign('student_id', 'enrollments_student_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
