import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Search, MoreVertical, BookOpen, User, CheckCircle, XCircle, Trash2, Eye, Star, Loader2, Filter } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { adminService, getStorageUrl } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';

interface AdminCourse {
    id: number;
    title: string;
    description: string;
    price: number;
    teacher_id: number;
    category_id: number;
    service_id: number;
    approval_status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: string;
    status: 'published' | 'draft';
    is_featured: boolean;
    image?: string;
    teacher?: {
        first_name: string;
        last_name: string;
    };
    category?: {
        name: string;
    };
}

type CourseStatus = 'published' | 'draft';

export const CoursesTab: React.FC = () => {
    const { t, direction, language } = useLanguage();
    const { showToast } = useToast();
    const [courses, setCourses] = useState<AdminCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<AdminCourse | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [rejectingCourseId, setRejectingCourseId] = useState<number | null>(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const normalizeStatus = (status: unknown): CourseStatus => {
        if (typeof status === 'string') {
            const normalized = status.toLowerCase();
            if (normalized === 'published') return 'published';
            if (normalized === 'draft') return 'draft';
        }
        return 'draft';
    };

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const data = await adminService.getCourses();
            const normalizedCourses: AdminCourse[] = data.map((course: any) => ({
                ...course,
                status: normalizeStatus(course?.status),
            }));
            setCourses(normalizedCourses);
        } catch (e) {
            console.error(e);
            showToast(t.error, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            const response = await adminService.approveCourse(id);
            setCourses(courses.map(c => c.id === id ? { ...c, approval_status: 'approved' } : c));
            setOpenMenuId(null);
            setSelectedCourse(null);
            showToast(response.message || t.updatedSuccessfully, 'success');
        } catch (e) { showToast(t.error, 'error'); }
    };

    const handleReject = async (id: number) => {
        if (!rejectionReason) return showToast(t.provideReason, 'warning');
        try {
            const response = await adminService.rejectCourse(id, rejectionReason);
            setCourses(courses.map(c => c.id === id ? { ...c, approval_status: 'rejected', rejection_reason: rejectionReason } : c));
            setShowRejectionModal(false);
            setRejectionReason('');
            setRejectingCourseId(null);
            setOpenMenuId(null);
            setSelectedCourse(null);
            showToast(response.message || t.updatedSuccessfully, 'success');
        } catch (e) { showToast(t.error, 'error'); }
    };

    const handleToggleStatus = async (id: number) => {
        try {
            const currentCourse = courses.find(c => c.id === id);
            const currentStatus = normalizeStatus(currentCourse?.status);
            const newStatus: CourseStatus = currentStatus === 'published' ? 'draft' : 'published';
            await adminService.updateCourseStatus(id, newStatus);
            setCourses(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
            setOpenMenuId(null);
            showToast(t.updatedSuccessfully, 'success');
        } catch (e) { showToast(t.error, 'error'); }
    };

    const handleToggleFeatured = async (id: number, currentFeatured: boolean) => {
        try {
            await adminService.featureCourse(id, !currentFeatured);
            setCourses(courses.map(c => c.id === id ? { ...c, is_featured: !currentFeatured } : c));
            setOpenMenuId(null);
            showToast(t.updatedSuccessfully, 'success');
        } catch (e) { showToast(t.error, 'error'); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t.confirmAction)) return;
        try {
            await adminService.deleteCourse(id);
            setCourses(courses.filter(c => c.id !== id));
            setOpenMenuId(null);
            showToast(t.deletedSuccessfully, 'success');
        } catch (e) { showToast(t.error, 'error'); }
    };

    const filteredCourses = courses.filter(course => {
        const title = (course.title ?? '').toLowerCase();
        const teacher = `${course.teacher?.first_name ?? ''} ${course.teacher?.last_name ?? ''}`.toLowerCase();
        const term = (searchTerm ?? '').toLowerCase();
        const matchesSearch = title.includes(term) || teacher.includes(term);
        const matchesStatus = filterStatus === 'all' || course.approval_status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in" onClick={() => setOpenMenuId(null)}>
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">{t.manageCourses}</h2>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${direction === 'rtl' ? 'right-3' : 'left-3'}`} size={20} />
                        <input
                            type="text"
                            placeholder={t.phSearchCourses}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary ${direction === 'rtl' ? 'pr-10 pl-4' : ''}`}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={20} className="text-slate-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        >
                            <option value="all">{t.allStatus}</option>
                            <option value="approved">{t.approve}</option>
                            <option value="pending">{t.pending}</option>
                            <option value="rejected">{t.reject}</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-slate-700">{t.course}</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">{t.teacher}</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">{t.category}</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">{t.priceRange.split(' ')[0]}</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">{t.approve}</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">{t.status}</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 text-right">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCourses.map(course => (
                                <tr key={course.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedCourse(course)}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                                                {course.image ? (
                                                    <img src={getStorageUrl(course.image)} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-slate-400">
                                                        <BookOpen size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 line-clamp-1">{course.name}</div>
                                                {course.is_featured ? (
                                                    <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold uppercase">
                                                        <Star size={10} fill="currentColor" /> {t.featured}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase">
                                                        <Star size={10} /> {t.notFeatured}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {course.teacher ? `${course.teacher.first_name} ${course.teacher.last_name}` : t.unknown}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {course.category?.name || t.na}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-primary">
                                        {course.price} {t.sar}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${course.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                                            course.approval_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {course.approval_status === 'approved' ? t.approve : course.approval_status === 'rejected' ? t.reject : t.pending}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`h-2 w-2 rounded-full inline-block mr-2 ${normalizeStatus(course.status) === 'published' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                        {normalizeStatus(course.status) === 'published' ? t.published : t.draft}
                                    </td>
                                    <td className="px-6 py-4 text-right relative">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === course.id ? null : course.id); }}
                                            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"
                                        >
                                            <MoreVertical size={18} />
                                        </button>

                                        {openMenuId === course.id && (
                                            <div className={`absolute z-20 w-48 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 py-1 ${direction === 'rtl' ? 'left-8' : 'right-8'} top-8`}>
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedCourse(course); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                                                    <Eye size={16} /> {t.viewDetails}
                                                </button>

                                                {course.approval_status !== 'approved' && (
                                                    <button onClick={(e) => { e.stopPropagation(); handleApprove(course.id); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-green-600">
                                                        <CheckCircle size={16} /> {t.approve}
                                                    </button>
                                                )}

                                                {course.approval_status !== 'rejected' && (
                                                    <button onClick={(e) => { e.stopPropagation(); setShowRejectionModal(true); setRejectingCourseId(course.id); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-amber-600">
                                                        <XCircle size={16} /> {t.reject}
                                                    </button>
                                                )}

                                                <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(course.id); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-blue-600">
                                                    <Filter size={16} /> {normalizeStatus(course.status) === 'published' ? t.draft : t.published}
                                                </button>

                                                <button onClick={(e) => { e.stopPropagation(); handleToggleFeatured(course.id, course.is_featured); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-amber-500">
                                                    <Star size={16} /> {course.is_featured ? t.removeFeatured : t.markFeatured}
                                                </button>

                                                <div className="border-t border-slate-100 my-1"></div>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-red-600">
                                                    <Trash2 size={16} /> {t.delete}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rejection Modal */}
            <Modal isOpen={showRejectionModal} onClose={() => setShowRejectionModal(false)} title={t.rejectCourse}>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">{t.rejectionReasonLabel}</p>
                    <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder={t.phRejectionReason}
                        className="w-full h-32 p-3 rounded-lg border border-slate-200 focus:outline-none focus:border-primary resize-none"
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => { setShowRejectionModal(false); setRejectingCourseId(null); }}>{t.cancel}</Button>
                        <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => rejectingCourseId && handleReject(rejectingCourseId)}>{t.confirmRejection}</Button>
                    </div>
                </div>
            </Modal>

            {/* Course Details Modal */}
            <Modal isOpen={!!selectedCourse} onClose={() => setSelectedCourse(null)} title={t.details}>
                {selectedCourse && (
                    <div className="space-y-6">
                        <div className="aspect-video w-full rounded-xl bg-slate-100 overflow-hidden">
                            {selectedCourse.image ? (
                                <img src={getStorageUrl(selectedCourse.image)} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-slate-300">
                                    <BookOpen size={48} />
                                </div>
                            )}
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedCourse.title}</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">{selectedCourse.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <span className="block text-xs text-slate-400 mb-1">{t.teacher}</span>
                                <span className="font-bold flex items-center gap-2">
                                    <User size={14} className="text-primary" />
                                    {selectedCourse.teacher?.first_name} {selectedCourse.teacher?.last_name}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <span className="block text-xs text-slate-400 mb-1">{t.priceRange.split(' ')[0]}</span>
                                <span className="font-bold text-primary">{selectedCourse.price} {t.sar}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <span className="block text-xs text-slate-400 mb-1">{t.category}</span>
                                <span className="font-bold">{selectedCourse.category?.name || t.na}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <span className="block text-xs text-slate-400 mb-1">{t.approve}</span>
                                <span className={`font-bold capitalize ${selectedCourse.approval_status === 'approved' ? 'text-green-600' :
                                    selectedCourse.approval_status === 'rejected' ? 'text-red-600' : 'text-amber-600'
                                    }`}>
                                    {selectedCourse.approval_status === 'approved' ? t.approve : selectedCourse.approval_status === 'rejected' ? t.reject : t.pending}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <span className="block text-xs text-slate-400 mb-1">{t.featured}</span>
                                <span className={`font-bold flex items-center gap-1 ${selectedCourse.is_featured ? 'text-amber-600' : 'text-slate-400'}`}>
                                    <Star size={14} fill={selectedCourse.is_featured ? 'currentColor' : 'none'} />
                                    {selectedCourse.is_featured ? t.featured : t.notFeatured}
                                </span>
                            </div>
                        </div>

                        {selectedCourse.approval_status === 'rejected' && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                <span className="block text-xs text-red-500 mb-1 font-semibold">{t.rejectionReason || 'سبب الرفض'}</span>
                                <p className="text-sm text-red-700">{selectedCourse.rejection_reason || 'لا يوجد سبب محدد'}</p>
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            {selectedCourse.approval_status !== 'approved' && (
                                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(selectedCourse.id)}>
                                    {t.approve} {t.course}
                                </Button>
                            )}
                            <Button variant="outline" className="flex-1" onClick={() => setSelectedCourse(null)}>
                                {t.close}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
