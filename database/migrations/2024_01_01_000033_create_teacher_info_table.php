<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('teacher_info')) {
            return;
        }

        Schema::create('teacher_info', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('code', 20)->nullable();
            $table->boolean('package_on_off')->default(0);
            $table->unsignedBigInteger('teacher_id');
            $table->text('bio')->nullable();
            $table->boolean('teach_individual')->default(1);
            $table->decimal('individual_hour_price', 10, 2)->nullable();
            $table->boolean('teach_group')->default(1);
            $table->decimal('group_hour_price', 10, 2)->nullable();
            $table->integer('max_group_size')->nullable();
            $table->integer('min_group_size')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique('code', 'teacher_info_code_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_info');
    }
};
