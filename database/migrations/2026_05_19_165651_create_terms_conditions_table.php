<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Kreait\Firebase\Database\Reference;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('terms_conditions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('role_id')->nullable();
            $table->string('title')->nullable(); // Legacy field for backward compatibility
            $table->string('title_en')->nullable(); // English title
            $table->string('title_ar')->nullable(); // Arabic title
            $table->enum('type', ['terms', 'conditions', 'privacy_policy'])->default('privacy_policy');
            $table->longText('content')->nullable(); // Legacy field for backward compatibility
            $table->longText('content_en')->nullable(); // English content
            $table->longText('content_ar')->nullable(); // Arabic content
            $table->integer('version')->default(1); // Version tracking
            $table->boolean('status')->default(true); // Active/Inactive
            $table->timestamps();
            $table->softDeletes(); // For soft deletes
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('terms_conditions');
    }
};
