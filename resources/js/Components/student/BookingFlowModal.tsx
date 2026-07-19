import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CheckCircle, Clock, CreditCard, Calendar, BookOpen, AlertTriangle, Loader2, Plus, Minus, Package, ChevronLeft, RefreshCw } from 'lucide-react';
import { studentService, getStorageUrl } from '../../Services/api';

interface BookingFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: any;
  serviceId: number;
}

const BOOKING_STEPS = ['subject', 'time', 'preview', 'payment', 'success'] as const;

export const BookingFlowModal: React.FC<BookingFlowModalProps> = ({ isOpen, onClose, teacher, serviceId }) => {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Subject / Language
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<any>(null);
  const [isLanguageService, setIsLanguageService] = useState(false);

  // Step 2: Time Slots (multi-select)
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<number[]>([]);

  // Step 3: Preview
  const [sessionCount, setSessionCount] = useState(1);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [showCardForm, setShowCardForm] = useState(false);
  const [newCard, setNewCard] = useState({
    card_number: '', card_holder: '', expiry_month: '', expiry_year: '', cvv: '', payment_brand: 'VISA'
  });
  const [selectedSavedCard, setSelectedSavedCard] = useState<any>(null);

  // Step 4: Payment result
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'polling' | 'paid' | 'failed' | 'timeout'>('idle');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkoutIdRef = useRef<string | null>(null);
  const bookingIdRef = useRef<number | null>(null);

  const teacherProfile = teacher?.profile || {};
  const subjects = teacherProfile?.teacher_subjects || teacher?.teacher_subjects || [];
  const languages = teacherProfile?.languages || teacher?.languages || [];
  const availableTimes = teacherProfile?.available_times || teacher?.available_times || [];
  const individualPrice = Number(teacherProfile?.individual_hour_price ?? teacher?.individual_hour_price ?? 0);
  const groupPrice = Number(teacherProfile?.group_hour_price ?? teacher?.group_hour_price ?? 0);
  const basePrice = individualPrice;

  useEffect(() => {
    if (isOpen) {
      setIsLanguageService(serviceId === 2);
      loadSubscriptions();
      loadSavedCards();
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setStep(0);
      setSelectedSubject(null);
      setSelectedLanguage(null);
      setSelectedTimeSlots([]);
      setSessionCount(1);
      setSelectedSavedCard(null);
      setShowCardForm(false);
      setError(null);
      setPaymentResult(null);
      setPollingStatus('idle');
      checkoutIdRef.current = null;
      bookingIdRef.current = null;
      setNewCard({ card_number: '', card_holder: '', expiry_month: '', expiry_year: '', cvv: '', payment_brand: 'VISA' });
    };
  }, [isOpen, serviceId]);

  const loadSubscriptions = async () => {
    try {
      const subs = await studentService.getSubscriptions();
      console.log('Subscriptions loaded:', subs);
      setSubscriptions(Array.isArray(subs) ? subs.filter((s: any) => s.is_active) : []);
    } catch (e) {
      console.warn('Failed to load subscriptions', e);
    }
  };

  const loadSavedCards = async () => {
    try {
      const cards = await studentService.getSavedCards();
      setSavedCards(Array.isArray(cards) ? cards : []);
    } catch (e) { /* ignore */ }
  };

  const totalSelectedTimes = selectedTimeSlots.length;
  const totalSessions = totalSelectedTimes * sessionCount;
  const totalPrice = basePrice * totalSessions;

  const toggleTimeSlot = (slotId: number) => {
    setSelectedTimeSlots(prev =>
      prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]
    );
  };

  const handleCreateBooking = async (subscription?: any) => {
    setLoading(true);
    setError(null);
    try {
      const payload: any = {
        teacher_id: teacher.id,
        service_id: serviceId,
        type: 'single',
      };

      if (isLanguageService && selectedLanguage) {
        payload.language_id = selectedLanguage.language_id || selectedLanguage.id;
      } else if (selectedSubject) {
        payload.subject_id = selectedSubject.subject_id || selectedSubject.id;
      }

      payload.timeslot_ids = selectedTimeSlots;
      payload.total_sessions = totalSessions;

      if (subscription) {
        payload.subscription_id = subscription.id;
      }

      const res = await studentService.createBooking(payload);
      return res;
    } catch (e: any) {
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithPackage = async (subscription: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await handleCreateBooking(subscription);
      loadSubscriptions();
      setStep(4);
      setPaymentResult({ success: true, method: 'package', data: res });
    } catch (e: any) {
      setError(e.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const startPaymentPolling = (checkoutId: string, bookingId: number) => {
    checkoutIdRef.current = checkoutId;
    bookingIdRef.current = bookingId;
    setPollingStatus('polling');
    setPaymentResult({ success: null, method: 'checkout', data: { checkout_id: checkoutId }, bookingId });

    let attempts = 0;
    const maxAttempts = 100; // ~5 minutes at 3s intervals
    pollingRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await studentService.checkPaymentStatus({ payment_id: checkoutId, save_card: true });
        if (res?.success && (res.data?.status === 'paid' || res.data?.status === 'completed')) {
          setPollingStatus('paid');
          setPaymentResult({ success: true, method: 'checkout', data: res, bookingId });
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (e: any) {
        // Ignore polling errors, keep trying
        console.warn('Payment polling attempt failed:', e.message);
      }
      if (attempts >= maxAttempts) {
        setPollingStatus('timeout');
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    }, 3000);
  };

  const handlePayWithCard = async () => {
    setLoading(true);
    setError(null);
    try {
      const bookingRes = await handleCreateBooking();
      const bookingId = bookingRes?.data?.booking?.id || bookingRes?.data?.id || bookingRes?.booking?.id;

      if (!bookingId) throw new Error('Could not get booking ID');

      // Create checkout
      const checkoutPayload: any = { booking_id: bookingId };
      if (selectedSavedCard) {
        checkoutPayload.saved_card_id = selectedSavedCard.id;
      }
      const checkoutRes = await studentService.createCheckout(checkoutPayload);

      if (checkoutRes?.data?.redirect_url) {
        window.open(checkoutRes.data.redirect_url, '_blank');
        setStep(4);
        startPaymentPolling(checkoutRes.data.checkout_id || checkoutRes.data.payment_id, bookingId);
      } else {
        throw new Error('No redirect URL from payment gateway');
      }
    } catch (e: any) {
      setError(e.message || 'Payment failed');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return isLanguageService ? !!selectedLanguage : !!selectedSubject;
      case 1: return selectedTimeSlots.length > 0;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-6">
      {BOOKING_STEPS.slice(0, 4).map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
            i <= step ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
          }`}>
            {i < step ? <CheckCircle size={16} /> : i + 1}
          </div>
          {i < 3 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-primary' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  );

  const renderSubjectStep = () => (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
        <BookOpen size={18} />
        {language === 'ar' ? 'اختر المادة' : 'Select Subject'}
      </h3>
      {isLanguageService ? (
        languages.length === 0 ? (
          <p className="text-slate-500 text-sm">{language === 'ar' ? 'لا توجد لغات متاحة' : 'No languages available'}</p>
        ) : (
          languages.map((lang: any) => (
            <button key={lang.id} onClick={() => setSelectedLanguage(lang)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedLanguage?.id === lang.id ? 'bg-primary/10 border-primary' : 'hover:bg-slate-50 border-slate-200'
              }`}
            >
              <p className="font-semibold">{language === 'ar' ? lang.name_ar : lang.name_en}</p>
            </button>
          ))
        )
      ) : (
        subjects.length === 0 ? (
          <p className="text-slate-500 text-sm">{language === 'ar' ? 'لا توجد مواد متاحة' : 'No subjects available'}</p>
        ) : (
          subjects.map((sub: any) => {
            const title = sub.title || (language === 'ar' ? sub.name_ar : sub.name_en) || 'Unnamed Subject';
            return (
              <button key={sub.id} onClick={() => setSelectedSubject(sub)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedSubject?.id === sub.id ? 'bg-primary/10 border-primary' : 'hover:bg-slate-50 border-slate-200'
                }`}
              >
                <p className="font-semibold">{title}</p>
                {sub.class_level_title && sub.class_title && (
                  <p className="text-xs text-slate-500 mt-1">{sub.class_level_title} - {sub.class_title}</p>
                )}
              </button>
            );
          })
        )
      )}
    </div>
  );

  const renderTimeStep = () => {
    const timeItems = availableTimes.flatMap((day: any) => {
      let slots = [];
      if (day.time_slots && Array.isArray(day.time_slots)) {
        slots = day.time_slots;
      } else if (day.times && Array.isArray(day.times)) {
        slots = day.times.map((t: any) => typeof t === 'string' ? { id: 0, time: t } : t);
      }
      return slots
        .filter((s: any) => s.id > 0 && !s.session && s.is_available !== false)
        .map((s: any) => ({ ...s, day: day.day }));
    });

    return (
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Calendar size={18} />
          {language === 'ar' ? 'اختر المواعيد' : 'Select Times'}
        </h3>
        <p className="text-xs text-slate-500 mb-2">
          {language === 'ar'
            ? 'يمكنك اختيار موعد واحد أو أكثر. كل موعد يمثل جلسة منفصلة.'
            : 'You can select one or more slots. Each slot is a separate session.'}
        </p>
        {timeItems.length === 0 ? (
          <p className="text-slate-500 text-sm">{language === 'ar' ? 'لا توجد مواعيد متاحة' : 'No times available'}</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {timeItems.map((slot: any) => (
              <button key={slot.id} onClick={() => toggleTimeSlot(slot.id)}
                className={`py-2 px-1 rounded-lg text-sm font-medium border transition-all ${
                  selectedTimeSlots.includes(slot.id)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white hover:border-primary border-slate-200'
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}
        {selectedTimeSlots.length > 0 && (
          <p className="text-sm text-primary font-medium mt-2">
            {language === 'ar' ? `تم اختيار ${selectedTimeSlots.length} مواعيد` : `${selectedTimeSlots.length} slot(s) selected`}
          </p>
        )}
      </div>
    );
  };

  const renderPreviewStep = () => {
    const requiredSessions = totalSessions;

    return (
      <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
        <h3 className="font-semibold text-slate-800">
          {language === 'ar' ? 'تأكيد الحجز' : 'Confirm Booking'}
        </h3>

        {/* Summary */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">{language === 'ar' ? 'المعلم' : 'Teacher'}</span>
            <span className="font-medium">{teacher.first_name} {teacher.last_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{isLanguageService ? (language === 'ar' ? 'اللغة' : 'Language') : (language === 'ar' ? 'المادة' : 'Subject')}</span>
            <span className="font-medium">
              {isLanguageService
                ? (language === 'ar' ? selectedLanguage?.name_ar : selectedLanguage?.name_en)
                : (selectedSubject?.title || (language === 'ar' ? selectedSubject?.name_ar : selectedSubject?.name_en))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">{language === 'ar' ? 'عدد المواعيد' : 'Time Slots'}</span>
            <span className="font-medium">{totalSelectedTimes}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">{language === 'ar' ? 'عدد الجلسات لكل موعد' : 'Sessions per slot'}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSessionCount(Math.max(1, sessionCount - 1))}
                className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300">
                <Minus size={12} />
              </button>
              <span className="font-medium w-6 text-center">{sessionCount}</span>
              <button onClick={() => setSessionCount(Math.min(10, sessionCount + 1))}
                className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300">
                <Plus size={12} />
              </button>
            </div>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>{language === 'ar' ? 'المجموع' : 'Total'}</span>
            <span className="text-primary">{totalPrice.toFixed(2)} {t.sar || 'SAR'}</span>
          </div>
        </div>

        {/* Pay from Package - Direct action button (matching Android) */}
        {subscriptions.filter((s: any) => s.is_active && s.sessions_remaining > 0).map((sub: any) => (
          <button key={sub.id} onClick={() => handlePayWithPackage(sub)}
            disabled={loading}
            className="w-full p-3 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-all flex items-center gap-3 disabled:opacity-60"
          >
            <Package size={20} className="text-green-600 shrink-0" />
            <div className="text-left flex-1">
              <p className="font-semibold text-sm text-green-800">
                {language === 'ar' ? 'الدفع من الباقة' : 'Pay from Package'}
              </p>
              <p className="text-xs text-green-600">
                {language === 'ar'
                  ? `${sub.sessions_remaining} جلسات متبقية`
                  : `${sub.sessions_remaining} sessions remaining`}
              </p>
            </div>
            {loading ? (
              <Loader2 size={16} className="animate-spin text-green-600 shrink-0" />
            ) : (
              <Package size={16} className="text-green-600 shrink-0" />
            )}
          </button>
        ))}

        {/* Card Payment - shown when no package or as alternative */}
        <div className="space-y-2">
            <p className="font-medium text-sm text-slate-700">
              {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
            </p>

            {/* Saved Cards */}
            {savedCards.map((card: any) => (
              <div key={card.id} onClick={() => { setSelectedSavedCard(card); setShowCardForm(false); }}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedSavedCard?.id === card.id ? 'bg-primary/10 border-primary' : 'hover:bg-slate-50 border-slate-200'
                }`}>
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-slate-400" />
                  <span className="text-sm font-medium">{card.card_brand} **** {card.last4}</span>
                </div>
                {selectedSavedCard?.id === card.id && <CheckCircle size={16} className="text-primary" />}
              </div>
            ))}

            {/* New Card Option */}
            <div onClick={() => { setShowCardForm(true); setSelectedSavedCard(null); }}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                showCardForm ? 'bg-primary/10 border-primary' : 'hover:bg-slate-50 border-slate-200'
              }`}>
              <p className="text-sm font-medium">
                {language === 'ar' ? '+ إضافة بطاقة جديدة' : '+ Add New Card'}
              </p>
            </div>

            {showCardForm && (
              <div className="p-4 border border-slate-200 rounded-lg space-y-3 bg-slate-50/50">
                <select value={newCard.payment_brand} onChange={e => setNewCard({...newCard, payment_brand: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                  <option value="VISA">Visa</option>
                  <option value="MASTERCARD">Mastercard</option>
                  <option value="MADA">Mada</option>
                </select>
                <input placeholder={language === 'ar' ? 'رقم البطاقة' : 'Card Number'}
                  value={newCard.card_number} onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setNewCard({...newCard, card_number: val});
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                <input placeholder={language === 'ar' ? 'اسم حامل البطاقة' : 'Card Holder'}
                  value={newCard.card_holder} onChange={e => setNewCard({...newCard, card_holder: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm" />
                <div className="grid grid-cols-3 gap-2">
                  <input placeholder="MM" value={newCard.expiry_month} onChange={e => setNewCard({...newCard, expiry_month: e.target.value})}
                    className="p-2 border border-slate-300 rounded-lg text-sm" />
                  <input placeholder="YY" value={newCard.expiry_year} onChange={e => setNewCard({...newCard, expiry_year: e.target.value})}
                    className="p-2 border border-slate-300 rounded-lg text-sm" />
                  <input placeholder="CVV" value={newCard.cvv} onChange={e => setNewCard({...newCard, cvv: e.target.value})}
                    className="p-2 border border-slate-300 rounded-lg text-sm" />
                </div>
              </div>
            )}
          </div>
        </div>
    );
  };

  const handleRetryPolling = () => {
    if (checkoutIdRef.current && bookingIdRef.current) {
      startPaymentPolling(checkoutIdRef.current, bookingIdRef.current);
    }
  };

  const renderPaymentStep = () => {
    if (pollingStatus === 'paid' || (paymentResult?.method === 'package' && paymentResult?.success)) {
      return (
        <div className="text-center py-8">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {language === 'ar' ? 'تم الحجز بنجاح' : 'Booking Successful'}
          </h2>
          <p className="text-slate-500 mt-2">
            {paymentResult?.method === 'package'
              ? (language === 'ar' ? 'تم حجز الجلسات من باقتك' : 'Sessions booked from your package')
              : (language === 'ar' ? 'تم تأكيد الحجز والدفع' : 'Booking confirmed and paid')}
          </p>
        </div>
      );
    }

    if (pollingStatus === 'timeout') {
      return (
        <div className="text-center py-8">
          <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-orange-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {language === 'ar' ? 'في انتظار تأكيد الدفع' : 'Awaiting Payment Confirmation'}
          </h2>
          <p className="text-slate-500 mt-2 mb-4">
            {language === 'ar'
              ? 'لم يتم تأكيد الدفع بعد. إذا أكملت الدفع، انقر على "التحقق" أدناه.'
              : 'Payment not yet confirmed. If you completed payment, click "Check" below.'}
          </p>
          <Button onClick={handleRetryPolling}>
            <RefreshCw size={16} className="mr-1" />
            {language === 'ar' ? 'التحقق من الدفع' : 'Check Payment'}
          </Button>
        </div>
      );
    }

    if (pollingStatus === 'polling') {
      return (
        <div className="text-center py-8">
          <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 size={32} className="text-yellow-600 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {language === 'ar' ? 'في انتظار الدفع' : 'Waiting for Payment'}
          </h2>
          <p className="text-slate-500 mt-2">
            {language === 'ar'
              ? 'تم فتح صفحة الدفع. أكمل الدفع في النافذة المفتوحة. يتم التحقق من حالة الدفع تلقائياً...'
              : 'Payment page opened. Complete payment in the new window. Checking payment status automatically...'}
          </p>
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock size={32} className="text-yellow-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          {language === 'ar' ? 'في انتظار الدفع' : 'Waiting for Payment'}
        </h2>
        <p className="text-slate-500 mt-2">
          {language === 'ar'
            ? 'تم فتح صفحة الدفع. أكمل الدفع في النافذة المفتوحة.'
            : 'Payment page opened. Complete payment in the new window.'}
        </p>
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0: return renderSubjectStep();
      case 1: return renderTimeStep();
      case 2: return renderPreviewStep();
      case 3: case 4: return renderPaymentStep();
      default: return null;
    }
  };

  const getNextLabel = () => {
    switch (step) {
      case 0: return language === 'ar' ? 'التالي: المواعيد' : 'Next: Times';
      case 1: return language === 'ar' ? 'التالي: المراجعة' : 'Next: Review';
      case 2: return language === 'ar' ? `دفع ${totalPrice.toFixed(2)} ${t.sar || 'SAR'}` : `Pay ${totalPrice.toFixed(2)} ${t.sar || 'SAR'}`;
      default: return '';
    }
  };

  const handleNext = async () => {
    if (step === 2) {
        await handlePayWithCard();
    } else {
      setStep(s => Math.min(s + 1, 3));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title={step >= 3 ? (language === 'ar' ? 'الدفع' : 'Payment') : `${language === 'ar' ? 'حجز' : 'Book'} ${teacher.first_name}`}>
      <div className="min-h-[400px] flex flex-col">
        {step < 3 && renderStepIndicator()}

        {error && (
          <div className="p-3 mb-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start gap-2 text-sm">
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1">
          {renderStep()}
        </div>

        <div className="border-t border-slate-100 mt-6 pt-4 flex gap-3">
          {step > 0 && step < 3 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
              <ChevronLeft size={16} className="mr-1" />
              {language === 'ar' ? 'رجوع' : 'Back'}
            </Button>
          )}
          {step < 3 && (
            <Button className={step > 0 ? 'flex-1' : 'w-full'} onClick={handleNext}
              disabled={!canProceed() || loading} isLoading={loading}>
              {getNextLabel()}
            </Button>
          )}
          {step >= 3 && (
            <Button className="w-full" onClick={onClose}>
              {language === 'ar' ? 'تم' : 'Done'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
