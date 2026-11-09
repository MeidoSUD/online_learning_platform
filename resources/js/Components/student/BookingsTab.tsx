import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  Calendar,
  Clock,
  Loader2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  AlertTriangle,
  ClipboardList,
  CheckCircle,
  Check,
  Star,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { studentService } from '../../Services/api';

const STATUS_FILTERS = [
  { value: 'all', labelAr: 'الكل', labelEn: 'All' },
  { value: 'pending_payment', labelAr: 'بانتظار الدفع', labelEn: 'Pending Payment' },
  { value: 'confirmed', labelAr: 'مؤكد', labelEn: 'Confirmed' },
  { value: 'completed', labelAr: 'مكتمل', labelEn: 'Completed' },
  { value: 'cancelled', labelAr: 'ملغي', labelEn: 'Cancelled' },
] as const;

function getLocalizedDay(dateStr: string, language: string): string {
  if (!dateStr) return '';
  try {
    const raw = dateStr.split('T')[0].split(' ')[0];
    const [y, m, d] = raw.split('-').map(Number);
    const date = y && m && d ? new Date(y, m - 1, d) : new Date(dateStr);
    const dayIndex = date.getDay();
    const daysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return language === 'ar' ? daysAr[dayIndex] : daysEn[dayIndex];
  } catch {
    return dateStr;
  }
}

function formatTime12H(timeStr: string, language: string): string {
  if (!timeStr) return '';
  try {
    let clean = timeStr;
    if (clean.includes('T')) {
      clean = clean.split('T')[1].split('.')[0];
    }
    const parts = clean.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || '0', 10);
    const isAr = language === 'ar';
    const ampm = isAr ? (h >= 12 ? 'م' : 'ص') : (h >= 12 ? 'PM' : 'AM');
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  } catch {
    return timeStr;
  }
}

function formatBookingDate(booking: any, language: string): string {
  const dateStr =
    booking.schedule?.first_session_date ||
    booking.first_session_date ||
    booking.session_info?.first_session_date ||
    booking.booking_date;
  const timeStr =
    booking.schedule?.first_session_time ||
    booking.first_session_start_time ||
    booking.session_info?.first_session_start_time ||
    booking.first_session_time;
  const dayName = getLocalizedDay(dateStr, language);
  const formattedTime = formatTime12H(timeStr, language);
  if (!dayName && !formattedTime) return '';
  if (!formattedTime) return dayName;
  if (!dayName) return formattedTime;
  return language === 'ar' ? `${dayName}، ${formattedTime}` : `${dayName}, ${formattedTime}`;
}

function formatPrice(val: any): string {
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num) || num <= 0) return typeof val === 'string' && val ? val : '0';
  return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
}

function getSubjectName(booking: any, language: string): string {
  if (!booking) return '';
  if (booking.teacher_subject) {
    return language === 'ar'
      ? booking.teacher_subject.name_ar || booking.teacher_subject.name_en
      : booking.teacher_subject.name_en || booking.teacher_subject.name_ar;
  }
  if (typeof booking.subject === 'object' && booking.subject !== null) {
    return language === 'ar'
      ? booking.subject.name_ar ||
          booking.subject.name ||
          booking.subject.title_ar ||
          booking.subject.title ||
          booking.subject.name_en
      : booking.subject.name_en ||
          booking.subject.name ||
          booking.subject.title_en ||
          booking.subject.title ||
          booking.subject.name_ar;
  }
  if (typeof booking.subject === 'string' && booking.subject.trim()) {
    return booking.subject;
  }
  if (booking.language) {
    return language === 'ar'
      ? booking.language.name_ar || booking.language.name_en
      : booking.language.name_en || booking.language.name_ar;
  }
  if (booking.course) {
    return language === 'ar'
      ? booking.course.title_ar ||
          booking.course.name_ar ||
          booking.course.title ||
          booking.course.name
      : booking.course.title_en ||
          booking.course.name_en ||
          booking.course.title ||
          booking.course.name;
  }
  if (booking.service) {
    return language === 'ar'
      ? booking.service.name_ar || booking.service.name_en
      : booking.service.name_en || booking.service.name_ar;
  }
  if (booking.general_service) {
    return language === 'ar'
      ? booking.general_service.title_ar || booking.general_service.name_ar
      : booking.general_service.title_en || booking.general_service.name_en;
  }
  if (booking.service_id === 2) {
    return language === 'ar' ? 'تعلم اللغات' : 'Language Learning';
  }
  if (booking.service_id === 3) {
    return language === 'ar' ? 'الدروس الخصوصية' : 'Private Lessons';
  }
  if (booking.service_id === 6) {
    return language === 'ar' ? 'القدرات والتحصيلي' : 'Abilities and Achievement';
  }
  return language === 'ar' ? 'المادة الدراسية' : 'Subject';
}

