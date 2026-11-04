import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  Layers,
  CheckCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  Info,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../ui/Button';
import { teacherService, studentService, UserData } from '../../Services/api';

interface TeacherPackagesTabProps {
  user: UserData;
}

export const TeacherPackagesTab: React.FC<TeacherPackagesTabProps> = ({ user }) => {
  const { t, language, direction } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<any[]>([]);
  const [isPackageOn, setIsPackageOn] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pubPackages] = await Promise.all([
        studentService.getPublicPackages().catch(() => [])
      ]);
      setPackages(Array.isArray(pubPackages) ? pubPackages : []);
      const currentOnOff = Boolean(user.profile?.package_on_off || user.profile?.offer_packages);
      setIsPackageOn(currentOnOff);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePackage = async () => {
    const nextVal = !isPackageOn;
    setToggling(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      await teacherService.togglePackageOnOff(nextVal);
      setIsPackageOn(nextVal);
      setStatusMessage(
        nextVal
          ? (language === 'ar' ? 'تم تفعيل استقبال طلبات باقات الساعات بنجاح' : 'Package orders enabled successfully')
          : (language === 'ar' ? 'تم تعطيل استقبال طلبات باقات الساعات' : 'Package orders disabled')
      );
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || (language === 'ar' ? 'فشل تحديث حالة الباقات' : 'Failed to update package state'));
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Layers size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)]">
              {language === 'ar' ? 'إدارة الباقات التعليمية' : 'Teacher Packages Management'}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              {language === 'ar' ? 'تفعيل أو تعطيل استقبال حجوزات الباقات والساعات المخفضة للطلاب' : 'Control package booking acceptance and browse system packages'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-end">
            <span className="text-xs font-bold text-slate-800 block">
              {isPackageOn ? (language === 'ar' ? 'استقبال الباقات مفعل' : 'Packages Active') : (language === 'ar' ? 'استقبال الباقات معطل' : 'Packages Disabled')}
            </span>
            <span className="text-[10px] text-slate-400">
              {isPackageOn ? (language === 'ar' ? 'يمكن للطلاب حجز ساعات معك' : 'Students can book your packages') : (language === 'ar' ? 'لن تظهر في قائمة الباقات' : 'Hidden from package listings')}
            </span>
          </div>

          <button
            disabled={toggling}
            onClick={handleTogglePackage}
            className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex items-center ${isPackageOn ? 'bg-purple-600' : 'bg-slate-300'
              }`}
          >
            <div
              className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isPackageOn ? (direction === 'rtl' ? '-translate-x-6' : 'translate-x-6') : 'translate-x-0'
                }`}
            />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle size={18} className="text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl p-6 text-white shadow-md flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center font-bold shrink-0">
          <Info size={24} />
        </div>
        <div>
          <h3 className="font-bold text-base mb-1">
            {language === 'ar' ? 'كيف يعمل نظام الباقات للمعلم؟' : 'How do Packages Work for Teachers?'}
          </h3>
          <p className="text-xs text-purple-100/90 leading-relaxed">
            {language === 'ar'
              ? 'عند تفعيلك لهذا الخيار، يتاح للطلاب شراء باقات ساعات متعددة وحجز جلساتهم معك بالسحب المباشر من رصيد اشتراكهم. تضمن لك الباقات التزام الطلاب واستمرارية الدروس مع تحويل كامل مستحقاتك لمحفظتك مباشرة بعد إتمام كل حصة.'
              : 'When enabled, students can buy hour packages and book recurring sessions with you. You receive guaranteed commitment and payments directly into your wallet upon session completion.'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          {language === 'ar' ? 'الباقات المعتمدة في المنصة' : 'Standard Platform Packages'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-extrabold text-lg shadow-sm">
                    {pkg.sessions_count}
                  </div>
                  {pkg.discount_percentage > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-600">
                      {language === 'ar' ? `خصم ${pkg.discount_percentage}%` : `${pkg.discount_percentage}% OFF`}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-1">
                  {language === 'ar' ? (pkg.name_ar || pkg.name_en) : (pkg.name_en || pkg.name_ar)}
                </h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-3">
                  {language === 'ar' ? (pkg.description_ar || pkg.description_en) : (pkg.description_en || pkg.description_ar)}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'السعر الإجمالي' : 'Total'}</span>
                  <span className="text-lg font-black text-purple-800">
                    {Number(pkg.price).toFixed(0)} {t.sar}
                  </span>
                </div>
                <div className="text-end">
                  <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'للحصة' : 'Per session'}</span>
                  <span className="text-xs font-bold text-slate-700">
                    {Number(pkg.price_per_session || (pkg.price / (pkg.sessions_count || 1))).toFixed(0)} {t.sar}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

