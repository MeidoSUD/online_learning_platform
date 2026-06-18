
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Globe, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { teacherService, TeacherSubject, UserData } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';

interface TeacherLanguagesTabProps {
    user?: UserData;
}

export const TeacherLanguagesTab: React.FC<TeacherLanguagesTabProps> = ({ user }) => {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const [myLanguages, setMyLanguages] = useState<TeacherSubject[]>([]);
    const [loading, setLoading] = useState(true);
    const [availableLanguages, setAvailableLanguages] = useState<{ id: number, name: string }[]>([]);
    const [selectedLang, setSelectedLang] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const subs = await teacherService.getSubjects();
            setMyLanguages(subs);
            // Mock available languages since we don't have a dedicated endpoint yet
            setAvailableLanguages([
                { id: 101, name: 'English' },
                { id: 102, name: 'Arabic' },
                { id: 103, name: 'French' },
                { id: 104, name: 'Spanish' },
                { id: 105, name: 'German' },
                { id: 106, name: 'Chinese' },
            ]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLanguage = async () => {
        if (!selectedLang) return;
        setSubmitting(true);
        try {
            await teacherService.addSubjects([Number(selectedLang)]);
            showToast("Language added successfully", 'success');
            const subs = await teacherService.getSubjects();
            setMyLanguages(subs);
            setSelectedLang('');
        } catch (e: any) {
            showToast(e.message || "Failed to add language", 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">{language === 'ar' ? 'لغاتي' : 'My Languages'}</h2>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-lg mb-4">{language === 'ar' ? 'إضافة لغة جديدة' : 'Add New Language'}</h3>
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <Select
                            label={language === 'ar' ? 'اللغة' : 'Language'}
                            options={[{ value: '', label: '-- Select --' }, ...availableLanguages.map(l => ({ value: String(l.id), label: l.name }))]}
                            value={selectedLang}
                            onChange={(e) => setSelectedLang(e.target.value)}
                            className="mb-0"
                        />
                    </div>
                    <Button onClick={handleAddLanguage} disabled={!selectedLang} isLoading={submitting}>
                        <Plus size={18} className="mr-2" /> Add
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myLanguages.map(subj => {
                    const name = language === 'ar' ? subj.name_ar : subj.name_en;
                    return (
                        <div key={subj.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <Globe size={20} />
                                </div>
                                <span className="font-bold text-slate-800">{name || subj.title}</span>
                            </div>
                            <button className="text-slate-400 hover:text-red-500 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    );
                })}
                {myLanguages.length === 0 && (
                    <div className="col-span-full text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                        No languages added yet.
                    </div>
                )}
            </div>
        </div>
    );
};
