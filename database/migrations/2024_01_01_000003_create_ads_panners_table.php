<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('ads_panners')) {
            return;
        }

        Schema::create('ads_panners', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('image_path', 255)->nullable();
            $table->string('image_name', 255)->nullable();
            $table->text('description')->nullable();
            $table->integer('role_id')->nullable()->comment('null = all/guest, 3 = teacher, 4 = student');
            $table->enum('platform', ['web', 'app', 'both'])->default('both');
            $table->boolean('is_active')->default(1);
            $table->string('link_url', 255)->nullable()->comment('URL to redirect when clicked');
            $table->string('cta_text', 255)->nullable()->comment('Call-to-action button text');
            $table->integer('display_order')->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->index('role_id', 'ads_panners_role_id_index');
            $table->index('is_active', 'ads_panners_is_active_index');
            $table->index('platform', 'ads_panners_platform_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ads_panners');
    }
};
