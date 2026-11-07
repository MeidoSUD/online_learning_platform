<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('teacher_applications')) {
            return;
        }

        Schema::create('teacher_applications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('teacher_id');
            $table->decimal('proposed_price', 10, 2);
            $table->text('message')->nullable();
            $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique(['order_id', 'teacher_id'], 'teacher_applications_order_id_teacher_id_unique');
            $table->index('teacher_id', 'teacher_applications_teacher_id_foreign');
            $table->foreign('order_id', 'teacher_applications_order_id_foreign')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('teacher_id', 'teacher_applications_teacher_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_applications');
    }
};
