import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { 
  Clock, 
  Star, 
  ChevronRight, 
  ChevronLeft,
  PlayCircle, 
  BookOpen, 
  Loader2, 
  Sparkles, 
  GraduationCap, 
  Globe, 
  Award, 
  ExternalLink,
  Package,
  ArrowRight,
  ArrowLeft,
  Bot,
  Check
} from 'lucide-react';
import { Button } from '../ui/Button';
import { UserData, studentService, Booking, Course, getStorageUrl } from '../../Services/api';
import { COUNTRIES } from '../../Utils/constants';

interface OverviewTabProps {
  user: UserData;
  onNavigate: (tab: string, serviceId?: number) => void;
  onTeacherSelect?: (teacher: any, serviceId?: number) => void;
}

interface ServiceItem {
  id: number;
  key_name?: string;
  name_ar?: string;
  name_en?: string;
  name?: string;
  title?: string;
  image?: string;
  status?: number | boolean | string;
  is_active?: number | boolean | string;
  is_disabled?: number | boolean | string;
}

const getServiceIcon = (keyName: string, id: number) => {
  const k = (keyName || '').toLowerCase();
  if (k.includes('book') || k.includes('كتب') || id === 5) return BookOpen;
  if (k.includes('private') || k.includes('خصوص') || id === 3 || id === 1) return GraduationCap;
  if (k.includes('lang') || k.includes('لغ') || id === 2) return Globe;
  if (k.includes('qiyas') || k.includes('قدرات') || k.includes('abilit') || id === 6) return Award;
  if (k.includes('course') || k.includes('دور') || id === 4) return BookOpen;
  return GraduationCap;
};

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);

  const handleTeacherClick = (teacher: any) => {
    if (onTeacherSelect) {
      const primarySvc = teacher?.profile?.services?.[0] || teacher?.services?.[0];
      const sId = primarySvc?.service_id || (teacher?.main_service_key === 'language_learning' ? 2 : 3);
      onTeacherSelect(teacher, sId);
    } else {
      onNavigate('private-lessons');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bookings, teachers, allCourses, pkgs, rawServices] = await Promise.all([
          studentService.getBookings().catch(() => []),
          studentService.getTeachers().catch(() => []),
          studentService.getCourses().catch(() => []),
          studentService.getPublicPackages().catch(() => []),
          studentService.getServices().catch(() => []),
        ]);

        if (Array.isArray(bookings) && bookings.length > 0) {
          setLastBooking(bookings[0]);
        }

        setTopTeachers(Array.isArray(teachers) ? teachers.slice(0, 4) : []);
        setCourses(Array.isArray(allCourses) ? allCourses.slice(0, 3) : []);
        setPackages(Array.isArray(pkgs) ? pkgs.slice(0, 3) : []);

        const list = Array.isArray(rawServices) ? rawServices : [];
        const filtered = list.filter((s: any) => {
          const k = (s.key_name || '').toLowerCase();
          const nameAr = (s.name_ar || s.name || '').toString().toLowerCase();
          const nameEn = (s.name_en || s.name || '').toString().toLowerCase();
          const isAi =
            k === 'smart-assistant' ||
            k === 'smart_assistant' ||
            k === 'ai-assistant' ||
            k === 'ai_assistant' ||
            k === 'ai-chat' ||
            k === 'ai_chat' ||
            nameAr.includes('ذكاء') ||
            nameEn.includes('ai') ||
            s.id === 7;
          return !isAi;
        });

        if (filtered.length > 0) {
          setServices(filtered);
        } else {
          setServices([
            { id: 3, key_name: 'private_lesson', name_ar: 'الدروس الخصوصية', name_en: 'Private Lessons', status: 1 },
            { id: 6, key_name: 'abilities', name_ar: 'القدرات والتحصيلي', name_en: 'Abilities and achievement', status: 1 },
            { id: 2, key_name: 'language_learning', name_ar: 'تعلم اللغات', name_en: 'Language Learning', status: 1 },
            { id: 4, key_name: 'courses', name_ar: 'الدورات المخصصة', name_en: 'Specialized Courses', status: 1 },
            { id: 5, key_name: 'books', name_ar: 'الكتب الدراسية', name_en: 'Study Books', status: 1 },
          ]);
        }
      } catch (e) {
        console.error("Overview Data Fetch Error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleServiceClick = (item: ServiceItem) => {
    const statusVal = item.status;
    const isActiveVal = item.is_active;
    const isDisabledVal = item.is_disabled;
    const isDisabled =
      statusVal === 0 ||
      statusVal === '0' ||
      statusVal === false ||
      isActiveVal === 0 ||
      isActiveVal === '0' ||
      isActiveVal === false ||
      isDisabledVal === 1 ||
      isDisabledVal === '1' ||
      isDisabledVal === true;

    if (isDisabled) return;

    const key = (item.key_name || '').toLowerCase();
    const id = Number(item.id);

    if (key === 'study-books' || key === 'books' || key === 'study_books' || id === 5) {
      window.open('https://www.kottby.net/', '_blank');
      return;
    }
    if (key === 'courses' || id === 4) {
      onNavigate('courses');
      return;
    }
    if (key === 'language_learning' || id === 2) {
      onNavigate('private-lessons', 2);
      return;
    }
    onNavigate('private-lessons', id);
  };

  const getSubjectName = (booking: Booking): string => {
    if (booking.teacher_subject) {
      return language === 'ar' ? (booking.teacher_subject.name_ar || booking.teacher_subject.name_en) : (booking.teacher_subject.name_en || booking.teacher_subject.name_ar);
    }
    if (typeof booking.subject === 'object' && booking.subject !== null) {
      const subj = booking.subject as any;
      return language === 'ar' ? (subj.name_ar || subj.name || subj.title_ar || subj.title || subj.name_en) : (subj.name_en || subj.name || subj.title_en || subj.title || subj.name_ar);
    }
    if (typeof booking.subject === 'string' && booking.subject.trim()) {
      return booking.subject;
    }
    if (booking.language) {
      return language === 'ar' ? (booking.language.name_ar || booking.language.name_en) : (booking.language.name_en || booking.language.name_ar);
    }
    if (booking.course) {
      return language === 'ar' ? (booking.course.title_ar || booking.course.name_ar || booking.course.title || booking.course.name) : (booking.course.title_en || booking.course.name_en || booking.course.title || booking.course.name);
    }
    if (booking.service) {
      return language === 'ar' ? (booking.service.name_ar || booking.service.name_en) : (booking.service.name_en || booking.service.name_ar);
    }
    if (booking.general_service) {
      return language === 'ar' ? (booking.general_service.title_ar || booking.general_service.name_ar) : (booking.general_service.title_en || booking.general_service.name_en);
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
    return language === 'ar' ? 'جلسة تعليمية' : 'Educational Session';
  };

  const getStatusBadgeData = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          label: language === 'ar' ? 'مؤكد' : 'Confirmed',
          className: 'bg-[var(--green-pale)] text-primary'
        };
      case 'pending_payment':
        return {
          label: language === 'ar' ? 'في انتظار الدفع' : 'Pending Payment',
          className: 'bg-yellow-100 text-yellow-800'
        };
      case 'completed':
        return {
          label: language === 'ar' ? 'مكتمل' : 'Completed',
          className: 'bg-emerald-100 text-emerald-800'
        };
      case 'cancelled':
        return {
          label: language === 'ar' ? 'ملغي' : 'Cancelled',
          className: 'bg-red-100 text-red-700'
        };
      default:
        return {
          label: status,
          className: 'bg-[var(--accent-pale)] text-[var(--accent)]'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden bg-gradient-to-br from-[var(--navy-dark)] via-[var(--navy)] to-[var(--navy-mid)] rounded-[var(--radius-lg)] p-8 text-white shadow-[var(--shadow-lg)]">
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-[var(--green-light)] opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-10 w-72 h-72 rounded-full bg-[var(--accent)] opacity-10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[50px] bg-white/10 text-[var(--green-light)] text-xs font-bold mb-4 border border-white/10">
              {t.overview}
            </span>
            <h1 className="text-3xl font-bold mb-2">
              {t.welcomeBack} {user.first_name}!
            </h1>
            <p className="text-[var(--green-light)] opacity-90">
              {language === 'ar' ? 'جاهز لتعلم شيء جديد ومميز اليوم؟' : 'Ready to learn something new today?'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('orders')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all border border-white/15 backdrop-blur-sm"
            >
              {language === 'ar' ? 'طلباتي الخاصة' : 'My Orders'}
            </button>
            <button
              onClick={() => onNavigate('subscriptions')}
              className="px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-95 text-navy font-bold text-sm transition-all shadow-md"
            >
              {language === 'ar' ? 'باقاتي واشتراكاتي' : 'My Packages'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--text-main)]">
            {language === 'ar' ? 'الخدمات التعليمية' : 'Educational Services'}
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {services.map((service) => {
            const key = (service.key_name || '').toLowerCase();
            const Icon = getServiceIcon(key, service.id);
            const title = language === 'ar'
              ? (service.name_ar || service.name || service.title || '')
              : (service.name_en || service.name || service.title || '');
            const isExternal = key === 'study-books' || key === 'books' || key === 'study_books' || service.id === 5;
            const statusVal = service.status;
            const isActiveVal = service.is_active;
            const isDisabledVal = service.is_disabled;
            const isDisabled =
              statusVal === 0 ||
              statusVal === '0' ||
              statusVal === false ||
              isActiveVal === 0 ||
              isActiveVal === '0' ||
              isActiveVal === false ||
              isDisabledVal === 1 ||
              isDisabledVal === '1' ||
              isDisabledVal === true;

            const imageUrl = service.image ? getStorageUrl(service.image) : null;

            return (
              <div
                key={service.id}
                onClick={() => handleServiceClick(service)}
                className={`relative overflow-hidden bg-white p-5 rounded-[var(--radius-md)] border border-[var(--border)] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between items-start gap-3 cursor-pointer group ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="h-11 w-11 rounded-xl bg-[var(--light-bg)] group-hover:bg-primary-pale text-primary flex items-center justify-center transition-colors overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={title}
                        className="h-7 w-7 object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Icon size={22} />
                    )}
                  </div>
                  {isExternal && (
                    <ExternalLink size={14} className="text-[var(--text-muted)] group-hover:text-primary transition-colors" />
                  )}
                  {isDisabled && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                      {language === 'ar' ? 'قريباً' : 'Soon'}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-main)] group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {isExternal ? (language === 'ar' ? 'رابط خارجي' : 'External') : (language === 'ar' ? 'استعراض المعلمين' : 'Browse')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 rounded-[var(--radius-lg)] p-6 md:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/20">
              <Bot size={32} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold mb-1 border border-white/10">
                <Sparkles size={12} />
                <span>{language === 'ar' ? 'ذكاء اصطناعي تفاعلي' : 'AI Powered'}</span>
              </div>
              <h3 className="text-xl font-bold">
                {language === 'ar' ? 'المساعد التعليمي الذكي' : 'AI Educational Assistant'}
              </h3>
              <p className="text-white/80 text-sm mt-1 max-w-xl">
                {language === 'ar'
                  ? 'اطرح أسئلتك الأكاديمية والواجبات المدرسية وتلخيص الدروس مباشرة وسيقوم المساعد الذكي بالإجابة الفورية.'
                  : 'Ask your academic questions, homework inquiries, and lesson summaries for instant intelligent answers.'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => onNavigate('ai')}
            className="bg-white text-emerald-800 hover:bg-white/90 font-bold px-6 py-3 shrink-0 flex items-center gap-2 shadow-sm rounded-xl"
          >
            <span>{language === 'ar' ? 'ابدأ المحادثة الآن' : 'Start Chatting Now'}</span>
            <ArrowIcon size={16} />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--text-main)]">{t.lastBooking}</h2>
          <button className="text-sm text-primary font-medium hover:underline" onClick={() => onNavigate('schedule')}>
            {t.viewAll}
          </button>
        </div>

        {lastBooking ? (
          <div className="relative overflow-hidden bg-white p-6 rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[var(--green-light)] to-[var(--green)]" />
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[var(--radius-sm)] bg-[var(--green-pale)] text-primary flex items-center justify-center">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-main)]">{getSubjectName(lastBooking)}</h3>
                <p className="text-[var(--text-muted)] text-sm">{language === 'ar' ? 'مع' : 'with'} {lastBooking.teacher?.first_name} {lastBooking.teacher?.last_name}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                  <span>
                    {(() => {
                      const d = lastBooking.schedule?.first_session_date || lastBooking.booking_date || lastBooking.created_at;
                      if (!d) return '';
                      try {
                        return new Date(d).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
                      } catch {
                        return String(d).split('T')[0];
                      }
                    })()}
                  </span>
                  {(() => {
                    const badge = getStatusBadgeData(lastBooking.status);
                    return (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${badge.className}`}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:flex-none text-xs h-10" onClick={() => onNavigate('bookings')}>
                {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-[var(--light-bg)] rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-[var(--text-muted)]">
            {t.noBookings}
          </div>
        )}
      </div>

      {packages.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                <Package size={22} className="text-primary" />
                {language === 'ar' ? 'باقات الساعات التعليمية' : 'Educational Packages'}
              </h2>
            </div>
            <button
              className="text-sm text-primary font-medium hover:underline"
              onClick={() => onNavigate('subscriptions')}
            >
              {t.viewAll}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {packages.map((pkg) => {
              const name = language === 'ar' ? (pkg.name_ar || pkg.name) : (pkg.name_en || pkg.name);
              const desc = language === 'ar' ? (pkg.description_ar || pkg.description) : (pkg.description_en || pkg.description);
              return (
                <div
                  key={pkg.id}
                  className="relative overflow-hidden bg-white p-6 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-pale text-primary">
                        {pkg.sessions_count || 1} {language === 'ar' ? 'حصص' : 'Sessions'}
                      </span>
                      {pkg.discount_percentage > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600">
                          {pkg.discount_percentage}% {language === 'ar' ? 'خصم' : 'OFF'}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-main)] mb-1">{name}</h3>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-4">{desc}</p>
                  </div>
                  <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                    <div>
                      <span className="text-xl font-black text-primary">{Number(pkg.price).toFixed(2)}</span>
                      <span className="text-xs text-[var(--text-muted)] mr-1 ml-1">{t.sar}</span>
                    </div>
                    <Button
                      variant="outline"
                      className="text-xs h-9 px-4 rounded-xl"
                      onClick={() => onNavigate('subscriptions')}
                    >
                      {language === 'ar' ? 'تفاصيل الباقة' : 'View Package'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--text-main)]">{t.topTeachers}</h2>
          <button className="text-sm text-primary font-medium hover:underline" onClick={() => onNavigate('private-lessons')}>
            {t.viewAll}
          </button>
        </div>

        {topTeachers.length === 0 ? (
          <div className="text-center py-10 bg-[var(--light-bg)] rounded-[var(--radius-md)] text-[var(--text-muted)]">No teachers found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topTeachers.map((teacher) => {
              const profile = teacher?.profile || {};
              const profileImage = profile.profile_photo || teacher?.profile_image || null;
              const firstName = teacher?.first_name || '';
              const lastName = teacher?.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim() || (language === 'ar' ? 'معلم متميز' : 'Featured Teacher');
              const verified = Boolean(teacher?.verified ?? profile?.verified);

              const subjects = profile?.teacher_subjects || teacher?.teacher_subjects || [];
              const languages = profile?.languages || teacher?.languages || [];
              const servicesList = profile?.services || teacher?.services || [];

              let specialization = '';
              if (subjects.length > 0) {
                specialization = subjects[0]?.name_ar || subjects[0]?.title || subjects[0]?.name || '';
              } else if (languages.length > 0) {
                specialization = (language === 'ar' ? languages[0]?.name_ar : languages[0]?.name_en) || languages[0]?.name || '';
              } else if (servicesList.length > 0) {
                specialization = (language === 'ar' ? servicesList[0]?.name_ar : servicesList[0]?.name_en) || servicesList[0]?.name || '';
              }
              if (!specialization) {
                specialization = language === 'ar' ? 'معلم خصوصي' : 'Private Tutor';
              }

              const rawPrice = profile?.individual_hour_price ?? teacher?.individual_hour_price ?? (subjects[0]?.hourly_rate ?? 0);
              const numPrice = Number(rawPrice) || 0;
              const rateDisplay = numPrice > 0 ? (numPrice % 1 === 0 ? numPrice.toString() : numPrice.toFixed(1)) : '99';

              const ratingVal = Number(profile?.rating ?? teacher?.rating) || 4.8;
              const ratingDisplay = ratingVal.toFixed(1);

              return (
                <div
                  key={teacher.id}
                  onClick={() => handleTeacherClick(teacher)}
                  className="bg-white p-3.5 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full border-2 border-primary/30 bg-[var(--light-bg)] overflow-hidden flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {profileImage ? (
                          <img src={getStorageUrl(profileImage)} alt={fullName} className="h-full w-full object-cover" />
                        ) : (
                          (firstName?.charAt(0) || 'T').toUpperCase()
                        )}
                      </div>
                      {verified && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white">
                          <Check size={8} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTeacherClick(teacher);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      {language === 'ar' ? 'احجز الآن' : 'Book Now'}
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-main)] truncate">
                      {fullName}
                    </h3>

                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <div className="flex items-center gap-1 min-w-0 text-[11px] text-[var(--text-muted)]">
                        <BookOpen size={12} className="shrink-0 text-[var(--text-muted)]" />
                        <span className="truncate">{specialization}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-[var(--text-main)]">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span>{ratingDisplay}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-gray-100 flex items-baseline gap-1">
                    <span className="text-base font-black text-[var(--text-main)]">
                      {rateDisplay}
                    </span>
                    <span className="text-[11px] font-bold text-primary">
                      {language === 'ar' ? 'ر.س/ساعة' : 'SAR/hr'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--text-main)]">{t.recommendedCourses}</h2>
          <button className="text-sm text-primary font-medium hover:underline" onClick={() => onNavigate('courses')}>
            {t.viewAll}
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-10 bg-[var(--light-bg)] rounded-[var(--radius-md)] text-[var(--text-muted)]">No courses available.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="relative overflow-hidden bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-[3px] transition-all">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[var(--green-light)] to-[var(--green)] z-10" />
                <div className="h-32 bg-[var(--light-bg)] flex items-center justify-center text-[var(--text-muted)] overflow-hidden">
                  {course.cover_image ? (
                    <img src={getStorageUrl(course.cover_image)} alt={course.name} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen size={40} />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-[var(--text-main)] mb-1 truncate">{course.name}</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-4 truncate">by {course.teacher_basic?.first_name} {course.teacher_basic?.last_name}</p>
                  <div className="flex items-center justify-between mb-4 text-xs text-[var(--text-muted)] font-medium bg-[var(--light-bg)] p-2 rounded-lg">
                    <span className="flex items-center gap-1"><PlayCircle size={14} className="text-primary" /> {course.duration_hours || 'N/A'} Hours</span>
                    <span>{course.course_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{Number(course.price).toFixed(2)} {t.sar}</span>
                    <Button variant="outline" className="h-9 text-xs px-3" onClick={() => onNavigate('courses')}>View</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
