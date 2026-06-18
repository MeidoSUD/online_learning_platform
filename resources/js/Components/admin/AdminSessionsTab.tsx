import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Video, Loader2, Filter, X, Printer, Calendar as CalendarIcon, User, ChevronRight } from 'lucide-react';
import { adminService } from '../../Services/api';
import { Pagination } from '../ui/Pagination';

interface AdminSession {
    id: number;
    booking_id?: number;
    session_number?: number;
    session_date: string;
    start_time: string;
    end_time: string;
    duration?: number;
    status: string; // 'scheduled', 'live', 'ended', 'cancelled'
    teacher: { id: number; name: string; email?: string };
    student: { id: number; name: string; email?: string };
    subject?: { name_en: string; name_ar: string };
}

export const AdminSessionsTab: React.FC = () => {
    const { t, language, direction } = useLanguage();
    const [sessions, setSessions] = useState<AdminSession[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterTeacher, setFilterTeacher] = useState('');
    const [filterStudent, setFilterStudent] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Modals
    const [makeupModal, setMakeupModal] = useState<{ isOpen: boolean; session: AdminSession | null }>({ isOpen: false, session: null });
    const [userProfileModal, setUserProfileModal] = useState<{ isOpen: boolean; userId: number; role: 'teacher' | 'student'; name: string } | null>(null);

    const [userSessions, setUserSessions] = useState<AdminSession[]>([]);
    const [loadingUserSessions, setLoadingUserSessions] = useState(false);

    // Print ref
    const printRef = useRef<HTMLDivElement>(null);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const data = await adminService.getSessions();
            setSessions(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            // Provide some dummy data for preview if API fails, useful for testing design without backend
            if (sessions.length === 0) {
                 setSessions([
                    { id: 1, session_date: '2026-05-01', start_time: '10:00:00', end_time: '11:00:00', status: 'live', teacher: { id: 10, name: 'Ahmad Teacher' }, student: { id: 20, name: 'Omar Student' } },
                    { id: 2, session_date: '2026-05-02', start_time: '12:00:00', end_time: '13:00:00', status: 'scheduled', teacher: { id: 11, name: 'Sara Teacher' }, student: { id: 21, name: 'Lina Student' } },
                    { id: 3, session_date: '2026-04-28', start_time: '09:00:00', end_time: '10:00:00', status: 'ended', teacher: { id: 10, name: 'Ahmad Teacher' }, student: { id: 22, name: 'Ali Student' } },
                 ]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handlePrint = () => {
        const printContent = printRef.current;
        if (printContent) {
            const originalContent = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContent;
            window.location.reload(); // Reload to restore React state cleanly
        }
    };

    const handleMakeupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!makeupModal.session) return;
        const newDateObj = new Date(makeupModal.session.session_date);
        newDateObj.setDate(newDateObj.getDate() + 7); // Push to next week
        const newDateStr = newDateObj.toISOString().split('T')[0];

        try {
            await adminService.updateSessionDate(makeupModal.session.id, { session_date: newDateStr });
            // Optimistic UI update
            setSessions(prev => prev.map(s => s.id === makeupModal.session?.id ? { ...s, session_date: newDateStr } : s));
            setMakeupModal({ isOpen: false, session: null });
        } catch (error) {
            console.error("Failed to update session date", error);
            alert("Failed to update session. " + error);
        }
    };

    const openUserProfile = async (userId: number, role: 'teacher' | 'student', name: string) => {
        setUserProfileModal({ isOpen: true, userId, role, name });
        setLoadingUserSessions(true);
        try {
            const data = await adminService.getUserSessions(userId, role);
            setUserSessions(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setUserSessions([]);
        } finally {
            setLoadingUserSessions(false);
        }
    };

    const filteredSessions = sessions.filter(session => {
        const matchTeacher = !filterTeacher || session.teacher?.name.toLowerCase().includes(filterTeacher.toLowerCase());
        const matchStudent = !filterStudent || session.student?.name.toLowerCase().includes(filterStudent.toLowerCase());
        const matchDate = !filterDate || session.session_date.startsWith(filterDate);
        const matchStatus = !filterStatus || session.status === filterStatus;
        return matchTeacher && matchStudent && matchDate && matchStatus;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [filterTeacher, filterStudent, filterDate, filterStatus]);

    const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
    const paginatedSessions = filteredSessions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const clearFilters = () => {
        setFilterTeacher('');
        setFilterStudent('');
        setFilterDate('');
        setFilterStatus('');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'live': return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded flex items-center gap-1 animate-pulse"><span className="w-2 h-2 rounded-full bg-red-500"></span> {language === 'ar' ? 'جاري الآن' : 'Live Now'}</span>;
            case 'scheduled': return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">{language === 'ar' ? 'مجدول' : 'Scheduled'}</span>;
            case 'ended': return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded">{language === 'ar' ? 'مكتمل' : 'Ended'}</span>;
            case 'cancelled': return <span className="px-2 py-1 bg-red-50 text-red-600 text-xs font-bold rounded line-through">{language === 'ar' ? 'ملغي' : 'Cancelled'}</span>;
            default: return <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded">{status}</span>;
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Video className="text-primary" size={28} />
                    {language === 'ar' ? 'إدارة الجلسات' : 'Sessions Management'}
                </h2>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                >
                    <Printer size={18} />
                    {language === 'ar' ? 'طباعة / PDF' : 'Print / Save PDF'}
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[150px]">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">{t.teacherName}</label>
                    <input type="text" className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary" placeholder="Search Teacher..." value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)} />
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">{language === 'ar' ? 'اسم الطالب' : 'Student Name'}</label>
                    <input type="text" className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary" placeholder="Search Student..." value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)} />
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">{t.date}</label>
                    <input type="date" className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">{t.status}</label>
                    <select className="w-full p-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary bg-white" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="">{t.allStatus}</option>
                        <option value="live">{language === 'ar' ? 'جاري الآن' : 'Live Now'}</option>
                        <option value="scheduled">{language === 'ar' ? 'مجدول' : 'Scheduled'}</option>
                        <option value="ended">{language === 'ar' ? 'مكتمل' : 'Ended'}</option>
                        <option value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</option>
                    </select>
                </div>
                <button onClick={clearFilters} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Clear Filters"><X size={20} /></button>
            </div>

            {/* Printable Content Container */}
            <div ref={printRef}>
                <div className="print:block hidden mb-6 text-center">
                    <h1 className="text-2xl font-bold mb-2">{language === 'ar' ? 'تقرير الجلسات' : 'Sessions Report'}</h1>
                    <p className="text-sm text-gray-500">{language === 'ar' ? 'تم الإنشاء في' : 'Generated on'} {new Date().toLocaleDateString()}</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-700">{t.status}</th>
                                    <th className="px-6 py-4 font-bold text-slate-700">{t.date}</th>
                                    <th className="px-6 py-4 font-bold text-slate-700">{language === 'ar' ? 'الوقت' : 'Time'}</th>
                                    <th className="px-6 py-4 font-bold text-slate-700">{t.teacher}</th>
                                    <th className="px-6 py-4 font-bold text-slate-700">{language === 'ar' ? 'الطالب' : 'Student'}</th>
                                    <th className="px-6 py-4 font-bold text-slate-700 print:hidden text-right">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedSessions.map(session => (
                                    <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">{getStatusBadge(session.status)}</td>
                                        <td className="px-6 py-4 font-medium text-slate-700">{new Date(session.session_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-slate-600">{session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}</td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => openUserProfile(session.teacher.id, 'teacher', session.teacher.name)}
                                                className="font-semibold text-primary hover:underline flex items-center gap-1"
                                            >
                                                {session.teacher?.name}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => openUserProfile(session.student.id, 'student', session.student.name)}
                                                className="font-semibold text-secondary hover:underline flex items-center gap-1"
                                            >
                                                {session.student?.name}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 print:hidden text-right">
                                            <button 
                                                onClick={() => setMakeupModal({ isOpen: true, session })}
                                                className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs rounded-lg transition-colors border border-blue-100"
                                                title={language === 'ar' ? "تأجيل لمدة 7 أيام" : "Make-up session (Push +7 Days)"}
                                            >
                                                {language === 'ar' ? 'جلسة تعويضية' : 'Make-up Session'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {paginatedSessions.length === 0 && (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-500">{language === 'ar' ? 'لا توجد جلسات' : 'No sessions found'}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            {/* Make-up Session Modal */}
            {makeupModal.isOpen && makeupModal.session && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
                            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                                <CalendarIcon className="text-blue-500" />
                                {language === 'ar' ? 'الجلسة التعويضية' : 'Make-up Session'}
                            </h3>
                            <button onClick={() => setMakeupModal({ isOpen: false, session: null })} className="text-slate-400 hover:text-slate-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                                {language === 'ar' ? (
                                    <>أنت على وشك جدولة جلسة تعويضية للطالب <strong>{makeupModal.session.student.name}</strong> مع المعلم <strong>{makeupModal.session.teacher.name}</strong>. 
                                    هذا سيؤجل الجلسة بمقدار 7 أيام للأمام.</>
                                ) : (
                                    <>You are about to schedule a make-up session for <strong>{makeupModal.session.student.name}</strong> with <strong>{makeupModal.session.teacher.name}</strong>. 
                                    This will move the session exactly 7 days forward.</>
                                )}
                            </p>
                            
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{language === 'ar' ? 'التاريخ الحالي:' : 'Current Date:'}</span>
                                    <span className="font-medium text-slate-900 line-through">{makeupModal.session.session_date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{language === 'ar' ? 'التاريخ الجديد:' : 'New Date:'}</span>
                                    <span className="font-bold text-blue-600">
                                        {(() => {
                                            const d = new Date(makeupModal.session.session_date);
                                            d.setDate(d.getDate() + 7);
                                            return d.toISOString().split('T')[0];
                                        })()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">{language === 'ar' ? 'الوقت:' : 'Time:'}</span>
                                    <span className="font-medium text-slate-900">{makeupModal.session.start_time.substring(0, 5)} - {makeupModal.session.end_time.substring(0, 5)}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setMakeupModal({ isOpen: false, session: null })} className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button onClick={handleMakeupSubmit} className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-colors">
                                    {language === 'ar' ? 'تأكيد النقل' : 'Confirm & Move'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Profile Sessions Modal */}
            {userProfileModal?.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner ${userProfileModal.role === 'teacher' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-slate-900">{userProfileModal.name}</h3>
                                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{userProfileModal.role} Profile</p>
                                </div>
                            </div>
                            <button onClick={() => setUserProfileModal(null)} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 bg-slate-50 border-b border-slate-100 flex gap-6 overflow-x-auto">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-1 min-w-[150px]">
                                <p className="text-sm text-slate-500 font-medium mb-1">{language === 'ar' ? 'إجمالي الجلسات' : 'Total Sessions'}</p>
                                <p className="text-3xl font-bold text-slate-900">{userSessions.length}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-1 min-w-[150px]">
                                <p className="text-sm text-slate-500 font-medium mb-1">{language === 'ar' ? 'مكتملة' : 'Completed'}</p>
                                <p className="text-3xl font-bold text-green-600">{userSessions.filter(s => s.status === 'ended').length}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex-1 min-w-[150px]">
                                <p className="text-sm text-slate-500 font-medium mb-1">{language === 'ar' ? 'مجدولة' : 'Scheduled'}</p>
                                <p className="text-3xl font-bold text-blue-600">{userSessions.filter(s => s.status === 'scheduled').length}</p>
                            </div>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto bg-white">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <CalendarIcon size={18} className="text-slate-400"/> {language === 'ar' ? 'سجل الجلسات' : 'Session History'}
                            </h4>
                            
                            {loadingUserSessions ? (
                                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
                            ) : userSessions.length > 0 ? (
                                <div className="space-y-3">
                                    {userSessions.map(session => (
                                        <div key={session.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl border border-slate-100 hover:border-primary/30 hover:shadow-md transition-all bg-slate-50/50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-12 rounded-full bg-slate-200"></div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{new Date(session.session_date).toLocaleDateString()}</p>
                                                    <p className="text-sm font-medium text-slate-500">{session.start_time.substring(0,5)} - {session.end_time.substring(0,5)}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 mt-3 sm:mt-0 w-full sm:w-auto">
                                                <div className="text-sm text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-100 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                    {userProfileModal.role === 'teacher' ? session.student?.name : session.teacher?.name}
                                                </div>
                                                <div className="ml-auto sm:ml-0">
                                                    {getStatusBadge(session.status)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <Video size={32} className="mx-auto text-slate-300 mb-3" />
                                    <p className="text-slate-500 font-medium">{language === 'ar' ? 'لا توجد جلسات لهذا المستخدم.' : 'No sessions found for this user.'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
