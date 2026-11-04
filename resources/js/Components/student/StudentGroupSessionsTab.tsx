import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  Users,
  Calendar,
  Clock,
  Timer,
  Video,
  Loader2,
  AlertCircle,
  User,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ListOrdered,
  X,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { studentService, getStorageUrl } from '../../Services/api';
import { SessionRoomModal } from '../dashboard/SessionRoomModal';

interface StudentGroupSessionsTabProps {
  onBackToClasses?: () => void;
}

export const StudentGroupSessionsTab: React.FC<StudentGroupSessionsTabProps> = ({ onBackToClasses }) => {
  const { t, language, direction } = useLanguage();
  const isAr = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'active' | 'ended'>('active');
  const [error, setError] = useState<string | null>(null);

  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState<any | null>(null);

  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [agoraPayload, setAgoraPayload] = useState<any | null>(null);
  const [isRoomOpen, setIsRoomOpen] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [selectedFilter]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.getStudentGroupClassSessions(selectedFilter);
      setSessions(Array.isArray(res) ? res : []);
    } catch (e: any) {
      setError(e.message || (isAr ? 'فشل تحميل الجلسات الجماعية' : 'Failed to load group sessions'));
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async (item: any) => {
    const sessionStudentId = item.id;
    if (!sessionStudentId) return;

    setJoiningId(sessionStudentId);
    setJoinError(null);

    try {
      const res = await studentService.joinGroupClassSession(sessionStudentId);
      const data = res.data || res;
      setAgoraPayload({
        app_id: data.agora_app_id || data.app_id || '3a77d1a600964e9bb4aae8b0dd59f157',
        channel: data.agora_channel || data.channel || `group_session_${sessionStudentId}`,
        token: data.agora_token || data.token,
        uid: data.agora_uid || data.uid || Math.floor(Math.random() * 10000),
        role: 'student',
        session_id: sessionStudentId,
      });
      setIsRoomOpen(true);
    } catch (err: any) {
      setJoinError(err.message || (isAr ? 'تعذر الانضمام للجلسة في الوقت الحالي' : 'Failed to join session'));
    } finally {
      setJoiningId(null);
    }
  };

  const formatStatusLabel = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'live':
        return isAr ? 'مباشرة الآن' : 'Live Now';
      case 'in_progress':
        return isAr ? 'جارية الآن' : 'In Progress';
      case 'wait_for_teacher':
        return isAr ? 'بانتظار المعلم' : 'Waiting for Teacher';
      case 'ended':
        return isAr ? 'منتهية' : 'Ended';
      case 'completed':
        return isAr ? 'مكتملة' : 'Completed';
      case 'cancelled':
        return isAr ? 'ملغاة' : 'Cancelled';
      case 'no_show':
        return isAr ? 'لم يحضر' : 'No Show';
      case 'scheduled':
      default:
        return isAr ? 'مجدولة' : 'Scheduled';
    }
  };

  const getStatusColorClass = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'live':
      case 'in_progress':
        return 'text-emerald-600 bg-emerald-50';
      case 'wait_for_teacher':
        return 'text-amber-600 bg-amber-50';
      case 'ended':
      case 'completed':
        return 'text-slate-500 bg-slate-100';
      case 'cancelled':
      case 'no_show':
        return 'text-rose-600 bg-rose-50';
      case 'scheduled':
      default:
        return 'text-sky-600 bg-sky-50';
    }
  };

  const formatStudentStatus = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'attended':
        return isAr ? 'حضر الجلسة' : 'Attended';
      case 'absent':
        return isAr ? 'غائب' : 'Absent';
      case 'left':
        return isAr ? 'غادر الجلسة' : 'Left Session';
      case 'scheduled':
      default:
        return isAr ? 'مسجل / بانتظار البدء' : 'Registered / Scheduled';
    }
  };

  const getStudentStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'attended':
        return 'text-emerald-700';
      case 'absent':
        return 'text-rose-600';
      default:
        return 'text-emerald-600';
    }
  };

  const renderDetailsModal = () => {
    if (!selectedSessionForDetails) return null;

    const item = selectedSessionForDetails;
    const session = item.session || {};
    const groupClass = session.group_class || session.groupClass || {};
    const lesson = session.lesson || {};
    const teacher = session.teacher || {};
    const booking = item.booking || {};

    const sessionTitle = session.session_title || lesson.title || (isAr ? 'جلسة جماعية' : 'Group Session');
    const classTitle = groupClass.title || '';
    const teacherName = teacher.name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim();
    const date = session.session_date || lesson.lesson_date || '';
    const startTime = session.start_time || lesson.start_time || '';
    const endTime = session.end_time || lesson.end_time || '';
    const duration = session.duration || lesson.duration || 60;
    const sessionStatus = session.status || 'scheduled';
    const studentStatus = item.status || 'scheduled';
    const bookingRef = booking.booking_reference || '';

    const subjectData = groupClass.subject || booking.subject;
    const subjectName = subjectData?.name_ar || subjectData?.name_en || subjectData?.name || '';

    const levelData = groupClass.education_level || groupClass.educationLevel;
    const levelName = levelData?.name_ar || levelData?.name_en || levelData?.name || '';

    const classData = groupClass.class || groupClass.class_model || groupClass.classModel;
    const className = classData?.name_ar || classData?.name_en || classData?.name || '';

    const stageAndClass = [levelName, className].filter(Boolean).join(' - ');
    const lessonNumber = lesson.lesson_number || session.lesson_number;
    const lessonTopic = (lesson.topic || '').trim();

    const rawStudentsCount = session.session_students_count || session.students_count || lesson.students_count || groupClass.students_count;
    let studentsCountText = '';
    if (rawStudentsCount != null) {
      const parsed = Number(rawStudentsCount);
      if (!isNaN(parsed)) {
        if (parsed === 1) studentsCountText = isAr ? 'طالب واحد' : '1 Student';
        else if (parsed === 2) studentsCountText = isAr ? 'طالبان' : '2 Students';
        else if (parsed >= 3 && parsed <= 10) studentsCountText = isAr ? `${parsed} طلاب` : `${parsed} Students`;
        else studentsCountText = isAr ? `${parsed} طالب` : `${parsed} Students`;
      } else {
        studentsCountText = String(rawStudentsCount);
      }
    }

    const isLive = sessionStatus.toLowerCase() === 'live' || sessionStatus.toLowerCase() === 'in_progress';

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
        <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
          <div className="p-5 border-b border-slate-100 flex flex-col items-center relative bg-white">
            <div className="w-11 h-1 bg-slate-200 rounded-full mb-3" />
            <h3 className="font-bold text-slate-900 text-lg">
              {isAr ? 'تفاصيل الجلسة الجماعية' : 'Group Session Details'}
            </h3>
            <button
              onClick={() => setSelectedSessionForDetails(null)}
              className="absolute left-4 sm:left-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            >
              <X size={17} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-3 flex-1 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-xs text-slate-400">{isAr ? 'عنوان الجلسة' : 'Session Title'}</span>
              <span className="font-bold text-slate-800 text-end">{sessionTitle}</span>
            </div>

            {classTitle && (
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400">{isAr ? 'اسم الحصة الجماعية' : 'Group Class'}</span>
                <span className="font-bold text-slate-800 text-end">{classTitle}</span>
              </div>
            )}

            {subjectName && (
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400">{isAr ? 'المادة' : 'Subject'}</span>
                <span className="font-bold text-slate-800 text-end">{subjectName}</span>
              </div>
            )}

            {stageAndClass && (
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400">{isAr ? 'المرحلة والصف' : 'Stage & Grade'}</span>
                <span className="font-bold text-slate-800 text-end">{stageAndClass}</span>
              </div>
            )}

            {lessonNumber && (
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400">{isAr ? 'رقم الدرس' : 'Lesson Number'}</span>
                <span className="font-bold text-slate-800 text-end">{isAr ? `الدرس ${lessonNumber}` : `Lesson ${lessonNumber}`}</span>
              </div>
            )}

            {lessonTopic && lessonTopic !== sessionTitle && (
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400">{isAr ? 'موضوع الدرس' : 'Topic'}</span>
                <span className="font-bold text-slate-800 text-end">{lessonTopic}</span>
              </div>
            )}

            {teacherName && (
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400">{isAr ? 'المعلم' : 'Teacher'}</span>
                <span className="font-bold text-slate-800 text-end">{teacherName}</span>
              </div>
            )}

            {studentsCountText && (
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-xs text-slate-400">{isAr ? 'عدد الطلاب' : 'Students Count'}</span>
                <span className="font-bold text-slate-800 text-end">{studentsCountText}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-xs text-slate-400">{isAr ? 'التاريخ' : 'Date'}</span>
              <span className="font-bold text-slate-800 text-end">{date || 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-xs text-slate-400">{isAr ? 'الوقت' : 'Time'}</span>
              <span className="font-bold text-slate-800 text-end">{startTime} - {endTime}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-xs text-slate-400">{isAr ? 'المدة' : 'Duration'}</span>
              <span className="font-bold text-slate-800 text-end">{duration} {isAr ? 'دقيقة' : 'mins'}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-xs text-slate-400">{isAr ? 'حالة الجلسة' : 'Session Status'}</span>
              <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${getStatusColorClass(sessionStatus)}`}>
                {formatStatusLabel(sessionStatus)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-xs text-slate-400">{isAr ? 'حالة الحضور' : 'Attendance Status'}</span>
              <span className={`font-bold text-xs ${getStudentStatusColor(studentStatus)}`}>
                {formatStudentStatus(studentStatus)}
              </span>
            </div>

            {bookingRef && (
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-slate-400">{isAr ? 'رقم الحجز' : 'Booking Reference'}</span>
                <span className="font-bold text-slate-800 text-end">{bookingRef}</span>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-slate-100 space-y-2 bg-slate-50/50">
            {isLive && (
              <Button
                onClick={() => {
                  setSelectedSessionForDetails(null);
                  handleJoinSession(item);
                }}
                className="w-full h-12 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <Video size={18} />
                <span>{isAr ? 'دخول الجلسة الآن' : 'Join Session Now'}</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setSelectedSessionForDetails(null)}
              className="w-full h-11 rounded-xl font-bold text-xs border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-16 animate-fade-in">
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          {onBackToClasses && (
            <button
              onClick={onBackToClasses}
              className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center transition-colors"
            >
              {direction === 'rtl' ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isAr ? 'الجلسات الجماعية' : 'Group Sessions'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr ? 'جدول حصصك الجماعية الافتراضية وحالة حضور الجلسات' : 'Your virtual group sessions and schedule'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm flex max-w-md mx-auto">
        {[
          { key: 'active', label: isAr ? 'نشطة' : 'Active' },
          { key: 'ended', label: isAr ? 'منتهية' : 'Ended' },
        ].map((filter) => {
          const isSelected = selectedFilter === filter.key;
          return (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key as any)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all text-center ${
                isSelected
                  ? 'bg-[#E8F1F3] text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {joinError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{joinError}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center min-h-[340px]">
          <Loader2 className="animate-spin h-9 w-9 text-emerald-600" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center">
          <AlertCircle size={44} className="text-rose-500 mb-3" />
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <Button
            onClick={fetchSessions}
            className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2"
          >
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[340px]">
          <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
            <Users size={44} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {isAr ? 'لا توجد جلسات جماعية' : 'No Group Sessions'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mb-6">
            {isAr ? 'لم يتم العثور على أي جلسات في هذا التصنيف' : 'No group sessions found under this filter'}
          </p>
          {onBackToClasses && (
            <Button
              onClick={onBackToClasses}
              className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 shadow-sm"
            >
              {isAr ? 'تصفح الحصص الجماعية' : 'Browse Group Classes'}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((item) => {
            const session = item.session || {};
            const groupClass = session.group_class || session.groupClass || {};
            const lesson = session.lesson || {};
            const teacher = session.teacher || {};
            const booking = item.booking || {};

            const sessionTitle = session.session_title || lesson.title || (isAr ? 'جلسة جماعية' : 'Group Session');
            const classTitle = groupClass.title || '';
            const subjectData = groupClass.subject || booking.subject;
            const subjectName = subjectData?.name_ar || subjectData?.name_en || subjectData?.name || '';

            const subjectText = subjectName || classTitle || sessionTitle;

            const teacherName = teacher.name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim();
            const teacherAvatar = teacher.profile_image || teacher.avatar || teacher.profile_photo_url || '';

            const date = session.session_date || lesson.lesson_date || '';
            const startTime = session.start_time || lesson.start_time || '';
            const endTime = session.end_time || lesson.end_time || '';
            const duration = session.duration || lesson.duration || 60;
            const sessionStatus = (session.status || 'scheduled').toLowerCase();

            const isLive = sessionStatus === 'live' || sessionStatus === 'in_progress';
            const isEnded = sessionStatus === 'completed' || sessionStatus === 'ended' || sessionStatus === 'cancelled';
            const isJoining = joiningId === item.id;

            const lessonNumber = lesson.lesson_number || session.lesson_number;
            const totalSessions = groupClass.total_sessions;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedSessionForDetails(item)}
                className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border ${
                  isLive ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <BookOpen size={18} />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 truncate">
                      {subjectText}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {lessonNumber && (
                      <div className="px-2.5 py-1 rounded-lg bg-[#E8F0FE] text-slate-800 text-[11px] font-bold flex items-center gap-1">
                        <ListOrdered size={12} className="text-slate-600" />
                        <span>
                          {totalSessions && Number(totalSessions) > 1
                            ? (isAr ? `الجلسة ${lessonNumber} من ${totalSessions}` : `Session ${lessonNumber} of ${totalSessions}`)
                            : (isAr ? `الجلسة ${lessonNumber}` : `Session ${lessonNumber}`)}
                        </span>
                      </div>
                    )}

                    <div
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        isLive
                          ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                          : isEnded
                          ? 'bg-[#F0F4F5] text-slate-500'
                          : 'bg-[#EAF5E9] text-emerald-700'
                      }`}
                    >
                      {isLive
                        ? (isAr ? 'مباشرة الآن' : 'Live Now')
                        : isEnded
                        ? (isAr ? 'منتهية' : 'Ended')
                        : (isAr ? 'نشطة' : 'Active')}
                    </div>
                  </div>
                </div>

                {sessionTitle && sessionTitle !== subjectText && (
                  <p className="text-xs text-slate-500 mb-3 truncate">
                    {sessionTitle}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 my-3">
                  {duration && (
                    <div className="flex items-center gap-1.5">
                      <Timer size={14} className="text-slate-400" />
                      <span>{duration} {isAr ? 'دقيقة' : 'mins'}</span>
                    </div>
                  )}

                  {date && (
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      <span>{date}</span>
                    </div>
                  )}

                  {startTime && endTime && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-400" />
                      <span>{startTime} - {endTime}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {teacherAvatar ? (
                        <img
                          src={getStorageUrl(teacherAvatar)}
                          alt={teacherName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={16} className="text-slate-400" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-800 truncate">
                      {teacherName || (isAr ? 'المعلم' : 'Teacher')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isLive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isJoining) handleJoinSession(item);
                        }}
                        disabled={isJoining}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        {isJoining ? (
                          <Loader2 className="animate-spin h-3.5 w-3.5" />
                        ) : (
                          <Video size={14} />
                        )}
                        <span>{isJoining ? (isAr ? 'جاري الدخول...' : 'Joining...') : (isAr ? 'دخول الجلسة' : 'Join')}</span>
                      </button>
                    )}

                    <span className="text-slate-400">
                      {direction === 'rtl' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {renderDetailsModal()}

      {agoraPayload && (
        <SessionRoomModal
          isOpen={isRoomOpen}
          onClose={() => {
            setIsRoomOpen(false);
            setAgoraPayload(null);
          }}
          agora={agoraPayload}
        />
      )}
    </div>
  );
};