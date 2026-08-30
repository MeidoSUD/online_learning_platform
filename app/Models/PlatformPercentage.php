<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * ============================================================================
 * PLATFORM PERCENTAGE MODEL
 * ============================================================================
 *
 * PURPOSE:
 * Manages the platform's commission percentage that's added to teacher rates
 * to calculate the price shown to students.
 *
 * BUSINESS LOGIC:
 * Formula: Student Price = Teacher Rate × (1 + Percentage / 100)
 * Example: Teacher rate = $100, Platform % = 20%
 *          Student sees = $100 × (1 + 20/100) = $120
 *          Platform revenue = $20
 *
 * EFFECTIVE DATE FEATURE (Critical):
 * - If you change percentage from 10% to 15% today
 * - Old orders should still show 10% in history (using effective_date)
 * - New orders immediately use 15%
 * - Compliance with financial audit requirements
 *
 * DATABASE SCHEMA:
 * - id: Primary key
 * - type: student_percentage or teacher_percentage
 * - value: Commission percentage (e.g., 20 for 20%)
 * - effective_date: When this percentage starts applying (default: now)
 * - is_active: Boolean flag for easy enable/disable
 * - description: Admin notes (why changed, etc)
 * - created_at: Timestamp
 * - updated_at: Timestamp
 *
 * USAGE:
 * $percentage = PlatformPercentage::where('type', self::TYPE_STUDENT)
 *                                   ->where('is_active', true)
 *                                   ->where('effective_date', '<=', now())
 *                                   ->latest('effective_date')
 *                                   ->first();
 *
 * $studentPrice = $teacherRate * (1 + ($percentage->value / 100));
 *
 * ============================================================================
 */

class PlatformPercentage extends Model
{
    use HasFactory;

    public const TYPE_STUDENT = 'student_percentage';
    public const TYPE_TEACHER = 'teacher_percentage';

    protected $table = 'platform_percentages';

    protected $fillable = [
        'type',
        'value',           // The percentage (e.g., 20 for 20%)
        'effective_date',  // When this percentage becomes active
        'is_active',       // Boolean - is this percentage currently in use
        'description',     // Admin notes about why this percentage was set
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'is_active' => 'boolean',
        'effective_date' => 'datetime',
    ];

    /**
     * Get the active percentage (most recent, currently effective)
     * This is what should be used for calculating new prices
     *
     * Usage:
     * $activePercentage = PlatformPercentage::getActive();
     * if ($activePercentage) {
     *     $studentPrice = $teacherRate * (1 + ($activePercentage->value / 100));
     * }
     */
    public static function getActive(string $type = self::TYPE_STUDENT)
    {
        return self::where('is_active', true)
            ->where('type', $type)
            ->where('effective_date', '<=', now())
            ->latest('effective_date')
            ->first();
    }

    /**
     * Get historical percentage for a specific date
     * Useful for showing what percentage was applied to past orders
     *
     * Usage:
     * $percentageOnDate = PlatformPercentage::getForDate('2026-03-15');
     * // Returns the percentage that was active on March 15, 2026
     */
    public static function getForDate($date, string $type = self::TYPE_STUDENT)
    {
        return self::where('type', $type)
            ->where('effective_date', '<=', $date)
            ->latest('effective_date')
            ->first();
    }

    /** Amount payable to a teacher after the teacher commission is deducted. */
    public function calculateTeacherPayout(float $grossAmount): float
    {
        return $grossAmount * (1 - ((float) $this->value / 100));
    }

    /** Gross wallet amount required to pay a requested net withdrawal. */
    public function calculateTeacherGrossAmount(float $netAmount): float
    {
        $multiplier = 1 - ((float) $this->value / 100);

        if ($multiplier <= 0) {
            throw new \InvalidArgumentException('Teacher commission must be less than 100%.');
        }

        return $netAmount / $multiplier;
    }

    /**
     * Calculate student price based on this percentage
     */
    public function calculateStudentPrice($teacherRate)
    {
        return $teacherRate * (1 + ($this->value / 100));
    }

    /**
     * Calculate platform revenue (profit)
     */
    public function calculatePlatformRevenue($teacherRate)
    {
        $studentPrice = $this->calculateStudentPrice($teacherRate);
        return $studentPrice - $teacherRate;
    }
}
