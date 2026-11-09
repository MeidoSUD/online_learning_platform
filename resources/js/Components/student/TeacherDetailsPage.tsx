import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  Star,
  School,
  Copy,
  Check,
  BookOpen,
  Globe,
  Award,
  MessageSquare,
  Heart,
  ArrowLeft,
  Share2,
  Loader2,
  Play,
  X,
  CreditCard,
  Sparkles,
  Video,
} from 'lucide-react';
import { studentService, getStorageUrl } from '../../Services/api';
import { BookingFlowModal } from './BookingFlowModal';
import { COUNTRIES } from '../../Utils/constants';

interface TeacherDetailsPageProps {
  teacher: any;
  serviceId: number;
  onBack: () => void;
  onBookingComplete: () => void;
}

function getNationalityFlag(nationality?: string | null): string {
  if (!nationality) return '';
  const country = COUNTRIES.find(c => c.label.toLowerCase() === nationality.toLowerCase());
  return country?.flag || '';
}

function normalizeUrl(path?: string | null): string {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';

  if (trimmed.includes('/storage/')) {
    const afterStorage = trimmed.split('/storage/')[1];
    return `${window.location.origin}/storage/${afterStorage}`;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return getStorageUrl(trimmed);
}

export const TeacherDetailsPage: React.FC<TeacherDetailsPageProps> = ({
  teacher: teacherProp,
  serviceId,
  onBack,
  onBookingComplete,
}) => {
  const { language, direction } = useLanguage();
  const [teacherData, setTeacherData] = useState<any>(teacherProp);
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isFavorited, setIsFavorited] = useState<boolean>(
    teacherProp?.has_favorited ?? teacherProp?.is_favorite ?? teacherProp?.is_favorited ?? false
  );
  const [isTogglingFavorite, setIsTogglingFavorite] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState<boolean>(false);
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [videoThumb, setVideoThumb] = useState<string>('');
  const [thumbError, setThumbError] = useState<boolean>(false);
  const [profileImgError, setProfileImgError] = useState<boolean>(false);
  const [avatarImgError, setAvatarImgError] = useState<boolean>(false);

  useEffect(() => {
    setTeacherData(teacherProp);
    setIsFavorited(
      teacherProp?.has_favorited ?? teacherProp?.is_favorite ?? teacherProp?.is_favorited ?? false
    );
  }, [teacherProp]);

  useEffect(() => {
    const teacherId = teacherProp?.id;
    if (!teacherId) return;

    studentService.getTeacherById(teacherId).then((res) => {
      if (res) {
        setTeacherData(res);
        if (typeof res.has_favorited === 'boolean') {
          setIsFavorited(res.has_favorited);
        }
      }
    }).catch(() => {});
  }, [teacherProp?.id]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const profile = teacherData?.profile || {};
  const firstName = teacherData?.first_name || profile?.first_name || '';
  const lastName = teacherData?.last_name || profile?.last_name || '';
  const rawName = (teacherData?.name || `${firstName} ${lastName}`).trim();
  const displayName = rawName || 'معلم';

  const profilePhoto = normalizeUrl(
    profile.profile_photo ||
    teacherData?.profile_photo ||
    teacherData?.profile_image ||
    teacherData?.photo ||
    teacherData?.avatar ||
    profile.image
  );

  const nationality = teacherData?.nationality || profile?.nationality || '';
  const flag = getNationalityFlag(nationality);
  const isVerified = teacherData?.verified ?? profile?.verified ?? true;
  const isFounder = teacherData?.is_founder ?? profile?.founder ?? teacherData?.founder ?? false;

  const ratingVal = Number(profile?.rating ?? teacherData?.rating ?? 0);
  const studentsCount = Number(
    profile?.total_students ??
    profile?.students_count ??
    teacherData?.total_students ??
    teacherData?.students_count ??
    0
  );
  const lessonsCount = Number(
    profile?.total_lessons ??
    profile?.completed_lessons ??
    profile?.lessons_count ??
    profile?.bookings_count ??
    teacherData?.total_lessons ??
    0
  );
  const hourlyPrice = Number(
    profile?.individual_hour_price ??
    teacherData?.individual_hour_price ??
    teacherData?.price_hour ??
    teacherData?.price ??
    120
  );

  const bio = (profile?.bio || teacherData?.bio || '').trim();
  const bioText = bio || 'معلم متميز ومتخصص في تقديم الدروس التعليمية وشرح المناهج الدراسية بأسلوب سهل ومبسط.';

  const code = (
    profile?.code ||
    teacherData?.code ||
    teacherData?.teacher_code ||
    String(teacherData?.id || '')
  ).trim();

  const introVideo = normalizeUrl(
    profile?.intro_video ||
    teacherData?.intro_video ||
    teacherData?.video_url ||
    teacherData?.video ||
    teacherData?.intro_video_url ||
    teacherData?.presentation_video
  );

  const hasVideo = Boolean(introVideo && introVideo.trim().length > 0);

  useEffect(() => {
    setProfileImgError(false);
    setAvatarImgError(false);
  }, [profilePhoto]);

  useEffect(() => {
    if (!introVideo) {
      setVideoThumb('');
      setThumbError(false);
      return;
    }
    const candidate = introVideo.replace(/\.mp4$/i, '_thumb.jpg');
    setVideoThumb(candidate);
    setThumbError(false);

    const vid = document.createElement('video');
    vid.crossOrigin = 'anonymous';
    vid.preload = 'metadata';
    vid.src = introVideo;
    vid.muted = true;
    vid.playsInline = true;

    vid.onloadeddata = () => {
      vid.currentTime = Math.min(1, (vid.duration || 2) / 2);
    };

    vid.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = vid.videoWidth || 640;
        canvas.height = vid.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (dataUrl && dataUrl.length > 50) {
            setVideoThumb(dataUrl);
            setThumbError(false);
          }
        }
      } catch {}
    };
  }, [introVideo]);

  const rawSubjects = profile?.teacher_subjects || teacherData?.teacher_subjects || [];
  const subjects: string[] = Array.isArray(rawSubjects)
    ? rawSubjects.map((s: any) => {
        if (typeof s === 'string') return s.trim();
        const titleAr = s.class_level_title_ar || s.name_ar || s.title_ar || s.title;
        const titleEn = s.class_level_title_en || s.name_en || s.title_en || s.title;
        return (language === 'ar' ? (titleAr || titleEn) : (titleEn || titleAr) || '').trim();
      }).filter(Boolean)
    : [];

  const mainKey = (
    teacherData?.main_service_key ||
    profile?.main_service_key ||
    ''
  ).toLowerCase();

  const services = Array.isArray(profile?.services) ? profile.services : (Array.isArray(teacherData?.services) ? teacherData.services : []);
  const isLanguageService = mainKey.includes('lang') || services.some((s: any) => (s?.key_name || '').toLowerCase().includes('lang'));
  const isAbilityService = mainKey.includes('abilit') || services.some((s: any) => (s?.key_name || '').toLowerCase().includes('abilit'));
  const showSubjects = !isLanguageService && !isAbilityService;

  const rawLanguages = profile?.languages || teacherData?.languages || [];
  const languages: string[] = Array.isArray(rawLanguages)
    ? rawLanguages.map((l: any) => {
        if (typeof l === 'string') return l.trim();
        return (language === 'ar' ? (l.name_ar || l.name_en) : (l.name_en || l.name_ar) || '').trim();
      }).filter(Boolean)
    : [];

  const rawAbilities = profile?.abilities || teacherData?.abilities || [];
  const abilities: string[] = Array.isArray(rawAbilities)
    ? rawAbilities.map((a: any) => {
        if (typeof a === 'string') return a.trim();
        return (language === 'ar' ? (a.name_ar || a.name_en) : (a.name_en || a.name_ar) || '').trim();
      }).filter(Boolean)
    : [];

  const rawReviews = profile?.reviews || teacherData?.reviews || [];
  const reviews: any[] = Array.isArray(rawReviews) ? rawReviews : [];
  const reviewsCount = reviews.length;

  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.max(1, Math.min(5, Math.round(Number(r.rating || 5))));
    ratingCounts[star] = (ratingCounts[star] || 0) + 1;
  });

  const sampleReviews = [
    {
      name: 'أحمد محمد',
      rating: 5,
      date: 'منذ يومين',
      comment: 'أستاذ متميز جداً وطريقة الشرح واضحة ومبسطة، استفدت كثيراً من الجلسات معه.',
    },
    {
      name: 'سارة خالد',
      rating: 5,
      date: 'منذ أسبوع',
      comment: 'شرح ممتاز والتزام رائع بالوقت، ومتابعة مستمرة بعد الحصة. أنصح به بشدة.',
    },
    {
      name: 'محمد علي',
      rating: 4,
      date: 'منذ أسبوعين',
      comment: 'تجربة تعليمية ممتازة وتفاعل رائع مع الطلاب.',
    },
    {
      name: 'نورة عبدالله',
      rating: 5,
      date: 'منذ شهر',
      comment: 'أسلوب تدريس مبتكر وصبور جداً في إيصال المعلومة الصعبة.',
    },
    {
      name: 'عبدالرحمن العتيبي',
      rating: 4,
      date: 'منذ شهر',
      comment: 'معلم متمكن وشرح وافي، شكراً جزيلاً له.',
    },
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyTeacherCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(true);
      showToast(`تم نسخ كود المعلم (${code})`);
      setTimeout(() => setCopiedCode(false), 2500);
    });
  };

  const handleVideoClick = () => {
    if (introVideo && introVideo.trim().length > 0) {
      setShowVideoModal(true);
    } else {
      showToast('لم يتم إضافة فيديو تعريفي بعد');
    }
  };

  const handleToggleFavorite = async () => {
    const teacherId = teacherData?.id;
    if (!teacherId || isTogglingFavorite) return;

    const previousState = isFavorited;
    setIsFavorited(!previousState);
    setIsTogglingFavorite(true);

    try {
      await studentService.toggleFavorite(teacherId);
    } catch {
      setIsFavorited(previousState);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-28 relative">
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#1B3A6B] text-white px-5 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-fade-in">
          <Check size={18} className="text-[#3D8B37]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {showVideoModal && introVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
            >
              <X size={20} />
            </button>
            <video
              src={introVideo}
              controls
              autoPlay
              className="w-full max-h-[75vh] object-contain"
            />
          </div>
        </div>
      )}

      <div
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 px-4 py-3 flex items-center gap-3 ${
          isScrolled
            ? 'bg-white shadow-md border-b border-[#E8ECEF]'
            : 'bg-transparent'
        }`}
      >
        <button
          onClick={onBack}
          className={`p-2.5 rounded-full transition-all ${
            isScrolled
              ? 'bg-[#1B3A6B]/10 text-[#1B3A6B] hover:bg-[#1B3A6B]/20'
              : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
          }`}
        >
          <ArrowLeft size={20} className={direction === 'rtl' ? 'rotate-180' : ''} />
        </button>

        {isScrolled ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-9 w-9 rounded-full overflow-hidden bg-white shrink-0 border border-black/10">
              {profilePhoto && !avatarImgError ? (
                <img
                  src={profilePhoto}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarImgError(true)}
                />
              ) : (
                <div className="w-full h-full bg-[#1B3A6B]/10 text-[#1B3A6B] flex items-center justify-center text-sm font-bold">
                  {displayName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-[#1B3A6B] truncate">{displayName}</h2>
              <p className="text-xs text-[#1B3A6B]/70 truncate">
                {isVerified ? 'معلم معتمد' : 'معلم'}
              </p>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FFF8E1] border border-[#F5A623]/30">
              <Star size={13} className="text-[#F5A623] fill-[#F5A623]" />
              <span className="text-xs font-bold text-[#1B3A6B]">
                {ratingVal > 0 ? ratingVal.toFixed(1) : '0.0'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <button
          onClick={handleCopyTeacherCode}
          className={`p-2.5 rounded-full transition-all ${
            isScrolled
              ? 'bg-[#1B3A6B]/10 text-[#1B3A6B] hover:bg-[#1B3A6B]/20'
              : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
          }`}
          title="نسخ كود المعلم"
        >
          <Share2 size={20} />
        </button>

        <button
          onClick={handleToggleFavorite}
          disabled={isTogglingFavorite}
          className={`p-2.5 rounded-full transition-all disabled:opacity-50 ${
            isScrolled
              ? 'bg-[#1B3A6B]/10 hover:bg-[#1B3A6B]/20'
              : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
          }`}
          title="إضافة للمفضلة"
        >
          {isTogglingFavorite ? (
            <Loader2 size={20} className="animate-spin text-white" />
          ) : (
            <Heart
              size={20}
              className={
                isFavorited
                  ? 'fill-[#E53935] text-[#E53935]'
                  : isScrolled
                  ? 'text-[#1B3A6B]'
                  : 'text-white'
              }
            />
          )}
        </button>
      </div>

      <div className="relative bg-[#1B3A6B] h-32 w-full" />

      <div className="max-w-xl mx-auto px-4 flex flex-col items-center text-center -mt-12 relative z-10">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
            {profilePhoto && !avatarImgError ? (
              <img
                src={profilePhoto}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={() => setAvatarImgError(true)}
              />
            ) : (
              <div className="w-full h-full bg-[#E8ECEF] text-[#1B3A6B] flex items-center justify-center text-3xl font-bold">
                {displayName.charAt(0)}
              </div>
            )}
          </div>

          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-white shadow-md flex items-center gap-1 border border-black/5 whitespace-nowrap">
            <Star size={13} className="text-[#F5A623] fill-[#F5A623]" />
            <span className="text-xs font-bold text-[#1B3A6B]">
              {ratingVal > 0 ? ratingVal.toFixed(1) : '0.0'}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          {flag && <span className="text-xl">{flag}</span>}
          <h1 className="text-xl font-bold text-[#1B3A6B]">{displayName}</h1>
        </div>

        <p className="text-xs text-[#1B3A6B]/70 mt-0.5 font-medium">
          {isVerified ? 'معلم معتمد' : 'معلم'}
        </p>

        {isFounder && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF8E1] border border-[#D4A017]/40 text-[#D4A017] text-xs font-semibold">
            <Award size={14} />
            <span>عضو مؤسس</span>
          </div>
        )}

        {code && (
          <button
            onClick={handleCopyTeacherCode}
            className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-gray-50 text-[#1B3A6B] text-xs font-mono font-medium border border-black/10 shadow-sm transition-colors"
          >
            <span>{code}</span>
            {copiedCode ? <Check size={14} className="text-[#3D8B37]" /> : <Copy size={14} />}
          </button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6 relative z-10">
        <div className="p-1 rounded-2xl bg-black/5 flex gap-1">
          <button
            onClick={() => setSelectedTab(0)}
            className={`flex-1 py-2.5 text-sm font-bold text-center rounded-xl transition-all ${
              selectedTab === 0
                ? 'bg-white text-[#1B3A6B] shadow-sm'
                : 'text-[#1B3A6B]/60 hover:text-[#1B3A6B]'
            }`}
          >
            عن الأستاذ
          </button>
          <button
            onClick={() => setSelectedTab(1)}
            className={`flex-1 py-2.5 text-sm font-bold text-center rounded-xl transition-all ${
              selectedTab === 1
                ? 'bg-white text-[#1B3A6B] shadow-sm'
                : 'text-[#1B3A6B]/60 hover:text-[#1B3A6B]'
            }`}
          >
            تقييمات الطلاب
          </button>
        </div>

        {selectedTab === 0 ? (
          <div className="mt-4 space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
              <div className="grid grid-cols-3 divide-x divide-x-reverse divide-[#E8ECEF]">
                <div className="flex flex-col items-center text-center px-2">
                  <div className="p-2 rounded-full bg-[#3D8B37]/10 text-[#3D8B37] mb-1.5">
                    <School size={22} />
                  </div>
                  <span className="text-base font-bold text-[#1B3A6B]">{studentsCount}</span>
                  <span className="text-[11px] text-[#1B3A6B]/70 mt-0.5">الطلاب المسجلين</span>
                </div>

                <div className="flex flex-col items-center text-center px-2">
                  <div className="p-2 rounded-full bg-[#3D8B37]/10 text-[#3D8B37] mb-1.5">
                    <BookOpen size={22} />
                  </div>
                  <span className="text-base font-bold text-[#1B3A6B]">{lessonsCount}</span>
                  <span className="text-[11px] text-[#3D8B37] mt-0.5 font-medium">دروس مكتملة</span>
                </div>

                <div className="flex flex-col items-center text-center px-2">
                  <div className="p-2 rounded-full bg-[#3D8B37]/10 text-[#3D8B37] mb-1.5">
                    <CreditCard size={22} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-base font-bold text-[#1B3A6B]">
                      {hourlyPrice > 0 ? hourlyPrice.toFixed(0) : '120'}
                    </span>
                    <span className="text-xs font-bold text-[#1B3A6B]">ر.س</span>
                  </div>
                  <span className="text-[11px] text-[#1B3A6B]/70 mt-0.5">سعر الساعة</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
              <h3 className="text-base font-bold text-[#1B3A6B] mb-2.5">نبذة تعريفية</h3>
              <p className="text-sm text-[#1B3A6B]/80 leading-relaxed">{bioText}</p>

              <div className="mt-4">
                <div
                  onClick={handleVideoClick}
                  className="relative h-44 rounded-2xl overflow-hidden cursor-pointer group bg-[#1B3A6B] shadow-sm border border-black/5"
                >
                  {videoThumb && !thumbError ? (
                    <img
                      src={videoThumb}
                      alt="الفيديو التعريفي"
                      onError={() => setThumbError(true)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : profilePhoto && !profileImgError ? (
                    <img
                      src={profilePhoto}
                      alt=""
                      onError={() => setProfileImgError(true)}
                      className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1B3A6B] via-[#2352A0] to-[#1B3A6B]" />
                  )}

                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                    <div className="h-14 w-14 rounded-full bg-[#3D8B37] text-white flex items-center justify-center shadow-[0_4px_18px_rgba(61,139,55,0.45)] group-hover:scale-110 transition-transform">
                      <Play size={26} className="ml-1 fill-current" />
                    </div>
                  </div>

                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm flex items-center gap-1.5 text-white text-xs font-medium">
                    <Video size={14} />
                    <span>{hasVideo ? 'مشاهدة الفيديو التعريفي' : 'الفيديو التعريفي للأستاذ'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
              <h3 className="text-base font-bold text-[#1B3A6B] mb-3">الخدمات المقدمة</h3>
              {services.length > 0 ? (
                <div className="space-y-2">
                  {services.map((srv: any) => {
                    const title = language === 'ar' ? (srv.name_ar || srv.name_en) : (srv.name_en || srv.name_ar);
                    const desc = language === 'ar' ? (srv.description_ar || srv.description_en) : (srv.description_en || srv.description_ar);
                    return (
                      <div
                        key={srv.id || srv.service_id}
                        className="p-3.5 rounded-xl bg-[#F8F9FA] border border-black/5 flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#1B3A6B] truncate">{title || 'خدمة تعليمية'}</p>
                          {desc && (
                            <p className="text-xs text-[#1B3A6B]/70 mt-0.5 line-clamp-1">{desc}</p>
                          )}
                        </div>
                        <div className="text-left shrink-0">
                          <span className="text-sm font-bold text-[#1B3A6B]">{hourlyPrice.toFixed(0)}</span>
                          <span className="text-xs font-semibold text-[#1B3A6B] mr-1">ر.س</span>
                          <span className="text-[11px] text-[#1B3A6B]/70 block">لكل ساعة</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#1B3A6B]/50">لم يتم إضافة خدمات بعد</p>
              )}
            </div>

            {showSubjects && (
              <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
                <h3 className="text-base font-bold text-[#1B3A6B] mb-3">المواد التي يدرسها</h3>
                {subjects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((sub, idx) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F8F9FA] text-[#1B3A6B] text-xs font-semibold border border-black/5"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#1B3A6B]/50">لم يتم إضافة مواد بعد</p>
                )}
              </div>
            )}

            {isLanguageService && (
              <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
                <h3 className="text-base font-bold text-[#1B3A6B] mb-3">اللغات التي يدرسها</h3>
                {languages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang, idx) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F8F9FA] text-[#1B3A6B] text-xs font-semibold border border-black/5"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#1B3A6B]/50">لم يتم إضافة لغات بعد</p>
                )}
              </div>
            )}

            {isAbilityService && (
              <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
                <h3 className="text-base font-bold text-[#1B3A6B] mb-3">القدرات التي يدرسها</h3>
                {abilities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {abilities.map((ability, idx) => (
                      <span
                        key={idx}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F8F9FA] text-[#1B3A6B] text-xs font-semibold border border-black/5"
                      >
                        {ability}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#1B3A6B]/50">لم يتم إضافة قدرات بعد</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
              <div className="grid grid-cols-5 gap-4 items-center">
                <div className="col-span-3 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingCounts[star] || 0;
                    const ratio = reviewsCount > 0
                      ? (count / reviewsCount)
                      : (star === 5 ? 0.8 : star === 4 ? 0.2 : 0);
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#F5A623] rounded-full"
                            style={{ width: `${Math.round(ratio * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-[#1B3A6B] w-3 text-center">{star}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="col-span-2 flex flex-col items-center justify-center border-r border-[#E8ECEF] pr-4">
                  <div className="flex items-center gap-1 text-[#C5A059]">
                    <Sparkles size={16} />
                    <span className="text-2xl font-bold text-[#1B3A6B]">
                      {ratingVal > 0 ? ratingVal.toFixed(1) : (reviewsCount > 0 ? '4.8' : '0.0')}
                    </span>
                    <Sparkles size={16} className="-scale-x-100" />
                  </div>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const effRating = ratingVal > 0 ? ratingVal : 4.8;
                      return (
                        <Star
                          key={s}
                          size={14}
                          className={s <= effRating ? 'text-[#F5A623] fill-[#F5A623]' : 'text-gray-300'}
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs text-[#1B3A6B]/70 mt-1">
                    {reviewsCount > 0 ? `(${reviewsCount}) تقييمات` : '(5) تقييمات'}
                  </span>
                </div>
              </div>
            </div>

            {reviews.length > 0 ? (
              reviews.map((r, idx) => (
                <div
                  key={r.id || idx}
                  className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1B3A6B]">
                      {r.student_name || 'طالب'} {r.date ? `• ${r.date}` : ''}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          className={s <= (r.rating || 5) ? 'text-[#F5A623] fill-[#F5A623]' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#1B3A6B]/80 leading-relaxed">{r.comment}</p>
                </div>
              ))
            ) : (
              sampleReviews.map((s, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1B3A6B]">
                      {s.name} • {s.date}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={12}
                          className={star <= s.rating ? 'text-[#F5A623] fill-[#F5A623]' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#1B3A6B]/80 leading-relaxed">{s.comment}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8ECEF] shadow-lg px-4 py-3 z-30">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setShowBooking(true)}
            className="w-full py-3 bg-[#3D8B37] hover:bg-[#34762F] text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <span>احجز الآن</span>
          </button>
        </div>
      </div>

      <BookingFlowModal
        isOpen={showBooking}
        onClose={() => setShowBooking(false)}
        teacher={teacherData}
        serviceId={serviceId}
      />
    </div>
  );
};