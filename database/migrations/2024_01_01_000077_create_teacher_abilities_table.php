<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('teacher_abilities')) {
            return;
        }

        Schema::create('teacher_abilities', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('teacher_id');
            $table->unsignedBigInteger('ability_id');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->unique(['teacher_id', 'ability_id'], 'teacher_abilities_teacher_id_ability_id_unique');
            $table->index('ability_id', 'teacher_abilities_ability_id_foreign');
            $table->foreign('ability_id', 'teacher_abilities_ability_id_foreign')->references('id')->on('abilities')->onDelete('cascade');
            $table->foreign('teacher_id', 'teacher_abilities_teacher_id_foreign')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_abilities');
    }
};
