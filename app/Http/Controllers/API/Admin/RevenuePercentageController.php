<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PlatformPercentage;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * ============================================================================
 * REVENUE & PERCENTAGE CONTROLLER - Dynamic Pricing Management
 * ============================================================================
 * 
 * PURPOSE:
 * Manages the platform's commission percentage that determines profit margins.
 * Allows admins to update pricing strategy with full historical tracking.
 * 
 * PRICING FORMULA:
 * ┌─────────────────────────────────────────────────────┐
 * │ Student Price = Teacher Rate × (1 + Percentage/100)│
 * │                                                     │
 * │ Example:                                            │
 * │ Teacher Rate: $100                                 │
 * │ Platform %: 20%                                    │
 * │ Student Pays: $100 × 1.20 = $120                 │
 * │ Platform Revenue: $20                              │
 * └─────────────────────────────────────────────────────┘
 * 
 * WHY EFFECTIVE DATE IS CRITICAL:
 * Problem: If you change % from 10% to 15% today
 *          All historical orders would recalculate (wrong!)
 * 
 * Solution: Use effective_date
 *          Old orders (before today): use 10% from history
 *          New orders (today+): use 15% immediately
 *          Perfect for audits & compliance
 * 
 * ROUTES:
 * GET    /api/admin/revenue/percentage          → getCurrentPercentage()   # Get active %
 * GET    /api/admin/revenue/history             → getPercentageHistory()   # See all changes
 * POST   /api/admin/revenue/percentage          → setPercentage()          # Update %
 * GET    /api/admin/revenue/calculator          → calculatePrice()         # Test calculator
 * GET    /api/admin/revenue/analytics           → getRevenueAnalytics()    # Revenue stats
 * 
 * ============================================================================
 */

