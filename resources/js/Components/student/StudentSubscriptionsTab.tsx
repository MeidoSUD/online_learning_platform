import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  Layers,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  User,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { studentService, getStorageUrl } from '../../Services/api';

export const StudentSubscriptionsTab: React.FC = () => {
  const { t, language, direction } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'my-subs' | 'packages'>('my-subs');
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const [bookingSub, setBookingSub] = useState<any | null>(null);
  const [teacherSlots, setTeacherSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'my-subs') {
        const res = await studentService.getSubscriptions();
        setSubscriptions(Array.isArray(res) ? res : []);
      } else {
        const res = await studentService.getPublicPackages();
        setPackages(Array.isArray(res) ? res : []);
      }
    } catch {
      setSubscriptions([]);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchasePackage = async (pkg: any) => {
    setPurchasingId(pkg.id);
    setPurchaseError(null);
    setPurchaseSuccess(null);
    try {
      const res = await studentService.purchasePackage(pkg.id, 'card');
      const data = res.data || res;
      if (data.payment_id) {
        await studentService.confirmPackagePurchase(data.payment_id);
      }
      setPurchaseSuccess(language === 'ar' ? `تم تفعيل باقة "${pkg.name_ar || pkg.name_en}" بنجاح!` : 'Package activated successfully!');
      setTimeout(() => {
        setActiveSubTab('my-subs');
        setPurchaseSuccess(null);
      }, 1800);
    } catch (err: any) {
      setPurchaseError(err.message || (language === 'ar' ? 'تعذر إتمام عملية الشراء' : 'Purchase failed'));
    } finally {
      setPurchasingId(null);
    }
  };

  const handleOpenBookModal = async (sub: any) => {
    setBookingSub(sub);
    setSelectedSlotId(null);
    setBookingSuccess(false);
    if (!sub.teacher_id) return;
    setSlotsLoading(true);
    try {
      const teachers = await studentService.getTeachers();
      const currentTeacher = (Array.isArray(teachers) ? teachers : []).find(t => t.id === sub.teacher_id);
      const slots = currentTeacher?.profile?.available_times || [];
      setTeacherSlots(Array.isArray(slots) ? slots : []);
    } catch {
      setTeacherSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleConfirmBookSession = async () => {
    if (!bookingSub || !selectedSlotId) return;
    setBookingLoading(true);
    try {
      await studentService.bookWithSubscription(bookingSub.id, {
        availability_slot_id: selectedSlotId,
        teacher_id: bookingSub.teacher_id,
        sessions_count: 1,
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSub(null);
        loadData();
      }, 1500);
    } catch {
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Layers size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)]">
              {language === 'ar' ? 'باقات واشتراكات الساعات' : 'Subscriptions & Packages'}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              {language === 'ar' ? 'تتبع رصيد ساعاتك المتبقية واحجز دروسك مباشرة' : 'Track remaining hours balance and book directly'}
            </p>
          </div>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('my-subs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'my-subs' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? 'اشتراكاتي الحالية' : 'My Subscriptions'}
          </button>
          <button
            onClick={() => setActiveSubTab('packages')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'packages' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? 'الباقات المتاحة للشراء' : 'Browse Packages'}
          </button>
        </div>
      </div>

      {purchaseSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle size={18} className="text-emerald-600" />
          <span>{purchaseSuccess}</span>
        </div>
      )}

      {purchaseError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{purchaseError}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center min-h-[350px]">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : activeSubTab === 'my-subs' ? (
        subscriptions.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <Layers size={32} />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">
              {language === 'ar' ? 'لا توجد اشتراكات نشطة حالياً' : 'No Active Subscriptions'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {language === 'ar'
                ? 'اشترك في باقات الساعات التعليمية بخصومات حصرية واحجز حصصك بسهولة وسرعة.'
                : 'Subscribe to discounted packages to save more and book seamlessly.'}
            </p>
            <Button onClick={() => setActiveSubTab('packages')} className="rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white">
              <ShoppingBag size={15} className="mr-1.5 inline" />
              {language === 'ar' ? 'استعراض الباقات المتاحة' : 'Browse Available Packages'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map((sub) => {
              const remaining = Number(sub.remaining_sessions ?? sub.remaining_hours ?? (sub.total_sessions - (sub.consumed_sessions || 0)));
              const total = Number(sub.total_sessions ?? sub.sessions_count ?? 1);
              const consumed = total - remaining;
              const percent = Math.min(100, Math.max(0, (consumed / total) * 100));

              return (
                <div
                  key={sub.id}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700">
                        {sub.package?.name_ar || sub.package?.name || (language === 'ar' ? 'باقة تعليمية' : 'Package')}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        {language === 'ar' ? 'نشط' : 'Active'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-slate-50 mb-4">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'إجمالي الساعات' : 'Total'}</span>
                        <span className="font-extrabold text-slate-800 text-sm">{total}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'المستهلكة' : 'Consumed'}</span>
                        <span className="font-extrabold text-slate-600 text-sm">{consumed}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'المتبقية' : 'Remaining'}</span>
                        <span className="font-extrabold text-purple-700 text-sm">{remaining}</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {sub.expires_at ? `${language === 'ar' ? 'ينتهي في:' : 'Expires:'} ${sub.expires_at}` : (language === 'ar' ? 'صالح للاستخدام' : 'Valid')}
                    </span>
                    <Button
                      disabled={remaining <= 0}
                      onClick={() => handleOpenBookModal(sub)}
                      className="rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white h-9 px-4"
                    >
                      <Calendar size={14} className="mr-1.5 inline" />
                      {language === 'ar' ? 'حجز حصة من الباقة' : 'Book from Package'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="relative bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-extrabold text-lg shadow-sm">
                    {pkg.sessions_count}
                  </div>
                  {pkg.discount_percentage > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-600 shadow-sm">
                      {language === 'ar' ? `وفر ${pkg.discount_percentage}%` : `${pkg.discount_percentage}% OFF`}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-lg mb-1">
                  {language === 'ar' ? (pkg.name_ar || pkg.name_en) : (pkg.name_en || pkg.name_ar)}
                </h3>
                <p className="text-xs text-slate-500 mb-6 line-clamp-3">
                  {language === 'ar' ? (pkg.description_ar || pkg.description_en) : (pkg.description_en || pkg.description_ar)}
                </p>

                <div className="bg-slate-50 p-3 rounded-2xl mb-6 flex items-center justify-between text-xs text-slate-600">
                  <span>{language === 'ar' ? 'سعر الحصة الواحدة' : 'Per session'}</span>
                  <span className="font-bold text-slate-800">
                    {Number(pkg.price_per_session || (pkg.price / (pkg.sessions_count || 1))).toFixed(0)} {t.sar}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">{language === 'ar' ? 'السعر الإجمالي' : 'Total'}</span>
                  <span className="text-xl font-black text-purple-800">
                    {Number(pkg.price).toFixed(0)} {t.sar}
                  </span>
                </div>

                <Button
                  disabled={purchasingId === pkg.id}
                  onClick={() => handlePurchasePackage(pkg)}
                  className="rounded-2xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white h-10 px-5 shadow-md group-hover:scale-105 transition-transform"
                >
                  {purchasingId === pkg.id ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <>
                      <ShoppingBag size={14} className="mr-1.5 inline" />
                      {language === 'ar' ? 'شراء وتفعيل' : 'Buy Now'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {bookingSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base">
                {language === 'ar' ? 'حجز حصة من رصيد الباقة' : 'Book from Package Hours'}
              </h3>
              <button
                onClick={() => setBookingSub(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {bookingSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs text-center space-y-2">
                  <CheckCircle size={24} className="text-emerald-600 mx-auto" />
                  <p className="font-bold text-sm">
                    {language === 'ar' ? 'تم حجز الحصة بالسحب من رصيد الباقة بنجاح!' : 'Session booked from package balance!'}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-600">
                    {language === 'ar'
                      ? 'اختر الفترة الزمنية المناسبة وسيتم خصم حصة واحدة من رصيد باقتك المتبقي.'
                      : 'Select an available slot to book a session using your package balance.'}
                  </p>

                  {slotsLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="animate-spin h-6 w-6 text-primary" />
                    </div>
                  ) : teacherSlots.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-400">
                      {language === 'ar' ? 'لا تتوفر فترات محددة حالياً لهذا المعلم.' : 'No slots currently available.'}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {teacherSlots.map((slot: any) => (
                        <div
                          key={slot.id}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${
                            selectedSlotId === slot.id
                              ? 'bg-purple-50 border-purple-600 font-bold text-purple-900'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <span>{slot.day_of_week || slot.date || 'Slot'}</span>
                          <span>{slot.start_time} - {slot.end_time}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setBookingSub(null)}
                      className="flex-1 rounded-xl text-xs"
                    >
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button
                      disabled={!selectedSlotId || bookingLoading}
                      onClick={handleConfirmBookSession}
                      className="flex-1 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {bookingLoading ? <Loader2 className="animate-spin h-4 w-4" /> : (language === 'ar' ? 'تأكيد الحجز' : 'Confirm Book')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

