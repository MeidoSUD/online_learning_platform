import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
    Search, Loader2, CreditCard, CheckCircle, XCircle, Filter,
    DollarSign, Calendar, Eye, RotateCcw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Pagination } from '../ui/Pagination';
import { adminService, AdminPayment } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';

export const AdminPaymentsTab: React.FC = () => {
    const { t, direction, language } = useLanguage();
    const { showToast } = useToast();
    const [payments, setPayments] = useState<AdminPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [paymentDetail, setPaymentDetail] = useState<any>(null);

    useEffect(() => {
        fetchPayments();
    }, [statusFilter]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const filters: any = {};
            if (statusFilter !== 'all') filters.status = statusFilter;
            const data = await adminService.getPayments(filters);
            setPayments(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            showToast(t.error || 'Error', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (payment: AdminPayment) => {
        setSelectedPayment(payment);
        setDetailLoading(true);
        setPaymentDetail(null);
        try {
            const detail = await adminService.getPaymentDetails(payment.id);
            setPaymentDetail(detail);
        } catch (e) {
            console.error(e);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleReconcile = async (payment: AdminPayment) => {
        try {
            await adminService.reconcilePayment(payment.id);
            showToast(language === 'ar' ? 'تمت التسوية بنجاح' : 'Payment reconciled successfully', 'success');
            setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, reconciled: true } : p));
            if (selectedPayment?.id === payment.id) {
                setSelectedPayment(prev => prev ? { ...prev, reconciled: true } : prev);
            }
        } catch (e: any) {
            showToast(t.error || 'Error', 'error');
        }
    };

    const filteredPayments = payments.filter(p => {
        const term = searchTerm.toLowerCase();
        const reference = p.booking?.reference || '';
        const userName = p.user ? `${p.user.first_name} ${p.user.last_name}`.toLowerCase() : '';
        return reference.includes(term) || userName.includes(term) || p.transaction_id?.toLowerCase().includes(term) || String(p.id).includes(term);
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
    const paginatedPayments = filteredPayments.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            completed: 'bg-primary-pale text-primary',
            pending: 'bg-amber-100 text-amber-700',
            processing: 'bg-secondary-pale text-secondary',
            failed: 'bg-red-100 text-red-700',
            refunded: 'bg-purple-100 text-[var(--accent)]',
            initiated: 'bg-secondary-pale text-secondary',
        };
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${map[status] || 'bg-[var(--light-bg)] text-[var(--text-muted)]'}`}>
                {status}
            </span>
        );
    };

    const formatDateTime = (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading && payments.length === 0) {
        return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[var(--text-main)]">
                    {language === 'ar' ? 'إدارة المدفوعات' : 'Payments Management'}
                </h2>
                <Button variant="outline" onClick={fetchPayments} className="flex items-center gap-2">
                    <RotateCcw size={16} /> {language === 'ar' ? 'تحديث' : 'Refresh'}
                </Button>
            </div>

            <div className="bg-white p-4 rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)]">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className={`absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] ${direction === 'rtl' ? 'right-3' : 'left-3'}`} size={20} />
                        <input
                            type="text"
                            placeholder={language === 'ar' ? 'بحث عن مدفوعات...' : 'Search payments...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border)] focus:outline-none focus:border-primary ${direction === 'rtl' ? 'pr-10 pl-4' : ''}`}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-[var(--text-muted)]" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-[var(--light-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        >
                            <option value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
                            <option value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
                            <option value="pending">{language === 'ar' ? 'معلق' : 'Pending'}</option>
                            <option value="processing">{language === 'ar' ? 'قيد المعالجة' : 'Processing'}</option>
                            <option value="failed">{language === 'ar' ? 'فشل' : 'Failed'}</option>
                            <option value="refunded">{language === 'ar' ? 'مسترجع' : 'Refunded'}</option>
                            <option value="initiated">{language === 'ar' ? 'مبدئي' : 'Initiated'}</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--light-bg)] border-b border-[var(--border)]">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-navy">#</th>
                                <th className="px-4 py-3 font-semibold text-navy">{language === 'ar' ? 'المستخدم' : 'User'}</th>
                                <th className="px-4 py-3 font-semibold text-navy">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                                <th className="px-4 py-3 font-semibold text-navy">{language === 'ar' ? 'الطريقة' : 'Method'}</th>
                                <th className="px-4 py-3 font-semibold text-navy">{t.status || 'Status'}</th>
                                <th className="px-4 py-3 font-semibold text-navy">{language === 'ar' ? 'مرجع الحجز' : 'Booking Ref'}</th>
                                <th className="px-4 py-3 font-semibold text-navy">{language === 'ar' ? 'مسوى' : 'Reconciled'}</th>
                                <th className="px-4 py-3 font-semibold text-navy">{t.date || 'Date'}</th>
                                <th className="px-4 py-3 font-semibold text-navy text-right">{t.actions || 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {paginatedPayments.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-8 text-center text-[var(--text-muted)]">
                                        {language === 'ar' ? 'لا توجد مدفوعات' : 'No payments found'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedPayments.map(payment => (
                                    <tr key={payment.id} className="hover:bg-[var(--light-bg)]">
                                        <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">#{payment.id}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-medium text-navy">
                                                {payment.user ? `${payment.user.first_name} ${payment.user.last_name}` : '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-[var(--text-main)]">{payment.amount}</td>
                                        <td className="px-4 py-3 text-xs">{payment.payment_method || '-'}</td>
                                        <td className="px-4 py-3">{getStatusBadge(payment.status)}</td>
                                        <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{payment.booking?.reference || '-'}</td>
                                        <td className="px-4 py-3">
                                            {payment.reconciled ? (
                                                <CheckCircle size={16} className="text-green-500" />
                                            ) : (
                                                <XCircle size={16} className="text-[var(--text-muted)]" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{formatDateTime(payment.created_at)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleViewDetails(payment)}
                                                className="flex items-center gap-1"
                                            >
                                                <Eye size={14} /> {t.viewDetails}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    {loading && <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary/30" /></div>}
                </div>

                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>

            {/* Payment Detail Modal */}
            <Modal isOpen={!!selectedPayment} onClose={() => { setSelectedPayment(null); setPaymentDetail(null); }}
                title={language === 'ar' ? 'تفاصيل الدفع' : 'Payment Details'}>
                {detailLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                ) : paymentDetail ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--light-bg)]">
                                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{language === 'ar' ? 'المبلغ' : 'Amount'}</div>
                                <div className="text-lg font-bold text-[var(--text-main)]">{paymentDetail.amount}</div>
                            </div>
                            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--light-bg)]">
                                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{t.status || 'Status'}</div>
                                <div>{getStatusBadge(paymentDetail.status)}</div>
                            </div>
                            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--light-bg)]">
                                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</div>
                                <div className="font-semibold text-navy">{paymentDetail.payment_method || '-'}</div>
                            </div>
                            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--light-bg)]">
                                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{language === 'ar' ? 'رقم المعاملة' : 'Transaction ID'}</div>
                                <div className="font-mono text-xs text-navy">{paymentDetail.transaction_id || '-'}</div>
                            </div>
                            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--light-bg)]">
                                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{language === 'ar' ? 'المستخدم' : 'User'}</div>
                                <div className="font-semibold text-navy">
                                    {paymentDetail.user ? `${paymentDetail.user.first_name} ${paymentDetail.user.last_name}` : '-'}
                                </div>
                                {paymentDetail.user?.email && (
                                    <div className="text-xs text-[var(--text-muted)]">{paymentDetail.user.email}</div>
                                )}
                            </div>
                            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--light-bg)]">
                                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{language === 'ar' ? 'مرجع الحجز' : 'Booking Reference'}</div>
                                <div className="font-semibold text-navy">{paymentDetail.booking?.reference || '-'}</div>
                            </div>
                            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--light-bg)]">
                                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{language === 'ar' ? 'التاريخ' : 'Date'}</div>
                                <div className="text-sm text-navy">{formatDateTime(paymentDetail.created_at)}</div>
                            </div>
                            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--light-bg)]">
                                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{language === 'ar' ? 'مسوى' : 'Reconciled'}</div>
                                <div className="flex items-center gap-1">
                                    {paymentDetail.reconciled ? (
                                        <><CheckCircle size={16} className="text-green-500" /> <span className="text-primary text-sm font-medium">{language === 'ar' ? 'تمت التسوية' : 'Reconciled'}</span></>
                                    ) : (
                                        <><XCircle size={16} className="text-amber-500" /> <span className="text-amber-700 text-sm font-medium">{language === 'ar' ? 'غير مسوى' : 'Unreconciled'}</span></>
                                    )}
                                </div>
                            </div>
                        </div>

                        {!paymentDetail.reconciled && (
                            <div className="pt-4 border-t border-[var(--border)]">
                                <Button
                                    onClick={() => handleReconcile(paymentDetail)}
                                    className="w-full flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={16} /> {language === 'ar' ? 'تسوية الدفع' : 'Reconcile Payment'}
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-center text-[var(--text-muted)] py-8">{language === 'ar' ? 'لا توجد تفاصيل' : 'No details found'}</p>
                )}
            </Modal>
        </div>
    );
};
