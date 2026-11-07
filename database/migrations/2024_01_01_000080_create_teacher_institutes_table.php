<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('teacher_institutes')) {
            return;
        }

        Schema::create('teacher_institutes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->string('institute_name', 255);
            $table->string('commercial_register', 255)->nullable()->comment('Commercial registration number');
            $table->string('license_number', 255)->nullable()->comment('Business license number');
            $table->string('cover_image', 255)->nullable()->comment('Institute cover image path');
            $table->string('intro_video', 255)->nullable()->comment('Institute intro video path');
            $table->text('description')->nullable()->comment('Institute description');
            $table->string('website', 255)->nullable()->comment('Institute website URL');
            $table->decimal('commission_percentage', 5, 2)->default(0.00)->comment('Commission percentage for this institute');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->comment('Registration approval status');
            $table->text('rejection_reason')->nullable()->comment('Reason for rejection if status is rejected');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('user_id', 'teacher_institutes_user_id_index');
            $table->index('status', 'teacher_institutes_status_index');
            $table->foreign('user_id', 'teacher_institutes_user_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_institutes');
    }
};
