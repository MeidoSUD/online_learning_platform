
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Download, CreditCard, Loader2, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { studentService, Booking, StudentPaymentMethod } from '../../Services/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

export const MyTransactions: React.FC = () => {
    const { t, language } = useLanguage();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    // Payment State
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<StudentPaymentMethod[]>([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<StudentPaymentMethod | 'new' | null>(null);
    const [newCardDetails, setNewCardDetails] = useState({
        card_number: '', card_holder: '', expiry_month: '', expiry_year: '', cvv: '', payment_brand: 'VISA'
    });

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const data = await studentService.getBookings();
            setBookings(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Failed to load transactions:", e);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (id: number) => {
        studentService.downloadInvoice(id);
    };

    const handleOpenPayment = async (booking: Booking) => {
        setSelectedBooking(booking);
        setPaymentError(null);
        try {
            const methods = await studentService.getPaymentMethods();
            setPaymentMethods(methods);
        } catch (e) {
            console.error(e);
        }
    };

    const handleProcessPayment = async () => {
        if (!selectedBooking?.id || !selectedPaymentMethod) return;

        setPaymentLoading(true);
        setPaymentError(null);

        try {
            let paymentDetails: any;
            if (selectedPaymentMethod === 'new') {
                paymentDetails = {
                    card_number: newCardDetails.card_number,
                    card_holder: newCardDetails.card_holder,
                    expiry_month: Number(newCardDetails.expiry_month),
                    expiry_year: Number(newCardDetails.expiry_year),
                    cvv: newCardDetails.cvv,
                    payment_brand: newCardDetails.payment_brand
                };
            } else {
                paymentDetails = {
                    card_number: selectedPaymentMethod.card_number || '',
                    card_holder: selectedPaymentMethod.card_holder_name || '',
                    expiry_month: Number(selectedPaymentMethod.card_expiry_month),
                    expiry_year: Number(selectedPaymentMethod.card_expiry_year),
                    cvv: selectedPaymentMethod.card_cvc || '000', 
                    payment_brand: selectedPaymentMethod.payment_method?.name_en.toUpperCase() || 'VISA'
                };
            }

            const response = await studentService.processPayment({
                booking_id: selectedBooking.id,
                ...paymentDetails
            });

            const redirectUrl = response.data?.redirect_url?.url || response.redirect_url?.url || response.redirect_url;
            if (redirectUrl && (response.requires_3ds || response.data?.requires_3ds)) {
                window.location.href = typeof redirectUrl === 'string' ? redirectUrl : redirectUrl.url;
                return;
            }

            if (response.success) {
                alert(language === 'ar' ? "تم الدفع بنجاح" : "Payment successful!");
                setSelectedBooking(null);
                fetchBookings();
            } else {
                setPaymentError(response.message || "Payment failed");
            }
        } catch (e: any) {
            setPaymentError(e.message || "An error occurred during payment");
        } finally {
            setPaymentLoading(false);
        }
    };

    const getSubjectName = (booking: Booking) => {
        if (booking.teacher_subject) {
            return language === 'ar' ? booking.teacher_subject.name_ar : booking.teacher_subject.name_en;
        }
        if (typeof booking.subject === 'object' && booking.subject !== null) {
            const subj = booking.subject as any;
            return language === 'ar' ? (subj.name_ar || subj.name) : (subj.name_en || subj.name);
        }
        if (typeof booking.subject === 'string') {
            return booking.subject;
        }
        return 'N/A';
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900">{t.myTransactions}</h2>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-700">Reference</th>
                                <th className="px-6 py-4 font-bold text-slate-700">{t.teacher}</th>
                                <th className="px-6 py-4 font-bold text-slate-700">{t.subject}</th>
                                <th className="px-6 py-4 font-bold text-slate-700">{t.date}</th>
                                <th className="px-6 py-4 font-bold text-slate-700">{t.status}</th>
                                <th className="px-6 py-4 font-bold text-slate-700 text-right">Amount</th>
                                <th className="px-6 py-4 font-bold text-slate-700 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        No transactions found.
                                    </td>
                                </tr>
                            ) : (
                                bookings.map(booking => {
                                    const amount = booking.pricing?.total_amount || booking.total_price || booking.price || '0.00';
                                    const currency = booking.pricing?.currency || t.sar;
                                    const isPending = booking.status === 'pending_payment';

                                    return (
                                        <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-slate-500">
                                                {booking.reference || `#${booking.id}`}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {booking.teacher?.first_name} {booking.teacher?.last_name}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {getSubjectName(booking)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                                                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                    booking.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700' :
                                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {isPending ? 'Pending Payment' : booking.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">
                                                {amount} {currency}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {isPending ? (
                                                        <Button 
                                                            size="sm" 
                                                            className="h-8 text-xs bg-primary hover:bg-blue-700" 
                                                            onClick={() => handleOpenPayment(booking)}
                                                        >
                                                            <CreditCard size={14} className="mr-1" /> Pay Now
                                                        </Button>
                                                    ) : (
                                                        booking.status !== 'cancelled' && (
                                                            <button 
                                                                onClick={() => handleDownload(booking.id)}
                                                                className="inline-flex items-center justify-center p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                                title="Download Invoice"
                                                            >
                                                                <Download size={18} />
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Complete Payment">
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs text-slate-400">Booking Reference</p>
                                <p className="font-bold font-mono">{selectedBooking?.reference || `#${selectedBooking?.id}`}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400">Total Amount</p>
                                <p className="text-xl font-bold text-primary">{selectedBooking?.total_price || selectedBooking?.pricing?.total_amount} {t.sar}</p>
                            </div>
                        </div>
                    </div>

                    <h3 className="font-bold text-slate-900">Select Payment Method</h3>
                    <div className="space-y-2">
                        {paymentMethods.map(method => (
                            <div 
                                key={method.id} 
                                onClick={() => setSelectedPaymentMethod(method)}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                    selectedPaymentMethod === method ? 'bg-blue-50 border-primary' : 'bg-white border-slate-200'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <CreditCard size={20} className="text-slate-400" />
                                    <span className="text-sm font-medium">{method.payment_method?.name_en} (**** {method.card_number?.slice(-4)})</span>
                                </div>
                                {selectedPaymentMethod === method && <CheckCircle size={16} className="text-primary" />}
                            </div>
                        ))}
                        <div 
                            onClick={() => setSelectedPaymentMethod('new')}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                selectedPaymentMethod === 'new' ? 'bg-blue-50 border-primary' : 'bg-white border-slate-200'
                            }`}
                        >
                            <span className="text-sm font-bold text-slate-500">+ Use New Card</span>
                        </div>
                    </div>

                    {selectedPaymentMethod === 'new' && (
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3 animate-fade-in">
                            <Select 
                                label="Card Brand"
                                options={[{value: 'VISA', label: 'Visa'}, {value: 'MASTERCARD', label: 'Mastercard'}, {value: 'MADA', label: 'Mada'}]}
                                value={newCardDetails.payment_brand}
                                onChange={e => setNewCardDetails({...newCardDetails, payment_brand: e.target.value})}
                            />
                            <Input label="Card Number" placeholder="0000 0000 0000 0000" value={newCardDetails.card_number} onChange={e => setNewCardDetails({...newCardDetails, card_number: e.target.value.replace(/\D/g, '')})} />
                            <Input label="Card Holder" placeholder="Name on card" value={newCardDetails.card_holder} onChange={e => setNewCardDetails({...newCardDetails, card_holder: e.target.value})} />
                            <div className="grid grid-cols-3 gap-2">
                                <Input label="MM" placeholder="01" value={newCardDetails.expiry_month} onChange={e => setNewCardDetails({...newCardDetails, expiry_month: e.target.value})} />
                                <Input label="YY" placeholder="26" value={newCardDetails.expiry_year} onChange={e => setNewCardDetails({...newCardDetails, expiry_year: e.target.value})} />
                                <Input label="CVV" placeholder="000" value={newCardDetails.cvv} onChange={e => setNewCardDetails({...newCardDetails, cvv: e.target.value})} />
                            </div>
                        </div>
                    )}

                    {paymentError && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2">
                            <AlertTriangle size={14} /> {paymentError}
                        </div>
                    )}

                    <Button className="w-full h-12 mt-2" onClick={handleProcessPayment} isLoading={paymentLoading} disabled={!selectedPaymentMethod}>
                        Confirm Payment
                    </Button>
                </div>
            </Modal>
        </div>
    );
};
