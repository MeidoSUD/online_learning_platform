<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Services\MoyasarPay;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CardController extends Controller
{
    protected ?MoyasarPay $moyasar;

    public function __construct()
    {
        try {
            $this->moyasar = app(MoyasarPay::class);
        } catch (Exception $e) {
            $this->moyasar = null;
        }
    }

    public function index(Request $request)
    {
        $cards = Card::where('user_id', $request->user()->id)->get();

        return response()->json([
            'status' => 'success',
            'data' => $cards,
        ]);
    }

    public function store(Request $request)
    {
        Log::info('CardController store called', [
            'user_id' => $request->user()->id,
            'payload' => $request->all(),
        ]);

        $validated = $request->validate([
            'type' => 'required|string|in:stc_pay,bank_account',
            'details' => 'required|array',
            'status' => 'nullable|string',
        ]);

        $payoutAccountId = null;

        if ($this->moyasar) {
            try {
                $payoutData = [];
                if ($validated['type'] === 'stc_pay') {
                    $payoutData = [
                        'account_type' => 'wallet',
                        'currency' => 'SAR',
                        'properties' => [
                            'type' => 'stcpay',
                            'phone_number' => $validated['details']['phone_number'] ?? null,
                        ],
                    ];
                } elseif ($validated['type'] === 'bank_account') {
                    $payoutData = [
                        'account_type' => 'bank',
                        'currency' => 'SAR',
                        'properties' => [
                            'iban' => $validated['details']['iban'] ?? null,
                        ],
                    ];
                }

                if (!empty($payoutData)) {
                    $clientId = config('moyasar.payout_credentials.client_id');
                    $clientSecret = config('moyasar.payout_credentials.client_secret');

                    if (!empty($clientId) && !empty($clientSecret)) {
                        $payoutData['credentials'] = [
                            'client_id' => $clientId,
                            'client_secret' => $clientSecret,
                        ];
                    }

                    Log::info('CardController: Sending payout account to Moyasar', ['data' => $payoutData]);
                    $moyasarResponse = $this->moyasar->createPayoutAccount($payoutData);
                    Log::info('CardController: Moyasar payout account response', ['response' => $moyasarResponse]);
                    $payoutAccountId = $moyasarResponse['id'] ?? null;
                } else {
                    Log::info('CardController: Type does not require Moyasar payout account', ['type' => $validated['type']]);
                }
            } catch (Exception $e) {
                Log::warning('CardController: Moyasar payout account error: ' . $e->getMessage());
                return response()->json([
                    'status' => 'error',
                    'message' => 'تعذر إنشاء حساب السحب. يرجى التحقق من صحة البيانات المدخلة.',
                    'error' => $e->getMessage()
                ], 400);
            }
        } else {
            Log::info('CardController: Moyasar service not configured');
        }

        $card = Card::create([
            'user_id' => $request->user()->id,
            'type' => $validated['type'],
            'moyasar_payout_account_id' => $payoutAccountId,
            'details' => $validated['details'],
            'status' => $validated['status'] ?? 'active',
        ]);

        Log::info('CardController: Card saved', ['card_id' => $card->id, 'moyasar_payout_account_id' => $card->moyasar_payout_account_id]);

        return response()->json([
            'status' => 'success',
            'message' => 'تم حفظ وسيلة السحب بنجاح',
            'data' => $card,
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $card = Card::where('id', $id)->where('user_id', $request->user()->id)->first();

        if (!$card) {
            return response()->json([
                'status' => 'error',
                'message' => 'البطاقة غير موجودة',
            ], 404);
        }

        $card->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'تم حذف وسيلة السحب بنجاح',
        ]);
    }

    public function update(Request $request, $id)
    {
        $card = Card::where('id', $id)->where('user_id', $request->user()->id)->first();

        if (!$card) {
            return response()->json([
                'status' => 'error',
                'message' => 'البطاقة غير موجودة',
            ], 404);
        }

        $validated = $request->validate([
            'type' => 'sometimes|string|in:stc_pay,bank_account',
            'details' => 'sometimes|array',
            'status' => 'nullable|string',
        ]);

        if (isset($validated['details'])) {
            $mergedDetails = array_merge($card->details ?? [], $validated['details']);
            $card->details = $mergedDetails;
        }

        if (isset($validated['type'])) {
            $card->type = $validated['type'];
        }

        if (isset($validated['status'])) {
            $card->status = $validated['status'];
        }

        $card->save();

        return response()->json([
            'status' => 'success',
            'message' => 'تم تحديث وسيلة السحب بنجاح',
            'data' => $card,
        ]);
    }

    public function setDefault(Request $request, $id)
    {
        $targetCard = Card::where('id', $id)->where('user_id', $request->user()->id)->first();

        if (!$targetCard) {
            return response()->json([
                'status' => 'error',
                'message' => 'البطاقة غير موجودة',
            ], 404);
        }

        $userCards = Card::where('user_id', $request->user()->id)->get();
        foreach ($userCards as $c) {
            $details = $c->details ?? [];
            $details['is_default'] = ($c->id == $id);
            $c->details = $details;
            $c->save();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'تم تعيين البطاقة كافتراضية بنجاح',
            'data' => $targetCard->fresh(),
        ]);
    }
}