function getTeacherDisplayName(teacher: any): string {
  if (!teacher) return '';
  const fullName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim();
  if (fullName.length > 0) return fullName;
  return teacher.name || '';
}

function getStatusBadgeConfig(status: string, language: string) {
  const isAr = language === 'ar';
  switch ((status || '').toLowerCase()) {
    case 'pending_payment':
      return {
        label: isAr ? 'بانتظار الدفع' : 'Pending Payment',
        badgeBg: 'bg-[#FFF6E5]',
        badgeText: 'text-[#F59E0B]',
        bannerBg: 'bg-[#FFFBEB]',
        bannerBorder: 'border-[#FDE68A]',
        bannerText: 'text-[#92400E]',
      };
    case 'confirmed':
      return {
        label: isAr ? 'مؤكد' : 'Confirmed',
        badgeBg: 'bg-[#E8F5E9]',
        badgeText: 'text-[#3D8B37]',
        bannerBg: 'bg-[#F0FDF4]',
        bannerBorder: 'border-[#86EFAC]',
        bannerText: 'text-[#166534]',
      };
    case 'completed':
      return {
        label: isAr ? 'مكتمل' : 'Completed',
        badgeBg: 'bg-[#F1F5F9]',
        badgeText: 'text-[#64748B]',
        bannerBg: 'bg-[#EFF6FF]',
        bannerBorder: 'border-[#93C5FD]',
        bannerText: 'text-[#1E40AF]',
      };
    case 'cancelled':
      return {
        label: isAr ? 'ملغي' : 'Cancelled',
        badgeBg: 'bg-[#FEE2E2]',
        badgeText: 'text-[#EF4444]',
        bannerBg: 'bg-[#FEF2F2]',
        bannerBorder: 'border-[#FCA5A5]',
        bannerText: 'text-[#991B1B]',
      };
    default:
      return {
        label: status || (isAr ? 'غير محدد' : 'Unknown'),
        badgeBg: 'bg-[#F1F5F9]',
        badgeText: 'text-[#0D4A5F]',
        bannerBg: 'bg-[#F8FAFC]',
        bannerBorder: 'border-[#E2E8F0]',
        bannerText: 'text-[#0D4A5F]',
      };
  }
}

function getEmptyStateInfo(filter: string, language: string) {
  const isAr = language === 'ar';
  switch (filter) {
    case 'pending_payment':
      return {
        title: isAr ? 'لا توجد حجوزات بانتظار الدفع' : 'No Pending Payment Bookings',
        desc: isAr
          ? 'لا توجد أي حجوزات بانتظار الدفع حالياً'
          : 'There are currently no bookings pending payment',
      };
    case 'confirmed':
      return {
        title: isAr ? 'لا توجد حجوزات مؤكدة' : 'No Confirmed Bookings',
        desc: isAr ? 'لا توجد أي حجوزات مؤكدة حالياً' : 'There are currently no confirmed bookings',
      };
    case 'completed':
      return {
        title: isAr ? 'لا توجد حجوزات مكتملة' : 'No Completed Bookings',
        desc: isAr
          ? 'لم تكتمل أي حصة تدريسية حتى الآن'
          : 'No teaching sessions have been completed yet',
      };
    case 'cancelled':
      return {
        title: isAr ? 'لا توجد حجوزات ملغية' : 'No Cancelled Bookings',
        desc: isAr ? 'لا توجد أي حجوزات ملغية حالياً' : 'There are currently no cancelled bookings',
      };
    default:
      return {
        title: isAr ? 'لا توجد حجوزات مؤكدة' : 'No Bookings Found',
        desc: isAr ? 'لا توجد أي حجوزات مؤكدة حالياً' : 'There are currently no bookings found',
      };
  }
}

