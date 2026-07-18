import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Star, Clock, Users, School, Copy, Check, BookOpen, Globe, Award, MessageSquare, Heart, ArrowLeft, Share2, Loader2, Calendar } from 'lucide-react';
import { studentService, getStorageUrl, Session } from '../../Services/api';
import { SessionDetailsModal } from './SessionDetailsModal';
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

function getServiceIcon(keyName: string, id: number): { icon: string; color: string } {
  const key = (keyName || '').toLowerCase();
  if (key === 'private_lesson' || key.includes('private') || id === 3) return { icon: 'person', color: '#3B82F6' };
  if (key === 'language_learning' || key.includes('language') || id === 2) return { icon: 'globe', color: '#F59E0B' };
  if (key === 'courses' || key === 'training_courses' || id === 4) return { icon: 'users', color: '#10B981' };
  if (key === 'sessions' || key === 'consultation' || id === 5) return { icon: 'video', color: '#8B5CF6' };
  return { icon: 'star', color: '#6B7280' };
}

function getServiceNameKey(keyName: string, id: number): string {
  const key = (keyName || '').toLowerCase();
  if (key === 'private_lesson' || key.includes('private') || id === 3) return 'private_lessons';
  if (key === 'language_learning' || key.includes('language') || id === 2) return 'language_learning';
  if (key === 'courses' || key === 'training_courses' || id === 4) return 'training_courses';
  if (key === 'sessions' || key === 'consultation' || id === 5) return 'sessions';
  return 'other';
}

