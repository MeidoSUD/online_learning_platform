<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('teacher_marketing_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('plan_id')->constrained('teacher_marketing_plans')->onDelete('cascade');
            $table->decimal('amount_paid', 10, 2)->default(0.00);
            $table->string('currency', 3)->default('SAR');
            $table->string('payment_method')->default('card'); // card, wallet, moyasar_invoice, etc.
            $table->string('payment_reference')->nullable()->index(); // transaction_reference or invoice_id
            $table->json('payment_response')->nullable();
            $table->string('status')->default('pending_payment')->index(); // pending_payment, active, expired, cancelled
            $table->dateTime('start_date')->nullable();
            $table->dateTime('end_date')->nullable()->index();
            $table->string('banner_image')->nullable();
            $table->string('marketing_title')->nullable();
            $table->text('marketing_bio')->nullable();
            $table->unsignedBigInteger('views_count')->default(0);
            $table->unsignedBigInteger('clicks_count')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('teacher_marketing_subscriptions');
    }
};

