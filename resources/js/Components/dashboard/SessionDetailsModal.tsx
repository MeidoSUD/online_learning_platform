import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { studentService, Session } from '../../Services/api';
import { Calendar, CheckCircle, Clock, Video, ArrowLeft, Star, Loader2, MessageSquare } from 'lucide-react';

interface SessionDetailsModalProps {
    session: Session | null;
    isOpen: boolean;
    onClose: () => void;
    onStartSession?: (sessionId: number) => void;
}

interface ReviewData {
    rating: number;
    comment?: string;
    created_at?: string;
}

function formatTime(time: string): string {
    if (!time) return '';
    try {
        const [h, m] = time.split(':');
        const hour = parseInt(h);
        const minute = parseInt(m);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12}:${minute.toString().padStart(2, '0')} ${ampm}`;
    } catch {
        return time;
    }
}

function isSessionLive(session: Session): boolean {
    return session.status === 'live' || session.status === 'wait_for_teacher';
}

function isSessionEnded(session: Session): boolean {
    const status = (session.status || '').toLowerCase();
    return ['ended', 'completed', 'cancelled', 'finished'].includes(status);
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
    session,
    isOpen,
    onClose,
    onStartSession,
}) => {
    const { language, direction } = useLanguage();
    const [visible, setVisible] = useState(false);
    const [review, setReview] = useState<ReviewData | null>(null);
    const [reviewLoading, setReviewLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setVisible(true), 10);
        } else {
            setVisible(false);
            setReview(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && session && isSessionEnded(session) && session.status !== 'cancelled') {
            loadReview();
        }
    }, [isOpen, session]);

    const loadReview = async () => {
        if (!session) return;
        setReviewLoading(true);
        try {
            const res = await studentService.getSessionReview(session.id);
            if (res?.success && res?.data) {
                const d = res.data;
                setReview({
                    rating: d.rating || d.student_rating || 0,
                    comment: d.comment || '',
                    created_at: d.created_at,
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

    const live = isSessionLive(session);
    const ended = isSessionEnded(session);
    const subjectName = language === 'ar'
        ? (session.subject?.name_ar || session.subject?.name_en || '')
        : (session.subject?.name_en || session.subject?.name_ar || '');
    const studentInitial = session.student?.name?.charAt(0)?.toUpperCase() || 'S';

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" dir={direction}>
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            <div
                className={`relative w-full sm:max-w-lg max-h-[92vh] bg-white rounded-t-3xl sm:rounded-[var(--radius-lg)] shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out ${
                    visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
            >
                {/* ===== HEADER ===== */}
                <div className="relative bg-gradient-to-br from-primary to-primary/85 px-5 pt-8 pb-5">
                    <button
                        onClick={onClose}
                        className={`absolute top-3 ${direction === 'rtl' ? 'right-3' : 'left-3'} w-8 h-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center shadow-[var(--shadow-md)] hover:bg-white transition-all active:scale-95`}
                    >
                        <ArrowLeft size={16} className="text-navy" />
                    </button>

                    <div className={`${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur rounded-full px-3 py-1 border border-white/30 mb-3">
                            <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-green-400 animate-pulse' : ended ? 'bg-[var(--border)]' : 'bg-orange-400'}`} />
                            <span className="text-white text-[10px] font-semibold tracking-wide">
                                {live
                                    ? (language === 'ar' ? 'مباشر' : 'Live')
                                    : ended
                                        ? (language === 'ar' ? 'منتهي' : 'Ended')
                                        : (language === 'ar' ? 'قادم' : 'Upcoming')
                                }
                            </span>
                        </div>

                        <h1 className="text-white text-xl sm:text-2xl font-bold leading-tight">
                            {subjectName || (language === 'ar' ? 'جلسة' : 'Session')}
                        </h1>

                        <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="bg-white/15 backdrop-blur border border-white/20 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                                {session.booking?.type || (language === 'ar' ? 'قياسي' : 'Standard')}
                            </span>
                            <span className="bg-white/15 backdrop-blur border border-white/20 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                                {language === 'ar' ? 'جلسة' : 'Session'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ===== BODY ===== */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-[var(--light-bg)]">
                    {/* Info Cards */}
                    <div>
                        <h3 className="text-base font-bold text-[var(--text-main)] mb-4">
                            {language === 'ar' ? 'معلومات الدرس' : 'Lesson Info'}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] p-4 flex items-center gap-3">
                                <div className="p-2.5 rounded-[var(--radius-md)] bg-primary-pale">
                                    <Calendar size={18} className="text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider">{language === 'ar' ? 'التاريخ' : 'Date'}</p>
                                    <p className="text-sm font-bold text-[var(--text-main)] truncate">{session.session_date || '-'}</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] p-4 flex items-center gap-3">
                                <div className="p-2.5 rounded-[var(--radius-md)] bg-secondary-pale">
                                    <CheckCircle size={18} className="text-[var(--accent)]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider">{language === 'ar' ? 'المكتملة' : 'Completed'}</p>
                                    <p className="text-sm font-bold text-[var(--text-main)]">{session.session_number || '0'}</p>
                                </div>
                            </div>
                            <div className="col-span-2 bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] p-4 flex items-center gap-3">
                                <div className="p-2.5 rounded-[var(--radius-md)] bg-orange-50">
                                    <Clock size={18} className="text-orange-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-wider">{language === 'ar' ? 'المدة' : 'Duration'}</p>
                                    <p className="text-sm font-bold text-[var(--text-main)]">
                                        {session.duration
                                            ? (language === 'ar' ? `${session.duration} دقيقة` : `${session.duration} min`)
                                            : (language === 'ar' ? '٦٠ دقيقة' : '60 min')
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Time Section */}
                    <div>
                        <h3 className="text-base font-bold text-[var(--text-main)] mb-4">
                            {language === 'ar' ? 'وقت الدرس' : 'Lesson Time'}
                        </h3>
                        <div className={`rounded-[var(--radius-md)] border p-5 ${live ? 'bg-primary-pale border-primary/30' : ended ? 'bg-[var(--light-bg)] border-[var(--border)]' : 'bg-orange-50/70 border-orange-200/60'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-[var(--radius-md)] ${live ? 'bg-primary-pale' : ended ? 'bg-[var(--light-bg)]' : 'bg-orange-100'}`}>
                                    <Clock size={22} className={live ? 'text-primary' : ended ? 'text-[var(--text-muted)]' : 'text-orange-700'} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-[var(--text-muted)] font-medium">{language === 'ar' ? 'موعد الجلسة' : 'Session Time'}</p>
                                    <p className="text-base font-bold text-[var(--text-main)] truncate">
                                        {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                    </p>
                                </div>
                                {live && (
                                    <div className="bg-primary text-white text-[11px] font-bold px-3.5 py-2 rounded-full flex items-center gap-1.5 shadow-[var(--shadow-sm)] shrink-0">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        {language === 'ar' ? 'مباشر' : 'Live'}
                                    </div>
                                )}
                                {ended && (
                                    <div className="bg-[var(--border)] text-[var(--text-muted)] text-[11px] font-bold px-3.5 py-2 rounded-full flex items-center gap-1.5 shrink-0">
                                        <CheckCircle size={12} />
                                        {language === 'ar' ? 'انتهت' : 'Done'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Student Section */}
                    {session.student && (
                        <div>
                            <h3 className="text-base font-bold text-[var(--text-main)] mb-4">
                                {language === 'ar' ? 'الطالب' : 'Student'}
                            </h3>
                            <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-[var(--radius-md)] bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-base shadow-[var(--shadow-md)]">
                                        {studentInitial}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-[var(--text-main)] text-sm">
                                            {session.student.name || (language === 'ar' ? 'غير معروف' : 'Unknown')}
                                        </p>
                                        <p className="text-[12px] text-[var(--text-muted)] mt-0.5 truncate">{session.student.email || '-'}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-primary-pale flex items-center justify-center shrink-0">
                                        <CheckCircle size={18} className="text-green-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Review Section - يظهر إذا كان التقييم موجود */}
                    {ended && session.status !== 'cancelled' && (
                        <div>
                            <h3 className="text-base font-bold text-[var(--text-main)] mb-4">
                                {language === 'ar' ? 'التقييم' : 'Review'}
                            </h3>
                            {reviewLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 size={20} className="animate-spin text-primary" />
                                </div>
                            ) : review ? (
                                <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] p-5">
                                    <div className="flex items-center gap-1 mb-3">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Star
                                                key={i}
                                                size={18}
                                                className={i <= review.rating
                                                    ? 'text-amber-400 fill-amber-400'
                                                    : 'text-slate-200'
                                                }
                                            />
                                        ))}
                                        <span className="text-sm font-bold text-navy mr-2">
                                            {review.rating}/5
                                        </span>
                                    </div>
                                    {review.comment && (
                                        <div className="flex items-start gap-2 text-sm text-[var(--text-muted)] bg-[var(--light-bg)] rounded-[var(--radius-md)] p-3">
                                            <MessageSquare size={14} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
                                            <p className="leading-relaxed">{review.comment}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)] p-5">
                                    <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
                                        <Star size={16} />
                                        <span>{language === 'ar' ? 'لا يوجد تقييم بعد' : 'No review yet'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ===== BOTTOM ACTION ===== */}
                <div className="px-6 py-4 bg-white border-t border-[var(--border)]">
                    {!ended ? (
                        <div>
                            <button
                                onClick={() => live && onStartSession?.(session.id)}
                                disabled={!live}
                                className={`w-full h-12 rounded-[var(--radius-md)] font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 ${
                                    live
                                        ? 'bg-primary text-white hover:bg-primary/90 shadow-[var(--shadow-lg)] active:scale-[0.98]'
                                        : 'bg-[var(--light-bg)] text-[var(--text-muted)] cursor-not-allowed'
                                }`}
                            >
                                {live ? (
                                    <>
                                        <Video size={18} />
                                        {language === 'ar' ? 'إنشاء الغرفة والانضمام' : 'Create Room & Join'}
                                    </>
                                ) : (
                                    <>
                                        <Clock size={18} />
                                        {language === 'ar' ? 'الدرس غير متاح بعد' : 'Lesson Not Available Yet'}
                                    </>
                                )}
                            </button>
                            <p className="text-[11px] text-[var(--text-muted)] text-center mt-2.5">
                                {live
                                    ? (language === 'ar' ? 'انقر لبدء الجلسة والدخول إلى الغرفة' : 'Click to start the session and join the room')
                                    : (language === 'ar' ? 'سيصبح متاحاً عند وقت الدرس المحدد' : 'Will be available at the scheduled lesson time')
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="w-full h-12 rounded-[var(--radius-md)] bg-[var(--light-bg)] flex items-center justify-center text-[var(--text-muted)] text-sm font-semibold gap-2">
                            <CheckCircle size={16} className="text-[var(--text-muted)]" />
                            {language === 'ar' ? 'تم الانتهاء من هذه الجلسة' : 'This session has ended'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
