
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Settings, CheckCircle, AlertTriangle, Upload, Save, Loader2, BookOpen, Clock, Globe, Video, Layers, ArrowRight, Lock, Eye, AlertCircle as AlertCircleIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { teacherService, authService, profileService, UserData, getStorageUrl, Service } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';

interface TeacherServicesTabProps {
    onNavigate?: (tab: string) => void;
}

export const TeacherServicesTab: React.FC<TeacherServicesTabProps> = ({ onNavigate }) => {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserData | null>(null);
    const [servicesList, setServicesList] = useState<Service[]>([]);

    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [targetServiceId, setTargetServiceId] = useState<number | null>(null);

    const [lessonPrefs, setLessonPrefs] = useState({
        teach_individual: false,
        individual_hour_price: 0,
        teach_group: false,
        group_hour_price: 0,
        max_group_size: 1
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await authService.getUserDetails();
            const userData = res.user?.data || res.data || res;
            setUser(userData);

            const servicesData = await teacherService.getServicesList();
            setServicesList(Array.isArray(servicesData) ? servicesData : []);

            const profile = userData?.profile;
            if (profile) {
                setLessonPrefs({
                    teach_individual: !!profile.teach_individual,
                    individual_hour_price: profile.individual_hour_price || 0,
                    teach_group: !!profile.teach_group,
                    group_hour_price: profile.group_hour_price || 0,
                    max_group_size: profile.max_group_size || 1
                });
            }
        } catch (e) {
            console.error("Failed to load profile or services", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLessonPrefs = async () => {
        setLoading(true);
        try {
            await teacherService.updateInfo({
                ...lessonPrefs,
                teach_individual: lessonPrefs.teach_individual ? 1 : 0,
                teach_group: lessonPrefs.teach_group ? 1 : 0
            });
            showToast(language === 'ar' ? 'تم حفظ التفضيلات بنجاح' : 'Preferences saved successfully', 'success');
            await loadData();
        } catch (e: any) {
            showToast(e.message || "Failed to save settings", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !targetServiceId) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('certificate', selectedFile);
            formData.append('service_id', String(targetServiceId));
            await profileService.updateProfileFull(formData);
            setUploadModalOpen(false);
            showToast(language === 'ar' ? "تم رفع الشهادة بنجاح" : "Certificate uploaded successfully.", 'success');
            await loadData();
        } catch (e: any) {
            showToast(e.message || "Failed to upload certificate.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const getServiceIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('course')) return <Video size={24} />;
        if (lower.includes('language')) return <Globe size={24} />;
        return <BookOpen size={24} />;
    };

    if (loading && !user) return <div className="p-8 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></div>;

    const isVerified = user?.verified === 1 || user?.verified === true || String(user?.verified) === '1';
    const chosenServiceId = user?.profile?.service;

    // Filter logic: If verified, only show the one verified service card.
    const displayServices = (isVerified && chosenServiceId)
        ? servicesList.filter(s => s.id === chosenServiceId)
        : servicesList;

    return (
        <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Settings className="text-primary" />
                {isVerified ? (language === 'ar' ? 'إعدادات خدمتك' : 'Your Service Settings') : (language === 'ar' ? 'الخدمات والتفضيلات' : 'Services & Preferences')}
            </h2>

            {!isVerified && !chosenServiceId && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800 text-sm mb-6 flex items-start gap-3">
                    <AlertCircleIcon className="flex-shrink-0 mt-0.5" size={18} />
                    <span>Choose a service to specialize in and upload your certificate for verification.</span>
                </div>
            )}

            <div className="grid grid-cols-1 gap-8">
                {displayServices.map((service) => {
                    const serviceName = language === 'ar' ? service.name_ar : service.name_en;
                    const isMyService = chosenServiceId === service.id;

                    return (
                        <div key={service.id} className="rounded-2xl border shadow-sm overflow-hidden bg-white border-slate-200">
                            <div className={`p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50`}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        {getServiceIcon(serviceName)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{serviceName}</h3>
                                        <p className="text-sm text-slate-500">{language === 'ar' ? service.description_ar : service.description_en}</p>
                                    </div>
                                </div>
                                {isMyService && (
                                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {isVerified ? <CheckCircle size={12} /> : <Clock size={12} />}
                                        {isVerified ? 'Verified & Active' : 'Pending Verification'}
                                    </span>
                                )}
                            </div>

                            <div className="p-6">
                                {isVerified && isMyService ? (
                                    <>
                                        {serviceName.toLowerCase().includes('private') && (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <Button variant="outline" onClick={() => onNavigate?.('private-lessons')} className="justify-between group">
                                                        <span className="flex items-center gap-2"><Layers size={18} /> Manage Subjects</span>
                                                        <ArrowRight size={16} />
                                                    </Button>
                                                    <Button variant="outline" onClick={() => onNavigate?.('schedule')} className="justify-between group">
                                                        <span className="flex items-center gap-2"><Clock size={18} /> Manage Availability</span>
                                                        <ArrowRight size={16} />
                                                    </Button>
                                                </div>
                                                <div className="border-t border-slate-100 pt-6">
                                                    <h4 className="font-bold text-slate-800 mb-4">Pricing</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="p-4 bg-slate-50 rounded-xl border">
                                                            <label className="flex items-center justify-between mb-4">
                                                                <span className="font-semibold">Individual Sessions</span>
                                                                <input type="checkbox" checked={lessonPrefs.teach_individual} onChange={(e) => setLessonPrefs({ ...lessonPrefs, teach_individual: e.target.checked })} />
                                                            </label>
                                                            {lessonPrefs.teach_individual && <Input label="Price (SAR)" type="number" value={lessonPrefs.individual_hour_price} onChange={(e) => setLessonPrefs({ ...lessonPrefs, individual_hour_price: Number(e.target.value) })} />}
                                                        </div>
                                                        <div className="p-4 bg-slate-50 rounded-xl border">
                                                            <label className="flex items-center justify-between mb-4">
                                                                <span className="font-semibold">Group Sessions</span>
                                                                <input type="checkbox" checked={lessonPrefs.teach_group} onChange={(e) => setLessonPrefs({ ...lessonPrefs, teach_group: e.target.checked })} />
                                                            </label>
                                                            {lessonPrefs.teach_group && <Input label="Price (SAR)" type="number" value={lessonPrefs.group_hour_price} onChange={(e) => setLessonPrefs({ ...lessonPrefs, group_hour_price: Number(e.target.value) })} />}
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex justify-end">
                                                        <Button onClick={handleSaveLessonPrefs}>Save Preferences</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {serviceName.toLowerCase().includes('course') && (
                                            <Button onClick={() => onNavigate?.('courses')}>Manage Courses catalog</Button>
                                        )}
                                        {serviceName.toLowerCase().includes('language') && (
                                            <Button onClick={() => onNavigate?.('languages')}>Manage Languages</Button>
                                        )}
                                    </>
                                ) : isMyService && !isVerified ? (
                                    <div className="text-center py-6">
                                        <Clock size={40} className="mx-auto text-amber-500 mb-3" />
                                        <h4 className="font-bold">Verification in Progress</h4>
                                        <p className="text-sm text-slate-500 mt-2">Your documents are being reviewed. You will have access once approved.</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <Button onClick={() => { setTargetServiceId(service.id); setUploadModalOpen(true); }}>
                                            <Upload size={18} className="mr-2" /> Specialize in this Service
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Upload Certificate">
                <div className="space-y-4">
                    <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer relative hover:bg-slate-50">
                        <input type="file" className="absolute inset-0 opacity-0" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                        <Upload className="mx-auto mb-2 text-slate-400" />
                        <p className="text-sm font-medium">{selectedFile ? selectedFile.name : "Select academic document"}</p>
                    </div>
                    <Button className="w-full" disabled={!selectedFile} onClick={handleFileUpload} isLoading={loading}>Submit Verification</Button>
                </div>
            </Modal>
        </div>
    );
};
