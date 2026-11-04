import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  DollarSign,
  Users,
  BookOpen,
  Calendar,
  Clock,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Layers,
  Sparkles,
  Award,
  Languages,
  Brain,
  Video,
  X,
  ShieldAlert,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { UserData, teacherService, Session } from '../../Services/api';

interface OverviewTabProps {
  user: UserData;
  onNavigate?: (tab: string, params?: any) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ user, onNavigate }) => {
  const { t, language, direction } = useLanguage();
  const [loading, setLoading] = useState(true);

  const [isActive, setIsActive] = useState<boolean>(false);
  const [balance, setBalance] = useState<number>(0);
  const [monthEarnings, setMonthEarnings] = useState<number>(0);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [subjectsCount, setSubjectsCount] = useState<number>(0);
  const [languagesCount, setLanguagesCount] = useState<number>(0);
  const [abilitiesCount, setAbilitiesCount] = useState<number>(0);
  const [coursesCount, setCoursesCount] = useState<number>(0);
  const [slotsCount, setSlotsCount] = useState<number>(0);
  const [isPackageOn, setIsPackageOn] = useState<boolean>(false);
  const [showBlockedDialog, setShowBlockedDialog] = useState(false);
  const [missingRequirements, setMissingRequirements] = useState<string[]>([]);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const profile = user?.profile || {};
  const isVerified = Boolean(user?.verified || profile?.verified);
  const hourPrice = Number(profile?.individual_hour_price || profile?.group_hour_price || 0);
  const hasPrice = hourPrice > 0;

  useEffect(() => {
    fetchTeacherData();
  }, [user]);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const [walletData, sessionsData, subjectsData, statusRes, packagesRes] = await Promise.all([
        teacherService.getWallet().catch(() => null),
        teacherService.getTeacherSessions().catch(() => []),
        teacherService.getSubjects().catch(() => []),
        teacherService.getActiveStatus().catch(() => null),
        teacherService.togglePackageOnOff(false).catch(() => null)
      ]);

      setBalance(Number(walletData?.balance || user.current_balance || 0));
      setMonthEarnings(Number(walletData?.month_earnings || walletData?.balance || profile?.monthEarnings || 0));

      if (Array.isArray(sessionsData)) {
        const uniqueStudents = new Set(sessionsData.map((s: any) => s.student?.id).filter(Boolean));
        setTotalStudents(Math.max(uniqueStudents.size, profile?.total_students || 0));
      }

      const subs = Array.isArray(subjectsData) ? subjectsData.length : (profile?.subjects_count || 0);
      setSubjectsCount(subs);

      const langs = Array.isArray(profile?.languages) ? profile.languages.length : (profile?.languages_count || 0);
      setLanguagesCount(langs);

      const abs = Array.isArray(profile?.abilities) ? profile.abilities.length : (profile?.abilities_count || 0);
      setAbilitiesCount(abs);

      const crs = Array.isArray(profile?.courses) ? profile.courses.length : (profile?.courses_count || 0);
      setCoursesCount(crs);

      const slots = Array.isArray(profile?.available_times) ? profile.available_times.length : 0;
      setSlotsCount(slots);

      const activeVal = statusRes?.active !== undefined ? Boolean(statusRes.active) : Boolean(user?.is_active || profile?.is_active);
      setIsActive(activeVal);

      setIsPackageOn(Boolean(profile?.package_on_off));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const totalTeachingItems = subjectsCount + languagesCount + abilitiesCount + coursesCount;
  const hasSubjects = totalTeachingItems > 0;
  const hasSlots = slotsCount > 0;
  const isProfileComplete = hasPrice && hasSlots && hasSubjects && isVerified;

  const handleToggleActiveSwitch = async () => {
    if (isActive) {
      setTogglingStatus(true);
      try {
        await teacherService.setActiveStatus(false);
        setIsActive(false);
      } catch {}
      setTogglingStatus(false);
      return;
    }

    const missing: string[] = [];
    if (!isVerified) {
      missing.push(language === 'ar' ? 'توثيق الحساب والشهادات من الإدارة' : 'Account verification by administration');
    }
    if (!hasPrice) {
      missing.push(language === 'ar' ? 'تحديد سعر الساعة للدروس' : 'Set hourly lesson pricing');
    }
    if (!hasSlots) {
      missing.push(language === 'ar' ? 'إضافة مواعيد وفترات متاحة في الجدول' : 'Add available schedule slots');
    }
    if (!hasSubjects) {
      missing.push(language === 'ar' ? 'إضافة المواد أو اللغات أو القدرات أو الدورات' : 'Add subjects, languages, or courses');
    }

    if (missing.length > 0) {
      setMissingRequirements(missing);
      setShowBlockedDialog(true);
      return;
    }

    setTogglingStatus(true);
    try {
      await teacherService.setActiveStatus(true);
      setIsActive(true);
    } catch {}
    setTogglingStatus(false);
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
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            {(user.first_name?.charAt(0) || 'T').toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {t.welcomeBack} {user.first_name}!
              </h1>
              {isVerified && (
                <span className="p-1 rounded-full bg-emerald-50 text-emerald-600" title={language === 'ar' ? 'حساب موثق' : 'Verified'}>
                  <CheckCircle size={16} />
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ar' ? 'لوحة تحكم المعلم وإدارة الدروس والأرباح' : 'Teacher Dashboard & Performance Hub'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
          <div className="text-end">
            <span className="text-xs font-bold text-slate-800 block">
              {isActive ? (language === 'ar' ? 'متاح لاستقبال الطلاب' : 'Available for Tutoring') : (language === 'ar' ? 'غير متاح حالياً' : 'Offline')}
            </span>
            <span className="text-[10px] text-slate-400">
              {isActive ? (language === 'ar' ? 'حسابك يظهر في نتائج البحث' : 'Profile visible to students') : (language === 'ar' ? 'حسابك مخفي عن الطلاب' : 'Profile hidden from search')}
            </span>
          </div>

          <button
            disabled={togglingStatus}
            onClick={handleToggleActiveSwitch}
            className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex items-center ${
              isActive ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                isActive ? (direction === 'rtl' ? '-translate-x-6' : 'translate-x-6') : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {!isProfileComplete && (
        <div className="bg-amber-50 border-r-4 border-amber-500 p-4 sm:p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-900">
                {language === 'ar' ? 'يرجى إكمال متطلبات تفعيل الحساب' : 'Complete Requirements to Activate Profile'}
              </h3>
              <p className="text-xs text-amber-700 mt-1">
                {language === 'ar'
                  ? 'لكي تتمكن من الظهور للطلاب وتفعيل استقبال طلبات التدريس، يرجى إتمام الخطوات التالية:'
                  : 'To appear in student searches and start tutoring, complete the following steps:'}
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {!hasPrice && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate && onNavigate('profile')}
                    className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100 text-xs rounded-xl h-8"
                  >
                    {language === 'ar' ? '+ إضافة سعر الساعة' : '+ Set Hour Price'}
                  </Button>
                )}
                {!hasSlots && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate && onNavigate('schedule')}
                    className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100 text-xs rounded-xl h-8"
                  >
                    {language === 'ar' ? '+ إضافة المواعيد المتاحة' : '+ Add Schedule Slots'}
                  </Button>
                )}
                {!hasSubjects && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNavigate && onNavigate('private-lessons')}
                    className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100 text-xs rounded-xl h-8"
                  >
                    {language === 'ar' ? '+ إضافة المواد التدريسية' : '+ Add Subjects'}
                  </Button>
                )}
                {!isVerified && (
                  <span className="inline-flex items-center text-xs text-amber-700 bg-amber-100/60 px-3 py-1 rounded-xl font-medium">
                    {language === 'ar' ? 'بانتظار مراجعة وتوثيق الإدارة' : 'Pending admin review'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl overflow-hidden shadow-md">
        <div className="bg-[#002B36] p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs text-white/70 block mb-1">
              {language === 'ar' ? 'أرباح الشهر الحالي' : 'Current Month Earnings'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-[#4ADE80]">
                {monthEarnings.toFixed(0)}
              </span>
              <span className="text-sm font-bold text-[#4ADE80]">{t.sar}</span>
            </div>
          </div>

          <Button
            onClick={() => onNavigate && onNavigate('wallet')}
            className="bg-[#4ADE80] hover:bg-[#3ec46f] text-[#002B36] font-bold text-xs sm:text-sm rounded-xl px-5 h-10 shadow-md"
          >
            {language === 'ar' ? 'عرض المحفظة والسحب' : 'View Wallet & Payout'}
            <ArrowUpRight size={16} className="mr-1 inline" />
          </Button>
        </div>

        <div className="bg-[#4ADE80] py-2 px-6 flex items-center justify-center gap-2 text-[#002B36] text-xs font-bold">
          <span>{language === 'ar' ? 'أرباحك المحققة قابلة للسحب مباشرة عبر الحساب البنكي أو المحافظ الرقمية' : 'Your earnings are ready for payout via bank or digital cards'}</span>
          <TrendingUp size={14} />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          {language === 'ar' ? 'أدوات التدريس والإدارة' : 'Teaching & Management Tools'}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate && onNavigate('private-lessons')}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BookOpen size={20} />
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {subjectsCount}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">
                {language === 'ar' ? 'الفصول والمواد' : 'Subjects & Classes'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {language === 'ar' ? 'إدارة المواد والمناهج' : 'Manage your curriculum'}
              </p>
            </div>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('profile')}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign size={20} />
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                {hourPrice.toFixed(0)} {t.sar}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">
                {language === 'ar' ? 'تسعير الحصص' : 'Lesson Pricing'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {language === 'ar' ? 'تعديل سعر الساعة الفردية' : 'Hourly rate setup'}
              </p>
            </div>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('packages')}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers size={20} />
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${isPackageOn ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">
                {language === 'ar' ? 'الباقات التعليمية' : 'Packages'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isPackageOn ? (language === 'ar' ? 'مفعلة وتستقبل حجوزات' : 'Enabled') : (language === 'ar' ? 'معطلة' : 'Disabled')}
              </p>
            </div>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('schedule')}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar size={20} />
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {slotsCount}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">
                {language === 'ar' ? 'جدولي الدراسي' : 'Study Schedule'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {language === 'ar' ? 'الفترات والمواعيد المتاحة' : 'Available timeslots'}
              </p>
            </div>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('group-classes')}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users size={20} />
              </div>
              <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                {direction === 'rtl' ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">
                {language === 'ar' ? 'الحصص الجماعية' : 'Group Classes'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {language === 'ar' ? 'مركز الحصص وجدولها' : 'Manage group hubs'}
              </p>
            </div>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('orders')}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Brain size={20} />
              </div>
              <span className="p-1 rounded-lg bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-all">
                {direction === 'rtl' ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">
                {language === 'ar' ? 'طلبات الطلاب' : 'Student Orders'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {language === 'ar' ? 'تقديم عروض تدريس للطلاب' : 'Bid on student orders'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        onClick={() => onNavigate && onNavigate('ai')}
        className="relative overflow-hidden bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 text-white shadow-md cursor-pointer hover:shadow-lg transition-all"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {language === 'ar' ? 'المساعد الذكي لإعداد خطط الدروس' : 'AI Lesson Planner Assistant'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {language === 'ar' ? 'اطلب اقتراحات للأسئلة أو توليد خطة درس نموذجية لأي مرحلة بنقرة واحدة' : 'Generate questions or lesson plans instantly'}
              </p>
            </div>
          </div>
          <Button size="sm" className="bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs rounded-xl shrink-0">
            {language === 'ar' ? 'فتح المساعد' : 'Open AI'}
          </Button>
        </div>
      </div>

      {showBlockedDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-in p-6 space-y-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert size={32} />
            </div>

            <div className="text-center">
              <h3 className="font-extrabold text-slate-900 text-lg">
                {language === 'ar' ? 'لا يمكن تفعيل الحساب حالياً' : 'Activation Blocked'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'ar'
                  ? 'يتطلب تفعيل استقبال الدروس استيفاء كافة الشروط الإلزامية التالية:'
                  : 'All mandatory requirements below must be met before profile activation:'}
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2.5">
              {missingRequirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-semibold text-amber-900">
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>{req}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowBlockedDialog(false)}
                className="flex-1 rounded-xl text-xs"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </Button>
              <Button
                onClick={() => {
                  setShowBlockedDialog(false);
                  if (onNavigate) onNavigate('profile');
                }}
                className="flex-1 rounded-xl text-xs font-bold bg-primary hover:bg-primary-dark text-white"
              >
                {language === 'ar' ? 'إكمال النواقص الآن' : 'Complete Now'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
