<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('marketing_announcements')) {
            return;
        }

        Schema::create('marketing_announcements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('title', 255);
            $table->text('description');
            $table->text('link_url');
            $table->string('button_text', 255)->default('سجل الآن');
            $table->string('close_button_text', 255)->default('إغلاق');
            $table->enum('target_role', ['student', 'teacher', 'both'])->default('both');
            $table->enum('platform', ['app', 'web', 'both'])->default('both');
            $table->string('image_path', 1024)->nullable();
            $table->boolean('is_active')->default(1);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->integer('display_order')->default(0);
            $table->unsignedInteger('clicks_count')->default(0);
            $table->unsignedInteger('views_count')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->index(['is_active', 'target_role', 'platform'], 'marketing_announcements_is_active_target_role_platform_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_announcements');
    }
};
