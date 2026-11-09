import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { studentService, Session } from '../../Services/api';
import { getSessionState } from '../../Utils/sessionStatus';
import {
    X, Calendar, Clock, Star, Video, BookOpen,
    Info, Timer, Percent,
    Loader2, ShieldAlert, Send
} from 'lucide-react';

interface SessionDetailsModalProps {
    session: Session | null;
    displayNumber?: number;
    displayTotal?: number;
    isOpen: boolean;
    onClose: () => void;
    onJoinSession: (sessionId: number) => void;
    joining?: boolean;
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
    session, displayNumber, displayTotal, isOpen, onClose, onJoinSession, joining
}) => {
    const { language, direction } = useLanguage();
    const isAr = language === 'ar';

    const [review, setReview] = useState<any>(null);
    const [canReview, setCanReview] = useState(false);
    const [reviewLoading, setReviewLoading] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const [complaint, setComplaint] = useState<any>(null);
    const [hasComplaint, setHasComplaint] = useState(false);
    const [complaintLoading, setComplaintLoading] = useState(true);
    const [showComplaintForm, setShowComplaintForm] = useState(false);
    const [complaintReason, setComplaintReason] = useState('');
    const [complaintSubmitting, setComplaintSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && session) {
            const rawStatus = (session.status || '').toLowerCase();
            const ended = rawStatus === 'ended' || rawStatus === 'completed' || rawStatus === 'finished' || rawStatus === 'cancelled';
            if (ended) {
                loadReview();
                loadComplaint();
            }
        }
    }, [isOpen, session?.id]);

    if (!isOpen || !session) return null;

    const rawStatus = (session.status || '').toLowerCase();
    const isEnded = rawStatus === 'ended' || rawStatus === 'completed' || rawStatus === 'finished' || rawStatus === 'cancelled';
    const isLive = rawStatus === 'live' || rawStatus === 'wait_for_teacher' || getSessionState(session, 15) === 'live';

    const subjectName = session.subject
        ? (isAr ? session.subject.name_ar || session.subject.name_en : session.subject.name_en || session.subject.name_ar)
        : (session.booking?.reference || (isAr ? 'جلسة تعليمية' : 'Session'));

    const teacherName = session.teacher?.name || (isAr ? 'غير محدد' : 'Unknown');
    const displayTeacherName = teacherName.startsWith('أ.') ? teacherName : `أ. ${teacherName}`;

    const reference = session.booking?.reference || `BK${session.id}`;
    const currentNum = displayNumber || session.session_number || 1;
    const totalNum = displayTotal || session.booking?.total_sessions || 1;
    const showOrder = totalNum > 1;

    const dateText = formatDate(session.session_date, language);
    const startTimeText = formatTime(session.start_time, language);
    const endTimeText = formatTime(session.end_time, language);
    const timeRangeText = `${startTimeText} - ${endTimeText}`;
    const durationText = getDuration(session.start_time, session.end_time, language) || `${session.duration || 60} ${isAr ? 'دقيقة' : 'min'}`;

    const statusText = isEnded ? (isAr ? 'منتهية' : 'Finished') : (isAr ? 'نشطة' : 'Active');
    const bookingTypeRaw = (session.booking?.type || '').toLowerCase();
    const bookingTypeText = bookingTypeRaw === 'group'
        ? (isAr ? 'جماعي' : 'Group')
        : (isAr ? 'فردي' : 'Single');

    const completed = session.booking?.completed_sessions || (isEnded ? totalNum : 0);
    const completionRatio = `${completed}/${totalNum}`;

    const loadReview = async () => {
        setReviewLoading(true);
        try {
            const res = await studentService.getSessionReview(session.id);
            if (res.success) {
                setReview(res.data || null);
                setCanReview(res.can_review || false);
            } else {
                setReview(null);
                setCanReview(true);
            }
        } catch {
            setReview(null);
            setCanReview(true);
        } finally {
            setReviewLoading(false);
        }
    };

    const loadComplaint = async () => {
        setComplaintLoading(true);
        try {
            const res = await studentService.getSessionComplaint(session.id);
            if (res.success && res.data) {
                setComplaint(res.data);
                setHasComplaint(true);
            } else {
                setComplaint(null);
                setHasComplaint(false);
            }
        } catch {
            setComplaint(null);
            setHasComplaint(false);
        } finally {
            setComplaintLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!session.teacher?.id) return;
        setReviewSubmitting(true);
        try {
            const res = await studentService.addTeacherReview(session.teacher.id, {
                rating: reviewRating,
                comment: reviewComment.trim() || undefined,
                session_id: session.id,
            });
            if (res.success) {
                setReview(res.data);
                setCanReview(false);
                setShowReviewForm(false);
            } else {
                alert(res.message || (isAr ? 'فشل إضافة التقييم' : 'Failed to add review'));
            }
        } catch (e: any) {
            alert(e.message || (isAr ? 'فشل إضافة التقييم' : 'Failed to add review'));
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleSubmitComplaint = async () => {
        if (!session.teacher?.id) return;
        if (!complaintReason.trim()) {
            alert(isAr ? 'يرجى كتابة سبب الشكوى' : 'Please enter complaint reason');
            return;
        }
        setComplaintSubmitting(true);
        try {
            const res = await studentService.submitComplaint({
                session_id: session.id,
                teacher_id: session.teacher.id,
                reason: complaintReason.trim(),
            });
            if (res.success) {
                setComplaint(res.data);
                setHasComplaint(true);
                setShowComplaintForm(false);
            } else {
                alert(res.message || (isAr ? 'فشل إرسال الشكوى' : 'Failed to submit complaint'));
            }
        } catch (e: any) {
            alert(e.message || (isAr ? 'فشل إرسال الشكوى' : 'Failed to submit complaint'));
        } finally {
            setComplaintSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div
                dir={direction}
                className="relative bg-[#EFF6F4] rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-slide-up"
            >
                <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between">
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
                                {isAr ? `رقم المرجع: ${reference}` : `Ref: ${reference}`}
                            </span>
                        </div>

                        <h2 className="text-lg font-bold text-[#171717] pt-1 leading-snug">
                            {subjectName}
                        </h2>

                        {showOrder && (
                            <div>
                                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-[#E8F0FE] text-[#0D4A5F]">
                                    {isAr ? `الجلسة ${currentNum} من ${totalNum}` : `Session ${currentNum} of ${totalNum}`}
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
                                <span className="text-sm font-bold text-[#171717] truncate">{dateText}</span>
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
                                            ? 'bg-[#F0F4F5] text-[#738989]'
                                            : 'bg-[#EAF5E9] text-[#3D8B37]'
                                    }`}>
                                        {statusText}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex flex-col justify-center">
                                <div className="flex items-center gap-1.5 text-xs text-[#738989] mb-1">
                                    <Percent size={14} />
                                    <span>{isAr ? 'المكتمل' : 'Completed'}</span>
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
                            {isAr ? 'المعلم' : 'Teacher'}
                        </p>
                        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full border border-slate-200 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
                                <span className="text-sm font-bold text-[#0D4A5F]">
                                    {(teacherName.charAt(0) || 'أ').toUpperCase()}
                                </span>
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-bold text-[#0D4A5F] truncate">
                                    {displayTeacherName}
                                </h4>
                                <div className="flex items-center gap-1.5 text-xs text-[#738989] mt-0.5">
                                    <BookOpen size={13} className="shrink-0" />
                                    <span className="truncate">{subjectName}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isEnded && (
                        <div className="space-y-3 pt-1">
                            {reviewLoading ? (
                                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-center">
                                    <Loader2 size={20} className="animate-spin text-[#0D4A5F]" />
                                </div>
                            ) : review ? (
                                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-[#171717]">
                                            {isAr ? 'تقييم الجلسة' : 'Session Review'}
                                        </h4>
                                        <span className="text-xs text-[#738989]">
                                            {review.created_at ? formatDate(review.created_at, language) : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <Star
                                                key={i}
                                                size={16}
                                                className={i <= (review.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                                            />
                                        ))}
                                        <span className="text-xs font-bold text-[#171717] mr-1">
                                            {review.rating}/5
                                        </span>
                                    </div>
                                    {review.comment && (
                                        <p className="text-xs text-[#738989] bg-slate-50 p-2.5 rounded-xl">
                                            {review.comment}
                                        </p>
                                    )}
                                </div>
                            ) : canReview && !showReviewForm ? (
                                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center space-y-2">
                                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                                        <Star size={20} className="fill-amber-400" />
                                    </div>
                                    <h4 className="text-sm font-bold text-[#171717]">
                                        {isAr ? 'تقييم الجلسة والمعلم' : 'Rate Session & Teacher'}
                                    </h4>
                                    <p className="text-xs text-[#738989]">
                                        {isAr ? 'شاركنا رأيك حول أداء المعلم وجودة الشرح' : 'Share your feedback on teacher performance'}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setShowReviewForm(true)}
                                        className="w-full py-2.5 bg-[#3D8B37] text-white rounded-xl text-xs font-bold hover:bg-[#32732d] transition-colors"
                                    >
                                        {isAr ? 'إضافة تقييم' : 'Add Review'}
                                    </button>
                                </div>
                            ) : showReviewForm ? (
                                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
                                    <h4 className="text-sm font-bold text-[#171717] text-center">
                                        {isAr ? 'تقييم المعلم' : 'Rate Teacher'}
                                    </h4>
                                    <div className="flex justify-center gap-1.5">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setReviewRating(i)}
                                                className="transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    size={28}
                                                    className={i <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        placeholder={isAr ? 'أضف تعليقك حول الجلسة (اختياري)...' : 'Add your comment (optional)...'}
                                        rows={3}
                                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#3D8B37] resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowReviewForm(false)}
                                            className="flex-1 py-2 text-xs font-bold text-[#738989] bg-slate-100 rounded-xl"
                                        >
                                            {isAr ? 'إلغاء' : 'Cancel'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSubmitReview}
                                            disabled={reviewSubmitting}
                                            className="flex-1 py-2 text-xs font-bold text-white bg-[#3D8B37] rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
                                        >
                                            {reviewSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                            <span>{isAr ? 'إرسال' : 'Submit'}</span>
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {complaintLoading ? (
                                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-center">
                                    <Loader2 size={20} className="animate-spin text-[#738989]" />
                                </div>
                            ) : hasComplaint && complaint ? (
                                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-amber-600">
                                            <ShieldAlert size={16} />
                                            <h4 className="text-xs font-bold">
                                                {isAr ? 'شكوى مقدمة' : 'Complaint Submitted'}
                                            </h4>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                            complaint.status === 'resolved' || complaint.status === 'closed'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {complaint.status === 'resolved' || complaint.status === 'closed'
                                                ? (isAr ? 'تم الحل' : 'Resolved')
                                                : (isAr ? 'قيد المراجعة' : 'Under Review')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#738989] bg-slate-50 p-2.5 rounded-xl">
                                        {complaint.reason}
                                    </p>
                                    {complaint.resolution_note && (
                                        <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl space-y-1">
                                            <span className="text-[10px] font-bold text-emerald-800">
                                                {isAr ? 'رد الإدارة' : 'Admin Reply'}
                                            </span>
                                            <p className="text-xs text-emerald-900">
                                                {complaint.resolution_note}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : !showComplaintForm ? (
                                <button
                                    type="button"
                                    onClick={() => setShowComplaintForm(true)}
                                    className="w-full py-2.5 bg-white rounded-2xl border border-dashed border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                    <ShieldAlert size={15} />
                                    <span>{isAr ? 'تقديم شكوى على الجلسة' : 'Submit Complaint'}</span>
                                </button>
                            ) : (
                                <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-100 space-y-3">
                                    <h4 className="text-sm font-bold text-[#171717]">
                                        {isAr ? 'تقديم شكوى' : 'Submit Complaint'}
                                    </h4>
                                    <textarea
                                        value={complaintReason}
                                        onChange={(e) => setComplaintReason(e.target.value)}
                                        placeholder={isAr ? 'اكتب تفاصيل وسبب الشكوى...' : 'Enter complaint details...'}
                                        rows={3}
                                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-red-400 resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowComplaintForm(false)}
                                            className="flex-1 py-2 text-xs font-bold text-[#738989] bg-slate-100 rounded-xl"
                                        >
                                            {isAr ? 'إلغاء' : 'Cancel'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSubmitComplaint}
                                            disabled={complaintSubmitting || !complaintReason.trim()}
                                            className="flex-1 py-2 text-xs font-bold text-white bg-red-600 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
                                        >
                                            {complaintSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                            <span>{isAr ? 'إرسال الشكوى' : 'Send'}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {isLive && (
                    <div className="p-4 bg-white border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => onJoinSession(session.id)}
                            disabled={joining}
                            className="w-full py-3.5 bg-[#3D8B37] text-white rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                        >
                            {joining ? <Loader2 size={18} className="animate-spin" /> : <Video size={18} />}
                            <span>{isAr ? 'انضمام للجلسة' : 'Join Session'}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
