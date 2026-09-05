import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Calendar, Clock, Video, Loader2, FilterX, Star, School } from 'lucide-react';
import { studentService, Session } from '../../Services/api';
import { SessionRoomModal } from '../dashboard/SessionRoomModal';
import { SessionDetailsModal } from './SessionDetailsModal';
import { COUNTRIES } from '../../Utils/constants';
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
    bookings_count: number;
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
        return time.substring(0, 5);
    }
}

function formatDate(dateStr: string, language: string): string {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr.split('T')[0] || dateStr);
        return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

function getDuration(start: string, end: string): string {
    if (!start || !end) return '';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
}

export const MySessionsTab: React.FC = () => {
    const { t, direction, language } = useLanguage();
    const [activeTab, setActiveTab] = useState<'coming' | 'ended' | 'teachers'>('coming');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [teachers, setTeachers] = useState<StudentTeacherInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [agoraData, setAgoraData] = useState<any>(null);
    const [joining, setJoining] = useState<number | null>(null);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);

    const loadSessions = async () => {
        setLoading(true);
        try {
            const data = await studentService.getSessions();
            setSessions(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            let teacherDetailsMap = new Map<number, any>();
            try {
                const allTeachers = await studentService.getTeachers();
                if (Array.isArray(allTeachers)) {
                    for (const t of allTeachers) {
                        const profile = t?.profile || {};
                        teacherDetailsMap.set(t.id, {
                            profile_image: profile.profile_photo || null,
                            nationality: t.nationality,
                            rating: profile.rating || 0,
                            first_name: t.first_name || '',
                            last_name: t.last_name || '',
                        });
                    }
                }
            } catch (_) { /* fallback to session data */ }

            const data = await studentService.getSessions();
            const teacherMap = new Map<number, StudentTeacherInfo>();
            if (Array.isArray(data)) {
                for (const session of data) {
                    if (session.teacher?.id) {
                        const existing = teacherMap.get(session.teacher.id);
                        const details = teacherDetailsMap.get(session.teacher.id);
                        if (existing) {
                            existing.bookings_count++;
                        } else {
                            const parts = (session.teacher.name || '').split(' ');
                            teacherMap.set(session.teacher.id, {
                                id: session.teacher.id,
                                name: session.teacher.name || `${details?.first_name || ''} ${details?.last_name || ''}`.trim(),
                                first_name: details?.first_name || parts[0] || '',
                                last_name: details?.last_name || parts.slice(1).join(' ') || '',
                                email: session.teacher.email,
                                profile_image: details?.profile_image || null,
                                nationality: details?.nationality || '',
                                rating: details?.rating || 0,
                                bookings_count: 1,
                            });
                        }
                    }
                }
            }
            setTeachers(Array.from(teacherMap.values()));
        } catch (e) {
            console.error(e);
            setTeachers([]);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        if (activeTab === 'teachers') fetchTeachers();
    }, [activeTab]);

    const dateFiltered = selectedDate
        ? sessions.filter(s => { const d = (s.session_date || '').split('T')[0]?.split(' ')[0]; return d === selectedDate; })
        : sessions;

    const comingSessions = dateFiltered.filter(s => getSessionState(s) !== 'finished');
    const endedSessions = dateFiltered.filter(s => getSessionState(s) === 'finished');

    const handleJoinSession = async (sessionId: number) => {
        setJoining(sessionId);
        try {
            const response = await studentService.joinSession(sessionId);
            if (response.success && response.data?.agora) {
                setAgoraData({
                    ...response.data.agora,
                    session_id: sessionId,
                    role: 'participant',
                });
            } else {
                alert(response.message || (language === 'ar' ? 'لا يمكن الانضمام للجلسة حالياً' : 'Cannot join session at this time'));
            }
        } catch (e: any) {
            alert(e.message || (language === 'ar' ? 'فشل الانضمام للجلسة' : 'Failed to join session'));
        } finally {
            setJoining(null);
        }
    };

    const handleDateClick = () => {
        if (selectedDate) {
            setSelectedDate(null);
        } else {
            const input = document.createElement('input');
            input.type = 'date';
            input.onchange = (e: any) => setSelectedDate(e.target.value || null);
            input.click();
        }
    };

    const renderSessionCard = (session: Session) => {
        const actionState = getSessionState(session);
        const subjectName = language === 'ar'
            ? (session.subject?.name_ar || session.subject?.name_en || '')
            : (session.subject?.name_en || session.subject?.name_ar || '');

        return (
            <div
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--border)] overflow-hidden hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer"
            >
                <div className="bg-gradient-to-r from-primary to-primary/85 px-5 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/25">
                                <Clock className="text-white" size={18} />
                            </div>
                            <p className="text-white font-bold text-sm">
                                {formatTime(session.start_time)} - {formatTime(session.end_time)}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/20 rounded-[var(--radius-md)] px-3 py-1.5 border border-white/30">
                            <Calendar size={13} className="text-white" />
                            <span className="text-white text-xs font-semibold">
                                {formatDate(session.session_date, language)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <h3 className="flex-1 text-lg font-bold text-primary truncate">
                            {subjectName || session.booking?.reference || (language === 'ar' ? 'جلسة' : 'Session')}
                        </h3>
                        <div className="flex items-center gap-1.5 bg-secondary-pale border border-secondary/30 rounded-lg px-2.5 py-1">
                            <Clock size={13} className="text-primary" />
                            <span className="text-secondary text-xs font-bold">
                                {getDuration(session.start_time, session.end_time) || `${session.duration || 0}min`}
                            </span>
                        </div>
                    </div>

                    <div className="bg-[var(--light-bg)] rounded-[var(--radius-md)] p-3 border border-[var(--border)]">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-secondary-pale flex items-center justify-center shrink-0">
                                    <School className="text-secondary" size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-[var(--text-muted)]">
                                        {language === 'ar' ? 'المعلم' : 'Teacher'}
                                    </p>
                                    <p className="font-semibold text-[var(--text-main)] text-sm truncate">
                                        {session.teacher?.name || (language === 'ar' ? 'غير محدد' : 'Unknown')}
                                    </p>
                                </div>
                            </div>

                            {actionState === 'live' ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleJoinSession(session.id); }}
                                    disabled={joining === session.id}
                                    className="flex items-center gap-1.5 bg-gradient-to-br from-[var(--green-light)] to-[var(--green)] text-white text-xs font-bold px-4 py-2 rounded-[50px] hover:-translate-y-[2px] hover:shadow-[0_10px_28px_rgba(61,139,55,.45)] transition-all shadow-[0_6px_20px_rgba(61,139,55,.35)] disabled:opacity-50 shrink-0"
                                >
                                    {joining === session.id ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Video size={14} />
                                    )}
                                    {language === 'ar' ? 'انضمام' : 'Join'}
                                </button>
                            ) : actionState === 'upcoming' ? (
                                <span className="flex items-center gap-1 bg-orange-50 border border-orange-300 rounded-lg px-2.5 py-1 shrink-0">
                                    <Clock size={13} className="text-orange-600" />
                                    <span className="text-orange-700 text-xs font-bold">
                                        {language === 'ar' ? 'قادمة' : 'Upcoming'}
                                    </span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 bg-[var(--border)] rounded-lg px-2.5 py-1 shrink-0">
                                    <Clock size={13} className="text-[var(--text-muted)]" />
                                    <span className="text-[var(--text-muted)] text-xs font-bold">
                                        {language === 'ar' ? 'انتهت' : 'Finished'}
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderEmpty = (label: string) => (
        <div className="text-center py-16 bg-[var(--light-bg)] rounded-[var(--radius-md)] border border-dashed border-[var(--border)]">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--light-bg)] mb-4">
                <Calendar className="text-[var(--text-muted)]" size={28} />
            </div>
            <p className="text-[var(--text-muted)] font-medium">{label}</p>
        </div>
    );

    const tabs = [
        { id: 'coming' as const, label: language === 'ar' ? 'الجلسات القادمة' : 'Coming Sessions', count: comingSessions.length },
        { id: 'ended' as const, label: language === 'ar' ? 'الجلسات المنتهية' : 'Ended Sessions', count: endedSessions.length },
        { id: 'teachers' as const, label: language === 'ar' ? 'معلمي' : 'My Teachers', count: teachers.length },
    ];

    return (
        <div className="space-y-6 animate-fade-in" dir={direction}>
            <h2 className="text-2xl font-bold text-[var(--text-main)]">
                {language === 'ar' ? 'جلساتي' : 'My Sessions'}
            </h2>

            <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--border)] px-4 py-3">
                <button
                    onClick={handleDateClick}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] border transition-colors text-sm ${
                        selectedDate
                            ? 'bg-primary/5 border-primary/20 text-primary font-semibold'
                            : 'bg-[var(--light-bg)] border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                >
                    <Calendar size={18} className={selectedDate ? 'text-primary' : 'text-[var(--text-muted)]'} />
                    <span>
                        {selectedDate
                            ? formatDate(selectedDate, language)
                            : (language === 'ar' ? 'اختر تاريخ' : 'Select Date')
                        }
                    </span>
                </button>
                {selectedDate && (
                    <button
                        onClick={() => setSelectedDate(null)}
                        className="flex items-center gap-1 px-3 py-2 rounded-[var(--radius-md)] border border-red-200 bg-red-50 text-red-600 text-sm hover:bg-red-100 transition-colors ml-2"
                    >
                        <FilterX size={16} />
                        <span className="hidden sm:inline">{language === 'ar' ? 'مسح' : 'Clear'}</span>
                    </button>
                )}
            </div>

            <div className="border-b border-[var(--border)]">
                <div className="flex gap-6 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-[var(--text-muted)] hover:text-navy'
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-[var(--light-bg)] text-[var(--text-muted)]'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-10">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : activeTab === 'teachers' ? (
                teachers.length === 0 ? (
                    renderEmpty(language === 'ar' ? 'لا يوجد معلمون بعد' : 'No teachers yet')
                ) : (
                    <div className="space-y-3">
                        {teachers.map(teacher => {
                            const flag = COUNTRIES.find(c => c.label.toLowerCase() === (teacher.nationality || '').toLowerCase())?.flag || '';
                            return (
                                <div
                                    key={teacher.id}
                                    className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--border)] p-4 flex items-center justify-between hover:shadow-[var(--shadow-md)] transition-shadow"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg overflow-hidden">
                                            {teacher.profile_image ? (
                                                <img src={teacher.profile_image} alt={teacher.name} className="h-full w-full object-cover" />
                                            ) : (
                                                (teacher.name.charAt(0) || '?').toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                {flag && <span className="text-base">{flag}</span>}
                                                <p className="font-semibold text-[var(--text-main)]">{teacher.name}</p>
                                            </div>
                                            {teacher.rating ? (
                                                <div className="flex items-center gap-1 text-xs text-amber-500 mt-0.5">
                                                    <Star size={12} fill="currentColor" />
                                                    <span className="text-[var(--text-muted)] font-medium">{teacher.rating.toFixed(1)}</span>
                                                </div>
                                            ) : teacher.email && (
                                                <p className="text-xs text-[var(--text-muted)] truncate">{teacher.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-primary/5 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                                        {language === 'ar'
                                            ? `${teacher.bookings_count} حجز`
                                            : `${teacher.bookings_count} booking${teacher.bookings_count !== 1 ? 's' : ''}`
                                        }
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (activeTab === 'coming' ? comingSessions : endedSessions).length === 0 ? (
                renderEmpty(
                    activeTab === 'coming'
                        ? (language === 'ar' ? 'لا توجد جلسات قادمة' : 'No coming sessions')
                        : (language === 'ar' ? 'لا توجد جلسات منتهية' : 'No ended sessions')
                )
            ) : (
                <div className="space-y-4">
                    {(activeTab === 'coming' ? comingSessions : endedSessions).map(session => renderSessionCard(session))}
                </div>
            )}

            <SessionRoomModal
                isOpen={!!agoraData}
                onClose={() => { setAgoraData(null); loadSessions(); }}
                agora={agoraData}
            />

            <SessionDetailsModal
                session={selectedSession}
                isOpen={!!selectedSession}
                onClose={() => setSelectedSession(null)}
                onJoinSession={(id) => {
                    setSelectedSession(null);
                    handleJoinSession(id);
                }}
                joining={selectedSession ? joining === selectedSession.id : false}
            />
        </div>
    );
};
