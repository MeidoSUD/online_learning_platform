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
        // 1. Drop FK from bookings
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['subscription_id']);
            $table->dropColumn('subscription_id');
        });

        // 2. Drop FKs from subscriptions
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropForeign(['student_id']);
            $table->dropForeign(['teacher_id']);
            $table->dropForeign(['package_id']);
            $table->dropForeign(['payment_id']);
        });

        // 3. Drop FK from sessions_packages
        Schema::table('sessions_packages', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
        });

        // 4. Drop old tables
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('sessions_packages');

        // 5. Remove teacher package fields
        Schema::table('teacher_info', function (Blueprint $table) {
            $table->dropColumn(['offer_packages', 'packages_approved']);
        });

        // 6. Create fresh sessions_packages
        Schema::create('sessions_packages', function (Blueprint $table) {
            $table->id();
            $table->string('name_ar');
            $table->string('name_en');
            $table->text('description_ar')->nullable();
            $table->text('description_en')->nullable();
            $table->integer('sessions_count');
            $table->decimal('price', 10, 2);
            $table->integer('discount_percentage')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 7. Create fresh subscriptions (no teacher_id)
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('package_id')->nullable()->constrained('sessions_packages')->nullOnDelete();
            $table->integer('sessions_remaining');
            $table->integer('sessions_used')->default(0);
            $table->string('status')->default('active');
            $table->timestamp('start_date')->useCurrent();
            $table->timestamp('expiry_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->decimal('total_paid', 10, 2);
            $table->string('currency', 3)->default('SAR');
            $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->timestamps();

            $table->index(['student_id', 'status']);
        });

        // 8. Re-add subscription_id to bookings
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->nullOnDelete()->after('course_group_id');
        });
    }

    public function down()
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['subscription_id']);
            $table->dropColumn('subscription_id');
        });
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('sessions_packages');
    }
};
