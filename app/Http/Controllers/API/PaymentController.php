<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\HyperpayService;
use App\Models\Payment;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    protected $hyperpay;

    public function __construct(HyperpayService $hyperpay)
    {
        $this->hyperpay = $hyperpay;
    }

    /**
     * POST /api/payments/direct
     * Receive card info & create payment through HyperPay
     */
    /**
     * @OA\Post(
     *     path="/api/payments/direct",
     *     summary="Create a direct payment via HyperPay",
     *     tags={"Payment"},
     *     @OA\RequestBody(@OA\JsonContent(type="object")),
     *     @OA\Response(response=200, description="HyperPay response")
     * )
     *
     * POST /api/payments/direct
     * Receive card info & create payment through HyperPay
     */
    public function directPayment(Request $request)
    {
        $request->validate([
            'student_id' => 'required|integer',
            'teacher_id' => 'nullable|integer',
            'amount' => 'required|numeric|min:1',
            'shopperResultUrl' => 'required|url',
            'currency' => 'required|string|size:3',
            'payment_brand' => 'required|string', // e.g. VISA, MADA, MASTER
            'entity_id' => 'required|string',
            'card.number' => 'required|string',
            'card.holder' => 'required|string',
            'card.expiryMonth' => 'required|string',
            'card.expiryYear' => 'required|string',
            'card.cvv' => 'required|string',
            'customer.email' => 'required|email',
            'billing.street1' => 'required|string',
            'billing.city' => 'required|string',
            'billing.state' => 'nullable|string',
            'billing.country' => 'required|string|size:2',
            'billing.postcode' => 'nullable|string',
        ]);

        $transactionId = Str::random(16);

        $payload = [
            'entityId' => $request->entity_id,
            'amount' => number_format($request->amount, 2, '.', ''), // e.g. 100.00
            'currency' => strtoupper($request->currency),
            'paymentType' => 'DB',
            "shopperResultUrl" => "https://ewan-geniuses.com/api/payment/result",
            'paymentBrand' => $request->payment_brand,
            'merchantTransactionId' => $transactionId,
            'customer.email' => $request->input('customer.email'),
            'customer.givenName' => $request->input('customer.givenName', 'Student'),
            'customer.surname' => $request->input('customer.surname', 'User'),
            'billing.street1' => $request->input('billing.street1'),
            'billing.city' => $request->input('billing.city'),
            'billing.state' => $request->input('billing.state', ''),
            'billing.country' => $request->input('billing.country'),
            'billing.postcode' => $request->input('billing.postcode', ''),
            'customParameters[3DS2_enrolled]' => 'true',
            'card.number' => $request->input('card.number'),
            'card.holder' => $request->input('card.holder'),
            'card.expiryMonth' => $request->input('card.expiryMonth'),
            'card.expiryYear' => $request->input('card.expiryYear'),
            'card.cvv' => $request->input('card.cvv'),
        ];

        $response = $this->hyperpay->directPayment($payload);

        $data = $response->json();

        // Save payment record
        Payment::create([
            'booking_id' => null,
            'student_id' => $request->student_id,
            'teacher_id' => $request->teacher_id,
            'amount' => $request->amount,
            'currency' => strtoupper($request->currency),
            'payment_method' => $request->payment_brand,
            'status' => $data['result']['code'] ?? 'pending',
            'transaction_reference' => $transactionId,
            'gateway_reference' => $data['id'] ?? null,
            'gateway_response' => json_encode($data),
            'paid_at' => isset($data['result']['code']) && str_starts_with($data['result']['code'], '000.000')
                ? Carbon::now() : null,
        ]);

        return response()->json([
            'success' => true,
            'hyperpay_response' => $data,
        ], $response->status());
    }

    /**
     * GET /api/payments/result
     * Check payment status by resourcePath (after 3D secure redirect)
     */
    /**
     * @OA\Get(
     *     path="/api/payments/result",
     *     summary="Check payment result after 3DS redirect",
     *     tags={"Payment"},
     *     @OA\Parameter(name="resourcePath", in="query", @OA\Schema(type="string")),
     *     @OA\Response(response=302, description="Redirect to success or failed page")
     * )
     */
    public function paymentResult(Request $request)
    {
        $resourcePath = $request->get('resourcePath');
        $id = $request->get('id');

        if (!$resourcePath) {
            return response()->json([
                'success' => false,
                'message' => 'Missing resourcePath'
            ], 400);
        }

        $baseUrl = config('hyperpay.base_url');
        $url = $baseUrl . $resourcePath;

        $queryParams = [];
        if (str_contains($resourcePath, '/v1/payments/')) {
            $entityId = env('HYPERPAY_ENTITY_ID_VISA');
            if ($entityId) {
                $queryParams['entityId'] = $entityId;
            }
        }

        $response = Http::withHeaders([
            'Authorization' => config('hyperpay.authorization'),
            'Accept' => 'application/json',
        ])->get($url, $queryParams);

        $result = $response->json();

        Log::info('Payment result response', [
            'url' => $url,
            'status' => $response->status(),
            'result' => $result
        ]);

        if (!isset($result['result'])) {
            Log::error('Invalid HyperPay response', ['result' => $result]);
            return response()->json([
                'success' => false,
                'message' => 'Invalid response from payment gateway',
                'error' => $result['result']['description'] ?? 'Unknown error'
            ], 400);
        }

        $code = $result['result']['code'];
        $description = $result['result']['description'];

        $payment = null;

        if ($id) {
            $payment = Payment::where('transaction_reference', $id)->first();
        }

        if (!$payment) {
            $merchantTransactionId = $result['merchantTransactionId'] ?? null;
            if ($merchantTransactionId) {
                $payment = Payment::where('transaction_reference', $merchantTransactionId)->first();
            }
        }

        if (!$payment && isset($result['id'])) {
            $payment = Payment::where('gateway_reference', $result['id'])->first();
        }

        if (!$payment) {
            Log::error('Payment not found', [
                'id' => $id,
                'merchantTransactionId' => $result['merchantTransactionId'] ?? null,
                'result_id' => $result['id'] ?? null
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Payment record not found'
            ], 404);
        }

        if (preg_match('/^(000\.000\.|000\.100\.1|000\.[36])/', $code)) {
            $payment->update([
                'status' => 'paid',
                'gateway_response' => json_encode($result),
                'paid_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment successful',
                'payment_id' => $payment->id,
                'booking_id' => $payment->booking_id,
                'status' => 'paid'
            ]);
        } else {
            $payment->update([
                'status' => 'failed',
                'gateway_response' => json_encode($result),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment failed: ' . $description,
                'payment_id' => $payment->id,
                'booking_id' => $payment->booking_id,
                'status' => 'failed',
                'error_code' => $code
            ], 400);
        }
    }
}
