<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_groups', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('course_id');
            $table->string('group_name')->nullable();
            $table->date('start_date');
            $table->json('schedule_pattern');
            $table->integer('total_sessions')->default(1);
            $table->integer('max_students')->default(10);
            $table->integer('min_students')->nullable();
            $table->integer('enrolled_count')->default(0);
            $table->enum('status', ['open', 'confirmed', 'in_progress', 'completed', 'cancelled'])->default('open');
            $table->timestamps();

            $table->foreign('course_id')->references('id')->on('courses')->onDelete('cascade');
            $table->index(['course_id', 'status']);
            $table->index(['start_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_groups');
    }
};
