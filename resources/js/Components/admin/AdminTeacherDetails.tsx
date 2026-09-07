import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { useToast } from '../../Contexts/ToastContext';
import {
    ArrowLeft, Loader2, Mail, Phone, Globe, User, GraduationCap, Star,
    CalendarDays, Clock, BadgeCheck, Ban, CheckCircle, BookOpen, Languages,
    PlayCircle, Wallet, Users, AlertCircle, Shield, BookMarked
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

    const ar = language === 'ar';

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

    return (
        <div className="space-y-6 animate-fade-in" dir={direction}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-primary transition-colors">
                    <ArrowLeft size={18} className={direction === 'rtl' ? 'rotate-180' : ''} /> {ar ? 'العودة إلى المستخدمين' : 'Back to Users'}
                </button>
                <div className="flex gap-2">
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
                        {bio && <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed">{bio}</p>}
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
                                        <span className="text-[10px] text-[var(--text-muted)]">{s.class_title || s.class_level_title || ''}</span>
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
                                        <div className="text-xs font-bold text-[var(--text-muted)] mb-2">{dayName(day.id ?? day.day_number)}</div>
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