export const BookingsTab: React.FC<{ onViewCalendar?: () => void }> = ({ onViewCalendar }) => {
  const { language, direction } = useLanguage();
  const isAr = language === 'ar';
  const ChevronPrev = direction === 'rtl' ? ChevronRight : ChevronLeft;
  const ChevronNext = direction === 'rtl' ? ChevronLeft : ChevronRight;
  const ChevronBack = direction === 'rtl' ? ChevronRight : ChevronLeft;

  const [filter, setFilter] = useState<string>('all');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [alertNotice, setAlertNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadBookings = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage(null);

      try {
        const result = await studentService.getBookingsPaginated(filter, page, 10);
        const rawList =
          result?.bookings ??
          result?.data?.data ??
          result?.data ??
          result;
        const list = Array.isArray(rawList)
          ? rawList
          : (Array.isArray(rawList?.data) ? rawList.data : []);
        setBookings(list);
        setPagination(result?.pagination || { current_page: 1, last_page: 1, total: list.length });
      } catch (e: any) {
        setErrorMessage(
          isAr
            ? e.message_ar || e.message || 'فشل في تحميل الحجوزات'
            : e.message || 'Failed to load bookings'
        );
        setBookings([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter, page, isAr]
  );

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleOpenDetails = async (booking: any) => {
    setSelectedBooking(booking);
    setLoadingDetails(true);

    try {
      const details = await studentService.getBookingDetails(booking.id);
      if (details) {
        setSelectedBooking(details);
      }
    } catch {
      setSelectedBooking(booking);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!confirmCancelId) return;
    setCancelling(true);

    try {
      await studentService.cancelBooking(confirmCancelId);
      setAlertNotice({
        type: 'success',
        message: isAr ? 'تم إلغاء الحجز بنجاح' : 'Booking cancelled successfully',
      });
      setConfirmCancelId(null);
      setSelectedBooking(null);
      loadBookings(true);
    } catch (e: any) {
      setAlertNotice({
        type: 'error',
        message: isAr
          ? e.message_ar || e.message || 'فشل إلغاء الحجز'
          : e.message || 'Failed to cancel booking',
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleInitiatePayment = async (booking: any) => {
    setPaying(true);
    try {
      const checkoutRes = await studentService.createCheckout({ booking_id: booking.id });
      if (checkoutRes?.data?.redirect_url) {
        window.location.href = checkoutRes.data.redirect_url;
      } else {
        throw new Error(isAr ? 'تعذر إنشاء رابط بوابة الدفع' : 'Payment redirect unavailable');
      }
    } catch (e: any) {
      setAlertNotice({
        type: 'error',
        message: isAr
          ? e.message_ar || e.message || 'فشل إتمام الدفع'
          : e.message || 'Payment initiation failed',
      });
      setPaying(false);
    }
  };

  if (selectedBooking !== null) {
    const b = selectedBooking;
    const isPendingPayment = (b.status || '').toLowerCase() === 'pending_payment';
    const statusCfg = getStatusBadgeConfig(b.status, language);
    const teacherName = getTeacherDisplayName(b.teacher);
    const teacherPhoto =
      b.teacher?.profile?.profile_photo ||
      b.teacher?.profile_photo ||
      b.teacher?.avatar ||
      b.teacher?.image;
    const subjectName = getSubjectName(b, language);
    const lessonType = b.session_info?.type || b.type || 'single';
    const displayLessonType =
      lessonType === 'group'
        ? isAr
          ? 'حصة جماعية'
          : 'Group Lesson'
        : isAr
        ? 'حصة فردية'
        : 'Single Lesson';

    const dateStr =
      b.schedule?.first_session_date ||
      b.first_session_date ||
      b.session_info?.first_session_date ||
      b.booking_date;
    const timeStr =
      b.schedule?.first_session_time ||
      b.first_session_start_time ||
      b.session_info?.first_session_start_time ||
      b.first_session_time;
    const dayName = getLocalizedDay(dateStr, language);
    const timeFormatted = formatTime12H(timeStr, language);

    const priceVal = b.pricing?.total_amount || b.total_amount || b.price || '0';
    const priceFormatted = formatPrice(priceVal);
    const pricePerSession = b.pricing?.price_per_session
      ? formatPrice(b.pricing.price_per_session)
      : priceFormatted;

    const totalSessions =
      b.session_info?.total_sessions ||
      b.sessions_count ||
      (Array.isArray(b.sessions) ? b.sessions.length : 1);

    const canCancel =
      b.can_cancel ??
      (b.status !== 'cancelled' && b.status !== 'completed');

    const title = isPendingPayment
      ? isAr
        ? 'تأكيد الحجز'
        : 'Booking Confirmation'
      : isAr
      ? 'تفاصيل الحجز'
      : 'Booking Details';

    return (
      <div className="min-h-[85vh] bg-[#EFF6F4] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 animate-fade-in flex flex-col justify-between" dir={direction}>
        <div className="max-w-xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setSelectedBooking(null)}
              className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-[#0D4A5F] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronBack size={22} />
            </button>
            <h1 className="text-lg font-bold text-[#0D4A5F]">{title}</h1>
            <div className="w-10 h-10" />
          </div>

          {loadingDetails ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-12 bg-white rounded-xl" />
              <div className="h-20 bg-white rounded-2xl" />
              <div className="grid grid-cols-2 gap-2.5">
                <div className="h-16 bg-white rounded-xl" />
                <div className="h-16 bg-white rounded-xl" />
              </div>
              <div className="h-16 bg-white rounded-xl" />
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${statusCfg.bannerBg} ${statusCfg.bannerBorder}`}
              >
                <div className="flex items-center gap-2">
                  {b.status === 'confirmed' && (
                    <CheckCircle size={19} className={statusCfg.bannerText} />
                  )}
                  {b.status === 'completed' && (
                    <Check size={19} className={statusCfg.bannerText} />
                  )}
                  {b.status === 'cancelled' && (
                    <XCircle size={19} className={statusCfg.bannerText} />
                  )}
                  {b.status === 'pending_payment' && (
                    <Clock size={19} className={statusCfg.bannerText} />
                  )}
                  <span className={`text-sm font-bold ${statusCfg.bannerText}`}>
                    {statusCfg.label}
                  </span>
                </div>
                <span className={`text-xs ${statusCfg.bannerText} opacity-80 font-medium`}>
                  {isAr ? 'حالة الحجز' : 'Booking Status'}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-[#F1F5F9] flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                    {teacherPhoto && !teacherPhoto.toLowerCase().endsWith('.pdf') ? (
                      <img
                        src={teacherPhoto}
                        alt={teacherName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-base font-bold text-[#0D4A5F]">
                        {teacherName ? teacherName.charAt(0) : 'T'}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[#0D4A5F] truncate">
                      {teacherName || (isAr ? 'معلم إيوان' : 'Ewan Teacher')}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#64748B]">
                      <span className="flex items-center gap-1 font-bold text-[#171717]">
                        <Star size={14} className="text-[#F59E0B] fill-[#F59E0B]" /> 4.8
                      </span>
                      <span className="flex items-center gap-1 text-[#64748B] truncate">
                        <BookOpen size={14} className="text-[#0D4A5F] shrink-0" />
                        <span className="truncate">{subjectName}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-bold text-[#0D4A5F] mb-2">
                  {isAr ? 'تفاصيل الحصة' : 'Session Details'}
                </h5>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-white p-3 rounded-xl border border-[#F1F5F9] shadow-sm">
                    <p className="text-[11px] text-[#94A3B8]">
                      {isAr ? 'نوع الحصة' : 'Lesson Type'}
                    </p>
                    <p className="text-[13px] font-bold text-[#0D4A5F] mt-1 truncate">
                      {displayLessonType}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#F1F5F9] shadow-sm">
                    <p className="text-[11px] text-[#94A3B8]">
                      {isAr ? 'المادة' : 'Subject'}
                    </p>
                    <p className="text-[13px] font-bold text-[#0D4A5F] mt-1 truncate">
                      {subjectName}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-bold text-[#0D4A5F]">
                    {totalSessions > 1
                      ? isAr
                        ? 'المواعيد المختارة'
                        : 'Selected Appointments'
                      : isAr
                      ? 'الموعد المحدد'
                      : 'Selected Appointment'}
                  </h5>
                  {totalSessions > 1 && (
                    <span className="bg-[#A6D388] text-[#144D25] text-xs font-bold px-2.5 py-1 rounded-lg">
                      {totalSessions} {isAr ? 'حصص' : 'Sessions'}
                    </span>
                  )}
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#F1F5F9] shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#0D4A5F] font-medium">{dayName || '-'}</p>
                    <p className="text-xs font-bold text-[#0D4A5F] mt-0.5">
                      {timeFormatted || '-'}
                    </p>
                  </div>
                  <Clock size={22} className="text-[#0D4A5F]" />
                </div>
              </div>

              {Array.isArray(b.sessions) && b.sessions.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-bold text-[#0D4A5F]">
                    {isAr ? 'جدول الجلسات' : 'Sessions Schedule'}
                  </h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {b.sessions.map((sess: any) => (
                      <div
                        key={sess.id}
                        className="bg-white p-2.5 rounded-xl border border-[#F1F5F9] shadow-sm flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0D4A5F]">
                            {isAr ? `جلسة ${sess.session_number}` : `Session ${sess.session_number}`}
                          </span>
                          <span className="text-[#94A3B8]">|</span>
                          <span className="text-[#64748B]">{sess.session_date}</span>
                          <span className="text-[#64748B]">{formatTime12H(sess.start_time, language)}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            sess.status === 'completed'
                              ? 'bg-[#E8F5E9] text-[#3D8B37]'
                              : sess.status === 'cancelled'
                              ? 'bg-[#FEE2E2] text-[#EF4444]'
                              : 'bg-[#EFF6FF] text-[#1E40AF]'
                          }`}
                        >
                          {sess.status === 'completed'
                            ? isAr ? 'مكتملة' : 'Completed'
                            : sess.status === 'cancelled'
                            ? isAr ? 'ملغاة' : 'Cancelled'
                            : isAr ? 'قادمة' : 'Upcoming'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-[#FFF8EE] border border-[#FDE68A] p-3 rounded-xl text-center">
                <p className="text-xs text-[#D97706] font-medium leading-relaxed">
                  {isAr
                    ? 'يمكنك تعديل أو إلغاء الموعد وفق سياسة الإلغاء قبل موعد الحصة بـ 24 ساعة'
                    : 'You can reschedule or cancel according to the policy 24 hours before session time'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-xl mx-auto w-full pt-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#F1F5F9] space-y-3">
            {isPendingPayment && totalSessions > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#94A3B8]">
                  {isAr ? 'عدد الحصص' : 'Number of Sessions'}
                </span>
                <span className="font-bold text-[#0D4A5F]">{totalSessions}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#94A3B8]">
                {isAr ? 'سعر الحصة' : 'Session Price'}
              </span>
              <span className="font-bold text-[#0D4A5F]">
                {pricePerSession} {isAr ? '﷼/ساعة' : 'SAR/hr'}
              </span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="font-bold text-[#0D4A5F]">
                {isAr ? 'الاجمالي' : 'Total Amount'}
              </span>
              <span className="font-bold text-[#0D4A5F] text-lg">{priceFormatted} ﷼</span>
            </div>

            <div className="space-y-2 pt-2">
              {isPendingPayment ? (
                <Button
                  onClick={() => handleInitiatePayment(b)}
                  className="w-full h-12 bg-[#5B9F48] hover:bg-[#4a843a] text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2"
                  isLoading={paying}
                >
                  <CreditCard size={18} />
                  {isAr ? 'الدفع' : 'Pay'}
                </Button>
              ) : (
                <Button
                  onClick={() => setSelectedBooking(null)}
                  className="w-full h-12 bg-[#5B9F48] hover:bg-[#4a843a] text-white rounded-2xl font-bold text-base"
                >
                  {isAr ? 'العودة' : 'Back'}
                </Button>
              )}

              {canCancel && (
                <Button
                  onClick={() => setConfirmCancelId(b.id)}
                  variant="outline"
                  className="w-full h-11 text-red-600 border-red-200 hover:bg-red-50 rounded-2xl font-bold flex items-center justify-center gap-2"
                >
                  <XCircle size={18} />
                  {isAr ? 'إلغاء الحجز' : 'Cancel Booking'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <Modal
          isOpen={!!confirmCancelId}
          onClose={() => setConfirmCancelId(null)}
          title={isAr ? 'إلغاء الحجز' : 'Cancel Booking'}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-3 p-3.5 bg-red-50 text-red-700 rounded-xl border border-red-100">
              <AlertTriangle size={24} className="shrink-0" />
              <p className="text-sm font-medium leading-relaxed">
                {isAr
                  ? 'هل أنت متأكد من إلغاء هذا الحجز؟'
                  : 'Are you sure you want to cancel this booking?'}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => setConfirmCancelId(null)}
                variant="outline"
                className="flex-1 py-2.5 rounded-xl border-slate-200"
                disabled={cancelling}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={handleConfirmCancel}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold"
                isLoading={cancelling}
              >
                {isAr ? 'تأكيد' : 'Confirm'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  const displayedBookings =
    filter === 'all'
      ? bookings
      : bookings.filter(
          (b: any) => (b.status || '').toLowerCase() === filter.toLowerCase()
        );

  const emptyInfo = getEmptyStateInfo(filter, language);

  return (
    <div className="space-y-4 animate-fade-in w-full max-w-4xl mx-auto" dir={direction}>
      {alertNotice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
            alertNotice.type === 'success'
              ? 'bg-[#E8F5E9] border-[#86EFAC] text-[#166534]'
              : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]'
          }`}
        >
          <span className="text-sm font-medium">{alertNotice.message}</span>
          <button
            onClick={() => setAlertNotice(null)}
            className="text-xs underline font-bold px-2 py-1"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <h2 className="text-xl md:text-2xl font-bold text-[#0D4A5F]">
          {isAr ? 'الحجوزات' : 'My Bookings'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadBookings(true)}
            disabled={loading || refreshing}
            className="p-2 rounded-xl bg-white border border-[#F1F5F9] shadow-sm text-[#0D4A5F] hover:bg-slate-50 transition-colors disabled:opacity-50"
            title={isAr ? 'تحديث' : 'Refresh'}
          >
            <RefreshCw size={17} className={refreshing ? 'animate-spin' : ''} />
          </button>
          {onViewCalendar && (
            <Button
              variant="outline"
              onClick={onViewCalendar}
              size="sm"
              className="text-xs h-9 rounded-xl border-[#0D4A5F]/20 text-[#0D4A5F] hover:bg-[#0D4A5F]/5"
            >
              <Calendar size={15} className="mr-1.5" />
              {isAr ? 'عرض التقويم' : 'View Calendar'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide">
        {STATUS_FILTERS.map((s) => {
          const isSelected = filter === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => {
                setFilter(s.value);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full text-[13px] whitespace-nowrap transition-all duration-200 ${
                isSelected
                  ? 'bg-[#0D4A5F] text-white font-bold shadow-[0_3px_8px_rgba(13,74,95,0.2)]'
                  : 'bg-white text-[#0D4A5F] font-medium shadow-[0_2px_6px_rgba(0,0,0,0.03)] hover:bg-slate-50'
              }`}
            >
              {isAr ? s.labelAr : s.labelEn}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-[#F1F5F9] shadow-[0_4px_10px_rgba(0,0,0,0.04)] p-3 space-y-3 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="w-20 h-6 bg-slate-200 rounded-xl" />
                <div className="flex items-center gap-2.5">
                  <div className="space-y-1.5 text-right">
                    <div className="w-24 h-3.5 bg-slate-200 rounded" />
                    <div className="w-16 h-3 bg-slate-100 rounded" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                </div>
              </div>
              <div className="border-t border-[#F1F5F9]" />
              <div className="flex items-center justify-between">
                <div className="w-16 h-4 bg-slate-200 rounded" />
                <div className="w-20 h-4 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && errorMessage && (
        <div className="py-12 text-center space-y-4 bg-white rounded-2xl border border-red-100 p-6">
          <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
          <Button
            onClick={() => loadBookings()}
            className="bg-[#5B9F48] hover:bg-[#4a843a] text-white text-xs px-5 py-2 rounded-xl"
          >
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      )}

      {!loading && !errorMessage && displayedBookings.length === 0 && (
        <div className="py-16 px-4 text-center">
          <div className="w-[120px] h-[120px] rounded-[32px] bg-[#DCE5EA]/50 flex items-center justify-center mx-auto mb-6">
            <ClipboardList size={54} className="text-[#0D4A5F]" />
          </div>
          <h3 className="text-lg font-bold text-[#0D4A5F] mb-2">{emptyInfo.title}</h3>
          <p className="text-sm text-[#64748B] max-w-sm mx-auto">{emptyInfo.desc}</p>
        </div>
      )}

      {!loading && !errorMessage && displayedBookings.length > 0 && (
        <div className="space-y-3">
          {displayedBookings.map((booking: any) => {
            const teacherName = getTeacherDisplayName(booking.teacher);
            const teacherPhoto =
              booking.teacher?.profile?.profile_photo ||
              booking.teacher?.profile_photo ||
              booking.teacher?.avatar ||
              booking.teacher?.image;
            const price = booking.pricing?.total_amount || booking.total_amount || booking.price || '0';
            const priceFormatted = formatPrice(price);
            const bookingDateStr = formatBookingDate(booking, language);
            const statusConfig = getStatusBadgeConfig(booking.status, language);

            return (
              <div
                key={booking.id}
                onClick={() => handleOpenDetails(booking)}
                className="bg-white rounded-xl border border-[#F1F5F9] shadow-[0_4px_10px_rgba(0,0,0,0.04)] p-3 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-black/5 overflow-hidden shrink-0 flex items-center justify-center border border-slate-100">
                      {teacherPhoto && !teacherPhoto.toLowerCase().endsWith('.pdf') ? (
                        <img
                          src={teacherPhoto}
                          alt={teacherName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-[#0D4A5F]">
                          {teacherName ? teacherName.charAt(0) : 'T'}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-[#0D4A5F] truncate">
                        {teacherName || (isAr ? 'معلم إيوان' : 'Ewan Teacher')}
                      </h3>
                      {bookingDateStr && (
                        <div className="flex items-center gap-1 text-xs text-[#64748B] mt-0.5">
                          <Clock size={12} className="shrink-0 text-[#64748B]" />
                          <span className="truncate">{bookingDateStr}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 ${statusConfig.badgeBg} ${statusConfig.badgeText}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>

                <div className="border-t border-[#F1F5F9] my-2.5" />

                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#94A3B8]">
                    {isAr ? 'السعر الإجمالي' : 'Total Price'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-base font-bold text-[#0D4A5F]">{priceFormatted}</span>
                    <span className="text-xs font-bold text-[#0D4A5F]">﷼</span>
                    <span className="text-xs font-medium text-[#0D4A5F]">
                      {isAr ? '/ساعة' : '/hr'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-3 pt-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-xl bg-white border border-[#F1F5F9] shadow-sm text-[#0D4A5F] hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ChevronPrev size={18} />
          </button>
          <span className="text-xs font-bold text-[#64748B]">
            {pagination.current_page} / {pagination.last_page}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
            disabled={page >= pagination.last_page}
            className="p-2 rounded-xl bg-white border border-[#F1F5F9] shadow-sm text-[#0D4A5F] hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            <ChevronNext size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
