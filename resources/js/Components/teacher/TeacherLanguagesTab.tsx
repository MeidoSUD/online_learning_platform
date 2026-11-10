import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Globe, Plus, Trash2, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { languageService, authService, UserData } from '../../Services/api';

interface LanguageItem {
  id: number;
  name_ar?: string;
  name_en?: string;
  name?: string;
}

interface TeacherLanguagesTabProps {
  user?: UserData;
}

export const TeacherLanguagesTab: React.FC<TeacherLanguagesTabProps> = ({ user }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [teacherLanguages, setTeacherLanguages] = useState<LanguageItem[]>([]);
  const [allLanguages, setAllLanguages] = useState<LanguageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherId, setTeacherId] = useState<number | null>(user?.id ?? null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getName = (item: LanguageItem) => {
    if (isAr) return item.name_ar || item.name || item.name_en || '';
    return item.name_en || item.name || item.name_ar || '';
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let tid = user?.id;
      if (!tid) {
        const res = await authService.getUserDetails();
        const u = res.user?.data || res.data || res;
        tid = u?.id;
      }
      if (!tid) throw new Error(isAr ? 'تعذر تحديد المعرف' : 'User ID not found');
      setTeacherId(tid);

      const [allRes, mineRes] = await Promise.all([
        languageService.getAll().catch(() => []),
        languageService.getTeacherLanguages(tid).catch(() => []),
      ]);

      setAllLanguages(Array.isArray(allRes) ? allRes : []);
      setTeacherLanguages(Array.isArray(mineRes) ? mineRes : []);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || (isAr ? 'فشل تحميل بيانات اللغات' : 'Failed to load languages'));
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const availableLanguages = allLanguages.filter(
    (lang) => !teacherLanguages.some((tl) => tl.id === lang.id)
  );

  const handleOpenAddModal = () => {
    if (availableLanguages.length === 0) {
      alert(isAr ? 'تمت إضافة جميع اللغات المتاحة مسبقاً' : 'All available languages already added');
      return;
    }
    setSelectedIds([]);
    setIsAddOpen(true);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddLanguages = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    try {
      const updated = await languageService.addTeacherLanguages(selectedIds);
      if (Array.isArray(updated) && updated.length > 0) {
        setTeacherLanguages(updated);
      } else if (teacherId) {
        const refreshed = await languageService.getTeacherLanguages(teacherId);
        setTeacherLanguages(Array.isArray(refreshed) ? refreshed : []);
      }
      setIsAddOpen(false);
      setSelectedIds([]);
    } catch (e: any) {
      alert(e?.message || (isAr ? 'فشل إضافة اللغات' : 'Failed to add languages'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLanguage = async (langId: number) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذه اللغة من قائمة تدريسك؟' : 'Are you sure you want to delete this language?')) {
      return;
    }

    setSaving(true);
    try {
      await languageService.deleteTeacherLanguage(langId);
      if (teacherId) {
        const refreshed = await languageService.getTeacherLanguages(teacherId);
        setTeacherLanguages(Array.isArray(refreshed) ? refreshed : []);
      } else {
        setTeacherLanguages((prev) => prev.filter((l) => l.id !== langId));
      }
    } catch (e: any) {
      alert(e?.message || (isAr ? 'فشل حذف اللغة' : 'Failed to delete language'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D4A5F]">
            {isAr ? 'إدارة اللغات' : 'Manage Languages'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'حدد اللغات التي تقدم دروساً فيها لتظهر في نتائج بحث الطلاب'
              : 'Specify the languages you teach to appear in student search results'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5B9F48] hover:bg-[#4d863d] text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Plus size={16} />
          <span>{isAr ? 'إضافة لغة جديدة' : 'Add Language'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="animate-spin text-[#5B9F48] h-10 w-10" />
        </div>
      ) : teacherLanguages.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Globe size={32} />
          </div>
          <h3 className="text-base font-bold text-[#0D4A5F]">
            {isAr ? 'لم تقم بإضافة أي لغات حتى الآن' : 'No languages added yet'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isAr
              ? 'أضف اللغات التي تتقن تدريسها لتمكين الطلاب الراغبين بتعلم اللغات من حجز حصص معك'
              : 'Add languages you teach so students can book lessons with you'}
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#5B9F48] text-white rounded-xl text-xs font-bold hover:bg-[#4d863d] transition shadow-sm"
          >
            <Plus size={16} />
            <span>{isAr ? 'إضافة لغة' : 'Add Language'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {teacherLanguages.map((lang) => (
            <div
              key={lang.id}
              className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-3 hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Globe size={22} />
                </div>
                <span className="font-bold text-sm text-slate-800">
                  {getName(lang)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteLanguage(lang.id)}
                disabled={saving}
                className="p-2 text-slate-400 hover:text-red-600 rounded-xl transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="absolute top-5 left-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0D4A5F]">
                  {isAr ? 'إضافة لغات التدريس' : 'Add Languages'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr ? 'اختر واحدة أو أكثر من اللغات المتاحة' : 'Select one or more available languages'}
                </p>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto py-3 space-y-2">
              {availableLanguages.map((lang) => {
                const isSelected = selectedIds.includes(lang.id);
                return (
                  <div
                    key={lang.id}
                    onClick={() => toggleSelect(lang.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-purple-50/60 border-purple-300'
                        : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800">
                      {getName(lang)}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={13} />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                disabled={saving}
                className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleAddLanguages}
                disabled={saving || selectedIds.length === 0}
                className="flex-1 py-3 px-4 bg-[#5B9F48] hover:bg-[#4d863d] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{isAr ? 'إضافة اللغات' : 'Add Selected'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
