import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { studentService, teacherService, Session } from '../../Services/api';
import { getSessionState } from '../../Utils/sessionStatus';
import {
    X, Calendar, Clock, Star, Video,
    Info, Timer, Percent, BookOpen, ListOrdered,
    Loader2, AlertCircle, Send, CheckCircle2
} from 'lucide-react';

interface SessionDetailsModalProps {
    session: Session | null;
    isOpen: boolean;
    onClose: () => void;
    onJoinSession?: (sessionId: number) => void;
    joining?: boolean;
    displayNumber?: number;
    displayTotal?: number;
    isTeacher?: boolean;
    onStartSession?: (sessionId: number) => void;
    onEndSession?: (sessionId: number) => void;
}

function formatTime(time: string, language: string): string {
    if (!time) return '';
    try {
        const [h, m] = time.split(':');
        const hour = parseInt(h, 10);
        const minute = parseInt(m, 10);
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
        const d = new Date(dateStr.split('T')[0] || dateStr);
        return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

function getDuration(start: string, end: string, language: string): string {
    if (!start || !end) return '';
    try {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        let diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff < 0) diff += 24 * 60;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        if (language === 'ar') {
            if (h > 0 && m > 0) return `${h} ساعة و ${m} دقيقة`;
            if (h > 0) return `${h} ساعة`;
            return `${m} دقيقة`;
        }
        if (h === 0) return `${m}m`;
        return `${h}h ${m}m`;
    } catch {
        return '';
    }
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
    session,
    isOpen,
    onClose,
    onJoinSession,
    joining = false,
    displayNumber,
    displayTotal,
    isTeacher = false,
    onStartSession,
    onEndSession,
}) => {
    const { language, direction } = useLanguage();
    const isAr = language === 'ar';

    const [review, setReview] = useState<any>(null);
    const [canReview, setCanReview] = useState(false);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);

    const [complaint, setComplaint] = useState<any>(null);
    const [complaintLoading, setComplaintLoading] = useState(false);
    const [complaintReason, setComplaintReason] = useState('');
    const [complaintSubmitting, setComplaintSubmitting] = useState(false);
    const [complaintSubmitted, setComplaintSubmitted] = useState(false);

    useEffect(() => {
        if (isOpen && session) {
            const rawStatus = (session.status || '').toLowerCase();
            const ended = rawStatus === 'ended' || rawStatus === 'completed' || rawStatus === 'finished' || rawStatus === 'cancelled';
            if (ended) {
                loadReview();
                if (!isTeacher) {
                    loadComplaint();
                }
            }
        } else {
            setReview(null);
            setCanReview(false);
            setComplaint(null);
            setComplaintReason('');
            setReviewComment('');
            setReviewRating(5);
            setReviewSubmitted(false);
            setComplaintSubmitted(false);
        }
    }, [isOpen, session?.id]);

    if (!isOpen || !session) return null;

    const rawStatus = (session.status || '').toLowerCase();
    const isEnded = rawStatus === 'ended' || rawStatus === 'completed' || rawStatus === 'finished' || rawStatus === 'cancelled';
    const actionState = getSessionState(session, 15);
    const isLive = rawStatus === 'live' || rawStatus === 'wait_for_teacher' || actionState === 'live';

    const loadReview = async () => {
        setReviewLoading(true);
        try {
            const res = await studentService.getSessionReview(session.id);
            if (res && res.success) {
                setReview(res.data || null);
                setCanReview(!isTeacher && (res.can_review ?? (!res.data)));
            } else {
                setReview(null);
                setCanReview(!isTeacher);
            }
        } catch {
            setReview(null);
            setCanReview(!isTeacher);
        } finally {
            setReviewLoading(false);
        }
    };

    const loadComplaint = async () => {
        setComplaintLoading(true);
        try {
            const res = await studentService.getSessionComplaint(session.id);
            if (res && (res.success || res.data)) {
                setComplaint(res.data || null);
            } else {
                setComplaint(null);
            }
        } catch {
            setComplaint(null);
        } finally {
            setComplaintLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!session.teacher?.id) return;
        setReviewSubmitting(true);
        try {
            const res = await studentService.addTeacherReview(session.teacher.id, {
                session_id: session.id,
                rating: reviewRating,
                comment: reviewComment.trim() || undefined,
            });
            if (res && (res.success || res.data)) {
                setReviewSubmitted(true);
                setCanReview(false);
                loadReview();
            } else {
                alert(res?.message || (isAr ? 'فشل إرسال التقييم' : 'Failed to submit review'));
            }
        } catch (e: any) {
            alert(e?.message || (isAr ? 'فشل إرسال التقييم' : 'Failed to submit review'));
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleSubmitComplaint = async () => {
        if (!complaintReason.trim() || !session.teacher?.id) return;
        setComplaintSubmitting(true);
        try {
            const res = await studentService.submitComplaint({
                session_id: session.id,
                teacher_id: session.teacher.id,
                reason: complaintReason.trim(),
            });
            if (res && (res.success || res.data)) {
                setComplaintSubmitted(true);
                loadComplaint();
            } else {
                alert(res?.message || (isAr ? 'فشل إرسال الشكوى' : 'Failed to submit complaint'));
            }
        } catch (e: any) {
            alert(e?.message || (isAr ? 'فشل إرسال الشكوى' : 'Failed to submit complaint'));
        } finally {
            setComplaintSubmitting(false);
        }
    };

    const subjectName = isAr
        ? (session.subject?.name_ar || session.subject?.name || (session as any).course?.title_ar || (session as any).course?.name || session.session_title || 'الدرس')
        : (session.subject?.name_en || session.subject?.name || (session as any).course?.title || (session as any).course?.name || session.session_title || 'Lesson');

    const durationText = getDuration(session.start_time, session.end_time, language);
    const dateText = formatDate(session.session_date, language);
    const startTimeText = formatTime(session.start_time, language);
    const endTimeText = formatTime(session.end_time, language);
    const timeRangeText = `${startTimeText} - ${endTimeText}`;

    const currentNumber = displayNumber ?? session.session_number;
    const totalSessions = displayTotal ?? (session.booking as any)?.total_sessions ?? session.booking?.completed_sessions ?? 1;
    const showOrder = currentNumber !== undefined && totalSessions > 1;

    const referenceNumber = session.booking?.reference || `BK${session.booking_id || session.id}`;

    const completedCount = session.booking?.completed_sessions ?? (isEnded ? 1 : 0);
    const totalCount = session.booking?.total_sessions ?? totalSessions;
    const completionRatio = `${completedCount}/${totalCount}`;

    const bookingTypeRaw = (session.booking?.type || '').toLowerCase();
    const bookingTypeText = bookingTypeRaw === 'group'
        ? (isAr ? 'حجز جماعي' : 'Group Booking')
        : bookingTypeRaw === 'package'
        ? (isAr ? 'حجز باقة' : 'Package Booking')
        : (isAr ? 'حجز فردي' : 'Single Booking');

    const rawTeacherName = session.teacher?.name || '';
    const displayTeacherName = rawTeacherName
        ? (rawTeacherName.startsWith('أ.') ? rawTeacherName : `أ. ${rawTeacherName}`)
        : (isAr ? 'غير محدد' : 'Unknown');

    const rawStudentName = session.student?.name || '';
    const displayStudentName = rawStudentName || (isAr ? 'طالب' : 'Student');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={direction}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#F9FBFC] rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-[#E6E6E6]">
                <div className="bg-white px-5 py-4 border-b border-[#E6E6E6]/60 flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#0D4A5F]">
                        {isAr ? 'تفاصيل الجلسة' : 'Session Details'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-[#738989] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#E6E6E6]/60 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/images/v2/lesson.png"
                                    alt=""
                                    className="w-11 h-11 object-contain shrink-0"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                    }}
                                />
                                <div>
                                    <h3 className="text-lg font-bold text-[#171717]">
                                        {subjectName}
                                    </h3>
                                    {showOrder && (
                                        <div className="mt-1.5 inline-flex items-center gap-1.5 bg-[#E8F0FE] text-[#0D4A5F] px-2.5 py-1 rounded-lg text-xs font-bold">
                                            <span>
                                                {isAr
                                                    ? `الحصة ${currentNumber} من ${totalSessions}`
                                                    : `Session ${currentNumber} of ${totalSessions}`}
                                            </span>
                                            <ListOrdered size={14} className="text-[#0D4A5F]" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-[#A6D388] text-[#144D25] px-3 py-1.5 rounded-lg text-xs font-bold shrink-0">
                                {isAr ? `الرقم المرجعي: ${referenceNumber}` : `Ref: ${referenceNumber}`}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-[#738989] mb-2 px-1">
                            {isAr ? 'تفاصيل الجلسة' : 'Session Metrics'}
                        </h4>
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="bg-white rounded-xl p-3 border border-[#E6E6E6]/60 shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-[#738989] text-xs mb-1">
                                    <Calendar size={14} />
                                    <span>{isAr ? 'التاريخ' : 'Date'}</span>
                                </div>
                                <p className="font-bold text-xs sm:text-sm text-[#171717] truncate">
                                    {dateText}
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-3 border border-[#E6E6E6]/60 shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-[#738989] text-xs mb-1">
                                    <Clock size={14} />
                                    <span>{isAr ? 'الوقت' : 'Time'}</span>
                                </div>
                                <p className="font-bold text-xs sm:text-sm text-[#171717] truncate">
                                    {timeRangeText}
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-3 border border-[#E6E6E6]/60 shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-[#738989] text-xs mb-1">
                                    <Timer size={14} />
                                    <span>{isAr ? 'المدة' : 'Duration'}</span>
                                </div>
                                <p className="font-bold text-xs sm:text-sm text-[#171717] truncate">
                                    {durationText || (isAr ? 'ساعة واحدة' : '1 hour')}
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-3 border border-[#E6E6E6]/60 shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-[#738989] text-xs mb-1">
                                    <Info size={14} />
                                    <span>{isAr ? 'الحالة' : 'Status'}</span>
                                </div>
                                <div>
                                    <span
                                        className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold ${
                                            isEnded
                                                ? 'bg-[#EFF3F4] text-[#738989]'
                                                : isLive
                                                ? 'bg-[#EAF5E9] text-[#5B9F48]'
                                                : 'bg-[#EAF5E9] text-[#5B9F48]'
                                        }`}
                                    >
                                        {isEnded
                                            ? (isAr ? 'منتهية' : 'Finished')
                                            : isLive
                                            ? (isAr ? 'مباشر الآن' : 'Live Now')
                                            : (isAr ? 'نشطة' : 'Active')}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-3 border border-[#E6E6E6]/60 shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-[#738989] text-xs mb-1">
                                    <Percent size={14} />
                                    <span>{isAr ? 'الإنجاز' : 'Progress'}</span>
                                </div>
                                <p className="font-bold text-xs sm:text-sm text-[#171717] truncate">
                                    {completionRatio}
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-3 border border-[#E6E6E6]/60 shadow-[0_2px_6px_rgba(0,0,0,0.02)] flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-[#738989] text-xs mb-1">
                                    <BookOpen size={14} />
                                    <span>{isAr ? 'نوع الحجز' : 'Booking Type'}</span>
                                </div>
                                <p className="font-bold text-xs sm:text-sm text-[#171717] truncate">
                                    {bookingTypeText}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-[#738989] mb-2 px-1">
                            {isTeacher ? (isAr ? 'الطالب' : 'Student') : (isAr ? 'المعلم' : 'Teacher')}
                        </h4>
                        {isTeacher ? (
                            <div className="bg-white rounded-2xl p-4 border border-[#E6E6E6]/60 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full overflow-hidden border border-[#E6E6E6] bg-primary/10 flex items-center justify-center text-[#0D4A5F] font-bold text-base shrink-0">
                                    {(displayStudentName || 'S').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm text-[#0D4A5F] truncate">
                                        {displayStudentName}
                                    </p>
                                    {session.student?.email && (
                                        <p className="text-xs text-[#738989] truncate">
                                            {session.student.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl p-4 border border-[#E6E6E6]/60 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full overflow-hidden border border-[#E6E6E6] shrink-0 bg-gray-100 flex items-center justify-center">
                                    <img
                                        src={session.teacher?.profile_image || '/images/v2/male_teacher.png'}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/images/v2/male_teacher.png';
                                        }}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm text-[#0D4A5F] truncate">
                                        {displayTeacherName}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-xs text-[#738989] mt-0.5">
                                        <BookOpen size={13} className="shrink-0" />
                                        <span className="truncate">
                                            {session.subject?.name_ar || session.subject?.name_en || (isAr ? 'المواد الدراسية' : 'School Subjects')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {isEnded && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-2xl p-4 border border-[#E6E6E6]/60 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                                <div className="flex items-center gap-2 mb-3">
                                    <Star size={16} className="text-amber-500 fill-amber-500" />
                                    <h4 className="font-bold text-sm text-[#0D4A5F]">
                                        {isAr ? 'تقييم الجلسة' : 'Session Review'}
                                    </h4>
                                </div>

                                {reviewLoading ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="animate-spin text-[#5B9F48]" size={20} />
                                    </div>
                                ) : review ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star
                                                    key={s}
                                                    size={16}
                                                    className={s <= (review.rating || review.student_rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}
                                                />
                                            ))}
                                            <span className="text-xs font-bold text-slate-700 mr-2">
                                                {review.rating || review.student_rating || 0}/5
                                            </span>
                                        </div>
                                        {review.comment && (
                                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                {review.comment}
                                            </p>
                                        )}
                                    </div>
                                ) : canReview ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-1.5">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setReviewRating(s)}
                                                    className="p-1 hover:scale-110 transition-transform"
                                                >
                                                    <Star
                                                        size={22}
                                                        className={s <= reviewRating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            placeholder={isAr ? 'اكتب ملاحظاتك حول الجلسة...' : 'Write your feedback about this session...'}
                                            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#5B9F48] min-h-[70px]"
                                        />
                                        <button
                                            type="button"
                                            disabled={reviewSubmitting}
                                            onClick={handleSubmitReview}
                                            className="w-full py-2.5 rounded-xl bg-[#5B9F48] text-white text-xs font-bold hover:bg-[#4d863d] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            {reviewSubmitting ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Send size={14} />
                                            )}
                                            <span>{isAr ? 'إرسال التقييم' : 'Submit Review'}</span>
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-xs text-[#738989]">
                                        {isAr ? 'لا يوجد تقييم متاح لهذه الجلسة.' : 'No review available for this session.'}
                                    </p>
                                )}
                            </div>

                            {!isTeacher && (
                                <div className="bg-white rounded-2xl p-4 border border-[#E6E6E6]/60 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                                    <div className="flex items-center gap-2 mb-3">
                                        <AlertCircle size={16} className="text-red-500" />
                                        <h4 className="font-bold text-sm text-[#0D4A5F]">
                                            {isAr ? 'الشكاوى والنزاعات' : 'Complaints & Disputes'}
                                        </h4>
                                    </div>

                                    {complaintLoading ? (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="animate-spin text-red-500" size={20} />
                                        </div>
                                    ) : complaint ? (
                                        <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-xs space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-red-800">
                                                    {isAr ? 'تم تسجيل شكوى' : 'Complaint Submitted'}
                                                </span>
                                                <span className="px-2 py-0.5 rounded bg-white text-red-700 font-semibold text-[10px]">
                                                    {complaint.status || (isAr ? 'قيد المراجعة' : 'Pending')}
                                                </span>
                                            </div>
                                            <p className="text-red-700 mt-1">
                                                {complaint.reason || complaint.complaint_text}
                                            </p>
                                        </div>
                                    ) : complaintSubmitted ? (
                                        <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 p-3 rounded-xl border border-green-100">
                                            <CheckCircle2 size={16} />
                                            <span>{isAr ? 'تم إرسال الشكوى بنجاح وسيتم مراجعتها من قبل الإدارة.' : 'Complaint submitted successfully.'}</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <textarea
                                                value={complaintReason}
                                                onChange={(e) => setComplaintReason(e.target.value)}
                                                placeholder={isAr ? 'في حال واجهتك مشكلة أثناء الجلسة، اذكر السبب هنا بالتفصيل...' : 'If you encountered an issue during the session, describe it here...'}
                                                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-red-400 min-h-[70px]"
                                            />
                                            <button
                                                type="button"
                                                disabled={complaintSubmitting || !complaintReason.trim()}
                                                onClick={handleSubmitComplaint}
                                                className="w-full py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                {complaintSubmitting ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <AlertCircle size={14} />
                                                )}
                                                <span>{isAr ? 'تقديم شكوى' : 'Submit Complaint'}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {isLive && (
                    <div className="bg-white p-4 border-t border-[#E6E6E6]/60 flex items-center gap-3">
                        <button
                            type="button"
                            disabled={joining}
                            onClick={() => {
                                if (isTeacher && onStartSession) {
                                    onStartSession(session.id);
                                } else if (onJoinSession) {
                                    onJoinSession(session.id);
                                }
                            }}
                            className="flex-1 py-3 px-4 rounded-xl bg-[#5B9F48] text-white text-sm font-bold hover:bg-[#4d863d] transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            {joining ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Video size={16} />
                            )}
                            <span>
                                {isTeacher
                                    ? (rawStatus === 'live' || rawStatus === 'wait_for_teacher' ? (isAr ? 'انضمام للجلسة الحية' : 'Join Live Session') : (isAr ? 'بدء الجلسة' : 'Start Session'))
                                    : (isAr ? 'انضمام للجلسة' : 'Join Session')}
                            </span>
                        </button>

                        {isTeacher && onEndSession && (rawStatus === 'live' || rawStatus === 'wait_for_teacher') && (
                            <button
                                type="button"
                                onClick={() => onEndSession(session.id)}
                                className="py-3 px-4 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors shrink-0"
                            >
                                {isAr ? 'إنهاء الجلسة' : 'End Session'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
