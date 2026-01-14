<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * ============================================================================
 * SavedCard Model - PCI-DSS Compliant
 * ============================================================================
 * 
 * This model stores ONLY non-sensitive payment method information for
 * HyperPay tokenized payments.
 * 
 * IMPORTANT - NEVER STORE:
 * ❌ Card number (PAN)
 * ❌ CVV/CVC
 * ❌ Cardholder name
 * ❌ Full expiry date
 * 
 * ONLY STORE:
 * ✅ registrationId (HyperPay token - identifies the card)
 * ✅ card_brand (VISA, MASTERCARD, MADA)
 * ✅ last4 (last 4 digits for display)
 * ✅ expiry_month & expiry_year (for UX - "expires 12/2025")
 * 
 * When making payments with saved card:
 * 1. Pass registrationId to HyperPay
 * 2. Customer still verifies 3D Secure in Copy & Pay widget
 * 3. No card details ever transmitted to backend
 * 
 * ============================================================================
 */
class SavedCard extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'saved_cards';

    protected $fillable = [
        'user_id',                // User who saved this card
        'registration_id',        // HyperPay token (required for all payments)
        'card_brand',             // VISA, MASTERCARD, MADA
        'last4',                  // Last 4 digits for display (e.g., "4242")
        'expiry_month',           // For UX: "03"
        'expiry_year',            // For UX: "2025"
        'is_default',             // Use this card by default
        'nickname',               // User-friendly name (e.g., "My Visa")
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // ========================================================================
    // RELATIONSHIPS
    // ========================================================================

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // ========================================================================
    // ACCESSORS / MUTATORS
    // ========================================================================

    /**
     * Get formatted expiry date for display (e.g., "03/2025")
     */
    public function getExpiryDisplayAttribute(): string
    {
        return $this->expiry_month . '/' . $this->expiry_year;
    }

    /**
     * Get card display label (e.g., "Visa ending in 4242")
     */
    public function getCardDisplayAttribute(): string
    {
        return ucfirst(strtolower($this->card_brand)) . ' ending in ' . $this->last4;
    }

    // ========================================================================
    // SCOPES
    // ========================================================================

    /**
     * Get only non-deleted saved cards
     */
    public function scopeActive($query)
    {
        return $query->whereNull('deleted_at');
    }

    /**
     * Get saved cards for a specific user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId)->active();
    }

    /**
     * Get default saved card for a user
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true)->first();
    }

    // ========================================================================
    // CUSTOM METHODS
    // ========================================================================

    /**
     * Check if this card has expired
     * @return bool
     */
    public function isExpired(): bool
    {
        $expiryDate = \DateTime::createFromFormat(
            'm/Y',
            $this->expiry_month . '/' . $this->expiry_year
        );

        return $expiryDate < new \DateTime('now');
    }

    /**
     * Get remaining months until expiration
     * @return int Number of months remaining
     */
    public function getMonthsUntilExpiry(): int
    {
        if ($this->isExpired()) {
            return 0;
        }

        $now = new \DateTime('now');
        $expiry = \DateTime::createFromFormat(
            'm/Y',
            $this->expiry_month . '/' . $this->expiry_year
        );

        $months = ($expiry->format('Y') - $now->format('Y')) * 12;
        $months += $expiry->format('m') - $now->format('m');

        return $months;
    }

    /**
     * Set as default card (unset others for this user)
     */
    public function setAsDefault(): bool
    {
        // Remove default from all other cards
        SavedCard::where('user_id', $this->user_id)
                  ->where('id', '!=', $this->id)
                  ->update(['is_default' => false]);

        // Set this as default
        return $this->update(['is_default' => true]);
    }
}
