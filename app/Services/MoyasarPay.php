<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class MoyasarPay
{
    private $apiKey;
    private $baseUrl = 'https://api.moyasar.com/v1';

    public function __construct()
    {
        $this->apiKey = config('moyasar.api_key');
        
        if (!$this->apiKey) {
            throw new Exception('Moyasar API key is not configured');
        }
    }

    /**
     * Create a new payment
     * 
     * @param array $data Payment data including:
     *   - given_id: UUID for idempotency
     *   - amount: Amount in smallest currency unit
     *   - currency: ISO-4217 currency code
     *   - description: Human readable description
     *   - callback_url: URL for card payment callback
     *   - source: Payment source (creditcard, apple_pay, samsung_pay, stc_pay)
     *   - metadata: Additional metadata (customer_email, customer_id, etc.)
     * 
     * @return array Payment response
     * @throws Exception
     */
    public function createPayment(array $data): array
    {
        try {
            Log::info('Moyasar: Creating payment', [
                'given_id' => $data['given_id'] ?? null,
                'amount' => $data['amount'] ?? null,
                'currency' => $data['currency'] ?? null,
            ]);

            // Validate required fields
            $this->validateCreatePaymentData($data);

            $response = Http::withBasicAuth($this->apiKey, '')
                ->post("{$this->baseUrl}/payments", $data);

            if (!$response->successful()) {
                $error = $response->json();
                Log::error('Moyasar: Payment creation failed', [
                    'status' => $response->status(),
                    'error' => $error,
                    'data' => $data,
                ]);

                throw new Exception(
                    $error['message'] ?? "Payment creation failed: {$response->status()}",
                    $response->status()
                );
            }

            $paymentData = $response->json();
            Log::info('Moyasar: Payment created successfully', [
                'payment_id' => $paymentData['id'] ?? null,
                'status' => $paymentData['status'] ?? null,
            ]);

            return $paymentData;
        } catch (Exception $e) {
            Log::error('Moyasar: Payment creation exception', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            throw $e;
        }
    }

    /**
     * Fetch payment details by ID
     * 
     * @param string $paymentId Payment ID
     * @return array Payment details
     * @throws Exception
     */
    public function fetchPayment(string $paymentId): array
    {
        try {
            Log::info('Moyasar: Fetching payment', ['payment_id' => $paymentId]);

            if (empty($paymentId)) {
                throw new Exception('Payment ID is required');
            }

            $response = Http::withBasicAuth($this->apiKey, '')
                ->get("{$this->baseUrl}/payments/{$paymentId}");

            if (!$response->successful()) {
                $error = $response->json();
                Log::error('Moyasar: Fetch payment failed', [
                    'status' => $response->status(),
                    'payment_id' => $paymentId,
                    'error' => $error,
                ]);

                throw new Exception(
                    $error['message'] ?? "Failed to fetch payment: {$response->status()}",
                    $response->status()
                );
            }

            $paymentData = $response->json();
            Log::info('Moyasar: Payment fetched successfully', [
                'payment_id' => $paymentData['id'] ?? null,
                'status' => $paymentData['status'] ?? null,
            ]);

            return $paymentData;
        } catch (Exception $e) {
            Log::error('Moyasar: Fetch payment exception', [
                'payment_id' => $paymentId,
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            throw $e;
        }
    }

    /**
     * Refund a payment (full or partial)
     * 
     * @param string $paymentId Payment ID to refund
     * @param int|null $amount Amount to refund (in smallest currency unit). If null, refund full amount
     * @return array Refund response
     * @throws Exception
     */
    public function refundPayment(string $paymentId, ?int $amount = null): array
    {
        try {
            Log::info('Moyasar: Processing refund', [
                'payment_id' => $paymentId,
                'amount' => $amount,
            ]);

            if (empty($paymentId)) {
                throw new Exception('Payment ID is required');
            }

            $payload = [];
            if ($amount !== null) {
                $payload['amount'] = $amount;
            }

            $response = Http::withBasicAuth($this->apiKey, '')
                ->post("{$this->baseUrl}/payments/{$paymentId}/refund", $payload);

            if (!$response->successful()) {
                $error = $response->json();
                Log::error('Moyasar: Refund failed', [
                    'status' => $response->status(),
                    'payment_id' => $paymentId,
                    'error' => $error,
                ]);

                throw new Exception(
                    $error['message'] ?? "Refund failed: {$response->status()}",
                    $response->status()
                );
            }

            $refundData = $response->json();
            Log::info('Moyasar: Refund processed successfully', [
                'payment_id' => $paymentData['id'] ?? null,
                'refunded_amount' => $refundData['refunded'] ?? null,
            ]);

            return $refundData;
        } catch (Exception $e) {
            Log::error('Moyasar: Refund exception', [
                'payment_id' => $paymentId,
                'amount' => $amount,
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            throw $e;
        }
    }

    /**
     * List payments with optional filters
     * 
     * @param array $filters Optional filters:
     *   - limit: Number of records (default 10, max 100)
     *   - skip: Number of records to skip for pagination
     *   - created[gte]: Filter by creation date (greater than or equal)
     *   - created[lte]: Filter by creation date (less than or equal)
     *   - status: Filter by status (initiated, paid, failed)
     *   - amount: Filter by amount
     * 
     * @return array Payments list with metadata
     * @throws Exception
     */
    public function listPayments(array $filters = []): array
    {
        try {
            // Set default limit
            if (!isset($filters['limit'])) {
                $filters['limit'] = 10;
            }

            // Validate limit (max 100)
            if ($filters['limit'] > 100) {
                $filters['limit'] = 100;
            }

            Log::info('Moyasar: Listing payments', ['filters' => $filters]);

            $response = Http::withBasicAuth($this->apiKey, '')
                ->get("{$this->baseUrl}/payments", $filters);

            if (!$response->successful()) {
                $error = $response->json();
                Log::error('Moyasar: List payments failed', [
                    'status' => $response->status(),
                    'filters' => $filters,
                    'error' => $error,
                ]);

                throw new Exception(
                    $error['message'] ?? "Failed to list payments: {$response->status()}",
                    $response->status()
                );
            }

            $paymentsData = $response->json();
            Log::info('Moyasar: Payments listed successfully', [
                'count' => count($paymentsData['data'] ?? []),
                'total' => $paymentsData['meta']['total'] ?? null,
            ]);

            return $paymentsData;
        } catch (Exception $e) {
            Log::error('Moyasar: List payments exception', [
                'filters' => $filters,
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            throw $e;
        }
    }

    /**
     * Validate create payment data
     * 
     * @param array $data
     * @throws Exception
     */
    private function validateCreatePaymentData(array $data): void
    {
        $required = ['given_id', 'amount', 'currency', 'source'];

        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new Exception("Field '{$field}' is required for payment creation");
            }
        }

        // Validate amount is positive integer
        if (!is_int($data['amount']) || $data['amount'] <= 0) {
            throw new Exception('Amount must be a positive integer');
        }

        // Validate source has required fields
        if (empty($data['source']['type'])) {
            throw new Exception('Source type is required');
        }

        // If source is creditcard, callback_url is required
        if ($data['source']['type'] === 'creditcard' && empty($data['callback_url'])) {
            throw new Exception('callback_url is required for credit card payments');
        }
    }

    /**
     * Check if a payment is paid
     * 
     * @param string $paymentId
     * @return bool
     */
    public function isPaid(string $paymentId): bool
    {
        try {
            $payment = $this->fetchPayment($paymentId);
            return $payment['status'] === 'paid';
        } catch (Exception $e) {
            Log::error('Moyasar: Error checking payment status', [
                'payment_id' => $paymentId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get payment status
     * 
     * @param string $paymentId
     * @return string|null Status: initiated, paid, or failed
     */
    public function getPaymentStatus(string $paymentId): ?string
    {
        try {
            $payment = $this->fetchPayment($paymentId);
            return $payment['status'] ?? null;
        } catch (Exception $e) {
            Log::error('Moyasar: Error getting payment status', [
                'payment_id' => $paymentId,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
