import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  Search,
  Calendar,
  Clock,
  User,
  Loader2,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  CheckCircle2,
  Hourglass,
  Star,
  BookOpen,
  ClipboardList,
  Video,
  X,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { studentService } from '../../Services/api';

const DAYS_AR: Record<number, string> = {
  0: 'الأحد',
  1: 'الإثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

const STATUS_TABS = [
  { value: 'all', label: 'الكل' },
  { value: 'pending_payment', label: 'في انتظار الدفع' },
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' },
];

const formatBookingDay = (dateStr?: string, fallbackDay?: string): string => {
  if (!dateStr) return fallbackDay || 'الأحد';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallbackDay || 'الأحد';
    return DAYS_AR[d.getDay()] || fallbackDay || 'الأحد';
  } catch {
    return fallbackDay || 'الأحد';
  }
};

const formatTimeTo12Hour = (timeStr?: string): string => {
  if (!timeStr) return '';
  try {
    const parts = timeStr.trim().split(':');
    if (parts.length >= 2) {
      let h = parseInt(parts[0], 10);
      const m = parts[1];
      if (isNaN(h)) return timeStr;
      const period = h >= 12 ? 'م' : 'ص';
      h = h % 12 || 12;
      return `${h}:${m} ${period}`;
    }
    return timeStr;
  } catch {
    return timeStr;
  }
};

const formatFullBookingDate = (dateStr?: string, timeStr?: string, fallbackDay?: string): string => {
  const day = formatBookingDay(dateStr, fallbackDay);
  const time = formatTimeTo12Hour(timeStr);
  if (day && time) return `${day}، ${time}`;
  return day || time || '';
};

const getTeacherPhoto = (teacher: any): string | null => {
  const photo = teacher?.profile_photo || teacher?.profile?.profile_photo || teacher?.image || teacher?.avatar;
  if (!photo || typeof photo !== 'string') return null;
  const trimmed = photo.trim();
  if (trimmed.toLowerCase().endsWith('.pdf')) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `/storage/${trimmed.replace(/^\//, '')}`;
};

