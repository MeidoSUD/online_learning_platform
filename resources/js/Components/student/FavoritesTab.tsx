import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Heart, Star, Loader2 } from 'lucide-react';
import { studentService, getStorageUrl } from '../../Services/api';
import { COUNTRIES } from '../../Utils/constants';

interface FavoriteTeacher {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    nationality?: string;
    profile?: {
        profile_photo?: string | null;
        rating?: number;
        verified?: boolean;
        subjects_count?: number;
    };
    has_favorited?: boolean;
    [key: string]: any;
}

export const FavoritesTab: React.FC = () => {
    const { t, language, direction } = useLanguage();
    const [teachers, setTeachers] = useState<FavoriteTeacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [unfavoriting, setUnfavoriting] = useState<number | null>(null);

    const loadFavorites = async () => {
        setLoading(true);
        try {
            const res: any = await studentService.getFavorites();
            const list = Array.isArray(res) ? res : (res.data || []);
            setTeachers(list);
        } catch (e) {
            console.error(e);
            setTeachers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFavorites();
    }, []);

    const handleUnfavorite = async (teacherId: number) => {
        setUnfavoriting(teacherId);
        try {
            await studentService.toggleFavorite(teacherId);
            setTeachers(prev => prev.filter(t => t.id !== teacherId));
        } catch (e) {
            console.error(e);
        } finally {
            setUnfavoriting(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in" dir={direction}>
            <h2 className="text-2xl font-bold text-[var(--text-main)]">
                {language === 'ar' ? 'معلمي المفضلون' : 'My Favorites'}
            </h2>

            {loading ? (
                <div className="flex justify-center p-10">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : teachers.length === 0 ? (
                <div className="text-center py-16 bg-[var(--light-bg)] rounded-[var(--radius-md)] border border-dashed border-[var(--border)]">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--light-bg)] mb-4">
                        <Heart className="text-[var(--text-muted)]" size={28} />
                    </div>
                    <p className="text-[var(--text-muted)] font-medium">
                        {language === 'ar' ? 'لا يوجد معلمون مفضلون بعد' : 'No favorite teachers yet'}
                    </p>
                    <p className="text-[var(--text-muted)] text-sm mt-1">
                        {language === 'ar' ? 'أضف معلمين إلى المفضلة لسهولة الوصول' : 'Add teachers to favorites for quick access'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {teachers.map(teacher => {
                        const name = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || (language === 'ar' ? 'غير معروف' : 'Unknown');
                        const photo = teacher.profile?.profile_photo;
                        const flag = COUNTRIES.find(c => c.label.toLowerCase() === (teacher.nationality || '').toLowerCase())?.flag || '';
                        return (
                            <div
                                key={teacher.id}
                                className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--border)] p-4 flex items-center justify-between hover:shadow-[var(--shadow-md)] transition-shadow"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg overflow-hidden shrink-0">
                                        {photo ? (
                                            <img src={getStorageUrl(photo)} alt={name} className="h-full w-full object-cover" />
                                        ) : (
                                            (name.charAt(0) || '?').toUpperCase()
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            {flag && <span className="text-base">{flag}</span>}
                                            <p className="font-semibold text-[var(--text-main)] truncate">{name}</p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {typeof teacher.profile?.rating === 'number' && teacher.profile.rating > 0 && (
                                                <span className="flex items-center gap-1 text-xs text-amber-500">
                                                    <Star size={12} fill="currentColor" />
                                                    <span className="text-[var(--text-muted)] font-medium">{teacher.profile.rating.toFixed(1)}</span>
                                                </span>
                                            )}
                                            {(teacher.profile?.subjects_count ?? 0) > 0 && (
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    {language === 'ar'
                                                        ? `${teacher.profile.subjects_count} مادة`
                                                        : `${teacher.profile.subjects_count} subject${teacher.profile.subjects_count !== 1 ? 's' : ''}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleUnfavorite(teacher.id)}
                                    disabled={unfavoriting === teacher.id}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors shrink-0"
                                >
                                    {unfavoriting === teacher.id ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Heart size={14} fill="currentColor" />
                                    )}
                                    {language === 'ar' ? 'إزالة' : 'Remove'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};