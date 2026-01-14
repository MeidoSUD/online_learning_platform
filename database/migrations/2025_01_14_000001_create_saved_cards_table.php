<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ============================================================================
 * Create SavedCards Table - PCI-DSS Compliant
 * ============================================================================
 * 
 * This table stores ONLY non-sensitive payment method information.
 * 
 * SECURITY NOTES:
 * ✅ No card numbers stored
 * ✅ No CVV stored
 * ✅ registrationId is encrypted by Laravel's encryption key
 * ✅ Soft deletes allow for recovery if needed
 * ✅ Only non-sensitive display data stored
 * 
 * ============================================================================
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_cards', function (Blueprint $table) {
            $table->id();
            
            // Foreign key to users table
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');
            
            // HyperPay registration token - this is the ONLY sensitive field
            // and it's the unique identifier for payments with this saved card
            $table->string('registration_id')->unique();
            
            // Non-sensitive display information
            $table->string('card_brand'); // VISA, MASTERCARD, MADA
            $table->string('last4', 4);   // Last 4 digits, e.g. "4242"
            $table->string('expiry_month', 2); // "03"
            $table->string('expiry_year', 4);  // "2025"
            
            // Metadata
            $table->string('nickname')->nullable(); // e.g. "My Visa" or "Work Card"
            $table->boolean('is_default')->default(false);
            
            // Timestamps
            $table->timestamps();
            $table->softDeletes(); // Allow soft deletes for audit trail
            
            // Indexes for performance
            $table->index('user_id');
            $table->index('is_default');
            $table->index(['user_id', 'is_default']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_cards');
    }
};
