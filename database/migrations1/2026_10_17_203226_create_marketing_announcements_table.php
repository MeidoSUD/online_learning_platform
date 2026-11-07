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
    public function up()
    {
        Schema::create('marketing_announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->text('link_url');
            $table->string('button_text')->default('سجل الآن');
            $table->string('close_button_text')->default('إغلاق');
            $table->enum('target_role', ['student', 'teacher', 'both'])->default('both');
            $table->enum('platform', ['app', 'web', 'both'])->default('both');
            $table->string('image_path', 1024)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->integer('display_order')->default(0);
            $table->unsignedInteger('clicks_count')->default(0);
            $table->unsignedInteger('views_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'target_role', 'platform']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('marketing_announcements');
    }
};
