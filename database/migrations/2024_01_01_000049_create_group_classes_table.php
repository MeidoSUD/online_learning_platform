<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('group_classes')) {
            return;
        }

        Schema::create('group_classes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedBigInteger('education_level_id');
            $table->unsignedBigInteger('class_id');
            $table->unsignedBigInteger('subject_id');
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->date('start_date')->nullable();
            $table->unsignedInteger('total_sessions')->default(1);
            $table->string('status', 255)->default('active');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('class_id', 'group_classes_class_id_foreign');
            $table->index('subject_id', 'group_classes_subject_id_foreign');
            $table->index('teacher_id', 'group_classes_teacher_id_index');
            $table->index(['education_level_id', 'class_id', 'subject_id'], 'group_classes_education_level_id_class_id_subject_id_index');
            $table->foreign('class_id', 'group_classes_class_id_foreign')->references('id')->on('classes')->onDelete('cascade');
            $table->foreign('education_level_id', 'group_classes_education_level_id_foreign')->references('id')->on('education_levels')->onDelete('cascade');
            $table->foreign('subject_id', 'group_classes_subject_id_foreign')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('teacher_id', 'group_classes_teacher_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_classes');
    }
};
