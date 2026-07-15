<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (! Schema::hasTable('terms_conditions')) {
            // Nothing to do if table doesn't exist
            return;
        }

        Schema::table('terms_conditions', function (Blueprint $table) {
            if (! Schema::hasColumn('terms_conditions', 'role_id')) {
                $table->unsignedBigInteger('role_id')->nullable();
            }
            if (! Schema::hasColumn('terms_conditions', 'version')) {
                $table->integer('version')->default(1);
            }
        });

        // Try to add FK constraint if roles table exists and constraint not already present
        try {
            if (Schema::hasTable('roles') && Schema::hasColumn('terms_conditions', 'role_id')) {
                $sm = Schema::getConnection()->getDoctrineSchemaManager();
                $indexes = $sm->listTableForeignKeys('terms_conditions');
                $hasFk = false;
                foreach ($indexes as $fk) {
                    if (in_array('role_id', $fk->getLocalColumns())) {
                        $hasFk = true;
                        break;
                    }
                }
                if (! $hasFk) {
                    Schema::table('terms_conditions', function (Blueprint $table) {
                        $table->foreign('role_id')->references('id')->on('roles')->onDelete('set null');
                    });
                }
            }
        } catch (\Throwable $e) {
            // Do not fail migration if DB platform does not support Doctrine inspection
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (! Schema::hasTable('terms_conditions')) {
            return;
        }

        Schema::table('terms_conditions', function (Blueprint $table) {
            if (Schema::hasColumn('terms_conditions', 'version')) {
                $table->dropColumn('version');
            }
            if (Schema::hasColumn('terms_conditions', 'role_id')) {
                // Drop foreign key if exists, then column
                try {
                    $sm = Schema::getConnection()->getDoctrineSchemaManager();
                    $fks = $sm->listTableForeignKeys('terms_conditions');
                    foreach ($fks as $fk) {
                        if (in_array('role_id', $fk->getLocalColumns())) {
                            $table->dropForeign($fk->getName());
                        }
                    }
                } catch (\Throwable $e) {
                    // ignore
                }
                $table->dropColumn('role_id');
            }
        });
    }
};
