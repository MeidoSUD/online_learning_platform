import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  ArrowLeft,
  ArrowRight,
  Share2,
  Heart,
  Star,
  Award,
  GraduationCap,
  BookOpen,
  CreditCard,
  Video,
  Play,
  Check,
  X,
  Loader2,
  Sparkles
} from 'lucide-react';
import { studentService, getStorageUrl, fetchWithAuth } from '../../Services/api';
import { BookingFlowModal } from './BookingFlowModal';

interface TeacherDetailsPageProps {
  teacher?: any;
  serviceId?: number | string;
  onBack: () => void;
  onBookingComplete?: () => void;
}

const normalizeMediaUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  const storageIndex = trimmed.indexOf('/storage/');
  if (storageIndex !== -1) {
    return trimmed.substring(storageIndex);
  }
  const clean = trimmed.replace(/^\//, '');
  if (clean.startsWith('storage/')) {
    return `/${clean}`;
  }
  if (
    clean.startsWith('teachers/') ||
    clean.startsWith('images/') ||
    clean.startsWith('profile_photos/') ||
    clean.startsWith('course_covers/') ||
    clean.startsWith('certificates/')
  ) {
    return `/storage/${clean}`;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return getStorageUrl(clean);
};

export const TeacherDetailsPage: React.FC<TeacherDetailsPageProps> = ({
  teacher: initialTeacher,
  serviceId,
  onBack,
  onBookingComplete
}) => {
  const { language, direction } = useLanguage();
  const [teacherData, setTeacherData] = useState<any>(initialTeacher || null);
  const [loading, setLoading] = useState<boolean>(!initialTeacher);
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState<boolean>(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);

  const isArabic = language === 'ar';

  useEffect(() => {
    let isMounted = true;

    const loadTeacher = async () => {
      let targetId: number | null = null;
      if (initialTeacher?.id) {
        targetId = Number(initialTeacher.id);
      } else if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlId = params.get('teacher_id') || params.get('id');
        if (urlId) {
          targetId = Number(urlId);
        } else {
          try {
            const saved = sessionStorage.getItem('selected_teacher_id');
            if (saved) targetId = Number(saved);
          } catch (_) {}
        }
      }

      if (targetId && !isNaN(targetId) && targetId > 0) {
        try {
          const res = await fetchWithAuth(`/teachers/${targetId}`);
          if (isMounted && res) {
            const fetched = res.data || res;
            setTeacherData(fetched);
            const fav = fetched.has_favorited === true || fetched.is_favorite === true || fetched.is_favorited === true;
            setIsFavorited(fav);
            setLoading(false);
            return;
          }
        } catch (_) {}
      }

      if (!initialTeacher) {
        try {
          const teachers = await studentService.getTeachers();
          if (isMounted && Array.isArray(teachers) && teachers.length > 0) {
            const firstTeacher = teachers[0];
            const detailRes = await fetchWithAuth(`/teachers/${firstTeacher.id}`);
            const finalData = detailRes?.data || detailRes || firstTeacher;
            setTeacherData(finalData);
            const fav = finalData.has_favorited === true || finalData.is_favorite === true || finalData.is_favorited === true;
            setIsFavorited(fav);
          }
        } catch (_) {}
      } else {
        const fav = initialTeacher.has_favorited === true || initialTeacher.is_favorite === true || initialTeacher.is_favorited === true;
        setIsFavorited(fav);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    loadTeacher();

    return () => {
      isMounted = false;
    };
  }, [initialTeacher?.id]);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setIsScrolled(window.scrollY > 80);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const profile = teacherData?.profile || {};

  const getDisplayName = (): string => {
    const firstName = teacherData?.first_name || teacherData?.firstName || profile?.first_name || '';
    const lastName = teacherData?.last_name || teacherData?.lastName || profile?.last_name || '';
    const full = `${firstName} ${lastName}`.trim();
    if (full.length > 0) return full;
    const directName = teacherData?.name || profile?.name || '';
    if (directName.trim().length > 0) return directName.trim();
    return isArabic ? 'معلم' : 'Teacher';
  };

  const getProfileImage = (): string => {
    const raw =
      teacherData?.profile_image ||
      teacherData?.photo ||
      profile?.profile_photo ||
      profile?.profile_image ||
      teacherData?.avatar ||
      '';
    return normalizeMediaUrl(raw);
  };

  const getRating = (): number => {
    const val = teacherData?.rating ?? profile?.rating ?? 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const getStudentsCount = (): number => {
    const val =
      teacherData?.total_students ??
      teacherData?.students_count ??
      teacherData?.students ??
      profile?.total_students ??
      profile?.students_count ??
      profile?.students ??
      0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const getLessonsCount = (): number => {
    const val =
      teacherData?.total_lessons ??
      teacherData?.completed_lessons ??
      teacherData?.lessons_count ??
      teacherData?.lessons ??
      profile?.total_lessons ??
      profile?.completed_lessons ??
      profile?.bookings_count ??
      profile?.subjects_count ??
      0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const getHourlyPrice = (): number => {
    const val =
      teacherData?.individual_hour_price ??
      teacherData?.price_hour ??
      teacherData?.price ??
      profile?.individual_hour_price ??
      profile?.price_hour ??
      profile?.price ??
      0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  const getBio = (): string => {
    const raw = teacherData?.bio || profile?.bio || '';
    const trimmed = String(raw).trim();
    if (trimmed.length > 0) return trimmed;
    return isArabic ? 'لا توجد نبذة تعريفية مضافة بعد.' : 'No bio added yet.';
  };

  const getIntroVideo = (): string => {
    const raw =
      teacherData?.intro_video ||
      teacherData?.video_url ||
      teacherData?.video ||
      teacherData?.intro_video_url ||
      teacherData?.presentation_video ||
      profile?.intro_video ||
      profile?.video_url ||
      '';
    return normalizeMediaUrl(raw);
  };

  useEffect(() => {
    const rawVideo = getIntroVideo();
    if (!rawVideo) {
      setVideoThumbnail(null);
      return;
    }
    const vid = document.createElement('video');
    vid.src = `${rawVideo}#t=1.0`;
    vid.crossOrigin = 'anonymous';
    vid.muted = true;
    vid.playsInline = true;
    const onSeeked = () => {
      try {
        const cvs = document.createElement('canvas');
        cvs.width = vid.videoWidth || 640;
        cvs.height = vid.videoHeight || 360;
        const ctx = cvs.getContext('2d');
        if (ctx) {
          ctx.drawImage(vid, 0, 0, cvs.width, cvs.height);
          const data = cvs.toDataURL('image/jpeg', 0.85);
          if (data && data.length > 100) {
            setVideoThumbnail(data);
          }
        }
      } catch (_) {}
    };
    vid.addEventListener('seeked', onSeeked);
    vid.addEventListener('loadeddata', () => {
      try {
        vid.currentTime = 1;
      } catch (_) {}
    });
    vid.load();
    return () => {
      vid.removeEventListener('seeked', onSeeked);
    };
  }, [teacherData?.intro_video, profile?.intro_video]);

  const getServices = (): any[] => {
    const list = teacherData?.services || profile?.services || [];
    return Array.isArray(list) ? list : [];
  };

  const isLanguageService = (): boolean => {
    const mainKey = String(teacherData?.main_service_key || profile?.main_service_key || '').toLowerCase();
    if (mainKey.length > 0) return mainKey.includes('lang');
    const srvs = getServices();
    return srvs.some((s: any) => {
      const k = String(s?.key_name || s?.keyName || s?.name_en || '').toLowerCase();
      return k.includes('language') || k.includes('lang');
    });
  };

  const isAbilityService = (): boolean => {
    const mainKey = String(teacherData?.main_service_key || profile?.main_service_key || '').toLowerCase();
    if (mainKey.length > 0) return mainKey.includes('abilit');
    const srvs = getServices();
    return srvs.some((s: any) => {
      const k = String(s?.key_name || s?.keyName || s?.name_en || '').toLowerCase();
      return k.includes('abilit');
    });
  };

  const getSubjects = (): string[] => {
    const list: string[] = [];
    const subjects = teacherData?.teacher_subjects || profile?.teacher_subjects || [];
    if (Array.isArray(subjects)) {
      subjects.forEach((s: any) => {
        if (typeof s === 'string') {
          if (s.trim()) list.push(s.trim());
        } else if (s && typeof s === 'object') {
          const nameAr = s.name_ar || s.subject_name_ar || s.title || s.name;
          const nameEn = s.name_en || s.subject_name_en || s.title || s.name;
          const chosen = isArabic ? (nameAr || nameEn) : (nameEn || nameAr);
          if (chosen && String(chosen).trim()) list.push(String(chosen).trim());
        }
      });
    }
    return Array.from(new Set(list));
  };

  const getLanguages = (): string[] => {
    const list: string[] = [];
    const raw = teacherData?.teacher_languages || teacherData?.languages || profile?.teacher_languages || profile?.languages || [];
    if (Array.isArray(raw)) {
      raw.forEach((l: any) => {
        if (typeof l === 'string') {
          if (l.trim()) list.push(l.trim());
        } else if (l && typeof l === 'object') {
          const nameAr = l.name_ar || l.nameAr || l.title || l.name;
          const nameEn = l.name_en || l.nameEn || l.title || l.name;
          const chosen = isArabic ? (nameAr || nameEn) : (nameEn || nameAr);
          if (chosen && String(chosen).trim()) list.push(String(chosen).trim());
        }
      });
    }
    return Array.from(new Set(list));
  };

  const getAbilities = (): string[] => {
    const list: string[] = [];
    const raw = teacherData?.teacher_abilities || teacherData?.abilities || profile?.teacher_abilities || profile?.abilities || [];
    if (Array.isArray(raw)) {
      raw.forEach((a: any) => {
        if (typeof a === 'string') {
          if (a.trim()) list.push(a.trim());
        } else if (a && typeof a === 'object') {
          const nameAr = a.name_ar || a.nameAr || a.title || a.name;
          const nameEn = a.name_en || a.nameEn || a.title || a.name;
          const chosen = isArabic ? (nameAr || nameEn) : (nameEn || nameAr);
          if (chosen && String(chosen).trim()) list.push(String(chosen).trim());
        }
      });
    }
    return Array.from(new Set(list));
  };

  const getReviews = (): any[] => {
    const raw = teacherData?.reviews || profile?.reviews || [];
    if (!Array.isArray(raw)) return [];
    return raw.map((r: any, idx: number) => {
      let student = r.student_name || r.studentName || '';
      if (!student && r.user) {
        student = `${r.user.first_name || ''} ${r.user.last_name || ''}`.trim() || r.user.name || '';
      }
      if (!student) student = isArabic ? 'طالب' : 'Student';
      const ratingVal = Number(r.rating || 5);
      const commentVal = String(r.comment || '').trim();
      const dateVal = String(r.date || r.created_at || '').split('T')[0] || '';
      return {
        id: r.id || idx,
        studentName: student,
        rating: ratingVal,
        comment: commentVal,
        date: dateVal
      };
    });
  };

  const toggleFavorite = async () => {
    const teacherId = teacherData?.id;
    if (!teacherId || isTogglingFavorite) return;
    const prev = isFavorited;
    setIsFavorited(!prev);
    setIsTogglingFavorite(true);
    try {
      await studentService.toggleFavorite(Number(teacherId));
    } catch (_) {
      setIsFavorited(prev);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const copyTeacherCode = () => {
    const code = teacherData?.code || profile?.code || teacherData?.id || '';
    if (!code) return;
    const textToCopy = String(code).trim();
    navigator.clipboard.writeText(textToCopy).then(() => {
      const msg = isArabic
        ? `تم نسخ كود المعلم (${textToCopy})`
        : `Teacher code (${textToCopy}) copied`;
      setCopyToast(msg);
      setTimeout(() => setCopyToast(null), 2000);
    }).catch(() => {});
  };

  const displayName = getDisplayName();
  const profilePhoto = getProfileImage();
  const ratingVal = getRating();
  const isVerified = teacherData?.verified ?? profile?.verified ?? true;
  const isFounder = teacherData?.is_founder ?? profile?.is_founder ?? false;
  const introVideo = getIntroVideo();
  const studentsCount = getStudentsCount();
  const lessonsCount = getLessonsCount();
  const hourlyPrice = getHourlyPrice();
  const bioText = getBio();
  const services = getServices();
  const subjects = getSubjects();
  const languages = getLanguages();
  const abilities = getAbilities();
  const isLang = isLanguageService();
  const isAbil = isAbilityService();
  const showSubjects = !isLang && !isAbil;
  const reviews = getReviews();
  const reviewsCount = reviews.length;

  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r: any) => {
    const star = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
    ratingCounts[star] = (ratingCounts[star] || 0) + 1;
  });

  const sampleReviews = [
    {
      name: isArabic ? 'أحمد' : 'Ahmed',
      rating: 5,
      comment: isArabic ? 'شرح واضح جداً ومتعاون، وساعدني أفهم الحصة بطريقة أسهل' : 'Very clear and helpful explanation, helped me understand easily.'
    },
    {
      name: isArabic ? 'سارة' : 'Sarah',
      rating: 5,
      comment: isArabic ? 'أسلوب الشرح ممتاز، والمعلم صبور ويشرح النقاط الصعبة بشكل مبسط.' : 'Excellent explanation style, patient teacher.'
    },
    {
      name: isArabic ? 'محمد' : 'Mohammed',
      rating: 4,
      comment: isArabic ? 'الحصة كانت مفيدة جداً، وأتمنى فقط زيادة وقت حل التمارين.' : 'The lesson was very helpful, just hoping for more exercise time.'
    },
    {
      name: isArabic ? 'نورة' : 'Noura',
      rating: 4,
      comment: isArabic ? 'المعلم متمكن ويعطي أمثلة واضحة تساعد على فهم المعلومة بسرعة' : 'Skilled teacher who gives clear examples.'
    },
    {
      name: isArabic ? 'عبدالله' : 'Abdullah',
      rating: 3,
      comment: isArabic ? 'على قد الحال' : 'Average'
    }
  ];

  const resolvedServiceId = Number(serviceId) || Number(profile?.service) || Number(teacherData?.service) || 3;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFF6F4] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-[#5B9F48] animate-spin mb-4" />
        <span className="text-sm font-medium text-[#0D4A5F]">
          {isArabic ? 'جاري تحميل تفاصيل المعلم...' : 'Loading teacher details...'}
        </span>
      </div>
    );
  }

  return (
    <div
      dir={direction}
      className="min-h-screen bg-[#EFF6F4] relative pb-28 text-[#0D4A5F] selection:bg-[#5B9F48] selection:text-white"
    >
      <div
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
          isScrolled
            ? 'bg-white shadow-[0_3px_10px_rgba(0,0,0,0.08)] py-2.5 px-4 sm:px-6'
            : 'bg-transparent py-3 px-4 sm:px-6'
        }`}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBack}
              aria-label={isArabic ? 'رجوع' : 'Back'}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isScrolled
                  ? 'bg-[#0D4A5F]/10 text-[#0D4A5F] hover:bg-[#0D4A5F]/15'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              {direction === 'rtl' ? (
                <ArrowRight className="w-5 h-5" />
              ) : (
                <ArrowLeft className="w-5 h-5" />
              )}
            </button>

            {isScrolled && (
              <div className="flex items-center gap-2.5 animate-fade-in">
                <div className="w-9 h-9 rounded-full bg-white p-0.5 shadow-sm">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt={displayName}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/heros/teacher.png';
                      }}
                    />
                  ) : (
                    <img
                      src="/heros/teacher.png"
                      alt={displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#0D4A5F] leading-tight line-clamp-1">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-[#0D4A5F]/70">
                    {isVerified
                      ? (isArabic ? 'معلم موثّق' : 'Verified Teacher')
                      : (isArabic ? 'معلم' : 'Teacher')}
                  </span>
                </div>
                <div className="ms-2 px-2 py-0.5 rounded-[10px] bg-[#FFF7EA] border border-[#F49E00]/30 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-[#F49E00] text-[#F49E00]" />
                  <span className="text-[11px] font-bold text-[#0D4A5F]">
                    {ratingVal > 0 ? ratingVal.toFixed(1) : '0.0'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyTeacherCode}
              aria-label={isArabic ? 'مشاركة كود المعلم' : 'Share teacher code'}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isScrolled
                  ? 'bg-[#0D4A5F]/10 text-[#0D4A5F] hover:bg-[#0D4A5F]/15'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              <Share2 className="w-5 h-5" />
            </button>

            <button
              onClick={toggleFavorite}
              aria-label={isArabic ? 'المفضلة' : 'Favorite'}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isScrolled
                  ? 'bg-[#0D4A5F]/10 hover:bg-[#0D4A5F]/15'
                  : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-transform active:scale-125 ${
                  isFavorited
                    ? 'fill-[#E53935] text-[#E53935]'
                    : isScrolled
                    ? 'text-[#0D4A5F]'
                    : 'text-white'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="w-full bg-[#0D4A5F] pt-20 pb-16" />

        <div className="w-full bg-[#0D4A5F] flex overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="flex-1 h-3.5 bg-[#EFF6F4] rounded-t-[10px]" />
          ))}
        </div>

        <div className="max-w-2xl mx-auto px-4 -mt-20 flex flex-col items-center relative z-10">
          <div className="relative flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/heros/teacher.png';
                  }}
                />
              ) : (
                <img
                  src="/heros/teacher.png"
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              )}
            </div>

            <div className="absolute -bottom-2.5 px-2.5 py-0.5 rounded-[12px] bg-white shadow-[0_2px_6px_rgba(0,0,0,0.1)] flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-[#F49E00] text-[#F49E00]" />
              <span className="text-xs font-bold text-[#0D4A5F]">
                {ratingVal > 0 ? ratingVal.toFixed(1) : '0.0'}
              </span>
            </div>
          </div>

          <h1 className="mt-4 text-[19px] font-bold text-[#0D4A5F] text-center">
            {displayName}
          </h1>

          <p className="mt-0.5 text-[13px] text-[#0D4A5F]/70 text-center font-medium">
            {isVerified
              ? (isArabic ? 'معلم موثّق' : 'Verified Teacher')
              : (isArabic ? 'معلم' : 'Teacher')}
          </p>

          {isFounder && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF8E1] border border-[#D4A017]/40 text-[#D4A017]">
              <Award className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">
                {isArabic ? 'عضو مؤسس' : 'Founding Member'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-5">
        <div className="bg-black/5 p-1 rounded-[16px] flex">
          <button
            onClick={() => setSelectedTab(0)}
            className={`flex-1 py-2.5 text-center text-sm font-bold rounded-[12px] transition-all ${
              selectedTab === 0
                ? 'bg-white text-[#0D4A5F] shadow-[0_2px_8px_rgba(0,0,0,0.05)]'
                : 'bg-transparent text-[#0D4A5F]/60 hover:text-[#0D4A5F]'
            }`}
          >
            {isArabic ? 'عن المعلم' : 'About Teacher'}
          </button>
          <button
            onClick={() => setSelectedTab(1)}
            className={`flex-1 py-2.5 text-center text-sm font-bold rounded-[12px] transition-all ${
              selectedTab === 1
                ? 'bg-white text-[#0D4A5F] shadow-[0_2px_8px_rgba(0,0,0,0.05)]'
                : 'bg-transparent text-[#0D4A5F]/60 hover:text-[#0D4A5F]'
            }`}
          >
            {isArabic ? 'آراء الطلاب' : 'Student Reviews'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 mt-4 space-y-4">
        {selectedTab === 0 ? (
          <>
            <div className="bg-white rounded-[20px] border border-[#0D4A5F]/10 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-around">
              <div className="flex-1 flex flex-col items-center text-center">
                <GraduationCap className="w-[26px] h-[26px] text-[#5B9F48] mb-1.5" />
                <span className="text-[18px] font-bold text-[#0D4A5F] leading-tight">
                  {studentsCount}
                </span>
                <span className="text-[13px] text-[#0D4A5F]/70 mt-0.5">
                  {isArabic ? 'طالب' : 'Students'}
                </span>
              </div>

              <div className="w-[1px] h-9 bg-[#0D4A5F]/15" />

              <div className="flex-1 flex flex-col items-center text-center">
                <BookOpen className="w-6 h-6 text-[#5B9F48] mb-1.5" />
                <span className="text-[18px] font-bold text-[#0D4A5F] leading-tight">
                  {lessonsCount}
                </span>
                <span className="text-[13px] text-[#5B9F48] font-medium mt-0.5">
                  {isArabic ? 'حصة' : 'Lessons'}
                </span>
              </div>

              <div className="w-[1px] h-9 bg-[#0D4A5F]/15" />

              <div className="flex-1 flex flex-col items-center text-center">
                <CreditCard className="w-6 h-6 text-[#5B9F48] mb-1.5" />
                <div className="flex items-center gap-1 leading-tight">
                  <span className="text-[18px] font-bold text-[#0D4A5F]">
                    {hourlyPrice > 0 ? hourlyPrice.toFixed(0) : '120'}
                  </span>
                  <span className="text-xs font-bold text-[#0D4A5F]">
                    {isArabic ? 'ر.س' : 'SAR'}
                  </span>
                </div>
                <span className="text-xs text-[#0D4A5F]/70 mt-0.5">
                  {isArabic ? '/ساعة' : '/hour'}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-[20px] border border-[#0D4A5F]/10 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <h2 className="text-[16px] font-bold text-[#0D4A5F] mb-3">
                {isArabic ? 'نبذة تعريفية' : 'Bio'}
              </h2>
              <p
                className={`text-[14px] leading-relaxed ${
                  bioText === (isArabic ? 'لا توجد نبذة تعريفية مضافة بعد.' : 'No bio added yet.')
                    ? 'text-[#0D4A5F]/50'
                    : 'text-[#0D4A5F]'
                }`}
              >
                {bioText}
              </p>

              {introVideo && (
                <div
                  onClick={() => setShowVideoModal(true)}
                  className="mt-3.5 h-40 w-full rounded-[16px] relative overflow-hidden cursor-pointer group bg-[#0D4A5F]/10"
                >
                  {videoThumbnail ? (
                    <img
                      src={videoThumbnail}
                      alt=""
                      className="w-full h-full object-cover filter brightness-90 group-hover:brightness-75 transition-all duration-300"
                    />
                  ) : (
                    <video
                      src={`${introVideo}#t=1.0`}
                      preload="metadata"
                      playsInline
                      muted
                      className="w-full h-full object-cover pointer-events-none filter brightness-90 group-hover:brightness-75 transition-all duration-300"
                    />
                  )}

                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[52px] h-[52px] rounded-full bg-[#5B9F48] shadow-[0_4px_14px_rgba(91,159,72,0.4)] flex items-center justify-center text-white transform group-hover:scale-110 transition-transform">
                      <Play className="w-7 h-7 fill-white translate-x-0.5" />
                    </div>
                  </div>

                  <div className="absolute bottom-3 end-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" />
                    <span>
                      {isArabic ? 'مشاهدة الفيديو التعريفي' : 'Watch Intro Video'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-[20px] border border-[#0D4A5F]/10 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <h2 className="text-[16px] font-bold text-[#0D4A5F] mb-3">
                {isArabic ? 'الخدمات المقدمة' : 'Services Provided'}
              </h2>
              {services.length > 0 ? (
                <div className="space-y-2">
                  {services.map((srv: any, idx: number) => {
                    const title = isArabic
                      ? (srv.name_ar || srv.nameAr || srv.title || srv.name_en || srv.name)
                      : (srv.name_en || srv.nameEn || srv.title || srv.name_ar || srv.name);
                    const desc = isArabic
                      ? (srv.description_ar || srv.descriptionAr || srv.description || '')
                      : (srv.description_en || srv.descriptionEn || srv.description || '');
                    const srvPrice = Number(srv.price || hourlyPrice || 120);

                    return (
                      <div
                        key={srv.id || idx}
                        className="bg-[#EFF6F4] rounded-[14px] p-3 flex items-center justify-between"
                      >
                        <div className="flex-1 pe-2">
                          <span className="text-[14px] font-bold text-[#0D4A5F] block leading-snug">
                            {title}
                          </span>
                          {desc && (
                            <span className="text-[12px] text-[#0D4A5F]/70 block mt-1 line-clamp-2">
                              {desc}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[16px] font-bold text-[#0D4A5F]">
                            {srvPrice.toFixed(0)}
                          </span>
                          <span className="text-[11px] font-bold text-[#0D4A5F]">
                            {isArabic ? 'ر.س' : 'SAR'}
                          </span>
                          <span className="text-[11px] text-[#0D4A5F]/70">
                            {isArabic ? '/ساعة' : '/hr'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[12px] text-[#0D4A5F]/50">
                  {isArabic ? 'لا توجد خدمات مضافة بعد.' : 'No services added yet.'}
                </p>
              )}
            </div>

            {showSubjects && (
              <div className="bg-white rounded-[20px] border border-[#0D4A5F]/10 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <h2 className="text-[16px] font-bold text-[#0D4A5F] mb-3">
                  {isArabic ? 'المواد التي أدرّسها' : 'Subjects I Teach'}
                </h2>
                {subjects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subj, idx) => (
                      <div
                        key={idx}
                        className="bg-[#EFF6F4] border border-[#0D4A5F]/10 rounded-[12px] px-3.5 py-2 text-[13px] font-medium text-[#0D4A5F]"
                      >
                        {subj}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-[#0D4A5F]/50">
                    {isArabic ? 'لا توجد مواد مضافة بعد.' : 'No subjects added yet.'}
                  </p>
                )}
              </div>
            )}

            {isLang && (
              <div className="bg-white rounded-[20px] border border-[#0D4A5F]/10 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <h2 className="text-[16px] font-bold text-[#0D4A5F] mb-3">
                  {isArabic ? 'اللغات التي أدرّسها' : 'Languages I Teach'}
                </h2>
                {languages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang, idx) => (
                      <div
                        key={idx}
                        className="bg-[#EFF6F4] border border-[#0D4A5F]/10 rounded-[12px] px-3.5 py-2 text-[13px] font-medium text-[#0D4A5F]"
                      >
                        {lang}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-[#0D4A5F]/50">
                    {isArabic ? 'لا توجد لغات مضافة بعد.' : 'No languages added yet.'}
                  </p>
                )}
              </div>
            )}

            {isAbil && (
              <div className="bg-white rounded-[20px] border border-[#0D4A5F]/10 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <h2 className="text-[16px] font-bold text-[#0D4A5F] mb-3">
                  {isArabic ? 'القدرات التي أدرّسها' : 'Abilities I Teach'}
                </h2>
                {abilities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {abilities.map((ability, idx) => (
                      <div
                        key={idx}
                        className="bg-[#EFF6F4] border border-[#0D4A5F]/10 rounded-[12px] px-3.5 py-2 text-[13px] font-medium text-[#0D4A5F]"
                      >
                        {ability}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-[#0D4A5F]/50">
                    {isArabic ? 'لا توجد قدرات مضافة بعد.' : 'No abilities added yet.'}
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-white rounded-[20px] border border-[#0D4A5F]/10 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-3 sm:gap-4">
              <div className="flex-[3] space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingCounts[star] || 0;
                  const ratio =
                    reviewsCount > 0
                      ? count / reviewsCount
                      : star === 5 && ratingVal > 4.0
                      ? 0.8
                      : star === 4 && ratingVal > 4.0
                      ? 0.2
                      : 0;

                  return (
                    <div key={star} className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#DCE4E2] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F5A623] rounded-full transition-all"
                          style={{ width: `${Math.round(ratio * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[#0D4A5F] w-2.5 text-center">
                        {star}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="w-[1px] h-24 bg-[#0D4A5F]/15" />

              <div className="flex-[2] flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  <span className="text-[22px] font-bold text-[#0D4A5F] leading-tight">
                    {ratingVal > 0
                      ? ratingVal.toFixed(1)
                      : reviewsCount > 0
                      ? '4.8'
                      : '0'}
                  </span>
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                </div>

                <div className="flex items-center gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const currentStar = i + 1;
                    const effective = ratingVal > 0 ? ratingVal : (reviewsCount > 0 ? 4.8 : 0);
                    return (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          effective >= currentStar
                            ? 'fill-[#F5A623] text-[#F5A623]'
                            : effective >= currentStar - 0.5
                            ? 'fill-[#F5A623]/50 text-[#F5A623]'
                            : 'text-[#F5A623]/30'
                        }`}
                      />
                    );
                  })}
                </div>

                <span className="text-xs text-[#0D4A5F]/70 mt-1">
                  {isArabic
                    ? `(${reviewsCount} تقييم)`
                    : `(${reviewsCount} reviews)`}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {reviews.length > 0 ? (
                reviews.map((rev: any) => (
                  <div
                    key={rev.id}
                    className="bg-white rounded-[16px] border border-[#0D4A5F]/10 p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-bold text-[#0D4A5F]">
                        {rev.studentName} {rev.date ? `• ${rev.date}` : ''}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              rev.rating >= i + 1
                                ? 'fill-[#F5A623] text-[#F5A623]'
                                : 'text-[#F5A623]/30'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-[13px] text-[#0D4A5F] leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))
              ) : (
                sampleReviews.map((sample, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-[16px] border border-[#0D4A5F]/10 p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-bold text-[#0D4A5F]">
                        {sample.name}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              sample.rating >= i + 1
                                ? 'fill-[#F5A623] text-[#F5A623]'
                                : 'text-[#F5A623]/30'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-[13px] text-[#0D4A5F] leading-relaxed">
                      {sample.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.06)] py-3 px-5">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setShowBookingModal(true)}
            className="w-full h-12 bg-[#5B9F48] hover:bg-[#4d863d] text-white font-bold rounded-[12px] shadow-[0_4px_16px_rgba(91,159,72,0.25)] flex items-center justify-center text-base transition-colors"
          >
            {isArabic ? 'حجز حصة' : 'Book Lesson'}
          </button>
        </div>
      </div>

      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-black rounded-2xl overflow-hidden max-w-lg w-full relative">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <video
              src={introVideo}
              controls
              autoPlay
              className="w-full h-auto max-h-[75vh]"
            />
          </div>
        </div>
      )}

      {copyToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#0D4A5F] text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-[10px] shadow-lg flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-[#5B9F48]" />
          <span>{copyToast}</span>
        </div>
      )}

      {showBookingModal && (
        <BookingFlowModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            if (onBookingComplete) onBookingComplete();
          }}
          teacher={teacherData}
          serviceId={resolvedServiceId}
        />
      )}
    </div>
  );
};