@extends('layouts.app')

@section('title', app()->getLocale() == 'en' ? 'Payment Methods' : 'طرق الدفع')
@section('content')
<div class="container-fluid py-4">
    <!-- Page Header -->
    <div class="row mb-4">
        <div class="col-12">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h2 class="mb-1">
                        {{ app()->getLocale() == 'ar' ? 'طرق الدفع' : 'Payment Methods' }}
                    </h2>
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb mb-0">
                            {{-- <li class="breadcrumb-item"><a href="{{ route('dashboard') }}">{{ __('common.dashboard') }}</a></li> --}}
                            <li class="breadcrumb-item active">
                                {{ app()->getLocale() == 'ar' ? 'طرق الدفع' : 'Payment Methods' }}
                            </li>
                        </ol>
                    </nav>
                </div>
                <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addPaymentMethodModal">
                    <i class="fas fa-plus me-2"></i>
                    {{ app()->getLocale() == 'ar' ? 'إضافة طريقة جديدة' : 'Add New Method' }}
                </button>
            </div>
        </div>
    </div>

    <!-- Alerts -->
    @if(session('success'))
    <div class="alert alert-success alert-dismissible fade show" role="alert">
        <i class="fas fa-check-circle me-2"></i>{{ session('success') }}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
    @endif

    @if(session('error'))
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <i class="fas fa-exclamation-circle me-2"></i>{{ session('error') }}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
    @endif

    @if($errors->any())
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <i class="fas fa-exclamation-circle me-2"></i>
        <ul class="mb-0">
            @foreach($errors->all() as $error)
            <li>{{ $error }}</li>
            @endforeach
        </ul>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
    @endif

    <!-- Payment Methods Cards -->
    @if($methods->count() > 0)
    <div class="row g-4">
        @foreach($methods as $method)
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 shadow-sm border-0 position-relative {{ $method->is_default ? 'border-primary border-2' : '' }}">
                @if($method->is_default)
                <div class="position-absolute top-0 end-0 mt-2 me-2">
                    <span class="badge bg-primary">{{ app()->getLocale() == 'ar' ? 'افتراضي' : 'Default' }}</span>
                </div>
                @endif
                
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <div class="icon-box bg-primary bg-opacity-10 text-primary rounded-circle p-3 me-3">
                            @if($userRole === 'teacher')
                            <i class="fas fa-university fs-4"></i>
                            @else
                            <i class="fas fa-credit-card fs-4"></i>
                            @endif
                        </div>
                        <div>
                            <h5 class="card-title mb-0">{{ app()->getLocale() == 'ar' ? $method->paymentMethod->name_ar : $method->paymentMethod->name_en }}</h5>
                            <small class="text-muted">{{ app()->getLocale() == 'ar' ? 'طريقة الدفع ' . $userRole : 'Payment Method: ' . $userRole }}</small>
                        </div>
                    </div>

                    @if($userRole === 'teacher')
                    <!-- Teacher Bank Details -->
                    <div class="payment-details">
                        <div class="detail-item mb-2">
                            <small class="text-muted d-block">{{ app()->getLocale() == 'ar' ? 'اسم البنك' : 'Bank Name' }}</small>
                            <strong>{{ $method->bank_name }}</strong>
                        </div>
                        <div class="detail-item mb-2">
                            <small class="text-muted d-block">{{ app()->getLocale() == 'ar' ? 'اسم صاحب الحساب' : 'Account Holder' }}</small>
                            <strong>{{ $method->account_holder_name }}</strong>
                        </div>
                        <div class="detail-item mb-2">
                            <small class="text-muted d-block">{{ app()->getLocale() == 'ar' ? 'رقم الحساب' : 'Account Number' }}</small>
                            <strong>{{ $method->account_number }}</strong>
                        </div>
                        <div class="detail-item mb-2">
                            <small class="text-muted d-block">{{ app()->getLocale() == 'ar' ? 'الآيبان' : 'IBAN' }}</small>
                            <strong class="font-monospace">{{ $method->iban }}</strong>
                        </div>
                    </div>
                    @else
                    <!-- Student Card Details -->
                    <div class="payment-details">
                        <div class="detail-item mb-2">
                            <small class="text-muted d-block">{{ app()->getLocale() == 'ar' ? 'علامة البطاقة' : 'Card Brand' }}</small>
                            <strong class="text-uppercase">{{ $method->card_brand }}</strong>
                        </div>
                        <div class="detail-item mb-2">
                            <small class="text-muted d-block">{{ app()->getLocale() == 'ar' ? 'اسم صاحب البطاقة' : 'Card Holder' }}</small>
                            <strong>{{ $method->card_holder_name }}</strong>
                        </div>
                        <div class="detail-item mb-2">
                            <small class="text-muted d-block">{{ app()->getLocale() == 'ar' ? 'رقم البطاقة' : 'Card Number' }}</small>
                            <strong class="font-monospace">**** **** **** {{ substr($method->card_number, -4) }}</strong>
                        </div>
                        <div class="detail-item mb-2">
                            <small class="text-muted d-block">{{ app()->getLocale() == 'ar' ? 'تاريخ انتهاء الصلاحية' : 'Expiry Date' }}</small>
                            <strong>{{ $method->card_expiry_month }}/{{ $method->card_expiry_year }}</strong>
                        </div>
                    </div>
                    @endif
                </div>

                <div class="card-footer bg-transparent border-top-0">
                    <div class="d-flex justify-content-between align-items-center">
                        @if(!$method->is_default)
                        <form action="{{ route('payment-methods.set-default', $method->id) }}" method="POST" class="d-inline">
                            @csrf
                            @method('PATCH')
                            <button type="submit" class="btn btn-sm btn-outline-primary">
                                <i class="fas fa-star me-1"></i>{{ app()->getLocale() == 'ar' ? 'تعيين كطريقة افتراضية' : 'Set as Default' }}
                            </button>
                        </form>
                        @else
                        <span class="text-muted small">{{ app()->getLocale() == 'ar' ? 'الطريقة الافتراضية' : 'Default Method' }}</span>
                        @endif

                        <div class="btn-group">
                            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="editPaymentMethod({{ json_encode($method) }})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="deletePaymentMethod({{ $method->id }})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        @endforeach
    </div>

    <!-- Pagination -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="d-flex justify-content-center">
                {{ $methods->links() }}
            </div>
        </div>
    </div>
    @else
    <!-- Empty State -->
    <div class="row">
        <div class="col-12">
            <div class="card shadow-sm border-0">
                <div class="card-body text-center py-5">
                    <div class="mb-4">
                        <i class="fas fa-wallet fa-4x text-muted"></i>
                    </div>
                    <h4 class="text-muted mb-3">{{ app()->getLocale() == 'ar' ? 'لا توجد طرق دفع' : 'No Payment Methods Available' }}</h4>
                    <p class="text-muted mb-4">{{ app()->getLocale() == 'ar' ? 'يرجى إضافة طريقة دفع جديدة' : 'Please add a new payment method' }}</p>
                    <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addPaymentMethodModal">
                        <i class="fas fa-plus me-2"></i>{{ app()->getLocale() == 'ar' ? 'إضافة طريقة دفع' : 'Add Payment Method' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
    @endif
</div>

<!-- Add Payment Method Modal -->
<div class="modal fade" id="addPaymentMethodModal" tabindex="-1" aria-labelledby="addPaymentMethodModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <form id="addPaymentForm" action="{{ route('payment-methods.store') }}" method="POST">
                @csrf
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title" id="addPaymentMethodModalLabel">
                        <i class="fas fa-plus-circle me-2"></i>{{ app()->getLocale() == 'ar' ? 'إضافة طريقة دفع جديدة' : 'Add New Payment Method' }}
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-12 mb-3">
                            <label for="payment_method_id" class="form-label">{{ app()->getLocale() == 'ar' ? 'طريقة الدفع' : 'Payment Method' }} <span class="text-danger">*</span></label>
                            <select name="payment_method_id" id="payment_method_id" class="form-select" required>
                                <option value="">{{ app()->getLocale() == 'ar' ? 'اختر طريقة الدفع' : 'Select Payment Method' }}</option>
                                @foreach($paymentMethods as $pm)
                                <option value="{{ $pm->id }}">{{ app()->getLocale() == 'ar' ? $pm->name_ar : $pm->name_en }}</option>
                                @endforeach
                            </select>
                        </div>

                        @if($userRole === 'teacher')
                        <!-- Teacher Bank Fields -->
                        <div class="col-md-6 mb-3">
                            <label for="bank_name" class="form-label">{{ app()->getLocale() == 'ar' ? 'اسم البنك' : 'Bank Name' }} <span class="text-danger">*</span></label>
                            <input type="text" name="bank_name" id="bank_name" class="form-control" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="account_holder_name" class="form-label">{{ app()->getLocale() == 'ar' ? 'اسم صاحب الحساب' :  'Account Holder Name' }} <span class="text-danger">*</span></label>
                            <input type="text" name="account_holder_name" id="account_holder_name" class="form-control" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="account_number" class="form-label">{{ app()->getLocale() == 'ar' ? 'رقم الحساب' : 'Account Number' }} <span class="text-danger">*</span></label>
                            <input type="text" name="account_number" id="account_number" class="form-control" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="iban" class="form-label">{{ app()->getLocale() == 'ar' ? 'الآيبان' : 'IBAN' }} <span class="text-danger">*</span></label>
                            <input type="text" name="iban" id="iban" class="form-control" required>
                        </div>
                        @else
                        <div class="col-md-6 mb-3">
                            <label for="card_holder_name" class="form-label">{{ app()->getLocale() == 'ar' ? 'اسم حامل البطاقة' : 'Card Holder Name' }} <span class="text-danger">*</span></label>
                            <input type="text" name="card_holder_name" id="card_holder_name" class="form-control" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="card_number" class="form-label">{{ app()->getLocale() == 'ar' ? 'رقم البطاقة' : 'Card Number' }} <span class="text-danger">*</span></label>
                            <input type="text" name="card_number" id="card_number" class="form-control" maxlength="19" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="card_cvc" class="form-label">{{ app()->getLocale() == 'ar' ? 'رمز التحقق' : 'CVC' }} <span class="text-danger">*</span></label>
                            <input type="text" name="card_cvc" id="card_cvc" class="form-control" maxlength="4" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="card_expiry_month" class="form-label">{{ app()->getLocale() == 'ar' ? 'شهر انتهاء الصلاحية' : 'Expiry Month' }} <span class="text-danger">*</span></label>
                            <select name="card_expiry_month" id="card_expiry_month" class="form-select" required>
                                <option value="">{{ app()->getLocale() == 'ar' ? 'اختر الشهر' : 'Select Month' }}</option>
                                @for($i = 1; $i <= 12; $i++)
                                <option value="{{ str_pad($i, 2, '0', STR_PAD_LEFT) }}">{{ str_pad($i, 2, '0', STR_PAD_LEFT) }}</option>
                                @endfor
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="card_expiry_year" class="form-label">{{ app()->getLocale() == 'ar' ? 'سنة انتهاء الصلاحية' : 'Expiry Year' }} <span class="text-danger">*</span></label>
                            <select name="card_expiry_year" id="card_expiry_year" class="form-select" required>
                                <option value="">{{ app()->getLocale() == 'ar' ? 'السنة' : 'Year' }}</option>
                                @for($i = date('Y'); $i <= date('Y') + 15; $i++)
                                <option value="{{ $i }}">{{ $i }}</option>
                                @endfor
                            </select>
                        </div>
                        @endif

                        <div class="col-12">
                            <div class="form-check">
                                <input type="checkbox" name="is_default" id="is_default" class="form-check-input" value="1">
                                <label for="is_default" class="form-check-label">{{ app()->getLocale() == 'ar' ? 'تعيين كافتراضي' : 'Set as Default' }}</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ app()->getLocale() == 'ar' ? 'إلغاء' : 'Cancel' }}</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save me-2"></i>{{ app()->getLocale() == 'ar' ? 'حفظ' : 'Save' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Edit Payment Method Modal -->
