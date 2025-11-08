@extends('layouts.app')

@section('content')
<div class="container mx-auto px-4 py-8">
    <!-- Page Header -->
    <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">
            {{ app()->getLocale() == 'ar' ? 'تعديل الحساب البنكي' : 'Edit Bank Account' }}
        </h1>
        <a href="{{ route('teacher.wallet.bank-accounts') }}" 
           class="text-blue-600 hover:text-blue-800 mt-2 inline-block">
            ← {{ app()->getLocale() == 'ar' ? 'العودة إلى الحسابات البنكية' : 'Back to Bank Accounts' }}
        </a>
    </div>

    <!-- Error Messages -->
    @if(session('error'))
        <div class="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span class="block sm:inline">{{ session('error') }}</span>
        </div>
    @endif

    @if($errors->any())
        <div class="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <ul class="list-disc list-inside">
                @foreach($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <!-- Form -->
    <div class="bg-white shadow-lg rounded-lg p-8">
        <form action="{{ route('teacher.wallet.bank-accounts.update', $bankAccount->id) }}" method="POST">
            @csrf
            @method('PUT')

            <!-- Bank Name -->
            <div class="mb-6">
                <label for="bank_name" class="block text-gray-700 font-semibold mb-2">
                    {{ app()->getLocale() == 'ar' ? 'اسم البنك' : 'Bank Name' }} <span class="text-red-500">*</span>
                </label>
                <select name="bank_name" 
                        id="bank_name" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 @error('bank_name') border-red-500 @enderror"
                        required>
                    <option value="">
                        {{ app()->getLocale() == 'ar' ? 'اختر البنك' : 'Select Bank' }}
                    </option>
                    @foreach($saudiBanks as $key => $value)
                        <option value="{{ $key }}" {{ old('bank_name', $bankAccount->bank_name) == $key ? 'selected' : '' }}>
                            {{ $value }}
                        </option>
                    @endforeach
                </select>
                @error('bank_name')
                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                @enderror
            </div>

            <!-- Account Holder Name -->
            <div class="mb-6">
                <label for="account_holder_name" class="block text-gray-700 font-semibold mb-2">
                    {{ app()->getLocale() == 'ar' ? 'اسم صاحب الحساب' : 'Account Holder Name' }} <span class="text-red-500">*</span>
                </label>
                <input type="text" 
                       name="account_holder_name" 
                       id="account_holder_name" 
                       value="{{ old('account_holder_name', $bankAccount->account_holder_name) }}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 @error('account_holder_name') border-red-500 @enderror"
                       placeholder="{{ app()->getLocale() == 'ar' ? 'أدخل الاسم كما هو في البطاقة البنكية' : 'Enter name as on bank card' }}"
                       required>
                @error('account_holder_name')
                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                @enderror
            </div>

            <!-- Account Number -->
            <div class="mb-6">
                <label for="account_number" class="block text-gray-700 font-semibold mb-2">
                    {{ app()->getLocale() == 'ar' ? 'رقم الحساب' : 'Account Number' }} <span class="text-red-500">*</span>
                </label>
                <input type="text" 
                       name="account_number" 
                       id="account_number" 
                       value="{{ old('account_number', $bankAccount->account_number) }}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 @error('account_number') border-red-500 @enderror"
                       placeholder="{{ app()->getLocale() == 'ar' ? 'أدخل رقم الحساب' : 'Enter account number' }}"
                       required>
                @error('account_number')
                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                @enderror
            </div>

            <!-- IBAN -->
            <div class="mb-6">
                <label for="iban" class="block text-gray-700 font-semibold mb-2">
                    {{ app()->getLocale() == 'ar' ? 'رقم الآيبان (IBAN)' : 'IBAN Number' }} <span class="text-red-500">*</span>
                </label>
                <input type="text" 
                       name="iban" 
                       id="iban" 
                       value="{{ old('iban', $bankAccount->iban) }}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 @error('iban') border-red-500 @enderror"
                       placeholder="SA0000000000000000000000"
                       maxlength="24"
                       pattern="SA[0-9]{22}"
                       required>
                <p class="text-sm text-gray-500 mt-1">
                    {{ app()->getLocale() == 'ar' ? 'مثال: SA0000000000000000000000' : 'Example: SA0000000000000000000000' }}
                </p>
                @error('iban')
                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                @enderror
            </div>

            <!-- SWIFT Code -->
            <div class="mb-6">
                <label for="swift_code" class="block text-gray-700 font-semibold mb-2">
                    {{ app()->getLocale() == 'ar' ? 'رمز سويفت (SWIFT Code)' : 'SWIFT Code' }} 
                    <span class="text-gray-400 text-sm">({{ app()->getLocale() == 'ar' ? 'اختياري' : 'Optional' }})</span>
                </label>
                <input type="text" 
                       name="swift_code" 
                       id="swift_code" 
                       value="{{ old('swift_code', $bankAccount->swift_code) }}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 @error('swift_code') border-red-500 @enderror"
                       placeholder="{{ app()->getLocale() == 'ar' ? 'أدخل رمز السويفت' : 'Enter SWIFT code' }}"
                       maxlength="11">
                @error('swift_code')
                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                @enderror
            </div>

            <!-- Is Default Checkbox -->
            <div class="mb-6">
                <label class="flex items-center cursor-pointer">
                    <input type="checkbox" 
                           name="is_default" 
                           value="1"
                           {{ old('is_default', $bankAccount->is_default) ? 'checked' : '' }}
                           class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                    <span class="ml-3 text-gray-700 font-semibold">
                        {{ app()->getLocale() == 'ar' ? 'تعيين كحساب افتراضي' : 'Set as default account' }}
                    </span>
                </label>
                <p class="text-sm text-gray-500 mt-1 ml-8">
                    {{ app()->getLocale() == 'ar' 
                        ? 'سيتم استخدام هذا الحساب افتراضياً لطلبات السحب' 
                        : 'This account will be used by default for payout requests' }}
                </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-4">
                <button type="submit" 
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200">
                    {{ app()->getLocale() == 'ar' ? 'تحديث الحساب' : 'Update Account' }}
                </button>
                <a href="{{ route('teacher.wallet.bank-accounts') }}" 
                   class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-200 text-center">
                    {{ app()->getLocale() == 'ar' ? 'إلغاء' : 'Cancel' }}
                </a>
            </div>
        </form>
    </div>

    <!-- Helper Info -->
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
        <h3 class="font-semibold text-gray-800 mb-3 flex items-center">
            <svg class="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            {{ app()->getLocale() == 'ar' ? 'نصائح مهمة:' : 'Important Tips:' }}
        </h3>
        <ul class="list-disc list-inside text-gray-700 space-y-2">
            <li>
                {{ app()->getLocale() == 'ar' 
                    ? 'تأكد من صحة جميع المعلومات قبل التحديث' 
                    : 'Make sure all information is correct before updating' }}
            </li>
            <li>
                {{ app()->getLocale() == 'ar' 
                    ? 'أي تغيير في معلومات الحساب قد يؤثر على طلبات السحب المستقبلية' 
                    : 'Any changes to account information may affect future payout requests' }}
            </li>
        </ul>
    </div>
</div>
@endsection
