<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('package_id')->constrained('sessions_packages')->cascadeOnDelete();
            $table->integer('sessions_remaining');
            $table->integer('sessions_used')->default(0);
            $table->string('status')->default('active'); // active, completed, cancelled, expired
            $table->timestamp('start_date')->useCurrent();
            $table->timestamp('expiry_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->decimal('total_paid', 10, 2);
            $table->string('currency', 3)->default('SAR');
            $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->timestamps();

            $table->index(['student_id', 'status']);
            $table->index(['teacher_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('subscriptions');
    }
};
