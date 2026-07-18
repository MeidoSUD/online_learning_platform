import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Calendar, Clock, Video, Loader2, Filter, X, ChevronRight, User, School, Search, Star } from 'lucide-react';
import { studentService, Session, getStorageUrl } from '../../Services/api';
import { SessionRoomModal } from '../dashboard/SessionRoomModal';
import { SessionDetailsModal } from './SessionDetailsModal';
import { COUNTRIES } from '../../Utils/constants';

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

export const MySessionsTab: React.FC = () => {
    const { t, direction, language } = useLanguage();
    const [activeTab, setActiveTab] = useState<'active' | 'finished' | 'teachers'>('active');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [teachers, setTeachers] = useState<StudentTeacherInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState('');
    const [agoraData, setAgoraData] = useState<any>(null);
    const [joining, setJoining] = useState<number | null>(null);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [teacherSearch, setTeacherSearch] = useState('');

    useEffect(() => {
        fetchSessions();
        if (activeTab === 'teachers') fetchTeachers();
    }, []);

    useEffect(() => {
        if (activeTab === 'teachers') fetchTeachers();
    }, [activeTab]);

    const fetchSessions = async () => {
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
            // Try to enrich with full teacher data from API
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
                            teacherMap.set(session.teacher.id, {
                                id: session.teacher.id,
                                name: session.teacher.name || `${details?.first_name || ''} ${details?.last_name || ''}`.trim(),
                                first_name: details?.first_name || session.teacher.name.split(' ')[0] || '',
                                last_name: details?.last_name || session.teacher.name.split(' ').slice(1).join(' ') || '',
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
            } else if (response.data?.session_status === 'waiting_for_teacher') {
                alert(language === 'ar'
                    ? 'المعلم لم يبدأ الجلسة بعد، يرجى الانتظار'
                    : 'Teacher hasn\'t started the session yet, please wait');
            } else {
                alert(response.message || (language === 'ar' ? 'لا يمكن الانضمام للجلسة حالياً' : 'Cannot join session at this time'));
            }
        } catch (e: any) {
            alert(e.message || (language === 'ar' ? 'فشل الانضمام للجلسة' : 'Failed to join session'));
        } finally {
            setJoining(null);
        }
    };

    const filteredSessions = sessions.filter(s => {
        const status = (s.status || '').toLowerCase();
        const isActive = status === 'scheduled' || status === 'live' || status === 'wait_for_teacher';
        const isFinished = status === 'ended' || status === 'completed' || status === 'cancelled';

        if (activeTab === 'active' && !isActive) return false;
        if (activeTab === 'finished' && !isFinished) return false;

        if (filterDate) {
            const sessionDate = s.session_date?.split('T')[0]?.split(' ')[0];
            if (sessionDate !== filterDate) return false;
        }
        return true;
    });

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(teacherSearch.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const s = status?.toLowerCase() || '';
        switch (s) {
            case 'live':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-md border border-green-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        {language === 'ar' ? 'مباشر' : 'Live'}
                    </span>
                );
            case 'scheduled':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md border border-blue-200">
                        {language === 'ar' ? 'مجدول' : 'Scheduled'}
                    </span>
                );
            case 'ended':
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md border border-slate-200">
                        {language === 'ar' ? 'منتهي' : 'Ended'}
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-500 text-[10px] font-bold rounded-md border border-red-200 line-through">
                        {language === 'ar' ? 'ملغي' : 'Cancelled'}
                    </span>
                );
            case 'wait_for_teacher':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-md border border-orange-200">
                        {language === 'ar' ? 'انتظار المعلم' : 'Waiting'}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md">
                        {status}
                    </span>
                );
        }
    };

    const getDuration = (start: string, end: string) => {
        if (!start || !end) return '';
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
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const tabs = [
        { id: 'active' as const, label: language === 'ar' ? 'النشطة' : 'Active' },
        { id: 'finished' as const, label: language === 'ar' ? 'المنتهية' : 'Finished' },
        { id: 'teachers' as const, label: language === 'ar' ? 'المعلمون' : 'Teachers' },
    ];

    return (
        <div className="space-y-5 animate-fade-in">
            {/* Header & Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-100">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3.5 text-sm font-bold transition-colors relative ${
                                activeTab === tab.id
                                    ? 'text-primary'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Filter Bar */}
                {activeTab !== 'teachers' && (
                    <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                        <div className="relative flex-1 max-w-xs">
                            <Calendar size={14} className="absolute top-1/2 -translate-y-1/2 text-slate-400 left-3" />
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-primary"
                                placeholder={language === 'ar' ? 'تصفية بالتاريخ' : 'Filter by date'}
                            />
                        </div>
                        {filterDate && (
                            <button
                                onClick={() => setFilterDate('')}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                )}

                {/* Teachers Search */}
                {activeTab === 'teachers' && (
                    <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                        <div className="relative max-w-xs">
                            <Search size={14} className="absolute top-1/2 -translate-y-1/2 text-slate-400 left-3" />
                            <input
                                type="text"
                                value={teacherSearch}
                                onChange={(e) => setTeacherSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-primary"
                                placeholder={language === 'ar' ? 'بحث عن معلم...' : 'Search teacher...'}
                            />
                        </div>
                    </div>
                )}

                {/* Content */}
                {activeTab === 'teachers' ? (
                    <div className="divide-y divide-slate-100">
                        {filteredTeachers.length > 0 ? (
                            filteredTeachers.map(teacher => {
                                const flag = COUNTRIES.find(c => c.label.toLowerCase() === (teacher.nationality || '').toLowerCase())?.flag || '';
                                return (
                                    <div key={teacher.id} className="px-4 py-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                                        <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0 overflow-hidden">
                                            {teacher.profile_image ? (
                                                <img src={getStorageUrl(teacher.profile_image)} alt={teacher.name} className="h-full w-full object-cover" />
                                            ) : (
                                                teacher.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                {flag && <span className="text-base">{flag}</span>}
                                                <p className="font-semibold text-slate-800 text-sm truncate">{teacher.name}</p>
                                            </div>
                                            {teacher.rating ? (
                                                <div className="flex items-center gap-1 text-xs text-amber-500 mt-0.5">
                                                    <Star size={12} fill="currentColor" />
                                                    <span className="text-slate-600 font-medium">{teacher.rating.toFixed(1)}</span>
                                                </div>
                                            ) : teacher.email && (
                                                <p className="text-xs text-slate-400 truncate">{teacher.email}</p>
                                            )}
                                        </div>
                                        <span className="shrink-0 px-3 py-1 bg-primary/5 text-primary text-[10px] font-bold rounded-full border border-primary/10">
                                            {language === 'ar' ? `${teacher.bookings_count} حجز` : `${teacher.bookings_count} booking${teacher.bookings_count !== 1 ? 's' : ''}`}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="py-16 text-center">
                                <School size={40} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-slate-500 text-sm font-medium">
                                    {language === 'ar' ? 'لا يوجد معلمون بعد' : 'No teachers yet'}
                                </p>
                            </div>
                        )}
                    </div>
                ) : loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse rounded-xl border border-slate-100 overflow-hidden">
                                <div className="h-12 bg-slate-200" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                                    <div className="h-10 bg-slate-50 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredSessions.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {filteredSessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => setSelectedSession(session)}
                                className="mx-3 my-3 rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow bg-white cursor-pointer"
                            >
                                {/* Gradient Time Header */}
                                <div className="bg-gradient-to-br from-primary to-blue-600 px-4 py-3 flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-white/20">
                                        <Clock size={16} className="text-white" />
                                    </div>
                                    <span className="text-white text-sm font-extrabold tracking-wide">
                                        {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                    </span>
                                    <div className="ml-auto flex items-center gap-2">
                                        <span className="px-2.5 py-1 rounded-full bg-white/20 border border-white/20 text-white text-[10px] font-semibold flex items-center gap-1">
                                            <Calendar size={10} />
                                            {formatDate(session.session_date)}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    {/* Subject + Duration + Status */}
                                    <div className="flex items-start gap-2 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-base font-bold text-primary truncate">
                                                {session.subject
                                                    ? (language === 'ar' ? session.subject.name_ar : session.subject.name_en)
                                                    : session.booking?.reference || (language === 'ar' ? 'جلسة' : 'Session')}
                                            </h4>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-bold rounded-md border border-primary/10">
                                                <Clock size={10} />
                                                {getDuration(session.start_time, session.end_time) || `${session.duration || 0}min`}
                                            </span>
                                            {getStatusBadge(session.status)}
                                        </div>
                                    </div>

                                    {/* Teacher Info + Action */}
                                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                            <User size={16} className="text-slate-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                                {language === 'ar' ? 'المعلم' : 'Teacher'}
                                            </p>
                                            <p className="text-sm font-semibold text-slate-800 truncate">
                                                {session.teacher?.name || (language === 'ar' ? 'غير معروف' : 'Unknown')}
                                            </p>
                                        </div>
                                        <div className="shrink-0">
                                            {session.status === 'live' ? (
                                                <button
                                                    onClick={() => handleJoinSession(session.id)}
                                                    disabled={joining === session.id}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20 disabled:opacity-50"
                                                >
                                                    {joining === session.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Video size={14} />
                                                    )}
                                                    {language === 'ar' ? 'انضمام' : 'Join'}
                                                </button>
                                            ) : session.status === 'scheduled' ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100">
                                                    <Clock size={12} />
                                                    {language === 'ar' ? 'قادم' : 'Upcoming'}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg">
                                                    <ChevronRight size={12} />
                                                    {language === 'ar' ? 'انتهت' : 'Done'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-center">
                        <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 text-sm font-medium">
                            {activeTab === 'active'
                                ? (language === 'ar' ? 'لا توجد جلسات نشطة' : 'No active sessions')
                                : (language === 'ar' ? 'لا توجد جلسات منتهية' : 'No finished sessions')}
                        </p>
                    </div>
                )}
            </div>

            <SessionRoomModal
                isOpen={!!agoraData}
                onClose={() => { setAgoraData(null); fetchSessions(); }}
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
