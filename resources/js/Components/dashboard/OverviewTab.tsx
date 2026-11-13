import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { 
  DollarSign, 
  BookOpen, 
  ArrowUpRight, 
  Calendar, 
  Loader2, 
  AlertTriangle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  GraduationCap, 
  Globe, 
  Award, 
  Package, 
  X,
  Sparkles,
  Bell,
  Star,
  Check,
  User
} from 'lucide-react';
import { 
  UserData, 
  teacherService, 
  studentService, 
  abilityService, 
  languageService, 
  notificationService, 
  getStorageUrl 
} from '../../Services/api';
import { AdsBanner } from './AdsBanner';
import { TeacherPublicProfileModal } from '../teacher/TeacherPublicProfileModal';

interface OverviewTabProps {
  user: UserData;
  onNavigate?: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ user, onNavigate }) => {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';
  
  const [loading, setLoading] = useState(true);
  const [isActive, setIsActive] = useState<boolean>(Boolean(user.is_active || user.profile?.is_active));
  const [isTogglingStatus, setIsTogglingStatus] = useState<boolean>(false);
  const [showBlockedDialog, setShowBlockedDialog] = useState<boolean>(false);
  const [blockedRequirements, setBlockedRequirements] = useState<string[]>([]);
  
  const [balance, setBalance] = useState<number>(0);
  const [monthEarnings, setMonthEarnings] = useState<number>(0);
  
  const [subjectsCount, setSubjectsCount] = useState<number>(0);
  const [languagesCount, setLanguagesCount] = useState<number>(0);
  const [abilitiesCount, setAbilitiesCount] = useState<number>(0);
  const [coursesCount, setCoursesCount] = useState<number>(0);
  const [slotsCount, setSlotsCount] = useState<number>(0);
  const [isPackageOn, setIsPackageOn] = useState<boolean>(Boolean(user.profile?.package_on_off));
  
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [featuredTeachers, setFeaturedTeachers] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [hasAi, setHasAi] = useState<boolean>(false);

  const isVerified = Boolean(user.verified || user.profile?.verified);
  const hourPrice = Number(user.profile?.individual_hour_price || 0);
  const hasPrice = hourPrice > 0;

  const profile = user.profile;
  const mainKey = String(profile?.main_service_key || '').toLowerCase();
  const isLanguageService = mainKey.includes('lang') || profile?.service === 2;
  const isAbilityService = mainKey.includes('abilit');
  const isCourseService = mainKey.includes('course') || mainKey.includes('training') || profile?.service === 4;
  const isPrivateService = mainKey.includes('private') || profile?.service === 3 || (!isLanguageService && !isAbilityService && !isCourseService);

  const activeServicesList = Array.isArray(profile?.services) ? profile!.services : [];
  const hasLangTool = isLanguageService || activeServicesList.some((s: any) => String(s?.key_name || s?.service?.key_name || '').toLowerCase().includes('lang'));
  const hasAbilityTool = isAbilityService || activeServicesList.some((s: any) => String(s?.key_name || s?.service?.key_name || '').toLowerCase().includes('abilit'));
  const hasCourseTool = isCourseService || activeServicesList.some((s: any) => {
    const k = String(s?.key_name || s?.service?.key_name || '').toLowerCase();
    return k.includes('course') || k.includes('training');
  });
  const hasPrivateTool = isPrivateService || activeServicesList.some((s: any) => String(s?.key_name || s?.service?.key_name || '').toLowerCase().includes('private'));

  const primaryCount = isLanguageService 
    ? languagesCount 
    : isAbilityService 
    ? abilitiesCount 
    : isCourseService 
    ? coursesCount 
    : subjectsCount;

  const hasSubjects = primaryCount > 0;
  const hasSlots = slotsCount > 0;
  const isProfileComplete = hasPrice && hasSlots && hasSubjects;

  useEffect(() => {
    let cancelled = false;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [
          activeStatusRes,
          walletData,
          subjectsData,
          availabilityData,
          packagesRes,
          notifsRes,
          servicesRes,
          teachersRes
        ] = await Promise.all([
          teacherService.getActiveStatus().catch(() => null),
          teacherService.getWallet().catch(() => null),
          teacherService.getSubjects().catch(() => []),
          teacherService.getAvailability().catch(() => []),
          teacherService.getPackages().catch(() => null),
          notificationService.getAll().catch(() => []),
          studentService.getServices().catch(() => []),
          studentService.getTeachers().catch(() => [])
        ]);

        if (cancelled) return;

        if (activeStatusRes !== null) {
          const remoteActive = Boolean(activeStatusRes?.is_active ?? activeStatusRes?.active ?? activeStatusRes);
          setIsActive(remoteActive);
        }

        if (walletData) {
          setBalance(Number(walletData.balance || user.current_balance || 0));
          setMonthEarnings(Number(walletData.month_earnings || walletData.balance || 0));
        }

        if (Array.isArray(subjectsData)) {
          setSubjectsCount(subjectsData.length);
        }

        if (Array.isArray(availabilityData)) {
          let count = 0;
          for (const item of availabilityData) {
            if (Array.isArray(item.time_slots)) count += item.time_slots.length;
            else if (Array.isArray(item.times)) count += item.times.length;
            else count += 1;
          }
          setSlotsCount(count);
        }

        if (packagesRes?.data?.offer_packages !== undefined) {
          setIsPackageOn(Boolean(packagesRes.data.offer_packages));
        }

        if (Array.isArray(notifsRes)) {
          const unread = notifsRes.filter((n: any) => !n.is_read).length;
          setUnreadNotificationsCount(unread);
        }

        if (Array.isArray(servicesRes)) {
          const aiFound = servicesRes.some((s: any) => {
            const key = String(s?.key_name || s?.key || '').toLowerCase();
            const statusVal = s?.status;
            const isActiveVal = s?.is_active;
            const isDisabledVal = s?.is_disabled;
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

            const isAi =
              key === 'smart-assistant' ||
              key === 'smart_assistant' ||
              key === 'ai-assistant' ||
              key === 'ai_assistant' ||
              key === 'ai-chat' ||
              key === 'ai_chat';

            return isAi && !isDisabled;
          });
          setHasAi(aiFound);
        }

        if (Array.isArray(teachersRes)) {
          const filtered = teachersRes.filter((t: any) => t.id !== user.id);
          setFeaturedTeachers(filtered);
        }

        if (hasLangTool && user.id) {
          languageService.getTeacherLanguages(user.id)
            .then(res => {
              if (!cancelled && Array.isArray(res)) setLanguagesCount(res.length);
            })
            .catch(() => {});
        }

        if (hasAbilityTool && user.id) {
          abilityService.getTeacherAbilities(user.id)
            .then(res => {
              if (!cancelled && Array.isArray(res)) setAbilitiesCount(res.length);
            })
            .catch(() => {});
        }

        if (hasCourseTool) {
          teacherService.getCourses()
            .then(res => {
              if (!cancelled && Array.isArray(res)) setCoursesCount(res.length);
            })
            .catch(() => {});
        }

      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAllData();

    return () => {
      cancelled = true;
    };
  }, [user.id, hasLangTool, hasAbilityTool, hasCourseTool]);

  const handleToggleSwitch = async () => {
    if (isTogglingStatus) return;

    if (isActive) {
      setIsTogglingStatus(true);
      try {
        await teacherService.updateActiveStatus(false);
        setIsActive(false);
      } catch (err) {
        console.error(err);
      } finally {
        setIsTogglingStatus(false);
      }
      return;
    }

    const missing: string[] = [];
    if (!isVerified) {
      missing.push(isAr ? 'توثيق الحساب' : 'Account verification');
    }
    if (!hasPrice) {
      missing.push(isAr ? 'سعر ساعة التدريس' : 'Individual hourly price');
    }
    if (!hasSlots) {
      missing.push(isAr ? 'الفترات المتاحة' : 'Available time slots');
    }
    if (!hasSubjects) {
      if (isCourseService) {
        missing.push(isAr ? 'تسجيل الدورات التدريبية' : 'Training courses');
      } else if (isLanguageService) {
        missing.push(isAr ? 'تسجيل اللغات' : 'Languages');
      } else if (isAbilityService) {
        missing.push(isAr ? 'تسجيل القدرات' : 'Abilities');
      } else {
        missing.push(isAr ? 'تسجيل المواد الدراسية' : 'Subjects');
      }
    }

    if (missing.length > 0) {
      setBlockedRequirements(missing);
      setShowBlockedDialog(true);
      return;
    }

    setIsTogglingStatus(true);
    try {
      await teacherService.updateActiveStatus(true);
      setIsActive(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const getSubjectQuickActionLabel = () => {
    if (isCourseService) return isAr ? 'إضافة دورات' : 'Add Courses';
    if (isLanguageService) return isAr ? 'اللغات' : 'Languages';
    if (isAbilityService) return isAr ? 'القدرات' : 'Abilities';
    return isAr ? 'الفصول والمواد' : 'Subjects';
  };

  const getSubjectQuickActionTab = () => {
    if (isCourseService) return 'courses';
    if (isLanguageService) return 'languages';
    if (isAbilityService) return 'abilities';
    return 'private-lessons';
  };

  if (loading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="animate-spin text-[#5B9F48] h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
            {profile?.profile_photo ? (
              <img src={getStorageUrl(profile.profile_photo)} alt={user.first_name} className="w-full h-full object-cover" />
            ) : (
              <User className="text-slate-400" size={24} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">
              {isAr ? 'مرحباً بك' : 'Welcome'}
            </p>
            <h2 className="text-base sm:text-lg font-bold text-[#0D4A5F] truncate">
              {user.first_name} {user.last_name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
            <span className="text-xs font-bold text-[#0D4A5F]">
              {isAr ? 'حالة الخدمة' : 'Service Status'}
            </span>
            <button
              type="button"
              onClick={handleToggleSwitch}
              disabled={isTogglingStatus}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? 'bg-[#5B9F48]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? (isAr ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                const notifBtn = document.querySelector('header button[title="notifications"], header button[aria-label="notifications"]') as HTMLButtonElement;
                if (notifBtn) {
                  notifBtn.click();
                } else if (onNavigate) {
                  onNavigate('more');
                }
              }}
              className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#0D4A5F] hover:bg-slate-50 transition"
            >
              <Bell size={20} />
            </button>
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#E43700] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadNotificationsCount > 9 ? '+9' : unreadNotificationsCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Teacher Profile Boost Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl shadow-sm border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
        (user.is_boosted || user.profile?.is_boosted)
          ? 'bg-gradient-to-r from-amber-50 to-amber-100/60 border-amber-300'
          : 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border-amber-200'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/20">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">
                {(user.is_boosted || user.profile?.is_boosted)
                  ? (isAr ? 'حسابك مروّج كمعلم مميز 🌟' : 'Featured Boost Active 🌟')
                  : (isAr ? 'روّج لحسابك كمعلم مميز' : 'Boost Your Profile as Featured Teacher')}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white">
                {isAr ? 'مميز' : 'Boost'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {(user.is_boosted || user.profile?.is_boosted)
                ? (isAr ? 'بنرك الشخصي معروض في بنرات الصفحة الرئيسية وتطبيق الجوال.' : 'Your profile banner is actively featured on home screen banners.')
                : (isAr ? 'اظهر في صدارة الصفحة الرئيسية وتطبيق الجوال لزيادة الحجوزات والطلاب.' : 'Appear on top of the home screen to maximize your student bookings.')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate('marketing')}
          className="whitespace-nowrap px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition"
        >
          {(user.is_boosted || user.profile?.is_boosted)
            ? (isAr ? 'إدارة الترويج' : 'Manage Boost')
            : (isAr ? 'ترقية الحساب الآن' : 'Boost Profile Now')}
        </button>
      </div>

      {!isProfileComplete && (
        <div className="bg-[#FFF7ED] border border-[#FDBA74] rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-xl text-[#EA580C] flex-shrink-0">
              <AlertCircle size={22} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#9A3412]">
                {isAr ? 'أكمل ملفك الشخصي لتتمكن من استقبال الطلاب' : 'Complete your profile to receive students'}
              </h3>
              <p className="text-xs text-[#C2410C] mt-1">
                {isAr ? 'يرجى إضافة المتطلبات المتبقية لتفعيل حسابك واستقبال طلبات الحصص' : 'Please add remaining requirements to activate account'}
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {!hasPrice && (
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('profile')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#FDBA74] rounded-lg text-xs font-bold text-[#9A3412] hover:bg-orange-50 transition"
                  >
                    <span>+</span>
                    <span>{isAr ? 'سعر الحصة' : 'Lesson Price'}</span>
                  </button>
                )}
                {!hasSlots && (
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('schedule')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#FDBA74] rounded-lg text-xs font-bold text-[#9A3412] hover:bg-orange-50 transition"
                  >
                    <span>+</span>
                    <span>{isAr ? 'المواعيد المتاحة' : 'Available Times'}</span>
                  </button>
                )}
                {!hasSubjects && (
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate(getSubjectQuickActionTab())}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#FDBA74] rounded-lg text-xs font-bold text-[#9A3412] hover:bg-orange-50 transition"
                  >
                    <span>+</span>
                    <span>{getSubjectQuickActionLabel()}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <AdsBanner />

      <div className="rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-[#0D4A5F] p-5 sm:p-6 text-white flex justify-between items-center">
          <div>
            <p className="text-xs text-white/80 font-medium">
              {isAr ? 'أرباح الشهر' : 'Month Earnings'}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#A2E048]">
                {monthEarnings.toFixed(0)}
              </span>
              <span className="text-sm font-bold text-[#A2E048]">
                {t.sar}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('wallet')}
            className="bg-[#A2E048] hover:bg-[#8ece38] text-[#0D4A5F] px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shadow-sm"
          >
            {isAr ? 'عرض المحفظة' : 'View Wallet'}
          </button>
        </div>
        <div className="bg-[#A2E048] py-2 px-4 flex items-center justify-center gap-1.5 text-xs font-bold text-[#0D4A5F]">
          <span>{isAr ? 'أرباح الشهر' : 'Month Earnings'}</span>
          <ArrowUpRight size={14} />
        </div>
      </div>

      {featuredTeachers.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-bold text-[#0D4A5F]">
              {isAr ? 'المعلمون المميزون' : 'Featured Teachers'}
            </h3>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('private-lessons')}
                className="text-xs font-bold text-[#5B9F48] hover:underline"
              >
                {isAr ? 'عرض الكل' : 'View All'}
              </button>
            )}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {featuredTeachers.map((teacher) => {
              const tProfile = teacher?.profile || {};
              const photo = tProfile.profile_photo || teacher?.profile_image || null;
              const fName = teacher?.first_name || '';
              const lName = teacher?.last_name || '';
              const fullName = `${fName} ${lName}`.trim() || (isAr ? 'معلم' : 'Teacher');
              const verified = Boolean(teacher?.verified ?? tProfile?.verified);

              const subs = tProfile?.teacher_subjects || teacher?.teacher_subjects || [];
              const langs = tProfile?.languages || teacher?.languages || [];
              const svcs = tProfile?.services || teacher?.services || [];

              let specialization = '';
              if (subs.length > 0) {
                specialization = subs[0]?.title || subs[0]?.name_ar || subs[0]?.name || '';
              } else if (langs.length > 0) {
                specialization = (isAr ? langs[0]?.name_ar : langs[0]?.name_en) || langs[0]?.name || '';
              } else if (svcs.length > 0) {
                specialization = (isAr ? svcs[0]?.name_ar : svcs[0]?.name_en) || svcs[0]?.name || '';
              }
              if (!specialization) {
                specialization = isAr ? 'معلم خصوصي' : 'Private Teacher';
              }

              const rawPrice = tProfile?.individual_hour_price ?? teacher?.individual_hour_price ?? (subs[0]?.hourly_rate ?? 0);
              const numPrice = Number(rawPrice) || 0;
              const rateDisplay = numPrice > 0 ? (numPrice % 1 === 0 ? numPrice.toString() : numPrice.toFixed(1)) : '99';

              const ratingVal = Number(tProfile?.rating ?? teacher?.rating) || 4.8;
              const ratingDisplay = ratingVal.toFixed(1);

              return (
                <div
                  key={teacher.id}
                  onClick={() => setSelectedTeacherId(teacher.id)}
                  className="w-[160px] flex-shrink-0 bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-[145px]"
                >
                  <div className="relative w-9 h-9">
                    <div className="w-9 h-9 rounded-full border-2 border-[#5B9F48]/30 overflow-hidden bg-slate-50 flex items-center justify-center">
                      {photo ? (
                        <img src={getStorageUrl(photo)} alt={fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-[#5B9F48]">{fName.charAt(0) || 'T'}</span>
                      )}
                    </div>
                    {verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#F49E00] flex items-center justify-center border border-white text-white">
                        <Check size={8} strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  <div className="mt-1">
                    <h4 className="text-xs font-bold text-[#0D4A5F] truncate">{fullName}</h4>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <BookOpen size={11} className="text-slate-400 shrink-0" />
                      <span className="truncate">{specialization}</span>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0 font-bold text-[#0D4A5F]">
                      <Star size={11} className="text-[#F49E00] fill-[#F49E00]" />
                      <span>{ratingDisplay}</span>
                    </div>
                  </div>

                  <div className="mt-1">
                    <span className="text-sm font-bold text-[#0D4A5F]">{rateDisplay} </span>
                    <span className="text-[10.5px] font-bold text-[#5B9F48]">
                      {isAr ? 'ر.س / ساعة' : 'SAR / hr'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-base font-bold text-[#0D4A5F] mb-3">
          {isAr ? 'أدوات التدريس' : 'Teaching Tools'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {hasPrivateTool && (
            <div
              onClick={() => onNavigate && onNavigate('private-lessons')}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer relative group flex flex-col justify-between min-h-[120px]"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#5B9F48] flex items-center justify-center">
                  <BookOpen size={24} />
                </div>
                {subjectsCount > 0 && (
                  <span className="bg-[#F49E00] text-white text-[11px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center">
                    {subjectsCount}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm font-bold text-slate-800 group-hover:text-[#0D4A5F] transition truncate">
                  {isAr ? 'الفصول والمواد' : 'Classes & Subjects'}
                </span>
                {isAr ? <ChevronLeft size={18} className="text-slate-400 group-hover:text-slate-700 transition" /> : <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-700 transition" />}
              </div>
            </div>
          )}

          {hasLangTool && (
            <div
              onClick={() => onNavigate && onNavigate('languages')}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer relative group flex flex-col justify-between min-h-[120px]"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Globe size={24} />
                </div>
                {languagesCount > 0 && (
                  <span className="bg-[#F49E00] text-white text-[11px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center">
                    {languagesCount}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm font-bold text-slate-800 group-hover:text-[#0D4A5F] transition truncate">
                  {isAr ? 'اللغات' : 'Languages'}
                </span>
                {isAr ? <ChevronLeft size={18} className="text-slate-400 group-hover:text-slate-700 transition" /> : <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-700 transition" />}
              </div>
            </div>
          )}

          {hasAbilityTool && (
            <div
              onClick={() => onNavigate && onNavigate('abilities')}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer relative group flex flex-col justify-between min-h-[120px]"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award size={24} />
                </div>
                {abilitiesCount > 0 && (
                  <span className="bg-[#F49E00] text-white text-[11px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center">
                    {abilitiesCount}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm font-bold text-slate-800 group-hover:text-[#0D4A5F] transition truncate">
                  {isAr ? 'القدرات' : 'Abilities'}
                </span>
                {isAr ? <ChevronLeft size={18} className="text-slate-400 group-hover:text-slate-700 transition" /> : <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-700 transition" />}
              </div>
            </div>
          )}

          {hasCourseTool && (
            <div
              onClick={() => onNavigate && onNavigate('courses')}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer relative group flex flex-col justify-between min-h-[120px]"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <GraduationCap size={24} />
                </div>
                {coursesCount > 0 && (
                  <span className="bg-[#F49E00] text-white text-[11px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center">
                    {coursesCount}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm font-bold text-slate-800 group-hover:text-[#0D4A5F] transition truncate">
                  {isAr ? 'الدورات' : 'Courses'}
                </span>
                {isAr ? <ChevronLeft size={18} className="text-slate-400 group-hover:text-slate-700 transition" /> : <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-700 transition" />}
              </div>
            </div>
          )}

          <div
            onClick={() => onNavigate && onNavigate('profile')}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer relative group flex flex-col justify-between min-h-[120px]"
          >
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#5B9F48] flex items-center justify-center">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm font-bold text-slate-800 group-hover:text-[#0D4A5F] transition truncate">
                {isAr ? 'تسعير الحصص' : 'Lesson Pricing'}
              </span>
              {isAr ? <ChevronLeft size={18} className="text-slate-400 group-hover:text-slate-700 transition" /> : <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-700 transition" />}
            </div>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('packages')}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer relative group flex flex-col justify-between min-h-[120px]"
          >
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Package size={24} />
              </div>
              <span
                className={`w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                  isPackageOn ? 'bg-[#5B9F48]' : 'bg-[#BDBDBD]'
                }`}
              />
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm font-bold text-slate-800 group-hover:text-[#0D4A5F] transition truncate">
                {isAr ? 'الباقات التعليمية' : 'Educational Packages'}
              </span>
              {isAr ? <ChevronLeft size={18} className="text-slate-400 group-hover:text-slate-700 transition" /> : <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-700 transition" />}
            </div>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('schedule')}
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer relative group flex flex-col justify-between min-h-[120px]"
          >
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Calendar size={24} />
              </div>
              {slotsCount > 0 && (
                <span className="bg-[#F49E00] text-white text-[11px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center">
                  {slotsCount}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm font-bold text-slate-800 group-hover:text-[#0D4A5F] transition truncate">
                {isAr ? 'جدولي الدراسي' : 'My Study Schedule'}
              </span>
              {isAr ? <ChevronLeft size={18} className="text-slate-400 group-hover:text-slate-700 transition" /> : <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-700 transition" />}
            </div>
          </div>
        </div>
      </div>

      {hasAi && (
        <div
          onClick={() => onNavigate && onNavigate('ai')}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-bl from-[#0D4A5F] via-[#13576C] to-[#1A5319] p-4 sm:p-5 text-white shadow-lg cursor-pointer hover:opacity-95 transition-all"
        >
          <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-[#C4E266]/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-4 right-10 w-20 h-20 rounded-full bg-[#5B9F48]/15 blur-lg pointer-events-none" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C4E266] to-[#5B9F48] flex items-center justify-center text-white shadow-md shrink-0">
              <Sparkles size={24} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold">
                  {isAr ? 'المساعد الذكي' : 'Smart Assistant'}
                </h4>
                <span className="bg-[#C4E266] text-[#0D4A5F] text-[10px] font-black px-1.5 py-0.5 rounded">
                  AI
                </span>
              </div>
              <p className="text-xs text-white/85 mt-1 line-clamp-2 leading-relaxed">
                {isAr
                  ? 'مساعدك الذكي لإعداد الحصص والخطط التعليمية وصياغة الأسئلة'
                  : 'Your smart assistant for lesson prep, teaching plans, and crafting questions'}
              </p>
            </div>

            <div className="w-9 h-9 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white shrink-0">
              {isAr ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </div>
          </div>
        </div>
      )}

      {showBlockedDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowBlockedDialog(false)}
              className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-[#F49E00] flex items-center justify-center mb-4">
                <AlertTriangle size={34} />
              </div>

              <h3 className="text-lg font-bold text-[#0D4A5F]">
                {isAr ? 'تفعيل استقبال الحصص' : 'Activate Lesson Receiving'}
              </h3>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {!isVerified
                  ? (isAr
                      ? 'حسابك قيد المراجعة والتدقيق من قبل الإدارة. سيتم إشعارك فور اكتمال التوثيق لتتمكن من استقبال طلبات الطلاب.'
                      : 'Your account is under review by administration.')
                  : (isAr
                      ? 'يرجى استكمال المتطلبات التالية لتتمكن من تفعيل استقبال الحصص وبدء العمل:'
                      : 'Please complete the following requirements to activate receiving lessons:')}
              </p>

              {blockedRequirements.length > 0 && (
                <div className="w-full bg-[#EFF6F4] rounded-2xl p-3.5 my-4 space-y-2 text-start">
                  {blockedRequirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <AlertCircle size={15} className="text-[#E43700] flex-shrink-0" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowBlockedDialog(false)}
                className="w-full mt-2 bg-[#5B9F48] hover:bg-[#4d863d] text-white py-3 rounded-xl font-bold text-sm transition"
              >
                {isAr ? 'حسناً' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTeacherId && (
        <TeacherPublicProfileModal
          teacherId={selectedTeacherId}
          isOpen={true}
          onClose={() => setSelectedTeacherId(null)}
        />
      )}
    </div>
  );
};
