<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('teacher_subjects')) {
            return;
        }

        Schema::create('teacher_subjects', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedBigInteger('subject_id');
            $table->decimal('hourly_rate', 10, 2)->nullable();
            $table->string('proficiency', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('teacher_id', 'teacher_subjects_teacher_id_foreign');
            $table->index('subject_id', 'teacher_subjects_subject_id_foreign');
            $table->foreign('subject_id', 'teacher_subjects_subject_id_foreign')->references('id')->on('subjects');
            $table->foreign('teacher_id', 'teacher_subjects_teacher_id_foreign')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_subjects');
    }
};
