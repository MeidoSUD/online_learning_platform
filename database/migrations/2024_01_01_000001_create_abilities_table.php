<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('abilities')) {
            return;
        }

        Schema::create('abilities', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name_en', 255);
            $table->string('name_ar', 255);
            $table->boolean('status')->default(1);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->unique('name_en', 'abilities_name_en_unique');
            $table->unique('name_ar', 'abilities_name_ar_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('abilities');
    }
};
