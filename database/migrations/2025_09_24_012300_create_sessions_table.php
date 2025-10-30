<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::create('sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            
            $table->integer('session_number');
            $table->date('session_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('duration'); // minutes
            
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show']);
            $table->string('join_url')->nullable();
            $table->string('meeting_id')->nullable();
            
            $table->datetime('started_at')->nullable();
            $table->datetime('ended_at')->nullable();
            
            $table->text('teacher_notes')->nullable();
            $table->text('homework')->nullable();
            $table->json('materials_shared')->nullable();
            
            $table->integer('student_rating')->nullable(); // 1-5
            $table->integer('teacher_rating')->nullable(); // 1-5
            
            $table->timestamps();
            
            $table->index(['booking_id', 'session_number']);
            $table->index(['session_date', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('sessions');
    }
};
