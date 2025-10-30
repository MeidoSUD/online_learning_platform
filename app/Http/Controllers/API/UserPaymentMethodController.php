<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserPaymentMethod;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class UserPaymentMethodController extends Controller
{
    // List all payment methods for the authenticated user
    public function index(Request $request)
    {
        $user = $request->user();
        $methods = UserPaymentMethod::where('user_id', $user->id)->with('paymentMethod')->get();
        return response()->json(['data' => $methods]);
    }

    // Store a new payment method
    public function store(Request $request)
    {
        Log::info('Storing payment method', ['user_id' => $request->user()->id, 'request' => $request->all()]);
        $user = $request->user();

        if ($user->role->name_key === 'teacher') {
            $request->validate([
                'payment_method_id' => 'required|exists:payment_methods,id',
                'bank_name' => 'required|string',
                'account_number' => 'required|string',
                'account_holder_name' => 'required|string',
                'iban' => 'required|string',
                'is_default' => 'sometimes|boolean'
            ]);
            $data = $request->only([
                'payment_method_id', 'bank_name', 'account_number', 'account_holder_name', 'iban', 'is_default'
            ]);
        } elseif ($user->role->name_key === 'student') {
            $request->validate([
                'payment_method_id' => 'required|exists:payment_methods,id',
                'card_brand' => 'required|string',
                'card_number' => 'required|string',
                'card_holder_name' => 'required|string',
                'card_cvc' => 'required|string',
                'card_expiry_month' => 'required|string',
                'card_expiry_year' => 'required|string',
                'is_default' => 'sometimes|boolean'
            ]);
            $data = $request->only([
                'payment_method_id', 'card_brand', 'card_number', 'card_holder_name', 'card_cvc', 'card_expiry_month', 'card_expiry_year', 'is_default'
            ]);
        } else {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $data['user_id'] = $user->id;
        $method = UserPaymentMethod::create($data);
        Log::info('Payment method added', ['user_id' => $user->id, 'method_id' => $method->id]);
        return response()->json(['data' => $method, 'message' => 'Payment method added']);
    }

    // Update an existing payment method
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $method = UserPaymentMethod::where('id', $id)->where('user_id', $user->id)->firstOrFail();

        if ($user->role->name_key === 'teacher') {
            $request->validate([
                'bank_name' => 'sometimes|string',
                'account_number' => 'sometimes|string',
                'account_holder_name' => 'sometimes|string',
                'iban' => 'sometimes|string',
                'is_default' => 'sometimes|boolean'
            ]);
            $data = $request->only([
                'bank_name', 'account_number', 'account_holder_name', 'iban', 'is_default'
            ]);
        } elseif ($user->role->name_key === 'student') {
            $request->validate([
                'card_brand' => 'sometimes|string',
                'card_number' => 'sometimes|string',
                'card_holder_name' => 'sometimes|string',
                'card_cvc' => 'sometimes|string',
                'card_expiry_month' => 'sometimes|string',
                'card_expiry_year' => 'sometimes|string',
                'is_default' => 'sometimes|boolean'
            ]);
            $data = $request->only([
                'card_brand', 'card_number', 'card_holder_name', 'card_cvc', 'card_expiry_month', 'card_expiry_year', 'is_default'
            ]);
        } else {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $method->update($data);

        return response()->json(['data' => $method, 'message' => 'Payment method updated']);
    }

    // Delete a payment method
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $method = UserPaymentMethod::where('id', $id)->where('user_id', $user->id)->firstOrFail();
        $method->delete();

        return response()->json(['message' => 'Payment method deleted']);
    }
}