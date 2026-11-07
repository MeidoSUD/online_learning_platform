<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('course_groups')) {
            return;
        }

        Schema::create('course_groups', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('course_id');
            $table->string('group_name', 255)->nullable();
            $table->date('start_date');
            $table->json('schedule_pattern');
            $table->integer('total_sessions')->default(1);
            $table->integer('max_students')->default(10);
            $table->integer('min_students')->nullable();
            $table->integer('enrolled_count')->default(0);
            $table->enum('status', ['open', 'confirmed', 'in_progress', 'completed', 'cancelled'])->default('open');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index(['course_id', 'status'], 'course_groups_course_id_status_index');
            $table->index(['start_date', 'status'], 'course_groups_start_date_status_index');
            $table->foreign('course_id', 'course_groups_course_id_foreign')->references('id')->on('courses')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_groups');
    }
};
