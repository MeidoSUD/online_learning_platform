import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { useToast } from '../../Contexts/ToastContext';
import {
    ArrowLeft, Loader2, Mail, Phone, Globe, User, GraduationCap, Star,
    CalendarDays, Clock, BadgeCheck, Ban, CheckCircle, BookOpen, Languages,
    PlayCircle, Wallet, Users, AlertCircle, Shield, BookMarked, Pencil, Save,
    X
} from 'lucide-react';
import { adminService } from '../../Services/api';
import { getStorageUrl } from '../../Services/api';
import { Button } from '../ui/Button';

interface AdminTeacherDetailsProps {
    userId: number;
    onBack: () => void;
}

const DAY_NAMES_AR: Record<number, string> = {
    1: 'السبت', 2: 'الأحد', 3: 'الإثنين', 4: 'الثلاثاء',
    5: 'الأربعاء', 6: 'الخميس', 7: 'الجمعة',
};
const DAY_NAMES_EN: Record<number, string> = {
    1: 'Saturday', 2: 'Sunday', 3: 'Monday', 4: 'Tuesday',
    5: 'Wednesday', 6: 'Thursday', 7: 'Friday',
};

export const AdminTeacherDetails: React.FC<AdminTeacherDetailsProps> = ({ userId, onBack }) => {
    const { t, language, direction } = useLanguage();
    const { showToast } = useToast();
    const [teacher, setTeacher] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toggling, setToggling] = useState<'active' | 'verify' | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState<any>({});
    const [editOptions, setEditOptions] = useState<{ services: any[]; subjects: any[]; languages: any[]; levels: any[]; classes: any[] }>({ services: [], subjects: [], languages: [], levels: [], classes: [] });
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [subjectsLoading, setSubjectsLoading] = useState(false);
    const [optionsLoaded, setOptionsLoaded] = useState(false);
    const [selectedEducationLevelId, setSelectedEducationLevelId] = useState(0);
    const [selectedClassId, setSelectedClassId] = useState(0);

    const ar = language === 'ar';

    const normalizeTime = useCallback((value: string) => {
        if (!value) return value;
        const match = String(value).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (!match) return String(value).trim();
        let hour = Number(match[1]);
        const minute = match[2];
        const meridiem = (match[3] || '').toUpperCase();
        if (meridiem === 'PM' && hour < 12) hour += 12;
        if (meridiem === 'AM' && hour === 12) hour = 0;
        return `${String(hour).padStart(2, '0')}:${minute}`;
    }, []);

    const availableSlotsToDraft = useCallback((list: any[] = []) => {
        return (list || []).map((day: any) => ({
            day: Number(day.day_number ?? day.id ?? 1),
            times: (day.times || []).map((slot: any) => normalizeTime(slot.time || slot.start_time || ''))
                .filter(Boolean)
        })).filter((entry) => entry.times.length > 0);
    }, [normalizeTime]);

    const buildDraft = useCallback((currentTeacher: any) => {
        const profile = currentTeacher?.profile || {};
        const services = profile?.services || [];
        const subjectItems = profile?.teacher_subjects || [];
        const languageItems = profile?.languages || [];

        return {
            bio: profile?.bio || '',
            teach_individual: !!profile?.teach_individual,
            individual_hour_price: Number(profile?.individual_hour_price ?? 0),
            teach_group: !!profile?.teach_group,
            group_hour_price: Number(profile?.group_hour_price ?? 0),
            max_group_size: Number(profile?.max_group_size ?? 0),
            min_group_size: Number(profile?.min_group_size ?? 0),
            service_ids: services.map((service: any) => Number(service.service_id ?? service.id)).filter(Boolean),
            subject_ids: subjectItems.map((subject: any) => Number(subject.subject_id ?? subject.id)).filter(Boolean),
            language_ids: languageItems.map((language: any) => Number(language.language_id ?? language.id)).filter(Boolean),
            available_times: availableSlotsToDraft(profile?.available_times || []),
        };
    }, [availableSlotsToDraft]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response: any = await adminService.getTeacherDetails(userId);
            setTeacher(response?.data ?? response);
        } catch (e: any) {
            setError(e.message || (ar ? 'فشل تحميل بيانات المعلم' : 'Failed to load teacher data'));
        } finally {
            setLoading(false);
        }
    }, [userId, ar]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (teacher) {
            setDraft(buildDraft(teacher));
            const firstSubject = (teacher?.profile?.teacher_subjects || [])[0];
            setSelectedEducationLevelId(Number(firstSubject?.class_level_id || 0));
            setSelectedClassId(Number(firstSubject?.class_id || 0));
        }
    }, [teacher, buildDraft]);

    useEffect(() => {
        if (!isEditing || optionsLoaded) return;
        setOptionsLoading(true);
        adminService.getTeacherEditOptions().then((options: any) => {
            setEditOptions({
                services: options?.services || [],
                subjects: [],
                languages: options?.languages || [],
                levels: options?.levels || [],
                classes: options?.classes || [],
            });
            setOptionsLoaded(true);
        }).catch((e: any) => {
            showToast(e.message || (ar ? 'فشل تحميل بيانات الخدمات' : 'Failed to load service data'), 'error');
        }).finally(() => setOptionsLoading(false));
    }, [isEditing, optionsLoaded, ar, showToast]);

    const selectedServiceIds = (draft.service_ids || []).map((id: number) => Number(id));
    const privateServiceIds = editOptions.services
        .filter((service: any) => selectedServiceIds.includes(Number(service.id)) && String(service.key_name || '').toLowerCase().includes('private'))
        .map((service: any) => Number(service.id));
    const privateServiceKey = privateServiceIds.join(',');

    useEffect(() => {
        if (!isEditing || !selectedEducationLevelId || !selectedClassId || !privateServiceKey) {
            setEditOptions((prev) => ({ ...prev, subjects: [] }));
            return;
        }

        let cancelled = false;
        setSubjectsLoading(true);
        adminService.getTeacherEditSubjects(
            selectedEducationLevelId,
            selectedClassId,
            privateServiceKey.split(',').map(Number),
        ).then((subjects: any[]) => {
            if (!cancelled) setEditOptions((prev) => ({ ...prev, subjects: subjects || [] }));
        }).catch((e: any) => {
            if (!cancelled) showToast(e.message || (ar ? 'فشل تحميل المواد' : 'Failed to load subjects'), 'error');
        }).finally(() => {
            if (!cancelled) setSubjectsLoading(false);
        });

        return () => { cancelled = true; };
    }, [isEditing, selectedEducationLevelId, selectedClassId, privateServiceKey, ar, showToast]);

    if (loading) {
        return <div className="flex justify-center p-16"><Loader2 className="animate-spin text-primary" /></div>;
    }

    if (error) {
        return (
            <div className="text-center py-16">
                <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
                <p className="text-red-600 font-medium">{error}</p>
                <Button variant="outline" className="mt-4" onClick={load}>{ar ? 'إعادة المحاولة' : 'Retry'}</Button>
            </div>
        );
    }

    if (!teacher) {
        return <p className="text-center text-[var(--text-muted)] py-16">{ar ? 'لا توجد بيانات' : 'No data found'}</p>;
    }

    const profile = teacher?.profile || {};
    const isActive = profile?.is_active ?? teacher?.is_active ?? true;
    const verified = profile?.verified ?? teacher?.verified ?? false;
    const profilePhoto = profile?.profile_photo || null;
    const reviews = profile?.reviews || [];
    const rating = profile?.rating ?? 0;
    const services = profile?.services || [];
    const subjects = profile?.teacher_subjects || [];
    const languages = profile?.languages || [];
    const courses = profile?.courses || [];
    const availableTimes = profile?.available_times || [];
    const individualPrice = profile?.individual_hour_price ?? 0;
    const groupPrice = profile?.group_hour_price ?? 0;
    const teachIndividual = !!profile?.teach_individual;
    const teachGroup = !!profile?.teach_group;
    const maxGroupSize = profile?.max_group_size ?? 0;
    const minGroupSize = profile?.min_group_size ?? 0;
    const code = profile?.code || teacher?.code || '';
    const bio = profile?.bio || teacher?.bio || '';
    const primaryServiceId = profile?.service;

    const primaryService = services.find((s: any) => Number(s.service_id) === Number(primaryServiceId)) || services[0] || null;
    const serviceKeys = (services || []).map((s: any) => (s.key_name || '').toLowerCase());
    const isPrivate = serviceKeys.some((k: string) => k.includes('private'));
    const isLanguageStudy = serviceKeys.some((k: string) => k.includes('lang') || k.includes('language'));
    const isCoursesService = serviceKeys.some((k: string) => k.includes('course') || k.includes('training'));

    const statCard = (label: string, value: string | number, Icon: React.ElementType, color = 'text-primary bg-primary-pale') => (
        <div className="p-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-white flex items-center gap-3">
            <div className={`h-11 w-11 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} />
            </div>
            <div className="min-w-0">
                <div className="text-xl font-bold text-navy leading-tight">{value}</div>
                <div className="text-xs text-[var(--text-muted)] truncate">{label}</div>
            </div>
        </div>
    );

    const serviceName = (s: any) => ar ? (s.name_ar || s.name_en) : (s.name_en || s.name_ar);
    const subjectName = (s: any) => ar ? (s.name_ar || s.title) : (s.name_en || s.title);
    const langName = (l: any) => ar ? (l.name_ar || l.name_en) : (l.name_en || l.name_ar);
    const dayName = (day: number) => ar ? (DAY_NAMES_AR[day] || `Day ${day}`) : (DAY_NAMES_EN[day] || `Day ${day}`);

    const dayOrder = (a: any, b: any) => Number(a.id ?? a.day_number) - Number(b.id ?? b.day_number);

    const sectionTitle = (title: string, Icon: React.ElementType, color = 'text-primary') => (
        <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-main)] mb-3">
            <span className={`h-7 w-7 rounded-full ${color.replace('text-', 'bg-')} bg-opacity-10 flex items-center justify-center ${color}`}>
                <Icon size={15} />
            </span>
            {title}
        </h3>
    );

    const toggleActive = async () => {
        setToggling('active');
        try {
            if (isActive) {
                await adminService.suspendUser(userId);
            } else {
                await adminService.activateUser(userId);
            }
            const next = !isActive;
            setTeacher((prev: any) => ({
                ...prev,
                profile: { ...(prev?.profile || {}), is_active: next ? 1 : 0 },
                is_active: next ? 1 : 0,
            }));
            showToast(t.updatedSuccessfully || 'Updated successfully', 'success');
        } catch (e: any) {
            showToast(e.message || t.error || 'Error', 'error');
        } finally {
            setToggling(null);
        }
    };

    const toggleVerify = async () => {
        setToggling('verify');
        try {
            const next = !verified;
            await adminService.verifyUser(userId, next);
            setTeacher((prev: any) => ({
                ...prev,
                profile: { ...(prev?.profile || {}), verified: next },
                verified: next,
            }));
            showToast(t.updatedSuccessfully || 'Updated successfully', 'success');
        } catch (e: any) {
            showToast(e.message || t.error || 'Error', 'error');
        } finally {
            setToggling(null);
        }
    };

    const saveTeacherEdit = async () => {
        setSaving(true);
        try {
            const payload = {
                ...draft,
                available_times: draft.available_times.map((entry: any) => ({
                    day: Number(entry.day),
                    times: (entry.times || []).map((time: string) => normalizeTime(time)).filter(Boolean),
                })).filter((entry: any) => entry.times.length > 0),
            };

            const response: any = await adminService.updateTeacherProfileByAdmin(userId, payload);
            const updatedTeacher = response?.data ?? response;
            setTeacher(updatedTeacher || teacher);
            setIsEditing(false);
            showToast(ar ? 'تم تحديث بيانات المعلم بنجاح' : 'Teacher profile updated successfully', 'success');
            await load();
        } catch (e: any) {
            showToast(e.message || (ar ? 'فشل تحديث بيانات المعلم' : 'Failed to update teacher profile'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const selectedServices = editOptions.services.filter((service: any) => (draft.service_ids || []).includes(Number(service.id)));
    const hasPrivateService = selectedServices.some((service: any) => String(service.key_name || '').toLowerCase().includes('private'));
    const hasLanguageService = selectedServices.some((service: any) => String(service.key_name || '').toLowerCase().includes('language'));
    const availableSubjects = editOptions.subjects;
    const toggleId = (field: 'service_ids' | 'subject_ids' | 'language_ids', id: number) => {
        setDraft((prev: any) => {
            const current = prev[field] || [];
            const next = current.includes(id) ? current.filter((value: number) => value !== id) : [...current, id];
            if (field !== 'service_ids') return { ...prev, [field]: next };

            const selected = editOptions.services.filter((service: any) => next.includes(Number(service.id)));
            const privateSelected = selected.some((service: any) => String(service.key_name || '').toLowerCase().includes('private'));
            const languageSelected = selected.some((service: any) => String(service.key_name || '').toLowerCase().includes('language'));
            return {
                ...prev,
                service_ids: next,
                subject_ids: privateSelected ? prev.subject_ids : [],
                language_ids: languageSelected ? prev.language_ids : [],
            };
        });
    };

    return (
        <div className="space-y-6 animate-fade-in" dir={direction}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-primary transition-colors">
                    <ArrowLeft size={18} className={direction === 'rtl' ? 'rotate-180' : ''} /> {ar ? 'العودة إلى المستخدمين' : 'Back to Users'}
                </button>
                <div className="flex gap-2">
                    {!isEditing && (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="text-primary border-primary/30 hover:bg-primary-pale">
                            <Pencil size={16} /> {ar ? 'تعديل' : 'Edit'}
                        </Button>
                    )}
                    {isEditing && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setDraft(buildDraft(teacher)); }} className="text-slate-600 border-slate-200">
                                <X size={16} /> {ar ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button variant="primary" size="sm" onClick={saveTeacherEdit} disabled={saving}>
                                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                {ar ? 'حفظ' : 'Save'}
                            </Button>
                        </>
                    )}
                    <Button variant={isActive ? 'outline' : 'primary'} size="sm" onClick={toggleActive} disabled={toggling !== null} className={isActive ? 'text-orange-600 border-orange-200 hover:bg-orange-50' : ''}>
                        {toggling === 'active' ? <Loader2 className="animate-spin" size={16} /> : isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                        {isActive ? (t.deactivate || 'Deactivate') : (t.activate || 'Activate')}
                    </Button>
                    <Button variant={verified ? 'outline' : 'ghost'} size="sm" onClick={toggleVerify} disabled={toggling !== null} className={verified ? 'text-amber-600' : ''}>
                        {toggling === 'verify' ? <Loader2 className="animate-spin" size={16} /> : <BadgeCheck size={16} />}
                        {verified ? (ar ? 'إلغاء التوثيق' : 'Unverify') : (ar ? 'توثيق المعلم' : 'Verify Teacher')}
                    </Button>
                </div>
            </div>

            {/* Header Card */}
            <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-6">
                <div className="flex flex-col md:flex-row items-start gap-5">
                    {profilePhoto ? (
                        <img src={getStorageUrl(profilePhoto)} alt="teacher" className="h-20 w-20 rounded-full object-cover border-4 border-primary-pale flex-shrink-0" />
                    ) : (
                        <div className="h-20 w-20 rounded-full bg-primary-pale text-primary flex items-center justify-center text-3xl font-bold flex-shrink-0">
                            {teacher.first_name?.charAt(0)}{teacher.last_name?.charAt(0)}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-2xl font-bold text-[var(--text-main)]">{teacher.first_name} {teacher.last_name}</h2>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-pale text-secondary"><GraduationCap size={12} /> {t.teacher || 'Teacher'}</span>
                            {code && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--light-bg)] text-[var(--text-muted)]" dir="ltr">{code}</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-[var(--text-muted)]">
                            <span className="inline-flex items-center gap-1"><Mail size={12} /> {teacher.email}</span>
                            <span className="inline-flex items-center gap-1" dir="ltr"><Phone size={12} /> {teacher.phone_number}</span>
                            {teacher.nationality && <span className="inline-flex items-center gap-1"><Globe size={12} /> {teacher.nationality}</span>}
                            <span className="capitalize inline-flex items-center gap-1"><User size={12} /> {teacher.gender === 'male' ? (t.genderMale || 'Male') : (t.genderFemale || 'Female')}</span>
                            <span className="inline-flex items-center gap-1">
                                <Star size={12} className="text-amber-500" fill="currentColor" /> {Number(rating).toFixed(1)}
                            </span>
                        </div>
                        {isEditing ? (
                            <textarea
                                value={draft.bio || ''}
                                onChange={(e) => setDraft((prev: any) => ({ ...prev, bio: e.target.value }))}
                                className="mt-3 w-full rounded-[var(--radius-sm)] border border-[var(--border)] p-3 text-sm text-[var(--text-main)]"
                                rows={3}
                            />
                        ) : bio ? (
                            <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed">{bio}</p>
                        ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isActive ? 'bg-primary-pale text-primary' : 'bg-red-100 text-red-700'}`}>
                            {isActive ? (t.activeStatus || 'Active') : (t.inactiveStatus || 'Inactive')}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${verified ? 'bg-primary-pale text-primary' : 'bg-amber-100 text-amber-700'}`}>
                            {verified ? (t.verifiedStatus || 'Verified') : (t.unverifiedStatus || 'Unverified')}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
                    {statCard(ar ? 'الطلاب' : 'Students', profile?.total_students ?? teacher?.total_students ?? 0, Users, 'text-primary bg-primary-pale')}
                    {statCard(ar ? 'الدروس' : 'Lessons', profile?.total_lessons ?? teacher?.total_lessons ?? 0, PlayCircle, 'text-secondary bg-secondary-pale')}
                    {statCard(ar ? 'الحجوزات' : 'Bookings', profile?.bookings_count ?? 0, CalendarDays, 'text-[var(--accent)] bg-secondary-pale')}
                    {statCard(ar ? 'المواد' : 'Subjects', profile?.subjects_count ?? subjects.length, BookMarked, 'text-primary bg-primary-pale')}
                    {statCard(ar ? 'اللغات' : 'Languages', profile?.languages_count ?? languages.length, Languages, 'text-secondary bg-secondary-pale')}
                    {statCard(ar ? 'الدورات' : 'Courses', profile?.courses_count ?? courses.length, BookOpen, 'text-[var(--accent)] bg-secondary-pale')}
                </div>
            </div>

            {isEditing && (
                <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-5 space-y-4">
                    <h3 className="text-lg font-bold text-[var(--text-main)]">{ar ? 'تعديل بيانات المعلم' : 'Edit teacher profile'}</h3>
                    {optionsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Loader2 className="animate-spin" size={16} /> {ar ? 'جاري تحميل بيانات النظام...' : 'Loading system data...'}</div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-[var(--text-main)]">{ar ? 'الخدمات' : 'Services'}</p>
                                <p className="text-xs text-[var(--text-muted)]">{ar ? 'اختر الخدمة أولا. سيتم عرض المواد واللغات حسب الخدمة المختارة.' : 'Choose services first. Subjects and languages are shown according to the selected services.'}</p>
                                <div className="grid md:grid-cols-2 gap-2">
                                    {editOptions.services.map((service: any) => {
                                        const id = Number(service.id);
                                        const checked = (draft.service_ids || []).includes(id);
                                        return (
                                            <label key={id} className={`flex items-center gap-2 rounded-[var(--radius-sm)] border p-3 cursor-pointer ${checked ? 'border-primary bg-primary-pale/40' : 'border-[var(--border)]'}`}>
                                                <input type="checkbox" checked={checked} onChange={() => toggleId('service_ids', id)} />
                                                <span className="text-sm text-[var(--text-main)]">{ar ? (service.name_ar || service.name_en) : (service.name_en || service.name_ar)}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {hasPrivateService && (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-[var(--text-main)]">{ar ? 'مواد الدروس الخاصة' : 'Private lesson subjects'}</p>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <label className="space-y-1 text-sm">
                                            <span className="font-medium">{ar ? '١. المرحلة التعليمية' : '1. Education level'}</span>
                                            <select
                                                value={selectedEducationLevelId || ''}
                                                onChange={(e) => {
                                                    setSelectedEducationLevelId(Number(e.target.value));
                                                    setSelectedClassId(0);
                                                }}
                                                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] p-2.5 bg-white"
                                            >
                                                <option value="">{ar ? 'اختر المرحلة' : 'Select a level'}</option>
                                                {editOptions.levels.map((level: any) => (
                                                    <option key={level.id} value={level.id}>{ar ? (level.name_ar || level.name_en) : (level.name_en || level.name_ar)}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="space-y-1 text-sm">
                                            <span className="font-medium">{ar ? '٢. الصف' : '2. Class'}</span>
                                            <select
                                                value={selectedClassId || ''}
                                                disabled={!selectedEducationLevelId}
                                                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                                                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] p-2.5 bg-white disabled:opacity-50"
                                            >
                                                <option value="">{ar ? 'اختر الصف' : 'Select a class'}</option>
                                                {editOptions.classes
                                                    .filter((item: any) => Number(item.education_level_id) === selectedEducationLevelId)
                                                    .map((item: any) => (
                                                        <option key={item.id} value={item.id}>{ar ? (item.name_ar || item.name_en) : (item.name_en || item.name_ar)}</option>
                                                    ))}
                                            </select>
                                        </label>
                                    </div>
                                    {!selectedEducationLevelId ? (
                                        <p className="text-xs text-[var(--text-muted)]">{ar ? 'اختر المرحلة أولاً لعرض الصفوف.' : 'Select an education level first to see its classes.'}</p>
                                    ) : !selectedClassId ? (
                                        <p className="text-xs text-[var(--text-muted)]">{ar ? 'اختر الصف لعرض مواده فقط.' : 'Select a class to see only its subjects.'}</p>
                                    ) : subjectsLoading ? (
                                        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]"><Loader2 className="animate-spin" size={16} /> {ar ? 'جاري تحميل المواد...' : 'Loading subjects...'}</div>
                                    ) : availableSubjects.length === 0 ? (
                                        <p className="text-xs text-[var(--text-muted)]">{ar ? 'لا توجد مواد لهذه المرحلة والصف والخدمة.' : 'No subjects match this level, class, and service.'}</p>
                                    ) : (
                                        <>
                                            <p className="text-xs text-[var(--text-muted)]">{ar ? '٣. اختر المواد لهذا الصف.' : '3. Select subjects for this class.'}</p>
                                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                                                {availableSubjects.map((subject: any) => {
                                                    const id = Number(subject.id);
                                                    return <label key={id} className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] p-2 cursor-pointer"><input type="checkbox" checked={(draft.subject_ids || []).includes(id)} onChange={() => toggleId('subject_ids', id)} /><span className="text-sm">{ar ? (subject.name_ar || subject.name_en) : (subject.name_en || subject.name_ar)}</span></label>;
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {hasLanguageService && (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-[var(--text-main)]">{ar ? 'لغات الدراسة' : 'Study languages'}</p>
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                                        {editOptions.languages.map((item: any) => {
                                            const id = Number(item.id);
                                            return <label key={id} className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] p-2 cursor-pointer"><input type="checkbox" checked={(draft.language_ids || []).includes(id)} onChange={() => toggleId('language_ids', id)} /><span className="text-sm">{ar ? (item.name_ar || item.name_en) : (item.name_en || item.name_ar)}</span></label>;
                                        })}
                                    </div>
                                </div>
                            )}

                            {!hasPrivateService && <p className="text-xs text-[var(--text-muted)]">{ar ? 'اختر خدمة الدروس الخاصة لإدارة المواد.' : 'Select the private lessons service to manage subjects.'}</p>}
                            {!hasLanguageService && <p className="text-xs text-[var(--text-muted)]">{ar ? 'اختر خدمة دراسة اللغات لإدارة اللغات.' : 'Select the language study service to manage languages.'}</p>}
                        </>
                    )}
                    <div className="grid md:grid-cols-2 gap-4">
                        <label className="space-y-2 text-sm text-[var(--text-main)]">
                            <span>{ar ? 'السعر الفردي / ساعة' : 'Individual price / hour'}</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={draft.individual_hour_price ?? 0}
                                onChange={(e) => setDraft((prev: any) => ({ ...prev, individual_hour_price: Number(e.target.value) }))}
                                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] p-2.5"
                            />
                        </label>
                        <label className="space-y-2 text-sm text-[var(--text-main)]">
                            <span>{ar ? 'سعر المجموعة / ساعة' : 'Group price / hour'}</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={draft.group_hour_price ?? 0}
                                onChange={(e) => setDraft((prev: any) => ({ ...prev, group_hour_price: Number(e.target.value) }))}
                                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] p-2.5"
                            />
                        </label>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <label className="flex items-center gap-2 text-sm text-[var(--text-main)]">
                            <input type="checkbox" checked={!!draft.teach_individual} onChange={(e) => setDraft((prev: any) => ({ ...prev, teach_individual: e.target.checked }))} />
                            {ar ? 'يدرس فردي' : 'Offers individual classes'}
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[var(--text-main)]">
                            <input type="checkbox" checked={!!draft.teach_group} onChange={(e) => setDraft((prev: any) => ({ ...prev, teach_group: e.target.checked }))} />
                            {ar ? 'يدرس مجموعة' : 'Offers group classes'}
                        </label>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <label className="space-y-2 text-sm text-[var(--text-main)]">
                            <span>{ar ? 'أقل حجم للمجموعة' : 'Min group size'}</span>
                            <input type="number" min="0" value={draft.min_group_size ?? 0} onChange={(e) => setDraft((prev: any) => ({ ...prev, min_group_size: Number(e.target.value) }))} className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] p-2.5" />
                        </label>
                        <label className="space-y-2 text-sm text-[var(--text-main)]">
                            <span>{ar ? 'أقصى حجم للمجموعة' : 'Max group size'}</span>
                            <input type="number" min="0" value={draft.max_group_size ?? 0} onChange={(e) => setDraft((prev: any) => ({ ...prev, max_group_size: Number(e.target.value) }))} className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] p-2.5" />
                        </label>
                    </div>

                    <div className="space-y-2 text-sm text-[var(--text-main)]">
                        <span>{ar ? 'أوقات التوفر' : 'Availability slots'}</span>
                        <textarea
                            value={(draft.available_times || []).map((entry: any) => `${entry.day}:${(entry.times || []).join(',')}`).join(' | ')}
                            onChange={(e) => {
                                const raw = e.target.value;
                                if (!raw.trim()) {
                                    setDraft((prev: any) => ({ ...prev, available_times: [] }));
                                    return;
                                }
                                const parsed = raw.split('|').map((entry) => {
                                    const [day, timesPart] = entry.split(':');
                                    const times = (timesPart || '').split(',').map((time) => time.trim()).filter(Boolean);
                                    return { day: Number(day), times };
                                }).filter((entry) => entry.day && entry.times.length > 0);
                                setDraft((prev: any) => ({ ...prev, available_times: parsed }));
                            }}
                            className="w-full min-h-[80px] rounded-[var(--radius-sm)] border border-[var(--border)] p-2.5"
                            placeholder={ar ? 'مثال: 1:09:00,10:00 | 2:11:00' : 'Example: 1:09:00,10:00 | 2:11:00'}
                        />
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left column */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Services */}
                    <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-5">
                        {sectionTitle(ar ? 'الخدمات المقدمة' : 'Teacher Services', Shield, 'text-primary')}
                        {services.length === 0 ? (
                            <p className="text-sm text-[var(--text-muted)] py-4">{ar ? 'لا توجد خدمات' : 'No services'}</p>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-3">
                                {services.map((s: any) => (
                                    <div key={s.id} className={`p-4 rounded-[var(--radius-md)] border ${Number(s.service_id) === Number(primaryServiceId) ? 'border-primary/40 bg-primary-pale/40' : 'border-[var(--border)] bg-[var(--light-bg)]/60'}`}>
                                        <div className="font-bold text-[var(--text-main)]">{serviceName(s)}</div>
                                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5" dir="ltr">{s.key_name || ''}</div>
                                        {(s.name_en !== s.name_ar) && (
                                            <div className="text-xs text-[var(--text-muted)] mt-1">{ar ? s.name_en : s.name_ar}</div>
                                        )}
                                        {Number(s.service_id) === Number(primaryServiceId) && (
                                            <span className="inline-block mt-2 text-[10px] font-bold text-primary uppercase">{ar ? 'الخدمة الرئيسية' : 'Primary service'}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Subjects - private lessons */}
                    {isPrivate && subjects.length > 0 && (
                        <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-5">
                            {sectionTitle(ar ? 'المواد التي يدرّسها' : 'Subjects Taught', BookMarked, 'text-primary')}
                            <div className="flex flex-wrap gap-2">
                                {subjects.map((s: any) => (
                                    <span key={s.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-pale text-primary text-xs font-semibold">
                                        {subjectName(s)}
                                        <span className="text-[10px] text-[var(--text-muted)]">
                                            {[
                                                ar ? (s.class_level_title_ar || s.class_level_title) : (s.class_level_title_en || s.class_level_title),
                                                ar ? (s.class_title_ar || s.class_title) : (s.class_title_en || s.class_title),
                                            ].filter(Boolean).join(' - ')}
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Languages - language study */}
                    {isLanguageStudy && languages.length > 0 && (
                        <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-5">
                            {sectionTitle(ar ? 'اللغات التي يدرّسها' : 'Languages Taught', Languages, 'text-secondary')}
                            <div className="flex flex-wrap gap-2">
                                {languages.map((l: any) => (
                                    <span key={l.id} className="px-3 py-1.5 rounded-full bg-secondary-pale text-secondary text-xs font-semibold">
                                        {langName(l)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Courses - course trainer */}
                    {(isPrivate || isCoursesService) && courses.length > 0 && (
                        <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-5">
                            {sectionTitle(ar ? 'الدورات التدريبية' : 'Training Courses', BookOpen, 'text-[var(--accent)]')}
                            <div className="grid sm:grid-cols-2 gap-3">
                                {courses.map((c: any) => (
                                    <div key={c.id} className="p-4 rounded-[var(--radius-md)] border border-[var(--border)]">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="font-bold text-sm text-[var(--text-main)]">{c.name}</div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.status === 'published' ? 'bg-primary-pale text-primary' : 'bg-amber-100 text-amber-700'}`}>{c.status}</span>
                                        </div>
                                        {c.description && <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{c.description}</p>}
                                        <div className="flex items-center justify-between mt-3 text-xs">
                                            <span className="font-bold text-navy">{Number(c.price).toFixed(0)} {ar ? 'ر.س' : 'SAR'}</span>
                                            {c.duration_hours ? <span className="text-[var(--text-muted)] flex items-center gap-1"><Clock size={12} /> {c.duration_hours} {ar ? 'ساعة' : 'hr'}</span> : null}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Available time slots */}
                    {availableTimes.length > 0 && (
                        <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-5">
                            {sectionTitle(ar ? 'المواعيد المتاحة' : 'Available Time Slots', Clock, 'text-secondary')}
                            <div className="grid sm:grid-cols-2 gap-3">
                                {[...availableTimes].sort(dayOrder).map((day: any) => (
                                    <div key={day.id ?? day.day_number} className="p-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--light-bg)]/50">
                                        <div className="text-xs font-bold text-[var(--text-muted)] mb-2">
                                            {ar ? (day.day_ar || day.day_name_ar || dayName(day.id ?? day.day_number)) : (day.day_en || day.day_name_en || dayName(day.id ?? day.day_number))}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(day.times || []).map((slot: any) => (
                                                <span key={slot.id} className={`px-2 py-1 rounded text-[11px] font-semibold ${slot.is_available === false || slot.is_booked ? 'bg-[var(--border)]/40 text-[var(--text-muted)] line-through' : 'bg-primary-pale text-primary'}`}>
                                                    {slot.time || slot.start_time}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    {/* Pricing */}
                    <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-5">
                        {sectionTitle(ar ? 'الأسعار' : 'Pricing', Wallet, 'text-primary')}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--text-muted)]">{ar ? 'درس فردي' : 'Individual lesson'}</span>
                                <span className="font-bold text-navy">{teachIndividual ? `${Number(individualPrice).toFixed(0)} ${ar ? 'ر.س' : 'SAR'}` : '—'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--text-muted)]">{ar ? 'درس جماعي' : 'Group lesson'}</span>
                                <span className="font-bold text-navy">{teachGroup ? `${Number(groupPrice).toFixed(0)} ${ar ? 'ر.س' : 'SAR'}` : '—'}</span>
                            </div>
                            {teachGroup && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-[var(--text-muted)]">{ar ? 'حجم المجموعة' : 'Group size'}</span>
                                    <span className="font-bold text-navy">{minGroupSize} - {maxGroupSize}</span>
                                </div>
                            )}
                            {!teachIndividual && !teachGroup && (
                                <p className="text-sm text-[var(--text-muted)]">{ar ? 'لم يتم تحديد أسعار بعد' : 'No pricing set yet'}</p>
                            )}
                        </div>
                    </div>

                    {/* Reviews */}
                    <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-5">
                        {sectionTitle(`${ar ? 'التقييمات' : 'Reviews'} (${reviews.length})`, Star, 'text-amber-500')}
                        {reviews.length === 0 ? (
                            <p className="text-sm text-[var(--text-muted)] py-3">{ar ? 'لا توجد تقييمات بعد' : 'No reviews yet'}</p>
                        ) : (
                            <div className="space-y-3">
                                {reviews.slice(0, 4).map((r: any) => (
                                    <div key={r.id} className="p-3 rounded-[var(--radius-md)] border border-[var(--border)]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-navy">
                                                {r.reviewer ? `${r.reviewer.first_name} ${r.reviewer.last_name}` : (r.student_name || '—')}
                                            </span>
                                            <span className="flex items-center gap-1 text-amber-500 text-xs font-bold"><Star size={12} fill="currentColor" /> {r.rating}</span>
                                        </div>
                                        {r.comment && <p className="text-xs text-[var(--text-muted)] mt-1">{r.comment}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};