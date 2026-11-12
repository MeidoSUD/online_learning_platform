import React, { useState } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Star, Heart, BookOpen, User, Loader2 } from 'lucide-react';
import { getStorageUrl, studentService } from '../../Services/api';

interface TeacherCardProps {
  teacher: any;
  onViewDetails?: (teacher: any) => void;
  onBookNow?: (teacher: any) => void;
  onFavoriteToggle?: (teacherId: number, newState: boolean) => void;
  browseOnly?: boolean;
  compact?: boolean;
}

export const TeacherCard: React.FC<TeacherCardProps> = ({
  teacher,
  onViewDetails,
  onBookNow,
  onFavoriteToggle,
  browseOnly = false,
}) => {
  const { language } = useLanguage();
  const [favorited, setFavorited] = useState<boolean>(
    Boolean(teacher?.has_favorited || teacher?.is_favorite || teacher?.hasFavorited)
  );
  const [favLoading, setFavLoading] = useState(false);

  const profile = teacher?.profile || {};
  const rawImage = profile.profile_photo || teacher?.profile_image || teacher?.avatar;
  const profileImageUrl = rawImage ? getStorageUrl(rawImage) : null;
  const fullName = (teacher?.full_name || `${teacher?.first_name || ''} ${teacher?.last_name || ''}`).trim() || (language === 'ar' ? 'معلم' : 'Teacher');
  const rating = Number(profile.rating ?? teacher?.rating ?? 0);
  const ratingStr = rating > 0 ? rating.toFixed(1) : '0.0';

  const priceNum = Number(
    profile.individual_hour_price ??
    teacher?.individual_hour_price ??
    teacher?.price_hour ??
    teacher?.price ??
    0
  );
  const priceStr = Math.round(priceNum).toString();

  const servicesList = profile.services || teacher?.services || [];
  const primaryService = servicesList[0];
  const serviceName = primaryService
    ? (language === 'ar' ? primaryService.name_ar || primaryService.name : primaryService.name_en || primaryService.name)
    : (teacher?.subject_name || teacher?.specialization || (language === 'ar' ? 'دروس خصوصية' : 'Private Lessons'));

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favLoading) return;
    const prev = favorited;
    setFavorited(!prev);
    setFavLoading(true);
    try {
      await studentService.toggleFavorite(teacher.id);
      onFavoriteToggle?.(teacher.id, !prev);
    } catch {
      setFavorited(prev);
    } finally {
      setFavLoading(false);
    }
  };

  const handleAction = () => {
    if (onBookNow) {
      onBookNow(teacher);
    } else if (onViewDetails) {
      onViewDetails(teacher);
    }
  };

  return (
    <div
      onClick={handleAction}
      className="bg-white rounded-2xl p-3 sm:p-4 border border-[#E6E6E6] shadow-sm hover:shadow-md transition-all cursor-pointer flex items-start gap-3 w-full"
    >
      <div className="w-16 h-16 rounded-full bg-[#EFF6F4] border border-[#E6E6E6] shrink-0 overflow-hidden flex items-center justify-center">
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt={fullName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <User className="w-8 h-8 text-[#738989]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-[#171717] truncate">
          {fullName}
        </h3>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-[#738989]">
          <BookOpen size={14} className="shrink-0 text-[#738989]" />
          <span className="truncate">{serviceName}</span>
        </div>
        <div className="flex items-center gap-1 mt-2">
          <Star size={16} className="text-amber-400 fill-amber-400 shrink-0" />
          <span className="text-xs font-bold text-[#171717]">{ratingStr}</span>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between self-stretch shrink-0">
        {!browseOnly && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            disabled={favLoading}
            className="p-1 text-[#738989] hover:scale-110 transition-transform disabled:opacity-50"
          >
            {favLoading ? (
              <Loader2 size={20} className="animate-spin text-[#738989]" />
            ) : (
              <Heart
                size={22}
                className={favorited ? 'text-red-500 fill-red-500' : 'text-[#738989]'}
              />
            )}
          </button>
        )}

        {!browseOnly && (
          <div className="flex flex-col items-end gap-2 mt-auto pt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-[#171717] leading-none">{priceStr}</span>
              <span className="text-xs font-medium text-[#0D4A5F]">
                {language === 'ar' ? 'ر.س / ساعة' : 'SAR / hr'}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAction();
              }}
              className="h-9 px-4 rounded-lg bg-[#5B9F48] hover:bg-[#4d863d] text-white text-xs font-medium transition-colors"
            >
              {language === 'ar' ? 'احجز الآن' : 'Book Now'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
