import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
    Clock,
    Calendar,
    Loader2,
    SlidersHorizontal,
    ChevronLeft,
    ChevronRight,
    ListOrdered,
    X,
    Timer,
    Play,
    User,
    Video
} from 'lucide-react';
import { teacherService, Session } from '../../Services/api';
import { SessionDetailsModal } from '../student/SessionDetailsModal';
import { SessionRoomModal } from '../dashboard/SessionRoomModal';
import { getSessionState } from '../../Utils/sessionStatus';

interface TeacherLessonsTabProps {
    user?: any;
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

export const TeacherLessonsTab: React.FC<TeacherLessonsTabProps> = () => {
    const { language, direction } = useLanguage();
    const isAr = language === 'ar';
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'finished' | 'students'>('active');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [agoraData, setAgoraData] = useState<any>(null);

    const dateInputRef = useRef<HTMLInputElement>(null);

    const loadSessions = async () => {
        setLoading(true);
        try {
            const data = await teacherService.getTeacherSessions();
            setSessions(Array.isArray(data) ? data : []);
        } catch {
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const orderData = useMemo(() => {
        const groups = new Map<number, Session[]>();
        for (const s of sessions) {
            const key = s.booking_id || s.booking?.id || -s.id;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(s);
        }

        const orderMap = new Map<number, number>();
        const totalMap = new Map<number, number>();

        groups.forEach((list) => {
            const sorted = [...list].sort((a, b) => {
                const da = a.session_date || '';
                const db = b.session_date || '';
                const c = da.localeCompare(db);
                if (c !== 0) return c;
                const ta = a.start_time || '';
                const tb = b.start_time || '';
                const c2 = ta.localeCompare(tb);
                if (c2 !== 0) return c2;
                return (a.id || 0) - (b.id || 0);
            });

            const total = sorted.length;
            sorted.forEach((item, index) => {
                orderMap.set(item.id, index + 1);
                const backendTotal = (item as any).booking?.total_sessions || (item as any).booking?.totalSessions || total;
                totalMap.set(item.id, Math.max(total, backendTotal));
            });
        });

        return { orderMap, totalMap };
    }, [sessions]);

    const dateFilteredSessions = useMemo(() => {
        if (!selectedDate) return sessions;
        return sessions.filter((s) => {
            const d = (s.session_date || '').split('T')[0]?.split(' ')[0];
            return d === selectedDate;
        });
    }, [sessions, selectedDate]);

    const activeSessions = useMemo(() => {
        const filtered = dateFilteredSessions.filter((s) => {
            const status = (s.status || '').toLowerCase();
            return status === 'scheduled' || status === 'live' || status === 'wait_for_teacher' || status === '';
        });

        return filtered.sort((a, b) => {
            const da = a.session_date || '';
            const db = b.session_date || '';
            const c = da.localeCompare(db);
            if (c !== 0) return c;
            const ta = a.start_time || '';
            const tb = b.start_time || '';
            return ta.localeCompare(tb);
        });
    }, [dateFilteredSessions]);

    const finishedSessions = useMemo(() => {
        const filtered = dateFilteredSessions.filter((s) => {
            const status = (s.status || '').toLowerCase();
            return status === 'ended' || status === 'completed' || status === 'finished' || status === 'cancelled';
        });

        return filtered.sort((a, b) => {
            const da = a.session_date || '';
            const db = b.session_date || '';
            const c = db.localeCompare(da);
            if (c !== 0) return c;
            const ta = a.start_time || '';
            const tb = b.start_time || '';
            return tb.localeCompare(ta);
        });
    }, [dateFilteredSessions]);

    const uniqueStudents = useMemo(() => {
        const map = new Map<number, { user: NonNullable<Session['student']>; bookingsCount: number }>();
        sessions.forEach((s) => {
            if (s.student?.id) {
                const existing = map.get(s.student.id);
                if (existing) {
                    existing.bookingsCount++;
                } else {
                    map.set(s.student.id, { user: s.student!, bookingsCount: 1 });
                }
            }
        });
        return Array.from(map.values());
    }, [sessions]);

    const handleStartSession = async (sessionId: number) => {
        try {
            const response = await teacherService.startSession(sessionId);
            if (response.success && response.data?.agora) {
                setAgoraData({
                    ...response.data.agora,
                    session_id: sessionId,
                    role: 'host'
                });
                setSelectedSession(null);
            } else {
                alert(response.message || (isAr ? 'فشل بدء الجلسة' : 'Failed to start session'));
            }
        } catch (e: any) {
            alert(e.message || (isAr ? 'فشل بدء الجلسة' : 'Failed to start session'));
        }
    };

    const handleEndSession = async (sessionId: number) => {
        const confirmed = window.confirm(
            isAr ? 'هل أنت متأكد من رغبتك في إنهاء هذه الجلسة؟' : 'Are you sure you want to end this session?'
        );
        if (!confirmed) return;

        try {
            const response = await teacherService.endSession(sessionId);
            if (response.success) {
                setSelectedSession(null);
                loadSessions();
            } else {
                alert(response.message || (isAr ? 'فشل إنهاء الجلسة' : 'Failed to end session'));
            }
        } catch (e: any) {
            alert(e.message || (isAr ? 'فشل إنهاء الجلسة' : 'Failed to end session'));
        }
    };

    const handleOpenDatePicker = () => {
        if (dateInputRef.current) {
            if (typeof (dateInputRef.current as any).showPicker === 'function') {
                (dateInputRef.current as any).showPicker();
            } else {
                dateInputRef.current.click();
            }
        }
    };

    const ChevronIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

    const tabs = [
        { id: 'active' as const, label: isAr ? 'نشطة' : 'Active' },
        { id: 'finished' as const, label: isAr ? 'منتهية' : 'Finished' },
        { id: 'students' as const, label: isAr ? 'طلابي' : 'My Students' },
    ];

    const renderEmpty = (title: string, subtitle: string) => (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <img
                src="/images/v2/empty_time_slots.png"
                alt=""
                className="w-28 h-28 object-contain mb-4"
                onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                }}
            />
            <h3 className="text-base font-bold text-[#0D4A5F] mb-1.5">
                {title}
            </h3>
            <p className="text-sm text-[#738989] max-w-sm">
                {subtitle}
            </p>
        </div>
    );

    const renderSessionCard = (session: Session, isEnded: boolean) => {
        const rawStatus = (session.status || '').toLowerCase();
        const actionState = getSessionState(session, 15);
        const isLive = rawStatus === 'live' || rawStatus === 'wait_for_teacher' || actionState === 'live';

        const subjectName = isAr
            ? (session.subject?.name_ar || session.subject?.name || (session as any).course?.title_ar || (session as any).course?.name || session.session_title || 'الدرس')
            : (session.subject?.name_en || session.subject?.name || (session as any).course?.title || (session as any).course?.name || session.session_title || 'Lesson');

        const durationText = getDuration(session.start_time, session.end_time, language);
        const dateText = formatDate(session.session_date, language);
        const startTimeText = formatTime(session.start_time, language);
        const endTimeText = formatTime(session.end_time, language);
        const timeRangeText = `${startTimeText} - ${endTimeText}`;

        const sid = session.id;
        const displayNumber = orderData.orderMap.get(sid) ?? session.session_number;
        const displayTotal = orderData.totalMap.get(sid) ?? (session.booking as any)?.total_sessions ?? 1;
        const showOrder = displayNumber !== undefined && displayTotal > 1;

        const rawStudentName = session.student?.name || '';
        const displayStudentName = rawStudentName || (isAr ? 'طالب' : 'Student');

        return (
            <div
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_3px_10px_rgba(0,0,0,0.04)] border border-[#E6E6E6]/60 hover:shadow-md transition-all cursor-pointer"
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <h3 className="text-base font-bold text-[#0D4A5F] truncate">
                            {subjectName}
                        </h3>
                        <img
                            src="/images/v2/lesson.png"
                            alt=""
                            className="w-8 h-8 object-contain shrink-0"
                            onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {showOrder && (
                            <div className="bg-[#E8F0FE] text-[#0D4A5F] px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1">
                                <span>
                                    {isAr
                                        ? `الحصة ${displayNumber} من ${displayTotal}`
                                        : `Session ${displayNumber} of ${displayTotal}`}
                                </span>
                                <ListOrdered size={13} className="text-[#0D4A5F]" />
                            </div>
                        )}
                        <div
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                isEnded
                                    ? 'bg-[#F0F4F5] text-[#738989]'
                                    : isLive
                                    ? 'bg-[#EAF5E9] text-[#5B9F48] flex items-center gap-1.5'
                                    : 'bg-[#EAF5E9] text-[#5B9F48]'
                            }`}
                        >
                            {isLive && !isEnded && (
                                <span className="w-2 h-2 rounded-full bg-[#5B9F48] animate-ping" />
                            )}
                            <span>
                                {isEnded
                                    ? (isAr ? 'منتهية' : 'Finished')
                                    : isLive
                                    ? (isAr ? 'مباشر الآن' : 'Live Now')
                                    : (isAr ? 'نشطة' : 'Active')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mt-3 text-xs text-[#738989]">
                    {durationText && (
                        <div className="flex items-center gap-1.5">
                            <span>{durationText}</span>
                            <Timer size={14} className="text-[#738989]" />
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <span>{dateText}</span>
                        <Calendar size={14} className="text-[#738989]" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span>{timeRangeText}</span>
                        <Clock size={14} className="text-[#738989]" />
                    </div>
                </div>

                <div className="my-3.5 border-t border-[#F3F4F5]" />

                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-[#E6E6E6] shrink-0 bg-primary/10 flex items-center justify-center text-[#0D4A5F] font-bold text-xs">
                            {(displayStudentName || 'S').charAt(0).toUpperCase()}
                        </div>
                        <p className="font-semibold text-sm text-[#0D4A5F] truncate">
                            {displayStudentName}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {isLive && !isEnded && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartSession(session.id);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#5B9F48] text-white text-xs font-bold hover:bg-[#4d863d] transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                                <Video size={13} />
                                <span>{isAr ? 'بدء / انضمام' : 'Start / Join'}</span>
                            </button>
                        )}
                        <ChevronIcon size={22} className="text-[#0D4A5F]" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-3xl mx-auto space-y-4 pb-20" dir={direction}>
            <input
                ref={dateInputRef}
                type="date"
                value={selectedDate || ''}
                onChange={(e) => setSelectedDate(e.target.value || null)}
                className="hidden"
            />

            <div className="bg-white rounded-2xl p-1 shadow-sm border border-[#E6E6E6]/60 grid grid-cols-3 gap-1 h-[52px]">
                {tabs.map((tab) => {
                    const isSelected = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-center text-sm transition-all rounded-xl ${
                                isSelected
                                    ? 'bg-[#E8F1F3] text-[#0D4A5F] font-bold'
                                    : 'text-[#738989] font-medium hover:text-[#0D4A5F] bg-transparent'
                            }`}
                        >
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-[#5B9F48]" size={36} />
                </div>
            ) : activeTab === 'students' ? (
                uniqueStudents.length === 0 ? (
                    renderEmpty(
                        isAr ? 'لا يوجد طلاب لديهم حجوزات' : 'No students with bookings',
                        isAr ? 'ستظهر قائمة الطلاب عند وجود حجوزات جديدة' : 'Students list will appear when you receive bookings'
                    )
                ) : (
                    <div className="space-y-3">
                        {uniqueStudents.map(({ user: student, bookingsCount }) => {
                            const bookingsLabel = isAr
                                ? (bookingsCount === 1
                                    ? 'حجز واحد'
                                    : bookingsCount === 2
                                    ? 'حجزان'
                                    : `${bookingsCount} حجوزات`)
                                : `${bookingsCount} booking${bookingsCount !== 1 ? 's' : ''}`;

                            return (
                                <div
                                    key={student.id}
                                    className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-[#E6E6E6]/60 flex items-center justify-between hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-[#E6E6E6] shrink-0 bg-primary/10 flex items-center justify-center text-[#0D4A5F] font-bold text-base">
                                            {(student.name || 'S').charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-[#171717] truncate">
                                                {student.name || (isAr ? 'غير معروف' : 'Unknown')}
                                            </p>
                                            {student.email && (
                                                <p className="text-xs text-[#738989] truncate">
                                                    {student.email}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-[#A6D388] text-[#144D25] px-2.5 py-1 rounded-lg text-[10.5px] font-bold shrink-0">
                                        {bookingsLabel}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (activeTab === 'active' ? activeSessions : finishedSessions).length === 0 ? (
                renderEmpty(
                    activeTab === 'active'
                        ? (isAr ? 'لا توجد حصص نشطة حاليًا' : 'No active sessions currently')
                        : (isAr ? 'لا توجد حصص منتهية حاليًا' : 'No finished sessions currently'),
                    activeTab === 'active'
                        ? (isAr ? 'ستظهر هنا جميع حصصك القادمة والنشطة' : 'All your upcoming and active sessions will appear here')
                        : (isAr ? 'ستظهر هنا الحصص التي أكملتها' : 'Sessions you have completed will appear here')
                )
            ) : (
                <div className="space-y-3">
                    {(activeTab === 'active' ? activeSessions : finishedSessions).map((session) =>
                        renderSessionCard(session, activeTab === 'finished')
                    )}
                </div>
            )}

            {activeTab !== 'students' && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
                    <div
                        className={`h-[38px] px-4 rounded-xl flex items-center gap-2 bg-white shadow-[0_3px_12px_rgba(0,0,0,0.12)] border transition-all ${
                            selectedDate
                                ? 'border-[#5B9F48] text-[#5B9F48]'
                                : 'border-[#E6E6E6] text-[#0D4A5F]'
                        }`}
                    >
                        <button
                            type="button"
                            onClick={handleOpenDatePicker}
                            className="flex items-center gap-2 text-xs sm:text-sm font-bold"
                        >
                            <span>
                                {selectedDate
                                    ? formatDate(selectedDate, language)
                                    : (isAr ? 'تصفية' : 'Filter')}
                            </span>
                            <SlidersHorizontal size={15} />
                        </button>
                        {selectedDate && (
                            <button
                                type="button"
                                onClick={() => setSelectedDate(null)}
                                className="p-0.5 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            <SessionRoomModal
                isOpen={!!agoraData}
                onClose={() => {
                    setAgoraData(null);
                    loadSessions();
                }}
                agora={agoraData}
            />

            <SessionDetailsModal
                session={selectedSession}
                isOpen={!!selectedSession}
                onClose={() => setSelectedSession(null)}
                displayNumber={selectedSession ? orderData.orderMap.get(selectedSession.id) : undefined}
                displayTotal={selectedSession ? orderData.totalMap.get(selectedSession.id) : undefined}
                isTeacher={true}
                onStartSession={handleStartSession}
                onEndSession={handleEndSession}
            />
        </div>
    );
};
