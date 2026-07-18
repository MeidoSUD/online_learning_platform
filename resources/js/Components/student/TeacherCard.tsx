import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Star, Clock, Heart, ShieldCheck } from 'lucide-react';
import { getStorageUrl } from '../../Services/api';
import { COUNTRIES } from '../../Utils/constants';

interface TeacherCardProps {
  teacher: any;
  onViewDetails?: (teacher: any) => void;
  onFavoriteToggle?: (teacherId: number, newState: boolean) => void;
  compact?: boolean;
}

function getNationalityFlag(nationality?: string | null): string {
  if (!nationality) return '🏳️';
  const country = COUNTRIES.find(
    c => c.label.toLowerCase() === nationality.toLowerCase()
  );
  return country?.flag || '🏳️';
}

function getServiceName(service: any, lang: string): string {
  if (!service) return '';
  const serviceMap: Record<string, { en: string; ar: string }> = {
    '1': { en: 'Private Lessons', ar: 'دروس خصوصية' },
    '2': { en: 'Language Learning', ar: 'تعلم لغات' },
    '3': { en: 'Private Lessons', ar: 'دروس خصوصية' },
    '4': { en: 'Training Courses', ar: 'دورات تدريبية' },
    '5': { en: 'Private Tutoring', ar: 'تدريس خصوصي' },
    '6': { en: 'Qiyas & Achievement', ar: 'قياس وتحصيلي' },
  };
  const id = typeof service === 'number' ? String(service) : String(service);
  const mapped = serviceMap[id];
  if (!mapped) return '';
  return lang === 'ar' ? mapped.ar : mapped.en;
}

function getServiceCount(teacher: any, lang: string): string {
  const svc = teacher?.profile?.service ?? teacher?.service ?? 0;
  const serviceId = Number(svc);
  if (!serviceId) return '';

  const subjectsCount = teacher?.profile?.teacher_subjects?.length ?? teacher?.teacher_subjects?.length ?? 0;
  const languagesCount = teacher?.profile?.languages?.length ?? teacher?.languages?.length ?? 0;
  const coursesCount = teacher?.profile?.courses?.length ?? teacher?.courses?.length ?? 0;

  if (serviceId === 6 || serviceId === 3 || serviceId === 5) {
    return subjectsCount > 0
      ? (lang === 'ar' ? `${subjectsCount} مواد` : `${subjectsCount} Subject${subjectsCount !== 1 ? 's' : ''}`)
      : '';
  }
  if (serviceId === 4) {
    return languagesCount > 0
      ? (lang === 'ar' ? `${languagesCount} لغات` : `${languagesCount} Language${languagesCount !== 1 ? 's' : ''}`)
      : '';
  }
  return '';
}

export const TeacherCard: React.FC<TeacherCardProps> = ({
  teacher,
  onViewDetails,
  onFavoriteToggle,
  compact = false,
}) => {
  const { t, language } = useLanguage();
  const [favorited, setFavorited] = React.useState(teacher?.has_favorited ?? false);

  const profile = teacher?.profile || {};
  const profileImage = profile.profile_photo || teacher?.profile_image || null;
  const firstName = teacher?.first_name || '';
  const lastName = teacher?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const nationality = teacher?.nationality || '';
  const verified = teacher?.verified ?? profile?.verified ?? false;
  const rating = profile?.rating ?? teacher?.rating ?? 0;
  const reviewsCount = profile?.reviews?.length ?? 0;
  const serviceId = profile?.service ?? teacher?.service ?? 0;
  const availableTimes = profile?.available_times ?? teacher?.available_times ?? [];
  const availableDaysCount = Array.isArray(availableTimes) ? availableTimes.length : 0;
  const bio = profile?.bio || teacher?.bio || '';

  const serviceName = getServiceName(serviceId, language);
  const serviceCountStr = getServiceCount(teacher, language);
  const flag = getNationalityFlag(nationality);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !favorited;
    setFavorited(newState);
    onFavoriteToggle?.(teacher?.id, newState);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
      <div className="p-5 flex-1">
        {/* Row 1: Profile Image + Name/Verified/Fav */}
        <div className="flex gap-4">
          <div className="w-[70px] h-[70px] rounded-xl border-2 border-primary/20 overflow-hidden shrink-0">
            {profileImage ? (
              <img
                src={getStorageUrl(profileImage)}
                alt={fullName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center', 'bg-slate-100');
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                <span className="text-2xl font-bold">{firstName?.charAt(0) || '?'}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <h3 className="text-[17px] font-bold text-slate-900 truncate max-w-[160px]">
                {fullName}
              </h3>
              {verified && (
                <ShieldCheck size={18} className="text-blue-500 shrink-0" fill="white" />
              )}
              <button
                onClick={handleFavoriteClick}
                className="ml-auto shrink-0 p-1 hover:scale-110 transition-transform"
              >
                <Heart
                  size={18}
                  className={favorited ? 'fill-red-400 text-red-400' : 'text-slate-300'}
                />
              </button>
            </div>

            {/* Row 2: Nationality + Service */}
            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-slate-500">
              <span className="text-base leading-none">{flag}</span>
              <span className="truncate max-w-[90px]">{nationality || t.notSpecified || 'N/A'}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
              <span className="truncate">{serviceName}</span>
              {serviceCountStr && (
                <>
                  <span className="text-slate-400">(</span>
                  <span className="font-semibold text-slate-600">{serviceCountStr}</span>
                  <span className="text-slate-400">)</span>
                </>
              )}
            </div>

            {/* Row 3: Rating + Available Days */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span className="text-sm font-semibold text-slate-600">
                  {rating > 0 ? rating.toFixed(1) : '0.0'}
                </span>
                <span className="text-xs text-slate-400">
                  ({reviewsCount})
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} className="text-primary" />
                <span className="text-sm text-slate-500">
                  {language === 'ar'
                    ? `${availableDaysCount} أيام متاحة`
                    : `${availableDaysCount} day${availableDaysCount !== 1 ? 's' : ''} available`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio snippet (only for non-compact) */}
        {!compact && bio && (
          <p className="text-sm text-slate-500 mt-3 line-clamp-2">{bio}</p>
        )}
      </div>

      {/* Bottom button */}
      <div className="p-4 pt-0">
        <button
          onClick={() => onViewDetails?.(teacher)}
          className="w-full py-3 px-4 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
        >
          {(t.viewDetails || 'View Details') + ' & ' + (t.bookNow || 'Book')}
        </button>
      </div>
    </div>
  );
};
