<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('orders')) {
            return;
        }

        Schema::create('orders', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('subject_id');
            $table->unsignedBigInteger('class_id')->nullable();
            $table->integer('education_level_id')->nullable();
            $table->enum('type', ['single', 'group'])->nullable()->default('single');
            $table->string('order_type', 100)->nullable();
            $table->integer('min_price')->nullable();
            $table->integer('max_price')->nullable();
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('user_id', 'orders_user_id_foreign');
            $table->index('subject_id', 'orders_subject_id_foreign');
            $table->index('class_id', 'fk_class_id');
            $table->foreign('class_id', 'fk_class_id')->references('id')->on('classes')->onDelete('cascade');
            $table->foreign('subject_id', 'orders_subject_id_foreign')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('user_id', 'orders_user_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
