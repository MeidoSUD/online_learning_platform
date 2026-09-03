import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Plus, Loader2, Calendar, Clock, User, MessageSquare, CheckCircle, XCircle, Briefcase } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { studentService } from '../../Services/api';
import { ConsultationCategoryView } from '../../Utils/types';
import { useToast } from '../../Contexts/ToastContext';

export const ConsultationTab: React.FC = () => {
    const { t, language } = useLanguage();
    const { showToast } = useToast();

    const [categories, setCategories] = useState<ConsultationCategoryView[]>([]);
    const [consultations, setConsultations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitOpen, setSubmitOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        category_id: '',
        title: '',
        description: '',
        preferred_language_id: '',
        education_level_id: '',
        duration_minutes: '60',
        sessions_count: '1',
        budget_max: '',
        slot_date: '',
        slot_start_time: '',
        slot_end_time: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cats, cons] = await Promise.all([
                studentService.getConsultationCategories(),
                studentService.getConsultations(),
            ]);
            setCategories(cats);
            setConsultations(cons);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.category_id || !form.description) {
            showToast('Please select a category and describe your consultation need', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const preferred_slots = form.slot_date && form.slot_start_time && form.slot_end_time
                ? [{
                    date: form.slot_date,
                    start_time: form.slot_start_time,
                    end_time: form.slot_end_time,
                }]
                : null;
            await studentService.createConsultation({
                category_id: Number(form.category_id),
                title: form.title || null,
                description: form.description,
                preferred_slots,
                duration_minutes: Number(form.duration_minutes),
                sessions_count: Number(form.sessions_count),
                budget_max: form.budget_max ? Number(form.budget_max) : null,
            });
            showToast('Consultation request submitted. Our team will review it shortly.', 'success');
            setSubmitOpen(false);
            setForm({ category_id: '', title: '', description: '', preferred_language_id: '', education_level_id: '', duration_minutes: '60', sessions_count: '1', budget_max: '', slot_date: '', slot_start_time: '', slot_end_time: '' });
            await fetchData();
        } catch (e: any) {
            showToast(e.message || 'Failed to submit the request', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const statusLabels: Record<string, string> = {
        pending: language === 'ar' ? 'قيد الانتظار' : 'Pending',
        under_review: language === 'ar' ? 'قيد المراجعة' : 'Under Review',
        assigned: language === 'ar' ? 'تم تعيين معلم' : 'Teacher Assigned',
        scheduled: language === 'ar' ? 'تم تحديد الجلسة' : 'Session Scheduled',
        completed: language === 'ar' ? 'مكتملة' : 'Completed',
        cancelled: language === 'ar' ? 'ملغاة' : 'Cancelled',
        rejected: language === 'ar' ? 'مرفوضة' : 'Rejected',
    };

    const statusStyle = (s: string) => {
        switch (s) {
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'under_review': return 'bg-indigo-100 text-indigo-700';
            case 'assigned': return 'bg-blue-100 text-blue-700';
            case 'scheduled': return 'bg-secondary-pale text-secondary';
            case 'completed': return 'bg-primary-pale text-primary';
            case 'cancelled':
            case 'rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-[var(--light-bg)] text-navy';
        }
    };

    const catName = (id: number) => {
        const cat = categories.find(c => c.id === id);
        return cat ? (language === 'ar' ? cat.name_ar : cat.name_en) : '';
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--text-main)]">
                        {language === 'ar' ? 'الاستشارات' : 'Consultations'}
                    </h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        {language === 'ar'
                            ? 'احصل على استشارة من معلم خبير في الاختبارات الدولية، البحوث، الواجبات والمزيد.'
                            : 'Get one-on-one consultation from an expert teacher on international exams, research, homework and more.'}
                    </p>
                </div>
                <Button onClick={() => setSubmitOpen(true)} className="shadow-[var(--shadow-lg)] shadow-primary/20">
                    <Plus size={18} className="mr-2" /> {language === 'ar' ? 'طلب استشارة' : 'Request Consultation'}
                </Button>
            </div>

            {/* Category cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => {
                            setForm(f => ({ ...f, category_id: String(cat.id) }));
                            setSubmitOpen(true);
                        }}
                        className="p-4 bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all text-left"
                    >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                            <Briefcase size={20} />
                        </div>
                        <p className="font-bold text-[var(--text-main)]">{language === 'ar' ? cat.name_ar : cat.name_en}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                            {language === 'ar' ? cat.description_ar : cat.description_en}
                        </p>
                    </button>
                ))}
                {categories.length === 0 && (
                    <p className="col-span-3 text-center text-sm text-[var(--text-muted)] py-8">
                        No consultation categories available yet.
                    </p>
                )}
            </div>

            {/* My consultations */}
            <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)]">
                    <h3 className="font-bold text-[var(--text-main)]">{language === 'ar' ? 'طلباتي' : 'My Requests'}</h3>
                </div>
                <div className="divide-y divide-[var(--border)]">
                    {consultations.length === 0 ? (
                        <p className="px-6 py-10 text-center text-sm text-[var(--text-muted)]">
                            {language === 'ar' ? 'لا توجد طلبات استشارة بعد.' : 'No consultation requests yet.'}
                        </p>
                    ) : (
                        consultations.map(c => (
                            <div key={c.id} className="px-6 py-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-bold text-[var(--text-main)]">{catName(c.category_id)}</p>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusStyle(c.status)}`}>
                                                {statusLabels[c.status] || c.status}
                                            </span>
                                        </div>
                                        {c.title && <p className="text-sm text-[var(--text-muted)] mt-1">{c.title}</p>}
                                        <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">"{c.description}"</p>
                                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-[var(--text-muted)]">
                                            <span className="flex items-center gap-1"><Clock size={13} /> {c.duration_minutes} min</span>
                                            <span>× {c.sessions_count} session(s)</span>
                                            {c.consultation_reference && <span className="font-mono">#{c.consultation_reference}</span>}
                                        </div>
                                    </div>
                                    <div className="text-left md:text-right space-y-1 text-sm">
                                        {c.teacher ? (
                                            <div className="flex items-center gap-1.5 text-[var(--text-main)]">
                                                <User size={14} className="text-secondary" />
                                                <span>{c.teacher.first_name} {c.teacher.last_name}</span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {language === 'ar' ? 'لم يتم تعيين معلم بعد' : 'No teacher assigned yet'}
                                            </p>
                                        )}
                                        {c.scheduled_date && (
                                            <p className="flex items-center gap-1.5 text-xs text-primary">
                                                <Calendar size={13} /> {c.scheduled_date} @ {c.scheduled_start_time}
                                            </p>
                                        )}
                                        {c.status === 'scheduled' && c.booking && c.booking.sessions && c.booking.sessions.length > 0 && (
                                            <Button size="sm" className="mt-2 !py-1.5 !px-4">
                                                <MessageSquare size={14} className="mr-1" /> Join Online Session
                                            </Button>
                                        )}
                                        {['pending', 'under_review', 'assigned'].includes(c.status) && (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await studentService.cancelConsultation(c.id);
                                                        showToast('Request cancelled', 'success');
                                                        await fetchData();
                                                    } catch (e: any) {
                                                        showToast(e.message || 'Failed to cancel', 'error');
                                                    }
                                                }}
                                                className="text-xs text-red-500 hover:underline mt-1 flex items-center gap-1"
                                            >
                                                <XCircle size={13} /> {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Submit request modal */}
            <Modal isOpen={submitOpen} onClose={() => setSubmitOpen(false)} title={language === 'ar' ? 'طلب استشارة' : 'Request a Consultation'}>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Category</label>
                        <select
                            value={form.category_id}
                            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        >
                            <option value="">Select category...</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{language === 'ar' ? cat.name_ar : cat.name_en}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Title (optional)</label>
                        <input
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g. Help with IELTS writing"
                            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">Describe what you need help with *</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Explain your question, topic or goal..."
                            rows={4}
                            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">Duration</label>
                            <select
                                value={form.duration_minutes}
                                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            >
                                <option value="30">30 min</option>
                                <option value="60">60 min</option>
                                <option value="90">90 min</option>
                                <option value="120">120 min</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">Sessions</label>
                            <select
                                value={form.sessions_count}
                                onChange={(e) => setForm({ ...form, sessions_count: e.target.value })}
                                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            >
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-[var(--text-muted)] block mb-1">Budget (SAR)</label>
                            <input
                                type="number"
                                value={form.budget_max}
                                onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
                                placeholder="Max"
                                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="p-3 bg-[var(--light-bg)] rounded-[var(--radius-md)]">
                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Calendar size={13} /> Preferred time (optional)
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            <input
                                type="date"
                                value={form.slot_date}
                                onChange={(e) => setForm({ ...form, slot_date: e.target.value })}
                                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                            />
                            <input
                                type="time"
                                value={form.slot_start_time}
                                onChange={(e) => setForm({ ...form, slot_start_time: e.target.value })}
                                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                            />
                            <input
                                type="time"
                                value={form.slot_end_time}
                                onChange={(e) => setForm({ ...form, slot_end_time: e.target.value })}
                                className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <Button onClick={handleSubmit} isLoading={submitting} className="w-full">
                        <CheckCircle size={16} className="mr-2" /> {language === 'ar' ? 'إرسال الطلب' : 'Submit Request'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default ConsultationTab;