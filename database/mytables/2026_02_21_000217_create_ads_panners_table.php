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
        Schema::create('ads_panners', function (Blueprint $table) {
            $table->id();
            
            // Image URL / path
            $table->string('image_path')->nullable();
            $table->string('image_name')->nullable();
            
            // Description
            $table->text('description')->nullable();
            
            // Role targeting (null = all/guest, 3 = teacher, 4 = student)
            $table->integer('role_id')->nullable()->comment('null = all/guest, 3 = teacher, 4 = student');
            
            // Platform targeting
            $table->enum('platform', ['web', 'app', 'both'])->default('both');
            
            // Status
            $table->boolean('is_active')->default(true);
            
            // Optional: Link/CTA
            $table->string('link_url')->nullable()->comment('URL to redirect when clicked');
            $table->string('cta_text')->nullable()->comment('Call-to-action button text');
            
            // Optional: Display order
            $table->integer('display_order')->default(0);
            
            // Timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('role_id');
            $table->index('is_active');
            $table->index('platform');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('ads_panners');
    }
};
