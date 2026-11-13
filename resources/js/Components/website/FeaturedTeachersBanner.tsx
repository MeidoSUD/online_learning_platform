import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { featuredTeacherService } from '../../Services/api';
import { Star, Sparkles, ChevronLeft, ChevronRight, GraduationCap, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { router } from '@inertiajs/react';

export const FeaturedTeachersBanner: React.FC = () => {
  const { language, direction } = useLanguage();
  const isAr = language === 'ar';

  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await featuredTeacherService.getBanners(10);
      setBanners(res?.banners || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerClick = (banner: any) => {
    // Record click analytics
    if (banner.subscription_id) {
      featuredTeacherService.recordClick(banner.subscription_id);
    }

    // Direct user to teacher profile
    if (banner.action?.profile_endpoint) {
      // If we have a web route or details modal
      window.location.href = `/teachers?id=${banner.teacher_id}`;
    }
  };

  // Auto rotate banners every 6 seconds if multiple
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (loading || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <section className="py-8 bg-gradient-to-b from-white to-amber-50/40 border-y border-amber-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                {isAr ? 'نخبة المعلمين المميزين' : 'Featured Top Teachers'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? 'معلمون معتمدون وذوو كفاءة عالية جاهزون لتقديم أفضل الحصص' : 'Hand-picked certified instructors ready to boost your learning'}
              </p>
            </div>
          </div>

          {banners.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition"
                aria-label="Previous banner"
              >
                {isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition"
                aria-label="Next banner"
              >
                {isAr ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </button>
            </div>
          )}
        </div>

        {/* Featured Teacher Interactive Card */}
        <div className="relative rounded-3xl bg-white border-2 border-amber-200/80 shadow-xl shadow-amber-500/5 p-6 sm:p-8 overflow-hidden transition-all duration-500">
          <div className="absolute top-0 end-0 w-64 h-64 bg-gradient-to-bl from-amber-400/10 via-amber-200/5 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
            {/* Avatar / Photo with Glowing Badge */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-4 border-amber-400/40 shadow-lg bg-slate-100 flex items-center justify-center">
                {currentBanner.avatar ? (
                  <img
                    src={currentBanner.avatar}
                    alt={currentBanner.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <GraduationCap size={56} className="text-amber-500" />
                )}
              </div>
              <div className="absolute -bottom-2.5 start-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md flex items-center gap-1">
                <Star size={12} className="fill-white" />
                <span>{isAr ? currentBanner.badge_text_ar : currentBanner.badge_text_en}</span>
              </div>
            </div>

            {/* Info & Content */}
            <div className="flex-1 text-center lg:text-start space-y-3">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {currentBanner.name}
                </h3>
                {currentBanner.rating > 0 && (
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-extrabold text-xs">
                    <Star size={13} className="fill-amber-500 text-amber-500" />
                    <span>{currentBanner.rating}</span>
                    <span className="text-slate-400 font-normal">({currentBanner.reviews_count})</span>
                  </div>
                )}
              </div>

              {currentBanner.marketing_title && (
                <p className="text-sm sm:text-base font-bold text-amber-600">
                  {currentBanner.marketing_title}
                </p>
              )}

              {currentBanner.marketing_bio && (
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  {currentBanner.marketing_bio}
                </p>
              )}

              {/* Subjects tags */}
              {Array.isArray(currentBanner.subjects) && currentBanner.subjects.length > 0 && (
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 pt-1">
                  {currentBanner.subjects.slice(0, 4).map((sub: any) => (
                    <span
                      key={sub.id}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700"
                    >
                      {isAr ? sub.name_ar : sub.name_en}
                    </span>
                  ))}
                  {currentBanner.subjects.length > 4 && (
                    <span className="text-[11px] text-slate-400">+{currentBanner.subjects.length - 4}</span>
                  )}
                </div>
              )}
            </div>

            {/* Price & CTA */}
            <div className="flex flex-col items-center lg:items-end gap-3 flex-shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 w-full lg:w-auto">
              {currentBanner.individual_hour_price > 0 && (
                <div className="text-center lg:text-end">
                  <span className="text-xs text-slate-400 block">{isAr ? 'سعر الحصة الفردية' : 'Hourly Rate'}</span>
                  <div className="flex items-baseline justify-center lg:justify-end gap-1">
                    <span className="text-2xl font-black text-amber-600">
                      {currentBanner.individual_hour_price}
                    </span>
                    <span className="text-xs font-bold text-slate-600">SAR</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleBannerClick(currentBanner)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs sm:text-sm shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <span>{isAr ? 'عرض الملف وحجز حصة' : 'View Profile & Book'}</span>
                {isAr ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </button>
            </div>
          </div>

          {/* Dots Indicator */}
          {banners.length > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-6 pt-4 border-t border-slate-100">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex ? 'w-6 bg-amber-500' : 'w-2 bg-slate-200'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