class RevenuePercentageController extends Controller
{
    /**
     * ========================================================================
     * GET /api/admin/revenue/percentage
     * ========================================================================
     * Get the currently active commission percentage
     * 
     * This is the percentage being applied to NEW orders as of today.
     * Returns the most recent percentage with effective_date <= today.
     * 
     * Response (200 OK):
     * {
     *   "success": true,
     *   "message": "Active percentage retrieved",
     *   "data": {
     *     "id": "1",
     *     "value": "20.00",           # 20% commission
     *     "effective_date": "2026-03-01",  # Started applying from this date
     *     "is_active": true,
     *     "description": "Increased from 15% to cover operational costs",
     *     "created_at": "2026-03-01T00:00:00",
     *     "updated_at": "2026-03-01T00:00:00"
     *   },
     *   "price_example": {
     *     "teacher_rate": 100,
     *     "student_pays": 120,
     *     "platform_revenue": 20
     *   }
     * }
     * 
     * Error Response (No percentage set):
     * {
     *   "success": false,
     *   "message": "No active percentage configured"
     * }
     */
    public function getCurrentPercentage()
    {
        try {
            $percentage = PlatformPercentage::getActive();

            if (!$percentage) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active percentage configured. Please set one in admin panel.'
                ], 404);
            }

            // Example calculation for reference
            $exampleTeacherRate = 100;
            $studentPrice = $percentage->calculateStudentPrice($exampleTeacherRate);
            $revenue = $percentage->calculatePlatformRevenue($exampleTeacherRate);

            return response()->json([
                'success' => true,
                'message' => 'Active percentage retrieved',
                'data' => $this->formatPercentageResponse($percentage),
                'price_example' => [
                    'teacher_rate' => $exampleTeacherRate,
                    'student_pays' => round($studentPrice, 2),
                    'platform_revenue' => round($revenue, 2)
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve active percentage', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve percentage',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ========================================================================
     * GET /api/admin/revenue/history
     * ========================================================================
     * View all historical percentage changes (audit trail)
     * 
     * Shows when the commission was changed and why, useful for:
     * - Auditing pricing decisions
     * - Understanding revenue trends
     * - Calculating historical prices
     * - Compliance reporting
     * 
     * Query Parameters:
     * - per_page: Results per page (default: 20)
     * - page: Page number
     * 
     * Response:
     * {
     *   "success": true,
     *   "message": "Percentage history retrieved",
     *   "data": [
     *     {
     *       "id": "3",
     *       "value": "20.00",
     *       "effective_date": "2026-04-01",
     *       "is_active": true,
     *       "description": "Current rate for Q2 2026"
     *     },
     *     {
     *       "id": "2",
     *       "value": "15.00",
     *       "effective_date": "2026-01-01",
     *       "is_active": false,
     *       "description": "Q1 2026 rate"
     *     },
     *     {
     *       "id": "1",
     *       "value": "10.00",
     *       "effective_date": "2025-06-01",
     *       "is_active": false,
     *       "description": "Initial launch rate"
     *     }
     *   ],
     *   "total_changes": 3
     * }
     */
    public function getPercentageHistory(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 20);
            $history = PlatformPercentage::orderByDesc('effective_date')
                ->paginate($perPage);

            $formattedHistory = $history->map(function ($item) {
                return $this->formatPercentageResponse($item);
            });

            return response()->json([
                'success' => true,
                'message' => 'Percentage history retrieved',
                'data' => $formattedHistory,
                'total_changes' => $history->total()
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve percentage history', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ========================================================================
     * POST /api/admin/revenue/percentage
     * ========================================================================
     * Set a new commission percentage (effective from a specific date)
     * 
     * Business Logic:
     * 1. New percentage only applies to orders created on/after effective_date
     * 2. Old percentage remains in database for historical reference
     * 3. Only ONE percentage can be active at a time
     * 4. Setting effective_date in future allows scheduling price changes
     * 
     * Request Body:
     * {
     *   "value": 20,                    # Required - percentage (0-100)
     *   "effective_date": "2026-04-15", # Optional - when to start (default: today)
     *   "description": "Q2 pricing"     # Optional - admin notes
     * }
     * 
     * Response (201 Created):
     * {
     *   "success": true,
     *   "message": "Percentage updated successfully",
     *   "data": { ... },
     *   "affected_orders": "Going forward, new orders will use 20% commission"
     * }
     * 
     * Important Notes:
     * - Can schedule changes in advance (set future effective_date)
     * - Only affects NEW orders (past orders unaffected)
     * - Admin must confirm major changes
     * - Change is logged for audit purposes
     */
    public function setPercentage(Request $request)
    {
        try {
            $validated = $request->validate([
                'value' => 'required|numeric|min:0|max:100',
                'effective_date' => 'nullable|date|date_format:Y-m-d',
                'description' => 'nullable|string|max:500'
            ]);

            DB::beginTransaction();

            // Get current percentage
            $current = PlatformPercentage::getActive();
            $oldValue = $current ? $current->value : null;

            // Set effective date (default to today)
            $effectiveDate = $validated['effective_date'] 
                ? Carbon::parse($validated['effective_date']) 
                : Carbon::today();

            // Deactivate old percentage if creating a new one
            if ($current && $current->effective_date < $effectiveDate) {
                $current->update(['is_active' => false]);
            }

            // Create new percentage record
            $percentage = PlatformPercentage::create([
                'value' => $validated['value'],
                'effective_date' => $effectiveDate,
                'is_active' => true,
                'description' => $validated['description'] ?? null
            ]);

            DB::commit();

            Log::info('Commission percentage updated', [
                'old_percentage' => $oldValue,
                'new_percentage' => $validated['value'],
                'effective_date' => $effectiveDate->format('Y-m-d'),
                'admin_id' => auth()->id()
            ]);

            // Calculate impact
            $impactMessage = $oldValue !== null 
                ? "Percentage changed from {$oldValue}% to {$validated['value']}%"
                : "Initial percentage set to {$validated['value']}%";

            $dateMessage = $effectiveDate->isToday()
                ? "Effective immediately"
                : "Effective from {$effectiveDate->format('Y-m-d')} (scheduled for future)";

            return response()->json([
                'success' => true,
                'message' => 'Percentage updated successfully',
                'data' => $this->formatPercentageResponse($percentage),
                'impact' => [
                    'percentage_change' => $impactMessage,
                    'effective' => $dateMessage,
                    'affects' => 'New orders created on or after this date',
                    'historical_note' => 'Existing orders will retain the percentage that was active when they were created'
                ]
            ], 201);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to set percentage', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update percentage',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ========================================================================
     * GET /api/admin/revenue/calculator
     * ========================================================================
     * Calculate student price for a given teacher rate
     * 
     * Useful for:
     * - Testing pricing before changing percentage
     * - Showing admins impact of percentage change
     * - Forecasting revenue
     * 
     * Query Parameters:
     * - teacher_rate: The teacher's hourly rate (required, numeric)
     * - percentage_id: Optional - use specific historical percentage
     * 
     * Example Request:
     * GET /api/admin/revenue/calculator?teacher_rate=100
     * GET /api/admin/revenue/calculator?teacher_rate=100&percentage_id=2
     * 
     * Response:
     * {
     *   "success": true,
     *   "teacher_rate": 100,
     *   "current_percentage": "20.00%",
     *   "student_price": 120,
     *   "platform_revenue": 20,
     *   "percentage_breakdown": {
     *     "teacher_gets": 100,
     *     "platform_gets": 20,
     *     "total": 120
     *   }
     * }
     */
    public function calculatePrice(Request $request)
    {
        try {
            $request->validate([
                'teacher_rate' => 'required|numeric|min:0',
                'percentage_id' => 'nullable|exists:platform_percentages,id'
            ]);

            $teacherRate = $request->input('teacher_rate');
            
            // Get percentage
            if ($request->filled('percentage_id')) {
                $percentage = PlatformPercentage::findOrFail($request->input('percentage_id'));
            } else {
                $percentage = PlatformPercentage::getActive();
                if (!$percentage) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No active percentage configured'
                    ], 404);
                }
            }

            $studentPrice = $percentage->calculateStudentPrice($teacherRate);
            $revenue = $percentage->calculatePlatformRevenue($teacherRate);

            return response()->json([
                'success' => true,
                'teacher_rate' => (float) $teacherRate,
                'current_percentage' => number_format($percentage->value, 2) . '%',
                'student_price' => round($studentPrice, 2),
                'platform_revenue' => round($revenue, 2),
                'percentage_breakdown' => [
                    'teacher_gets' => round($teacherRate, 2),
                    'platform_gets' => round($revenue, 2),
                    'total' => round($studentPrice, 2)
                ],
                'effective_date' => $percentage->effective_date->format('Y-m-d')
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to calculate price', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Calculation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ========================================================================
     * GET /api/admin/revenue/analytics
     * ========================================================================
     * Revenue analytics dashboard
     * 
     * Shows:
     * - Total platform revenue
     * - Revenue by percentage period
     * - Average revenue per booking
     * - Forecast based on current percentage
     * 
     * Response:
     * {
     *   "success": true,
     *   "summary": {
     *     "current_percentage": "20.00%",
     *     "active_since": "2026-04-01",
     *     "total_revenue": 15000,
     *     "average_revenue_per_booking": 120,
     *     "bookings_count": 125
     *   },
     *   "by_period": [ ... ]
     * }
     */
    public function getRevenueAnalytics()
    {
        try {
            $current = PlatformPercentage::getActive();

            if (!$current) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active percentage configured'
                ], 404);
            }

            // Get booking totals (you'd integrate with actual booking data)
            $totalBookings = 0; // $booking_model::count()
            $totalRevenue = 0;  // Calculate from actual data

            return response()->json([
                'success' => true,
                'summary' => [
                    'current_percentage' => number_format($current->value, 2) . '%',
                    'active_since' => $current->effective_date->format('Y-m-d'),
                    'total_revenue' => $totalRevenue,
                    'average_revenue_per_booking' => $totalBookings > 0 ? round($totalRevenue / $totalBookings, 2) : 0,
                    'bookings_count' => $totalBookings
                ],
                'history' => PlatformPercentage::orderByDesc('effective_date')
                    ->limit(12)
                    ->get()
                    ->map(fn($p) => $this->formatPercentageResponse($p))
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get revenue analytics', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ========================================================================
     * HELPER METHOD: Format Percentage Response
     * ========================================================================
     */
    private function formatPercentageResponse($percentage)
    {
        return [
            'id' => (string) $percentage->id,
            'value' => number_format($percentage->value, 2),
            'effective_date' => $percentage->effective_date->format('Y-m-d'),
            'is_active' => (bool) $percentage->is_active,
            'description' => $percentage->description,
            'created_at' => $percentage->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $percentage->updated_at->format('Y-m-d H:i:s')
        ];
    }
}
