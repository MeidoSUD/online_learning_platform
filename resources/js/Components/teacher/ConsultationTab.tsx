import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Loader2, User, Calendar, Clock, ChevronRight, CheckCircle, Briefcase, Video } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { teacherService } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';

export const ConsultationTab: React.FC = () => {
    const { t, language } = useLanguage();
    const { showToast } = useToast();

    const [consultations, setConsultations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<any | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [scheduling, setScheduling] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({ scheduled_date: '', scheduled_start_time: '', scheduled_end_time: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await teacherService.getConsultations();
            setConsultations(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleView = (c: any) => {
        setSelected(c);
        setDetailsOpen(true);
    };

    const openSchedule = () => {
        setScheduleForm({ scheduled_date: '', scheduled_start_time: '', scheduled_end_time: '' });
        setScheduleOpen(true);
    };

    const handleSchedule = async () => {
        if (!selected || !scheduleForm.scheduled_date || !scheduleForm.scheduled_start_time || !scheduleForm.scheduled_end_time) {
            showToast('Please pick a date and time range for the session', 'error');
            return;
        }
        setScheduling(true);
        try {
            await teacherService.scheduleConsultation(selected.id, scheduleForm);
            showToast('Online session created. The student has been notified.', 'success');
            setScheduleOpen(false);
            setDetailsOpen(false);
            await fetchData();
        } catch (e: any) {
            showToast(e.message || 'Failed to schedule the session', 'error');
        } finally {
            setScheduling(false);
        }
    };

    const statusLabels: Record<string, string> = {
        pending: 'Pending',
        under_review: 'Under Review',
        assigned: 'Assigned',
        scheduled: 'Session Scheduled',
        completed: 'Completed',
        cancelled: 'Cancelled',
        rejected: 'Rejected',
    };

    const statusStyle = (s: string) => {
        switch (s) {
            case 'assigned': return 'bg-blue-100 text-blue-700';
            case 'scheduled': return 'bg-secondary-pale text-secondary';
            case 'completed': return 'bg-primary-pale text-primary';
            case 'cancelled':
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-amber-100 text-amber-700';
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-[var(--text-main)]">
                    {language === 'ar' ? 'الاستشارات المُسندة إليك' : 'Consultations Assigned to You'}
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                    {language === 'ar'
                        ? 'راجع طلبات الاستشارة، ثم حدد موعد الجلسة لإنشاء جلسة مباشرة عبر الإنترنت مع الطالب.'
                        : 'Review consultation requests assigned to you, then pick a session time to create the live online session.'}
                </p>
            </div>

            <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="overflow-x-auto min-h-[200px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--light-bg)] border-b border-[var(--border)]">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-navy">Category</th>
                                <th className="px-6 py-3 font-semibold text-navy">{t.student}</th>
                                <th className="px-6 py-3 font-semibold text-navy">{language === 'ar' ? 'الوصف' : 'Description'}</th>
                                <th className="px-6 py-3 font-semibold text-navy">{t.status}</th>
                                <th className="px-6 py-3 font-semibold text-navy text-right">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {consultations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)]">
                                        {language === 'ar' ? 'لا توجد استشارات مسندة إليك حالياً.' : 'No consultations assigned to you yet.'}
                                    </td>
                                </tr>
                            ) : (
                                consultations.map(c => (
                                    <tr key={c.id} className="hover:bg-[var(--light-bg)]">
                                        <td className="px-6 py-4 font-medium text-[var(--text-main)]">
                                            {c.category ? (language === 'ar' ? c.category.name_ar : c.category.name_en) : ''}
                                            <div className="text-xs text-[var(--text-muted)] font-mono mt-0.5">#{c.consultation_reference}</div>
                                        </td>
                                        <td className="px-6 py-4 text-[var(--text-muted)]">{c.student.first_name} {c.student.last_name}</td>
                                        <td className="px-6 py-4 text-[var(--text-muted)] max-w-[240px] truncate">"{c.description}"</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyle(c.status)}`}>
                                                {statusLabels[c.status] || c.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleView(c)} className="text-xs py-1 h-8">
                                                {t.details} <ChevronRight size={14} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details modal */}
            <Modal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} title={`Consultation #${selected?.consultation_reference}`}>
                {selected && (
                    <div className="space-y-6">
                        <div className="p-4 bg-[var(--light-bg)] rounded-[var(--radius-md)] space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><User size={20} /></div>
                                <div>
                                    <p className="font-bold text-[var(--text-main)]">{selected.student.first_name} {selected.student.last_name}</p>
                                    <p className="text-xs text-[var(--text-muted)]">{selected.student.email} · {selected.student.phone_number}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border border-[var(--border)] rounded-[var(--radius-md)] space-y-3">
                            <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                <Briefcase size={16} />
                                <span className="font-bold text-[var(--text-main)]">
                                    {selected.category ? (language === 'ar' ? selected.category.name_ar : selected.category.name_en) : ''}
                                </span>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] leading-relaxed">"{selected.description}"</p>
                            <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
                                <span className="flex items-center gap-1"><Clock size={14} /> {selected.duration_minutes} min</span>
                                <span>× {selected.sessions_count} session(s)</span>
                                {selected.budget_max && <span>Budget up to {selected.budget_max} SAR</span>}
                            </div>
                            {selected.preferred_slots && selected.preferred_slots.length > 0 && (
                                <div className="text-xs text-[var(--text-muted)]">
                                    <span className="font-bold flex items-center gap-1 mb-1"><Calendar size={14} /> Student preferred time:</span>
                                    {selected.preferred_slots.map((s: any, i: number) => (
                                        <div key={i} className="ml-4">{s.date} @ {s.start_time} - {s.end_time}</div>
                                    ))}
                                </div>
                            )}
                            {selected.admin_notes && (
                                <div className="p-3 bg-amber-50 rounded-[var(--radius-md)] text-xs text-amber-800">
                                    <p className="font-bold mb-1">Admin notes</p>
                                    {selected.admin_notes}
                                </div>
                            )}
                        </div>

                        {selected.booking_id ? (
                            <div className="p-4 bg-primary-pale text-primary rounded-[var(--radius-md)] flex items-center gap-2">
                                <Video size={18} /> Online session created (Booking #{selected.booking_id}). You can start it from your lessons list.
                            </div>
                        ) : selected.status === 'assigned' ? (
                            <div className="flex justify-end">
                                <Button onClick={openSchedule}>
                                    <Calendar size={16} className="mr-2" /> Schedule Online Session
                                </Button>
                            </div>
                        ) : null}
                    </div>
                )}
            </Modal>

            {/* Schedule modal */}
            <Modal isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Schedule Online Session">
                <div className="space-y-4">
                    <p className="text-sm text-[var(--text-muted)]">
                        Pick a date and time for the live online session. A booking and an online meeting (Agora) will be created automatically, and the student will be notified.
                    </p>
                    <div>
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Date</label>
                        <input
                            type="date"
                            value={scheduleForm.scheduled_date}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_date: e.target.value })}
                            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Start</label>
                            <input
                                type="time"
                                value={scheduleForm.scheduled_start_time}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_start_time: e.target.value })}
                                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">End</label>
                            <input
                                type="time"
                                value={scheduleForm.scheduled_end_time}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_end_time: e.target.value })}
                                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>
                    <Button onClick={handleSchedule} isLoading={scheduling} className="w-full">
                        <CheckCircle size={16} className="mr-2" /> Create Online Session
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default ConsultationTab;