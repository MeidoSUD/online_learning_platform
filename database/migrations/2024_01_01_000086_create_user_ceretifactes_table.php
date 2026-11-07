<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user_ceretifactes')) {
            return;
        }

        Schema::create('user_ceretifactes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->string('certificate_name', 255);
            $table->string('institution', 255)->nullable();
            $table->date('date_obtained')->nullable();
            $table->string('certificate_file', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->index('user_id', 'user_ceretifactes_user_id_foreign');
            $table->foreign('user_id', 'user_ceretifactes_user_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_ceretifactes');
    }
};
