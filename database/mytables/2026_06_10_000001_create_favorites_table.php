<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->morphs('favoriteable');
            $table->timestamps();

            $table->unique(['user_id', 'favoriteable_id', 'favoriteable_type'], 'favorites_unique');
        });
    }

    public function down()
    {
        Schema::dropIfExists('favorites');
    }
};
