import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Search, MoreVertical, Plus, Image as ImageIcon, Link as LinkIcon, Users, Monitor, Trash2, Edit, CheckCircle, XCircle, Loader2, Filter, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { adminService, getStorageUrl, Ad, AdPayload } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';

export const AdsTab: React.FC = () => {
    const { t, direction, language } = useLanguage();
    const { showToast } = useToast();
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPlatform, setFilterPlatform] = useState<string>('all');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentAd, setCurrentAd] = useState<Ad | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<AdPayload>>({
        platform: 'both',
        role_id: null,
        description: '',
        link_url: '',
        cta_text: '',
        display_order: 0
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        fetchAds();
    }, []);

    const fetchAds = async () => {
        setLoading(true);
        try {
            const data = await adminService.getAds();
            setAds(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const resetForm = () => {
        setFormData({
            platform: 'both',
            role_id: null,
            description: '',
            link_url: '',
            cta_text: '',
            display_order: 0
        });
        setSelectedImage(null);
        setImagePreview(null);
        setIsEditing(false);
        setCurrentAd(null);
    };

    const handleEdit = (ad: Ad) => {
        setCurrentAd(ad);
        setFormData({
            platform: ad.platform,
            role_id: ad.role_id,
            description: ad.description || '',
            link_url: ad.link_url || '',
            cta_text: ad.cta_text || '',
            display_order: ad.display_order || 0
        });
        setImagePreview(ad.image_url);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            const data = new FormData();
            if (selectedImage) data.append('image', selectedImage);
            if (formData.description) data.append('description', formData.description);
            if (formData.platform) data.append('platform', formData.platform);

            // Only append role_id if it's NOT null (null is default/all)
            if (formData.role_id !== null && formData.role_id !== undefined) {
                data.append('role_id', String(formData.role_id));
            }

            if (formData.link_url) data.append('link_url', formData.link_url);
            if (formData.cta_text) data.append('cta_text', formData.cta_text);
            if (formData.display_order !== undefined) data.append('display_order', String(formData.display_order));

            if (isEditing && currentAd) {
                // Many backends require _method='PUT' when using POST for multipart updates
                data.append('_method', 'PUT');
                await adminService.updateAd(currentAd.id, data);
                showToast(t.adUpdatedSuccess, 'success');
            } else {
                if (!selectedImage) {
                    showToast(t.required + " (Image)", 'error');
                    setFormLoading(false);
                    return;
                }
                await adminService.createAd(data);
                showToast(t.adCreatedSuccess, 'success');
            }

            setIsModalOpen(false);
            resetForm();
            fetchAds();
        } catch (e: any) {
            console.error("Ad operation failed:", e);
            const errorMsg = e.errors ? Object.values(e.errors).flat().join(', ') : (e.message || t.error);
            showToast(errorMsg, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggle = async (ad: Ad) => {
        try {
            await adminService.toggleAd(ad.id);
            setAds(ads.map(a => a.id === ad.id ? { ...a, is_active: !a.is_active } : a));
            showToast(t.updatedSuccessfully, 'success');
        } catch (e) {
            showToast(t.error, 'error');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t.confirmDeleteAd)) return;
        try {
            await adminService.deleteAd(id);
            setAds(ads.filter(a => a.id !== id));
            showToast(t.deletedSuccessfully, 'success');
        } catch (e) {
            showToast(t.error, 'error');
        }
    };

    const filteredAds = ads.filter(ad => {
        const desc = (ad.description ?? '').toLowerCase();
        const term = searchTerm.toLowerCase();
        const matchesSearch = desc.includes(term);
        const matchesPlatform = filterPlatform === 'all' || ad.platform === filterPlatform;
        return matchesSearch && matchesPlatform;
    });

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">{t.adsManagement}</h2>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2">
                    <Plus size={20} /> {t.uploadAd}
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
                            value={filterPlatform}
                            onChange={(e) => setFilterPlatform(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        >
                            <option value="all">{t.allStatus}</option>
                            <option value="web">{t.web}</option>
                            <option value="app">{t.app}</option>
                            <option value="both">{t.both}</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-slate-700">{t.image}</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">{t.targetRole}</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">{t.platform}</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">{t.displayOrder}</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">{t.status}</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 text-right">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAds.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        {t.noAdsFound}
                                    </td>
                                </tr>
                            ) : (
                                filteredAds.map(ad => (
                                    <tr key={ad.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-20 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                                    <img src={ad.image_url} alt="" className="h-full w-full object-cover" />
                                                </div>
                                                <div className="max-w-[200px]">
                                                    <div className="font-medium text-slate-900 line-clamp-1">{ad.description || t.na}</div>
                                                    {ad.link_url && (
                                                        <div className="text-[10px] text-primary flex items-center gap-1">
                                                            <LinkIcon size={10} /> {ad.link_url}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className="text-slate-400" />
                                                {ad.role_id === 3 ? t.teacher : ad.role_id === 4 ? t.student : t.allUsers}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Monitor size={16} className="text-slate-400" />
                                                {ad.platform === 'both' ? t.both : ad.platform === 'web' ? t.web : t.app}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {ad.display_order}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggle(ad)}
                                                className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${ad.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                                            >
                                                {ad.is_active ? t.active : t.inactiveStatus}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(ad)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(ad.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
            </div>

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title={isEditing ? t.editAd : t.uploadAd}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        {/* Image Upload */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">{t.image} *</label>
                            <div
                                onClick={() => document.getElementById('ad-image-input')?.click()}
                                className="aspect-[16/9] w-full border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 cursor-pointer overflow-hidden relative"
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <>
                                        <ImageIcon size={48} className="text-slate-300 mb-2" />
                                        <span className="text-xs text-slate-400">Click to upload image</span>
                                    </>
                                )}
                                <input id="ad-image-input" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700">{t.description}</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary text-sm"
                                placeholder="Enter ad description..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Platform */}
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">{t.platform} *</label>
                                <select
                                    value={formData.platform}
                                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary text-sm"
                                >
                                    <option value="both">{t.both}</option>
                                    <option value="web">{t.web}</option>
                                    <option value="app">{t.app}</option>
                                </select>
                            </div>

                            {/* Target Role */}
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">{t.targetRole}</label>
                                <select
                                    value={formData.role_id === null ? '' : String(formData.role_id)}
                                    onChange={(e) => setFormData({ ...formData, role_id: e.target.value === '' ? null : Number(e.target.value) })}
                                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary text-sm"
                                >
                                    <option value="">{t.allUsers}</option>
                                    <option value="4">{t.student}</option>
                                    <option value="3">{t.teacher}</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Link URL */}
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">{t.linkUrl}</label>
                                <input
                                    type="url"
                                    value={formData.link_url}
                                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary text-sm"
                                    placeholder="https://..."
                                />
                            </div>

                            {/* CTA Text */}
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">{t.ctaText}</label>
                                <input
                                    type="text"
                                    value={formData.cta_text}
                                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary text-sm"
                                    placeholder="Learn More"
                                />
                            </div>
                        </div>

                        {/* Display Order */}
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-slate-700">{t.displayOrder}</label>
                            <input
                                type="number"
                                value={formData.display_order}
                                onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-primary text-sm"
                            />
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
