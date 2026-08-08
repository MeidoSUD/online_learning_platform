import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Clock, Users, DollarSign, Calendar, PersonStanding, Loader2, CheckCircle2, Play, X, FilterX } from 'lucide-react';
import { teacherService, Session } from '../../Services/api';
import { SessionDetailsModal } from '../dashboard/SessionDetailsModal';

interface TeacherLessonsTabProps {
    user?: any;
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

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

function getStatusBadge(status: string | undefined, language: string): { label: string; color: string; bg: string } {
    switch (status) {
        case 'live':
        case 'wait_for_teacher':
            return { label: language === 'ar' ? 'نشط' : 'Active', color: 'text-primary', bg: 'bg-primary-pale' };
        case 'scheduled':
            return { label: language === 'ar' ? 'مجدول' : 'Upcoming', color: 'text-orange-700', bg: 'bg-orange-100' };
        case 'ended':
        case 'completed':
            return { label: language === 'ar' ? 'مكتمل' : 'Completed', color: 'text-primary', bg: 'bg-primary-pale' };
        case 'cancelled':
            return { label: language === 'ar' ? 'ملغي' : 'Cancelled', color: 'text-red-600', bg: 'bg-red-100' };
        default:
            return { label: status || (language === 'ar' ? 'غير معروف' : 'Unknown'), color: 'text-[var(--text-muted)]', bg: 'bg-[var(--light-bg)]' };
    }
}

export const TeacherLessonsTab: React.FC<TeacherLessonsTabProps> = ({ user }) => {
    const { language, direction } = useLanguage();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'finished' | 'students'>('active');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedSession, setSelectedSession] = useState<Session | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    const loadSessions = async () => {
        setLoading(true);
        try {
            const data = await teacherService.getTeacherSessions();
            setSessions(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const dateFiltered = selectedDate
        ? sessions.filter(s => s.session_date === selectedDate)
        : sessions;

    const activeSessions = dateFiltered.filter(s => {
        const status = (s.status || '').toLowerCase();
        return ['scheduled', 'live', 'wait_for_teacher', ''].includes(status);
    });

    const finishedSessions = dateFiltered.filter(s => {
        const status = (s.status || '').toLowerCase();
        return ['ended', 'completed', 'cancelled', 'finished'].includes(status);
    });

    const todaySessions = sessions.filter(s => {
        if (!s.session_date) return false;
        const today = new Date();
        const sessionDate = new Date(s.session_date);
        return sessionDate.toDateString() === today.toDateString();
    });

    const todayStudents = new Set(
        todaySessions.filter(s => s.student?.id).map(s => s.student!.id)
    );

    const uniqueStudents: { user: NonNullable<Session['student']>; bookingsCount: number }[] = (() => {
        const map = new Map<number, { user: NonNullable<Session['student']>; bookingsCount: number }>();
        sessions.forEach(s => {
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
    })();

    const openDetailsModal = (session: Session) => {
        setSelectedSession(session);
        setDetailsModalOpen(true);
    };

    const handleStartSession = async (sessionId: number) => {
        try {
            await teacherService.startSession(sessionId);
            loadSessions();
        } catch (e: any) {
            console.error(e);
        }
    };

    const handleDateFilter = () => {
        const input = document.createElement('input');
        input.type = 'date';
        input.onchange = (e: any) => {
            setSelectedDate(e.target.value || null);
        };
        input.click();
    };

    const clearDateFilter = () => {
        setSelectedDate(null);
    };

    const handleDateClick = () => {
        if (selectedDate) {
            clearDateFilter();
        } else {
            handleDateFilter();
        }
    };

    return (
        <div className="space-y-6 animate-fade-in" dir={direction}>
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--text-main)]">
                    {language === 'ar' ? 'دروسي' : 'My Lessons'}
                </h2>
            </div>

            {/* Today's Stats */}
            <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--border)] p-6">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-[var(--text-muted)] font-medium">
                        {language === 'ar' ? 'إحصائيات اليوم' : "Today's Statistics"}
                    </p>
                    <span className="text-xs text-[var(--text-muted)]">
                        {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius-md)] bg-primary/10 text-primary mb-2">
                            <Clock size={22} />
                        </div>
                        <p className="text-2xl font-bold text-[var(--text-main)]">{todaySessions.length}</p>
                        <p className="text-xs text-[var(--text-muted)]">{language === 'ar' ? 'دروس اليوم' : "Today's Lessons"}</p>
                    </div>
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius-md)] bg-orange-100 text-orange-600 mb-2">
                            <Users size={22} />
                        </div>
                        <p className="text-2xl font-bold text-[var(--text-main)]">{todayStudents.size}</p>
                        <p className="text-xs text-[var(--text-muted)]">{language === 'ar' ? 'الطلاب' : 'Students'}</p>
                    </div>
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius-md)] bg-primary-pale text-primary mb-2">
                            <DollarSign size={22} />
                        </div>
                        <p className="text-2xl font-bold text-[var(--text-main)]">0</p>
                        <p className="text-xs text-[var(--text-muted)]">{language === 'ar' ? 'الدخل المتوقع' : 'Expected Income'}</p>
                    </div>
                </div>
            </div>

            {/* Date Filter Header (matching Android SessionFilterHeader) */}
            <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--border)] px-4 py-3">
                <div className="flex items-center gap-3">
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
                                ? formatDate(selectedDate)
                                : (language === 'ar' ? 'اختر تاريخ' : 'Select Date')
                            }
                        </span>
                        {selectedDate && (
                            <X
                                size={16}
                                className="text-red-500 hover:text-red-700 cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); clearDateFilter(); }}
                            />
                        )}
                    </button>

                    {selectedDate && (
                        <button
                            onClick={clearDateFilter}
                            className="flex items-center gap-1 px-3 py-2 rounded-[var(--radius-md)] border border-red-200 bg-red-50 text-red-600 text-sm hover:bg-red-100 transition-colors"
                        >
                            <FilterX size={16} />
                            <span className="hidden sm:inline">{language === 'ar' ? 'مسح' : 'Clear'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs: Active | Finished | Students */}
            <div className="border-b border-[var(--border)]">
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'active'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-[var(--text-muted)] hover:text-navy'
                        }`}
                    >
                        {language === 'ar' ? 'الدروس النشطة' : 'Active Lessons'}
                        {activeSessions.length > 0 && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {activeSessions.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('finished')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'finished'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-[var(--text-muted)] hover:text-navy'
                        }`}
                    >
                        {language === 'ar' ? 'المنتهية' : 'Finished'}
                        {finishedSessions.length > 0 && (
                            <span className="ml-2 text-xs bg-[var(--light-bg)] text-[var(--text-muted)] px-2 py-0.5 rounded-full">
                                {finishedSessions.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'students'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-[var(--text-muted)] hover:text-navy'
                        }`}
                    >
                        {language === 'ar' ? 'الطلاب' : 'Students'}
                        {uniqueStudents.length > 0 && (
                            <span className="ml-2 text-xs bg-[var(--light-bg)] text-[var(--text-muted)] px-2 py-0.5 rounded-full">
                                {uniqueStudents.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            {loading ? (
                <div className="flex justify-center p-10">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : activeTab === 'students' ? (
                /* ===== STUDENTS TAB (matching Android _TeacherStudentsTabContent) ===== */
                uniqueStudents.length === 0 ? (
                    <div className="text-center py-16 bg-[var(--light-bg)] rounded-[var(--radius-md)] border border-dashed border-[var(--border)]">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--light-bg)] mb-4">
                            <Users className="text-[var(--text-muted)]" size={28} />
                        </div>
                        <p className="text-[var(--text-muted)] font-medium">
                            {language === 'ar' ? 'لا يوجد طلاب' : 'No students'}
                        </p>
                        <p className="text-[var(--text-muted)] text-sm mt-1">
                            {language === 'ar' ? 'لا يوجد طلاب لديهم حجوزات' : 'No students with bookings'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {uniqueStudents.map(({ user: student, bookingsCount }) => (
                            <div
                                key={student.id}
                                className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--border)] p-4 flex items-center justify-between hover:shadow-[var(--shadow-md)] transition-shadow"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                        {(student.name || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[var(--text-main)]">{student.name || (language === 'ar' ? 'غير معروف' : 'Unknown')}</p>
                                        {student.email && (
                                            <p className="text-xs text-[var(--text-muted)]">{student.email}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-primary/5 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                                    {language === 'ar'
                                        ? `${bookingsCount} حجز`
                                        : `${bookingsCount} booking${bookingsCount !== 1 ? 's' : ''}`
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                /* ===== ACTIVE / FINISHED TAB ===== */
                (activeTab === 'active' ? activeSessions : finishedSessions).length === 0 ? (
                    <div className="text-center py-16 bg-[var(--light-bg)] rounded-[var(--radius-md)] border border-dashed border-[var(--border)]">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--light-bg)] mb-4">
                            <Clock className="text-[var(--text-muted)]" size={28} />
                        </div>
                        <p className="text-[var(--text-muted)] font-medium">
                            {activeTab === 'active'
                                ? (language === 'ar' ? 'لا توجد دروس نشطة' : 'No active lessons')
                                : (language === 'ar' ? 'لا توجد دروس منتهية' : 'No finished lessons')
                            }
                        </p>
                        <p className="text-[var(--text-muted)] text-sm mt-1">
                            {language === 'ar' ? 'استمتع بيومك!' : 'Enjoy your day!'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {(activeTab === 'active' ? activeSessions : finishedSessions).map((session) => {
                            const badge = getStatusBadge(session.status, language);
                            const subjectName = language === 'ar'
                                ? (session.subject?.name_ar || session.subject?.name_en || '')
                                : (session.subject?.name_en || session.subject?.name_ar || '');

                            return (
                                <div
                                    key={session.id}
                                    onClick={() => openDetailsModal(session)}
                                    className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--border)] overflow-hidden hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer"
                                >
                                    {/* Gradient Time Header - مطابق Android TeacherSessionCard */}
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
                                                    {formatDate(session.session_date)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content - مطابق Android TeacherSessionCard */}
                                    <div className="p-4">
                                        {/* Subject Name + Duration Badge + Status Badge (مطابق Android line 183-262) */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <h3 className="flex-1 text-lg font-bold text-primary truncate">
                                                {subjectName || (language === 'ar' ? 'جلسة' : 'Session')}
                                            </h3>
                                            <div className="flex items-center gap-1.5 bg-secondary-pale border border-secondary/30 rounded-lg px-2.5 py-1">
                                                <Clock size={13} className="text-primary" />
                                                <span className="text-secondary text-xs font-bold">
                                                    {getDuration(session.start_time, session.end_time)}
                                                </span>
                                            </div>
                                            <span className={`${badge.bg} ${badge.color} text-xs font-bold px-2.5 py-1 rounded-lg`}>
                                                {badge.label}
                                            </span>
                                        </div>

                                        {/* Student Info & Actions (مطابق Android line 266-437) */}
                                        <div className="bg-[var(--light-bg)] rounded-[var(--radius-md)] p-3 border border-[var(--border)]">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-secondary-pale flex items-center justify-center shrink-0">
                                                        <PersonStanding className="text-secondary" size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs text-[var(--text-muted)]">
                                                            {language === 'ar' ? 'الطالب' : 'Student'}
                                                        </p>
                                                        <p className="font-semibold text-[var(--text-main)] text-sm truncate">
                                                            {session.student?.name || (language === 'ar' ? 'غير محدد' : 'Unknown')}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Status/Action - مطابق Android lines 312-432 */}
                                                {(session.status === 'ended' || session.status === 'completed') && (
                                                    <div className="flex items-center gap-1 bg-[var(--border)] rounded-lg px-2.5 py-1 shrink-0">
                                                        <CheckCircle2 size={13} className="text-[var(--text-muted)]" />
                                                        <span className="text-[var(--text-muted)] text-xs font-bold">
                                                            {language === 'ar' ? 'منتهية' : 'Finished'}
                                                        </span>
                                                    </div>
                                                )}
                                                {session.status === 'cancelled' && (
                                                    <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1 shrink-0">
                                                        <X size={13} className="text-red-500" />
                                                        <span className="text-red-600 text-xs font-bold">
                                                            {language === 'ar' ? 'ملغية' : 'Cancelled'}
                                                        </span>
                                                    </div>
                                                )}
                                                {(session.status === 'scheduled' || session.status === '') && (
                                                    <div className="flex items-center gap-1 bg-orange-50 border border-orange-300 rounded-lg px-2.5 py-1 shrink-0">
                                                        <Clock size={13} className="text-orange-600" />
                                                        <span className="text-orange-700 text-xs font-bold">
                                                            {language === 'ar' ? 'قادمة' : 'Upcoming'}
                                                        </span>
                                                    </div>
                                                )}
                                                {(session.status === 'live' || session.status === 'wait_for_teacher') && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleStartSession(session.id); }}
                                                        className="flex items-center gap-1 bg-primary hover:bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-[var(--shadow-sm)] transition-colors shrink-0"
                                                    >
                                                        <Play size={13} />
                                                        {language === 'ar' ? 'بدء' : 'Start'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {/* Session Details Modal (مطابق Android LessonDetailsScreen) */}
            <SessionDetailsModal
                session={selectedSession}
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                onStartSession={(id) => {
                    handleStartSession(id);
                    setDetailsModalOpen(false);
                }}
            />
        </div>
    );
};
