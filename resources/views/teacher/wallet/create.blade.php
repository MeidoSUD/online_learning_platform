@extends('layouts.app')

@section('content')
    <div class="container mx-auto px-4 py-8">
        <!-- Page Header -->
        <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-800">
                {{ app()->getLocale() == 'ar' ? 'طلب سحب رصيد' : 'Request Payout' }}
            </h1>
            <a href="{{ route('teacher.wallet.index') }}" class="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                ← {{ app()->getLocale() == 'ar' ? 'العودة إلى المحفظة' : 'Back to Wallet' }}
            </a>
        </div>

        <!-- Error Messages -->
        @if (session('error'))
            <div class="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span class="block sm:inline">{{ session('error') }}</span>
            </div>
        @endif

        @if ($errors->any())
            <div class="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <ul class="list-disc list-inside">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Balance Info Card -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-700 mb-3">
                    {{ app()->getLocale() == 'ar' ? 'رصيدك الحالي' : 'Your Current Balance' }}
                </h3>
                <p class="text-3xl font-bold text-blue-600">
                    ${{ number_format($walletBalance, 2) }}
                </p>
                <p class="text-sm text-gray-600 mt-2">
                    {{ app()->getLocale() == 'ar'
                        ? 'تأكد من طلب مبلغ لا يتجاوز رصيدك المتاح'
                        : 'Make sure to request an amount within your available balance' }}
                </p>
            </div>

            <!-- Payout Request Form -->
            <div class="bg-white shadow-lg rounded-lg p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">
                    {{ app()->getLocale() == 'ar' ? 'تفاصيل الطلب' : 'Request Details' }}
                </h2>

                <form action="{{ route('teacher.wallet.store') }}" method="POST">
                    @csrf

                    <!-- Amount Input -->
                    <div class="mb-6">
                        <label for="amount" class="block text-gray-700 font-semibold mb-2">
                            {{ app()->getLocale() == 'ar' ? 'المبلغ' : 'Amount' }} <span class="text-red-500">*</span>
                        </label>
                        <input type="number" name="amount" id="amount" step="0.01" min="1"
                            max="{{ $walletBalance }}" value="{{ old('amount') }}"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 @error('amount') border-red-500 @enderror"
                            placeholder="{{ app()->getLocale() == 'ar' ? 'أدخل المبلغ' : 'Enter amount' }}" required>
                        @error('amount')
                            <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                        @enderror
                    </div>

                    <!-- Payment Method Select -->
                    <div class="mb-6">
                        <label for="payment_method_id" class="block text-gray-700 font-semibold mb-2">
                            {{ app()->getLocale() == 'ar' ? 'الحساب البنكي' : 'Bank Account' }} <span
                                class="text-red-500">*</span>
                        </label>
                        <select name="payment_method_id" id="payment_method_id"
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 @error('payment_method_id') border-red-500 @enderror"
                            required>
                            <option value="">
                                {{ app()->getLocale() == 'ar' ? 'اختر الحساب البنكي' : 'Select Bank Account' }}
                            </option>
                            @foreach ($paymentMethods as $method)
                                <option value="{{ $method->id }}"
                                    {{ old('payment_method_id') == $method->id ? 'selected' : '' }}>
                                    {{ $method->bank_name }} - {{ $method->account_number }}
                                    @if ($method->is_default)
                                        ({{ app()->getLocale() == 'ar' ? 'افتراضي' : 'Default' }})
                                    @endif
                                </option>
                            @endforeach
                        </select>
                        @error('payment_method_id')
                            <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                        @enderror

                        <a href="{{ route('teacher.wallet.bank-accounts.create') }}"
                            class="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block">
                            + {{ app()->getLocale() == 'ar' ? 'إضافة حساب بنكي جديد' : 'Add new bank account' }}
                        </a>
                    </div>

                    <!-- Submit Button -->
                    <div class="flex items-center justify-between">
                        <button type="submit"
                            class="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 w-full">
                            {{ app()->getLocale() == 'ar' ? 'إرسال الطلب' : 'Submit Request' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Important Notes -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
            <h3 class="font-semibold text-gray-800 mb-3">
                {{ app()->getLocale() == 'ar' ? 'ملاحظات هامة:' : 'Important Notes:' }}
            </h3>
            <ul class="list-disc list-inside text-gray-700 space-y-2">
                <li>
                    {{ app()->getLocale() == 'ar'
                        ? 'سيتم خصم المبلغ المطلوب من رصيدك فوراً عند إرسال الطلب'
                        : 'The requested amount will be deducted from your balance immediately upon submission' }}
                </li>
                <li>
                    {{ app()->getLocale() == 'ar'
                        ? 'جميع طلبات السحب تحتاج إلى موافقة الإدارة'
                        : 'All payout requests require admin approval' }}
                </li>
                <li>
                    {{ app()->getLocale() == 'ar'
                        ? 'ستتلقى إشعاراً عند معالجة طلبك'
                        : 'You will receive a notification when your request is processed' }}
                </li>
                <li>
                    {{ app()->getLocale() == 'ar'
                        ? 'قد تستغرق معالجة الطلبات من 1-3 أيام عمل'
                        : 'Processing may take 1-3 business days' }}
                </li>
            </ul>
        </div>
    </div>
@endsection
