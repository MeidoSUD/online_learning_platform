import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Calendar, Clock, Video, Loader2, Timer, BookOpen, ChevronLeft, ChevronRight, X, Filter, Sparkles } from 'lucide-react';
import { studentService, Session } from '../../Services/api';
import { SessionRoomModal } from '../dashboard/SessionRoomModal';
import { SessionDetailsModal } from './SessionDetailsModal';
import { getSessionState } from '../../Utils/sessionStatus';

interface StudentTeacherInfo {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
    email?: string;
    profile_image?: string | null;
    nationality?: string;
    rating?: number;
    specialization?: string;
    hourly_rate?: number;
    bookings_count: number;
}

interface OrderCache {
    [key: number]: number;
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

function getBookingsCountLabel(count: number, language: string): string {
    if (language !== 'ar') {
        return `${count} booking${count !== 1 ? 's' : ''}`;
    }
    if (count === 1) return 'حجز واحد';
    if (count === 2) return 'حجزان';
    if (count >= 3 && count <= 10) return `${count} حجوزات`;
    return `${count} حجز`;
}

function parseSessionDateTime(sessionDate?: string | null, startTime?: string | null): number {
    if (!sessionDate) return 0;
    try {
        const rawDate = sessionDate.split('T')[0].split(' ')[0];
        const [y, m, d] = rawDate.split('-').map(Number);
        if (!y || !m || !d) return 0;
        let h = 0;
        let min = 0;
        if (startTime && startTime.includes(':')) {
            const parts = startTime.split(':');
            h = parseInt(parts[0], 10) || 0;
            min = parseInt(parts[1], 10) || 0;
        }
        return new Date(y, m - 1, d, h, min).getTime();
    } catch {
        return 0;
    }
}

function sortSessions(list: Session[], isAscending = true): Session[] {
    return list.slice().sort((a, b) => {
        const timeA = parseSessionDateTime(a.session_date, a.start_time);
        const timeB = parseSessionDateTime(b.session_date, b.start_time);
        if (timeA !== timeB) {
            return isAscending ? timeA - timeB : timeB - timeA;
        }
        return isAscending ? (a.id || 0) - (b.id || 0) : (b.id || 0) - (a.id || 0);
    });
}

function computeChronologicalOrder(allSessions: Session[]): { orderCache: OrderCache; totalCache: { [key: number]: number } } {
    const groups: { [key: number]: Session[] } = {};
    for (const s of allSessions) {
        const bid = s.booking_id || s.booking?.id || -(s.id || 0);
        if (!groups[bid]) groups[bid] = [];
        groups[bid].push(s);
    }

    const orderCache: OrderCache = {};
    const totalCache: { [key: number]: number } = {};

    for (const keyStr of Object.keys(groups)) {
        const key = Number(keyStr);
        const list = groups[key].slice().sort((a, b) => {
            const da = a.session_date || '';
            const db = b.session_date || '';
            if (da !== db) return da.localeCompare(db);
            const ta = a.start_time || '';
            const tb = b.start_time || '';
            if (ta !== tb) return ta.localeCompare(tb);
            return (a.id || 0) - (b.id || 0);
        });

        for (let i = 0; i < list.length; i++) {
            orderCache[list[i].id] = i + 1;
            const backendTotal = list[i].booking?.total_sessions || 0;
            totalCache[list[i].id] = Math.max(backendTotal, list.length, 1);
        }
    }

    return { orderCache, totalCache };
}

export const MySessionsTab: React.FC = () => {
    const { direction, language } = useLanguage();
    const isAr = language === 'ar';
    const [activeTab, setActiveTab] = useState<'active' | 'ended' | 'teachers'>('active');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [teachers, setTeachers] = useState<StudentTeacherInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [agoraData, setAgoraData] = useState<any>(null);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [selectedSessionOrder, setSelectedSessionOrder] = useState<{ number: number; total: number } | null>(null);
    const dateInputRef = useRef<HTMLInputElement>(null);

    const loadSessions = async () => {
        setLoading(true);
        try {
            const data = await studentService.getSessions();
            setSessions(Array.isArray(data) ? data : []);
        } catch {
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const detailsMap = new Map<number, any>();
            try {
                const allTeachers = await studentService.getTeachers();
                if (Array.isArray(allTeachers)) {
                    for (const t of allTeachers) {
                        const profile = t?.profile || {};
                        detailsMap.set(t.id, {
                            profile_image: profile.profile_photo || t.image || null,
                            nationality: t.nationality,
                            rating: profile.rating || 0,
                            specialization: profile.specialization || t.specialization || '',
                            hourly_rate: profile.hourly_rate || t.hourly_rate || 120,
                            first_name: t.first_name || '',
                            last_name: t.last_name || '',
                        });
                    }
                }
            } catch {}

            const data = await studentService.getSessions();
            const teacherMap = new Map<number, StudentTeacherInfo>();
            if (Array.isArray(data)) {
                for (const session of data) {
                    if (session.teacher?.id) {
                        const tid = session.teacher.id;
                        const existing = teacherMap.get(tid);
                        const details = detailsMap.get(tid);
                        if (existing) {
                            existing.bookings_count += 1;
                        } else {
                            const rawName = session.teacher.name || `${details?.first_name || ''} ${details?.last_name || ''}`.trim();
                            const parts = rawName.split(' ');
                            teacherMap.set(tid, {
                                id: tid,
                                name: rawName,
                                first_name: details?.first_name || parts[0] || '',
                                last_name: details?.last_name || parts.slice(1).join(' ') || '',
                                email: session.teacher.email,
                                profile_image: details?.profile_image || null,
                                nationality: details?.nationality || '',
                                rating: details?.rating || 0,
                                specialization: details?.specialization || (session.subject ? (isAr ? session.subject.name_ar : session.subject.name_en) : ''),
                                hourly_rate: details?.hourly_rate || 120,
                                bookings_count: 1,
                            });
                        }
                    }
                }
            }
            setTeachers(Array.from(teacherMap.values()));
        } catch {
            setTeachers([]);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        if (activeTab === 'teachers') {
            fetchTeachers();
        }
    }, [activeTab]);

    const { orderCache, totalCache } = computeChronologicalOrder(sessions);

    const dateFilteredSessions = selectedDate
        ? sessions.filter(s => {
            const d = (s.session_date || '').split('T')[0]?.split(' ')[0];
            return d === selectedDate;
        })
        : sessions;

    const baseSortedSessions = sortSessions(dateFilteredSessions, true);

    const activeSessions = baseSortedSessions.filter(session => {
        const statusStr = (session.status || '').toLowerCase();
        return statusStr === 'scheduled' ||
            statusStr === 'live' ||
            statusStr === 'wait_for_teacher' ||
            statusStr === '';
    });

    const endedSessions = baseSortedSessions.filter(session => {
        const statusStr = (session.status || '').toLowerCase();
        return statusStr === 'ended' ||
            statusStr === 'completed' ||
            statusStr === 'finished' ||
            statusStr === 'cancelled';
    });

    const handleJoinSession = async (sessionId: number) => {
        try {
            const response = await studentService.joinSession(sessionId);
            if (response.success && response.data?.agora) {
                setAgoraData({
                    ...response.data.agora,
                    session_id: sessionId,
                    role: 'participant',
                });
            } else {
                alert(response.message || (isAr ? 'لا يمكن الانضمام للجلسة حالياً' : 'Cannot join session at this time'));
            }
        } catch (e: any) {
            alert(e.message || (isAr ? 'فشل الانضمام للجلسة' : 'Failed to join session'));
        }
    };

    const handleSelectSession = (session: Session) => {
        setSelectedSession(session);
        setSelectedSessionOrder({
            number: orderCache[session.id] || session.session_number || 1,
            total: totalCache[session.id] || session.booking?.total_sessions || 1,
        });
    };



    const tabs = [
        { id: 'active' as const, label: isAr ? 'نشطة' : 'Active', count: activeSessions.length },
        { id: 'ended' as const, label: isAr ? 'منتهية' : 'Finished', count: endedSessions.length },
        { id: 'teachers' as const, label: isAr ? 'مُعلّميّ' : 'My Teachers', count: teachers.length },
    ];

    const ChevronIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

    return (
        <div className="space-y-4 animate-fade-in pb-20" dir={direction}>
            <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 flex items-center gap-1">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all text-center flex items-center justify-center gap-2 ${
                                isActive
                                    ? 'bg-[#E8F1F3] text-[#0D4A5F] shadow-sm'
                                    : 'text-[#738989] hover:text-[#0D4A5F]'
                            }`}
                        >
                            <span>{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                                    isActive ? 'bg-white/80 text-[#0D4A5F]' : 'bg-slate-100 text-[#738989]'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <input
                ref={dateInputRef}
                type="date"
                value={selectedDate || ''}
                onChange={(e) => setSelectedDate(e.target.value || null)}
                className="hidden"
            />

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-pulse space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-28 h-5 bg-slate-200 rounded-md" />
                                    <div className="w-8 h-8 bg-slate-200 rounded-lg" />
                                </div>
                                <div className="w-16 h-6 bg-slate-200 rounded-lg" />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-4 bg-slate-100 rounded" />
                                <div className="w-24 h-4 bg-slate-100 rounded" />
                                <div className="w-28 h-4 bg-slate-100 rounded" />
                            </div>
                            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-slate-200" />
                                    <div className="w-28 h-4 bg-slate-200 rounded" />
                                </div>
                                <div className="w-5 h-5 bg-slate-100 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : activeTab === 'teachers' ? (
                teachers.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-[#E8F1F3] text-[#0D4A5F] flex items-center justify-center mb-4">
                            <BookOpen size={40} />
                        </div>
                        <h3 className="text-base font-bold text-[#0D4A5F] mb-1">
                            {isAr ? 'لا يوجد معلمون بعد' : 'No teachers yet'}
                        </h3>
                        <p className="text-xs text-[#738989]">
                            {isAr ? 'لم تقم بحجز جلسات مع معلمين حتى الآن' : 'You have not booked sessions with teachers yet'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {teachers.map(teacher => {
                            const rawName = teacher.name || `${teacher.first_name} ${teacher.last_name}`.trim();
                            const displayName = rawName.startsWith('أ.') ? rawName : `أ. ${rawName}`;
                            const bookingsLabel = getBookingsCountLabel(teacher.bookings_count, language);
                            const spec = teacher.specialization || (isAr ? 'مادة دراسية' : 'School Subject');

                            return (
                                <div
                                    key={teacher.id}
                                    className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 rounded-full border border-slate-200 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
                                            {teacher.profile_image ? (
                                                <img src={teacher.profile_image} alt={displayName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-sm font-bold text-[#0D4A5F]">
                                                    {(rawName.charAt(0) || 'أ').toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-[#171717] truncate leading-snug">
                                                {displayName}
                                            </h4>
                                            <div className="flex items-center gap-1.5 text-xs text-[#738989] mt-1">
                                                <BookOpen size={13} className="shrink-0" />
                                                <span className="truncate">{spec}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#A6D388] text-[#144D25]">
                                            {bookingsLabel}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm font-bold text-[#0D4A5F]">{teacher.hourly_rate}</span>
                                            <span className="text-[10px] text-[#0D4A5F] font-medium">
                                                {isAr ? 'ر.س / ساعة' : 'SAR / hr'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (activeTab === 'active' ? activeSessions : endedSessions).length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-[#E8F1F3] text-[#0D4A5F] flex items-center justify-center mb-4">
                        <BookOpen size={40} />
                    </div>
                    <h3 className="text-base font-bold text-[#0D4A5F] mb-1">
                        {activeTab === 'active'
                            ? (isAr ? 'لا توجد جلسات نشطة' : 'No active sessions')
                            : (isAr ? 'لا توجد جلسات منتهية' : 'No finished sessions')}
                    </h3>
                    <p className="text-xs text-[#738989]">
                        {activeTab === 'active'
                            ? (isAr ? 'ليس لديك أي جلسات قادمة أو نشطة حالياً' : 'You have no upcoming or live sessions currently')
                            : (isAr ? 'لم يتم تسجيل أي جلسات منتهية بعد' : 'No finished sessions recorded yet')}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {(activeTab === 'active' ? activeSessions : endedSessions).map(session => {
                        const subjectName = session.subject
                            ? (isAr ? session.subject.name_ar || session.subject.name_en : session.subject.name_en || session.subject.name_ar)
                            : (session.booking?.reference || (isAr ? 'جلسة تعليمية' : 'Session'));

                        const teacherName = session.teacher?.name || (isAr ? 'معلم' : 'Teacher');
                        const displayTeacherName = teacherName.startsWith('أ.') ? teacherName : `أ. ${teacherName}`;
                        const currentOrder = orderCache[session.id] || session.session_number || 1;
                        const totalOrder = totalCache[session.id] || session.booking?.total_sessions || 1;
                        const showOrder = totalOrder > 1;
                        const durationText = getDuration(session.start_time, session.end_time, language) || `${session.duration || 60} ${isAr ? 'دقيقة' : 'min'}`;
                        const dateText = formatDate(session.session_date, language);
                        const startTime = formatTime(session.start_time, language);
                        const endTime = formatTime(session.end_time, language);
                        const isEnded = activeTab === 'ended';

                        return (
                            <div
                                key={session.id}
                                onClick={() => handleSelectSession(session)}
                                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer space-y-3"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <h3 className="text-base font-bold text-[#0D4A5F] truncate">
                                            {subjectName}
                                        </h3>
                                        <div className="w-8 h-8 rounded-lg bg-[#E8F1F3] text-[#0D4A5F] flex items-center justify-center shrink-0">
                                            <BookOpen size={16} />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {showOrder && (
                                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#E8F0FE] text-[#0D4A5F]">
                                                {isAr ? `الجلسة ${currentOrder} من ${totalOrder}` : `Session ${currentOrder} of ${totalOrder}`}
                                            </span>
                                        )}
                                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                            isEnded
                                                ? 'bg-[#F0F4F5] text-[#738989]'
                                                : 'bg-[#EAF5E9] text-[#3D8B37]'
                                        }`}>
                                            {isEnded ? (isAr ? 'منتهية' : 'Finished') : (isAr ? 'نشطة' : 'Active')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#738989]">
                                    {durationText && (
                                        <div className="flex items-center gap-1">
                                            <Timer size={14} className="shrink-0" />
                                            <span>{durationText}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} className="shrink-0" />
                                        <span>{dateText}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock size={14} className="shrink-0" />
                                        <span dir="ltr">{startTime} - {endTime}</span>
                                    </div>
                                </div>

                                <div className="border-t border-[#F3F4F5] pt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-7 h-7 rounded-full border border-slate-200 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
                                            <span className="text-[11px] font-bold text-[#0D4A5F]">
                                                {(teacherName.charAt(0) || 'أ').toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="text-sm font-semibold text-[#0D4A5F] truncate">
                                            {displayTeacherName}
                                        </span>
                                    </div>

                                    <ChevronIcon size={20} className="text-[#0D4A5F] shrink-0" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab !== 'teachers' && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
                    <div
                        onClick={() => dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.click()}
                        className={`flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-lg border cursor-pointer hover:shadow-xl transition-all ${
                            selectedDate
                                ? 'border-[#3D8B37] text-[#3D8B37]'
                                : 'border-slate-200 text-[#0D4A5F]'
                        }`}
                    >
                        <span className="text-xs font-bold">
                            {selectedDate ? formatDate(selectedDate, language) : (isAr ? 'تصفية' : 'Filter')}
                        </span>
                        <Filter size={15} />
                        {selectedDate && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDate(null);
                                }}
                                className="text-red-500 hover:text-red-600 mr-1"
                            >
                                <X size={14} />
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
                displayNumber={selectedSessionOrder?.number}
                displayTotal={selectedSessionOrder?.total}
                isOpen={!!selectedSession}
                onClose={() => {
                    setSelectedSession(null);
                    setSelectedSessionOrder(null);
                }}
                onJoinSession={(id) => {
                    setSelectedSession(null);
                    setSelectedSessionOrder(null);
                    handleJoinSession(id);
                }}
            />
        </div>
    );
};
