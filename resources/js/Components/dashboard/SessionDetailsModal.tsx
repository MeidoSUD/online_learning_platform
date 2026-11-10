import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { studentService, Session } from '../../Services/api';
import { getSessionState } from '../../Utils/sessionStatus';
import {
    X,
    Calendar,
    Clock,
    Timer,
    BookOpen,
    Info,
    Percent,
    Video,
    CheckCircle2,
    Star,
    Loader2,
    MessageSquare,
    ListOrdered
} from 'lucide-react';

interface SessionDetailsModalProps {
    session: Session | null;
    displayNumber?: number;
    displayTotal?: number;
    isOpen: boolean;
    onClose: () => void;
    onStartSession?: (sessionId: number) => void;
    onEndSession?: (sessionId: number) => void;
    isTeacher?: boolean;
}

interface ReviewData {
    rating: number;
    comment?: string;
    created_at?: string;
    reviewer_name?: string;
}

function formatTime(time: string, language: string): string {
    if (!time) return '';
    try {
        const [h, m] = time.split(':');
        const hour = parseInt(h);
        const minute = parseInt(m);
        const isAr = language === 'ar';
        const ampm = isAr ? (hour >= 12 ? 'م' : 'ص') : (hour >= 12 ? 'PM' : 'AM');
        const h12 = hour % 12 || 12;
        return `${h12}:${minute.toString().padStart(2, '0')} ${ampm}`;
    } catch {
        return time.substring(0, 5);
    }
}

function formatDate(dateStr: string, language: string): string {
    if (!dateStr) return '';
    try {
        const raw = (dateStr || '').split('T')[0].split(' ')[0];
        const [y, m, day] = raw.split('-').map(Number);
        const d = (y && m && day) ? new Date(y, m - 1, day) : new Date(dateStr);
        const isAr = language === 'ar';
        const now = new Date();
        const isToday = d.getFullYear() === now.getFullYear() &&
                        d.getMonth() === now.getMonth() &&
                        d.getDate() === now.getDate();

        const formatted = d.toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        if (isToday) {
            return isAr ? `اليوم، ${formatted}` : `Today, ${formatted}`;
        }
        return formatted;
    } catch {
        return dateStr;
    }
}

