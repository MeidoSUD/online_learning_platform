
@extends('layouts.app')

@section('content')
<div class="container mx-auto px-4 py-8">
    <!-- Page Header -->
    <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">
            {{ app()->getLocale() == 'ar' ? 'محفظتي' : 'My Wallet' }}
        </h1>
    </div>

    <!-- Success/Error Messages -->
    @if(session('success'))
        <div class="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span class="block sm:inline">{{ session('success') }}</span>
        </div>
    @endif

    @if(session('error'))
        <div class="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span class="block sm:inline">{{ session('error') }}</span>
        </div>
    @endif

    <!-- Wallet Balance Card -->
    <div class="bg-white shadow-lg rounded-lg p-6 mb-8">
        <div class="flex justify-between items-center">
            <div>
                <h2 class="text-lg text-gray-600 mb-2">
                    {{ app()->getLocale() == 'ar' ? 'الرصيد المتاح' : 'Available Balance' }}
                </h2>
                <p class="text-4xl font-bold text-green-600">
                    ${{ number_format($walletBalance, 2) }}
                </p>
            </div>
            <div class="mt-4 md:mt-0">
                <a href="{{ route('teacher.wallet.create') }}" 
                   class="btn btn-primary">
                    {{ app()->getLocale() == 'ar' ? 'طلب سحب' : 'Request Payout' }}
                </a>
            </div>
        </div>
    </div>

    <!-- Payout History -->
    <div class="bg-white shadow-lg rounded-lg p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
            {{ app()->getLocale() == 'ar' ? 'سجل السحوبات' : 'Payout History' }}
        </h2>

        @if($payouts->count() > 0)
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {{ app()->getLocale() == 'ar' ? 'المبلغ' : 'Amount' }}
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {{ app()->getLocale() == 'ar' ? 'طريقة الدفع' : 'Payment Method' }}
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {{ app()->getLocale() == 'ar' ? 'الحالة' : 'Status' }}
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {{ app()->getLocale() == 'ar' ? 'تاريخ الطلب' : 'Requested At' }}
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {{ app()->getLocale() == 'ar' ? 'تاريخ المعالجة' : 'Processed At' }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        @foreach($payouts as $payout)
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    ${{ number_format($payout->amount, 2) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {{ $payout->paymentMethod->name ?? 'N/A' }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    @if($payout->status == 'pending')
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            {{ app()->getLocale() == 'ar' ? 'قيد الانتظار' : 'Pending' }}
                                        </span>
                                    @elseif($payout->status == 'completed')
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {{ app()->getLocale() == 'ar' ? 'مكتمل' : 'Completed' }}
                                        </span>
                                    @elseif($payout->status == 'rejected')
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                            {{ app()->getLocale() == 'ar' ? 'مرفوض' : 'Rejected' }}
                                        </span>
                                    @else
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                            {{ ucfirst($payout->status) }}
                                        </span>
                                    @endif
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {{ $payout->requested_at ? $payout->requested_at->format('Y-m-d H:i') : 'N/A' }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {{ $payout->processed_at ? $payout->processed_at->format('Y-m-d H:i') : '-' }}
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="mt-4">
                {{ $payouts->links() }}
            </div>
        @else
            <div class="text-center py-8 text-gray-500">
                {{ app()->getLocale() == 'ar' ? 'لا توجد عمليات سحب سابقة' : 'No payout history found' }}
            </div>
        @endif
    </div>
</div>
@endsection
