import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { studentService, Session } from '../../Services/api';
import {
    X, Calendar, Clock, Star, StarHalf, Video, User, School,
    Info, Timer, Tag, PieChart, Hash, ChevronRight,
    Loader2, AlertCircle, CheckCircle, ShieldAlert, Send,
    MessageSquare, HelpCircle, FileText
} from 'lucide-react';

interface SessionDetailsModalProps {
    session: Session | null;
    isOpen: boolean;
    onClose: () => void;
    onJoinSession: (sessionId: number) => void;
    joining?: boolean;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
    session, isOpen, onClose, onJoinSession, joining
}) => {
    const { t, language, direction } = useLanguage();

    // Review state
    const [review, setReview] = useState<any>(null);
    const [canReview, setCanReview] = useState(false);
    const [reviewLoading, setReviewLoading] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    // Complaint state
    const [complaint, setComplaint] = useState<any>(null);
    const [hasComplaint, setHasComplaint] = useState(false);
    const [complaintLoading, setComplaintLoading] = useState(true);
    const [showComplaintForm, setShowComplaintForm] = useState(false);
    const [complaintReason, setComplaintReason] = useState('');
    const [complaintSubmitting, setComplaintSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && session && (session.status === 'ended' || session.status === 'completed')) {
            loadReview();
            loadComplaint();
        }
    }, [isOpen, session?.id]);

    if (!isOpen || !session) return null;

    const isFinished = session.status === 'ended' || session.status === 'completed';
    const isLive = session.status === 'live';
    const isScheduled = session.status === 'scheduled';
    const status = session.status?.toLowerCase() || '';

    const loadReview = async () => {
        setReviewLoading(true);
        try {
            const res = await studentService.getSessionReview(session.id);
            if (res.success) {
                setReview(res.data || null);
                setCanReview(res.can_review || false);
            } else {
                setReview(null);
                setCanReview(false);
            }
        } catch (e) {
            setReview(null);
            setCanReview(false);
        } finally {
            setReviewLoading(false);
        }
    };

    const loadComplaint = async () => {
        setComplaintLoading(true);
        try {
            const res = await studentService.getSessionComplaint(session.id);
            if (res.success) {
                setComplaint(res.data);
                setHasComplaint(true);
            } else {
                setHasComplaint(false);
                setComplaint(null);
            }
        } catch (e) {
            setHasComplaint(false);
            setComplaint(null);
        } finally {
            setComplaintLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!session) return;
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
                alert(res.message || (language === 'ar' ? 'فشل إضافة التقييم' : 'Failed to add review'));
            }
        } catch (e: any) {
            alert(e.message || (language === 'ar' ? 'فشل إضافة التقييم' : 'Failed to add review'));
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleSubmitComplaint = async () => {
        if (!session) return;
        if (!complaintReason.trim()) {
            alert(language === 'ar' ? 'يرجى كتابة سبب الشكوى' : 'Please enter a reason for the complaint');
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
                alert(res.message || (language === 'ar' ? 'فشل إرسال الشكوى' : 'Failed to submit complaint'));
            }
        } catch (e: any) {
            alert(e.message || (language === 'ar' ? 'فشل إرسال الشكوى' : 'Failed to submit complaint'));
        } finally {
            setComplaintSubmitting(false);
        }
    };

    const getDuration = (start: string, end: string) => {
        if (!start || !end) return `${session.duration || 0} min`;
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ''}`;
        return `${m}m`;
    };

    const formatTime = (time: string) => {
        if (!time) return '';
        return time.substring(0, 5);
    };

    const formatDate = (date: string) => {
        if (!date) return '';
        const d = new Date(date.split('T')[0] || date);
        return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    };

    const getStatusColor = () => {
        switch (status) {
            case 'live': return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: Video };
            case 'ended':
            case 'completed': return { text: 'text-[var(--text-muted)]', bg: 'bg-[var(--light-bg)]', border: 'border-[var(--border)]', icon: CheckCircle };
            case 'cancelled': return { text: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', icon: X };
            case 'wait_for_teacher': return { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: Clock };
            default: return { text: 'text-secondary', bg: 'bg-secondary-pale', border: 'border-secondary/30', icon: Calendar };
        }
    };

    const statusColors = getStatusColor();
    const StatusIcon = statusColors.icon;
    const statusLabel = status === 'live' ? (language === 'ar' ? 'مباشر' : 'Live')
        : status === 'ended' || status === 'completed' ? (language === 'ar' ? 'منتهية' : 'Ended')
        : status === 'cancelled' ? (language === 'ar' ? 'ملغية' : 'Cancelled')
        : status === 'wait_for_teacher' ? (language === 'ar' ? 'انتظار' : 'Waiting')
        : status === 'scheduled' ? (language === 'ar' ? 'مجدولة' : 'Scheduled')
        : status;

    const subjectName = session.subject
        ? (language === 'ar' ? session.subject.name_ar : session.subject.name_en)
        : session.session_title || (language === 'ar' ? 'جلسة' : 'Session');

    const infoCards = [
        { icon: Info, title: language === 'ar' ? 'الحالة' : 'Status', value: statusLabel, color: 'text-secondary' },
        { icon: Timer, title: language === 'ar' ? 'المدة' : 'Duration', value: getDuration(session.start_time, session.end_time), color: 'text-primary' },
        { icon: Tag, title: language === 'ar' ? 'نوع الحجز' : 'Booking Type', value: session.booking?.type || (language === 'ar' ? 'غير محدد' : 'Unspecified'), color: 'text-orange-500' },
        {
            icon: PieChart, title: language === 'ar' ? 'المكتمل' : 'Completed',
            value: '',
            color: 'text-purple-500',
            customValue: (
                <span className="text-sm font-bold text-[var(--text-main)]" dir="ltr">
                    {session.booking?.completed_sessions || 0} / {session.booking?.total_sessions || 0}
                </span>
            ),
        },
        { icon: Hash, title: language === 'ar' ? 'رقم المرجع' : 'Reference', value: `#${session.booking?.reference || '-'}`, color: 'text-teal-500' },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-[var(--radius-lg)] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="bg-white px-6 pt-6 pb-4 border-b border-[var(--border)]">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--light-bg)] transition-colors">
                            <X size={20} className="text-[var(--text-muted)]" />
                        </button>
                        <h3 className="text-lg font-bold text-[var(--text-main)]">
                            {language === 'ar' ? 'تفاصيل الجلسة' : 'Session Details'}
                        </h3>
                        <div className="w-9" />
                    </div>

                    {/* Title + Subject + Status */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-primary leading-tight truncate">{subjectName}</h2>
                            <p className="text-sm text-[var(--text-muted)] font-medium mt-1">
                                {session.session_title || subjectName}
                            </p>
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}>
                            <StatusIcon size={14} />
                            {statusLabel}
                        </span>
                    </div>

                    {/* Date & Time Badges */}
                    <div className="flex gap-3 mt-4">
                        <span className="inline-flex items-center gap-2 px-3.5 py-2 bg-[var(--light-bg)] rounded-[var(--radius-md)] border border-[var(--border)] text-xs font-semibold text-navy">
                            <Calendar size={15} className="text-primary" />
                            {formatDate(session.session_date)}
                        </span>
                        <span className="inline-flex items-center gap-2 px-3.5 py-2 bg-[var(--light-bg)] rounded-[var(--radius-md)] border border-[var(--border)] text-xs font-semibold text-navy">
                            <Clock size={15} className="text-orange-500" />
                            {formatTime(session.start_time)} - {formatTime(session.end_time)}
                        </span>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Info Section */}
                    <div>
                        <h4 className="text-sm font-bold text-navy mb-3">
                            {language === 'ar' ? 'معلومات الجلسة' : 'Session Info'}
                        </h4>
                        <div className="space-y-3">
                            {infoCards.map((card, i) => (
                                <div key={i} className="flex items-center gap-3 p-3.5 bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)]">
                                    <div className={`p-2.5 rounded-[var(--radius-md)] bg-[var(--light-bg)] border border-[var(--border)] ${card.color}`}>
                                        <card.icon size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">{card.title}</p>
                                        {card.customValue || (
                                            <p className="text-sm font-bold text-[var(--text-main)] truncate">{card.value}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* User Section */}
                    <div>
                        <h4 className="text-sm font-bold text-navy mb-3">
                            {language === 'ar' ? 'معلومات المعلم' : 'Teacher Info'}
                        </h4>
                        <div className="flex items-center gap-3 p-4 bg-[var(--light-bg)] rounded-[var(--radius-md)] border border-[var(--border)]">
                            <div className="h-11 w-11 rounded-[var(--radius-md)] bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <User size={22} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[var(--text-main)] truncate">
                                    {session.teacher?.name || (language === 'ar' ? 'غير معروف' : 'Unknown')}
                                </p>
                                {session.teacher?.email && (
                                    <p className="text-xs text-[var(--text-muted)] truncate">{session.teacher.email}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Review Section - Only for finished sessions */}
                    {isFinished && (
                        <div>
                            {reviewLoading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 size={20} className="animate-spin text-primary" />
                                </div>
                            ) : review ? (
                                /* Existing Review */
                                <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-4 bg-white shadow-[var(--shadow-sm)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[11px] text-[var(--text-muted)]">
                                            {review.created_at ? formatDate(review.created_at) : ''}
                                        </span>
                                        <h4 className="text-sm font-bold text-[var(--text-main)]">
                                            {language === 'ar' ? 'التقييم' : 'Rating'}
                                        </h4>
                                    </div>
                                    <div className="flex items-center gap-1 mb-2">
                                        <span className="text-lg font-bold text-[var(--text-main)]">{review.rating}/5</span>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <Star
                                                    key={i}
                                                    size={18}
                                                    className={i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    {review.comment && (
                                        <div className="mt-2 p-3 bg-[var(--light-bg)] rounded-lg">
                                            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{review.comment}</p>
                                        </div>
                                    )}
                                    <p className="text-[11px] text-[var(--text-muted)] mt-2">
                                        {language === 'ar' ? 'بواسطة' : 'By'} {review.reviewer?.name || (language === 'ar' ? 'مقيم' : 'Reviewer')}
                                    </p>
                                </div>
                            ) : canReview && !showReviewForm ? (
                                /* Add Review Button */
                                <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-5 bg-white shadow-[var(--shadow-sm)] text-center">
                                    <Star size={40} className="mx-auto text-amber-300 mb-3" />
                                    <h4 className="text-base font-bold text-[var(--text-main)] mb-1">
                                        {language === 'ar' ? 'قيم تجربتك' : 'Rate your experience'}
                                    </h4>
                                    <p className="text-sm text-[var(--text-muted)] mb-4">
                                        {language === 'ar' ? 'ساعد الآخرين في اختيار المعلم المناسب' : 'Help others choose the right teacher'}
                                    </p>
                                    <button
                                        onClick={() => setShowReviewForm(true)}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-[var(--radius-md)] font-bold text-sm hover:bg-primary-dark transition-colors shadow-[var(--shadow-sm)]"
                                    >
                                        <Star size={16} />
                                        {language === 'ar' ? 'إضافة تقييم' : 'Add Review'}
                                    </button>
                                </div>
                            ) : showReviewForm ? (
                                /* Review Form */
                                <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-5 bg-white shadow-[var(--shadow-sm)]">
                                    <h4 className="text-base font-bold text-[var(--text-main)] mb-4 text-center">
                                        {language === 'ar' ? 'تقييم المعلم' : 'Evaluate Teacher'}
                                    </h4>
                                    <p className="text-sm font-semibold text-[var(--text-muted)] mb-3 text-center">{session.teacher?.name}</p>

                                    <div className="flex justify-center gap-1 mb-4">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <button key={i} onClick={() => setReviewRating(i)} className="transition-transform hover:scale-110">
                                                <Star
                                                    size={36}
                                                    className={i <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 hover:text-amber-300'}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        placeholder={language === 'ar' ? 'تعليق (اختياري)...' : 'Comment (optional)...'}
                                        rows={3}
                                        className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--border)] text-sm focus:outline-none focus:border-primary resize-none"
                                        dir={direction}
                                    />

                                    <div className="flex gap-3 mt-4">
                                        <button
                                            onClick={() => { setShowReviewForm(false); setReviewComment(''); setReviewRating(5); }}
                                            className="flex-1 py-2.5 rounded-[var(--radius-md)] font-semibold text-sm text-[var(--text-muted)] bg-[var(--light-bg)] hover:bg-[var(--border)] transition-colors"
                                        >
                                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                        </button>
                                        <button
                                            onClick={handleSubmitReview}
                                            disabled={reviewSubmitting}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-[var(--radius-md)] font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-[var(--shadow-sm)]"
                                        >
                                            {reviewSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                            {language === 'ar' ? 'إرسال' : 'Send'}
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            {/* Complaint Section - Student only for finished sessions */}
                            {complaintLoading ? (
                                <div className="flex justify-center py-3 mt-2">
                                    <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
                                </div>
                            ) : hasComplaint && complaint ? (
                                /* Existing Complaint */
                                <div className={`rounded-[var(--radius-md)] border p-4 mt-3 bg-white shadow-[var(--shadow-sm)] ${complaint.status === 'resolved' || complaint.status === 'closed' ? 'border-green-200' : 'border-orange-200'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                            complaint.status === 'resolved' || complaint.status === 'closed'
                                                ? 'bg-primary-pale text-primary border-green-200'
                                                : 'bg-orange-50 text-orange-600 border-orange-200'
                                        }`}>
                                            {complaint.status === 'resolved' || complaint.status === 'closed'
                                                ? (language === 'ar' ? 'تم الحل' : 'Resolved')
                                                : (language === 'ar' ? 'قيد المراجعة' : 'Under Review')}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-orange-600">
                                            <ShieldAlert size={16} />
                                            <span className="text-xs font-bold">{language === 'ar' ? 'شكوى مقدمة' : 'Complaint'}</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-[var(--light-bg)] rounded-lg mt-2">
                                        <p className="text-sm text-[var(--text-muted)]">{complaint.reason}</p>
                                    </div>
                                    {complaint.resolution_note && (
                                        <div className="mt-2 p-3 bg-primary-pale rounded-lg border border-green-100">
                                            <p className="text-[10px] font-bold text-primary uppercase mb-1">
                                                {language === 'ar' ? 'رد الإدارة' : 'Admin Reply'}
                                            </p>
                                            <p className="text-sm text-[var(--text-muted)]">{complaint.resolution_note}</p>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-[var(--text-muted)] mt-2">
                                        {complaint.created_at ? formatDate(complaint.created_at) : ''}
                                    </p>
                                </div>
                            ) : !showComplaintForm ? (
                                /* Submit Complaint Button */
                                <button
                                    onClick={() => setShowComplaintForm(true)}
                                    className="w-full flex items-center justify-center gap-2 py-3 mt-3 rounded-[var(--radius-md)] border-2 border-orange-300 border-dashed text-orange-600 font-bold text-sm hover:bg-orange-50 transition-colors"
                                >
                                    <ShieldAlert size={16} />
                                    {language === 'ar' ? 'تقديم شكوى' : 'Submit Complaint'}
                                </button>
                            ) : (
                                /* Complaint Form */
                                <div className="rounded-[var(--radius-md)] border border-orange-200 p-5 mt-3 bg-white shadow-[var(--shadow-sm)]">
                                    <h4 className="text-base font-bold text-[var(--text-main)] mb-1">
                                        {language === 'ar' ? 'تقديم شكوى' : 'Submit Complaint'}
                                    </h4>
                                    <p className="text-xs text-[var(--text-muted)] mb-4">
                                        {language === 'ar'
                                            ? `شكوى بخصوص الجلسة مع ${session.teacher?.name}`
                                            : `Complaint regarding session with ${session.teacher?.name}`}
                                    </p>
                                    <textarea
                                        value={complaintReason}
                                        onChange={(e) => setComplaintReason(e.target.value)}
                                        placeholder={language === 'ar' ? 'اشرح سبب الشكوى...' : 'Explain the reason for your complaint...'}
                                        rows={4}
                                        className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--border)] text-sm focus:outline-none focus:border-orange-400 resize-none"
                                        dir={direction}
                                    />
                                    <div className="flex gap-3 mt-4">
                                        <button
                                            onClick={() => { setShowComplaintForm(false); setComplaintReason(''); }}
                                            className="flex-1 py-2.5 rounded-[var(--radius-md)] font-semibold text-sm text-[var(--text-muted)] bg-[var(--light-bg)] hover:bg-[var(--border)] transition-colors"
                                        >
                                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                        </button>
                                        <button
                                            onClick={handleSubmitComplaint}
                                            disabled={complaintSubmitting || !complaintReason.trim()}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-navy-mid text-white rounded-[var(--radius-md)] font-bold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-[var(--shadow-sm)]"
                                        >
                                            {complaintSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                            {language === 'ar' ? 'إرسال' : 'Submit'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="h-4" />
                </div>

                {/* Bottom Action Bar */}
                <div className="px-6 py-4 border-t border-[var(--border)] bg-white">
                    {isLive ? (
                        <button
                            onClick={() => onJoinSession(session.id)}
                            disabled={joining}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-[var(--radius-md)] font-bold text-sm hover:bg-primary-dark transition-colors shadow-[var(--shadow-lg)] disabled:opacity-50"
                        >
                            {joining ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Video size={18} />
                            )}
                            {language === 'ar' ? 'انضمام للجلسة' : 'Join Session'}
                        </button>
                    ) : isScheduled ? (
                        <div className="flex items-center justify-center gap-2 py-3 bg-secondary-pale text-secondary rounded-[var(--radius-md)] font-bold text-sm border border-secondary/30">
                            <Clock size={16} />
                            {language === 'ar' ? 'جلسة قادمة' : 'Upcoming Session'}
                        </div>
                    ) : isFinished ? (
                        <div className="flex items-center justify-center gap-2 py-3 bg-[var(--light-bg)] text-[var(--text-muted)] rounded-[var(--radius-md)] font-bold text-sm">
                            <CheckCircle size={16} />
                            {language === 'ar' ? 'جلسة منتهية' : 'Session Ended'}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2 py-3 bg-[var(--light-bg)] text-[var(--text-muted)] rounded-[var(--radius-md)] font-bold text-sm">
                            <AlertCircle size={16} />
                            {session.status}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