function getDuration(start: string, end: string, language: string): string {
    if (!start || !end) return '';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) return '';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (language === 'ar') {
        if (h === 1 && m === 0) return 'ساعة واحدة';
        if (h === 2 && m === 0) return 'ساعتان';
        if (h > 0 && m > 0) return `${h} س ${m} د`;
        if (h > 0) return `${h} ساعات`;
        return `${m} دقيقة`;
    }
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
    session,
    displayNumber,
    displayTotal,
    isOpen,
    onClose,
    onStartSession,
    onEndSession,
    isTeacher = true,
}) => {
    const { language, direction } = useLanguage();
    const isAr = language === 'ar';

    const [review, setReview] = useState<ReviewData | null>(null);
    const [reviewLoading, setReviewLoading] = useState(false);

    const rawStatus = (session?.status || '').toLowerCase();
    const isEnded = ['ended', 'completed', 'finished', 'cancelled'].includes(rawStatus);

    useEffect(() => {
        if (isOpen && session && isEnded && session.status !== 'cancelled') {
            loadReview();
        } else {
            setReview(null);
        }
    }, [isOpen, session, isEnded]);

    const loadReview = async () => {
        if (!session) return;
        setReviewLoading(true);
        try {
            const res = await studentService.getSessionReview(session.id);
            if (res?.success && res?.data) {
                const d = res.data;
                const reviewerObj = d.reviewer || d.user || d.student || {};
                const nameFromReviewer = reviewerObj.name || (reviewerObj.first_name ? `${reviewerObj.first_name} ${reviewerObj.last_name || ''}`.trim() : '');
                const fallbackStudentName = session.student?.name || '';
                const reviewerName = nameFromReviewer || d.reviewer_name || fallbackStudentName || (isAr ? 'طالب' : 'Student');

                setReview({
                    rating: d.rating || d.student_rating || 0,
                    comment: d.comment || '',
                    created_at: d.created_at,
                    reviewer_name: reviewerName,
                });
            } else {
                setReview(null);
            }
        } catch {
            setReview(null);
        } finally {
            setReviewLoading(false);
        }
    };

    if (!isOpen || !session) return null;

    const actionState = getSessionState(session, 15);
    const isLive = rawStatus === 'live' || rawStatus === 'wait_for_teacher' || actionState === 'live';
    const isUpcoming = !isEnded && !isLive;

    const subjectName = session.subject
        ? (isAr ? session.subject.name_ar || session.subject.name_en : session.subject.name_en || session.subject.name_ar)
        : (session.booking?.reference || (isAr ? 'جلسة تعليمية' : 'Session'));

    const reference = session.booking?.reference || `BK${session.id ? session.id * 12345 : '00000'}`;

    const currentNum = displayNumber || session.session_number || 1;
    const totalNum = displayTotal || session.booking?.total_sessions || 1;
    const showOrder = totalNum > 1;

    const formattedDate = formatDate(session.session_date, language);
    const startTime = formatTime(session.start_time, language);
    const endTime = formatTime(session.end_time, language);
    const timeRangeText = `${startTime} - ${endTime}`;
    const durationText = getDuration(session.start_time, session.end_time, language) ||
        (session.duration ? `${session.duration} ${isAr ? 'دقيقة' : 'min'}` : (isAr ? 'ساعة واحدة' : '1 hour'));

    const statusText = isEnded ? (isAr ? 'منتهية' : 'Finished') : (isAr ? 'نشطة' : 'Active');
    const completed = session.booking?.completed_sessions ?? (isEnded ? 1 : 0);
    const total = session.booking?.total_sessions ?? 1;
    const completionRatio = `${completed}/${total}`;

    const isGroup = (session.booking?.type || '').toLowerCase() === 'group';
    const bookingTypeText = isGroup ? (isAr ? 'جماعي' : 'Group') : (isAr ? 'فردي' : 'Single');

    const studentName = session.student?.name || (isAr ? 'طالب' : 'Student');
    const studentEmail = session.student?.email || '';
    const studentInitial = (studentName.charAt(0) || 'ط').toUpperCase();
    const studentImage = session.student?.profile_image;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" dir={direction}>
            <div className="relative bg-[#EFF6F4] rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
                <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <h3 className="text-base font-bold text-[#0D4A5F]">
                        {isAr ? 'تفاصيل الجلسة' : 'Session Details'}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-slate-100 transition-colors text-[#738989]"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2">
                        <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-xl bg-[#E8F1F3] text-[#0D4A5F] flex items-center justify-center shrink-0">
                                <BookOpen size={20} />
                            </div>
                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-[#A6D388] text-[#144D25]">
                                {isAr ? `الرقم المرجعي: ${reference}` : `Ref: ${reference}`}
                            </span>
                        </div>

                        <h2 className="text-lg font-bold text-[#171717] pt-1 leading-snug">
                            {subjectName}
                        </h2>

                        {showOrder && (
                            <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#E8F0FE] text-[#0D4A5F]">
                                    <span>{isAr ? `الجلسة ${currentNum} من ${totalNum}` : `Session ${currentNum} of ${totalNum}`}</span>
                                    <ListOrdered size={14} />
                                </span>
                            </div>
                        )}
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-[#738989] mb-2 px-1">
                            {isAr ? 'تفاصيل الجلسة' : 'Session Details'}
                        </p>
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-xs text-[#738989] mb-1">
                                    <Calendar size={14} />
                                    <span>{isAr ? 'التاريخ' : 'Date'}</span>
                                </div>
                                <span className="text-sm font-bold text-[#171717] truncate">{formattedDate}</span>
                            </div>

                            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-xs text-[#738989] mb-1">
                                    <Clock size={14} />
                                    <span>{isAr ? 'الوقت' : 'Time'}</span>
                                </div>
                                <span className="text-sm font-bold text-[#171717] truncate" dir="ltr">{timeRangeText}</span>
                            </div>

                            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-xs text-[#738989] mb-1">
                                    <Timer size={14} />
                                    <span>{isAr ? 'المدة' : 'Duration'}</span>
                                </div>
                                <span className="text-sm font-bold text-[#171717] truncate">{durationText}</span>
                            </div>

                            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-xs text-[#738989] mb-1">
                                    <Info size={14} />
                                    <span>{isAr ? 'الحالة' : 'Status'}</span>
                                </div>
                                <div>
                                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold ${
                                        isEnded
                                            ? 'bg-[#EFF3F4] text-[#738989]'
                                            : 'bg-[#EAF5E9] text-[#3D8B37]'
                                    }`}>
                                        {statusText}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-xs text-[#738989] mb-1">
                                    <Percent size={14} />
                                    <span>{isAr ? 'المكتملة' : 'Completed'}</span>
                                </div>
                                <span className="text-sm font-bold text-[#171717] truncate" dir="ltr">{completionRatio}</span>
                            </div>

                            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-xs text-[#738989] mb-1">
                                    <BookOpen size={14} />
                                    <span>{isAr ? 'نوع الحجز' : 'Booking Type'}</span>
                                </div>
                                <span className="text-sm font-bold text-[#171717] truncate">{bookingTypeText}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-semibold text-[#738989] mb-2 px-1">
                            {isTeacher ? (isAr ? 'الطلاب' : 'Students') : (isAr ? 'المعلم' : 'Teacher')}
                        </p>
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full border border-slate-200 overflow-hidden bg-[#E8F1F3] text-[#0D4A5F] shrink-0 flex items-center justify-center font-bold text-base">
                                {studentImage ? (
                                    <img src={studentImage} alt={studentName} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{studentInitial}</span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-[#0D4A5F] truncate">
                                    {studentName}
                                </h4>
                                {studentEmail && (
                                    <p className="text-xs text-[#738989] mt-0.5 truncate">
                                        {studentEmail}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {isEnded && session.status !== 'cancelled' && (
                        <div>
                            <p className="text-xs font-semibold text-[#738989] mb-2 px-1">
                                {isAr ? 'التقييم' : 'Review'}
                            </p>
                            {reviewLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 size={20} className="animate-spin text-[#3D8B37]" />
                                </div>
                            ) : review ? (
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-[#0D4A5F]">
                                            {isAr ? 'التقييم' : 'Evaluation'}
                                        </h4>
                                        {review.created_at && (
                                            <span className="text-xs text-[#738989]">
                                                {formatDate(review.created_at, language)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="flex items-center">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <Star
                                                    key={i}
                                                    size={18}
                                                    className={i <= review.rating
                                                        ? 'text-[#FFB800] fill-[#FFB800]'
                                                        : 'text-slate-200'
                                                    }
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm font-bold text-[#0D4A5F]">
                                            {review.rating}/5
                                        </span>
                                    </div>
                                    {review.comment && (
                                        <div className="text-xs text-[#0D4A5F] bg-[#F4F6F8] rounded-xl p-3 leading-relaxed">
                                            {review.comment}
                                        </div>
                                    )}
                                    <p className="text-xs text-[#738989] pt-1">
                                        {isAr ? `بواسطة: ${review.reviewer_name || session.student?.name || 'طالب'}` : `By: ${review.reviewer_name || session.student?.name || 'Student'}`}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                                    <div className="flex items-center gap-2 text-[#738989] text-xs">
                                        <Star size={15} />
                                        <span>{isAr ? 'لا يوجد تقييم لهذه الجلسة بعد' : 'No review for this session yet'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white p-4 border-t border-slate-100 shrink-0 space-y-2">
                    {isEnded ? (
                        <div>
                            <button
                                disabled
                                className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-slate-100 text-[#738989] cursor-not-allowed"
                            >
                                <CheckCircle2 size={18} />
                                <span>{isAr ? 'انتهت الجلسة' : 'Session Ended'}</span>
                            </button>
                            <p className="text-xs text-center text-[#738989] mt-2">
                                {isAr ? 'تم اكتمال هذه الجلسة وإنهاؤها.' : 'This session has been completed and ended.'}
                            </p>
                        </div>
                    ) : isLive ? (
                        <div>
                            <button
                                onClick={() => onStartSession?.(session.id)}
                                className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-[#3D8B37] text-white hover:bg-[#34782F] shadow-md active:scale-[0.99] transition-all"
                            >
                                <Video size={18} />
                                <span>{isAr ? 'بدء الجلسة الآن' : 'Start Session Now'}</span>
                            </button>
                            {onEndSession && (
                                <button
                                    onClick={() => onEndSession(session.id)}
                                    className="mt-2 w-full h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border-2 border-red-500 text-red-600 hover:bg-red-50 active:scale-[0.99] transition-all"
                                >
                                    <span className="text-base leading-none">■</span>
                                    <span>{isAr ? 'إنهاء الجلسة' : 'End Session'}</span>
                                </button>
                            )}
                            <p className="text-xs text-center text-[#738989] mt-2">
                                {isAr ? 'انقر لبدء وبث الجلسة وفتح الغرفة الافتراضية' : 'Click to start session and open classroom'}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <button
                                disabled
                                className="w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-slate-100 text-[#738989] cursor-not-allowed"
                            >
                                <Clock size={18} />
                                <span>{isAr ? 'الجلسة لم تبدأ بعد' : 'Session Upcoming'}</span>
                            </button>
                            <p className="text-xs text-center text-[#738989] mt-2">
                                {isAr ? 'يمكنك بدء الجلسة قبل موعدها بـ 15 دقيقة.' : 'You can start the session 15 minutes before the scheduled time.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
