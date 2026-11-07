<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('complaints')) {
            return;
        }

        Schema::create('complaints', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('session_id');
            $table->unsignedBigInteger('student_id');
            $table->unsignedBigInteger('teacher_id');
            $table->text('reason');
            $table->text('resolution_note')->nullable();
            $table->enum('status', ['open', 'resolved', 'closed'])->default('open');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('session_id', 'complaints_session_id_foreign');
            $table->index('student_id', 'complaints_student_id_foreign');
            $table->index('teacher_id', 'complaints_teacher_id_foreign');
            $table->foreign('session_id', 'complaints_session_id_foreign')->references('id')->on('sessions')->onDelete('cascade');
            $table->foreign('student_id', 'complaints_student_id_foreign')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('teacher_id', 'complaints_teacher_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('complaints');
    }
};
