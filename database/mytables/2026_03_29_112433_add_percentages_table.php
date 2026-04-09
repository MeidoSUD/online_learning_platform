<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddIsFeaturedToCoursesTable extends Migration
{
    public function up()
    {
        Schema::table('percentages', function (Blueprint $table) {
            $table->decimal('revenue_percentage', 10, 2)->default(0.00)->after('status');
            $table->decimal('tax_percentage', 10, 2)->default(0.00)->after('revenue_percentage');
        });
    }

    public function down()
    {
        Schema::table('percentages', function (Blueprint $table) {
            $table->dropColumn('is_featured');
        });
    }
}