export const TeacherDetailsPage: React.FC<TeacherDetailsPageProps> = ({ teacher: teacherProp, serviceId, onBack, onBookingComplete }) => {
  const { t, language, direction } = useLanguage();
  const [activeTab, setActiveTab] = useState<'details' | 'sessions'>('details');
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [favorited, setFavorited] = useState(teacherProp?.has_favorited ?? false);
  const [copied, setCopied] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const openSessionDetails = (session: any) => {
    setSelectedSession(session);
    setModalOpen(true);
  };

  const handleJoinSession = async (sessionId: number) => {
    setJoining(true);
    try {
      await studentService.joinSession(sessionId);
    } catch (e: any) {
      alert(e.message || (language === 'ar' ? 'فشل الانضمام للجلسة' : 'Failed to join session'));
    } finally {
      setJoining(false);
    }
  };

  const profile = teacherProp?.profile || {};
  const profileImage = profile.profile_photo || teacherProp?.profile_image || null;
  const firstName = teacherProp?.first_name || '';
  const lastName = teacherProp?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const nationality = teacherProp?.nationality || '';
  const flag = getNationalityFlag(nationality);
  const verified = teacherProp?.verified ?? profile?.verified ?? false;
  const rating = profile?.rating ?? teacherProp?.rating ?? 0;
  const reviews = profile?.reviews ?? [];
  const reviewsCount = reviews?.length ?? 0;
  const totalStudents = profile?.total_students ?? teacherProp?.total_students ?? 0;
  const completedLessons = profile?.bookings_count ?? profile?.subjects_count ?? 0;
  const individualHourPrice = profile?.individual_hour_price ?? teacherProp?.individual_hour_price ?? 0;
  const groupHourPrice = profile?.group_hour_price ?? teacherProp?.group_hour_price ?? 0;
  const teachIndividual = profile?.teach_individual ?? teacherProp?.teach_individual ?? false;
  const teachGroup = profile?.teach_group ?? teacherProp?.teach_group ?? false;
  const bio = profile?.bio || teacherProp?.bio || '';
  const code = profile?.code || teacherProp?.code || '';
  const services = profile?.services ?? [];
  const teacherSubjects = profile?.teacher_subjects ?? teacherProp?.teacher_subjects ?? [];
  const languages = profile?.languages ?? [];
  const certificates = profile?.certificate_attachment ? [profile.certificate_attachment] : [];
  const coverImage = profile?.cover_image || null;
  const availableTimes = profile?.available_times ?? teacherProp?.available_times ?? [];
  const specialization = teacherSubjects?.[0]?.class_level_title || (language === 'ar' ? 'معلم' : 'Teacher');

  const fetchSessions = useCallback(async () => {
    if (!teacherProp?.id) return;
    setLoadingSessions(true);
    setSessionsError(null);
    try {
      const data = await studentService.getTeacherSessions(teacherProp.id);
      setSessions(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setSessionsError(e.message || (language === 'ar' ? 'فشل تحميل الجلسات' : 'Failed to load sessions'));
    } finally {
      setLoadingSessions(false);
    }
  }, [teacherProp?.id, language]);

  useEffect(() => {
    if (activeTab === 'sessions') fetchSessions();
  }, [activeTab, fetchSessions]);

  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleFavoriteClick = () => {
    setFavorited(!favorited);
  };

  const handleBook = () => {
    setShowBooking(true);
  };

  const renderDetailIcon = (iconName: string) => {
    const size = 18;
    switch (iconName) {
      case 'person': return <Star size={size} />;
      case 'globe': return <Globe size={size} />;
      case 'users': return <Users size={size} />;
      case 'video': return <School size={size} />;
      default: return <Star size={size} />;
    }
  };

  const svcIconStyle = (color: string) => ({
    backgroundColor: `${color}15`,
    color: color,
    border: `1px solid ${color}30`,
  });

  const formatTime = (time: string) => time?.substring(0, 5) || '';
  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date.split('T')[0] || date);
    return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="animate-fade-in pb-24" ref={scrollRef}>
      {/* ===== Cover + Profile Header ===== */}
      <div className="relative h-64 bg-gradient-to-br from-primary to-blue-600 overflow-hidden">
        {coverImage && (
          <img src={getStorageUrl(coverImage)} alt="" className="w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

        <button onClick={onBack} className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all">
          <ArrowLeft size={20} className={direction === 'rtl' ? 'rotate-180' : ''} />
        </button>

        {code && (
          <button onClick={handleCopyCode} className="absolute top-4 left-4 z-10 p-2.5 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all">
            {copied ? <Check size={20} className="text-green-600" /> : <Share2 size={20} />}
          </button>
        )}
      </div>

      {/* ===== Profile Info Overlapping Cover ===== */}
      <div className="relative -mt-20 px-4 sm:px-6">
        <div className="flex flex-col items-center">
          <div className="h-28 w-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white -mt-14">
            {profileImage ? (
              <img src={getStorageUrl(profileImage)} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-4xl font-bold">
                {firstName?.charAt(0) || '?'}
              </div>
            )}
          </div>

          <div className="text-center mt-3">
            <div className="flex items-center justify-center gap-2">
              {flag && <span className="text-xl">{flag}</span>}
              <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
              {verified && <span className="text-blue-500"><Star size={20} fill="currentColor" /></span>}
            </div>
            <span className="inline-block mt-2 px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full">
              {specialization}
            </span>
          </div>

          {code && (
            <button onClick={handleCopyCode} className="mt-3 flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full border border-slate-200 hover:bg-slate-200 transition-colors group">
              <span className="text-sm font-mono font-semibold text-slate-700 tracking-wider">{code}</span>
              {copied ? (
                <Check size={16} className="text-green-600" />
              ) : (
                <Copy size={16} className="text-slate-400 group-hover:text-slate-600" />
              )}
            </button>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 mt-6 py-4 px-6 bg-white rounded-2xl border border-slate-100 shadow-sm w-full max-w-lg">
            <div className="flex flex-col items-center">
              <Star size={24} className="text-amber-500 fill-amber-500" />
              <span className="text-lg font-bold text-slate-900 mt-1">{rating > 0 ? rating.toFixed(1) : '0.0'}</span>
              <span className="text-xs text-slate-500">{language === 'ar' ? 'تقييم' : 'Rating'}</span>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="flex flex-col items-center">
              <Users size={24} className="text-primary" />
              <span className="text-lg font-bold text-slate-900 mt-1">{totalStudents}</span>
              <span className="text-xs text-slate-500">{language === 'ar' ? 'طلاب' : 'Students'}</span>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="flex flex-col items-center">
              <School size={24} className="text-green-500" />
              <span className="text-lg font-bold text-slate-900 mt-1">{completedLessons}</span>
              <span className="text-xs text-slate-500">{language === 'ar' ? 'دروس' : 'Lessons'}</span>
            </div>
            <div className="w-px h-12 bg-slate-200" />
            <div className="flex flex-col items-center">
              <Clock size={24} className="text-blue-500" />
              <span className="text-lg font-bold text-slate-900 mt-1">{individualHourPrice}</span>
              <span className="text-xs text-slate-500">{t.sar}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Tabs ===== */}
      <div className="mt-6 border-b border-slate-200 px-4 sm:px-6">
        <div className="flex gap-0 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
              activeTab === 'details' ? 'text-primary border-primary' : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            {language === 'ar' ? 'التفاصيل' : 'Details'}
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${
              activeTab === 'sessions' ? 'text-primary border-primary' : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            {language === 'ar' ? 'الجلسات' : 'Sessions'}
          </button>
        </div>
      </div>

      {/* ===== Tab Content ===== */}
      <div className="px-4 sm:px-6 mt-6 max-w-3xl mx-auto space-y-5">
        {activeTab === 'details' ? (
          <>
            {/* Bio */}
            {bio && (
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <MessageSquare size={18} className="text-primary" />
                  {language === 'ar' ? 'نبذة عن المعلم' : 'About Teacher'}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">{bio}</p>
              </div>
            )}

            {/* Services */}
            {services.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Star size={18} className="text-primary" />
                  {language === 'ar' ? 'الخدمات المقدمة' : 'Services'}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {services.map((svc: any) => {
                    const { icon, color } = getServiceIcon(svc.key_name, svc.service_id || svc.id);
                    const name = language === 'ar' ? (svc.name_ar || svc.name_en) : (svc.name_en || svc.name_ar);
                    return (
                      <div key={svc.id} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={svcIconStyle(color)}>
                        {renderDetailIcon(icon)}
                        <span>{name || ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pricing */}
            {(teachIndividual || teachGroup) && (
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  {language === 'ar' ? 'السعر' : 'Pricing'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teachIndividual && (
                    <div className="p-4 rounded-xl bg-primary text-white">
                      <p className="text-sm opacity-80">{language === 'ar' ? 'درس فردي' : 'Private Lesson'}</p>
                      <p className="text-2xl font-bold mt-1">{individualHourPrice} <span className="text-sm font-normal opacity-80">{t.sar}</span></p>
                    </div>
                  )}
                  {teachGroup && (
                    <div className="p-4 rounded-xl bg-green-500 text-white">
                      <p className="text-sm opacity-80">{language === 'ar' ? 'درس جماعي' : 'Group Lesson'}</p>
                      <p className="text-2xl font-bold mt-1">{groupHourPrice} <span className="text-sm font-normal opacity-80">{t.sar}</span></p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subjects */}
            {teacherSubjects.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <BookOpen size={18} className="text-purple-500" />
                  {language === 'ar' ? 'المواد الدراسية' : 'Subjects'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {teacherSubjects.map((sub: any) => (
                    <span key={sub.id} className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium border border-purple-100">
                      {sub.title || sub.name_ar || sub.name_en}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Globe size={18} className="text-orange-500" />
                  {language === 'ar' ? 'اللغات' : 'Languages'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang: any, idx: number) => (
                    <span key={lang.id || idx} className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 text-sm font-medium border border-orange-100">
                      {language === 'ar' ? (lang.name_ar || lang.name_en) : (lang.name_en || lang.name_ar)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certificates */}
            {certificates.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Award size={18} className="text-primary" />
                  {language === 'ar' ? 'الشهادات' : 'Certificates'}
                </h3>
                <div className="space-y-3">
                  {certificates.map((cert: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Award size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-800 truncate">{cert.file_name || cert.title || (language === 'ar' ? 'شهادة' : 'Certificate')}</p>
                        {cert.file_path && (
                          <a href={getStorageUrl(cert.file_path)} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                            {language === 'ar' ? 'عرض الشهادة' : 'View Certificate'}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <MessageSquare size={18} className="text-amber-500" />
                  {language === 'ar' ? 'التقييمات' : 'Reviews'} ({reviewsCount})
                </h3>
                <div className="space-y-4">
                  {reviews.slice(0, 5).map((review: any, idx: number) => (
                    <div key={review.id || idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {(review.student_name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-slate-800">{review.student_name || (language === 'ar' ? 'طالب' : 'Student')}</p>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={12} className={s <= (review.rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-slate-300'} />
                            ))}
                          </div>
                        </div>
                        {review.date && <span className="text-[10px] text-slate-400">{review.date}</span>}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          // Sessions Tab
          <div className="space-y-4">
            {loadingSessions ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
              </div>
            ) : sessionsError ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <Calendar size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">{sessionsError}</p>
                <button onClick={fetchSessions} className="mt-3 text-primary text-sm font-semibold hover:underline">
                  {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </button>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <Calendar size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">
                  {language === 'ar' ? 'لا توجد جلسات بعد' : 'No sessions yet'}
                </p>
              </div>
            ) : (
              sessions.map((session: any, idx: number) => {
                const s = session.session || session;
                const subjectName = language === 'ar'
                  ? (s.subject?.name_ar || s.subject_name_ar || '')
                  : (s.subject?.name_en || s.subject_name_en || '');
                const teacherName = s.teacher?.name || (language === 'ar' ? 'غير معروف' : 'Unknown');
                const durationMs = Date.parse(`1970-01-01T${s.end_time || '00:00'}`) - Date.parse(`1970-01-01T${s.start_time || '00:00'}`);
                const durationMin = Math.round(durationMs / 60000);
                const durationStr = durationMin >= 60
                  ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`
                  : `${durationMin}m`;
                const statusColors: Record<string, { bg: string, text: string, label: string }> = {
                  completed: { bg: 'from-green-500 to-emerald-600', text: 'text-green-700', label: language === 'ar' ? 'مكتمل' : 'Completed' },
                  ended: { bg: 'from-green-500 to-emerald-600', text: 'text-green-700', label: language === 'ar' ? 'منتهي' : 'Ended' },
                  live: { bg: 'from-red-500 to-rose-600', text: 'text-red-700', label: language === 'ar' ? 'مباشر' : 'Live' },
                  cancelled: { bg: 'from-gray-400 to-gray-500', text: 'text-gray-500', label: language === 'ar' ? 'ملغي' : 'Cancelled' },
                };
                const statusInfo = statusColors[s.status] || { bg: 'from-blue-500 to-indigo-600', text: 'text-blue-700', label: language === 'ar' ? 'مجدول' : 'Scheduled' };
                const statusLabel = s.status_label || statusInfo.label;
                const statusColorClass = statusInfo.text;
                return (
                  <div key={session.id || idx} onClick={() => openSessionDetails(s)} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    {/* Time Header with Gradient */}
                    <div className={`bg-gradient-to-br ${statusInfo.bg} px-4 py-3 flex items-center gap-3`}>
                      <div className="p-1.5 rounded-lg bg-white/20">
                        <Clock size={16} className="text-white" />
                      </div>
                      <span className="text-white text-sm font-bold">
                        {formatTime(s.start_time)} - {formatTime(s.end_time)}
                      </span>
                      <div className="ml-auto px-2.5 py-1 rounded-xl bg-white/20 border border-white/20 flex items-center gap-1.5">
                        <Calendar size={12} className="text-white" />
                        <span className="text-white/90 text-xs font-semibold">{formatDate(s.session_date)}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      {/* Subject Name + Duration + Status */}
                      <div className="flex items-center gap-2">
                        <h4 className="flex-1 font-bold text-lg text-primary truncate">
                          {subjectName || (language === 'ar' ? 'جلسة' : 'Session')}
                        </h4>
                        {/* Duration Badge */}
                        <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                          <Clock size={12} />
                          {durationStr}
                        </span>
                        {/* Status Badge */}
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                          s.status === 'completed' || s.status === 'ended' ? 'bg-green-50 text-green-700' :
                          s.status === 'live' ? 'bg-red-50 text-red-700' :
                          s.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* Teacher Info & Action */}
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-slate-500">{language === 'ar' ? 'المدرس' : 'Teacher'}</p>
                          <p className="text-sm font-semibold text-slate-800 truncate">{teacherName}</p>
                        </div>

                        {/* Action */}
                        {(s.status === 'completed' || s.status === 'ended') ? (
                          <span className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {language === 'ar' ? 'منتهية' : 'Finished'}
                          </span>
                        ) : s.status === 'live' ? (
                          <button className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors whitespace-nowrap">
                            {language === 'ar' ? 'انضمام' : 'Join'}
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {language === 'ar' ? 'قادمة' : 'Upcoming'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ===== Bottom Bar ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg px-4 py-3 z-40">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={handleFavoriteClick}
            className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Heart size={24} className={favorited ? 'fill-red-400 text-red-400' : 'text-slate-400'} />
          </button>
          <button
            onClick={handleBook}
            className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            <Calendar size={20} />
            {language === 'ar' ? 'حجز موعد' : 'Book Now'}
          </button>
        </div>
      </div>

      {/* Simple booking modal overlay */}
      {showBooking && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowBooking(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg">{language === 'ar' ? 'حجز موعد' : 'Book a Session'}</h3>
              <button onClick={() => setShowBooking(false)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  {profileImage ? (
                    <img src={getStorageUrl(profileImage)} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-400">{firstName?.charAt(0) || '?'}</div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{fullName}</p>
                  <p className="text-sm text-slate-500">{individualHourPrice} {t.sar}{t.perHour}</p>
                </div>
              </div>

              {availableTimes.length === 0 ? (
                <p className="text-center py-8 text-slate-500">{language === 'ar' ? 'لا توجد أوقات متاحة حالياً' : 'No available times'}</p>
              ) : (
                availableTimes.map((day: any) => {
                  const timeItems = day.time_slots || day.times || [];
                  if (timeItems.length === 0) return null;
                  return (
                    <div key={day.id || day.day}>
                      <p className="text-sm font-semibold text-slate-700 mb-2">{day.day}</p>
                      <div className="flex flex-wrap gap-2">
                        {timeItems.map((slot: any) => {
                          const timeStr = typeof slot === 'string' ? slot : slot.time;
                          return (
                            <span key={slot.id || timeStr} className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600">
                              {timeStr}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-6 border-t border-slate-100">
              <button
                onClick={() => { setShowBooking(false); onBookingComplete(); }}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
              >
                {language === 'ar' ? 'متابعة الحجز' : 'Continue Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      <SessionDetailsModal
        session={selectedSession}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onJoinSession={handleJoinSession}
        joining={joining}
      />
    </div>
  );
};
