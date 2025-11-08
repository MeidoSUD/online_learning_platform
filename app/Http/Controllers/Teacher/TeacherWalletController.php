<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Payout;
use App\Models\PaymentMethod;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\UserPaymentMethod;

class TeacherWalletController extends Controller
{
    /**
     * Display wallet balance and payout history
     */
    public function index()
    {
        $teacher = Auth::user();
        $wallet = Wallet::where('user_id', $teacher->id)->first();
        $walletBalance = $wallet ? $wallet->balance : 0;

        $payouts = Payout::where('teacher_id', $teacher->id)
            ->orderBy('created_at', 'desc')
            ->with('paymentMethod')
            ->paginate(10);

        return view('teacher.wallet.index', compact('walletBalance', 'payouts'));
    }

    /**
     * Show payout request form
     */
    public function create()
    {
        $teacher = Auth::user();
        $wallet = Wallet::where('user_id', $teacher->id)->first();
        $walletBalance = $wallet ? $wallet->balance : 0;

        // Get teacher's bank accounts instead of payment methods
        $paymentMethods = UserPaymentMethod::where('user_id', $teacher->id)
            ->whereNotNull('account_number')
            ->orderBy('is_default', 'desc')
            ->get();

        return view('teacher.wallet.create', compact('walletBalance', 'paymentMethods'));
    }

