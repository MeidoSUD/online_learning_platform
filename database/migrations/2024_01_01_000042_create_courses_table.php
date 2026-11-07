<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('courses')) {
            return;
        }

        Schema::create('courses', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->unsignedBigInteger('service_id')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->unsignedBigInteger('education_level_id')->nullable();
            $table->unsignedBigInteger('category_id')->nullable();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('course_type', 20);
            $table->string('course_format', 255)->default('individual');
            $table->decimal('price', 10, 2)->nullable();
            $table->integer('available_seats')->nullable();
            $table->integer('duration_hours')->nullable();
            $table->integer('max_students')->nullable();
            $table->integer('min_students')->nullable();
            $table->integer('duration_hour_left')->nullable();
            $table->string('status', 20)->default('draft');
            $table->boolean('is_featured')->default(0);
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->nullable()->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->unsignedBigInteger('cover_image_id')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('teacher_id', 'courses_teacher_id_foreign');
            $table->index('category_id', 'courses_category_id_foreign');
            $table->index('cover_image_id', 'courses_cover_image_id_foreign');
            $table->index('subject_id', 'foreign_subject_id');
            $table->index('service_id', 'fk_service_id');
            $table->index('education_level_id', 'courses_education_level_id_foreign');
            $table->foreign('category_id', 'courses_category_id_foreign')->references('id')->on('course_categories');
            $table->foreign('cover_image_id', 'courses_cover_image_id_foreign')->references('id')->on('attachments');
            $table->foreign('education_level_id', 'courses_education_level_id_foreign')->references('id')->on('education_levels')->onDelete('set null');
            $table->foreign('subject_id', 'courses_ibfk_1')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('teacher_id', 'courses_teacher_id_foreign')->references('id')->on('users')->onDelete('set null');
            $table->foreign('service_id', 'fk_service_id')->references('id')->on('services')->onDelete('set null')->onUpdate('cascade');
        });
        DB::statement("ALTER TABLE `courses` MODIFY `available_seats` int(20) NULL DEFAULT NULL");
        DB::statement("ALTER TABLE `courses` MODIFY `duration_hour_left` int(10) NULL DEFAULT NULL");
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
