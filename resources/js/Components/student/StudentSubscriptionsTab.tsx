import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { 
  Package, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  AlertCircle, 
  RotateCw,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../ui/Button';
import { studentService } from '../../Services/api';
import { StudentPackagesModal } from './StudentPackagesModal';

interface StudentSubscriptionsTabProps {
  onNavigateToBooking?: () => void;
  onBack?: () => void;
}

interface SubscriptionBookingItem {
  id: number;
  booking_reference?: string;
  teacher_id?: number;
  session_date?: string;
  start_time?: string;
  end_time?: string;
  status: string;
}

interface SubscriptionItem {
  id: number;
  package_name_ar?: string;
  package_name_en?: string;
  sessions_remaining?: number;
  sessions_used?: number;
  total_sessions?: number;
  total_paid?: string | number;
  status: string;
  is_active?: boolean;
  start_date?: string;
  expiry_date?: string;
  bookings_count?: number;
  package?: {
    name_ar?: string;
    name_en?: string;
  };
  bookings?: SubscriptionBookingItem[];
}

export const StudentSubscriptionsTab: React.FC<StudentSubscriptionsTabProps> = ({ 
  onNavigateToBooking,
  onBack 
}) => {
  const { language, direction } = useLanguage();
  const isAr = language === 'ar';

  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null);

  const [detailData, setDetailData] = useState<SubscriptionItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [isPackagesModalOpen, setIsPackagesModalOpen] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.getSubscriptions();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setSubscriptions(list);
    } catch (err: any) {
      setError(err?.message || (isAr ? 'فشل تحميل الاشتراكات' : 'Failed to load subscriptions'));
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  const fetchDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await studentService.getSubscriptionDetails(id);
      const data = res?.data || res;
      setDetailData(data);
    } catch (err: any) {
      setDetailError(err?.message || (isAr ? 'فشل تحميل تفاصيل الاشتراك' : 'Failed to load subscription details'));
    } finally {
      setDetailLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  useEffect(() => {
    if (selectedSubscriptionId !== null) {
      fetchDetail(selectedSubscriptionId);
    } else {
      setDetailData(null);
      setDetailError(null);
    }
  }, [selectedSubscriptionId, fetchDetail]);

  const getDisplayTitle = (sub: SubscriptionItem): string => {
    const total = (sub.total_sessions && sub.total_sessions > 0)
      ? sub.total_sessions
      : ((sub.sessions_remaining || 0) + (sub.sessions_used || 0));

    const rawName = isAr
      ? (sub.package_name_ar || sub.package?.name_ar || sub.package_name_en || sub.package?.name_en || '').trim()
      : (sub.package_name_en || sub.package?.name_en || sub.package_name_ar || sub.package?.name_ar || '').trim();

    const prefix = isAr ? 'باقة' : 'Package';

    if (rawName && rawName.toLowerCase() !== 'a' && rawName.toLowerCase() !== 'b') {
      if (rawName.startsWith(prefix) || !prefix) {
        return rawName;
      }
      return `${prefix} ${rawName}`;
    }

    return isAr ? `باقة ${total} حصص` : `Package of ${total} Sessions`;
  };

  const getDisplayDesc = (sub: SubscriptionItem): string => {
    const total = (sub.total_sessions && sub.total_sessions > 0)
      ? sub.total_sessions
      : ((sub.sessions_remaining || 0) + (sub.sessions_used || 0));

    return isAr
      ? `باقة تضمن ${total} حصص تعليمية متكاملة`
      : `Package includes ${total} comprehensive sessions`;
  };

  const formatPrice = (raw: string | number | undefined): string => {
    if (raw === undefined || raw === null || raw === '') return '0';
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
    if (isNaN(num)) return String(raw);
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
  };

  const formatDetailDate = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('T')[0].split(' ')[0].split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        return `${d}/${m}/${y}`;
      }
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return `${parsed.getDate()}/${parsed.getMonth() + 1}/${parsed.getFullYear()}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const formatBookingDate = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('T')[0].split(' ')[0].split('-');
      let d: Date;
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        d = new Date(dateStr);
      }
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const renderSubscriptionStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    let bgColor = 'bg-[#F1F5F9]';
    let textColor = 'text-[#0D4A5F]';
    let label = status;

    if (s === 'active') {
      bgColor = 'bg-[#E8F5E9]';
      textColor = 'text-[#5B9F48]';
      label = isAr ? 'نشط' : 'Active';
    } else if (s === 'confirmed') {
      bgColor = 'bg-[#E8F5E9]';
      textColor = 'text-[#5B9F48]';
      label = isAr ? 'مؤكد' : 'Confirmed';
    } else if (s === 'completed') {
      bgColor = 'bg-[#F1F5F9]';
      textColor = 'text-[#64748B]';
      label = isAr ? 'مكتمل' : 'Completed';
    } else if (s === 'cancelled') {
      bgColor = 'bg-[#FEE2E2]';
      textColor = 'text-[#EF4444]';
      label = isAr ? 'ملغي' : 'Cancelled';
    } else if (s === 'expired') {
      bgColor = 'bg-[#FEE2E2]';
      textColor = 'text-[#EF4444]';
      label = isAr ? 'منتهي' : 'Expired';
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-[10px] text-[11px] font-bold ${bgColor} ${textColor}`}>
        {label}
      </span>
    );
  };

  const renderBookingStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    let bgColor = 'bg-[#F1F5F9]';
    let textColor = 'text-[#0D4A5F]';
    let label = status;

    if (s === 'confirmed' || s === 'active') {
      bgColor = 'bg-[#E8F5E9]';
      textColor = 'text-[#5B9F48]';
      label = isAr ? 'مؤكد' : 'Confirmed';
    } else if (s === 'completed') {
      bgColor = 'bg-[#F1F5F9]';
      textColor = 'text-[#64748B]';
      label = isAr ? 'مكتمل' : 'Completed';
    } else if (s === 'cancelled') {
      bgColor = 'bg-[#FEE2E2]';
      textColor = 'text-[#EF4444]';
      label = isAr ? 'ملغي' : 'Cancelled';
    } else if (s === 'pending' || s === 'pending_payment') {
      bgColor = 'bg-[#FFF6E5]';
      textColor = 'text-[#F59E0B]';
      label = isAr ? 'بانتظار الدفع' : 'Pending Payment';
    }

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-[12px] text-xs font-bold ${bgColor} ${textColor}`}>
        {label}
      </span>
    );
  };

  const handleHeaderBack = () => {
    if (selectedSubscriptionId !== null) {
      setSelectedSubscriptionId(null);
    } else if (onBack) {
      onBack();
    } else if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  const ChevronBackIcon = direction === 'rtl' ? ChevronRight : ChevronLeft;
  const ArrowNextIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  if (selectedSubscriptionId !== null) {
    const sub = detailData;
    const total = sub
      ? ((sub.total_sessions && sub.total_sessions > 0)
          ? sub.total_sessions
          : ((sub.sessions_remaining || 0) + (sub.sessions_used || 0)))
      : 0;
    const used = sub?.sessions_used || 0;
    const remaining = sub?.sessions_remaining || 0;
    const title = sub ? getDisplayTitle(sub) : (isAr ? 'تفاصيل الباقة' : 'Package Details');
    const desc = sub ? getDisplayDesc(sub) : '';
    const maxSegments = Math.min(Math.max(total, 1), 20);
    const filledCount = total > 0 ? Math.round((used / total) * maxSegments) : 0;
    const safeFilledCount = (used > 0 && filledCount === 0) ? 1 : filledCount;
    const bookings = sub?.bookings || [];

    return (
      <div className="min-h-[80vh] bg-[#EFF6F4] -m-4 sm:-m-6 p-4 sm:p-6 animate-fade-in flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={handleHeaderBack}
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-[#0D4A5F] hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ChevronBackIcon size={22} />
          </button>
          <h1 className="text-lg font-bold text-[#0D4A5F]">
            {title}
          </h1>
          <div className="w-10 h-10" />
        </div>

        {detailLoading ? (
          <div className="max-w-xl mx-auto w-full space-y-4 animate-pulse">
            <div className="bg-white rounded-[20px] p-5 shadow-sm space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-48 bg-slate-200 rounded" />
                </div>
                <div className="h-6 w-16 bg-slate-200 rounded-full" />
              </div>
              <div className="flex justify-around items-center py-2">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-slate-200" />
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-slate-200" />
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-slate-200" />
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="flex gap-1.5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-2.5 rounded-full bg-slate-200 flex-1" />
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-4 w-24 bg-slate-200 rounded" />
              </div>
              <div className="border-t border-slate-100" />
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-4 w-20 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        ) : detailError ? (
          <div className="max-w-md mx-auto my-auto text-center py-12 px-4">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle size={28} />
            </div>
            <p className="text-sm text-red-600 mb-4">{detailError}</p>
            <Button
              onClick={() => fetchDetail(selectedSubscriptionId)}
              className="bg-[#5B9F48] hover:bg-[#4E8C3D] text-white px-5 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2"
            >
              <RotateCw size={16} />
              <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
            </Button>
          </div>
        ) : sub ? (
          <div className="max-w-xl mx-auto w-full space-y-4 pb-10">
            <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_14px_rgba(0,0,0,0.04)] border border-slate-100">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h2 className="text-base font-bold text-[#0D4A5F]">{title}</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">{desc}</p>
                </div>
                {renderSubscriptionStatusBadge(sub.status)}
              </div>

              <div className="flex justify-around items-center my-6">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-[#B4DC7F] text-[#1E5935] flex items-center justify-center text-xl font-bold">
                    {total}
                  </div>
                  <span className="text-xs font-semibold text-[#0D4A5F] mt-2">
                    {isAr ? 'إجمالي الحصص' : 'Total Sessions'}
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-[#B4DC7F] text-[#1E5935] flex items-center justify-center text-xl font-bold">
                    {used}
                  </div>
                  <span className="text-xs font-semibold text-[#0D4A5F] mt-2">
                    {isAr ? 'الحصص المستخدمة' : 'Used Sessions'}
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-[#B4DC7F] text-[#1E5935] flex items-center justify-center text-xl font-bold">
                    {remaining}
                  </div>
                  <span className="text-xs font-semibold text-[#0D4A5F] mt-2">
                    {isAr ? 'الحصص المتبقية' : 'Remaining Sessions'}
                  </span>
                </div>
              </div>

              <div className="flex gap-1.5 w-full mt-2">
                {[...Array(maxSegments)].map((_, index) => {
                  const isFilled = index < safeFilledCount;
                  return (
                    <div
                      key={index}
                      className={`h-2.5 rounded-full flex-1 transition-colors ${
                        isFilled ? 'bg-[#165B33]' : 'bg-[#D8ECB5]'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-[0_3px_10px_rgba(0,0,0,0.03)] border border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#94A3B8]">
                  {isAr ? 'تاريخ البدء' : 'Start Date'}
                </span>
                <span className="font-bold text-[#0D4A5F]">
                  {formatDetailDate(sub.start_date)}
                </span>
              </div>
              <div className="border-t border-[#F1F5F9]" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#94A3B8]">
                  {isAr ? 'إجمالي المبلغ' : 'Total Amount'}
                </span>
                <span className="font-bold text-[#0D4A5F] flex items-center gap-1 text-base">
                  <span>{formatPrice(sub.total_paid)}</span>
                  <span>﷼</span>
                </span>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-base font-bold text-[#0D4A5F] mb-3">
                {isAr ? 'سجل الحجوزات' : 'Bookings History'}
              </h3>

              {bookings.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 shadow-sm">
                  <p className="text-sm text-[#64748B]">
                    {isAr ? 'لا توجد حجوزات في هذا الاشتراك' : 'No bookings in this subscription'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-bold text-[#0D4A5F]">
                          {booking.booking_reference || `#${booking.id}`}
                        </div>
                        <div className="text-xs text-[#94A3B8] mt-0.5">
                          {formatBookingDate(booking.session_date)}
                        </div>
                      </div>
                      {renderBookingStatusBadge(booking.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {onNavigateToBooking && (sub.is_active || sub.status === 'active') && remaining > 0 && (
              <button
                onClick={onNavigateToBooking}
                className="w-full bg-[#5B9F48] hover:bg-[#4E8C3D] text-white font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors mt-6 cursor-pointer"
              >
                <span>{isAr ? 'حجز حصة من الباقة' : 'Book Session from Package'}</span>
                <ArrowNextIcon size={18} />
              </button>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-[#EFF6F4] -m-4 sm:-m-6 p-4 sm:p-6 animate-fade-in flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={handleHeaderBack}
          className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-[#0D4A5F] hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ChevronBackIcon size={22} />
        </button>

        <h1 className="text-lg font-bold text-[#0D4A5F]">
          {isAr ? 'اشتراكاتي' : 'My Subscriptions'}
        </h1>

        <button
          onClick={() => setIsPackagesModalOpen(true)}
          className="h-10 px-3.5 rounded-full bg-white shadow-sm border border-slate-100 flex items-center gap-1.5 text-[#0D4A5F] hover:bg-slate-50 transition-colors text-xs font-bold cursor-pointer"
        >
          <Plus size={16} className="text-[#5B9F48]" />
          <span className="hidden sm:inline">{isAr ? 'شراء باقة' : 'Buy Package'}</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="max-w-2xl mx-auto w-full space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-[105px] bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden animate-pulse p-4 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div className="h-6 w-20 bg-slate-200 rounded-[10px]" />
                  <div className="h-10 w-12 bg-slate-200 rounded" />
                </div>
                <div className="flex justify-between items-end">
                  <div className="h-6 w-24 bg-slate-200 rounded" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                    <div className="h-3 w-40 bg-slate-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto my-auto text-center py-12 px-4">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle size={28} />
            </div>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button
              onClick={fetchSubscriptions}
              className="bg-[#5B9F48] hover:bg-[#4E8C3D] text-white px-5 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2"
            >
              <RotateCw size={16} />
              <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
            </Button>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="my-auto py-16 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-28 h-28 rounded-[32px] bg-[#DCE5EA]/50 flex items-center justify-center text-[#0D4A5F] mb-6">
              <Package size={52} strokeWidth={1.5} />
            </div>

            <h2 className="text-lg font-bold text-[#0D4A5F] mb-2">
              {isAr ? 'لا توجد اشتراكات بعد' : 'No subscriptions yet'}
            </h2>

            <p className="text-sm text-[#64748B] max-w-sm mb-6">
              {isAr
                ? 'لم تشترك في أي باقة تعليمية حتى الآن'
                : 'You have not subscribed to any educational package yet'}
            </p>

            <button
              onClick={() => setIsPackagesModalOpen(true)}
              className="bg-[#5B9F48] hover:bg-[#4E8C3D] text-white text-sm font-bold py-2.5 px-6 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              {isAr ? 'استعراض الباقات المتاحة' : 'Browse Packages'}
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto w-full space-y-3 pb-8">
            {subscriptions.map((sub) => {
              const totalSessions = (sub.total_sessions && sub.total_sessions > 0)
                ? sub.total_sessions
                : ((sub.sessions_remaining || 0) + (sub.sessions_used || 0));
              const displayTitle = getDisplayTitle(sub);
              const description = getDisplayDesc(sub);
              const priceStr = formatPrice(sub.total_paid);

              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubscriptionId(sub.id)}
                  className="h-[105px] bg-white rounded-xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow relative overflow-hidden cursor-pointer select-none"
                >
                  <div
                    className={`absolute top-1 ${
                      direction === 'rtl' ? 'right-2' : 'left-2'
                    } text-[46px] font-bold text-[#CBD5E1]/40 leading-none pointer-events-none select-none`}
                  >
                    {totalSessions}
                  </div>

                  <div
                    className={`absolute top-3 ${
                      direction === 'rtl' ? 'left-2' : 'right-2'
                    }`}
                  >
                    {renderSubscriptionStatusBadge(sub.status)}
                  </div>

                  <div
                    className={`absolute bottom-3 ${
                      direction === 'rtl' ? 'left-0' : 'right-0'
                    }`}
                  >
                    <div
                      style={{
                        clipPath: direction === 'rtl'
                          ? 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)'
                          : 'polygon(100% 0, 8px 0, 0 50%, 8px 100%, 100% 100%)'
                      }}
                      className={`bg-[#165B33] text-white flex items-center gap-1 text-sm font-bold ${
                        direction === 'rtl' ? 'pl-3 pr-4 py-1' : 'pr-3 pl-4 py-1'
                      }`}
                    >
                      <span>{priceStr}</span>
                      <span className="text-xs">﷼</span>
                    </div>
                  </div>

                  <div
                    className={`absolute bottom-3 ${
                      direction === 'rtl' ? 'right-3' : 'left-3'
                    } max-w-[65%]`}
                  >
                    <h3 className="text-sm font-bold text-[#0D4A5F] truncate">
                      {displayTitle}
                    </h3>
                    <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                      {description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <StudentPackagesModal
        isOpen={isPackagesModalOpen}
        onClose={() => setIsPackagesModalOpen(false)}
        onSuccess={fetchSubscriptions}
      />
    </div>
  );
};
