import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { School, Save, Loader2, Building, ChevronLeft, ChevronRight, Check, Package, Upload, Award, ArrowRight, FileCheck2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { teacherService, authService, UserData } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';
import { getTeacherProfileCompleteness, TeacherCompleteness } from '../../Utils/teacherProfileCompleteness';

interface TeacherServicesTabProps {
    onNavigate?: (tab: string) => void;
}

export const TeacherServicesTab: React.FC<TeacherServicesTabProps> = ({ onNavigate }) => {
    const { t, language, direction } = useLanguage();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [teachSingleLesson, setTeachSingleLesson] = useState(false);
    const [singleLessonPrice, setSingleLessonPrice] = useState('');
    const [priceError, setPriceError] = useState('');
    const [offerPackages, setOfferPackages] = useState(false);
    const [togglingPackages, setTogglingPackages] = useState(false);

    // Completion + services + certificate
    const [completeness, setCompleteness] = useState<TeacherCompleteness>({
        verified: false, hasService: false, serviceKeys: [], missing: [], isComplete: false, canOfferPackages: false,
    });
    const [allServices, setAllServices] = useState<{ id: number, name_en: string, name_ar: string, key_name?: string, description_en?: string, description_ar?: string }[]>([]);
    const [currentServiceIds, setCurrentServiceIds] = useState<number[]>([]);
    const [addingServiceId, setAddingServiceId] = useState<number | null>(null);
    const [certificateFile, setCertificateFile] = useState<File | null>(null);
    const [certificateTitle, setCertificateTitle] = useState('');
    const [uploadingCertificate, setUploadingCertificate] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authService.getUserDetails();
            const userData: UserData = res.user?.data || res.data || res;
            const profile = userData?.profile;
            if (profile) {
                setTeachSingleLesson(!!profile.teach_individual);
                setSingleLessonPrice(
                    profile.individual_hour_price && profile.individual_hour_price > 0
                        ? String(profile.individual_hour_price)
                        : ''
                );
                setOfferPackages(!!profile.package_on_off);
                setCompleteness(getTeacherProfileCompleteness(userData));
            }

            const srv = await teacherService.getTeacherServices();
            const svcData = srv?.data || srv;
            setAllServices(Array.isArray(svcData?.all_services) ? svcData.all_services : []);
            const current = Array.isArray(svcData?.current_services) ? svcData.current_services : [];
            setCurrentServiceIds(current.map((s: any) => s.id).filter((id: any) => !!id));
        } catch (e) {
            console.error("Failed to load profile", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSavePreferences = async () => {
        if (teachSingleLesson) {
            const price = singleLessonPrice.trim();
            if (!price) {
                setPriceError(t.priceRequired);
                return;
            }
            const numPrice = Number(price);
            if (numPrice > 500) {
                setPriceError(t.priceMax500);
                return;
            }
        }
        setPriceError('');
        setIsSaving(true);
        try {
            await teacherService.updateInfo({
                teach_individual: teachSingleLesson ? 1 : 0,
                individual_hour_price: teachSingleLesson ? Number(singleLessonPrice) : 0,
                teach_group: 0,
                group_hour_price: 0,
                max_group_size: 0
            });
            showToast(language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully', 'success');
            await loadData();
        } catch (e: any) {
            showToast(e.message || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddService = async (serviceId: number) => {
        setAddingServiceId(serviceId);
        try {
            await teacherService.addTeacherService({ service_id: serviceId });
            showToast(language === 'ar' ? 'تمت إضافة الخدمة بنجاح' : 'Service added successfully', 'success');
            await loadData();
        } catch (e: any) {
            showToast(e.message || (language === 'ar' ? 'فشلت إضافة الخدمة' : 'Failed to add service'), 'error');
        } finally {
            setAddingServiceId(null);
        }
    };

    const handleUploadCertificate = async () => {
        if (!certificateFile) {
            showToast(language === 'ar' ? 'يرجى اختيار ملف الشهادة أولاً' : 'Please choose a certificate file first', 'error');
            return;
        }
        setUploadingCertificate(true);
        try {
            const formData = new FormData();
            formData.append('certificate', certificateFile);
            if (certificateTitle.trim()) formData.append('title', certificateTitle.trim());
            await teacherService.uploadTeacherCertificate(formData);
            showToast(language === 'ar' ? 'تم رفع الشهادة بنجاح' : 'Certificate uploaded successfully', 'success');
            setCertificateFile(null);
            setCertificateTitle('');
            await loadData();
        } catch (e: any) {
            showToast(e.message || (language === 'ar' ? 'فشل رفع الشهادة' : 'Failed to upload certificate'), 'error');
        } finally {
            setUploadingCertificate(false);
        }
    };

    const handleTogglePackages = async () => {
        const newVal = !offerPackages;
        if (newVal) {
            const { missing, canOfferPackages } = completeness;
            if (!canOfferPackages) {
                const list = missing.map(m => (language === 'ar' ? m.textAr : m.textEn)).join(' • ');
                showToast(
                    (language === 'ar' ? 'لا يمكن تفعيل الحزم حتى تكتمل خطواتك التالية:\n' : 'You cannot enable packages until you complete the following:\n') + list,
                    'error'
                );
                return;
            }
            if (!teachSingleLesson || !Number(singleLessonPrice) || Number(singleLessonPrice) <= 0) {
                showToast(
                    language === 'ar'
                        ? 'فعّل الدروس الفردية وأدخل سعر الساعة ثم احفظ قبل تفعيل الحزم.'
                        : 'Enable individual lessons, set your hourly price, and save before enabling packages.',
                    'error'
                );
                return;
            }
        }
        setOfferPackages(newVal);
        setTogglingPackages(true);
        try {
            await teacherService.togglePackageOnOff(newVal);
            showToast(language === 'ar' ? 'تم التحديث بنجاح' : 'Updated successfully', 'success');
        } catch (e: any) {
            setOfferPackages(!newVal);
            showToast(e.message || t.errorTogglingOffer, 'error');
        } finally {
            setTogglingPackages(false);
        }
    };

    const missing = completeness.missing.filter(m => m.key !== 'verified');
    const needsAttention = missing.length > 0;

    if (loading) {
        return <div className="p-8 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[var(--text-main)]">{t.servicesProvided}</h2>
                {isSaving ? (
                    <Loader2 className="animate-spin text-primary" size={20} />
                ) : (
                    <Button onClick={handleSavePreferences} variant="ghost" className="flex items-center gap-1.5 text-primary">
                        <Save size={18} />
                        <span>{t.saveButton}</span>
                    </Button>
                )}
            </div>

            {/* Profile completion alert */}
            {needsAttention && !dismissed && (
                <div className="bg-amber-50 border border-amber-300 rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-sm)]">
                    <div className="flex items-start gap-3">
                        <Award size={22} className="text-amber-600 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-bold text-amber-800 text-sm">
                                {language === 'ar' ? 'أكمل ملفك الشخصي لتفعيل الحزم' : 'Complete your profile to enable packages'}
                            </h3>
                            <p className="text-xs text-amber-700 mt-1">
                                {language === 'ar'
                                    ? 'الخطوات التالية لا تزال ناقصة:'
                                    : 'The following steps are still incomplete:'}
                            </p>
                            <ul className="mt-2 space-y-1.5">
                                {missing.map(item => (
                                    <li key={item.key} className="flex items-center justify-between gap-3 bg-white/70 rounded-lg px-3 py-2">
                                        <span className="text-xs font-semibold text-amber-800">
                                            {language === 'ar' ? item.textAr : item.textEn}
                                        </span>
                                        {item.lockedBeforeVerification && !completeness.verified ? (
                                            <span className="text-[10px] font-semibold text-amber-500 uppercase">
                                                {language === 'ar' ? 'بعد التوثيق' : 'After verification'}
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => onNavigate?.(item.tab)}
                                                className="text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md px-2 py-1 inline-flex items-center gap-1"
                                            >
                                                {language === 'ar' ? 'اذهب' : 'Go'}
                                                <ArrowRight size={11} className={`${direction === 'rtl' ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            {!completeness.verified && (
                                <p className="mt-2 text-[11px] text-amber-600">
                                    {language === 'ar'
                                        ? 'بعد إتمام ما سبق سيراجع فريق الإدارة حسابك للتوثيق.'
                                        : 'After completing the above, our admin team will review your account for verification.'}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setDismissed(true)}
                            className="text-amber-600/70 hover:text-amber-800 text-xs"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Services I provide */}
            <div className="bg-white rounded-[var(--radius-md)] border border-primary/20 p-5 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-2 mb-4">
                    <School size={22} className="text-primary" />
                    <h3 className="font-bold text-primary text-base">
                        {language === 'ar' ? 'الخدمات التي أقدمها' : 'Services I Provide'}
                    </h3>
                </div>
                {allServices.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">
                        {language === 'ar' ? 'لا توجد خدمات متاحة حالياً.' : 'No services available right now.'}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {allServices.map(svc => {
                            const selected = currentServiceIds.includes(svc.id);
                            return (
                                <div
                                    key={svc.id}
                                    onClick={() => { if (!selected) handleAddService(svc.id); }}
                                    className={`p-4 rounded-[var(--radius-md)] border-2 transition-all ${
                                        selected
                                            ? 'bg-primary/10 border-primary cursor-default'
                                            : 'bg-white border-[var(--border)] cursor-pointer hover:border-primary'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-bold text-[var(--text-main)] text-sm">
                                            {language === 'ar' ? svc.name_ar : svc.name_en}
                                        </p>
                                        <div
                                            className={`shrink-0 h-5 w-5 rounded-md flex items-center justify-center border-2 transition-all ${
                                                selected ? 'bg-primary border-primary' : 'border-[var(--border)]'
                                            }`}
                                        >
                                            {selected && <Check size={12} className="text-white" />}
                                        </div>
                                    </div>
<p className="text-[11px] text-[var(--text-muted)] mt-1 truncate">
                        {language === 'ar' ? svc.description_ar || svc.description_en : svc.description_en || svc.description_ar}
                                    </p>
                                    {addingServiceId === svc.id && (
                                        <Loader2 className="animate-spin text-primary mt-2" size={14} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Certificate upload */}
            <div className="bg-white rounded-[var(--radius-md)] border border-primary/20 p-5 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-2 mb-4">
                    <FileCheck2 size={22} className="text-primary" />
                    <h3 className="font-bold text-primary text-base">
                        {language === 'ar' ? 'الشهادة الأكاديمية' : 'Academic Certificate'}
                    </h3>
                </div>
                {completeness.verified ? (
                    <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 inline-flex items-center gap-2">
                        <Check size={16} /> {language === 'ar' ? 'حسابك موثق' : 'Your account is verified'}
                    </p>
                ) : (
                    <div className="space-y-3">
                        <p className="text-xs text-[var(--text-muted)]">
                            {language === 'ar'
                                ? 'ارفع شهادتك الأكاديمية (PDF أو JPG أو PNG، بحد أقصى 5MB) لتوثيق حسابك من قبل الإدارة.'
                                : 'Upload your academic certificate (PDF, JPG, or PNG, max 5MB) so the admin can verify your account.'}
                        </p>
                        <input
                            type="text"
                            value={certificateTitle}
                            onChange={(e) => setCertificateTitle(e.target.value)}
                            placeholder={language === 'ar' ? 'عنوان الشهادة (اختياري)' : 'Certificate title (optional)'}
                            className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                        <label className="flex items-center gap-3 border-2 border-dashed border-[var(--border)] rounded-[var(--radius-md)] p-4 cursor-pointer hover:border-primary transition-colors">
                            <Upload size={20} className="text-primary shrink-0" />
                            <span className="text-sm text-[var(--text-muted)] truncate">
                                {certificateFile ? certificateFile.name : (language === 'ar' ? 'اختر ملف الشهادة' : 'Choose certificate file')}
                            </span>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                            />
                        </label>
                        <Button onClick={handleUploadCertificate} isLoading={uploadingCertificate} disabled={!certificateFile}>
                            <Upload size={16} className="mr-2" />
                            {language === 'ar' ? 'رفع الشهادة' : 'Upload certificate'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Lesson Preferences Form */}
            <div className="bg-[#F0F5FF] rounded-[var(--radius-md)] border border-primary/20 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <School size={22} className="text-primary" />
                    <h3 className="font-bold text-primary text-base">{t.lessonTypes}</h3>
                </div>

                {/* Individual Lessons Toggle */}
                <div
                    onClick={() => {
                        setTeachSingleLesson(!teachSingleLesson);
                        if (teachSingleLesson) {
                            setSingleLessonPrice('');
                            setPriceError('');
                        }
                    }}
                    className={`flex items-center gap-3 p-3 rounded-[var(--radius-md)] border-2 cursor-pointer transition-all ${
                        teachSingleLesson
                            ? 'bg-primary/10 border-primary'
                            : 'bg-white border-[var(--border)]'
                    }`}
                >
                    <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all ${
                            teachSingleLesson
                                ? 'bg-primary border-primary'
                                : 'border-[var(--border)] bg-transparent'
                        }`}
                    >
                        {teachSingleLesson && <Check size={14} className="text-white" />}
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-[var(--text-main)] text-sm">{t.individualLessons}</p>
                        <p className="text-xs text-[var(--text-muted)]">{t.individualLessonsDesc}</p>
                    </div>
                </div>

                {/* Price Field (animated) */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    teachSingleLesson ? 'max-h-20 opacity-100 mt-3' : 'max-h-0 opacity-0'
                }`}>
                    <div className="relative">
                        <div className={`absolute inset-y-0 ${
                            direction === 'rtl' ? 'right-0 pr-3' : 'left-0 pl-3'
                        } flex items-center pointer-events-none text-primary`}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                        </div>
                        <input
                            type="number"
                            value={singleLessonPrice}
                            onChange={(e) => {
                                setSingleLessonPrice(e.target.value);
                                setPriceError('');
                            }}
                            placeholder="0"
                            className={`w-full rounded-[var(--radius-md)] border bg-white py-3 ${
                                direction === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'
                            } text-[var(--text-main)] shadow-[var(--shadow-sm)] transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none ${
                                priceError ? 'border-red-400' : 'border-[var(--border)]'
                            }`}
                        />
                        <div className={`absolute inset-y-0 ${
                            direction === 'rtl' ? 'left-0 pl-3' : 'right-0 pr-3'
                        } flex items-center pointer-events-none text-[var(--text-muted)] text-sm`}>
                            {t.sar}
                        </div>
                    </div>
                    {priceError && <p className="mt-1 text-xs text-red-500">{priceError}</p>}
                </div>
            </div>

            {/* Packages Toggle */}
            <div className="bg-white rounded-[var(--radius-md)] border border-primary/20 p-4 shadow-[var(--shadow-sm)]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Package size={22} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-[var(--text-main)] text-sm">{t.offerPackages}</p>
                        {!completeness.canOfferPackages && (
                            <p className="text-[11px] text-amber-600 mt-0.5">
                                {language === 'ar'
                                    ? 'يتطلب توثيق الحساب وإكمال الملف (السعر، الأوقات، والمتطلبات حسب الخدمة).'
                                    : 'Requires a verified account and a complete profile (price, time slots, and service-specific items).'}
                            </p>
                        )}
                    </div>
                    {togglingPackages ? (
                        <Loader2 className="animate-spin text-primary" size={20} />
                    ) : (
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={offerPackages}
                                onChange={handleTogglePackages}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    )}
                </div>
            </div>

            {/* Bank Account Shortcut */}
            <div
                onClick={() => onNavigate?.('wallet')}
                className="bg-white rounded-[var(--radius-md)] border border-primary/20 p-4 shadow-[var(--shadow-sm)] cursor-pointer hover:shadow-[var(--shadow-md)] transition-shadow"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Building size={22} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-[var(--text-main)] text-sm">{t.manageBankAccount}</p>
                        <p className="text-xs text-[var(--text-muted)]">{t.forReceivingEarnings}</p>
                    </div>
                    {direction === 'rtl' ? (
                        <ChevronLeft size={16} className="text-[var(--text-muted)]" />
                    ) : (
                        <ChevronRight size={16} className="text-[var(--text-muted)]" />
                    )}
                </div>
            </div>
        </div>
    );
};