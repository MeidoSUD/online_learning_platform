
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { School, Save, Loader2, Building, ChevronLeft, ChevronRight, Check, Package } from 'lucide-react';
import { Button } from '../ui/Button';
import { teacherService, authService, UserData } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';

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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
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
            }
        } catch (e) {
            console.error("Failed to load profile", e);
        } finally {
            setLoading(false);
        }
    };

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
        } catch (e: any) {
            showToast(e.message || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTogglePackages = async () => {
        const newVal = !offerPackages;
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
                    <div className="text-primary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
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
