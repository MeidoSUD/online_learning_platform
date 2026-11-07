<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('terms_conditions')) {
            return;
        }

        Schema::create('terms_conditions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('role_id')->nullable();
            $table->string('title', 255)->nullable();
            $table->string('title_en', 255)->nullable();
            $table->string('title_ar', 255)->nullable();
            $table->enum('type', ['terms', 'conditions', 'privacy_policy', 'teacher_contract'])->nullable()->default('privacy_policy');
            $table->longText('content')->nullable();
            $table->longText('content_en')->nullable();
            $table->longText('content_ar')->nullable();
            $table->integer('version')->default(1);
            $table->boolean('status')->default(1);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->index('role_id', 'terms_conditions_role_id_foreign');
            $table->foreign('role_id', 'terms_conditions_role_id_foreign')->references('id')->on('roles')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('terms_conditions');
    }
};
