
@extends('layouts.app')

@section('title', app()->getLocale() == 'ar' ? 'إضافة حساب بنكي جديد' : 'Add New Bank Account')

@section('content')
<div class="container-fluid py-4">
    <!-- Page Header -->
    <div class="row mb-4">
        <div class="col-12">
            <div class="mb-3">
                <h2 class="mb-1">{{ app()->getLocale() == 'ar' ? 'إضافة حساب بنكي جديد' : 'Add New Bank Account' }}</h2>
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb mb-0">
                        <li class="breadcrumb-item"><a href="{{ route('teacher.wallet.index') }}">{{ app()->getLocale() == 'ar' ? 'المحفظة' : 'Wallet' }}</a></li>
                        <li class="breadcrumb-item"><a href="{{ route('teacher.wallet.bank-accounts') }}">{{ app()->getLocale() == 'ar' ? 'الحسابات البنكية' : 'Bank Accounts' }}</a></li>
                        <li class="breadcrumb-item active">{{ app()->getLocale() == 'ar' ? 'إضافة جديد' : 'Add New' }}</li>
                    </ol>
                </nav>
            </div>
        </div>
    </div>

    <!-- Alerts -->
    @if(session('error'))
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <i class="fas fa-exclamation-circle me-2"></i>{{ session('error') }}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
    @endif

    @if($errors->any())
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <h6 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i>{{ app()->getLocale() == 'ar' ? 'يرجى تصحيح الأخطاء التالية:' : 'Please correct the following errors:' }}</h6>
        <ul class="mb-0">
            @foreach($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
    @endif

    <div class="row">
        <!-- Form Column -->
        <div class="col-lg-8">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white border-0 py-3">
                    <h5 class="mb-0">
                        <i class="fas fa-university text-primary me-2"></i>{{ app()->getLocale() == 'ar' ? 'معلومات الحساب البنكي' : 'Bank Account Information' }}
                    </h5>
                </div>
                <div class="card-body p-4">
                    <form action="{{ route('teacher.wallet.bank-accounts.store') }}" method="POST">
                        @csrf

                        <!-- Bank Name -->
                        <div class="mb-4">
                            <label for="bank_name" class="form-label fw-semibold">
                                {{ app()->getLocale() == 'ar' ? 'اسم البنك' : 'Bank Name' }} <span class="text-danger">*</span>
                            </label>
                            <select name="bank_name" 
                                    id="bank_name" 
                                    class="form-select @error('bank_name') is-invalid @enderror"
                                    required>
                                <option value="">{{ app()->getLocale() == 'ar' ? 'اختر البنك' : 'Select Bank' }}</option>
                                @foreach($saudiBanks as $key => $value)
                                    <option value="{{ $key }}" {{ old('bank_name') == $key ? 'selected' : '' }}>
                                        {{ $value }}
                                    </option>
                                @endforeach
                            </select>
                            @error('bank_name')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <!-- Account Holder Name -->
                        <div class="mb-4">
                            <label for="account_holder_name" class="form-label fw-semibold">
                                {{ app()->getLocale() == 'ar' ? 'اسم صاحب الحساب' : 'Account Holder Name' }} <span class="text-danger">*</span>
                            </label>
                            <input type="text" 
                                   name="account_holder_name" 
                                   id="account_holder_name" 
                                   value="{{ old('account_holder_name') }}"
                                   class="form-control @error('account_holder_name') is-invalid @enderror"
                                   placeholder="{{ app()->getLocale() == 'ar' ? 'أدخل الاسم كما هو في البطاقة البنكية' : 'Enter name as on bank card' }}"
                                   required>
                            @error('account_holder_name')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <!-- Account Number -->
                        <div class="mb-4">
                            <label for="account_number" class="form-label fw-semibold">
                                {{ app()->getLocale() == 'ar' ? 'رقم الحساب' : 'Account Number' }} <span class="text-danger">*</span>
                            </label>
                            <input type="text" 
                                   name="account_number" 
                                   id="account_number" 
                                   value="{{ old('account_number') }}"
                                   class="form-control font-monospace @error('account_number') is-invalid @enderror"
                                   placeholder="{{ app()->getLocale() == 'ar' ? 'أدخل رقم الحساب' : 'Enter account number' }}"
                                   required>
                            @error('account_number')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <!-- IBAN -->
                        <div class="mb-4">
                            <label for="iban" class="form-label fw-semibold">
                                {{ app()->getLocale() == 'ar' ? 'رقم الآيبان (IBAN)' : 'IBAN Number' }} <span class="text-danger">*</span>
                            </label>
                            <input type="text" 
                                   name="iban" 
                                   id="iban" 
                                   value="{{ old('iban') }}"
                                   class="form-control font-monospace @error('iban') is-invalid @enderror"
                                   placeholder="SA0000000000000000000000"
                                   maxlength="24"
                                   pattern="SA[0-9]{22}"
                                   required>
                            <div class="form-text">{{ app()->getLocale() == 'ar' ? 'مثال: SA0000000000000000000000' : 'Example: SA0000000000000000000000' }}</div>
                            @error('iban')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <!-- SWIFT Code -->
                        <div class="mb-4">
                            <label for="swift_code" class="form-label fw-semibold">
                                {{ app()->getLocale() == 'ar' ? 'رمز سويفت (SWIFT Code)' : 'SWIFT Code' }} 
                                <span class="text-muted small">({{ app()->getLocale() == 'ar' ? 'اختياري' : 'Optional' }})</span>
                            </label>
                            <input type="text" 
                                   name="swift_code" 
                                   id="swift_code" 
                                   value="{{ old('swift_code') }}"
                                   class="form-control font-monospace @error('swift_code') is-invalid @enderror"
                                   placeholder="{{ app()->getLocale() == 'ar' ? 'أدخل رمز السويفت' : 'Enter SWIFT code' }}"
                                   maxlength="11">
                            @error('swift_code')
                                <div class="invalid-feedback">{{ $message }}</div>
                            @enderror
                        </div>

                        <!-- Is Default Checkbox -->
                        <div class="mb-4">
                            <div class="form-check">
                                <input type="checkbox" 
                                       name="is_default" 
                                       value="1"
                                       id="is_default"
                                       {{ old('is_default') ? 'checked' : '' }}
                                       class="form-check-input">
                                <label class="form-check-label fw-semibold" for="is_default">
                                    {{ app()->getLocale() == 'ar' ? 'تعيين كحساب افتراضي' : 'Set as default account' }}
                                </label>
                            </div>
                            <div class="form-text">
                                {{ app()->getLocale() == 'ar' ? 'سيتم استخدام هذا الحساب افتراضياً لطلبات السحب' : 'This account will be used by default for payout requests' }}
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="d-flex gap-2">
                            <button type="submit" class="btn btn-success flex-fill">
                                <i class="fas fa-save me-2"></i>{{ app()->getLocale() == 'ar' ? 'حفظ الحساب' : 'Save Account' }}
                            </button>
                            <a href="{{ route('teacher.wallet.bank-accounts') }}" class="btn btn-secondary flex-fill">
                                <i class="fas fa-times me-2"></i>{{ app()->getLocale() == 'ar' ? 'إلغاء' : 'Cancel' }}
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Helper Info Column -->
        <div class="col-lg-4">
            <div class="card border-0 shadow-sm bg-warning bg-opacity-10">
                <div class="card-body">
                    <h5 class="card-title d-flex align-items-center mb-3">
                        <i class="fas fa-lightbulb text-warning me-2"></i>
                        {{ app()->getLocale() == 'ar' ? 'نصائح مهمة' : 'Important Tips' }}
                    </h5>
                    <ul class="list-unstyled">
                        <li class="mb-3">
                            <i class="fas fa-check-circle text-success me-2"></i>
                            <span>{{ app()->getLocale() == 'ar' ? 'تأكد من صحة جميع المعلومات قبل الحفظ' : 'Make sure all information is correct before saving' }}</span>
                        </li>
                        <li class="mb-3">
                            <i class="fas fa-check-circle text-success me-2"></i>
                            <span>{{ app()->getLocale() == 'ar' ? 'رقم الآيبان يجب أن يكون 24 خانة ويبدأ بـ SA' : 'IBAN must be 24 characters and start with SA' }}</span>
                        </li>
                        <li class="mb-3">
                            <i class="fas fa-check-circle text-success me-2"></i>
                            <span>{{ app()->getLocale() == 'ar' ? 'اسم صاحب الحساب يجب أن يطابق اسمك في البنك' : 'Account holder name must match your name at the bank' }}</span>
                        </li>
                        <li class="mb-0">
                            <i class="fas fa-check-circle text-success me-2"></i>
                            <span>{{ app()->getLocale() == 'ar' ? 'يمكنك الحصول على رقم الآيبان من تطبيق البنك أو كشف الحساب' : 'You can get your IBAN from your bank app or account statement' }}</span>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Saudi Banks Info -->
            <div class="card border-0 shadow-sm mt-3">
                <div class="card-body">
                    <h6 class="card-title d-flex align-items-center mb-3">
                        <i class="fas fa-info-circle text-info me-2"></i>
                        {{ app()->getLocale() == 'ar' ? 'البنوك السعودية المدعومة' : 'Supported Saudi Banks' }}
                    </h6>
                    <p class="text-muted small mb-0">
                        {{ app()->getLocale() == 'ar' 
                            ? 'يمكنك إضافة حساب من أي بنك سعودي من القائمة المتاحة' 
                            : 'You can add an account from any Saudi bank in the available list' }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</div>

@push('styles')
<style>
    [dir="rtl"] .me-2 {
        margin-right: 0 !important;
        margin-left: 0.5rem !important;
    }
</style>
@endpush
@endsection