<div class="modal fade" id="editPaymentMethodModal" tabindex="-1" aria-labelledby="editPaymentMethodModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <form id="editPaymentMethodForm" method="POST">
                @csrf
                @method('PUT')
                <div class="modal-header bg-warning text-dark">
                    <h5 class="modal-title" id="editPaymentMethodModalLabel">
                        <i class="fas fa-edit me-2"></i>{{ app()->getLocale() == 'ar' ? 'تعديل طريقة الدفع' : 'Edit Payment Method' }}
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        @if($userRole === 'teacher')
                        <!-- Teacher Bank Fields -->
                        <div class="col-md-6 mb-3">
                            <label for="edit_bank_name" class="form-label">{{ app()->getLocale() == 'ar' ? 'اسم البنك' : 'Bank Name' }}</label>
                            <input type="text" name="bank_name" id="edit_bank_name" class="form-control">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="edit_account_holder_name" class="form-label">{{ app()->getLocale() == 'ar' ? 'اسم صاحب الحساب' : 'Account Holder Name' }}</label>
                            <input type="text" name="account_holder_name" id="edit_account_holder_name" class="form-control">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="edit_account_number" class="form-label">{{ app()->getLocale() == 'ar' ? 'رقم الحساب' : 'Account Number' }}</label>
                            <input type="text" name="account_number" id="edit_account_number" class="form-control">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="edit_iban" class="form-label">{{ app()->getLocale() == 'ar' ? 'رقم الآيبان' : 'IBAN' }}</label>
                            <input type="text" name="iban" id="edit_iban" class="form-control">
                        </div>
                        @else
                        <!-- Student Card Fields -->
                        <div class="col-md-6 mb-3">
                            <label for="edit_card_brand" class="form-label">{{ app()->getLocale() == 'ar' ? 'علامة البطاقة' : 'Card Brand' }}</label>
                            <select name="card_brand" id="edit_card_brand" class="form-select">
                                <option value="visa">{{ app()->getLocale() == 'ar' ? 'فيزا' : 'Visa' }}</option>
                                <option value="mastercard">{{ app()->getLocale() == 'ar' ? 'ماستركارد' : 'Mastercard' }}</option>
                                <option value="amex">{{ app()->getLocale() == 'ar' ? 'أمريكان إكسبريس' : 'American Express' }}</option>
                                <option value="mada">{{ app()->getLocale() == 'ar' ? 'مدى' : 'Mada' }}</option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="edit_card_holder_name" class="form-label">{{ app()->getLocale() == 'ar' ? 'اسم صاحب البطاقة' : 'Card Holder Name' }}</label>
                            <input type="text" name="card_holder_name" id="edit_card_holder_name" class="form-control">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="edit_card_number" class="form-label">{{ app()->getLocale() == 'ar' ? 'رقم البطاقة' : 'Card Number' }}</label>
                            <input type="text" name="card_number" id="edit_card_number" class="form-control" maxlength="19">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="edit_card_cvc" class="form-label">{{ app()->getLocale() == 'ar' ? 'رمز CVC' : 'CVC' }}</label>
                            <input type="text" name="card_cvc" id="edit_card_cvc" class="form-control" maxlength="4">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="edit_card_expiry_month" class="form-label">{{ app()->getLocale() == 'ar' ? 'شهر انتهاء الصلاحية' : 'Expiry Month' }}</label>
                            <select name="card_expiry_month" id="edit_card_expiry_month" class="form-select">
                                @for($i = 1; $i <= 12; $i++)
                                <option value="{{ str_pad($i, 2, '0', STR_PAD_LEFT) }}">{{ str_pad($i, 2, '0', STR_PAD_LEFT) }}</option>
                                @endfor
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="edit_card_expiry_year" class="form-label">{{ app()->getLocale() == 'ar' ? 'سنة انتهاء الصلاحية' : 'Expiry Year' }}</label>
                            <select name="card_expiry_year" id="edit_card_expiry_year" class="form-select">
                                @for($i = date('Y'); $i <= date('Y') + 15; $i++)
                                <option value="{{ $i }}">{{ $i }}</option>
                                @endfor
                            </select>
                        </div>
                        @endif

                        <div class="col-12">
                            <div class="form-check">
                                <input type="checkbox" name="is_default" id="edit_is_default" class="form-check-input" value="1">
                                <label for="edit_is_default" class="form-check-label">{{ app()->getLocale() == 'ar' ? 'اجعلها الافتراضية' : 'Set as Default' }}</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ app()->getLocale() == 'ar' ? 'إلغاء' : 'Cancel' }}</button>
                    <button type="submit" class="btn btn-warning">
                        <i class="fas fa-save me-2"></i>{{ app()->getLocale() == 'ar' ? 'تحديث' : 'Update' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<div class="modal fade" id="deletePaymentMethodModal" tabindex="-1" aria-labelledby="deletePaymentMethodModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <form id="deletePaymentMethodForm" method="POST">
                @csrf
                @method('DELETE')
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title" id="deletePaymentMethodModalLabel">
                        <i class="fas fa-exclamation-triangle me-2"></i>{{ app()->getLocale() == 'ar' ? 'تأكيد الحذف' : 'Delete Confirmation' }}
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>{{ app()->getLocale() == 'ar' ? 'هل أنت متأكد من أنك تريد حذف هذه الطريقة للدفع؟' : 'Are you sure you want to delete this payment method?' }}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ app()->getLocale() == 'ar' ? 'إلغاء' : 'Cancel' }}</button>
                    <button type="submit" class="btn btn-danger">
                        <i class="fas fa-trash me-2"></i>{{ app()->getLocale() == 'ar' ? 'حذف' : 'Delete' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

@push('styles')
<style>
    .icon-box {
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .card {
        transition: all 0.3s ease;
    }

    .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
    }

    .detail-item {
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
    }

    .detail-item:last-child {
        border-bottom: none;
    }

    .font-monospace {
        font-family: 'Courier New', Courier, monospace;
        letter-spacing: 1px;
    }

    .border-primary {
        border: 2px solid #0d6efd !important;
    }

    .badge {
        font-size: 0.75rem;
        padding: 0.35em 0.65em;
    }

    [dir="rtl"] .icon-box {
        margin-right: 0;
        margin-left: 1rem;
    }

    [dir="rtl"] .breadcrumb-item + .breadcrumb-item::before {
        content: "←";
    }
</style>
@endpush

@push('scripts')
<script>
    function editPaymentMethod(method) {
        const form = document.getElementById('editPaymentMethodForm');
        form.action = `{{ route('payment-methods.update', ':id') }}`.replace(':id', method.id);

        @if($userRole === 'teacher')
        document.getElementById('edit_bank_name').value = method.bank_name || '';
        document.getElementById('edit_account_holder_name').value = method.account_holder_name || '';
        document.getElementById('edit_account_number').value = method.account_number || '';
        document.getElementById('edit_iban').value = method.iban || '';
        @else
        document.getElementById('edit_card_brand').value = method.card_brand || '';
        document.getElementById('edit_card_holder_name').value = method.card_holder_name || '';
        document.getElementById('edit_card_number').value = method.card_number || '';
        document.getElementById('edit_card_cvc').value = method.card_cvc || '';
        document.getElementById('edit_card_expiry_month').value = method.card_expiry_month || '';
        document.getElementById('edit_card_expiry_year').value = method.card_expiry_year || '';
        @endif

        document.getElementById('edit_is_default').checked = method.is_default == 1;

        const modal = new bootstrap.Modal(document.getElementById('editPaymentMethodModal'));
        modal.show();
    }

    function deletePaymentMethod(id) {
        const form = document.getElementById('deletePaymentMethodForm');
        form.action = `{{ route('payment-methods.destroy', ':id') }}`.replace(':id', id);

        const modal = new bootstrap.Modal(document.getElementById('deletePaymentMethodModal'));
        modal.show();
    }

    // Card number formatting for student
    @if($userRole === 'student')
    document.getElementById('card_number')?.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
    });

    document.getElementById('edit_card_number')?.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
    });

    // Only allow numbers for CVC
    document.getElementById('card_cvc')?.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '');
    });

    document.getElementById('edit_card_cvc')?.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
    @endif
