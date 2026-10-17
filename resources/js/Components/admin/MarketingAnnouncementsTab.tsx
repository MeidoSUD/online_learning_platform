import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
    Search, Plus, Image as ImageIcon, Link as LinkIcon, Users, Monitor, Smartphone,
    Trash2, Edit, CheckCircle, XCircle, Loader2, ExternalLink, MousePointerClick,
    Eye, Megaphone, Calendar, Sparkles, AlertCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { adminService, MarketingAnnouncement, MarketingAnnouncementPayload } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';

interface StatsState {
    total: number;
    active: number;
    inactive: number;
    target_students: number;
    target_teachers: number;
    total_clicks: number;
    total_views: number;
}

export const MarketingAnnouncementsTab: React.FC = () => {
    const { language, direction } = useLanguage();
    const { showToast } = useToast();

    const [announcements, setAnnouncements] = useState<MarketingAnnouncement[]>([]);
    const [stats, setStats] = useState<StatsState | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [filterPlatform, setFilterPlatform] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form fields
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [buttonText, setButtonText] = useState('سجل الآن');
    const [closeButtonText, setCloseButtonText] = useState('إغلاق');
    const [targetRole, setTargetRole] = useState<'student' | 'teacher' | 'both'>('both');
    const [platform, setPlatform] = useState<'app' | 'web' | 'both'>('both');
    const [isActive, setIsActive] = useState(true);
    const [displayOrder, setDisplayOrder] = useState<number>(0);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [removeImage, setRemoveImage] = useState(false);

    const isAr = language === 'ar';

    const copy = isAr ? {
        title: 'الإعلانات المنبثقة والفعاليات التسويقية',
        subtitle: 'إنشاء وإدارة الإعلانات الترويجية والفعاليات الموجهة للطلاب أو المعلمين في تطبيق الموبايل والويب.',
        addNew: 'إضافة إعلان جديد',
        editAnnouncement: 'تعديل الإعلان التسويقي',
        newAnnouncement: 'إنشاء إعلان تسويقي جديد',
        totalStats: 'إجمالي الإعلانات',
        activeNow: 'نشطة حالياً',
        forStudents: 'موجهة للطلاب',
        forTeachers: 'موجهة للمعلمين',
        totalClicks: 'إجمالي النقرات',
        searchPlaceholder: 'البحث بالعنوان أو الوصف أو الرابط...',
        allRoles: 'كل الأدوار',
        studentsOnly: 'الطلاب فقط',
        teachersOnly: 'المعلمون فقط',
        bothRoles: 'الجميع (طلاب ومعلمون)',
        allPlatforms: 'كل المنصات',
        appOnly: 'تطبيق الموبايل (Flutter)',
        webOnly: 'الموقع الإلكتروني',
        bothPlatforms: 'الموبايل والويب معاً',
        allStatus: 'كل الحالات',
        active: 'نشط',
        inactive: 'غير نشط',
        noData: 'لا توجد إعلانات تطابق البحث الحالي.',
        noDataSub: 'ابدأ بإنشاء إعلان ترويجي أو حدث جديد بالنقر على زر الإضافة أعلاه.',
        fieldTitle: 'عنوان الإعلان أو الفعالية',
        fieldDescription: 'نص وتفاصيل الإعلان',
        fieldLink: 'رابط الإعلان / الفعالية (URL)',
        fieldButtonText: 'نص زر فتح الرابط',
        fieldCloseText: 'نص زر الإغلاق / التخطي',
        fieldTargetRole: 'الجمهور المستهدف',
        fieldPlatform: 'المنصة المعروض عليها',
        fieldImage: 'صورة أو بانر الإعلان (اختياري)',
        fieldDisplayOrder: 'ترتيب الأولوية (الأصغر يظهر أولاً)',
        fieldActive: 'تفعيل الإعلان فور الحفظ',
        save: 'حفظ الإعلان',
        cancel: 'إلغاء',
        testLink: 'تجربة الرابط',
        clicks: 'نقرة',
        views: 'مشاهدة',
        createdSuccess: 'تم إنشاء الإعلان التسويقي بنجاح',
        updatedSuccess: 'تم تحديث الإعلان التسويقي بنجاح',
        deletedSuccess: 'تم حذف الإعلان التسويقي بنجاح',
        toggleSuccess: 'تم تغيير حالة الإعلان بنجاح',
        confirmDelete: 'هل أنت متأكد من حذف هذا الإعلان؟',
        error: 'حدث خطأ أثناء تنفيذ العملية',
        roleBadgeStudent: 'الطلاب',
        roleBadgeTeacher: 'المعلمون',
        roleBadgeBoth: 'الجميع',
    } : {
        title: 'Marketing Popups & Events',
        subtitle: 'Create and manage marketing alerts and event popups for students or teachers across mobile and web.',
        addNew: 'Add New Announcement',
        editAnnouncement: 'Edit Marketing Announcement',
        newAnnouncement: 'Create Marketing Announcement',
        totalStats: 'Total Announcements',
        activeNow: 'Active Now',
        forStudents: 'Target Students',
        forTeachers: 'Target Teachers',
        totalClicks: 'Total Clicks',
        searchPlaceholder: 'Search by title, description or link...',
        allRoles: 'All Audiences',
        studentsOnly: 'Students Only',
        teachersOnly: 'Teachers Only',
        bothRoles: 'Both (Students & Teachers)',
        allPlatforms: 'All Platforms',
        appOnly: 'Mobile App (Flutter)',
        webOnly: 'Web App',
        bothPlatforms: 'Mobile & Web',
        allStatus: 'All Statuses',
        active: 'Active',
        inactive: 'Inactive',
        noData: 'No announcements matching criteria.',
        noDataSub: 'Get started by creating your first promotional announcement above.',
        fieldTitle: 'Announcement / Event Title',
        fieldDescription: 'Text & Event Details',
        fieldLink: 'Target Link URL (Event or Registration)',
        fieldButtonText: 'Action Button Label',
        fieldCloseText: 'Close / Dismiss Button Label',
        fieldTargetRole: 'Target Audience',
        fieldPlatform: 'Display Platform',
        fieldImage: 'Banner / Poster Image (Optional)',
        fieldDisplayOrder: 'Display Priority (Lower shows first)',
        fieldActive: 'Activate immediately upon saving',
        save: 'Save Announcement',
        cancel: 'Cancel',
        testLink: 'Open Link',
        clicks: 'Clicks',
        views: 'Views',
        createdSuccess: 'Marketing announcement created successfully',
        updatedSuccess: 'Marketing announcement updated successfully',
        deletedSuccess: 'Marketing announcement deleted successfully',
        toggleSuccess: 'Status updated successfully',
        confirmDelete: 'Are you sure you want to delete this announcement?',
        error: 'An error occurred during operation',
        roleBadgeStudent: 'Students',
        roleBadgeTeacher: 'Teachers',
        roleBadgeBoth: 'Everyone',
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [list, statsData] = await Promise.all([
                adminService.getMarketingAnnouncements({ all: true }),
                adminService.getMarketingAnnouncementStats().catch(() => null),
            ]);
            setAnnouncements(Array.isArray(list) ? list : []);
            if (statsData) setStats(statsData);
        } catch (e) {
            console.error('Failed to load marketing announcements', e);
            showToast(copy.error, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setLinkUrl('');
        setButtonText(isAr ? 'سجل الآن' : 'Register Now');
        setCloseButtonText(isAr ? 'إغلاق' : 'Close');
        setTargetRole('both');
        setPlatform('both');
        setIsActive(true);
        setDisplayOrder(0);
        setSelectedImage(null);
        setImagePreview(null);
        setRemoveImage(false);
        setCurrentId(null);
        setIsEditing(false);
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: MarketingAnnouncement) => {
        setCurrentId(item.id);
        setTitle(item.title);
        setDescription(item.description);
        setLinkUrl(item.link_url);
        setButtonText(item.button_text || (isAr ? 'سجل الآن' : 'Register Now'));
        setCloseButtonText(item.close_button_text || (isAr ? 'إغلاق' : 'Close'));
        setTargetRole(item.target_role);
        setPlatform(item.platform);
        setIsActive(item.is_active);
        setDisplayOrder(item.display_order || 0);
        setImagePreview(item.image_url || null);
        setSelectedImage(null);
        setRemoveImage(false);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
            setRemoveImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('description', description.trim());
            formData.append('link_url', linkUrl.trim());
            formData.append('button_text', buttonText.trim());
            formData.append('close_button_text', closeButtonText.trim());
            formData.append('target_role', targetRole);
            formData.append('platform', platform);
            formData.append('is_active', isActive ? '1' : '0');
            formData.append('display_order', String(displayOrder));

            if (selectedImage) {
                formData.append('image', selectedImage);
            }
            if (removeImage) {
                formData.append('remove_image', '1');
            }

            if (isEditing && currentId) {
                await adminService.updateMarketingAnnouncement(currentId, formData);
                showToast(copy.updatedSuccess, 'success');
            } else {
                await adminService.createMarketingAnnouncement(formData);
                showToast(copy.createdSuccess, 'success');
            }

            setIsModalOpen(false);
            resetForm();
            loadData();
        } catch (err: any) {
            console.error('Save failed:', err);
            const msg = err?.message || copy.error;
            showToast(msg, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggle = async (item: MarketingAnnouncement) => {
        try {
            await adminService.toggleMarketingAnnouncement(item.id);
            setAnnouncements(prev => prev.map(a => a.id === item.id ? { ...a, is_active: !a.is_active } : a));
            showToast(copy.toggleSuccess, 'success');
        } catch {
            showToast(copy.error, 'error');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(copy.confirmDelete)) return;
        try {
            await adminService.deleteMarketingAnnouncement(id);
            setAnnouncements(prev => prev.filter(a => a.id !== id));
            showToast(copy.deletedSuccess, 'success');
        } catch {
            showToast(copy.error, 'error');
        }
    };

    // Filter announcements
    const filtered = announcements.filter(item => {
        const matchesSearch =
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.link_url.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole =
            filterRole === 'all' ||
            item.target_role === filterRole ||
            (filterRole !== 'both' && item.target_role === 'both');

        const matchesPlatform =
            filterPlatform === 'all' ||
            item.platform === filterPlatform ||
            (filterPlatform !== 'both' && item.platform === 'both');

        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && item.is_active) ||
            (filterStatus === 'inactive' && !item.is_active);

        return matchesSearch && matchesRole && matchesPlatform && matchesStatus;
    });

    return (
        <div className="space-y-6 animate-fade-in p-2 md:p-6" dir={direction}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[var(--border)] shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Megaphone className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{copy.title}</h2>
                            <p className="text-sm text-slate-500 mt-0.5">{copy.subtitle}</p>
                        </div>
                    </div>
                </div>
                <Button onClick={handleOpenCreate} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm">
                    <Plus size={18} /> {copy.addNew}
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 font-medium">{copy.totalStats}</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</h3>
                        </div>
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Sparkles size={20} /></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 font-medium">{copy.activeNow}</p>
                            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</h3>
                        </div>
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={20} /></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 font-medium">{copy.forStudents}</p>
                            <h3 className="text-2xl font-bold text-purple-600 mt-1">{stats.target_students}</h3>
                        </div>
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Users size={20} /></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 font-medium">{copy.forTeachers}</p>
                            <h3 className="text-2xl font-bold text-indigo-600 mt-1">{stats.target_teachers}</h3>
                        </div>
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={20} /></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between col-span-2 md:col-span-1">
                        <div>
                            <p className="text-xs text-slate-500 font-medium">{copy.totalClicks}</p>
                            <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.total_clicks}</h3>
                        </div>
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><MousePointerClick size={20} /></div>
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-sm">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${direction === 'rtl' ? 'right-3' : 'left-3'}`} size={18} />
                        <input
                            type="text"
                            placeholder={copy.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${direction === 'rtl' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Target Role Filter */}
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="all">{copy.allRoles}</option>
                            <option value="student">{copy.studentsOnly}</option>
                            <option value="teacher">{copy.teachersOnly}</option>
                            <option value="both">{copy.bothRoles}</option>
                        </select>

                        {/* Platform Filter */}
                        <select
                            value={filterPlatform}
                            onChange={(e) => setFilterPlatform(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="all">{copy.allPlatforms}</option>
                            <option value="app">{copy.appOnly}</option>
                            <option value="web">{copy.webOnly}</option>
                            <option value="both">{copy.bothPlatforms}</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="all">{copy.allStatus}</option>
                            <option value="active">{copy.active}</option>
                            <option value="inactive">{copy.inactive}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List / Cards */}
            {loading ? (
                <div className="flex justify-center p-16">
                    <Loader2 className="animate-spin text-primary w-8 h-8" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-[var(--border)] shadow-sm space-y-3">
                    <Megaphone className="mx-auto w-12 h-12 text-slate-300" />
                    <h4 className="text-lg font-semibold text-slate-700">{copy.noData}</h4>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">{copy.noDataSub}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((item) => (
                        <div
                            key={item.id}
                            className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-between ${
                                item.is_active ? 'border-slate-200' : 'border-slate-200/60 opacity-75'
                            }`}
                        >
                            <div>
                                {/* Banner / Image Preview */}
                                {item.image_url ? (
                                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden group">
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm ${
                                                item.is_active ? 'bg-emerald-500/90 text-white' : 'bg-slate-500/90 text-white'
                                            }`}>
                                                {item.is_active ? copy.active : copy.inactive}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-28 w-full bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-between px-6 border-b border-amber-100/50">
                                        <div className="flex items-center gap-3 text-amber-700">
                                            <div className="p-2.5 bg-white/80 rounded-xl shadow-xs"><Megaphone size={22} /></div>
                                            <span className="text-xs font-semibold uppercase tracking-wider">{item.target_role}</span>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-xs ${
                                            item.is_active ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {item.is_active ? copy.active : copy.inactive}
                                        </span>
                                    </div>
                                )}

                                <div className="p-5 space-y-3">
                                    {/* Role & Platform Badges */}
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                        <span className={`text-xs px-2.5 py-0.5 rounded-md font-medium ${
                                            item.target_role === 'student' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                            item.target_role === 'teacher' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                            'bg-blue-50 text-blue-700 border border-blue-100'
                                        }`}>
                                            <Users size={12} className="inline ltr:mr-1 rtl:ml-1" />
                                            {item.target_role === 'student' ? copy.roleBadgeStudent :
                                             item.target_role === 'teacher' ? copy.roleBadgeTeacher :
                                             copy.roleBadgeBoth}
                                        </span>

                                        <span className="text-xs px-2.5 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                            {item.platform === 'app' ? (
                                                <><Smartphone size={12} className="inline ltr:mr-1 rtl:ml-1" />{isAr ? 'تطبيق الموبايل' : 'Mobile App'}</>
                                            ) : item.platform === 'web' ? (
                                                <><Monitor size={12} className="inline ltr:mr-1 rtl:ml-1" />{isAr ? 'الويب' : 'Web'}</>
                                            ) : (
                                                <>{isAr ? 'موبايل + ويب' : 'Mobile & Web'}</>
                                            )}
                                        </span>
                                    </div>

                                    {/* Title & Description */}
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">{item.title}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-3 mt-1.5 leading-relaxed">{item.description}</p>
                                    </div>

                                    {/* Action button preview */}
                                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>{isAr ? 'زر الرابط:' : 'Action Button:'} <strong className="text-slate-800">{item.button_text}</strong></span>
                                            <span>{isAr ? 'زر الإغلاق:' : 'Close:'} <strong className="text-slate-600">{item.close_button_text}</strong></span>
                                        </div>

                                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl text-xs">
                                            <span className="truncate max-w-[200px] text-slate-600 font-mono" title={item.link_url}>{item.link_url}</span>
                                            <a
                                                href={item.link_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline flex items-center gap-1 font-medium ml-2"
                                            >
                                                {copy.testLink} <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                                {/* Stats */}
                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1" title={copy.clicks}>
                                        <MousePointerClick size={14} className="text-amber-500" />
                                        <strong>{item.clicks_count || 0}</strong> {copy.clicks}
                                    </span>
                                    <span className="flex items-center gap-1" title={copy.views}>
                                        <Eye size={14} className="text-blue-500" />
                                        <strong>{item.views_count || 0}</strong> {copy.views}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => handleToggle(item)}
                                        title={item.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                                        className={`p-1.5 rounded-lg border transition ${
                                            item.is_active
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                                        }`}
                                    >
                                        <CheckCircle size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleOpenEdit(item)}
                                        className="p-1.5 rounded-lg text-slate-600 hover:text-primary hover:bg-blue-50 border border-slate-200 transition"
                                        title="تعديل"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-100 transition"
                                        title="حذف"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { if (!formLoading) setIsModalOpen(false); }}
                title={isEditing ? copy.editAnnouncement : copy.newAnnouncement}
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            {copy.fieldTitle} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder={isAr ? 'مثال: ورشة تدريبية مجانية للطلاب لتطوير مهارات التحدث' : 'e.g. Free Interactive Workshop for Students'}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            {copy.fieldDescription} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={3}
                            placeholder={isAr ? 'اكتب تفاصيل الإعلان أو الفعالية التي ستظهر للمستخدم في النافذة المنبثقة...' : 'Write announcement content and event highlights...'}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                        />
                    </div>

                    {/* Link URL */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            {copy.fieldLink} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <LinkIcon className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${direction === 'rtl' ? 'right-3' : 'left-3'}`} size={16} />
                            <input
                                type="url"
                                required
                                placeholder="https://example.com/register or /event/123"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                className={`w-full border border-slate-200 rounded-xl py-2.5 text-sm font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none ${direction === 'rtl' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
                            />
                        </div>
                    </div>

                    {/* Buttons labels */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                {copy.fieldButtonText}
                            </label>
                            <input
                                type="text"
                                placeholder={isAr ? 'سجل الآن' : 'Register Now'}
                                value={buttonText}
                                onChange={(e) => setButtonText(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                {copy.fieldCloseText}
                            </label>
                            <input
                                type="text"
                                placeholder={isAr ? 'إغلاق' : 'Close'}
                                value={closeButtonText}
                                onChange={(e) => setCloseButtonText(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Target Audience & Platform */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                {copy.fieldTargetRole} <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value as any)}
                                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                            >
                                <option value="both">{copy.bothRoles}</option>
                                <option value="student">{copy.studentsOnly}</option>
                                <option value="teacher">{copy.teachersOnly}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                                {copy.fieldPlatform} <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value as any)}
                                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                            >
                                <option value="both">{copy.bothPlatforms}</option>
                                <option value="app">{copy.appOnly}</option>
                                <option value="web">{copy.webOnly}</option>
                            </select>
                        </div>
                    </div>

                    {/* Banner Image Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            {copy.fieldImage}
                        </label>
                        <div className="flex items-center gap-4">
                            <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-primary/50 rounded-xl p-4 text-center cursor-pointer transition bg-slate-50/50">
                                <ImageIcon className="mx-auto text-slate-400 mb-1" size={24} />
                                <span className="text-xs text-slate-500">
                                    {selectedImage ? selectedImage.name : (isAr ? 'اضغط لاختيار صورة (PNG, JPG, WebP حتى 5MB)' : 'Click to select image (PNG, JPG, WebP up to 5MB)')}
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </label>

                            {imagePreview && (
                                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedImage(null);
                                            setImagePreview(null);
                                            setRemoveImage(true);
                                        }}
                                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-sm hover:bg-red-700"
                                        title="حذف الصورة"
                                    >
                                        <XCircle size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Display Order & Active */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-semibold text-slate-700">
                                {copy.fieldDisplayOrder}
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={displayOrder}
                                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                                className="w-20 border border-slate-200 rounded-lg px-2.5 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="rounded text-primary focus:ring-primary w-4 h-4"
                            />
                            <span className="text-sm font-medium text-slate-700">{copy.fieldActive}</span>
                        </label>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsModalOpen(false)}
                            disabled={formLoading}
                        >
                            {copy.cancel}
                        </Button>
                        <Button
                            type="submit"
                            disabled={formLoading}
                            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
                        >
                            {formLoading && <Loader2 className="animate-spin" size={16} />}
                            {copy.save}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
