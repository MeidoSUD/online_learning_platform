import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Search, Filter, Loader2, User, Calendar, Clock, ChevronRight, CheckCircle, XCircle, Briefcase, Star, MessageSquare, Tag, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { adminService } from '../../Services/api';
import { AdminConsultation, ConsultationCategoryView, ConsultationTeacherOption } from '../../Utils/types';
import { useToast } from '../../Contexts/ToastContext';

export const ConsultationTab: React.FC = () => {
    const { t, direction, language } = useLanguage();
    const { showToast } = useToast();

    const [consultations, setConsultations] = useState<AdminConsultation[]>([]);
    const [categories, setCategories] = useState<ConsultationCategoryView[]>([]);
    const [teachers, setTeachers] = useState<ConsultationTeacherOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [selected, setSelected] = useState<AdminConsultation | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');

    const [showCategories, setShowCategories] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ConsultationCategoryView | null>(null);
    const [categoryForm, setCategoryForm] = useState({ name_en: '', name_ar: '', description_en: '', description_ar: '', is_active: true, sort_order: 0 });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [cons, cats, tchers] = await Promise.all([
                adminService.getConsultations(),
                adminService.getConsultationCategories(),
                adminService.getConsultationTeachers(),
            ]);
            setConsultations(cons as AdminConsultation[]);
            setCategories(cats as ConsultationCategoryView[]);
            setTeachers(tchers as ConsultationTeacherOption[]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const cats = await adminService.getConsultationCategories();
            setCategories(cats as ConsultationCategoryView[]);
        } catch (e) {
            console.error(e);
        }
    };

    const handleViewDetails = (c: AdminConsultation) => {
        setSelected(c);
        setDetailsOpen(true);
    };

    const handleAssign = async () => {
        if (!selected || !selectedTeacherId) return;
        setActionLoading(true);
        try {
            await adminService.assignConsultationTeacher(selected.id, { teacher_id: Number(selectedTeacherId) });
            showToast(t.success, 'success');
            setAssignOpen(false);
            setDetailsOpen(false);
            await fetchAll();
        } catch (e: any) {
            showToast(e.message || t.error, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatus = async (status: string) => {
        if (!selected) return;
        setActionLoading(true);
        try {
            await adminService.updateConsultationStatus(selected.id, { status });
            showToast(t.success, 'success');
            setDetailsOpen(false);
            await fetchAll();
        } catch (e: any) {
            showToast(e.message || t.error, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const openAddCategory = () => {
        setEditingCategory(null);
        setCategoryForm({ name_en: '', name_ar: '', description_en: '', description_ar: '', is_active: true, sort_order: 0 });
        setShowCategories(true);
    };

    const openEditCategory = (cat: ConsultationCategoryView) => {
        setEditingCategory(cat);
        setCategoryForm({
            name_en: cat.name_en,
            name_ar: cat.name_ar,
            description_en: cat.description_en || '',
            description_ar: cat.description_ar || '',
            is_active: cat.is_active,
            sort_order: cat.sort_order,
        });
        setShowCategories(true);
    };

    const saveCategory = async () => {
        setActionLoading(true);
        try {
            if (editingCategory) {
                await adminService.updateConsultationCategory(editingCategory.id, categoryForm);
            } else {
                await adminService.createConsultationCategory(categoryForm);
            }
            showToast(t.success, 'success');
            setShowCategories(false);
            await fetchCategories();
        } catch (e: any) {
            showToast(e.message || t.error, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const deleteCategory = async (cat: ConsultationCategoryView) => {
        setActionLoading(true);
        try {
            await adminService.deleteConsultationCategory(cat.id);
            showToast(t.success, 'success');
            await fetchCategories();
        } catch (e: any) {
            showToast(e.message || t.error, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const filtered = consultations.filter(c => {
        const name = `${c.student.first_name} ${c.student.last_name}`.toLowerCase();
        const term = searchTerm.toLowerCase();
        return (name.includes(term) || String(c.id).includes(term) || c.consultation_reference.toLowerCase().includes(term))
            && (filterStatus === 'all' || c.status === filterStatus);
    });

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

    const catName = (c: AdminConsultation) => (c.category ? (language === 'ar' ? c.category.name_ar : c.category.name_en) : '');

    if (loading && consultations.length === 0) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-[var(--text-main)]">
                    {language === 'ar' ? 'الاستشارات' : 'Consultations'}
                </h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={openAddCategory}>
                        <Tag size={16} className="mr-1" /> {language === 'ar' ? 'الفئات' : 'Categories'}
                    </Button>
                </div>
            </div>
            <p className="text-sm text-[var(--text-muted)] -mt-3">
                {language === 'ar'
                    ? 'مراجعة طلبات الاستشارات، تعيين معلم لكل طلب، وتتبع حتى الجلسة عبر الإنترنت.'
                    : 'Review consultation requests, assign a teacher to each request, and track through to the online session.'}
            </p>

            <div className="bg-white p-4 rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)]">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className={`absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] ${direction === 'rtl' ? 'right-3' : 'left-3'}`} size={20} />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border)] focus:outline-none focus:border-primary ${direction === 'rtl' ? 'pr-10 pl-4' : ''}`}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={20} className="text-[var(--text-muted)]" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-[var(--light-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        >
                            <option value="all">{t.allStatus}</option>
                            <option value="pending">Pending</option>
                            <option value="under_review">Under Review</option>
                            <option value="assigned">Assigned</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--light-bg)] border-b border-[var(--border)]">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-navy">Ref</th>
                                <th className="px-6 py-3 font-semibold text-navy">{t.student}</th>
                                <th className="px-6 py-3 font-semibold text-navy">Category</th>
                                <th className="px-6 py-3 font-semibold text-navy">{language === 'ar' ? 'المعلم' : 'Teacher'}</th>
                                <th className="px-6 py-3 font-semibold text-navy">{t.status}</th>
                                <th className="px-6 py-3 font-semibold text-navy text-right">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">
                                        {language === 'ar' ? 'لا توجد استشارات' : 'No consultations found'}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(c => (
                                    <tr key={c.id} className="hover:bg-[var(--light-bg)]">
                                        <td className="px-6 py-4 font-mono font-bold text-primary text-xs">#{c.consultation_reference}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-[var(--text-main)]">{c.student.first_name} {c.student.last_name}</div>
                                            <div className="text-xs text-[var(--text-muted)]">{c.student.phone_number}</div>
                                        </td>
                                        <td className="px-6 py-4 text-[var(--text-muted)]">{catName(c)}</td>
                                        <td className="px-6 py-4">
                                            {c.teacher ? `${c.teacher.first_name} ${c.teacher.last_name}` : <span className="text-[var(--text-muted)]">—</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyle(c.status)}`}>{c.status}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(c)} className="text-xs py-1 h-8">
                                                {t.details} <ChevronRight size={14} className={direction === 'rtl' ? 'rotate-180' : ''} />
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
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><User size={20} /></div>
                                    <div>
                                        <p className="font-bold text-[var(--text-main)]">{selected.student.first_name} {selected.student.last_name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{selected.student.email}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyle(selected.status)}`}>{selected.status}</span>
                            </div>
                        </div>

                        <div className="p-4 border border-[var(--border)] rounded-[var(--radius-md)] space-y-3">
                            <div className="flex items-center gap-2 text-[var(--text-muted)]">
                                <Briefcase size={16} />
                                <span className="font-bold text-[var(--text-main)]">Category: {catName(selected)}</span>
                            </div>
                            {selected.title && <p className="font-bold text-[var(--text-main)]">{selected.title}</p>}
                            <p className="text-sm text-[var(--text-muted)] leading-relaxed">"{selected.description}"</p>
                            <div className="flex flex-wrap gap-4 text-xs text-[var(--text-muted)]">
                                <span className="flex items-center gap-1"><Clock size={14} /> {selected.duration_minutes} min</span>
                                <span>× {selected.sessions_count} session(s)</span>
                                {selected.budget_min && <span>Budget: {selected.budget_min} - {selected.budget_max} SAR</span>}
                            </div>
                            {selected.preferred_slots && selected.preferred_slots.length > 0 && (
                                <div className="text-xs text-[var(--text-muted)]">
                                    <span className="font-bold flex items-center gap-1 mb-1"><Calendar size={14} /> Preferred times:</span>
                                    {selected.preferred_slots.map((s, i) => (
                                        <div key={i} className="ml-4">{s.date} @ {s.start_time} - {s.end_time}</div>
                                    ))}
                                </div>
                            )}
                            {selected.admin_notes && (
                                <div className="p-3 bg-amber-50 rounded-[var(--radius-md)] text-xs text-amber-800">
                                    <p className="font-bold mb-1 flex items-center gap-1"><MessageSquare size={14} /> Admin notes</p>
                                    {selected.admin_notes}
                                </div>
                            )}
                        </div>

                        {selected.teacher && (
                            <div className="p-4 bg-secondary-pale/50 rounded-[var(--radius-md)] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary"><User size={20} /></div>
                                    <div>
                                        <p className="font-bold text-[var(--text-main)]">{selected.teacher.first_name} {selected.teacher.last_name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">Assigned teacher</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selected.booking_id && (
                            <div className="p-3 bg-primary-pale text-primary rounded-[var(--radius-md)] text-sm flex items-center gap-2">
                                <CheckCircle size={16} /> Online session (Booking #{selected.booking_id}) created
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--border)]">
                            {selected.status === 'pending' && (
                                <Button size="sm" onClick={() => handleStatus('under_review')} disabled={actionLoading}>Mark Under Review</Button>
                            )}
                            {['pending', 'under_review'].includes(selected.status) && (
                                <Button size="sm" variant="outline" onClick={() => { setDetailsOpen(false); setAssignOpen(true); }} disabled={actionLoading}>
                                    Assign Teacher
                                </Button>
                            )}
                            {selected.status === 'assigned' && (
                                <Button size="sm" onClick={() => handleStatus('scheduled')} disabled={actionLoading}>Mark Scheduled</Button>
                            )}
                            {selected.status === 'scheduled' && (
                                <Button size="sm" onClick={() => handleStatus('completed')} disabled={actionLoading}>
                                    <CheckCircle size={16} className="mr-1" /> Mark Completed
                                </Button>
                            )}
                            {['pending', 'under_review', 'assigned', 'scheduled'].includes(selected.status) && (
                                <Button size="sm" variant="danger" onClick={() => handleStatus('cancelled')} disabled={actionLoading}>
                                    <XCircle size={16} className="mr-1" /> {t.cancelled}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Assign teacher modal */}
            <Modal isOpen={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Teacher">
                <div className="space-y-4">
                    <p className="text-sm text-[var(--text-muted)]">
                        Select a teacher to assign to this consultation request. Technical support can use the hourly rate to choose the right fit.
                    </p>
                    <select
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    >
                        <option value="">Select a teacher...</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.first_name} {t.last_name} — {t.hourly_rate} SAR/hr {t.verified ? '(verified)' : ''}
                            </option>
                        ))}
                    </select>
                    {teachers.length === 0 && (
                        <p className="text-xs text-amber-600">No active teachers found. Please add teachers first.</p>
                    )}
                    <Button onClick={handleAssign} isLoading={actionLoading} className="w-full">Confirm Assignment</Button>
                </div>
            </Modal>

            {/* Categories modal */}
            <Modal isOpen={showCategories} onClose={() => setShowCategories(false)} title="Consultation Categories">
                <div className="space-y-6">
                    <div className="p-4 border border-[var(--border)] rounded-[var(--radius-md)] space-y-3">
                        <h4 className="font-bold text-[var(--text-main)]">{editingCategory ? 'Edit Category' : 'Add Category'}</h4>
                        <input
                            value={categoryForm.name_en}
                            onChange={(e) => setCategoryForm({ ...categoryForm, name_en: e.target.value })}
                            placeholder="Name (EN)"
                            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                        <input
                            value={categoryForm.name_ar}
                            onChange={(e) => setCategoryForm({ ...categoryForm, name_ar: e.target.value })}
                            placeholder="Name (AR)"
                            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                        <textarea
                            value={categoryForm.description_en}
                            onChange={(e) => setCategoryForm({ ...categoryForm, description_en: e.target.value })}
                            placeholder="Description (EN)"
                            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            rows={2}
                        />
                        <textarea
                            value={categoryForm.description_ar}
                            onChange={(e) => setCategoryForm({ ...categoryForm, description_ar: e.target.value })}
                            placeholder="Description (AR)"
                            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            rows={2}
                        />
                        <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                            <input
                                type="checkbox"
                                checked={categoryForm.is_active}
                                onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                            />
                            Active
                        </label>
                        <Button onClick={saveCategory} isLoading={actionLoading} className="w-full">{editingCategory ? 'Update' : 'Add'}</Button>
                    </div>

                    <div className="space-y-2">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-[var(--radius-md)]">
                                <div>
                                    <p className="font-bold text-[var(--text-main)] text-sm">{language === 'ar' ? cat.name_ar : cat.name_en}</p>
                                    <p className="text-xs text-[var(--text-muted)]">{cat.consultations_count ?? 0} requests</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEditCategory(cat)} className="p-2 text-[var(--text-muted)] hover:text-primary"><Pencil size={16} /></button>
                                    <button onClick={() => deleteCategory(cat)} className="p-2 text-[var(--text-muted)] hover:text-red-600"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                        {categories.length === 0 && <p className="text-sm text-[var(--text-muted)] text-center py-4">No categories yet.</p>}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ConsultationTab;