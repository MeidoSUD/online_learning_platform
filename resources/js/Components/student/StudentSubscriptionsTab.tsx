import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { 
  Package, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  Loader2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Layers
} from 'lucide-react';
import { Button } from '../ui/Button';
import { studentService } from '../../Services/api';
import { StudentPackagesModal } from './StudentPackagesModal';

interface StudentSubscriptionsTabProps {
  onNavigateToBooking?: () => void;
}

export const StudentSubscriptionsTab: React.FC<StudentSubscriptionsTabProps> = ({ onNavigateToBooking }) => {
  const { language, t, direction } = useLanguage();

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPackagesModalOpen, setIsPackagesModalOpen] = useState(false);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.getSubscriptions();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setSubscriptions(list);
    } catch (err: any) {
      setError(err.message || 'Error loading subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const totalRemaining = subscriptions.reduce((sum, s) => sum + (s.sessions_remaining || 0), 0);
  const totalUsed = subscriptions.reduce((sum, s) => sum + (s.sessions_used || 0), 0);
  const totalSessions = subscriptions.reduce((sum, s) => sum + (s.total_sessions || 0), 0);

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[var(--text-main)]">
            {language === 'ar' ? 'باقاتي واشتراكاتي التعليمية' : 'My Packages & Subscriptions'}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {language === 'ar'
              ? 'متابعة رصيد الحصص المتبقية واستخدام الباقات لحجز الدروس الخصوصية'
              : 'Track your remaining sessions and use packages for booking lessons'}
          </p>
        </div>

        <Button
          onClick={() => setIsPackagesModalOpen(true)}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 shadow-sm self-start sm:self-auto font-bold"
        >
          <Plus size={18} />
          <span>{language === 'ar' ? 'شراء باقة جديدة' : 'Buy New Package'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[var(--border)] shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary-pale text-primary flex items-center justify-center shrink-0">
            <Package size={24} />
          </div>
          <div>
            <span className="text-xs text-[var(--text-muted)] font-medium">
              {language === 'ar' ? 'رصيد الحصص المتبقية' : 'Remaining Sessions'}
            </span>
            <div className="text-2xl font-black text-primary mt-0.5">{totalRemaining}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[var(--border)] shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-xs text-[var(--text-muted)] font-medium">
              {language === 'ar' ? 'الحصص المستهلكة' : 'Consumed Sessions'}
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{totalUsed}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[var(--border)] shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <span className="text-xs text-[var(--text-muted)] font-medium">
              {language === 'ar' ? 'إجمالي الحصص المشتراة' : 'Total Purchased'}
            </span>
            <div className="text-2xl font-black text-blue-600 mt-0.5">{totalSessions}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm flex items-center gap-2 border border-red-200">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 flex justify-center items-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-[var(--border)] p-8">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-primary-pale text-primary flex items-center justify-center mb-4">
            <Package size={32} />
          </div>
          <h3 className="font-bold text-lg text-[var(--text-main)] mb-1">
            {language === 'ar' ? 'ليس لديك أي اشتراكات حالية' : 'No active subscriptions'}
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mb-6">
            {language === 'ar'
              ? 'اشترك في إحدى باقات الحصص واستمتع بخصومات فورية وحجز سريع لجميع الدروس.'
              : 'Subscribe to a session package and enjoy immediate discounts and quick booking.'}
          </p>
          <Button onClick={() => setIsPackagesModalOpen(true)} className="rounded-xl text-xs px-5">
            {language === 'ar' ? 'استعراض الباقات المتاحة' : 'Browse Packages'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subscriptions.map((sub) => {
            const name = language === 'ar' ? (sub.package_name_ar || 'باقة تعليمية') : (sub.package_name_en || 'Educational Package');
            const total = sub.total_sessions || 1;
            const remaining = sub.sessions_remaining ?? 0;
            const used = sub.sessions_used ?? (total - remaining);
            const percentage = Math.round((remaining / total) * 100);
            const isActive = sub.is_active && remaining > 0;

            return (
              <div
                key={sub.id}
                className="relative overflow-hidden bg-white rounded-3xl border border-[var(--border)] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-primary-pale text-primary flex items-center justify-center shrink-0">
                        <Package size={22} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[var(--text-main)]">{name}</h3>
                        <span className="text-xs text-[var(--text-muted)]">
                          #{sub.id} • {sub.expiry_date ? `${language === 'ar' ? 'ينتهي في' : 'Expires'}: ${sub.expiry_date}` : (language === 'ar' ? 'ساري الصلاحية' : 'Active')}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                        isActive
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                    >
                      {isActive ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'مكتمل / منتهي' : 'Expired')}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[var(--text-muted)]">
                        {language === 'ar' ? 'استهلاك الحصص' : 'Sessions Usage'}
                      </span>
                      <span className="text-primary">
                        {remaining} {language === 'ar' ? 'متبقية' : 'remaining'} / {total}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-primary rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-[var(--text-muted)] pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-primary" />
                      <span>{sub.start_date || (language === 'ar' ? 'تاريخ البدء' : 'Start Date')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-primary" />
                      <span>{used} {language === 'ar' ? 'حصص مستخدمة' : 'Used'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                  <div className="text-xs text-[var(--text-muted)]">
                    {sub.total_paid ? `${Number(sub.total_paid).toFixed(2)} ${t.sar}` : ''}
                  </div>

                  {isActive && onNavigateToBooking && (
                    <Button
                      onClick={onNavigateToBooking}
                      className="text-xs h-9 px-4 rounded-xl font-bold flex items-center gap-1.5"
                    >
                      <span>{language === 'ar' ? 'حجز حصة من الباقة' : 'Book Session'}</span>
                      <ArrowIcon size={14} />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <StudentPackagesModal
        isOpen={isPackagesModalOpen}
        onClose={() => setIsPackagesModalOpen(false)}
        onSuccess={fetchSubscriptions}
      />
    </div>
  );
};

