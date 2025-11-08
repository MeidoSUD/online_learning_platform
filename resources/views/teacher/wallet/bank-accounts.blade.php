<!-- ============================================ -->
<!-- FILE: resources/views/teacher/wallet/bank-accounts.blade.php -->
<!-- ============================================ -->

@extends('layouts.app')

@section('title', app()->getLocale() == 'ar' ? 'حساباتي البنكية' : 'My Bank Accounts')

@section('content')
<div class="container-fluid py-4">
    <!-- Page Header -->
    <div class="row mb-4">
        <div class="col-12">
            <div class="d-flex justify-content-between align-items-center flex-wrap">
                <div class="mb-3 mb-md-0">
                    <h2 class="mb-1">{{ app()->getLocale() == 'ar' ? 'حساباتي البنكية' : 'My Bank Accounts' }}</h2>
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item"><a href="{{ route('teacher.wallet.index') }}">{{ app()->getLocale() == 'ar' ? 'المحفظة' : 'Wallet' }}</a></li>
                            <li class="breadcrumb-item active">{{ app()->getLocale() == 'ar' ? 'الحسابات البنكية' : 'Bank Accounts' }}</li>
                        </ol>
                    </nav>
                </div>
                <a href="{{ route('teacher.wallet.bank-accounts.create') }}" class="btn btn-success">
                    <i class="fas fa-plus me-2"></i>{{ app()->getLocale() == 'ar' ? 'إضافة حساب بنكي' : 'Add Bank Account' }}
                </a>
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

    <!-- Bank Accounts Grid -->
    @if($bankAccounts->count() > 0)
    <div class="row g-4">
        @foreach($bankAccounts as $account)
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 border-0 shadow-sm bank-account-card {{ $account->is_default ? 'border-success border-2' : '' }}">
                <div class="card-body">
                    <!-- Default Badge -->
                    @if($account->is_default)
                    <div class="position-absolute top-0 end-0 m-3">
                        <span class="badge bg-success">
                            <i class="fas fa-star me-1"></i>{{ app()->getLocale() == 'ar' ? 'افتراضي' : 'Default' }}
                        </span>
                    </div>
                    @endif

                    <!-- Bank Icon & Name -->
                    <div class="d-flex align-items-start mb-3">
                        <div class="icon-box bg-primary bg-opacity-10 text-primary rounded-circle p-3 me-3 flex-shrink-0">
                            <i class="fas fa-university fs-5"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h5 class="card-title mb-1">{{ $account->bank_name }}</h5>
                            <p class="text-muted small mb-0">{{ app()->getLocale() == 'ar' ? 'حساب بنكي' : 'Bank Account' }}</p>
                        </div>
                    </div>

                    <!-- Account Details -->
                    <div class="account-details mb-3">
                        <div class="detail-item mb-2 p-2 bg-light rounded">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="text-muted small">
                                    <i class="fas fa-user me-2"></i>{{ app()->getLocale() == 'ar' ? 'صاحب الحساب' : 'Account Holder' }}
                                </span>
                            </div>
                            <div class="fw-semibold text-dark">{{ $account->account_holder_name }}</div>
                        </div>

                        <div class="detail-item mb-2 p-2 bg-light rounded">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="text-muted small">
                                    <i class="fas fa-hashtag me-2"></i>{{ app()->getLocale() == 'ar' ? 'رقم الحساب' : 'Account Number' }}
                                </span>
                            </div>
                            <div class="fw-semibold text-dark font-monospace">{{ $account->account_number }}</div>
                        </div>

                        <div class="detail-item mb-2 p-2 bg-light rounded">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="text-muted small">
                                    <i class="fas fa-credit-card me-2"></i>{{ app()->getLocale() == 'ar' ? 'الآيبان' : 'IBAN' }}
                                </span>
                            </div>
                            <div class="fw-semibold text-dark font-monospace small">{{ $account->iban }}</div>
                        </div>

                        @if($account->swift_code)
                        <div class="detail-item p-2 bg-light rounded">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="text-muted small">
                                    <i class="fas fa-globe me-2"></i>{{ app()->getLocale() == 'ar' ? 'سويفت كود' : 'SWIFT Code' }}
                                </span>
                            </div>
                            <div class="fw-semibold text-dark font-monospace">{{ $account->swift_code }}</div>
                        </div>
                        @endif
                    </div>

                    <!-- Action Buttons -->
                    <div class="d-flex gap-2">
                        @if(!$account->is_default)
                        <form action="{{ route('teacher.wallet.bank-accounts.set-default', $account->id) }}" 
                              method="POST" class="flex-fill">
                            @csrf
                            @method('PATCH')
                            <button type="submit" class="btn btn-sm btn-outline-primary w-100">
                                <i class="fas fa-star me-1"></i>{{ app()->getLocale() == 'ar' ? 'افتراضي' : 'Set Default' }}
                            </button>
                        </form>
                        @endif
                        
                        <a href="{{ route('teacher.wallet.bank-accounts.edit', $account->id) }}" 
                           class="btn btn-sm btn-outline-warning flex-fill">
                            <i class="fas fa-edit me-1"></i>{{ app()->getLocale() == 'ar' ? 'تعديل' : 'Edit' }}
                        </a>
                        
                        <button type="button" 
                                class="btn btn-sm btn-outline-danger" 
                                onclick="deleteBankAccount({{ $account->id }})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        @endforeach
    </div>
    @else
    <!-- Empty State -->
    <div class="row">
        <div class="col-12">
            <div class="card border-0 shadow-sm">
                <div class="card-body text-center py-5">
                    <div class="mb-4">
                        <i class="fas fa-university fa-5x text-muted"></i>
                    </div>
                    <h4 class="text-muted mb-3">{{ app()->getLocale() == 'ar' ? 'لا توجد حسابات بنكية' : 'No Bank Accounts' }}</h4>
                    <p class="text-muted mb-4">{{ app()->getLocale() == 'ar' ? 'لم تقم بإضافة أي حساب بنكي بعد. أضف حسابك الأول للبدء في استقبال المدفوعات.' : 'You have not added any bank accounts yet. Add your first account to start receiving payments.' }}</p>
                    <a href="{{ route('teacher.wallet.bank-accounts.create') }}" class="btn btn-success">
                        <i class="fas fa-plus me-2"></i>{{ app()->getLocale() == 'ar' ? 'إضافة حساب بنكي' : 'Add Bank Account' }}
                    </a>
                </div>
            </div>
        </div>
    </div>
    @endif

    <!-- Info Box -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="alert alert-info border-0" role="alert">
                <h5 class="alert-heading d-flex align-items-center">
                    <i class="fas fa-info-circle me-2"></i>{{ app()->getLocale() == 'ar' ? 'معلومات مهمة' : 'Important Information' }}
                </h5>
                <hr>
                <ul class="mb-0">
                    <li>{{ app()->getLocale() == 'ar' ? 'تأكد من إدخال معلومات الحساب البنكي بشكل صحيح' : 'Make sure to enter your bank account information correctly' }}</li>
                    <li>{{ app()->getLocale() == 'ar' ? 'سيتم استخدام الحساب الافتراضي لتحويل الأموال' : 'The default account will be used for money transfers' }}</li>
                    <li>{{ app()->getLocale() == 'ar' ? 'يمكنك إضافة أكثر من حساب بنكي واحد' : 'You can add more than one bank account' }}</li>
                    <li>{{ app()->getLocale() == 'ar' ? 'الآيبان يجب أن يبدأ بـ SA متبوعاً بـ 22 رقماً' : 'IBAN must start with SA followed by 22 digits' }}</li>
                </ul>
            </div>
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<div class="modal fade" id="deleteBankAccountModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <form id="deleteBankAccountForm" method="POST">
                @csrf
                @method('DELETE')
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-exclamation-triangle me-2"></i>{{ app()->getLocale() == 'ar' ? 'تأكيد الحذف' : 'Delete Confirmation' }}
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>{{ app()->getLocale() == 'ar' ? 'هل أنت متأكد أنك تريد حذف هذا الحساب البنكي؟' : 'Are you sure you want to delete this bank account?' }}</p>
                    <p class="text-danger small mb-0">
                        <i class="fas fa-exclamation-circle me-1"></i>
                        {{ app()->getLocale() == 'ar' ? 'لا يمكن التراجع عن هذا الإجراء' : 'This action cannot be undone' }}
                    </p>
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
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .bank-account-card {
        transition: all 0.3s ease;
    }

    .bank-account-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
    }

    .detail-item {
        transition: background-color 0.2s ease;
    }

    .detail-item:hover {
        background-color: #e9ecef !important;
    }

    [dir="rtl"] .icon-box {
        margin-right: 0;
        margin-left: 1rem;
    }

    [dir="rtl"] .me-2 {
        margin-right: 0 !important;
        margin-left: 0.5rem !important;
    }

    [dir="rtl"] .me-3 {
        margin-right: 0 !important;
        margin-left: 1rem !important;
    }
</style>
@endpush

@push('scripts')
<script>
    function deleteBankAccount(id) {
        const form = document.getElementById('deleteBankAccountForm');
        form.action = `{{ route('teacher.wallet.bank-accounts.destroy', ':id') }}`.replace(':id', id);
        const modal = new bootstrap.Modal(document.getElementById('deleteBankAccountModal'));
        modal.show();
    }
</script>
@endpush
@endsection