export const BookingsTab: React.FC<{ onViewCalendar?: () => void }> = ({ onViewCalendar }) => {
  const { direction, language } = useLanguage();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  const [activeModal, setActiveModal] = useState<'preview' | 'details' | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [confirmCancelBookingId, setConfirmCancelBookingId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();
  }, [filter, page]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const result = await studentService.getBookingsPaginated(filter, page, 10);
      setBookings(Array.isArray(result.bookings) ? result.bookings : []);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (booking: any) => {
    setSelectedBooking(booking);
    setPaymentError(null);
    if ((booking.status || '').toLowerCase() === 'pending_payment') {
      setActiveModal('preview');
    } else {
      setActiveModal('details');
    }
  };

  const handleConfirmCancel = async () => {
    if (!confirmCancelBookingId) return;
    setCancelling(true);
    try {
      await studentService.cancelBooking(confirmCancelBookingId);
      setConfirmCancelBookingId(null);
      setActiveModal(null);
      setSelectedBooking(null);
      loadBookings();
    } catch {
      alert(language === 'ar' ? 'فشل إلغاء الحجز' : 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const handleProceedPayment = async (booking: any) => {
    if (!booking?.id) return;
    setPaying(true);
    setPaymentError(null);
    try {
      const checkoutRes = await studentService.createCheckout({ booking_id: booking.id });
      const redirectUrl = checkoutRes?.data?.redirect_url || checkoutRes?.redirect_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        throw new Error('No redirect URL');
      }
    } catch {
      setPaymentError(language === 'ar' ? 'فشل إتمام عملية الدفع، يُرجى المحاولة لاحقاً' : 'Payment failed, please try again later');
      setPaying(false);
    }
  };

  const filteredBookings = useMemo(() => {
    let list = bookings;
    if (filter && filter !== 'all') {
      list = list.filter((b: any) => (b.status || '').toLowerCase() === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b: any) => {
        const teacherName = b.teacher ? `${b.teacher.first_name || ''} ${b.teacher.last_name || ''} ${b.teacher.name || ''}` : '';
        const subjectName = b.subject?.name_ar || b.subject?.name_en || b.subject?.name || b.course?.name || b.course?.title_ar || '';
        return teacherName.toLowerCase().includes(q) || subjectName.toLowerCase().includes(q);
      });
    }
    return list;
  }, [bookings, filter, search]);

  const renderStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    let bg = 'bg-[#F1F5F9]';
    let text = 'text-[#0D4A5F]';
    let label = status;

    if (s === 'pending_payment') {
      bg = 'bg-[#FFF6E5]';
      text = 'text-[#F59E0B]';
      label = 'في انتظار الدفع';
    } else if (s === 'confirmed') {
      bg = 'bg-[#E8F5E9]';
      text = 'text-[#5B9F48]';
      label = 'مؤكد';
    } else if (s === 'completed') {
      bg = 'bg-[#F1F5F9]';
      text = 'text-[#64748B]';
      label = 'مكتمل';
    } else if (s === 'cancelled') {
      bg = 'bg-[#FEE2E2]';
      text = 'text-[#EF4444]';
      label = 'ملغي';
    }

    return (
      <span className={`px-3 py-1 rounded-[12px] text-xs font-bold whitespace-nowrap ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  const getEmptyStateText = (selectedStatus: string) => {
    switch (selectedStatus) {
      case 'pending_payment':
        return {
          title: 'لا توجد حجوزات في انتظار الدفع',
          desc: 'لا توجد حجوزات قيد الانتظار حالياً',
        };
      case 'confirmed':
        return {
          title: 'لا توجد حجوزات مؤكدة',
          desc: 'لا توجد حجوزات مؤكدة حالياً',
        };
      case 'completed':
        return {
          title: 'لا توجد حجوزات مكتملة',
          desc: 'لا توجد حجوزات مكتملة حالياً',
        };
      case 'cancelled':
        return {
          title: 'لا توجد حجوزات ملغية',
          desc: 'لا توجد حجوزات ملغية حالياً',
        };
      default:
        return {
          title: 'لا توجد حجوزات',
          desc: 'ستظهر حجوزاتك ومواعيدك هنا فور إتمام الحجز',
        };
    }
  };

  const emptyText = getEmptyStateText(filter);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-[#0D4A5F]">
          {language === 'ar' ? 'حجوزاتي' : 'My Bookings'}
        </h2>
        {onViewCalendar && (
          <Button variant="outline" onClick={onViewCalendar} size="sm" className="rounded-xl border-[#0D4A5F]/20 text-[#0D4A5F]">
            <Calendar size={15} className={direction === 'rtl' ? 'ml-1.5' : 'mr-1.5'} />
            {language === 'ar' ? 'عرض التقويم' : 'View Calendar'}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide py-1">
        {STATUS_TABS.map((tab) => {
          const isSelected = filter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setFilter(tab.value);
                setPage(1);
              }}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                isSelected
                  ? 'bg-[#0D4A5F] text-white font-bold shadow-md shadow-[#0D4A5F]/20'
                  : 'bg-white text-[#0D4A5F] font-medium border border-[#F1F5F9] shadow-[0_2px_6px_rgba(0,0,0,0.03)] hover:bg-[#F8FAFC]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search
          className={`absolute top-1/2 -translate-y-1/2 text-[#64748B] ${
            direction === 'rtl' ? 'right-3.5' : 'left-3.5'
          }`}
          size={16}
        />
        <input
          type="text"
          placeholder={language === 'ar' ? 'ابحث باسم المعلم أو المادة...' : 'Search teacher or subject...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full py-2.5 rounded-xl bg-white border border-[#F1F5F9] text-sm text-[#0D4A5F] placeholder-[#94A3B8] shadow-sm focus:outline-none focus:border-[#0D4A5F] transition-all ${
            direction === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'
          }`}
        />
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-[12px] border border-[#F1F5F9] p-3 shadow-sm animate-pulse flex flex-col justify-between gap-3 min-h-[117px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
                <div className="h-6 bg-slate-200 rounded-[12px] w-20" />
              </div>
              <div className="border-t border-[#F1F5F9]" />
              <div className="flex items-center justify-between">
                <div className="h-3 bg-slate-100 rounded w-20" />
                <div className="h-4 bg-slate-200 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredBookings.length === 0 && (
        <div className="py-16 px-4 bg-white/60 rounded-2xl border border-[#F1F5F9] flex flex-col items-center justify-center text-center">
          <div className="w-[120px] h-[120px] rounded-[32px] bg-[#DCE5EA]/50 flex items-center justify-center text-[#0D4A5F] mb-6">
            <ClipboardList size={54} strokeWidth={1.75} />
          </div>
          <h3 className="text-lg font-bold text-[#0D4A5F] mb-2">
            {emptyText.title}
          </h3>
          <p className="text-sm text-[#64748B] max-w-sm">
            {emptyText.desc}
          </p>
        </div>
      )}

      {!loading && filteredBookings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredBookings.map((booking: any) => {
            const rawTeacherName = booking.teacher
              ? `${booking.teacher.first_name || ''} ${booking.teacher.last_name || ''}`.trim() || booking.teacher.name
              : '';
            const teacherName = rawTeacherName || (language === 'ar' ? 'معلم إيوان' : 'Teacher');
            const photo = getTeacherPhoto(booking.teacher);

            const sessionDate = booking.schedule?.first_session_date || booking.first_session_date;
            const sessionTime = booking.schedule?.first_session_time || booking.first_session_start_time;
            const dateText = formatFullBookingDate(sessionDate, sessionTime, booking.day);

            const rawPrice = Number(booking.pricing?.total_amount || booking.price || 0);
            const formattedPrice = rawPrice > 0
              ? rawPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
              : (booking.pricing?.total_amount || booking.price || '0');

            return (
              <div
                key={booking.id}
                onClick={() => handleCardClick(booking)}
                className="bg-white rounded-[12px] border border-[#F1F5F9] p-3 shadow-[0_4px_10px_rgba(0,0,0,0.04)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[117px] gap-2.5"
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[#171717]/5 shrink-0 overflow-hidden flex items-center justify-center">
                      {photo ? (
                        <img src={photo} alt={teacherName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="text-[#0D4A5F]" size={20} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-[#0D4A5F] truncate">
                        {teacherName}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-[#64748B] mt-0.5 truncate">
                        <Clock size={12} className="shrink-0 text-[#64748B]" />
                        <span className="truncate">{dateText}</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {renderStatusBadge(booking.status)}
                  </div>
                </div>

                <div className="border-t border-[#F1F5F9]" />

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8] font-normal">
                    {language === 'ar' ? 'المبلغ الإجمالي' : 'Total Price'}
                  </span>
                  <div className="flex items-center gap-1 text-[#0D4A5F]">
                    <span className="text-base font-bold">
                      {formattedPrice}
                    </span>
                    <span className="font-bold text-xs">﷼</span>
                    <span className="text-xs font-medium">/ ساعة</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-2 rounded-xl border border-[#F1F5F9] bg-white text-[#0D4A5F] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-medium text-[#64748B] px-2">
            {pagination.current_page} / {pagination.last_page}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
            disabled={page >= pagination.last_page}
            className="p-2 rounded-xl border border-[#F1F5F9] bg-white text-[#0D4A5F] hover:bg-[#F8FAFC] disabled:opacity-40 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <Modal
        isOpen={activeModal === 'preview'}
        onClose={() => setActiveModal(null)}
        title={language === 'ar' ? 'معاينة الحجز' : 'Booking Preview'}
        maxWidth="max-w-lg"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#92400E] font-bold">
                <Hourglass size={16} />
                <span>{language === 'ar' ? 'في انتظار الدفع' : 'Pending Payment'}</span>
              </div>
              <span className="text-[#92400E]/80">
                {language === 'ar' ? 'حالة الحجز' : 'Status'}
              </span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-[#F1F5F9] shadow-sm flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-[#0D4A5F] text-base truncate">
                  {selectedBooking.teacher
                    ? `${selectedBooking.teacher.first_name || ''} ${selectedBooking.teacher.last_name || ''}`.trim() || selectedBooking.teacher.name
                    : (language === 'ar' ? 'معلم إيوان' : 'Teacher')}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#64748B]">
                  <div className="flex items-center gap-1 text-[#F59E0B] font-bold">
                    <Star size={13} fill="#F59E0B" />
                    <span>4.8</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 truncate text-[#738989]">
                    <BookOpen size={13} />
                    <span className="truncate">
                      {selectedBooking.subject?.name_ar || selectedBooking.subject?.name_en || selectedBooking.course?.name || selectedBooking.course?.title_ar || (language === 'ar' ? 'المادة الدراسية' : 'General Subject')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#171717]/5 shrink-0 flex items-center justify-center">
                {getTeacherPhoto(selectedBooking.teacher) ? (
                  <img
                    src={getTeacherPhoto(selectedBooking.teacher)!}
                    alt="Teacher"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="text-[#0D4A5F]" size={22} />
                )}
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold text-[#0D4A5F] mb-2">
                {language === 'ar' ? 'تفاصيل الحصة' : 'Session Details'}
              </h5>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-white rounded-xl border border-[#F1F5F9] shadow-sm text-right">
                  <span className="text-[11px] text-[#738989] block">
                    {language === 'ar' ? 'نوع الحصة' : 'Session Type'}
                  </span>
                  <span className="text-xs font-bold text-[#0D4A5F] mt-1 block truncate">
                    {selectedBooking.session_info?.type === 'package'
                      ? (language === 'ar' ? 'باقة تعليمية' : 'Package')
                      : selectedBooking.session_info?.type === 'group'
                      ? (language === 'ar' ? 'حصة جماعية' : 'Group Lesson')
                      : (language === 'ar' ? 'حصة فردية' : 'Single Lesson')}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#F1F5F9] shadow-sm text-right">
                  <span className="text-[11px] text-[#738989] block">
                    {language === 'ar' ? 'المادة' : 'Subject'}
                  </span>
                  <span className="text-xs font-bold text-[#0D4A5F] mt-1 block truncate">
                    {selectedBooking.subject?.name_ar || selectedBooking.subject?.name_en || selectedBooking.course?.name || selectedBooking.course?.title_ar || (language === 'ar' ? 'المادة الدراسية' : 'Subject')}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold text-[#0D4A5F] mb-2">
                {language === 'ar' ? 'الموعد المحدد' : 'Selected Appointment'}
              </h5>
              <div className="p-3 bg-white rounded-xl border border-[#F1F5F9] shadow-sm flex items-center justify-between text-right">
                <div className="flex-1">
                  <div className="text-xs font-medium text-[#0D4A5F]">
                    {formatBookingDay(selectedBooking.schedule?.first_session_date || selectedBooking.first_session_date, selectedBooking.day)}
                  </div>
                  <div className="text-xs font-bold text-[#0D4A5F] mt-0.5">
                    {formatTimeTo12Hour(selectedBooking.schedule?.first_session_time || selectedBooking.first_session_start_time)}
                  </div>
                </div>
                <Clock className="text-[#0D4A5F] shrink-0" size={20} />
              </div>
            </div>

            <div className="p-3 bg-[#FFF8EE] border border-[#FDE68A] rounded-xl text-center text-xs text-[#D97706] font-medium leading-relaxed">
              {language === 'ar'
                ? 'يمكنك تعديل أو إلغاء الموعد وفق سياسة الإلغاء قبل موعد الحصة بـ 24 ساعة'
                : 'You can modify or cancel the appointment 24 hours prior according to cancellation policy'}
            </div>

            {paymentError && (
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-xs text-center border border-red-200">
                {paymentError}
              </div>
            )}

            <div className="pt-2 border-t border-[#F1F5F9] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#738989]">
                <span>{language === 'ar' ? 'سعر الحصة' : 'Session Price'}</span>
                <span className="font-bold text-[#0D4A5F]">
                  {selectedBooking.pricing?.total_amount || selectedBooking.price || '0'} ﷼ / ساعة
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-[#0D4A5F]">
                <span>{language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}</span>
                <span className="text-base text-[#5B9F48]">
                  {selectedBooking.pricing?.total_amount || selectedBooking.price || '0'} ﷼
                </span>
              </div>

              <div className="pt-3 space-y-2">
                <Button
                  onClick={() => handleProceedPayment(selectedBooking)}
                  isLoading={paying}
                  className="w-full h-11 bg-[#5B9F48] hover:bg-[#4d863d] text-white rounded-xl font-bold text-sm shadow-md shadow-[#5B9F48]/20"
                >
                  <CreditCard size={16} className={direction === 'rtl' ? 'ml-2' : 'mr-2'} />
                  {language === 'ar' ? 'إتمام الدفع' : 'Pay Now'}
                </Button>

                {selectedBooking.can_cancel !== false && (
                  <button
                    onClick={() => setConfirmCancelBookingId(selectedBooking.id)}
                    className="w-full py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    {language === 'ar' ? 'إلغاء هذا الحجز' : 'Cancel Booking'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={activeModal === 'details'}
        onClose={() => setActiveModal(null)}
        title={language === 'ar' ? 'تفاصيل الحجز' : 'Booking Details'}
        maxWidth="max-w-lg"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#166534] font-bold">
                <CheckCircle2 size={16} />
                <span>{renderStatusBadge(selectedBooking.status)}</span>
              </div>
              <span className="text-[#166534]/80">
                {language === 'ar' ? 'حالة الحجز' : 'Status'}
              </span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-[#F1F5F9] shadow-sm flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-[#0D4A5F] text-base truncate">
                  {selectedBooking.teacher
                    ? `${selectedBooking.teacher.first_name || ''} ${selectedBooking.teacher.last_name || ''}`.trim() || selectedBooking.teacher.name
                    : (language === 'ar' ? 'معلم إيوان' : 'Teacher')}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#64748B]">
                  <div className="flex items-center gap-1 text-[#F59E0B] font-bold">
                    <Star size={13} fill="#F59E0B" />
                    <span>4.8</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 truncate text-[#738989]">
                    <BookOpen size={13} />
                    <span className="truncate">
                      {selectedBooking.subject?.name_ar || selectedBooking.subject?.name_en || selectedBooking.course?.name || selectedBooking.course?.title_ar || (language === 'ar' ? 'المادة الدراسية' : 'Subject')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[#171717]/5 shrink-0 flex items-center justify-center">
                {getTeacherPhoto(selectedBooking.teacher) ? (
                  <img
                    src={getTeacherPhoto(selectedBooking.teacher)!}
                    alt="Teacher"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="text-[#0D4A5F]" size={22} />
                )}
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold text-[#0D4A5F] mb-2">
                {language === 'ar' ? 'تفاصيل الحصة' : 'Session Details'}
              </h5>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-white rounded-xl border border-[#F1F5F9] shadow-sm text-right">
                  <span className="text-[11px] text-[#738989] block">
                    {language === 'ar' ? 'نوع الحصة' : 'Session Type'}
                  </span>
                  <span className="text-xs font-bold text-[#0D4A5F] mt-1 block truncate">
                    {selectedBooking.session_info?.type === 'package'
                      ? (language === 'ar' ? 'باقة تعليمية' : 'Package')
                      : selectedBooking.session_info?.type === 'group'
                      ? (language === 'ar' ? 'حصة جماعية' : 'Group Lesson')
                      : (language === 'ar' ? 'حصة فردية' : 'Single Lesson')}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#F1F5F9] shadow-sm text-right">
                  <span className="text-[11px] text-[#738989] block">
                    {language === 'ar' ? 'المادة' : 'Subject'}
                  </span>
                  <span className="text-xs font-bold text-[#0D4A5F] mt-1 block truncate">
                    {selectedBooking.subject?.name_ar || selectedBooking.subject?.name_en || selectedBooking.course?.name || selectedBooking.course?.title_ar || (language === 'ar' ? 'المادة الدراسية' : 'Subject')}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold text-[#0D4A5F] mb-2">
                {language === 'ar' ? 'الموعد المحدد' : 'Selected Appointment'}
              </h5>
              <div className="p-3 bg-white rounded-xl border border-[#F1F5F9] shadow-sm flex items-center justify-between text-right">
                <div className="flex-1">
                  <div className="text-xs font-medium text-[#0D4A5F]">
                    {formatBookingDay(selectedBooking.schedule?.first_session_date || selectedBooking.first_session_date, selectedBooking.day)}
                  </div>
                  <div className="text-xs font-bold text-[#0D4A5F] mt-0.5">
                    {formatTimeTo12Hour(selectedBooking.schedule?.first_session_time || selectedBooking.first_session_start_time)}
                  </div>
                </div>
                <Clock className="text-[#0D4A5F] shrink-0" size={20} />
              </div>
            </div>

            <div className="p-3 bg-[#FFF8EE] border border-[#FDE68A] rounded-xl text-center text-xs text-[#D97706] font-medium leading-relaxed">
              {language === 'ar'
                ? 'يمكنك تعديل أو إلغاء الموعد وفق سياسة الإلغاء قبل موعد الحصة بـ 24 ساعة'
                : 'You can modify or cancel the appointment 24 hours prior according to cancellation policy'}
            </div>

            <div className="pt-2 border-t border-[#F1F5F9] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#738989]">
                <span>{language === 'ar' ? 'سعر الحصة' : 'Session Price'}</span>
                <span className="font-bold text-[#0D4A5F]">
                  {selectedBooking.pricing?.total_amount || selectedBooking.price || '0'} ﷼ / ساعة
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-[#0D4A5F]">
                <span>{language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}</span>
                <span className="text-base text-[#0D4A5F]">
                  {selectedBooking.pricing?.total_amount || selectedBooking.price || '0'} ﷼
                </span>
              </div>

              <div className="pt-3 space-y-2">
                {selectedBooking.session_info?.join_url && (
                  <a
                    href={selectedBooking.session_info.join_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full h-11 bg-[#5B9F48] hover:bg-[#4d863d] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#5B9F48]/20 transition-all"
                  >
                    <Video size={16} />
                    <span>{language === 'ar' ? 'الانضمام إلى الحصة' : 'Join Classroom'}</span>
                  </a>
                )}

                {selectedBooking.can_cancel && (
                  <button
                    onClick={() => setConfirmCancelBookingId(selectedBooking.id)}
                    className="w-full py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    {language === 'ar' ? 'إلغاء الحجز' : 'Cancel Booking'}
                  </button>
                )}

                <Button
                  onClick={() => setActiveModal(null)}
                  variant="outline"
                  className="w-full h-10 rounded-xl text-xs font-bold border-[#F1F5F9] text-[#0D4A5F]"
                >
                  {language === 'ar' ? 'رجوع' : 'Back'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={confirmCancelBookingId !== null}
        onClose={() => setConfirmCancelBookingId(null)}
        title={language === 'ar' ? 'إلغاء الحجز' : 'Cancel Booking'}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <p className="text-sm text-[#0D4A5F]">
            {language === 'ar'
              ? 'هل أنت متأكد من رغبتك في إلغاء هذا الحجز؟'
              : 'Are you sure you want to cancel this booking?'}
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleConfirmCancel}
              isLoading={cancelling}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold h-10"
            >
              {language === 'ar' ? 'تأكيد الإلغاء' : 'Confirm'}
            </Button>
            <Button
              onClick={() => setConfirmCancelBookingId(null)}
              variant="outline"
              disabled={cancelling}
              className="flex-1 rounded-xl text-xs font-bold h-10"
            >
              {language === 'ar' ? 'تراجع' : 'Keep'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};