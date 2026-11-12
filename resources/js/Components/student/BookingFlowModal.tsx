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

  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<any>(null);

  const [selectedTimeSlots, setSelectedTimeSlots] = useState<number[]>([]);
  const [slotDates, setSlotDates] = useState<Record<number, string>>({});
  const [loadingSlotId, setLoadingSlotId] = useState<number | null>(null);

  const [sessionCount, setSessionCount] = useState(1);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [showCardForm, setShowCardForm] = useState(false);
  const [newCard, setNewCard] = useState({
    card_number: '', card_holder: '', expiry_month: '', expiry_year: '', cvv: '', payment_brand: 'VISA'
  });
  const [selectedSavedCard, setSelectedSavedCard] = useState<any>(null);

  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'polling' | 'paid' | 'failed' | 'timeout'>('idle');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkoutIdRef = useRef<string | null>(null);
  const bookingIdRef = useRef<number | null>(null);

  const teacherProfile = teacher?.profile || {};
  const teacherServices: any[] = teacherProfile?.services || teacher?.services || [];
  const subjects: any[] = teacherProfile?.teacher_subjects || teacher?.teacher_subjects || [];
  const languages: any[] = teacherProfile?.languages || teacher?.languages || [];
  const abilities: any[] = teacherProfile?.abilities || teacher?.abilities || [];
  const availableTimes = teacherProfile?.available_times || teacher?.available_times || [];
  const individualPrice = Number(teacherProfile?.individual_hour_price ?? teacher?.individual_hour_price ?? 0);
  const groupPrice = Number(teacherProfile?.group_hour_price ?? teacher?.group_hour_price ?? 0);
  const basePrice = individualPrice;

  const isLanguageService = (() => {
    if (selectedService) {
      const key = (selectedService.key_name || '').toLowerCase();
      const id = selectedService.service_id || selectedService.id;
      if (key.includes('lang') || id === 2) return true;
      if (key.includes('private') || id === 3) return false;
      if (key.includes('abilit') || id === 6) return false;
    }
    if (serviceId === 2) return true;
    const mainKey = (teacherProfile?.main_service_key || teacher?.main_service_key || '').toLowerCase();
    if (mainKey.includes('lang')) return true;
    if (subjects.length === 0 && languages.length > 0) return true;
    return false;
  })();

  const isAbilityService = (() => {
    if (selectedService) {
      const key = (selectedService.key_name || '').toLowerCase();
      const id = selectedService.service_id || selectedService.id;
      if (key.includes('abilit') || id === 6) return true;
    }
    if (serviceId === 6) return true;
    const mainKey = (teacherProfile?.main_service_key || teacher?.main_service_key || '').toLowerCase();
    if (mainKey.includes('abilit')) return true;
    if (subjects.length === 0 && languages.length === 0 && abilities.length > 0) return true;
    return false;
  })();

  useEffect(() => {
    if (isOpen) {
      const initialSvc = teacherServices.find((s: any) => (s.service_id || s.id) === serviceId) || teacherServices[0] || null;
      setSelectedService(initialSvc);
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
      setSelectedService(null);
      setSelectedTimeSlots([]);
      setSlotDates({});
      setLoadingSlotId(null);
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
  }, [isOpen, serviceId, teacher]);

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

  const toggleTimeSlot = async (slotId: number) => {
    if (selectedTimeSlots.includes(slotId)) {
      setSelectedTimeSlots(prev => prev.filter(id => id !== slotId));
      return;
    }

    if (slotDates[slotId]) {
      setSelectedTimeSlots(prev => [...prev, slotId]);
      return;
    }

    setLoadingSlotId(slotId);
    setError(null);
    try {
      const response: any = await studentService.getTimeslotSessionDate(slotId, sessionCount);
      const info = response?.data ?? response;
      if (response?.success === false || info?.can_book === false) {
        const reason = language === 'ar' ? (info?.reason_ar || info?.reason) : (info?.reason || info?.reason_ar);
        setError(reason || (language === 'ar' ? 'الموعد المحدد غير متاح' : 'Selected slot is not available'));
        return;
      }
      const resolvedDate =
        info?.formatted_date ||
        info?.session_date ||
        info?.upcoming_sessions?.[0]?.formatted_date ||
        info?.upcoming_sessions?.[0]?.session_date ||
        '';
      if (resolvedDate) {
        setSlotDates(prev => ({ ...prev, [slotId]: resolvedDate }));
      }
      setSelectedTimeSlots(prev => [...prev, slotId]);
    } catch {
      setSelectedTimeSlots(prev => [...prev, slotId]);
    } finally {
      setLoadingSlotId(null);
    }
  };

  const handleCreateBooking = async (subscription?: any) => {
    setLoading(true);
    setError(null);
    try {
      await validateSelectedTimeslots(sessionCount);
      const effectiveServiceId = isLanguageService
        ? 2
        : isAbilityService
        ? 6
        : (selectedService?.service_id || selectedService?.id || serviceId || 3);

      const payload: any = {
        teacher_id: teacher.id,
        service_id: effectiveServiceId,
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

  const validateSelectedTimeslots = async (sessionsCount: number) => {
    for (const slotId of selectedTimeSlots) {
      const response: any = await studentService.getTimeslotSessionDate(slotId, sessionsCount);
      const info = response?.data ?? response;
      const conflict = (info?.upcoming_sessions || []).find((session: any) => !session.can_book);
      if (response?.success === false || info?.can_book === false || conflict) {
        const conflictDate = conflict?.session_date || info?.session_date;
        const reason = conflict?.conflict_reason || (language === 'ar' ? info?.reason_ar : info?.reason);
        const message = language === 'ar'
          ? `الموعد غير متاح${conflictDate ? ` بتاريخ ${conflictDate}` : ''}${reason ? `: ${reason}` : '. يرجى اختيار موعد آخر.'}`
          : `This time slot is unavailable${conflictDate ? ` on ${conflictDate}` : ''}${reason ? `: ${reason}` : '. Please choose another time.'}`;
        throw new Error(message);
      }
      const resolvedDate =
        info?.formatted_date ||
        info?.session_date ||
        info?.upcoming_sessions?.[0]?.formatted_date ||
        info?.upcoming_sessions?.[0]?.session_date ||
        '';
      if (resolvedDate) {
        setSlotDates(prev => ({ ...prev, [slotId]: resolvedDate }));
      }
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
      setError(language === 'ar' ? (e.message_ar || e.message || 'تعذر إتمام الحجز') : (e.message || 'Booking failed'));
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
      setError(language === 'ar' ? (e.message_ar || e.message || 'فشل الدفع') : (e.message || 'Payment failed'));
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
            i <= step ? 'bg-primary text-white' : 'bg-[var(--light-bg)] text-[var(--text-muted)]'
          }`}>
            {i < step ? <CheckCircle size={16} /> : i + 1}
          </div>
          {i < 3 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-primary' : 'bg-[var(--border)]'}`} />}
        </div>
      ))}
    </div>
  );

  const renderSubjectStep = () => (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
      {teacherServices.length > 1 && (
        <div className="flex gap-2 p-1 bg-black/5 rounded-xl mb-3">
          {teacherServices.map((svc: any) => {
            const isSelected = (selectedService?.service_id || selectedService?.id) === (svc.service_id || svc.id);
            const name = language === 'ar' ? (svc.name_ar || svc.name_en) : (svc.name_en || svc.name_ar);
            return (
              <button
                key={svc.id || svc.service_id}
                onClick={() => {
                  setSelectedService(svc);
                  setSelectedSubject(null);
                  setSelectedLanguage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  isSelected ? 'bg-white text-primary shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}

      <h3 className="font-semibold text-[var(--text-main)] flex items-center gap-2">
        <BookOpen size={18} className="text-primary" />
        {isLanguageService
          ? (language === 'ar' ? 'اختر اللغة' : 'Select Language')
          : isAbilityService
          ? (language === 'ar' ? 'اختر الاختبار / القدرة' : 'Select Ability Test')
          : (language === 'ar' ? 'اختر المادة' : 'Select Subject')}
      </h3>

      {isLanguageService ? (
        languages.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm py-4 text-center">
            {language === 'ar' ? 'لا توجد لغات متاحة' : 'No languages available'}
          </p>
        ) : (
          languages.map((lang: any) => {
            const isSelected = (selectedLanguage?.language_id || selectedLanguage?.id) === (lang.language_id || lang.id);
            const name = language === 'ar' ? (lang.name_ar || lang.name_en) : (lang.name_en || lang.name_ar);
            return (
              <button
                key={lang.id}
                onClick={() => setSelectedLanguage(lang)}
                className={`w-full text-start p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : 'hover:bg-[var(--light-bg)] border-[var(--border)]'
                }`}
              >
                <span className="font-semibold text-sm text-[var(--text-main)]">{name}</span>
                {isSelected && <CheckCircle size={18} className="text-primary" />}
              </button>
            );
          })
        )
      ) : isAbilityService ? (
        abilities.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm py-4 text-center">
            {language === 'ar' ? 'لا توجد قدرات متاحة' : 'No abilities available'}
          </p>
        ) : (
          abilities.map((ability: any) => {
            const isSelected = selectedSubject?.id === ability.id;
            const name = language === 'ar' ? (ability.name_ar || ability.name_en) : (ability.name_en || ability.name_ar);
            return (
              <button
                key={ability.id}
                onClick={() => setSelectedSubject(ability)}
                className={`w-full text-start p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : 'hover:bg-[var(--light-bg)] border-[var(--border)]'
                }`}
              >
                <span className="font-semibold text-sm text-[var(--text-main)]">{name}</span>
                {isSelected && <CheckCircle size={18} className="text-primary" />}
              </button>
            );
          })
        )
      ) : (
        subjects.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm py-4 text-center">
            {language === 'ar' ? 'لا توجد مواد متاحة' : 'No subjects available'}
          </p>
        ) : (
          subjects.map((sub: any) => {
            const isSelected = (selectedSubject?.subject_id || selectedSubject?.id) === (sub.subject_id || sub.id);
            const title = (language === 'ar' ? (sub.title_ar || sub.name_ar) : (sub.title_en || sub.name_en)) || sub.title || 'مادة دراسية';
            const levelTitle = language === 'ar'
              ? (sub.class_level_title_ar || sub.class_level_title)
              : (sub.class_level_title_en || sub.class_level_title);
            const classTitle = language === 'ar' ? (sub.class_title_ar || sub.class_title) : (sub.class_title_en || sub.class_title);
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubject(sub)}
                className={`w-full text-start p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : 'hover:bg-[var(--light-bg)] border-[var(--border)]'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[var(--text-main)]">{title}</p>
                  {levelTitle && classTitle && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">{levelTitle} - {classTitle}</p>
                  )}
                </div>
                {isSelected && <CheckCircle size={18} className="text-primary shrink-0 mr-2" />}
              </button>
            );
          })
        )
      )}
    </div>
  );

  const renderTimeStep = () => {
    const validDays = (availableTimes || []).filter((dayData: any) => {
      const times = Array.isArray(dayData.times)
        ? dayData.times
        : (Array.isArray(dayData.time_slots) ? dayData.time_slots : []);
      return times.some((s: any) => s.id > 0 && !s.is_booked && s.is_available !== false);
    });

    return (
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        <div>
          <h3 className="font-semibold text-[#1B3A6B] flex items-center gap-2">
            <Calendar size={18} />
            {language === 'ar' ? 'اختر المواعيد' : 'Select Times'}
          </h3>
          <p className="text-xs text-[#1B3A6B]/70 mt-1">
            {language === 'ar'
              ? 'يمكنك اختيار موعد واحد أو أكثر. كل موعد يمثل جلسة منفصلة.'
              : 'You can select one or more slots. Each slot is a separate session.'}
          </p>
        </div>

        {selectedTimeSlots.length > 0 && (
          <div className="p-3 rounded-xl bg-[#A6D388] text-[#144D25] flex items-center justify-between font-bold text-sm shadow-xs">
            <span>{language === 'ar' ? 'عدد الأوقات المحددة' : 'Selected Times'}</span>
            <span className="text-base">{selectedTimeSlots.length}</span>
          </div>
        )}

        {validDays.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 text-sm font-medium">
              {language === 'ar' ? 'لا توجد مواعيد متاحة' : 'No times available'}
            </p>
          </div>
        ) : (
          validDays.map((dayData: any, idx: number) => {
            const dayAr = dayData.day_ar || dayData.day_name_ar || dayData.day || '';
            const dayEn = dayData.day_en || dayData.day_name_en || '';
            const dayTitle = language === 'ar' ? (dayAr || dayEn) : (dayEn || dayAr);
            const times = (Array.isArray(dayData.times) ? dayData.times : (Array.isArray(dayData.time_slots) ? dayData.time_slots : []))
              .filter((s: any) => s.id > 0 && !s.is_booked && s.is_available !== false);

            return (
              <div
                key={dayData.id || idx}
                className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm space-y-3"
              >
                <div className="text-start">
                  <span className="inline-block px-3 py-1 rounded-lg bg-[#A6D388] text-[#144D25] text-xs font-bold">
                    {dayTitle}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {times.map((slot: any) => {
                    const isSelected = selectedTimeSlots.includes(slot.id);
                    const isLoading = loadingSlotId === slot.id;
                    const sessionDate = slotDates[slot.id];

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isLoading}
                        onClick={() => toggleTimeSlot(slot.id)}
                        className={`py-2 px-2.5 rounded-xl text-center transition-all flex flex-col items-center justify-center min-h-[52px] ${
                          isSelected
                            ? 'bg-[#1B3A6B] text-white shadow-md border-2 border-[#1B3A6B]'
                            : 'bg-white text-[#1B3A6B] hover:border-[#1B3A6B] border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {isLoading && <Loader2 size={12} className="animate-spin text-current" />}
                          <span className="text-xs font-bold tracking-wide">
                            {slot.time}
                          </span>
                        </div>

                        {isSelected && sessionDate && (
                          <div className="mt-1 px-1.5 py-0.5 rounded bg-[#3D8B37]/30 text-[#A6D388] text-[10px] font-bold flex items-center justify-center gap-1 whitespace-nowrap">
                            <Calendar size={10} className="shrink-0 text-[#A6D388]" />
                            <span>{sessionDate}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderPreviewStep = () => {
    const requiredSessions = totalSessions;

    return (
      <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
        <h3 className="font-semibold text-[var(--text-main)]">
          {language === 'ar' ? 'تأكيد الحجز' : 'Confirm Booking'}
        </h3>

        <div className="bg-[var(--light-bg)] rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">{language === 'ar' ? 'المعلم' : 'Teacher'}</span>
            <span className="font-medium">{teacher.first_name} {teacher.last_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">
              {isLanguageService
                ? (language === 'ar' ? 'اللغة' : 'Language')
                : isAbilityService
                ? (language === 'ar' ? 'الاختبار' : 'Test')
                : (language === 'ar' ? 'المادة' : 'Subject')}
            </span>
            <span className="font-medium">
              {isLanguageService
                ? (language === 'ar' ? selectedLanguage?.name_ar : selectedLanguage?.name_en)
                : (selectedSubject?.title || (language === 'ar' ? (selectedSubject?.name_ar || selectedSubject?.title_ar) : (selectedSubject?.name_en || selectedSubject?.title_en)))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">{language === 'ar' ? 'عدد المواعيد' : 'Time Slots'}</span>
            <span className="font-medium">{totalSelectedTimes}</span>
          </div>
          {selectedTimeSlots.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t pt-2">
              <span className="text-[var(--text-muted)] text-xs">
                {language === 'ar' ? 'المواعيد والتواريخ المحددة' : 'Selected Slots & Dates'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedTimeSlots.map((slotId) => {
                  let timeLabel = '';
                  let dayLabel = '';
                  (availableTimes || []).forEach((dayData: any) => {
                    const times = Array.isArray(dayData.times)
                      ? dayData.times
                      : (Array.isArray(dayData.time_slots) ? dayData.time_slots : []);
                    const found = times.find((t: any) => t.id === slotId);
                    if (found) {
                      timeLabel = found.time;
                      dayLabel = dayData.day_ar || dayData.day_name_ar || dayData.day || '';
                    }
                  });
                  const dateStr = slotDates[slotId];
                  return (
                    <span
                      key={slotId}
                      className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[#1B3A6B] text-xs font-medium flex items-center gap-1.5"
                    >
                      {dayLabel && <span className="font-bold">{dayLabel}:</span>}
                      <span>{timeLabel}</span>
                      {dateStr && (
                        <span className="font-mono text-[#3D8B37] font-bold flex items-center gap-0.5">
                          <Calendar size={10} />
                          {dateStr}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-muted)]">{language === 'ar' ? 'عدد الجلسات لكل موعد' : 'Sessions per slot'}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSessionCount(Math.max(1, sessionCount - 1))}
                className="w-6 h-6 rounded-full bg-[var(--border)] flex items-center justify-center hover:bg-[var(--border)]">
                <Minus size={12} />
              </button>
              <span className="font-medium w-6 text-center">{sessionCount}</span>
              <button onClick={() => setSessionCount(Math.min(10, sessionCount + 1))}
                className="w-6 h-6 rounded-full bg-[var(--border)] flex items-center justify-center hover:bg-[var(--border)]">
                <Plus size={12} />
              </button>
            </div>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>{language === 'ar' ? 'المجموع' : 'Total'}</span>
            <span className="text-primary">{totalPrice.toFixed(2)} {t.sar || 'SAR'}</span>
          </div>
        </div>

        {subscriptions.filter((s: any) => s.is_active && s.sessions_remaining > 0).map((sub: any) => (
          <button key={sub.id} onClick={() => handlePayWithPackage(sub)}
            disabled={loading}
            className="w-full p-3 rounded-lg border border-green-200 bg-primary-pale hover:bg-primary-pale transition-all flex items-center gap-3 disabled:opacity-60"
          >
            <Package size={20} className="text-primary shrink-0" />
            <div className="text-left flex-1">
              <p className="font-semibold text-sm text-green-800">
                {language === 'ar' ? 'الدفع من الباقة' : 'Pay from Package'}
              </p>
              <p className="text-xs text-primary">
                {language === 'ar'
                  ? `${sub.sessions_remaining} جلسات متبقية`
                  : `${sub.sessions_remaining} sessions remaining`}
              </p>
            </div>
            {loading ? (
              <Loader2 size={16} className="animate-spin text-primary shrink-0" />
            ) : (
              <Package size={16} className="text-primary shrink-0" />
            )}
          </button>
        ))}

        {/* Card Payment - shown when no package or as alternative */}
        <div className="space-y-2">
            <p className="font-medium text-sm text-navy">
              {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
            </p>

            {/* Saved Cards */}
            {savedCards.map((card: any) => (
              <div key={card.id} onClick={() => { setSelectedSavedCard(card); setShowCardForm(false); }}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedSavedCard?.id === card.id ? 'bg-primary/10 border-primary' : 'hover:bg-[var(--light-bg)] border-[var(--border)]'
                }`}>
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-[var(--text-muted)]" />
                  <span className="text-sm font-medium">{card.card_brand} **** {card.last4}</span>
                </div>
                {selectedSavedCard?.id === card.id && <CheckCircle size={16} className="text-primary" />}
              </div>
            ))}

            {/* New Card Option */}
            <div onClick={() => { setShowCardForm(true); setSelectedSavedCard(null); }}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                showCardForm ? 'bg-primary/10 border-primary' : 'hover:bg-[var(--light-bg)] border-[var(--border)]'
              }`}>
              <p className="text-sm font-medium">
                {language === 'ar' ? '+ إضافة بطاقة جديدة' : '+ Add New Card'}
              </p>
            </div>

            {showCardForm && (
              <div className="p-4 border border-[var(--border)] rounded-lg space-y-3 bg-[var(--light-bg)]">
                <select value={newCard.payment_brand} onChange={e => setNewCard({...newCard, payment_brand: e.target.value})}
                  className="w-full p-2 border border-[var(--border)] rounded-lg text-sm">
                  <option value="VISA">Visa</option>
                  <option value="MASTERCARD">Mastercard</option>
                  <option value="MADA">Mada</option>
                </select>
                <input placeholder={language === 'ar' ? 'رقم البطاقة' : 'Card Number'}
                  value={newCard.card_number} onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setNewCard({...newCard, card_number: val});
                  }}
                  className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
                <input placeholder={language === 'ar' ? 'اسم حامل البطاقة' : 'Card Holder'}
                  value={newCard.card_holder} onChange={e => setNewCard({...newCard, card_holder: e.target.value})}
                  className="w-full p-2 border border-[var(--border)] rounded-lg text-sm" />
                <div className="grid grid-cols-3 gap-2">
                  <input placeholder="MM" value={newCard.expiry_month} onChange={e => setNewCard({...newCard, expiry_month: e.target.value})}
                    className="p-2 border border-[var(--border)] rounded-lg text-sm" />
                  <input placeholder="YY" value={newCard.expiry_year} onChange={e => setNewCard({...newCard, expiry_year: e.target.value})}
                    className="p-2 border border-[var(--border)] rounded-lg text-sm" />
                  <input placeholder="CVV" value={newCard.cvv} onChange={e => setNewCard({...newCard, cvv: e.target.value})}
                    className="p-2 border border-[var(--border)] rounded-lg text-sm" />
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
          <div className="h-16 w-16 bg-primary-pale rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-main)]">
            {language === 'ar' ? 'تم الحجز بنجاح' : 'Booking Successful'}
          </h2>
          <p className="text-[var(--text-muted)] mt-2">
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
          <h2 className="text-xl font-bold text-[var(--text-main)]">
            {language === 'ar' ? 'في انتظار تأكيد الدفع' : 'Awaiting Payment Confirmation'}
          </h2>
          <p className="text-[var(--text-muted)] mt-2 mb-4">
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
          <h2 className="text-xl font-bold text-[var(--text-main)]">
            {language === 'ar' ? 'في انتظار الدفع' : 'Waiting for Payment'}
          </h2>
          <p className="text-[var(--text-muted)] mt-2">
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
        <h2 className="text-xl font-bold text-[var(--text-main)]">
          {language === 'ar' ? 'في انتظار الدفع' : 'Waiting for Payment'}
        </h2>
        <p className="text-[var(--text-muted)] mt-2">
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
    } else if (step === 1) {
      setLoading(true);
      setError(null);
      try {
        await validateSelectedTimeslots(sessionCount);
        setStep(2);
      } catch (e: any) {
        setError(e.message || (language === 'ar' ? 'تعذر التحقق من الموعد' : 'Could not verify this time slot'));
      } finally {
        setLoading(false);
      }
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

        <div className="border-t border-[var(--border)] mt-6 pt-4 flex gap-3">
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
