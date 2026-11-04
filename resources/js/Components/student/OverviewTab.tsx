import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  Clock,
  Star,
  ChevronRight,
  BookOpen,
  Loader2,
  Sparkles,
  GraduationCap,
  Languages,
  Brain,
  BookCheck,
  Users,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Check,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { UserData, studentService, Booking, Course, getStorageUrl } from '../../Services/api';
import { COUNTRIES } from '../../Utils/constants';

interface OverviewTabProps {
  user: UserData;
  onNavigate: (tab: string, params?: any) => void;
  onTeacherSelect?: (teacher: any, serviceId?: number) => void;
}

function getNationalityFlag(nationality?: string | null): string {
  if (!nationality) return '';
  const country = COUNTRIES.find(
    c => c.label.toLowerCase() === nationality.toLowerCase()
  );
  return country?.flag || '';
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ user, onNavigate, onTeacherSelect }) => {
  const { t, direction, language } = useLanguage();
  const [loading, setLoading] = useState(true);

  const [lastBooking, setLastBooking] = useState<Booking | null>(null);
  const [topTeachers, setTopTeachers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bookings, teachers, allCourses, publicPackages, fetchedServices] = await Promise.all([
          studentService.getBookings().catch(() => []),
          studentService.getTeachers().catch(() => []),
          studentService.getCourses().catch(() => []),
          studentService.getPublicPackages().catch(() => []),
          studentService.getServices().catch(() => [])
        ]);

        if (Array.isArray(bookings) && bookings.length > 0) {
          setLastBooking(bookings[0]);
        }

        setTopTeachers(Array.isArray(teachers) ? teachers.slice(0, 6) : []);
        setCourses(Array.isArray(allCourses) ? allCourses.slice(0, 3) : []);
        setPackages(Array.isArray(publicPackages) ? publicPackages.slice(0, 4) : []);
        setServices(Array.isArray(fetchedServices) ? fetchedServices : []);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getSubjectName = (booking: any): string => {
    if (!booking) return '';
    if (booking.teacher_subject) {
      return language === 'ar' ? (booking.teacher_subject.name_ar || booking.teacher_subject.name) : (booking.teacher_subject.name_en || booking.teacher_subject.name);
    }
    if (booking.subject && typeof booking.subject === 'object') {
      return language === 'ar'
        ? (booking.subject.name_ar || booking.subject.name || booking.subject.title_ar || booking.subject.title)
        : (booking.subject.name_en || booking.subject.name || booking.subject.title_en || booking.subject.title);
    }
    if (typeof booking.subject === 'string' && booking.subject.trim() && booking.subject !== 'N/A') {
      return booking.subject;
    }
    if (booking.course && typeof booking.course === 'object') {
      return language === 'ar'
        ? (booking.course.title_ar || booking.course.name_ar || booking.course.title || booking.course.name)
        : (booking.course.title_en || booking.course.name_en || booking.course.title || booking.course.name);
    }
    if (booking.language && typeof booking.language === 'object') {
      return language === 'ar' ? (booking.language.name_ar || booking.language.name) : (booking.language.name_en || booking.language.name);
    }
    if (booking.service && typeof booking.service === 'object') {
      return language === 'ar' ? (booking.service.name_ar || booking.service.name) : (booking.service.name_en || booking.service.name);
    }
    if (booking.session_info?.type === 'package') {
      return language === 'ar' ? 'باقة تعليمية' : 'Educational Package';
    }
    if (booking.session_info?.type === 'group') {
      return language === 'ar' ? 'حصة جماعية' : 'Group Lesson';
    }
    return language === 'ar' ? 'المادة الدراسية' : 'General Subject';
  };

  const getServiceConfig = (keyName: string = '', id: number = 0, nameEn: string = '', nameAr: string = '') => {
    const k = `${keyName} ${nameEn} ${nameAr}`.toLowerCase();
    if (k.includes('book') || k.includes('كتب') || id === 5) {
      return {
        icon: BookOpen,
        color: 'from-rose-500 to-pink-600',
        action: () => window.open('https://www.kottby.net/', '_blank'),
        external: true,
      };
    }
    if (k.includes('course') || k.includes('دور') || id === 4) {
      return {
        icon: BookCheck,
        color: 'from-purple-600 to-indigo-800',
        action: () => onNavigate('courses'),
        external: false,
      };
    }
    if (k.includes('group') || k.includes('جماع') || id === -1) {
      return {
        icon: Users,
        color: 'from-blue-600 to-indigo-700',
        action: () => onNavigate('group-classes'),
        external: false,
      };
    }
    if (k.includes('lang') || k.includes('لغ') || id === 2) {
      return {
        icon: Languages,
        color: 'from-cyan-600 to-blue-700',
        action: () => onNavigate('language-learning'),
        external: false,
      };
    }
    if (k.includes('qiyas') || k.includes('قدرات') || k.includes('abilities') || id === 6) {
      return {
        icon: Brain,
        color: 'from-amber-500 to-orange-600',
        action: () => onNavigate('private-lessons', { service: id }),
        external: false,
      };
    }
    if (k.includes('ai') || k.includes('ذكاء') || k.includes('assistant') || k.includes('smart') || id === 7) {
      return {
        icon: Sparkles,
        color: 'from-indigo-600 to-purple-700',
        action: () => onNavigate('ai'),
        external: false,
      };
    }
    if (k.includes('difficult') || k.includes('صعوب')) {
      return {
        icon: Sparkles,
        color: 'from-violet-500 to-purple-700',
        action: () => onNavigate('private-lessons', { service: id }),
        external: false,
      };
    }
    return {
      icon: GraduationCap,
      color: 'from-emerald-500 to-teal-700',
      action: () => onNavigate('private-lessons', { service: id }),
      external: false,
    };
  };

  const fallbackServices = [
    {
      id: 3,
      key_name: 'private_lesson',
      title: language === 'ar' ? 'الدروس الخصوصية' : 'Private Lessons',
      icon: GraduationCap,
      color: 'from-emerald-500 to-teal-700',
      action: () => onNavigate('private-lessons', { service: 3 }),
      external: false,
    },
    {
      id: 6,
      key_name: 'abilities',
      title: language === 'ar' ? 'القدرات والتحصيلي' : 'Abilities and achievement',
      icon: Brain,
      color: 'from-amber-500 to-orange-600',
      action: () => onNavigate('private-lessons', { service: 6 }),
      external: false,
    },
    {
      id: 2,
      key_name: 'language_learning',
      title: language === 'ar' ? 'تعلم اللغات' : 'Language Learning',
      icon: Languages,
      color: 'from-cyan-600 to-blue-700',
      action: () => onNavigate('language-learning'),
      external: false,
    },
    {
      id: 4,
      key_name: 'courses',
      title: language === 'ar' ? 'الدورات المخصصة' : 'Specialized Courses',
      icon: BookCheck,
      color: 'from-purple-600 to-indigo-800',
      action: () => onNavigate('courses'),
      external: false,
    },
    {
      id: 5,
      key_name: 'books',
      title: language === 'ar' ? 'الكتب الدراسية' : 'Study Books',
      icon: BookOpen,
      color: 'from-rose-500 to-pink-600',
      action: () => window.open('https://www.kottby.net/', '_blank'),
      external: true,
    },
    {
      id: 7,
      key_name: 'ai',
      title: language === 'ar' ? 'الذكاء الإصطناعي' : 'AI Assistant',
      icon: Sparkles,
      color: 'from-indigo-600 to-purple-700',
      action: () => onNavigate('ai'),
      external: false,
    },
    {
      id: 8,
      key_name: 'learning_difficulties',
      title: language === 'ar' ? 'صعوبات تعلم ونطق' : 'Learning Difficulties',
      icon: Sparkles,
      color: 'from-violet-500 to-purple-700',
      action: () => onNavigate('private-lessons', { service: 8 }),
      external: false,
    },
    {
      id: -1,
      key_name: 'group_classes',
      title: language === 'ar' ? 'الحصص الجماعية' : 'Group Classes',
      icon: Users,
      color: 'from-blue-600 to-indigo-700',
      action: () => onNavigate('group-classes'),
      external: false,
    },
  ];

  const dynamicCards = (Array.isArray(services) ? services : []).map((s: any) => {
    const nameAr = (s.name_ar || s.name || s.title || '').toString();
    const nameEn = (s.name_en || s.name || s.title || '').toString();
    const title = language === 'ar' ? (nameAr || nameEn) : (nameEn || nameAr);
    const keyName = (s.key_name || '').toString();
    const id = Number(s.id) || 1;
    const config = getServiceConfig(keyName, id, nameEn, nameAr);
    return {
      id,
      key_name: keyName,
      title,
      icon: config.icon,
      color: config.color,
      action: config.action,
      external: config.external,
    };
  });

  const hasGroup = dynamicCards.some((c: any) => {
    const k = (c.key_name || '').toLowerCase();
    return k.includes('group') || k.includes('جماع');
  });

  if (dynamicCards.length > 0 && !hasGroup) {
    dynamicCards.push({
      id: -1,
      key_name: 'group_classes',
      title: language === 'ar' ? 'الحصص الجماعية' : 'Group Classes',
      icon: Users,
      color: 'from-blue-600 to-indigo-700',
      action: () => onNavigate('group-classes'),
      external: false,
    });
  }

  const displayServices = dynamicCards.length > 0 ? dynamicCards : fallbackServices;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="relative overflow-hidden bg-gradient-to-br from-[var(--navy-dark)] via-[var(--navy)] to-[var(--navy-mid)] rounded-[var(--radius-lg)] p-8 text-white shadow-[var(--shadow-lg)]">
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-[var(--green-light)] opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-10 w-72 h-72 rounded-full bg-[var(--accent)] opacity-10 blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[50px] bg-white/10 text-[var(--green-light)] text-xs font-bold mb-3 border border-white/10">
              <Sparkles size={14} />
              {language === 'ar' ? 'منصة إيوان التعليمية' : 'Ewan Learning Hub'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
              {t.welcomeBack} {user.first_name}!
            </h1>
            <p className="text-[var(--green-light)] text-sm sm:text-base opacity-95">
              {language === 'ar' 
                ? 'استكشف الدروس والحصص الجماعية والباقات التعليمية وابدأ التعلم الآن.' 
                : 'Explore private lessons, group classes, and packages to start learning today.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button
              onClick={() => onNavigate('orders')}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs sm:text-sm font-semibold rounded-xl"
            >
              {language === 'ar' ? 'طلباتي الخاصة' : 'My Requests'}
            </Button>
            <Button
              onClick={() => onNavigate('subscriptions')}
              className="bg-[var(--tertiary,#4ADE80)] text-[var(--navy-dark,#002B36)] hover:brightness-105 font-bold text-xs sm:text-sm rounded-xl"
            >
              <Layers size={16} className="inline ml-1" />
              {language === 'ar' ? 'اشتراكاتي' : 'My Packages'}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-main)]">
              {language === 'ar' ? 'خدماتنا التعليمية' : 'Educational Services'}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
          {displayServices.map((svc) => {
            const IconComp = svc.icon;
            return (
              <div
                key={`${svc.id}-${svc.key_name}`}
                onClick={svc.action}
                className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${svc.color} text-white shadow-sm`}>
                    <IconComp size={22} />
                  </div>
                  {svc.external ? (
                    <span className="p-1 text-slate-400 group-hover:text-primary transition-colors">
                      <ExternalLink size={16} />
                    </span>
                  ) : (
                    <span className="p-1 text-slate-300 group-hover:text-primary transition-colors">
                      {direction === 'rtl' ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-[var(--text-main)] text-sm sm:text-base group-hover:text-primary transition-colors">
                    {svc.title}
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        onClick={() => onNavigate('ai')}
        className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md cursor-pointer hover:shadow-lg transition-all group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-md">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950">
                  {language === 'ar' ? 'مساعد إيوان الذكي' : 'AI Assistant'}
                </span>
                <span className="text-xs text-amber-200">
                  {language === 'ar' ? 'مدعوم بالذكاء الاصطناعي' : 'Powered by AI'}
                </span>
              </div>
              <h3 className="text-lg font-bold">
                {language === 'ar' ? 'هل تحتاج مساعدة في حل واجب أو شرح درس؟' : 'Need help solving an assignment or explanation?'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {language === 'ar' ? 'اطرح سؤالك في أي مادة وسيقوم المساعد الذكي بإرشادك فوراً' : 'Ask your questions in any subject for instant guided help'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs shrink-0 rounded-xl"
          >
            {language === 'ar' ? 'تحدث مع المساعد' : 'Chat with AI'}
            <ArrowUpRight size={15} className="mr-1 inline" />
          </Button>
        </div>
      </div>

      {lastBooking && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--text-main)]">{t.lastBooking}</h2>
            <button className="text-sm text-primary font-medium hover:underline" onClick={() => onNavigate('bookings')}>
              {t.viewAll}
            </button>
          </div>

          <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-main)]">{getSubjectName(lastBooking)}</h3>
                <p className="text-[var(--text-muted)] text-sm">
                  {language === 'ar' ? 'مع المعلم:' : 'With:'} {lastBooking.teacher?.name || `${lastBooking.teacher?.first_name || ''} ${lastBooking.teacher?.last_name || ''}`.trim() || (language === 'ar' ? 'معلم إيوان' : 'Teacher')}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                  <span>{new Date(lastBooking.created_at || Date.now()).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    lastBooking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                    lastBooking.status === 'pending_payment' ? 'bg-amber-50 text-amber-700' :
                    lastBooking.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {lastBooking.status === 'pending_payment' ? (language === 'ar' ? 'في انتظار الدفع' : 'Pending Payment') :
                     lastBooking.status === 'confirmed' ? (language === 'ar' ? 'مؤكد' : 'Confirmed') :
                     lastBooking.status === 'completed' ? (language === 'ar' ? 'مكتمل' : 'Completed') :
                     lastBooking.status === 'cancelled' ? (language === 'ar' ? 'ملغي' : 'Cancelled') :
                     lastBooking.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:flex-none text-xs h-9 rounded-xl" onClick={() => onNavigate('bookings')}>
                {language === 'ar' ? 'تفاصيل الحجز' : 'Booking Details'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {packages.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-main)]">
                {language === 'ar' ? 'الباقات التعليمية والاشتراكات' : 'Educational Packages'}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {language === 'ar' ? 'وفر أكثر عند الاشتراك في باقات الساعات المعتمدة' : 'Save more with discounted hour packages'}
              </p>
            </div>
            <button
              className="text-sm text-primary font-medium hover:underline"
              onClick={() => onNavigate('subscriptions')}
            >
              {t.viewAll}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="relative bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">
                      {pkg.sessions_count} {language === 'ar' ? 'حصص' : 'Sessions'}
                    </span>
                    {pkg.discount_percentage > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 text-red-600">
                        {language === 'ar' ? `خصم ${pkg.discount_percentage}%` : `${pkg.discount_percentage}% OFF`}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-[var(--text-main)] text-base mb-1">
                    {language === 'ar' ? (pkg.name_ar || pkg.name_en) : (pkg.name_en || pkg.name_ar)}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-4">
                    {language === 'ar' ? (pkg.description_ar || pkg.description_en) : (pkg.description_en || pkg.description_ar)}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">{language === 'ar' ? 'السعر الإجمالي' : 'Total Price'}</span>
                    <span className="text-base font-extrabold text-primary">
                      {Number(pkg.price).toFixed(0)} {t.sar}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onNavigate('subscriptions')}
                    className="h-8 text-xs font-bold rounded-xl"
                  >
                    {language === 'ar' ? 'اشترك الآن' : 'Subscribe'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-main)]">{t.topTeachers}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {language === 'ar' ? 'أفضل المعلمين المعتمدين والموصى بهم' : 'Top rated certified teachers'}
            </p>
          </div>
          <button className="text-sm text-primary font-medium hover:underline" onClick={() => onNavigate('private-lessons', { service: '' })}>
            {t.viewAll}
          </button>
        </div>

        {topTeachers.length === 0 ? (
          <div className="text-center py-10 bg-[var(--light-bg)] rounded-2xl text-[var(--text-muted)] text-sm">
            {language === 'ar' ? 'لا يوجد معلمون حالياً.' : 'No teachers found.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topTeachers.map((teacher) => {
              const profile = teacher?.profile || {};
              const profileImage = profile.profile_photo || teacher?.profile_image || null;
              const firstName = teacher?.first_name || '';
              const lastName = teacher?.last_name || '';
              const nationality = teacher?.nationality || '';
              const rating = profile?.rating ?? teacher?.rating ?? 0;
              const subjectTitle = profile?.teacher_subjects?.[0]?.title || (language === 'ar' ? 'معلم خصوصي' : 'Tutor');
              const price = profile?.individual_hour_price ?? teacher?.individual_hour_price ?? 0;
              const formattedPrice = Number(price) > 0 ? (Number(price) % 1 === 0 ? Number(price) : Number(Number(price).toFixed(2))) : 0;
              const flag = getNationalityFlag(nationality);
              const teacherServiceId = Number(profile?.service || teacher?.service || 3);

              return (
                <div
                  key={teacher.id}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
                  onClick={() => onTeacherSelect ? onTeacherSelect(teacher, teacherServiceId) : onNavigate('private-lessons')}
                >
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold overflow-hidden shrink-0 shadow-inner">
                      {profileImage ? (
                        <img src={getStorageUrl(profileImage)} alt={firstName} className="h-full w-full object-cover" />
                      ) : (
                        (firstName?.charAt(0) || '?').toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          {flag && <span className="text-sm">{flag}</span>}
                          <h3 className="font-bold text-[var(--text-main)] text-sm sm:text-base truncate">
                            {firstName} {lastName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold shrink-0 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Star size={12} fill="currentColor" /> {rating > 0 ? rating.toFixed(1) : '5.0'}
                        </div>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1 truncate">{subjectTitle}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">{language === 'ar' ? 'سعر الساعة' : 'Hourly Rate'}</span>
                      <span className="text-sm font-bold text-primary">
                        {formattedPrice} {language === 'ar' ? 'ر.س/ساعة' : `${t.sar}/hr`}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onTeacherSelect) {
                          onTeacherSelect(teacher, teacherServiceId);
                        } else {
                          onNavigate('private-lessons');
                        }
                      }}
                    >
                      {language === 'ar' ? 'حجز درس' : 'Book'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {courses.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--text-main)]">{t.recommendedCourses}</h2>
            <button className="text-sm text-primary font-medium hover:underline" onClick={() => onNavigate('courses')}>
              {t.viewAll}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="h-32 bg-slate-100 flex items-center justify-center text-slate-300 overflow-hidden relative">
                  {course.cover_image ? (
                    <img src={getStorageUrl(course.cover_image)} alt={course.name} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen size={40} />
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/70 text-white backdrop-blur-sm">
                    {course.course_type}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-[var(--text-main)] text-sm sm:text-base mb-1 truncate">{course.name}</h3>
                    <p className="text-xs text-[var(--text-muted)] mb-3 truncate">
                      {language === 'ar' ? 'بواسطة:' : 'By:'} {course.teacher_basic?.first_name} {course.teacher_basic?.last_name}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-base font-bold text-primary">
                      {Number(course.price).toFixed(0)} {t.sar}
                    </span>
                    <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl" onClick={() => onNavigate('courses')}>
                      {language === 'ar' ? 'عرض الدورة' : 'View'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
