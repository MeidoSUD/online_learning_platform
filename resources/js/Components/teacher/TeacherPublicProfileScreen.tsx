import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  Star,
  Award,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  Heart,
  ArrowLeft,
  ArrowRight,
  Play,
  X,
  School,
  BookOpen,
  DollarSign,
  MessageSquare,
  Loader2,
  Video,
  User,
} from 'lucide-react';
import { UserData, studentService, getStorageUrl } from '../../Services/api';

interface TeacherPublicProfileScreenProps {
  user?: UserData | null;
  teacherId?: number;
  onBack?: () => void;
  isModal?: boolean;
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

export const TeacherPublicProfileScreen: React.FC<TeacherPublicProfileScreenProps> = ({
  user,
  teacherId,
  onBack,
  isModal = false,
}) => {
  const { language, direction } = useLanguage();
  const isAr = language === 'ar';

  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0);
  const [teacherData, setTeacherData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [videoThumb, setVideoThumb] = useState<string>('');
  const [thumbError, setThumbError] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<boolean>(false);

  const targetId = teacherId || user?.id || user?.profile?.user_id;

  useEffect(() => {
    let isCancelled = false;

    if (!targetId) {
      if (user) {
        setTeacherData(user);
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    studentService.getTeacherById(targetId)
      .then((data) => {
        if (isCancelled) return;
        if (data) {
          setTeacherData(data);
          const fav = Boolean(
            data.has_favorited ||
            data.is_favorite ||
            data.is_favorited ||
            data.hasFavorited
          );
          setIsFavorited(fav);
        } else if (user) {
          setTeacherData(user);
        }
      })
      .catch(() => {
        if (isCancelled) return;
        if (user) setTeacherData(user);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [targetId, user]);

  const profile = teacherData?.profile || user?.profile || {};

  const firstName = teacherData?.first_name || user?.first_name || profile?.first_name || '';
  const lastName = teacherData?.last_name || user?.last_name || profile?.last_name || '';
  const rawFullName = teacherData?.full_name || teacherData?.name || `${firstName} ${lastName}`.trim();
  const displayName = rawFullName || (isAr ? 'معلم' : 'Teacher');

  const rawPhoto = (
    teacherData?.profile_image ||
    teacherData?.profile_photo ||
    profile?.profile_photo ||
    teacherData?.photo ||
    teacherData?.avatar ||
    user?.profile_photo
  );
  const photo = normalizeUrl(rawPhoto);

  const isVerified = Boolean(
    teacherData?.verified ??
    teacherData?.is_verified ??
    user?.verified ??
    profile?.verified ??
    true
  );

  const isFounder = Boolean(
    teacherData?.is_founder ??
    teacherData?.founder ??
    teacherData?.isFounder ??
    profile?.founder ??
    profile?.is_founder ??
    false
  );

  const ratingVal = Number(
    teacherData?.rating ??
    profile?.rating ??
    user?.profile?.rating ??
    0
  );

  const studentsCount = Number(
    teacherData?.total_students ??
    teacherData?.students_count ??
    profile?.total_students ??
    profile?.students_count ??
    0
  );

  const lessonsCount = Number(
    teacherData?.total_lessons ??
    teacherData?.lessons_count ??
    teacherData?.completed_lessons ??
    profile?.total_lessons ??
    profile?.current_lessons ??
    0
  );

  const hourlyRate = Number(
    teacherData?.individual_hour_price ??
    teacherData?.price_hour ??
    teacherData?.price ??
    profile?.individual_hour_price ??
    0
  );

  const rawBio = (
    teacherData?.bio ??
    profile?.bio ??
    profile?.user_bio ??
    ''
  ).trim();

  const code = (
    teacherData?.code ??
    profile?.code ??
    String(targetId || '')
  ).trim();

  const rawIntroVideo = (
    teacherData?.intro_video ??
    teacherData?.video_url ??
    teacherData?.video ??
    profile?.intro_video ??
    ''
  );
  const introVideo = normalizeUrl(rawIntroVideo);
  const hasVideo = Boolean(introVideo && introVideo.length > 0);

  useEffect(() => {
    setPhotoError(false);
  }, [photo]);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copyTeacherCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      showToast(isAr ? `تم نسخ كود المعلم (${code})` : `Teacher code copied (${code})`);
    } catch {
      showToast(code);
    }
  };

  const toggleFavorite = async () => {
    if (!targetId || isTogglingFavorite) return;
    const previous = isFavorited;
    setIsFavorited(!previous);
    setIsTogglingFavorite(true);
    try {
      await studentService.toggleFavorite(targetId);
    } catch {
      setIsFavorited(previous);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const playIntroVideo = () => {
    if (hasVideo) {
      setShowVideoModal(true);
    } else {
      showToast(isAr ? 'لا يوجد فيديو تعريفي متاح' : 'No intro video available');
    }
  };

  const rawServices = (
    teacherData?.services ||
    profile?.services ||
    []
  );
  const servicesList: any[] = Array.isArray(rawServices) ? rawServices : [];

  const mainKey = (
    teacherData?.main_service_key ||
    profile?.main_service_key ||
    ''
  ).toLowerCase();

  const isLanguageService = mainKey.includes('lang') || servicesList.some((s: any) =>
    (s?.key_name || s?.keyName || '').toLowerCase().includes('lang')
  );

  const isAbilityService = mainKey.includes('abilit') || servicesList.some((s: any) =>
    (s?.key_name || s?.keyName || '').toLowerCase().includes('abilit')
  );

  const showSubjects = !isLanguageService && !isAbilityService;

  const rawSubjects = teacherData?.teacher_subjects || teacherData?.teacherSubjects || profile?.teacher_subjects || [];
  const subjects: string[] = Array.isArray(rawSubjects)
    ? Array.from(
        new Set(
          rawSubjects
            .map((s: any) => {
              if (typeof s === 'string') return s.trim();
              const title = isAr
                ? (s.name_ar || s.title_ar || s.title || s.class_level_title_ar || s.classTitle)
                : (s.name_en || s.title_en || s.title || s.class_level_title_en || s.classTitle);
              return (title || '').toString().trim();
            })
            .filter((t: string) => t.length > 0)
        )
      )
    : [];

  const rawLanguages = teacherData?.teacher_languages || teacherData?.teacherLanguages || profile?.languages || [];
  const languages: string[] = Array.isArray(rawLanguages)
    ? Array.from(
        new Set(
          rawLanguages
            .map((l: any) => {
              if (typeof l === 'string') return l.trim();
              const name = isAr
                ? (l.name_ar || l.nameAr || l.name_en || l.nameEn)
                : (l.name_en || l.nameEn || l.name_ar || l.nameAr);
              return (name || '').toString().trim();
            })
            .filter((n: string) => n.length > 0)
        )
      )
    : [];

  const rawAbilities = teacherData?.teacher_abilities || teacherData?.teacherAbilities || profile?.abilities || [];
  const abilities: string[] = Array.isArray(rawAbilities)
    ? Array.from(
        new Set(
          rawAbilities
            .map((a: any) => {
              if (typeof a === 'string') return a.trim();
              const name = isAr
                ? (a.name_ar || a.nameAr || a.name_en || a.nameEn)
                : (a.name_en || a.nameEn || a.name_ar || a.nameAr);
              return (name || '').toString().trim();
            })
            .filter((n: string) => n.length > 0)
        )
      )
    : [];

  const rawReviews = teacherData?.reviews || profile?.reviews || [];
  const reviewsList: any[] = Array.isArray(rawReviews) ? rawReviews : [];
  const totalReviews = reviewsList.length;

  const count5 = reviewsList.filter((r) => Number(r.rating || 5) >= 4.5).length;
  const count4 = reviewsList.filter((r) => Number(r.rating || 5) >= 3.5 && Number(r.rating || 5) < 4.5).length;
  const count3 = reviewsList.filter((r) => Number(r.rating || 5) >= 2.5 && Number(r.rating || 5) < 3.5).length;
  const count2 = reviewsList.filter((r) => Number(r.rating || 5) >= 1.5 && Number(r.rating || 5) < 2.5).length;
  const count1 = reviewsList.filter((r) => Number(r.rating || 5) < 1.5).length;

  const p5 = totalReviews > 0 ? (count5 / totalReviews) * 100 : 0;
  const p4 = totalReviews > 0 ? (count4 / totalReviews) * 100 : 0;
  const p3 = totalReviews > 0 ? (count3 / totalReviews) * 100 : 0;
  const p2 = totalReviews > 0 ? (count2 / totalReviews) * 100 : 0;
  const p1 = totalReviews > 0 ? (count1 / totalReviews) * 100 : 0;

  return (
    <div
      dir={direction}
      className={`bg-[#EFF6F4] font-sans text-slate-800 ${
        isModal ? 'w-full max-w-2xl rounded-3xl overflow-hidden' : 'min-h-screen pb-16'
      }`}
    >
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#0D4A5F] text-white px-5 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-fade-in">
          <Check size={18} className="text-[#A2E048]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {showVideoModal && introVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setShowVideoModal(false)}
              className="absolute top-3 left-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
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

      <div className="relative bg-[#0D4A5F] text-white">
        <div className="px-4 pt-5 pb-16 flex items-center justify-between">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white text-[#0D4A5F] flex items-center justify-center shadow-md hover:bg-white/90 transition-all shrink-0"
            >
              {direction === 'rtl' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
            </button>
          ) : (
            <div className="w-10 h-10" />
          )}

          <h1 className="text-lg font-bold tracking-tight text-white">
            {isAr ? 'ملفي التعريفي' : 'My Profile'}
          </h1>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyTeacherCode}
              title={isAr ? 'نسخ كود المعلم' : 'Copy code'}
              className="w-10 h-10 rounded-full bg-white text-[#0D4A5F] flex items-center justify-center shadow-md hover:bg-white/90 transition-all shrink-0"
            >
              <Share2 size={18} />
            </button>

            <button
              type="button"
              onClick={toggleFavorite}
              disabled={isTogglingFavorite}
              title={isAr ? 'المفضلة' : 'Favorite'}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-white/90 transition-all shrink-0"
            >
              {isTogglingFavorite ? (
                <Loader2 size={18} className="animate-spin text-[#0D4A5F]" />
              ) : (
                <Heart
                  size={18}
                  className={
                    isFavorited
                      ? 'fill-[#E53935] text-[#E53935]'
                      : 'text-[#0D4A5F]'
                  }
                />
              )}
            </button>
          </div>
        </div>

        <div className="flex w-full overflow-hidden bg-[#0D4A5F]">
          {Array.from({ length: 15 }).map((_, index) => (
            <div
              key={index}
              className="flex-1 h-3.5 bg-[#EFF6F4] rounded-t-[10px]"
            />
          ))}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-10 relative z-10 flex flex-col items-center text-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center">
            {photo && !photoError ? (
              <img
                src={photo}
                alt={displayName}
                onError={() => setPhotoError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#0D4A5F]/10 text-[#0D4A5F] flex items-center justify-center text-3xl font-bold">
                <User size={40} className="text-[#0D4A5F]/60" />
              </div>
            )}
          </div>

          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-white shadow-md flex items-center gap-1 border border-black/5 whitespace-nowrap">
            <Star size={14} className="text-[#F5A623] fill-[#F5A623]" />
            <span className="text-xs font-bold text-[#0D4A5F]">
              {ratingVal > 0 ? ratingVal.toFixed(1) : '5.0'}
            </span>
          </div>
        </div>

        <h2 className="text-lg font-bold text-[#0D4A5F] mt-4">
          {displayName}
        </h2>

        <p className="text-xs text-[#0D4A5F]/70 mt-0.5 font-medium">
          {isVerified
            ? (isAr ? 'معلم معتمد' : 'Verified Teacher')
            : (isAr ? 'معلم' : 'Teacher')}
        </p>

        {isFounder && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF8E1] border border-[#D4A017]/40 text-[#D4A017] text-xs font-semibold">
            <Award size={14} />
            <span>{isAr ? 'معلم مؤسس' : 'Founding Teacher'}</span>
          </div>
        )}
      </div>

      <div className="max-w-xl mx-auto px-4 mt-5">
        <div className="p-1 rounded-2xl bg-black/5 flex gap-1">
          <button
            type="button"
            onClick={() => setSelectedTabIndex(0)}
            className={`flex-1 py-2.5 text-sm font-bold text-center rounded-xl transition-all ${
              selectedTabIndex === 0
                ? 'bg-white text-[#0D4A5F] shadow-sm'
                : 'text-[#0D4A5F]/60 hover:text-[#0D4A5F]'
            }`}
          >
            {isAr ? 'عن المعلم' : 'About Teacher'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedTabIndex(1)}
            className={`flex-1 py-2.5 text-sm font-bold text-center rounded-xl transition-all ${
              selectedTabIndex === 1
                ? 'bg-white text-[#0D4A5F] shadow-sm'
                : 'text-[#0D4A5F]/60 hover:text-[#0D4A5F]'
            }`}
          >
            {isAr ? 'آراء الطلاب' : 'Student Reviews'}
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 size={32} className="animate-spin text-[#5B9F48] mb-2" />
            <span className="text-xs text-slate-500">
              {isAr ? 'جاري التحميل...' : 'Loading...'}
            </span>
          </div>
        ) : selectedTabIndex === 0 ? (
          <div className="mt-4 space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
              <div className="grid grid-cols-3 divide-x divide-x-reverse divide-black/5">
                <div className="flex flex-col items-center text-center px-2">
                  <div className="p-2 rounded-full bg-[#5B9F48]/10 text-[#5B9F48] mb-1.5">
                    <School size={22} />
                  </div>
                  <span className="text-base font-bold text-[#0D4A5F]">{studentsCount}</span>
                  <span className="text-[11px] text-[#0D4A5F]/70 mt-0.5">
                    {isAr ? 'الطلاب' : 'Students'}
                  </span>
                </div>

                <div className="flex flex-col items-center text-center px-2">
                  <div className="p-2 rounded-full bg-[#5B9F48]/10 text-[#5B9F48] mb-1.5">
                    <BookOpen size={22} />
                  </div>
                  <span className="text-base font-bold text-[#0D4A5F]">{lessonsCount}</span>
                  <span className="text-[11px] text-[#5B9F48] mt-0.5 font-medium">
                    {isAr ? 'الدروس' : 'Lessons'}
                  </span>
                </div>

                <div className="flex flex-col items-center text-center px-2">
                  <div className="p-2 rounded-full bg-[#5B9F48]/10 text-[#5B9F48] mb-1.5">
                    <DollarSign size={22} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-base font-bold text-[#0D4A5F]">
                      {hourlyRate > 0 ? hourlyRate.toFixed(0) : '0'}
                    </span>
                    <span className="text-xs font-bold text-[#0D4A5F]">
                      {isAr ? 'ر.س' : 'SAR'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#0D4A5F]/70 mt-0.5">
                    {isAr ? 'لكل ساعة' : 'Per Hour'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-black/5">
                <h3 className="text-sm font-bold text-[#0D4A5F]">
                  {isAr ? 'نبذة عني' : 'About Me'}
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-[#0D4A5F]/80 leading-relaxed">
                  {rawBio.length > 0
                    ? rawBio
                    : (isAr ? 'لا توجد نبذة تعريفية متاحة حالياً' : 'No bio available')}
                </p>

                {hasVideo && (
                  <div
                    onClick={playIntroVideo}
                    className="relative h-44 rounded-2xl overflow-hidden cursor-pointer group bg-[#0D4A5F] shadow-sm border border-black/5"
                  >
                    {videoThumb && !thumbError ? (
                      <img
                        src={videoThumb}
                        alt=""
                        onError={() => setThumbError(true)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : photo && !photoError ? (
                      <img
                        src={photo}
                        alt=""
                        onError={() => setPhotoError(true)}
                        className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#0D4A5F] via-[#145d77] to-[#0D4A5F]" />
                    )}

                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                      <div className="h-14 w-14 rounded-full bg-[#5B9F48] text-white flex items-center justify-center shadow-[0_4px_18px_rgba(91,159,72,0.45)] group-hover:scale-110 transition-transform">
                        <Play size={26} className="ml-0.5 fill-current" />
                      </div>
                    </div>

                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm flex items-center gap-1.5 text-white text-xs font-medium">
                      <Video size={14} />
                      <span>{isAr ? 'مشاهدة الفيديو التعريفي' : 'Watch Intro Video'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-black/5">
                <h3 className="text-sm font-bold text-[#0D4A5F]">
                  {isAr ? 'الخدمات المقدمة' : 'Services Offered'}
                </h3>
              </div>
              <div className="p-4">
                {servicesList.length > 0 ? (
                  <div className="space-y-2">
                    {servicesList.map((srv: any, idx: number) => {
                      const srvTitle = isAr
                        ? (srv.name_ar || srv.nameAr || srv.name_en || srv.nameEn)
                        : (srv.name_en || srv.nameEn || srv.name_ar || srv.nameAr);
                      const srvDesc = isAr
                        ? (srv.description_ar || srv.descriptionAr || srv.description_en || srv.descriptionEn)
                        : (srv.description_en || srv.descriptionEn || srv.description_ar || srv.descriptionAr);
                      return (
                        <div
                          key={srv.id || idx}
                          className="p-3.5 rounded-xl bg-[#EFF6F4] border border-black/5 flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#0D4A5F] truncate">
                              {srvTitle || (isAr ? 'خدمة تعليمية' : 'Educational Service')}
                            </p>
                            {srvDesc && (
                              <p className="text-xs text-[#0D4A5F]/70 mt-0.5 line-clamp-1">
                                {srvDesc}
                              </p>
                            )}
                          </div>
                          <div className="text-left shrink-0">
                            <span className="text-sm font-bold text-[#0D4A5F]">
                              {hourlyRate > 0 ? hourlyRate.toFixed(0) : '0'}
                            </span>
                            <span className="text-xs font-semibold text-[#0D4A5F] mr-1">
                              {isAr ? 'ر.س' : 'SAR'}
                            </span>
                            <span className="text-[11px] text-[#0D4A5F]/70 block">
                              {isAr ? 'لكل ساعة' : 'Per Hour'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#0D4A5F]/50">
                    {isAr ? 'لم يتم تحديد خدمات بعد' : 'No services set'}
                  </p>
                )}
              </div>
            </div>

            {showSubjects && (
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-black/5">
                  <h3 className="text-sm font-bold text-[#0D4A5F]">
                    {isAr ? 'المواد الدراسية' : 'Subjects'}
                  </h3>
                </div>
                <div className="p-4">
                  {subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {subjects.map((sub, idx) => (
                        <span
                          key={idx}
                          className="px-3.5 py-1.5 rounded-xl bg-[#EFF6F4] text-[#0D4A5F] text-xs font-semibold border border-black/5"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#0D4A5F]/50">
                      {isAr ? 'لم يتم تحديد مواد بعد' : 'No subjects set'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {isLanguageService && (
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-black/5">
                  <h3 className="text-sm font-bold text-[#0D4A5F]">
                    {isAr ? 'اللغات' : 'Languages'}
                  </h3>
                </div>
                <div className="p-4">
                  {languages.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang, idx) => (
                        <span
                          key={idx}
                          className="px-3.5 py-1.5 rounded-xl bg-[#EFF6F4] text-[#0D4A5F] text-xs font-semibold border border-black/5"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#0D4A5F]/50">
                      {isAr ? 'لم يتم تحديد لغات بعد' : 'No languages set'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {isAbilityService && (
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-black/5">
                  <h3 className="text-sm font-bold text-[#0D4A5F]">
                    {isAr ? 'القدرات والقياس' : 'Abilities'}
                  </h3>
                </div>
                <div className="p-4">
                  {abilities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {abilities.map((ability, idx) => (
                        <span
                          key={idx}
                          className="px-3.5 py-1.5 rounded-xl bg-[#EFF6F4] text-[#0D4A5F] text-xs font-semibold border border-black/5"
                        >
                          {ability}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#0D4A5F]/50">
                      {isAr ? 'لم يتم تحديد اختبارات قدرات بعد' : 'No abilities set'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm">
              <div className="grid grid-cols-5 gap-4 items-center">
                <div className="col-span-3 space-y-2">
                  {[
                    { star: 5, pct: p5 },
                    { star: 4, pct: p4 },
                    { star: 3, pct: p3 },
                    { star: 2, pct: p2 },
                    { star: 1, pct: p1 },
                  ].map(({ star, pct }) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0D4A5F] w-3 text-center">{star}</span>
                      <div className="flex-1 h-2 bg-black/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F5A623] rounded-full transition-all duration-300"
                          style={{ width: `${Math.round(pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="col-span-2 flex flex-col items-center justify-center border-r border-black/5 pr-4">
                  <span className="text-3xl font-extrabold text-[#0D4A5F]">
                    {ratingVal > 0 ? ratingVal.toFixed(1) : (totalReviews > 0 ? '5.0' : '0.0')}
                  </span>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const effRating = ratingVal > 0 ? ratingVal : (totalReviews > 0 ? 5 : 0);
                      return (
                        <Star
                          key={s}
                          size={16}
                          className={
                            s <= Math.round(effRating)
                              ? 'text-[#F5A623] fill-[#F5A623]'
                              : 'text-gray-200'
                          }
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs text-[#0D4A5F]/70 mt-1">
                    ({totalReviews})
                  </span>
                </div>
              </div>
            </div>

            {reviewsList.length > 0 ? (
              reviewsList.map((r: any, idx: number) => {
                const sName = r.student_name || r.studentName || (isAr ? 'طالب' : 'Student');
                const sDate = r.date || r.created_at || '';
                const rScore = Number(r.rating || 5);
                return (
                  <div
                    key={r.id || idx}
                    className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0D4A5F]">
                        {sDate ? `${sDate} • ${sName}` : sName}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={
                              star <= rScore
                                ? 'text-[#F5A623] fill-[#F5A623]'
                                : 'text-gray-200'
                            }
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-xs text-[#0D4A5F]/80 leading-relaxed">
                        {r.comment}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl p-8 border border-black/5 shadow-sm text-center flex flex-col items-center justify-center">
                <MessageSquare size={36} className="text-[#0D4A5F]/30 mb-2" />
                <p className="text-sm font-medium text-[#0D4A5F]/60">
                  {isAr ? 'لا توجد تقييمات حتى الآن' : 'No reviews yet'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

