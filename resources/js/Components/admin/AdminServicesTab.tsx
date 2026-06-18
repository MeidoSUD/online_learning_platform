import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Search, Plus, Trash2, Edit, Loader2, Filter, Package, UserCheck, ToggleLeft, ToggleRight, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Pagination } from '../ui/Pagination';
import { adminService } from '../../Services/api';
import { AdminService } from '../../Utils/types';
import { useToast } from '../../Contexts/ToastContext';

export const AdminServicesTab: React.FC = () => {
    const { t, direction, language } = useLanguage();
    const { showToast } = useToast();
    const [services, setServices] = useState<AdminService[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentService, setCurrentService] = useState<AdminService | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<AdminService>>({
        name_en: '',
        name_ar: '',
        description_en: '',
        description_ar: '',
        role_id: 3,
        status: 1
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const data = await adminService.getAdminServices();
            setServices(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const resetForm = () => {
        setFormData({
            name_en: '',
            name_ar: '',
            description_en: '',
            description_ar: '',
            role_id: 3,
            status: 1
        });
        setLogoFile(null);
        setLogoPreview(null);
        setIsEditing(false);
        setCurrentService(null);
    };

    const handleEdit = (service: AdminService) => {
        setCurrentService(service);
        setFormData({
            name_en: service.name_en,
            name_ar: service.name_ar,
            description_en: service.description_en,
            description_ar: service.description_ar,
            role_id: Number(service.role_id),
            status: Number(service.status)
        });
        // Backend now returns full URLs, use image field directly
        setLogoPreview(service.image || null);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            const data = new FormData();
            if (logoFile) data.append('icon', logoFile);  // backend field name is 'icon'
            data.append('name_en', formData.name_en || '');
            data.append('name_ar', formData.name_ar || '');
            data.append('description_en', formData.description_en || '');
            data.append('description_ar', formData.description_ar || '');
            data.append('role_id', String(formData.role_id || 3));
            data.append('status', String(formData.status || 1));

            if (isEditing && currentService) {
                await adminService.updateService(currentService.id, data);
                showToast(t.success, 'success');
            } else {
                await adminService.createService(data);
                showToast(t.success, 'success');
            }

            setIsModalOpen(false);
            resetForm();
            fetchServices();
        } catch (e: any) {
            console.error("Service operation failed:", e);
            const errorMsg = e.errors ? Object.values(e.errors).flat().join(', ') : (e.message || t.error);
            showToast(errorMsg, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggleStatus = async (service: AdminService) => {
        try {
            const newStatus = Number(service.status) === 1 ? 0 : 1;
            await adminService.updateService(service.id, { status: newStatus });
            setServices(services.map(s => s.id === service.id ? { ...s, status: newStatus } : s));
            showToast(t.success, 'success');
        } catch (e) {
            showToast(t.error, 'error');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t.confirmAction)) return;
        try {
            await adminService.deleteService(id);
            setServices(services.filter(s => s.id !== id));
            showToast(t.success, 'success');
        } catch (e) {
            showToast(t.error, 'error');
        }
    };

    const filteredServices = services.filter(service => {
        const nameEn = (service.name_en ?? '').toLowerCase();
        const nameAr = (service.name_ar ?? '').toLowerCase();
        const term = searchTerm.toLowerCase();
        const matchesSearch = nameEn.includes(term) || nameAr.includes(term);
        const matchesStatus = filterStatus === 'all' || String(service.status) === filterStatus;
        return matchesSearch && matchesStatus;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus]);

    const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
    const paginatedServices = filteredServices.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">{t.servicesManagement}</h2>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2">
                    <Plus size={20} /> {t.create}
                </Button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${direction === 'rtl' ? 'right-3' : 'left-3'}`} size={20} />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
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
                            <option value="1">{t.active}</option>
                            <option value="0">{t.inactiveStatus}</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-slate-700">{t.name}</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">{t.role}</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">{t.status}</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 text-right">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedServices.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                        {t.noResults}
                                    </td>
                                </tr>
                            ) : (
                                paginatedServices.map(service => (
                                    <tr key={service.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center">
                                                    {service.image ? (
                                                        <img src={service.image} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Package size={20} className="text-primary" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{service.name_en}</div>
                                                    <div className="text-xs text-slate-500 font-arabic">{service.name_ar}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <UserCheck size={16} className="text-slate-400" />
                                                {Number(service.role_id) === 3 ? t.teacher : t.student}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(service)}
                                                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all ${Number(service.status) === 1 ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                            >
                                                {Number(service.status) === 1 ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                                {Number(service.status) === 1 ? t.active : t.inactiveStatus}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(service)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(service.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
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

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title={isEditing ? t.update : t.create}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700">{t.nameEn} *</label>
                            <input
                                type="text"
                                required
                                value={formData.name_en}
                                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary text-sm"
                                placeholder="Service Name (English)"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700">{t.nameAr} *</label>
                            <input
                                type="text"
                                required
                                value={formData.name_ar}
                                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary text-sm text-right"
                                placeholder="..."
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">{t.image} ({t.serviceLogo})</label>
                        <div
                            onClick={() => document.getElementById('service-logo-input')?.click()}
                            className="aspect-square w-32 h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 cursor-pointer overflow-hidden relative mx-auto"
                        >
                            {logoPreview ? (
                                <img src={logoPreview} className="w-full h-full object-cover" alt="Logo Preview" />
                            ) : (
                                <>
                                    <ImageIcon size={32} className="text-slate-300 mb-1" />
                                    <span className="text-[10px] text-slate-400">Click to upload</span>
                                </>
                            )}
                            <input id="service-logo-input" type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">{language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</label>
                        <textarea
                            value={formData.description_en}
                            onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                            className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary text-sm min-h-[80px]"
                            placeholder="Brief description in English..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-slate-700">{language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</label>
                        <textarea
                            value={formData.description_ar}
                            onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                            className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary text-sm min-h-[80px] text-right"
                            placeholder="..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700">{t.role} *</label>
                            <select
                                value={String(formData.role_id || 3)}
                                onChange={(e) => setFormData({ ...formData, role_id: Number(e.target.value) })}
                                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary text-sm"
                            >
                                <option value="3">{t.teacher}</option>
                                <option value="4">{t.student}</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700">{t.status} *</label>
                            <select
                                value={String(formData.status ?? 1)}
                                onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary text-sm"
                            >
                                <option value="1">{t.active}</option>
                                <option value="0">{t.inactiveStatus}</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button variant="outline" className="flex-1" type="button" onClick={() => { setIsModalOpen(false); resetForm(); }}>{t.cancel}</Button>
                        <Button className="flex-1" type="submit" disabled={formLoading}>
                            {formLoading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : isEditing ? t.save : t.create}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminServicesTab;
