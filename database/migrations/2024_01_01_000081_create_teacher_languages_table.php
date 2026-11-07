<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('teacher_languages')) {
            return;
        }

        Schema::create('teacher_languages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedBigInteger('language_id');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('teacher_id', 'teacher_languages_teacher_id_foreign');
            $table->index('language_id', 'teacher_languages_language_id_foreign');
            $table->foreign('language_id', 'teacher_languages_language_id_foreign')->references('id')->on('languages')->onDelete('cascade');
            $table->foreign('teacher_id', 'teacher_languages_teacher_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_languages');
    }
};
