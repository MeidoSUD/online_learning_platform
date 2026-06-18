
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Check, X, Building, Loader2, Upload, AlertCircle, Filter as FilterIcon, FileText, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { adminService, PayoutRequest, getStorageUrl } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';

export const PayoutsTab: React.FC = () => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Filters
    const [filterTeacher, setFilterTeacher] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Modal State
    const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [viewReceipt, setViewReceipt] = useState<string | null>(null);
    const [viewType, setViewType] = useState<'receipt' | 'reason' | null>(null);

    useEffect(() => {
        fetchPayouts();
    }, []);

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            const data = await adminService.getPayouts();
            setPayouts(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            showToast(t.error, 'error');
        } finally {
            setLoading(false);
        }
    };

    const openActionModal = (payout: PayoutRequest, type: 'approve' | 'reject') => {
        setSelectedPayout(payout);
        setActionType(type);
        setReceiptFile(null);
        setRejectReason('');
    };

    const handleSubmitAction = async () => {
        if (!selectedPayout || !actionType) return;

        setActionLoading(true);
        try {
            if (actionType === 'approve') {
                if (!receiptFile) {
                    showToast("Please upload a receipt image.", 'warning');
                    setActionLoading(false);
                    return;
                }
                await adminService.approvePayout(selectedPayout.id, receiptFile);
                showToast("Payout approved successfully.", 'success');
            } else {
                if (!rejectReason) {
                    showToast("Please provide a reason for rejection.", 'warning');
                    setActionLoading(false);
                    return;
                }
                await adminService.rejectPayout(selectedPayout.id, rejectReason);
                showToast("Payout rejected.", 'success');
            }

            // Cleanup and Refresh
            setSelectedPayout(null);
            setActionType(null);
            fetchPayouts();
        } catch (e: any) {
            console.error(e);
            showToast(e.message || "Action failed.", 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredPayouts = payouts.filter(payout => {
        const userName = payout.user?.name ?? '';
        const matchTeacher = !filterTeacher || userName.toLowerCase().includes((filterTeacher ?? '').toLowerCase());
        const matchDate = !filterDate || (payout.created_at && payout.created_at.startsWith(filterDate));
        const matchStatus = !filterStatus || payout.status === filterStatus;
        return matchTeacher && matchDate && matchStatus;
    });

    const clearFilters = () => {
        setFilterTeacher('');
        setFilterDate('');
        setFilterStatus('');
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900">{t.payoutRequests}</h2>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/3">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">{t.teacher}</label>
                    <input
                        type="text"
                        className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary"
                        placeholder={t.phSearchCourses}
                        value={filterTeacher}
                        onChange={(e) => setFilterTeacher(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-1/4">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">{t.date}</label>
                    <input
                        type="date"
                        className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-1/4">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">{t.status}</label>
                    <select
                        className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary bg-white"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">{t.allStatus}</option>
                        <option value="pending">{t.pending}</option>
                        <option value="approved">{t.approve}</option>
                        <option value="rejected">{t.reject}</option>
                    </select>
                </div>
                <button
                    onClick={clearFilters}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Clear Filters"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-slate-700">{t.teacher}</th>
                            <th className="px-6 py-4 font-bold text-slate-700">{t.payoutAmount}</th>
                            <th className="px-6 py-4 font-bold text-slate-700">{t.details}</th>
                            <th className="px-6 py-4 font-bold text-slate-700">{t.date}</th>
                            <th className="px-6 py-4 font-bold text-slate-700 text-right">{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredPayouts.map(payout => (
                            <tr key={payout.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">{payout.teacher?.name || `User #${payout.user?.id}`}</td>
                                <td className="px-6 py-4 text-lg font-bold text-green-600">{payout.amount} {t.sar}</td>
                                  <td className="px-6 py-4 text-slate-600 truncate max-w-xs" >
                                    { payout.payment_method.account_holder_name} { payout.payment_method.account_number}
                                </td>
                                {/* <td className="px-6 py-4 text-slate-600 truncate max-w-xs" title={typeof payout.bank_details === 'string' ? payout.bank_details : JSON.stringify(payout.bank_details)}>
                                    {typeof payout.bank_details === 'string' ? payout.bank_details : t.bankDetails}
                                </td> */}
                                <td className="px-6 py-4 text-slate-500">{new Date(payout.requested_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {(payout.receipt || (payout.status === 'rejected' && payout.reject_reason)) && (
                                            <button 
                                                onClick={() => { 
                                                    if (payout.receipt) {
                                                        setViewReceipt(getStorageUrl(payout.receipt)); 
                                                        setViewType('receipt'); 
                                                    } else if (payout.reject_reason) {
                                                        setViewReceipt(payout.reject_reason); 
                                                        setViewType('reason'); 
                                                    }
                                                }} 
                                                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" 
                                                title={payout.receipt ? (t.viewReceipt || 'عرض الإيصال') : (t.viewReason || 'سبب الرفض')}
                                            >
                                                <Eye size={18} />
                                            </button>
                                        )}
                                        {payout.status === 'pending' ? (
                                            <>
                                                <button onClick={() => openActionModal(payout, 'approve')} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title={t.approve}>
                                                    <Check size={18} />
                                                </button>
                                                <button onClick={() => openActionModal(payout, 'reject')} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title={t.reject}>
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <span className={`capitalize font-medium ${payout.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                                                {payout.status === 'approved' ? t.approve : payout.status === 'rejected' ? t.reject : t.pending}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredPayouts.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">{t.noFile}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Action Modal */}
            <Modal isOpen={!!selectedPayout} onClose={() => setSelectedPayout(null)} title={actionType === 'approve' ? t.approvePayout : t.rejectPayout}>
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm font-bold text-slate-700">{t.payoutAmount}: <span className="text-green-600">{selectedPayout?.amount} {t.sar}</span></p>
                        <p className="text-xs text-slate-500 mt-1">{t.to.replace('إلى', 'لـ')}: {selectedPayout?.user?.name}</p>
                    </div>

                    {actionType === 'approve' ? (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">{t.uploadTransferReceipt}</label>
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 hover:bg-white transition-colors relative cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                />
                                <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                                <p className="text-sm text-slate-600">{receiptFile ? receiptFile.name : t.clickToUploadReceipt}</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">{t.rejectionReasonLabel}</label>
                            <textarea
                                className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none"
                                rows={4}
                                placeholder={t.phSearchCourses}
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => setSelectedPayout(null)}>{t.cancel}</Button>
                        <Button
                            className={`flex-1 ${actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                            onClick={handleSubmitAction}
                            isLoading={actionLoading}
                        >
                            {actionType === 'approve' ? t.confirmApproval : t.confirmRejection}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Receipt View Modal */}
            <Modal isOpen={!!viewReceipt} onClose={() => { setViewReceipt(null); setViewType(null); }} title={viewType === 'reason' ? (t.rejectionReasonLabel || 'سبب الرفض') : (t.viewReceipt || 'عرض الإيصال')}>
                <div className="space-y-4">
                    {viewReceipt && (
                        <div className="flex justify-center">
                            {viewReceipt.startsWith('http') ? (
                                viewReceipt.toLowerCase().endsWith('.pdf') ? (
                                    <a 
                                        href={viewReceipt} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-primary hover:underline"
                                    >
                                        <FileText size={24} />
                                        {t.viewPdf || 'عرض ملف PDF'}
                                    </a>
                                ) : (
                                    <img 
                                        src={viewReceipt} 
                                        alt="Receipt" 
                                        className="max-w-full h-auto rounded-lg border border-slate-200"
                                        style={{ maxHeight: '70vh' }}
                                    />
                                )
                            ) : (
                                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                    <p className="text-red-800 whitespace-pre-wrap">{viewReceipt}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex justify-end">
                        <Button variant="outline" onClick={() => { setViewReceipt(null); setViewType(null); }}>
                            {t.close || 'إغلاق'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
