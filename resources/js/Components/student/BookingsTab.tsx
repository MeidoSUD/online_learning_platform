import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Search, Calendar, Clock, User, Loader2, XCircle, Eye, ChevronLeft, ChevronRight, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { studentService } from '../../Services/api';

const STATUS_FILTERS = ['all', 'pending_payment', 'confirmed', 'completed', 'cancelled'] as const;

export const BookingsTab: React.FC<{ onViewCalendar?: () => void }> = ({ onViewCalendar }) => {
  const { t, direction, language } = useLanguage();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [filter, page]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const result = await studentService.getBookingsPaginated(filter, page, 10);
      setBookings(Array.isArray(result.bookings) ? result.bookings : []);
      setPagination(result.pagination);
    } catch (e) {
      console.error('Failed to load bookings', e);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBookingDetails = async (bookingId: number) => {
    setLoadingDetails(true);
    try {
      const details = await studentService.getBookingDetails(bookingId);
      setBookingDetails(details);
      setShowDetails(true);
    } catch (e: any) {
      alert(e.message || 'Failed to load booking details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من إلغاء الحجز؟' : 'Are you sure you want to cancel this booking?')) return;
    setCancelling(true);
    try {
      await studentService.cancelBooking(bookingId);
      loadBookings();
      setShowDetails(false);
    } catch (e: any) {
      alert(e.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const getFilteredBookings = () => {
    if (!search) return bookings;
    const q = search.toLowerCase();
    return bookings.filter((b: any) => {
      const teacherName = b.teacher ? `${b.teacher.first_name} ${b.teacher.last_name}` : '';
      const subjectName = b.subject?.name_en || b.subject?.name_ar || '';
      return teacherName.toLowerCase().includes(q) || subjectName.toLowerCase().includes(q);
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending_payment: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-primary-pale text-green-800',
      completed: 'bg-secondary-pale text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      in_progress: 'bg-purple-100 text-purple-800',
    };
    const labels: Record<string, string> = {
      pending_payment: language === 'ar' ? 'في انتظار الدفع' : 'Pending Payment',
      confirmed: language === 'ar' ? 'مؤكد' : 'Confirmed',
      completed: language === 'ar' ? 'مكتمل' : 'Completed',
      cancelled: language === 'ar' ? 'ملغي' : 'Cancelled',
      in_progress: language === 'ar' ? 'قيد التنفيذ' : 'In Progress',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[status] || 'bg-[var(--light-bg)] text-navy'}`}>
        {labels[status] || status.replace('_', ' ')}
      </span>
    );
  };

  const filteredBookings = getFilteredBookings();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--text-main)]">{language === 'ar' ? 'حجوزاتي' : 'My Bookings'}</h2>
        {onViewCalendar && (
          <Button variant="outline" onClick={onViewCalendar} size="sm">
            {language === 'ar' ? 'عرض التقويم' : 'View Calendar'}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)]">
        <div className="relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] ${direction === 'rtl' ? 'right-3' : 'left-3'}`} size={18} />
          <input type="text"
            placeholder={language === 'ar' ? 'بحث عن حجز...' : 'Search bookings...'}
            value={search} onChange={e => setSearch(e.target.value)}
            className={`w-full py-2 rounded-lg border border-[var(--border)] focus:outline-none focus:border-primary ${direction === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f ? 'bg-slate-900 text-white' : 'bg-[var(--light-bg)] text-[var(--text-muted)] hover:bg-[var(--light-bg)]'
              }`}
            >
              {f === 'all' ? (language === 'ar' ? 'الكل' : 'All') :
               f === 'pending_payment' ? (language === 'ar' ? 'في انتظار الدفع' : 'Pending') :
               f === 'confirmed' ? (language === 'ar' ? 'مؤكد' : 'Confirmed') :
               f === 'completed' ? (language === 'ar' ? 'مكتمل' : 'Completed') :
               f === 'cancelled' ? (language === 'ar' ? 'ملغي' : 'Cancelled') : f}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredBookings.length === 0 && (
        <div className="text-center py-12 bg-[var(--light-bg)] rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-[var(--text-muted)]">
          {language === 'ar' ? 'لا توجد حجوزات' : 'No bookings found'}
        </div>
      )}

      {/* Bookings list */}
      {!loading && (
        <div className="space-y-4">
          {filteredBookings.map((booking: any) => {
            const teacherName = booking.teacher ? `${booking.teacher.first_name} ${booking.teacher.last_name}` : '';
            const teacherPhoto = booking.teacher?.profile?.profile_photo;
            const subjectName = booking.subject
              ? (language === 'ar' ? booking.subject.name_ar : booking.subject.name_en || booking.subject.name)
              : (booking.course?.name || 'N/A');
            const sessionDate = booking.schedule?.first_session_date || booking.first_session_date;
            const sessionTime = booking.schedule?.first_session_time || booking.first_session_start_time;
            const totalAmount = booking.pricing?.total_amount || booking.total_amount;

            return (
              <div key={booking.id}
                className="bg-white p-5 rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all cursor-pointer"
                onClick={() => loadBookingDetails(booking.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-[var(--light-bg)] overflow-hidden shrink-0 flex items-center justify-center text-lg font-bold text-[var(--text-muted)]">
                    {teacherPhoto ? (
                      <img src={teacherPhoto} alt={teacherName} className="w-full h-full object-cover" />
                    ) : (
                      teacherName?.charAt(0) || 'T'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-[var(--text-main)] truncate">{subjectName}</h3>
                        <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mt-0.5">
                          <User size={13} />
                          <span className="truncate">{teacherName}</span>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-[var(--text-muted)]">
                      {sessionDate && (
                        <span className="flex items-center gap-1 bg-[var(--light-bg)] px-2 py-1 rounded">
                          <Calendar size={12} /> {typeof sessionDate === 'string' ? sessionDate.split('T')[0] : sessionDate}
                        </span>
                      )}
                      {sessionTime && (
                        <span className="flex items-center gap-1 bg-[var(--light-bg)] px-2 py-1 rounded">
                          <Clock size={12} /> {typeof sessionTime === 'string' ? sessionTime.split(' ')[1] || sessionTime : sessionTime}
                        </span>
                      )}
                      <span className="flex items-center gap-1 bg-[var(--light-bg)] px-2 py-1 rounded font-medium text-navy">
                        {totalAmount} {booking.pricing?.currency || 'SAR'}
                      </span>
                      {booking.session_info?.total_sessions > 1 && (
                        <span className="flex items-center gap-1 bg-[var(--light-bg)] px-2 py-1 rounded">
                          {booking.session_info.total_sessions} {language === 'ar' ? 'جلسات' : 'sessions'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--light-bg)] disabled:opacity-40">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-[var(--text-muted)]">
            {pagination.current_page} / {pagination.last_page}
          </span>
          <button onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))} disabled={page >= pagination.last_page}
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--light-bg)] disabled:opacity-40">
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Booking Details Modal */}
      <Modal isOpen={showDetails} onClose={() => { setShowDetails(false); setBookingDetails(null); }}
        title={language === 'ar' ? 'تفاصيل الحجز' : 'Booking Details'}>
        {loadingDetails ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
        ) : bookingDetails ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="h-12 w-12 rounded-full bg-[var(--light-bg)] flex items-center justify-center text-lg font-bold text-[var(--text-muted)]">
                {bookingDetails.teacher?.name?.charAt(0) || 'T'}
              </div>
              <div>
                <p className="font-semibold">{bookingDetails.teacher?.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{language === 'ar' ? 'مرجع' : 'Ref'}: {bookingDetails.reference}</p>
              </div>
              {getStatusBadge(bookingDetails.status)}
            </div>

            {/* Session Info */}
            <div className="bg-[var(--light-bg)] rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{language === 'ar' ? 'النوع' : 'Type'}</span>
                <span className="font-medium capitalize">{bookingDetails.session_info?.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{language === 'ar' ? 'الجلسات' : 'Sessions'}</span>
                <span className="font-medium">{bookingDetails.session_info?.completed_sessions}/{bookingDetails.session_info?.total_sessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{language === 'ar' ? 'التاريخ' : 'Date'}</span>
                <span className="font-medium">
                  {bookingDetails.session_info?.first_session_date?.split('T')[0]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{language === 'ar' ? 'الوقت' : 'Time'}</span>
                <span className="font-medium">{bookingDetails.session_info?.first_session_start_time}</span>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-[var(--light-bg)] rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{language === 'ar' ? 'سعر الجلسة' : 'Price/session'}</span>
                <span className="font-medium">{bookingDetails.pricing?.price_per_session} {bookingDetails.pricing?.currency}</span>
              </div>
              {Number(bookingDetails.pricing?.discount_amount) > 0 && (
                <div className="flex justify-between text-primary">
                  <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                  <span>-{bookingDetails.pricing?.discount_amount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>{language === 'ar' ? 'المجموع' : 'Total'}</span>
                <span className="text-primary">{bookingDetails.pricing?.total_amount} {bookingDetails.pricing?.currency}</span>
              </div>
            </div>

            {/* Payment */}
            {bookingDetails.payment && (
              <div className="bg-[var(--light-bg)] rounded-lg p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">{language === 'ar' ? 'حالة الدفع' : 'Payment'}</span>
                  <span className="font-medium capitalize">{bookingDetails.payment.status}</span>
                </div>
                {bookingDetails.payment.paid_at && (
                  <div className="flex justify-between mt-1">
                    <span className="text-[var(--text-muted)]">{language === 'ar' ? 'تاريخ الدفع' : 'Paid at'}</span>
                    <span className="font-medium">{bookingDetails.payment.paid_at}</span>
                  </div>
                )}
              </div>
            )}

            {/* Sessions */}
            {bookingDetails.sessions?.length > 0 && (
              <div>
                <p className="font-semibold text-sm mb-2">{language === 'ar' ? 'الجلسات' : 'Sessions'}</p>
                <div className="space-y-2">
                  {bookingDetails.sessions.map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between bg-[var(--light-bg)] rounded-lg p-3 text-sm">
                      <div>
                        <span className="font-medium">{language === 'ar' ? `جلسة ${session.session_number}` : `Session ${session.session_number}`}</span>
                        <span className="text-[var(--text-muted)] mx-2">|</span>
                        <span className="text-[var(--text-muted)]">{session.session_date}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        session.status === 'completed' ? 'bg-primary-pale text-primary' :
                        session.status === 'live' ? 'bg-purple-100 text-[var(--accent)]' :
                        session.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {bookingDetails.actions?.can_cancel && (
              <div className="pt-2">
                <Button onClick={() => handleCancelBooking(bookingDetails.id)}
                  variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  isLoading={cancelling}>
                  <XCircle size={16} className="mr-1" />
                  {language === 'ar' ? 'إلغاء الحجز' : 'Cancel Booking'}
                </Button>
              </div>
            )}
            {bookingDetails.status === 'pending_payment' && (
              <div className="pt-2">
                <Button className="w-full">
                  <CreditCard size={16} className="mr-1" />
                  {language === 'ar' ? 'إكمال الدفع' : 'Complete Payment'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[var(--text-muted)] text-center py-4">{language === 'ar' ? 'لا توجد تفاصيل' : 'No details available'}</p>
        )}
      </Modal>
    </div>
  );
};
