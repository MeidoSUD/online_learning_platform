
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { ChevronRight, Plus, Trash2, Edit2, Loader2, RotateCcw, AlertCircle, Save, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { adminService } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';

interface EducationLevel {
    id: number;
    name_en: string;
    name_ar: string;
    description?: string;
    status: number;
    deleted_at: string | null;
}

interface ClassEntity {
    id: number;
    education_level_id: number;
    name_en: string;
    name_ar: string;
    status: number;
    deleted_at: string | null;
}

interface Subject {
    id: number;
    class_id: number;
    education_level_id: number;
    service_id: number;
    name_en: string;
    name_ar: string;
    status: number;
    deleted_at: string | null;
}

export const EducationTab: React.FC = () => {
    const { t, direction, language } = useLanguage();
    const { showToast } = useToast();

    const [levels, setLevels] = useState<EducationLevel[]>([]);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [services, setServices] = useState<{id: number; name_en: string; name_ar: string}[]>([]);

    const [loadingLevels, setLoadingLevels] = useState(false);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    const [activeLevel, setActiveLevel] = useState<number | null>(null);
    const [activeClass, setActiveClass] = useState<number | null>(null);

    // Modal States
    const [modal, setModal] = useState<{
        isOpen: boolean;
        type: 'level' | 'class' | 'subject';
        data: any;
        isEditing: boolean;
    }>({ isOpen: false, type: 'level', data: {}, isEditing: false });

    useEffect(() => {
        fetchLevels();
    }, []);

    useEffect(() => {
        if (activeLevel) {
            fetchClasses(activeLevel);
        } else {
            setClasses([]);
            setActiveClass(null);
        }
    }, [activeLevel]);

    useEffect(() => {
        if (activeClass) {
            fetchSubjects(activeClass);
        } else {
            setSubjects([]);
        }
    }, [activeClass]);

    const fetchLevels = async () => {
        setLoadingLevels(true);
        try {
            const data = await adminService.getEducationLevels({ include_deleted: 1 });
            setLevels(data || []);
        } catch (e) {
            showToast("Failed to load levels", 'error');
        } finally {
            setLoadingLevels(false);
        }
    };

    const fetchClasses = async (levelId: number) => {
        setLoadingClasses(true);
        try {
            const data = await adminService.getClasses({ education_level_id: levelId, include_deleted: 1 });
            setClasses(data || []);
        } catch (e) {
            showToast("Failed to load classes", 'error');
        } finally {
            setLoadingClasses(false);
        }
    };

    const fetchSubjects = async (classId: number) => {
        setLoadingSubjects(true);
        try {
            const data = await adminService.getSubjects({ class_id: classId, include_deleted: 1 });
            setSubjects(data || []);
        } catch (e) {
            showToast("Failed to load subjects", 'error');
        } finally {
            setLoadingSubjects(false);
        }
    };

    const fetchServices = async () => {
        try {
            const data = await adminService.getServices();
            setServices(data || []);
        } catch (e) {
            console.error("Failed to load services", e);
        }
    };

    const handleSave = async () => {
        const { type, data, isEditing } = modal;
        
        // التحقق من اختيار الخدمة للمادة
        if (type === 'subject' && !data.service_id) {
            showToast(t.serviceRequired || 'Please select a service', 'error');
            return;
        }
        
        try {
            let resp;
            if (type === 'level') {
                if (isEditing) {
                    resp = await adminService.updateEducationLevel(data.id, data);
                } else {
                    resp = await adminService.createEducationLevel(data);
                }
                fetchLevels();
            } else if (type === 'class') {
                if (isEditing) {
                    resp = await adminService.updateClass(data.id, data);
                } else {
                    resp = await adminService.createClass({ ...data, education_level_id: activeLevel });
                }
                if (activeLevel) fetchClasses(activeLevel);
            } else if (type === 'subject') {
                if (isEditing) {
                    resp = await adminService.updateSubject(data.id, data);
                } else {
                    resp = await adminService.createSubject({
                        ...data,
                        class_id: activeClass,
                        education_level_id: activeLevel
                    });
                }
                if (activeClass) fetchSubjects(activeClass);
            }
            showToast(resp.message || "Success", 'success');
            setModal({ ...modal, isOpen: false });
        } catch (e: any) {
            showToast(e.message || "Failed to save", 'error');
        }
    };

    const handleDelete = async (type: 'level' | 'class' | 'subject', id: number) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            if (type === 'level') {
                await adminService.deleteEducationLevel(id);
                fetchLevels();
            } else if (type === 'class') {
                await adminService.deleteClass(id);
                if (activeLevel) fetchClasses(activeLevel);
            } else if (type === 'subject') {
                await adminService.deleteSubject(id);
                if (activeClass) fetchSubjects(activeClass);
            }
            showToast("Deleted successfully", 'success');
        } catch (e: any) {
            showToast(e.message || "Delete failed. Check dependencies.", 'error');
        }
    };

    const handleRestore = async (type: 'level' | 'class' | 'subject', id: number) => {
        try {
            if (type === 'level') {
                await adminService.restoreEducationLevel(id);
                fetchLevels();
            } else if (type === 'class') {
                await adminService.restoreClass(id);
                if (activeLevel) fetchClasses(activeLevel);
            } else if (type === 'subject') {
                await adminService.restoreSubject(id);
                if (activeClass) fetchSubjects(activeClass);
            }
            showToast("Restored successfully", 'success');
        } catch (e: any) {
            showToast(e.message || "Restore failed", 'error');
        }
    };

    const openModal = (type: 'level' | 'class' | 'subject', item: any = null) => {
        if (type === 'subject' && services.length === 0) {
            fetchServices();
        }
        setModal({
            isOpen: true,
            type,
            isEditing: !!item,
            data: item || { name_en: '', name_ar: '', status: 1, description: '', service_id: '' }
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900">{t.academicStructure}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)] min-h-[600px]">

                {/* Levels Column */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-700">{t.levels}</h3>
                            {loadingLevels && <Loader2 size={14} className="animate-spin text-primary" />}
                        </div>
                        <button
                            onClick={() => openModal('level')}
                            className="p-1 hover:bg-white rounded-md text-primary transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {levels.map(level => (
                            <div
                                key={level.id}
                                onClick={() => { setActiveLevel(level.id); setActiveClass(null); }}
                                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${activeLevel === level.id
                                    ? 'bg-primary/5 border-primary text-primary'
                                    : 'hover:bg-slate-50 border-transparent'
                                    } ${level.deleted_at ? 'opacity-50 grayscale' : ''}`}
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium">{language === 'ar' ? level.name_ar : level.name_en}</span>
                                    {level.deleted_at && <span className="text-[10px] text-red-500 font-bold uppercase">{t.deleted}</span>}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); openModal('level', level); }} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-md hover:bg-white"><Edit2 size={14} /></button>
                                    {level.deleted_at ? (
                                        <button onClick={(e) => { e.stopPropagation(); handleRestore('level', level.id); }} className="p-1.5 text-slate-400 hover:text-green-500 rounded-md hover:bg-white"><RotateCcw size={14} /></button>
                                    ) : (
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete('level', level.id); }} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-white"><Trash2 size={14} /></button>
                                    )}
                                    <ChevronRight size={16} className={`text-slate-400 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Classes Column */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-700">{t.classes}</h3>
                            {loadingClasses && <Loader2 size={14} className="animate-spin text-primary" />}
                        </div>
                        <button
                            onClick={() => openModal('class')}
                            disabled={!activeLevel}
                            className="p-1 hover:bg-white rounded-md text-primary disabled:opacity-30 transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {!activeLevel ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm p-4 text-center">
                                <AlertCircle size={24} className="mb-2 opacity-20" />
                                {t.selectLevelFirst}
                            </div>
                        ) : classes.length === 0 && !loadingClasses ? (
                            <div className="text-center text-slate-400 mt-10 text-sm">{t.noClassesFound}</div>
                        ) : (
                            classes.map(cls => (
                                <div
                                    key={cls.id}
                                    onClick={() => setActiveClass(cls.id)}
                                    className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${activeClass === cls.id
                                        ? 'bg-primary/5 border-primary text-primary'
                                        : 'hover:bg-slate-50 border-transparent'
                                        } ${cls.deleted_at ? 'opacity-50 grayscale' : ''}`}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">{language === 'ar' ? cls.name_ar : cls.name_en}</span>
                                        {cls.deleted_at && <span className="text-[10px] text-red-500 font-bold uppercase">{t.deleted}</span>}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); openModal('class', cls); }} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-md hover:bg-white"><Edit2 size={14} /></button>
                                        {cls.deleted_at ? (
                                            <button onClick={(e) => { e.stopPropagation(); handleRestore('class', cls.id); }} className="p-1.5 text-slate-400 hover:text-green-500 rounded-md hover:bg-white"><RotateCcw size={14} /></button>
                                        ) : (
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete('class', cls.id); }} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-white"><Trash2 size={14} /></button>
                                        )}
                                        <ChevronRight size={16} className={`text-slate-400 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Subjects Column */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-700">{t.subjects}</h3>
                            {loadingSubjects && <Loader2 size={14} className="animate-spin text-primary" />}
                        </div>
                        <button
                            onClick={() => openModal('subject')}
                            disabled={!activeClass}
                            className="p-1 hover:bg-white rounded-md text-primary disabled:opacity-30 transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {!activeClass ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm p-4 text-center">
                                <AlertCircle size={24} className="mb-2 opacity-20" />
                                {t.selectClassFirst}
                            </div>
                        ) : subjects.length === 0 && !loadingSubjects ? (
                            <div className="text-center text-slate-400 mt-10 text-sm">{t.noSubjectsFound}</div>
                        ) : (
                            subjects.map(sub => (
                                <div
                                    key={sub.id}
                                    className={`group flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent transition-all ${sub.deleted_at ? 'opacity-50 grayscale' : ''}`}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">{language === 'ar' ? sub.name_ar : sub.name_en}</span>
                                        {sub.deleted_at && <span className="text-[10px] text-red-500 font-bold uppercase">{t.deleted}</span>}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal('subject', sub)} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-md hover:bg-white"><Edit2 size={14} /></button>
                                        {sub.deleted_at ? (
                                            <button onClick={() => handleRestore('subject', sub.id)} className="p-1.5 text-slate-400 hover:text-green-500 rounded-md hover:bg-white"><RotateCcw size={14} /></button>
                                        ) : (
                                            <button onClick={() => handleDelete('subject', sub.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-white"><Trash2 size={14} /></button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* Entity Modal */}
            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                title={`${modal.isEditing ? t.edit : t.create} ${modal.type === 'level' ? t.levels : modal.type === 'class' ? t.classes : t.subjects}`}
            >
                <div className="space-y-4">
                    <Input
                        label={t.nameEn}
                        value={modal.data.name_en || ''}
                        onChange={e => setModal({ ...modal, data: { ...modal.data, name_en: e.target.value } })}
                        placeholder="e.g. Mathematics"
                    />
                    <Input
                        label={t.nameAr}
                        value={modal.data.name_ar || ''}
                        onChange={e => setModal({ ...modal, data: { ...modal.data, name_ar: e.target.value } })}
                        placeholder={t.phMathematics}
                        dir="rtl"
                    />
                    {modal.type === 'level' && (
                        <div className="mb-4 w-full">
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t.description}</label>
                            <textarea
                                className="w-full rounded-lg border border-slate-200 p-3 h-20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                value={modal.data.description || ''}
                                onChange={e => setModal({ ...modal, data: { ...modal.data, description: e.target.value } })}
                            />
                        </div>
                    )}

                    {modal.type === 'subject' && (
                        <Select
                            label={t.service || 'Service'}
                            value={modal.data.service_id?.toString() || ''}
                            onChange={e => setModal({ ...modal, data: { ...modal.data, service_id: parseInt(e.target.value) } })}
                            options={[
                                { value: '', label: t.selectService || 'Select a service' },
                                ...services.map(s => ({ value: s.id.toString(), label: language === 'ar' ? s.name_ar : s.name_en }))
                            ]}
                            error={!modal.data.service_id ? (t.serviceRequired || 'Service is required') : undefined}
                        />
                    )}

                    <div className="flex items-center gap-2 py-2">
                        <label className="text-sm font-medium text-slate-700">{t.status}:</label>
                        <button
                            onClick={() => setModal({ ...modal, data: { ...modal.data, status: modal.data.status === 1 ? 0 : 1 } })}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${modal.data.status === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}
                        >
                            {modal.data.status === 1 ? t.activeStatus : t.inactiveStatus}
                        </button>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setModal({ ...modal, isOpen: false })}>
                            <X size={18} className="mr-2" /> {t.cancel}
                        </Button>
                        <Button className="flex-1" onClick={handleSave}>
                            <Save size={18} className="mr-2" /> {modal.isEditing ? t.update : t.create}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
