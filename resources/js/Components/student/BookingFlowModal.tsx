import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CheckCircle, Clock, CreditCard, Calendar, BookOpen, AlertTriangle, Loader2, Plus, Minus, Package, ChevronLeft, RefreshCw, Star, Trash2, X } from 'lucide-react';
import { studentService, getStorageUrl } from '../../Services/api';

interface BookingFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: any;
  serviceId: number;
}

export const BookingFlowModal: React.FC<BookingFlowModalProps> = ({ isOpen, onClose, teacher, serviceId }) => {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<any>(null);
  const [isLanguageService, setIsLanguageService] = useState(false);

  const [selectedTimeSlots, setSelectedTimeSlots] = useState<number[]>([]);
  const [selectedSlotDetails, setSelectedSlotDetails] = useState<Record<number, { day: string; session_date?: string }>>({});
  const [sessionsPerSlot, setSessionsPerSlot] = useState<Record<number, number>>({});
  const [loadingSlotId, setLoadingSlotId] = useState<number | null>(null);

  const [showDaySelector, setShowDaySelector] = useState(false);
  const [selectedDayForAdd, setSelectedDayForAdd] = useState<string>('');

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

  const [fetchedTeacher, setFetchedTeacher] = useState<any>(null);

  const activeTeacher = fetchedTeacher || teacher;
  const teacherProfile = activeTeacher?.profile || {};
  const subjects = teacherProfile?.teacher_subjects || activeTeacher?.teacher_subjects || [];
  const languages = teacherProfile?.languages || activeTeacher?.languages || [];
  const availableTimes = teacherProfile?.available_times || activeTeacher?.available_times || [];
  const individualPrice = Number(teacherProfile?.individual_hour_price ?? activeTeacher?.individual_hour_price ?? 0);
  const basePrice = individualPrice;

  useEffect(() => {
    if (isOpen) {
      setIsLanguageService(serviceId === 2);
      loadSubscriptions();
      loadSavedCards();
      if (teacher?.id) {
        studentService.getTeacherDetails(teacher.id).then((res: any) => {
          if (res?.data) {
            setFetchedTeacher(res.data);
          }
        }).catch(() => {});
      }
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
      setSelectedSlotDetails({});
      setSessionsPerSlot({});
      setLoadingSlotId(null);
      setShowDaySelector(false);
      setSelectedDayForAdd('');
      setSelectedSavedCard(null);
      setShowCardForm(false);
      setError(null);
      setPaymentResult(null);
      setPollingStatus('idle');
      checkoutIdRef.current = null;
      bookingIdRef.current = null;
      setNewCard({ card_number: '', card_holder: '', expiry_month: '', expiry_year: '', cvv: '', payment_brand: 'VISA' });
    };
  }, [isOpen, serviceId, teacher?.id]);

  const loadSubscriptions = async () => {
    try {
      const subs = await studentService.getSubscriptions();
      setSubscriptions(Array.isArray(subs) ? subs.filter((s: any) => s.is_active) : []);
    } catch {}
  };

  const loadSavedCards = async () => {
    try {
      const cards = await studentService.getSavedCards();
      setSavedCards(Array.isArray(cards) ? cards : []);
    } catch {}
  };

  const totalSessions = selectedTimeSlots.reduce((sum, id) => sum + (sessionsPerSlot[id] || 1), 0);
  const totalPrice = basePrice * totalSessions;

  const updateSlotSessions = (slotId: number, delta: number) => {
    setSessionsPerSlot(prev => {
      const current = prev[slotId] || 1;
      const nextVal = Math.max(1, Math.min(20, current + delta));
      return { ...prev, [slotId]: nextVal };
    });
  };

  const removeSlot = (slotId: number) => {
    if (selectedTimeSlots.length > 1) {
      setSelectedTimeSlots(prev => prev.filter(id => id !== slotId));
      setSelectedSlotDetails(prev => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
      setSessionsPerSlot(prev => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
    }
  };

  const findSlotTime = (slotId: number) => {
    for (const d of availableTimes) {
      const times = d.times || d.time_slots || d.slots || [];
      const found = times.find((t: any) => (typeof t === 'object' ? t.id === slotId : false));
      if (found) return found.time;
    }
    return '';
  };

  const handleTimeToggle = async (timeItem: any, day: string) => {
    const slotId = typeof timeItem === 'object' ? Number(timeItem?.id || 0) : 0;
    if (!slotId) return;

    if (selectedTimeSlots.includes(slotId)) {
      setSelectedTimeSlots(prev => prev.filter(id => id !== slotId));
      setSelectedSlotDetails(prev => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
      setSessionsPerSlot(prev => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
      return;
    }

    setLoadingSlotId(slotId);
    try {
      const response: any = await studentService.getTimeslotSessionDate(slotId, sessionsPerSlot[slotId] || 1);
      const info = response?.data ?? response;
      let resolvedDate = '';

      if (info?.can_book && info?.session_date) {
        resolvedDate = info.formatted_date || info.session_date;
      } else if (Array.isArray(info?.upcoming_sessions) && info.upcoming_sessions.length > 0) {
        const firstBookable = info.upcoming_sessions.find((s: any) => s.can_book && s.session_date);
        if (firstBookable) {
          resolvedDate = firstBookable.formatted_date || firstBookable.session_date;
        }
      }

      if (info?.can_book === false && !resolvedDate) {
        const reason = language === 'ar'
          ? (info?.reason_ar || info?.reason || 'لا توجد جلسات متاحة لهذا الموعد')
          : (info?.reason || 'No upcoming sessions available for this slot');
        setError(reason);
      } else {
        setError(null);
        setSelectedTimeSlots(prev => [...prev, slotId]);
        setSelectedSlotDetails(prev => ({
          ...prev,
          [slotId]: { day, session_date: resolvedDate }
        }));
        setSessionsPerSlot(prev => ({
          ...prev,
          [slotId]: prev[slotId] || 1
        }));
      }
    } catch {
      setSelectedTimeSlots(prev => [...prev, slotId]);
      setSelectedSlotDetails(prev => ({
        ...prev,
        [slotId]: { day }
      }));
      setSessionsPerSlot(prev => ({
        ...prev,
        [slotId]: prev[slotId] || 1
      }));
    } finally {
      setLoadingSlotId(null);
    }
  };

  const handleCreateBooking = async (subscription?: any) => {
    setLoading(true);
    setError(null);
    try {
      await validateSelectedTimeslots();
      const payload: any = {
        teacher_id: activeTeacher.id,
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
      payload.sessions_per_slot = sessionsPerSlot;

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

  const validateSelectedTimeslots = async () => {
    for (const slotId of selectedTimeSlots) {
      const count = sessionsPerSlot[slotId] || 1;
      const response: any = await studentService.getTimeslotSessionDate(slotId, count);
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
    const maxAttempts = 100;
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
      } catch {}
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

  const getStepHeaderInfo = () => {
    const isAr = language === 'ar';
    switch (step) {
      case 0:
        return {
          title: isLanguageService
            ? (isAr ? 'الخطوة 1: اختر اللغة' : 'Step 1: Choose Language')
            : (isAr ? 'الخطوة 1: اختر المادة' : 'Step 1: Choose Subject'),
          subtitle: isLanguageService
            ? (isAr ? 'حدد اللغة التي ترغب في حجز حصة فيها' : 'Specify the language you want to book')
            : (isAr ? 'حدد المادة التي ترغب في حجز حصة فيها' : 'Specify the subject you want to book'),
        };
      case 1:
        return {
          title: isAr ? 'الخطوة 2: اختر الوقت' : 'Step 2: Choose Time',
          subtitle: isAr
            ? 'يمكنك اختيار موعد واحد أو أكثر. كل موعد يمثل جلسة منفصلة.'
            : 'You can select one or more slots. Each slot is a separate session.',
        };
      case 2:
        return {
          title: isAr ? 'الخطوة 3: تأكيد الحجز' : 'Step 3: Confirm Booking',
          subtitle: isAr ? 'راجع تفاصيل الحجز وطريقة الدفع' : 'Review booking details and payment method',
        };
      default:
        return {
          title: isAr ? 'الدفع' : 'Payment',
          subtitle: '',
        };
    }
  };

  const renderSubjectStep = () => {
    const isAr = language === 'ar';

    if (isLanguageService) {
      if (languages.length === 0) {
        return (
          <div className="py-12 text-center text-[#738989] text-sm">
            {isAr ? 'لا توجد لغات متاحة لهذا المعلم' : 'No languages available for this teacher'}
          </div>
        );
      }

      return (
        <div className="space-y-3 max-h-[440px] overflow-y-auto px-1 py-1">
          {languages.map((lang: any) => {
            const isSelected = selectedLanguage?.id === lang.id;
            const title = isAr ? (lang.name_ar || lang.name_en) : (lang.name_en || lang.name_ar);

            return (
              <div
                key={lang.id}
                onClick={() => setSelectedLanguage(lang)}
                className={`p-4 bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] cursor-pointer transition-all flex items-center justify-between border ${
                  isSelected ? 'border-[#5B9F48]' : 'border-transparent'
                }`}
              >
                <div className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 border-[#5B9F48]">
                  {isSelected && <div className="w-3 h-3 rounded-full bg-[#5B9F48]" />}
                </div>

                <span className="flex-1 text-right px-3.5 font-medium text-[14.5px] text-[#0D4A5F]">
                  {title}
                </span>

                <BookOpen size={24} className="text-[#0D4A5F] shrink-0" />
              </div>
            );
          })}
        </div>
      );
    }

    if (subjects.length === 0) {
      return (
        <div className="py-12 text-center text-[#738989] text-sm">
          {isAr ? 'لا توجد مواد متاحة لهذا المعلم' : 'No subjects available for this teacher'}
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-[440px] overflow-y-auto px-1 py-1">
        {subjects.map((sub: any) => {
          const isSelected = selectedSubject?.id === sub.id;
          const baseTitle = isAr
            ? (sub.title_ar || sub.name_ar || sub.title || sub.name_en)
            : (sub.title_en || sub.name_en || sub.title || sub.name_ar);

          const classTitle = isAr
            ? (sub.class_title_ar || sub.class_title || sub.class_title_en)
            : (sub.class_title_en || sub.class_title || sub.class_title_ar);

          const classLevel = isAr
            ? (sub.class_level_title_ar || sub.class_level_title || sub.class_level_title_en)
            : (sub.class_level_title_en || sub.class_level_title || sub.class_level_title_ar);

          const fullTitle = [baseTitle, classTitle, classLevel].filter(Boolean).join(' - ');

          return (
            <div
              key={sub.id}
              onClick={() => setSelectedSubject(sub)}
              className={`p-4 bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] cursor-pointer transition-all flex items-center justify-between border ${
                isSelected ? 'border-[#5B9F48]' : 'border-transparent'
              }`}
            >
              <div className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 border-[#5B9F48]">
                {isSelected && <div className="w-3 h-3 rounded-full bg-[#5B9F48]" />}
              </div>

              <span className="flex-1 text-right px-3.5 font-medium text-[14.5px] text-[#0D4A5F]">
                {fullTitle}
              </span>

              <BookOpen size={24} className="text-[#0D4A5F] shrink-0" />
            </div>
          );
        })}
      </div>
    );
  };

  const renderTimeStep = () => {
    const isAr = language === 'ar';

    const validDays = availableTimes.filter((dayData: any) => {
      const times = dayData?.times || dayData?.time_slots || dayData?.slots || [];
      return Array.isArray(times) && times.length > 0;
    });

    if (validDays.length === 0) {
      return (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <Calendar size={56} className="text-[#CFCFCF] mb-3" />
          <p className="font-bold text-base text-[#0D4A5F]">
            {isAr ? 'لا توجد مواعيد متاحة' : 'No times available'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3.5 max-h-[440px] overflow-y-auto px-1 py-1">
        {selectedTimeSlots.length > 0 && (
          <div className="bg-[#A6D388] rounded-[10px] px-4 py-2.5 mb-2 flex justify-between items-center text-[#144D25]">
            <span className="font-bold text-sm">
              {isAr ? 'عدد الأوقات المحددة' : 'Selected Times'}
            </span>
            <span className="font-bold text-base">
              {selectedTimeSlots.length}
            </span>
          </div>
        )}

        {validDays.map((dayData: any, dayIdx: number) => {
          const dayAr = dayData?.day_ar || dayData?.day_name_ar || dayData?.day || '';
          const dayEn = dayData?.day_en || dayData?.day_name_en || '';
          const dayTitle = isAr ? (dayAr || dayEn) : (dayEn || dayAr);
          const rawTimes = dayData?.times || dayData?.time_slots || dayData?.slots || [];
          const times = Array.isArray(rawTimes)
            ? rawTimes.filter((t: any) => {
                if (typeof t === 'string') return true;
                if (t.is_booked === true) return false;
                if (t.session) return false;
                if (t.is_available === false) return false;
                return true;
              })
            : [];

          if (times.length === 0) return null;

          return (
            <div
              key={dayData.id || dayIdx}
              className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#0D4A5F]/10 p-3.5"
            >
              <div className="flex justify-start">
                <span className="px-3 py-1 bg-[#A6D388] text-[#144D25] rounded-[8px] text-xs font-semibold inline-block">
                  {dayTitle}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {times.map((timeItem: any, timeIdx: number) => {
                  const slotId = typeof timeItem === 'object' ? Number(timeItem.id || 0) : timeIdx;
                  const timeText = typeof timeItem === 'object' ? (timeItem.time || '') : String(timeItem);
                  const isSelected = selectedTimeSlots.includes(slotId);
                  const slotDetail = selectedSlotDetails[slotId];
                  const sessionDate = slotDetail?.session_date;
                  const isLoadingThisSlot = loadingSlotId === slotId;

                  return (
                    <button
                      key={slotId || timeIdx}
                      type="button"
                      disabled={isLoadingThisSlot}
                      onClick={() => handleTimeToggle(timeItem, dayTitle)}
                      className={`transition-all rounded-[10px] text-center select-none flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-[#0D4A5F] text-white border-[1.5px] border-[#0D4A5F] px-3.5 py-1.5 shadow-[0_2px_6px_rgba(13,74,95,0.2)]'
                          : isLoadingThisSlot
                          ? 'bg-white text-[#0D4A5F] border border-[#5B9F48] px-3.5 py-2'
                          : 'bg-white text-[#0D4A5F] border border-[#E6E6E6] hover:border-[#0D4A5F]/40 px-3.5 py-2'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        {isLoadingThisSlot && (
                          <Loader2 size={13} className="animate-spin text-[#5B9F48]" />
                        )}
                        <span className={`text-[12.5px] leading-tight ${isSelected ? 'font-semibold text-white' : 'font-normal text-[#0D4A5F]'}`}>
                          {timeText}
                        </span>
                      </div>
                      {isSelected && sessionDate && (
                        <div className="mt-1 bg-[#5B9F48]/25 rounded-[4px] px-1.5 py-0.5 flex items-center justify-center gap-1">
                          <Calendar size={10} className="text-[#A6D388]" />
                          <span className="text-[10px] font-bold text-[#A6D388]">{sessionDate}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPreviewStep = () => {
    const isAr = language === 'ar';
    const teacherImg = getStorageUrl(activeTeacher.image || activeTeacher.avatar || activeTeacher.profile_photo || teacherProfile.image);
    const teacherRating = Number(activeTeacher.rating ?? teacherProfile.rating ?? 4.8).toFixed(1);
    const subjectTitle = isLanguageService
      ? (isAr ? selectedLanguage?.name_ar : selectedLanguage?.name_en)
      : (selectedSubject?.title || (isAr ? selectedSubject?.name_ar : selectedSubject?.name_en) || (isAr ? 'اللغة العربية' : 'Arabic'));

    const currentService = (activeTeacher.services || teacherProfile.services || []).find(
      (s: any) => s.service_id === serviceId || s.id === serviceId
    );
    const serviceName = currentService
      ? (isAr ? (currentService.name_ar || currentService.name) : (currentService.name_en || currentService.name))
      : (isLanguageService ? (isAr ? 'تعلم اللغات' : 'Language Learning') : (isAr ? 'الدروس الخصوصية' : 'Private Tutoring'));

    const activeSubs = subscriptions.filter((s: any) => s.is_active && s.sessions_remaining > 0);

    const validDays = availableTimes.filter((dayData: any) => {
      const times = dayData?.times || dayData?.time_slots || dayData?.slots || [];
      return Array.isArray(times) && times.length > 0;
    });

    const activeDayData = validDays.find((d: any) => {
      const dayAr = d?.day_ar || d?.day_name_ar || d?.day || '';
      const dayEn = d?.day_en || d?.day_name_en || '';
      return dayAr === selectedDayForAdd || dayEn === selectedDayForAdd;
    }) || validDays[0];

    const activeDayTimes = activeDayData ? (activeDayData.times || activeDayData.time_slots || activeDayData.slots || []) : [];

    return (
      <div className="space-y-4 max-h-[500px] overflow-y-auto px-1 py-1">
        <div className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#0D4A5F]/10 p-3.5 flex items-center justify-between">
          <div className="flex-1 text-right">
            <h4 className="font-bold text-[15px] text-[#0D4A5F]">
              {activeTeacher.first_name} {activeTeacher.last_name}
            </h4>
            <div className="flex items-center justify-end gap-3 mt-1 text-xs">
              <div className="flex items-center gap-1">
                <BookOpen size={14} className="text-[#0D4A5F]" />
                <span className="text-[#738989] truncate max-w-[130px]">{subjectTitle}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-[#171717]">{teacherRating}</span>
                <Star size={14} className="fill-[#F59E0B] text-[#F59E0B]" />
              </div>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#EFF6F4] border border-[#0D4A5F]/10 shrink-0 mr-3.5">
            {teacherImg ? (
              <img src={teacherImg} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-[#0D4A5F]">
                {activeTeacher.first_name?.[0] || 'T'}
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-sm text-[#0D4A5F] mb-2.5">
            {isAr ? 'تفاصيل الحصة' : 'Session Details'}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-[12px] p-2.5 shadow-[0_2px_6px_rgba(0,0,0,0.02)] border border-[#0D4A5F]/10 text-right">
              <span className="text-[10.5px] text-[#738989] block">
                {isAr ? 'الخدمة المختارة' : 'Service'}
              </span>
              <span className="text-[12.5px] font-bold text-[#0D4A5F] mt-0.5 block truncate">
                {serviceName}
              </span>
            </div>
            <div className="bg-white rounded-[12px] p-2.5 shadow-[0_2px_6px_rgba(0,0,0,0.02)] border border-[#0D4A5F]/10 text-right">
              <span className="text-[10.5px] text-[#738989] block">
                {isAr ? 'نوع الحصة' : 'Session Type'}
              </span>
              <span className="text-[12.5px] font-bold text-[#0D4A5F] mt-0.5 block truncate">
                {isAr ? 'حصة فردية' : 'Single Session'}
              </span>
            </div>
            <div className="bg-white rounded-[12px] p-2.5 shadow-[0_2px_6px_rgba(0,0,0,0.02)] border border-[#0D4A5F]/10 text-right">
              <span className="text-[10.5px] text-[#738989] block">
                {isLanguageService ? (isAr ? 'اللغة' : 'Language') : (isAr ? 'المادة' : 'Subject')}
              </span>
              <span className="text-[12.5px] font-bold text-[#0D4A5F] mt-0.5 block truncate">
                {subjectTitle}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="bg-[#A6D388] text-[#144D25] rounded-[8px] px-2.5 py-1 text-xs font-bold">
              {isAr ? `${totalSessions} حصص` : `${totalSessions} sessions`}
            </span>
            <div className="text-right">
              <h4 className="font-bold text-sm text-[#0D4A5F]">
                {isAr ? 'المواعيد المختارة' : 'Selected Appointments'}
              </h4>
              <p className="text-[10.5px] text-[#738989] mt-0.5">
                {isAr ? 'يمكنك تحديد عدد الحصص لكل يوم' : 'You can specify sessions per day'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {selectedTimeSlots.map((slotId: number) => {
              const slotDetail = selectedSlotDetails[slotId];
              const slotSessions = sessionsPerSlot[slotId] || 1;
              const slotTime = findSlotTime(slotId);
              const dayName = slotDetail?.day || '';
              const sessionDate = slotDetail?.session_date;

              return (
                <div
                  key={slotId}
                  className="bg-white rounded-[12px] p-3 shadow-[0_2px_6px_rgba(0,0,0,0.02)] border border-[#0D4A5F]/10"
                >
                  <div className="flex items-center justify-between">
                    {selectedTimeSlots.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeSlot(slotId)}
                        className="p-1.5 rounded-full bg-[#FEE2E2] text-[#EF4444] hover:bg-[#FEE2E2]/80 transition-all shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <div className="w-7" />
                    )}

                    <div className="text-right flex-1 px-3">
                      <p className="text-[12.5px] font-medium text-[#0D4A5F]">{dayName}</p>
                      <p className="text-[12.5px] font-bold text-[#0D4A5F] mt-0.5">{slotTime}</p>
                      {sessionDate && (
                        <div className="flex items-center justify-end gap-1 text-[11px] font-bold text-[#5B9F48] mt-1">
                          <Calendar size={11} />
                          <span>{sessionDate}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateSlotSessions(slotId, 1)}
                        className="w-6 h-6 rounded-full bg-[#5B9F48] text-white flex items-center justify-center transition-all"
                      >
                        <Plus size={12} />
                      </button>
                      <span className="font-bold text-sm text-[#0D4A5F] w-6 text-center">
                        {slotSessions}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateSlotSessions(slotId, -1)}
                        disabled={slotSessions <= 1}
                        className="w-6 h-6 rounded-full bg-[#5B9F48] text-white flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
                      >
                        <Minus size={12} />
                      </button>
                      <Clock size={20} className="text-[#0D4A5F] ml-1" />
                    </div>
                  </div>

                  {slotSessions > 1 && (
                    <div className="mt-2.5 p-2 bg-[#EFF6F4] rounded-[8px] border border-[#5B9F48]/25 flex items-center justify-end gap-1.5 text-[11px] text-[#0D4A5F] font-medium">
                      <span>{isAr ? 'ستتكرر الحصة أسبوعياً في نفس اليوم والموعد' : 'Repeats weekly at same time'}</span>
                      <RefreshCw size={13} className="text-[#5B9F48] shrink-0" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          {!showDaySelector ? (
            <button
              type="button"
              onClick={() => {
                setShowDaySelector(true);
                if (validDays.length > 0 && !selectedDayForAdd) {
                  const firstDay = validDays[0];
                  setSelectedDayForAdd(firstDay?.day_ar || firstDay?.day_name_ar || firstDay?.day || '');
                }
              }}
              className="w-full py-2.5 bg-white rounded-[12px] border border-[#0D4A5F]/50 text-center font-bold text-[13px] text-[#0D4A5F] hover:bg-gray-50 transition-all"
            >
              {isAr ? '+ إضافة نفس الموعد ليوم آخر' : '+ Add same time for another day'}
            </button>
          ) : (
            <div className="bg-white rounded-[14px] p-3 shadow-sm border border-[#0D4A5F]/10">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setShowDaySelector(false)}
                  className="p-1 text-[#738989] hover:text-[#0D4A5F]"
                >
                  <X size={18} />
                </button>
                <span className="font-bold text-[12.5px] text-[#0D4A5F]">
                  {isAr ? 'اختر اليوم لإضافة موعد جديد' : 'Choose day to add new slot'}
                </span>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-2">
                {validDays.map((d: any, idx: number) => {
                  const dName = isAr ? (d.day_ar || d.day_name_ar || d.day) : (d.day_en || d.day_name_en || d.day);
                  const isDayActive = (d.day_ar || d.day_name_ar || d.day) === selectedDayForAdd;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDayForAdd(d.day_ar || d.day_name_ar || d.day)}
                      className={`px-2.5 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all ${
                        isDayActive
                          ? 'bg-[#0D4A5F] text-white'
                          : 'bg-white text-[#0D4A5F] border border-[#E6E6E6]'
                      }`}
                    >
                      {dName}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-[#0D4A5F]/10">
                <span className="text-[11px] text-[#738989] block mb-2 text-right">
                  {isAr ? `الأوقات المتاحة ليوم ${selectedDayForAdd}:` : 'Available times:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeDayTimes.map((timeItem: any, tIdx: number) => {
                    const slotId = typeof timeItem === 'object' ? Number(timeItem.id || 0) : 0;
                    const timeText = typeof timeItem === 'object' ? timeItem.time : String(timeItem);
                    const isSelected = selectedTimeSlots.includes(slotId);

                    return (
                      <button
                        key={slotId || tIdx}
                        type="button"
                        onClick={() => handleTimeToggle(timeItem, selectedDayForAdd)}
                        className={`px-3 py-1.5 rounded-[8px] text-xs transition-all ${
                          isSelected
                            ? 'bg-[#0D4A5F] text-white font-semibold'
                            : 'bg-white text-[#0D4A5F] border border-[#E6E6E6] hover:border-[#0D4A5F]/40'
                        }`}
                      >
                        {timeText}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {activeSubs.length > 0 ? (
          activeSubs.map((sub: any) => (
            <div
              key={sub.id}
              className="bg-[#F0FDF4] rounded-[14px] border border-[#86EFAC] p-3 flex items-center justify-between"
            >
              <button
                type="button"
                onClick={() => handlePayWithPackage(sub)}
                disabled={loading}
                className="bg-[#5B9F48] hover:bg-[#5B9F48]/90 text-white rounded-[8px] px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-60"
              >
                {isAr ? 'استخدام الباقة' : 'Use Package'}
              </button>
              <div className="flex items-center gap-2.5 text-right">
                <div>
                  <h5 className="font-bold text-[12.5px] text-[#144D25]">
                    {isAr ? 'باقة تعليمية نشطة' : 'Active Package'}
                  </h5>
                  <p className="text-[10.5px] text-[#166534]">
                    {isAr ? `رصيدك الحالي: ${sub.sessions_remaining} حصة متبقية` : `Remaining: ${sub.sessions_remaining} sessions`}
                  </p>
                </div>
                <Package size={22} className="text-[#5B9F48] shrink-0" />
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-[14px] border border-[#A6D388]/80 p-3 flex items-center justify-between shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
            <span className="text-xs font-bold text-[#5B9F48]">
              {isAr ? 'باقات إيوان' : 'Ewan Packages'}
            </span>
            <div className="flex items-center gap-2.5 text-right">
              <div>
                <h5 className="font-bold text-xs text-[#0D4A5F]">
                  {isAr ? 'وفر مع الباقات التعليمية' : 'Save with Educational Packages'}
                </h5>
                <p className="text-[10px] text-[#738989]">
                  {isAr ? 'احصل على حصص بأسعار مخفضة' : 'Get sessions at discounted rates'}
                </p>
              </div>
              <Package size={22} className="text-[#A6D388] shrink-0" />
            </div>
          </div>
        )}

        <div className="w-full px-3.5 py-2.5 bg-[#FFF8EE] rounded-[12px] border border-[#FDE68A] text-center">
          <p className="font-medium text-[11.5px] text-[#D97706]">
            {isAr
              ? 'يمكنك تعديل أو إلغاء الموعد وفق سياسة الإلغاء قبل موعد الحصة بـ 24 ساعة'
              : 'You can modify or cancel according to cancellation policy 24 hours prior to session'}
          </p>
        </div>

        <div className="bg-white rounded-[14px] p-3.5 shadow-sm border border-[#0D4A5F]/10 space-y-2.5">
          <p className="font-bold text-sm text-[#0D4A5F]">
            {isAr ? 'طرق الدفع المحفوظة' : 'Saved Payment Methods'}
          </p>

          {savedCards.map((card: any) => (
            <div
              key={card.id}
              onClick={() => { setSelectedSavedCard(card); setShowCardForm(false); }}
              className={`flex items-center justify-between p-3 rounded-[12px] border cursor-pointer transition-all ${
                selectedSavedCard?.id === card.id ? 'border-[#5B9F48] bg-green-50/20' : 'border-[#E6E6E6] hover:border-[#0D4A5F]/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#5E6A6E]" />
                <span className="text-sm font-medium text-[#0D4A5F]">{card.card_brand} **** {card.last4}</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedSavedCard?.id === card.id ? 'border-[#5B9F48]' : 'border-[#8E9BAE]'
              }`}>
                {selectedSavedCard?.id === card.id && <div className="w-2.5 h-2.5 rounded-full bg-[#5B9F48]" />}
              </div>
            </div>
          ))}

          <div
            onClick={() => { setShowCardForm(true); setSelectedSavedCard(null); }}
            className={`flex items-center justify-between p-3 rounded-[12px] border cursor-pointer transition-all ${
              showCardForm ? 'border-[#5B9F48] bg-green-50/20' : 'border-[#E6E6E6] hover:border-[#0D4A5F]/30'
            }`}
          >
            <span className="text-sm font-medium text-[#0D4A5F]">
              {isAr ? 'بطاقة دفع جديدة' : 'New Payment Card'}
            </span>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              showCardForm ? 'border-[#5B9F48]' : 'border-[#8E9BAE]'
            }`}>
              {showCardForm && <div className="w-2.5 h-2.5 rounded-full bg-[#5B9F48]" />}
            </div>
          </div>

          {showCardForm && (
            <div className="p-3 border border-[#E6E6E6] rounded-[12px] space-y-2.5 bg-gray-50/50 mt-2">
              <select
                value={newCard.payment_brand}
                onChange={e => setNewCard({...newCard, payment_brand: e.target.value})}
                className="w-full p-2.5 border border-[#E6E6E6] rounded-[10px] text-sm text-[#0D4A5F] bg-white"
              >
                <option value="VISA">Visa</option>
                <option value="MASTERCARD">Mastercard</option>
                <option value="MADA">Mada</option>
              </select>
              <input
                placeholder={isAr ? 'رقم البطاقة' : 'Card Number'}
                value={newCard.card_number}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setNewCard({...newCard, card_number: val});
                }}
                className="w-full p-2.5 border border-[#E6E6E6] rounded-[10px] text-sm text-[#0D4A5F] bg-white"
              />
              <input
                placeholder={isAr ? 'اسم حامل البطاقة' : 'Card Holder'}
                value={newCard.card_holder}
                onChange={e => setNewCard({...newCard, card_holder: e.target.value})}
                className="w-full p-2.5 border border-[#E6E6E6] rounded-[10px] text-sm text-[#0D4A5F] bg-white"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  placeholder="MM"
                  value={newCard.expiry_month}
                  onChange={e => setNewCard({...newCard, expiry_month: e.target.value})}
                  className="p-2.5 border border-[#E6E6E6] rounded-[10px] text-sm text-center text-[#0D4A5F] bg-white"
                />
                <input
                  placeholder="YY"
                  value={newCard.expiry_year}
                  onChange={e => setNewCard({...newCard, expiry_year: e.target.value})}
                  className="p-2.5 border border-[#E6E6E6] rounded-[10px] text-sm text-center text-[#0D4A5F] bg-white"
                />
                <input
                  placeholder="CVV"
                  value={newCard.cvv}
                  onChange={e => setNewCard({...newCard, cvv: e.target.value})}
                  className="p-2.5 border border-[#E6E6E6] rounded-[10px] text-sm text-center text-[#0D4A5F] bg-white"
                />
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
          <div className="h-16 w-16 bg-[#E7FAF0] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-[#5B9F48]" />
          </div>
          <h2 className="text-xl font-bold text-[#0D4A5F]">
            {language === 'ar' ? 'تم الحجز بنجاح' : 'Booking Successful'}
          </h2>
          <p className="text-[#5E6A6E] mt-2">
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
          <h2 className="text-xl font-bold text-[#0D4A5F]">
            {language === 'ar' ? 'في انتظار تأكيد الدفع' : 'Awaiting Payment Confirmation'}
          </h2>
          <p className="text-[#5E6A6E] mt-2 mb-4">
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
          <h2 className="text-xl font-bold text-[#0D4A5F]">
            {language === 'ar' ? 'في انتظار الدفع' : 'Waiting for Payment'}
          </h2>
          <p className="text-[#5E6A6E] mt-2">
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
        <h2 className="text-xl font-bold text-[#0D4A5F]">
          {language === 'ar' ? 'في انتظار الدفع' : 'Waiting for Payment'}
        </h2>
        <p className="text-[#5E6A6E] mt-2">
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
      case 0: return language === 'ar' ? 'التالي' : 'Next';
      case 1: return language === 'ar' ? 'التالي' : 'Next';
      case 2: return language === 'ar' ? 'الدفع' : 'Pay';
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
        await validateSelectedTimeslots();
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

  const stepHeader = getStepHeaderInfo();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step >= 3 ? (language === 'ar' ? 'الدفع' : 'Payment') : (language === 'ar' ? 'حجز مع المعلم' : 'Book with Teacher')}
    >
      <div className="min-h-[420px] flex flex-col">
        {step < 3 && (
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#0D4A5F]/10">
            <div>
              <h3 className="text-base font-bold text-[#0D4A5F]">{stepHeader.title}</h3>
              <p className="text-xs text-[#5E6A6E] mt-1">{stepHeader.subtitle}</p>
            </div>
            <div className="w-11 h-11 rounded-full border-[2.5px] border-[#A6D388] flex items-center justify-center font-bold text-lg text-[#0D4A5F] shrink-0">
              {step + 1}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start gap-2 text-sm">
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 bg-[#EFF6F4] p-3 rounded-2xl">
          {renderStep()}
        </div>

        {step === 2 ? (
          <div className="mt-4 pt-3 border-t border-[#0D4A5F]/10 space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-[#0D4A5F]">{totalSessions}</span>
              <span className="text-[#738989]">{language === 'ar' ? 'عدد الحصص' : 'Number of sessions'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-[#0D4A5F]">{basePrice.toFixed(2)} {language === 'ar' ? 'ر.س /ساعة' : 'SAR /hr'}</span>
              <span className="text-[#738989]">{language === 'ar' ? 'سعر الحصة' : 'Session price'}</span>
            </div>
            <div className="flex justify-between items-center text-base font-bold">
              <span className="text-[#0D4A5F]">{totalPrice.toFixed(2)} {t.sar || (language === 'ar' ? 'ر.س' : 'SAR')}</span>
              <span className="text-[#0D4A5F]">{language === 'ar' ? 'الاجمالي' : 'Total'}</span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-[52px] px-5 bg-white rounded-[16px] border border-[#E6E6E6] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center justify-center gap-1.5 text-[#171717] font-bold text-sm hover:bg-gray-50 transition-all shrink-0"
              >
                <ChevronLeft size={20} className="text-[#171717]" />
                <span>{language === 'ar' ? 'السابق' : 'Previous'}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="h-[52px] bg-[#5B9F48] hover:bg-[#5B9F48]/90 text-white rounded-[16px] font-bold text-base flex-1 flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(91,159,72,0.2)] disabled:bg-[#D1D5DB] disabled:text-white transition-all"
              >
                {loading && <Loader2 size={18} className="animate-spin text-white" />}
                <span>{language === 'ar' ? 'الدفع' : 'Pay'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 pt-3 border-t border-[#0D4A5F]/10 flex items-center gap-3">
            {step > 0 && step < 3 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="h-[52px] px-5 bg-white rounded-[16px] border border-[#E6E6E6] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center justify-center gap-1.5 text-[#171717] font-bold text-sm hover:bg-gray-50 transition-all shrink-0"
              >
                <ChevronLeft size={20} className="text-[#171717]" />
                <span>{language === 'ar' ? 'السابق' : 'Previous'}</span>
              </button>
            )}

            {step < 3 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="h-[52px] bg-[#5B9F48] hover:bg-[#5B9F48]/90 text-white rounded-[16px] font-bold text-base flex-1 flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(91,159,72,0.2)] disabled:bg-[#D1D5DB] disabled:text-white disabled:cursor-not-allowed transition-all"
              >
                {loading && <Loader2 size={18} className="animate-spin text-white" />}
                <span>{getNextLabel()}</span>
              </button>
            )}

            {step >= 3 && (
              <button
                type="button"
                onClick={onClose}
                className="h-[52px] w-full bg-[#5B9F48] hover:bg-[#5B9F48]/90 text-white rounded-[16px] font-bold text-base shadow-[0_2px_8px_rgba(91,159,72,0.2)] transition-all"
              >
                {language === 'ar' ? 'تم' : 'Done'}
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