    /**
     * Handle payout request submission
     */
    public function store(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'payment_method_id' => 'required|exists:payment_methods,id',
        ]);

        $teacher = Auth::user();
        $wallet = Wallet::where('user_id', $teacher->id)->first();

        if (!$wallet) {
            return redirect()->back()->with('error', app()->getLocale() == 'ar'
                ? 'لم يتم العثور على المحفظة'
                : 'Wallet not found');
        }

        // Check if sufficient balance
        if ($wallet->balance < $request->amount) {
            return redirect()->back()->with('error', app()->getLocale() == 'ar'
                ? 'رصيد المحفظة غير كافٍ'
                : 'Insufficient wallet balance');
        }

        DB::beginTransaction();

        try {
            // Create payout request
            $payout = Payout::create([
                'teacher_id' => $teacher->id,
                'amount' => $request->amount,
                'payment_method_id' => $request->payment_method_id,
                'status' => 'pending',
                'requested_at' => now(),
            ]);

            // Store balance before deduction
            $balanceBefore = $wallet->balance;

            // Deduct amount from wallet
            $wallet->balance -= $request->amount;
            $wallet->save();

            // Record wallet transaction
            WalletTransaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'withdrawal',
                'amount' => $request->amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $wallet->balance,
                'description' => app()->getLocale() == 'ar'
                    ? 'طلب سحب رصيد'
                    : 'Payout request',
                'related_payment_id' => $payout->id,
            ]);

            DB::commit();

            return redirect()->route('teacher.wallet.index')->with('success', app()->getLocale() == 'ar'
                ? 'تم إرسال طلب السحب بنجاح وفي انتظار الموافقة'
                : 'Payout request submitted and waiting for approval');
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()->with('error', app()->getLocale() == 'ar'
                ? 'حدث خطأ أثناء معالجة طلبك'
                : 'An error occurred while processing your request');
        }
    }
    /**
     * Display list of teacher's bank accounts
     */
    public function bankAccounts()
    {
        $teacher = Auth::user();
        $bankAccounts = UserPaymentMethod::where('user_id', $teacher->id)
            ->whereNotNull('account_number')
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return view('teacher.wallet.bank-accounts', compact('bankAccounts'));
    }

    /**
     * Show form to create new bank account
     */
    public function createBankAccount()
    {
        // Saudi Arabia banks list
        $saudiBanks = [
            'Al Rajhi Bank' => app()->getLocale() == 'ar' ? 'مصرف الراجحي' : 'Al Rajhi Bank',
            'National Commercial Bank (NCB)' => app()->getLocale() == 'ar' ? 'البنك الأهلي التجاري' : 'National Commercial Bank (NCB)',
            'Riyad Bank' => app()->getLocale() == 'ar' ? 'بنك الرياض' : 'Riyad Bank',
            'Samba Financial Group' => app()->getLocale() == 'ar' ? 'مجموعة سامبا المالية' : 'Samba Financial Group',
            'Saudi British Bank (SABB)' => app()->getLocale() == 'ar' ? 'البنك السعودي البريطاني' : 'Saudi British Bank (SABB)',
            'Arab National Bank (ANB)' => app()->getLocale() == 'ar' ? 'البنك العربي الوطني' : 'Arab National Bank (ANB)',
            'Bank AlBilad' => app()->getLocale() == 'ar' ? 'بنك البلاد' : 'Bank AlBilad',
            'Saudi Investment Bank (SAIB)' => app()->getLocale() == 'ar' ? 'البنك السعودي للاستثمار' : 'Saudi Investment Bank (SAIB)',
            'Banque Saudi Fransi' => app()->getLocale() == 'ar' ? 'البنك السعودي الفرنسي' : 'Banque Saudi Fransi',
            'Alinma Bank' => app()->getLocale() == 'ar' ? 'بنك الإنماء' : 'Alinma Bank',
            'Bank AlJazira' => app()->getLocale() == 'ar' ? 'بنك الجزيرة' : 'Bank AlJazira',
            'Gulf International Bank' => app()->getLocale() == 'ar' ? 'بنك الخليج الدولي' : 'Gulf International Bank',
        ];

        return view('teacher.wallet.create-bank-account', compact('saudiBanks'));
    }

    /**
     * Store new bank account
     */
    public function storeBankAccount(Request $request)
    {
        $request->validate([
            'bank_name' => 'required|string|max:255',
            'account_holder_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:50',
            'iban' => 'required|string|max:34|regex:/^SA[0-9]{22}$/',
            'swift_code' => 'nullable|string|max:11',
            'is_default' => 'nullable|boolean',
        ], [
            'iban.regex' => app()->getLocale() == 'ar'
                ? 'يجب أن يبدأ الآيبان بـ SA متبوعاً بـ 22 رقماً'
                : 'IBAN must start with SA followed by 22 digits',
        ]);

        $teacher = Auth::user();

        DB::beginTransaction();

        try {
            // If this is set as default, unset other defaults
            if ($request->is_default) {
                UserPaymentMethod::where('user_id', $teacher->id)
                    ->update(['is_default' => false]);
            }

            // Create new bank account
            UserPaymentMethod::create([
                'user_id' => $teacher->id,
                'payment_method_id' => null, // Bank transfer doesn't need payment method ID
                'bank_name' => $request->bank_name,
                'account_holder_name' => $request->account_holder_name,
                'account_number' => $request->account_number,
                'iban' => $request->iban,
                'swift_code' => $request->swift_code,
                'is_default' => $request->is_default ?? false,
            ]);

            DB::commit();

            return redirect()->route('teacher.wallet.bank-accounts')->with(
                'success',
                app()->getLocale() == 'ar'
                    ? 'تم إضافة الحساب البنكي بنجاح'
                    : 'Bank account added successfully'
            );
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()->with(
                'error',
                app()->getLocale() == 'ar'
                    ? 'حدث خطأ أثناء إضافة الحساب البنكي'
                    : 'An error occurred while adding bank account'
            )->withInput();
        }
    }

    /**
     * Show edit form for bank account
     */
    public function editBankAccount($id)
    {
        $teacher = Auth::user();
        $bankAccount = UserPaymentMethod::where('user_id', $teacher->id)
            ->where('id', $id)
            ->firstOrFail();

        // Saudi Arabia banks list
        $saudiBanks = [
            'Al Rajhi Bank' => app()->getLocale() == 'ar' ? 'مصرف الراجحي' : 'Al Rajhi Bank',
            'National Commercial Bank (NCB)' => app()->getLocale() == 'ar' ? 'البنك الأهلي التجاري' : 'National Commercial Bank (NCB)',
            'Riyad Bank' => app()->getLocale() == 'ar' ? 'بنك الرياض' : 'Riyad Bank',
            'Samba Financial Group' => app()->getLocale() == 'ar' ? 'مجموعة سامبا المالية' : 'Samba Financial Group',
            'Saudi British Bank (SABB)' => app()->getLocale() == 'ar' ? 'البنك السعودي البريطاني' : 'Saudi British Bank (SABB)',
            'Arab National Bank (ANB)' => app()->getLocale() == 'ar' ? 'البنك العربي الوطني' : 'Arab National Bank (ANB)',
            'Bank AlBilad' => app()->getLocale() == 'ar' ? 'بنك البلاد' : 'Bank AlBilad',
            'Saudi Investment Bank (SAIB)' => app()->getLocale() == 'ar' ? 'البنك السعودي للاستثمار' : 'Saudi Investment Bank (SAIB)',
            'Banque Saudi Fransi' => app()->getLocale() == 'ar' ? 'البنك السعودي الفرنسي' : 'Banque Saudi Fransi',
            'Alinma Bank' => app()->getLocale() == 'ar' ? 'بنك الإنماء' : 'Alinma Bank',
            'Bank AlJazira' => app()->getLocale() == 'ar' ? 'بنك الجزيرة' : 'Bank AlJazira',
            'Gulf International Bank' => app()->getLocale() == 'ar' ? 'بنك الخليج الدولي' : 'Gulf International Bank',
        ];

        return view('teacher.wallet.edit-bank-account', compact('bankAccount', 'saudiBanks'));
    }

    /**
     * Update bank account
     */
    public function updateBankAccount(Request $request, $id)
    {
        $teacher = Auth::user();
        $bankAccount = UserPaymentMethod::where('user_id', $teacher->id)
            ->where('id', $id)
            ->firstOrFail();

        $request->validate([
            'bank_name' => 'required|string|max:255',
            'account_holder_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:50',
            'iban' => 'required|string|max:34|regex:/^SA[0-9]{22}$/',
            'swift_code' => 'nullable|string|max:11',
            'is_default' => 'nullable|boolean',
        ], [
            'iban.regex' => app()->getLocale() == 'ar'
                ? 'يجب أن يبدأ الآيبان بـ SA متبوعاً بـ 22 رقماً'
                : 'IBAN must start with SA followed by 22 digits',
        ]);

        DB::beginTransaction();

        try {
            // If this is set as default, unset other defaults
            if ($request->is_default) {
                UserPaymentMethod::where('user_id', $teacher->id)
                    ->where('id', '!=', $id)
                    ->update(['is_default' => false]);
            }

            // Update bank account
            $bankAccount->update([
                'bank_name' => $request->bank_name,
                'account_holder_name' => $request->account_holder_name,
                'account_number' => $request->account_number,
                'iban' => $request->iban,
                'swift_code' => $request->swift_code,
                'is_default' => $request->is_default ?? false,
            ]);

            DB::commit();

            return redirect()->route('teacher.wallet.bank-accounts')->with(
                'success',
                app()->getLocale() == 'ar'
                    ? 'تم تحديث الحساب البنكي بنجاح'
                    : 'Bank account updated successfully'
            );
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()->with(
                'error',
                app()->getLocale() == 'ar'
                    ? 'حدث خطأ أثناء تحديث الحساب البنكي'
                    : 'An error occurred while updating bank account'
            )->withInput();
        }
    }

    /**
     * Delete bank account
     */
    public function destroyBankAccount($id)
    {
        $teacher = Auth::user();
        $bankAccount = UserPaymentMethod::where('user_id', $teacher->id)
            ->where('id', $id)
            ->firstOrFail();

        // Check if this account is used in any pending payouts
        $hasPendingPayouts = Payout::where('teacher_id', $teacher->id)
            ->where('payment_method_id', $id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPendingPayouts) {
            return redirect()->back()->with(
                'error',
                app()->getLocale() == 'ar'
                    ? 'لا يمكن حذف هذا الحساب لأنه مرتبط بطلبات سحب معلقة'
                    : 'Cannot delete this account as it has pending payout requests'
            );
        }

        $bankAccount->delete();

        return redirect()->route('teacher.wallet.bank-accounts')->with(
            'success',
            app()->getLocale() == 'ar'
                ? 'تم حذف الحساب البنكي بنجاح'
                : 'Bank account deleted successfully'
        );
    }

    /**
     * Set bank account as default
     */
    public function setDefaultBankAccount($id)
    {
        $teacher = Auth::user();

        DB::beginTransaction();

        try {
            // Unset all defaults
            UserPaymentMethod::where('user_id', $teacher->id)
                ->update(['is_default' => false]);

            // Set this as default
            $bankAccount = UserPaymentMethod::where('user_id', $teacher->id)
                ->where('id', $id)
                ->firstOrFail();

            $bankAccount->update(['is_default' => true]);

            DB::commit();

            return redirect()->back()->with(
                'success',
                app()->getLocale() == 'ar'
                    ? 'تم تعيين الحساب كافتراضي بنجاح'
                    : 'Bank account set as default successfully'
            );
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->back()->with(
                'error',
                app()->getLocale() == 'ar'
                    ? 'حدث خطأ أثناء تعيين الحساب الافتراضي'
                    : 'An error occurred while setting default account'
            );
        }
    }
}