</script>

<script>
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('addPaymentForm');
  if (!form) {
    console.log('addPaymentForm not found');
    return;
  }

  // toggle fields based on payment_method_id select (optional)
  const pmSelect = form.querySelector('select[name="payment_method_id"]');
  const bankFields = document.getElementById('bankFields');
  const cardFields = document.getElementById('cardFields');
  function updateFields(){
    const val = pmSelect ? pmSelect.value : '';
    if (bankFields) bankFields.style.display = val == '1' ? 'block' : 'none';
    if (cardFields) cardFields.style.display = val == '2' ? 'block' : 'none';
  }
  if (pmSelect) {
    pmSelect.addEventListener('change', updateFields);
    updateFields();
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    console.log('addPaymentForm submit triggered');

    const fd = new FormData(form);
    for (const pair of fd.entries()) console.log('field', pair[0], pair[1]);

    // get CSRF token (meta first, then _token input fallback)
    let csrf = '';
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) {
      csrf = meta.getAttribute('content') || '';
    } else {
      const tokenInput = form.querySelector('input[name="_token"]');
      csrf = tokenInput ? tokenInput.value : '';
    }

    try {
      const res = await fetch(form.action, {
        method: form.method || 'POST',
        body: fd,
        credentials: 'same-origin',
        headers: {
          'X-CSRF-TOKEN': csrf
        }
      });

      console.log('fetch finished, status:', res.status, 'redirected:', res.redirected);
      const text = await res.text();
      // try parse json, otherwise log html/text
      try {
        console.log('response json:', JSON.parse(text));
      } catch (err) {
        console.log('response text:', text.slice(0, 1000));
      }

      if (res.ok || res.redirected || res.status === 302) {
        // close modal if bootstrap available
        const modalEl = document.getElementById('addPaymentMethodModal');
        if (modalEl && window.bootstrap && bootstrap.Modal) {
          try { bootstrap.Modal.getInstance(modalEl)?.hide(); } catch(e){/*ignore*/ }
        }
        // reload to show updated list
        window.location.reload();
        return;
      }

      alert('{{ app()->getLocale() == "ar" ? "حدث خطأ" : "An error occurred" }}');
    } catch (err) {
      console.error('submit error', err);
      alert('{{ app()->getLocale() == "ar" ? "خطأ في الشبكة" : "Network error" }}');
    }
  });
});
</script>
@endpush
@endsection