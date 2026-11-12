import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Package, CheckCircle2, AlertCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { teacherService, UserData } from '../../Services/api';

interface TeacherPackagesTabProps {
  user?: UserData;
  onNavigate?: (tab: string) => void;
}

export const TeacherPackagesTab: React.FC<TeacherPackagesTabProps> = ({ user, onNavigate }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [packages, setPackages] = useState<any[]>([]);
  const [isOffered, setIsOffered] = useState<boolean>(Boolean(user?.profile?.package_on_off));
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isVerified = Boolean(user?.verified || user?.profile?.verified);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await teacherService.getPackages();
      let list: any[] = [];
      if (res?.data?.available_packages) {
        list = res.data.available_packages;
        if (res.data.offer_packages !== undefined) {
          setIsOffered(Boolean(res.data.offer_packages));
        }
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      } else if (Array.isArray(res)) {
        list = res;
      }
      setPackages(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleOffer = async () => {
    if (toggling) return;

    if (!isVerified && !isOffered) {
      setStatusMessage({
        text: isAr
          ? 'عذراً، يجب توثيق حسابك من قبل الإدارة أولاً لتتمكن من تفعيل ميزة الباقات التعليمية'
          : 'Your account must be verified by admin before enabling packages.',
        type: 'error',
      });
      return;
    }

    const nextState = !isOffered;
    setToggling(true);
    setStatusMessage(null);

    try {
      await teacherService.togglePackageOnOff(nextState);
      setIsOffered(nextState);
      setStatusMessage({
        text: nextState
          ? (isAr ? 'تم تفعيل تقديم الباقات التعليمية بنجاح' : 'Educational packages enabled successfully')
          : (isAr ? 'تم إيقاف تقديم الباقات التعليمية' : 'Educational packages disabled'),
        type: 'success',
      });
      await loadData();
    } catch (err: any) {
      setStatusMessage({
        text: err?.message || (isAr ? 'فشل تحديث حالة الباقات' : 'Failed to update packages status'),
        type: 'error',
      });
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-4xl mx-auto">
      <div className="bg-[#0D4A5F] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col items-center text-center max-w-xl mx-auto py-2">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4 text-[#A2E048]">
            <Package size={30} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 leading-tight">
            {isAr ? 'انضم إلى الباقات التعليمية' : 'Join Educational Packages'}
          </h2>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            {isAr
              ? 'فعّل تقديم الباقات التعليمية لزيادة عدد حصصك وحصول الطلاب على خصومات تشجيعية مجدية'
              : 'Enable educational packages to increase your lessons and give students motivating discounts'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-4 -mt-10 mx-4 relative z-10">
        <div>
          <h3 className="text-sm font-bold text-[#0D4A5F]">
            {isAr ? 'تفعيل الباقات التعليمية' : 'Activate Educational Packages'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isOffered
              ? (isAr ? 'الباقات مفعلة وتظهر للطلاب في ملفك الشخصي' : 'Packages are active and visible to students')
              : (isAr ? 'الباقات متوقفة حالياً' : 'Packages are currently disabled')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleOffer}
          disabled={toggling}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isOffered ? 'bg-[#5B9F48]' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isOffered ? (isAr ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-[#00BB29] border border-emerald-200'
              : 'bg-red-50 text-[#E43700] border border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {!isVerified && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <span className="font-bold block mb-0.5">
              {isAr ? 'الحساب غير موثق' : 'Account Not Verified'}
            </span>
            <span>
              {isAr
                ? 'يتطلب تفعيل الباقات التعليمية اكتمال توثيق حسابك من قبل إدارة المنصة.'
                : 'Educational packages require full account verification by administration.'}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-base font-bold text-[#0D4A5F]">
            {isAr ? 'باقات الساعات المعتمدة في النظام' : 'Standard Hour Packages'}
          </h3>
          <button
            type="button"
            onClick={loadData}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-16">
            <Loader2 className="animate-spin text-[#5B9F48] h-10 w-10" />
          </div>
        ) : packages.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm text-xs text-slate-400">
            {isAr ? 'لا توجد باقات معتمدة حالياً' : 'No packages available currently'}
          </div>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg) => {
              const sessions = pkg.sessions_count || pkg.hours || pkg.sessions || 4;
              const title = isAr
                ? pkg.name_ar || pkg.name || `باقة ${sessions} حصص`
                : pkg.name_en || pkg.name || `Package of ${sessions} Lessons`;
              const description = isAr
                ? pkg.description_ar || pkg.description || `تشمل ${sessions} حصص تعليمية فردية متكاملة`
                : pkg.description_en || pkg.description || `Includes ${sessions} comprehensive sessions`;
              const price = pkg.total_price || pkg.price || (sessions * Number(user?.profile?.individual_hour_price || 100));

              return (
                <div
                  key={pkg.id || sessions}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-4 transition hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center font-extrabold text-3xl text-slate-300 font-mono select-none">
                      {sessions}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{title}</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-md">{description}</p>
                    </div>
                  </div>

                  <div className="text-end flex-shrink-0">
                    <div
                      className={`inline-block px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                        isOffered
                          ? 'bg-emerald-50 text-[#00BB29] border border-emerald-200'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <span>{price}</span>
                      <span className="ms-1 text-[10px] font-bold">{isAr ? 'ر.س' : 'SAR'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

