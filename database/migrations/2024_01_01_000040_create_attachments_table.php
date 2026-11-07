<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('attachments')) {
            return;
        }

        Schema::create('attachments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('file_path', 255)->nullable();
            $table->string('file_type', 255)->nullable();
            $table->string('file_name', 255)->nullable();
            $table->bigInteger('file_size')->nullable();
            $table->string('attached_to_type', 255)->nullable()->default('profile_picture');
            $table->unsignedBigInteger('attached_to_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('created_by', 'attachments_created_by_foreign');
            $table->foreign('created_by', 'attachments_created_by_foreign')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attachments');
    }
};
