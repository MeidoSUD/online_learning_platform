<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserPaymentMethod;
use App\Models\PaymentMethod;
use Illuminate\Support\Facades\Log;

class UserPaymentMethodWebController extends Controller
{
    // Display payment methods list with data for modals
    public function index(Request $request)
    {
        $user = $request->user();
        $methods = UserPaymentMethod::where('user_id', $user->id)
            ->with('paymentMethod')
            ->paginate(10);
        
        $paymentMethods = PaymentMethod::all();
        $userRole = $user->role->name_key;
        
        return view('payment-methods.index', compact('methods', 'paymentMethods', 'userRole'));
    }

    // Store a new payment method
    public function store(Request $request)
    {
        Log::info('Storing payment method', ['user_id' => $request->user()->id, 'request' => $request->all()]);
        $user = $request->user();

        if ($user->role->name_key === 'teacher') {
            $request->validate([
                'payment_method_id' => 'required|exists:payment_methods,id',
                'bank_name' => 'required|string|max:255',
                'account_number' => 'required|string|max:255',
                'account_holder_name' => 'required|string|max:255',
                'iban' => 'required|string|max:255',
                'is_default' => 'sometimes|boolean'
            ]);
            $data = $request->only([
                'payment_method_id', 'bank_name', 'account_number', 'account_holder_name', 'iban', 'is_default'
            ]);
        } elseif ($user->role->name_key === 'student') {
            $request->validate([
                'payment_method_id' => 'required|exists:payment_methods,id',
                'card_brand' => 'nullable|string|max:255',
                'card_number' => 'required|string|max:19',
                'card_holder_name' => 'required|string|max:255',
                'card_cvc' => 'required|string|max:4',
                'card_expiry_month' => 'required|string|max:2',
                'card_expiry_year' => 'required|string|max:4',
                'is_default' => 'sometimes|boolean'
            ]);
            $data = $request->only([
                'payment_method_id', 'card_brand', 'card_number', 'card_holder_name', 'card_cvc', 'card_expiry_month', 'card_expiry_year', 'is_default'
            ]);
        } else {
            return redirect()->back()->with('error', app()->getLocale() == 'ar' ? 'غير مصرح' : 'Unauthorized');
        }

        // If is_default is true, set all other methods to false
        if (isset($data['is_default']) && $data['is_default']) {
            UserPaymentMethod::where('user_id', $user->id)->update(['is_default' => false]);
        }

        $data['user_id'] = $user->id;
        $method = UserPaymentMethod::create($data);
        
        Log::info('Payment method added', ['user_id' => $user->id, 'method_id' => $method->id]);

        return redirect()->back()->with('success', app()->getLocale() == 'ar' ? 'تمت إضافة طريقة الدفع بنجاح' : 'Payment method added successfully');
    }

    // Update an existing payment method
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $method = UserPaymentMethod::where('id', $id)->where('user_id', $user->id)->firstOrFail();

        if ($user->role->name_key === 'teacher') {
            $request->validate([
                'bank_name' => 'sometimes|string|max:255',
                'account_number' => 'sometimes|string|max:255',
                'account_holder_name' => 'sometimes|string|max:255',
                'iban' => 'sometimes|string|max:255',
                'is_default' => 'sometimes|boolean'
            ]);
            $data = $request->only([
                'bank_name', 'account_number', 'account_holder_name', 'iban', 'is_default'
            ]);
        } elseif ($user->role->name_key === 'student') {
            $request->validate([
                'card_brand' => 'nullable|string|max:255',
                'card_number' => 'sometimes|string|max:19',
                'card_holder_name' => 'sometimes|string|max:255',
                'card_cvc' => 'sometimes|string|max:4',
                'card_expiry_month' => 'sometimes|string|max:2',
                'card_expiry_year' => 'sometimes|string|max:4',
                'is_default' => 'sometimes|boolean'
            ]);
            $data = $request->only([
                'card_brand', 'card_number', 'card_holder_name', 'card_cvc', 'card_expiry_month', 'card_expiry_year', 'is_default'
            ]);
        } else {
            return redirect()->back()->with('error', app()->getLocale() == 'ar' ? 'غير مصرح' : 'Unauthorized');
        }

        // If is_default is true, set all other methods to false
        if (isset($data['is_default']) && $data['is_default']) {
            UserPaymentMethod::where('user_id', $user->id)->where('id', '!=', $id)->update(['is_default' => false]);
        }

        $method->update($data);

        return redirect()->back()->with('success', app()->getLocale() == 'ar' ? 'تم تحديث طريقة الدفع بنجاح' : 'Payment method updated successfully');
    }

    // Delete a payment method
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $method = UserPaymentMethod::where('id', $id)->where('user_id', $user->id)->firstOrFail();
        $method->delete();

        return redirect()->back()->with('success', app()->getLocale() == 'ar' ? 'تم حذف طريقة الدفع بنجاح' : 'Payment method deleted successfully');
    }

    // Set a payment method as default
    public function setDefault(Request $request, $id)
    {
        $user = $request->user();
        $method = UserPaymentMethod::where('id', $id)->where('user_id', $user->id)->firstOrFail();

        // Set all methods to not default
        UserPaymentMethod::where('user_id', $user->id)->update(['is_default' => false]);

        // Set this method as default
        $method->update(['is_default' => true]);

        return redirect()->back()->with('success', app()->getLocale() == 'ar' ? 'تم تعيين طريقة الدفع كافتراضية بنجاح' : 'Payment method set as default successfully');
    }
}