<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('teacher_institutes', function (Blueprint $table) {
            $table->id();
            
            // Foreign key to users table
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');
            
            // Institute information
            $table->string('institute_name');
            $table->string('commercial_register')->nullable()->comment('Commercial registration number');
            $table->string('license_number')->nullable()->comment('Business license number');
            
            // Media files
            $table->string('cover_image')->nullable()->comment('Institute cover image path');
            $table->string('intro_video')->nullable()->comment('Institute intro video path');
            
            // Description and website
            $table->text('description')->nullable()->comment('Institute description');
            $table->string('website')->nullable()->comment('Institute website URL');
            
            // Commission/Payment info
            $table->decimal('commission_percentage', 5, 2)->default(0.00)->comment('Commission percentage for this institute');
            
            // Status tracking
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->comment('Registration approval status');
            $table->text('rejection_reason')->nullable()->comment('Reason for rejection if status is rejected');
            
            $table->timestamps();
            
            // Index for common queries
            $table->index('user_id');
            $table->index('status');
        });
    }

    /**
     * Rollback the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_institutes');
    }
};
