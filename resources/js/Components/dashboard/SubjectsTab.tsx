import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Plus, Trash2, Info, ChevronRight, X, Minus, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { teacherService, ReferenceItem, UserData } from '../../Services/api';

interface SubjectItem {
  id: number;
  name?: string;
  name_ar?: string;
  name_en?: string;
  class_id?: number;
  education_level_id?: number;
  level_id?: number;
  class_name_ar?: string;
  class_name_en?: string;
  education_level_name_ar?: string;
  education_level_name_en?: string;
}

interface ClassItem {
  id: number;
  name?: string;
  name_ar?: string;
  name_en?: string;
  education_level_id?: number;
  subjects?: SubjectItem[];
}

interface LevelItem {
  id: number;
  name?: string;
  name_ar?: string;
  name_en?: string;
  classes?: ClassItem[];
}

interface SubjectsTabProps {
  user?: UserData;
  onNavigate?: (tab: string) => void;
}

const subjectBelongsToLevel = (subject: SubjectItem, level: LevelItem): boolean => {
  if (!subject || !level) return false;
  const classIds = new Set((level.classes || []).map((c) => Number(c.id)));
  if (classIds.size > 0 && subject.class_id) {
    return classIds.has(Number(subject.class_id));
  }
  const levelId = subject.education_level_id ?? subject.level_id;
  return Number(levelId) === Number(level.id);
};

const subjectBelongsToClass = (subject: SubjectItem, schoolClass: ClassItem, level: LevelItem): boolean => {
  if (!subject || !schoolClass) return false;
  return Number(subject.class_id) === Number(schoolClass.id) && subjectBelongsToLevel(subject, level);
};

const getShortClassName = (schoolClass: ClassItem, subjectsList: SubjectItem[], currentLvl: LevelItem): string => {
  const raw = schoolClass.name_ar || schoolClass.name || '';
  let name = raw
    .replace(/الصف/g, '')
    .replace(/الابتدائي/g, '')
    .replace(/المتوسط/g, '')
    .replace(/الثانوي/g, '')
    .trim();
  if (!name) name = raw;
  const count = subjectsList.filter((s) => subjectBelongsToClass(s, schoolClass, currentLvl)).length;
  return count > 0 ? `${name} (${count})` : name;
};

const getLevelLabel = (level: LevelItem, subjectsList: SubjectItem[]): string => {
  const name = level.name_ar || level.name || '';
  const count = subjectsList.filter((s) => subjectBelongsToLevel(s, level)).length;
  return count > 0 ? `${name} (${count})` : name;
};

export const SubjectsTab: React.FC<SubjectsTabProps> = ({ user, onNavigate }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [levels, setLevels] = useState<LevelItem[]>([]);
  const [mySubjects, setMySubjects] = useState<SubjectItem[]>([]);

  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  const [subjectToDelete, setSubjectToDelete] = useState<SubjectItem | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  const [sheetLevelId, setSheetLevelId] = useState<number | null>(null);
  const [sheetClassId, setSheetClassId] = useState<number | null>(null);
  const [draftSubjects, setDraftSubjects] = useState<SubjectItem[]>([]);
  const [fallbackSubjectsMap, setFallbackSubjectsMap] = useState<Record<number, SubjectItem[]>>({});
  const [loadingSheetSubjects, setLoadingSheetSubjects] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [levelsData, subjectsData] = await Promise.all([
        teacherService.getEducationLevels(),
        teacherService.getSubjects(),
      ]);

      const normalizedLevels = Array.isArray(levelsData) ? levelsData : [];
      const normalizedSubjects = Array.isArray(subjectsData) ? subjectsData : [];

      setLevels(normalizedLevels);
      setMySubjects(normalizedSubjects);

      if (normalizedLevels.length > 0) {
        const firstLevel = normalizedLevels[0];
        setSelectedLevelId(firstLevel.id);
        const classes = firstLevel.classes || [];
        if (classes.length > 0) {
          setSelectedClassId(classes[0].id);
        }
      }
    } catch (err: any) {
      showToast('error', err?.message || 'تعذر تحميل بيانات الفصول والمواد');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const activeLevel = useMemo(() => {
    if (!levels.length) return null;
    return levels.find((l) => l.id === selectedLevelId) || levels[0];
  }, [levels, selectedLevelId]);

  const activeClasses = useMemo(() => {
    return activeLevel?.classes || [];
  }, [activeLevel]);

  const activeClass = useMemo(() => {
    if (!activeClasses.length) return null;
    return activeClasses.find((c) => c.id === selectedClassId) || activeClasses[0];
  }, [activeClasses, selectedClassId]);

  const filteredSubjects = useMemo(() => {
    if (!activeLevel || !activeClass) return [];
    return mySubjects.filter((subject) => subjectBelongsToClass(subject, activeClass, activeLevel));
  }, [mySubjects, activeLevel, activeClass]);

  const handleLevelSelect = (levelId: number) => {
    setSelectedLevelId(levelId);
    const targetLevel = levels.find((l) => l.id === levelId);
    const classes = targetLevel?.classes || [];
    setSelectedClassId(classes.length > 0 ? classes[0].id : null);
  };

  const handleClassSelect = (classId: number) => {
    setSelectedClassId(classId);
  };

  const handleOpenAddSheet = () => {
    if (!levels.length) return;
    const initialLvlId = selectedLevelId || levels[0].id;
    const lvl = levels.find((l) => l.id === initialLvlId) || levels[0];
    const initialClsId = selectedClassId || (lvl.classes && lvl.classes.length > 0 ? lvl.classes[0].id : null);

    setSheetLevelId(initialLvlId);
    setSheetClassId(initialClsId);
    setDraftSubjects([...mySubjects]);
    setIsAddSheetOpen(true);

    if (initialClsId) {
      fetchClassSubjectsIfNeeded(initialClsId, lvl);
    }
  };

  const fetchClassSubjectsIfNeeded = async (classId: number, currentLvl?: LevelItem) => {
    const lvl = currentLvl || levels.find((l) => l.id === sheetLevelId);
    const cls = lvl?.classes?.find((c) => c.id === classId);
    if (cls?.subjects && cls.subjects.length > 0) {
      return;
    }
    if (fallbackSubjectsMap[classId]) {
      return;
    }

    setLoadingSheetSubjects(true);
    try {
      const data = await teacherService.getSubjectsByClass(classId);
      const list = Array.isArray(data) ? data : [];
      setFallbackSubjectsMap((prev) => ({ ...prev, [classId]: list }));
    } catch {
    } finally {
      setLoadingSheetSubjects(false);
    }
  };

  const handleSheetLevelSelect = (levelId: number) => {
    setSheetLevelId(levelId);
    const targetLevel = levels.find((l) => l.id === levelId);
    const classes = targetLevel?.classes || [];
    const nextClassId = classes.length > 0 ? classes[0].id : null;
    setSheetClassId(nextClassId);
    if (nextClassId && targetLevel) {
      fetchClassSubjectsIfNeeded(nextClassId, targetLevel);
    }
  };

  const handleSheetClassSelect = (classId: number) => {
    setSheetClassId(classId);
    fetchClassSubjectsIfNeeded(classId);
  };

  const activeSheetLevel = useMemo(() => {
    if (!levels.length) return null;
    return levels.find((l) => l.id === sheetLevelId) || levels[0];
  }, [levels, sheetLevelId]);

  const activeSheetClasses = useMemo(() => {
    return activeSheetLevel?.classes || [];
  }, [activeSheetLevel]);

  const activeSheetClass = useMemo(() => {
    if (!activeSheetClasses.length) return null;
    return activeSheetClasses.find((c) => c.id === sheetClassId) || activeSheetClasses[0];
  }, [activeSheetClasses, sheetClassId]);

  const availableSubjectsForSheet = useMemo(() => {
    if (!activeSheetClass) return [];
    if (activeSheetClass.subjects && activeSheetClass.subjects.length > 0) {
      return activeSheetClass.subjects;
    }
    if (sheetClassId && fallbackSubjectsMap[sheetClassId]) {
      return fallbackSubjectsMap[sheetClassId];
    }
    return [];
  }, [activeSheetClass, sheetClassId, fallbackSubjectsMap]);

  const isSubjectInDraft = (subject: SubjectItem) => {
    if (!sheetClassId || !activeSheetLevel) return false;
    return draftSubjects.some(
      (s) =>
        (Number(s.id) === Number(subject.id) || s.name === subject.name || s.name_ar === subject.name_ar) &&
        Number(s.class_id) === Number(sheetClassId) &&
        subjectBelongsToLevel(s, activeSheetLevel)
    );
  };

  const toggleSubjectInDraft = (subject: SubjectItem) => {
    if (!sheetClassId || !activeSheetLevel || !sheetLevelId) return;

    const existsIndex = draftSubjects.findIndex(
      (s) =>
        (Number(s.id) === Number(subject.id) || s.name === subject.name || s.name_ar === subject.name_ar) &&
        Number(s.class_id) === Number(sheetClassId) &&
        subjectBelongsToLevel(s, activeSheetLevel)
    );

    if (existsIndex !== -1) {
      setDraftSubjects((prev) => prev.filter((_, idx) => idx !== existsIndex));
    } else {
      setDraftSubjects((prev) => [
        ...prev,
        {
          id: subject.id,
          name: subject.name || subject.name_ar,
          name_ar: subject.name_ar || subject.name,
          name_en: subject.name_en || subject.name,
          class_id: sheetClassId,
          education_level_id: sheetLevelId,
        },
      ]);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const draftIds = draftSubjects.map((s) => Number(s.id)).filter((id) => !isNaN(id) && id > 0);
      if (draftIds.length > 0) {
        await teacherService.addSubjects(draftIds);
      }

      const subjectsData = await teacherService.getSubjects();
      setMySubjects(Array.isArray(subjectsData) ? subjectsData : []);
      setIsAddSheetOpen(false);
      showToast('success', 'تم حفظ المواد بنجاح');
    } catch (err: any) {
      showToast('error', err?.message || 'حدث خطأ أثناء حفظ المواد');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!subjectToDelete) return;
    setIsDeleting(true);
    try {
      await teacherService.deleteSubject(subjectToDelete.id);
      const subjectsData = await teacherService.getSubjects();
      setMySubjects(Array.isArray(subjectsData) ? subjectsData : []);
      setSubjectToDelete(null);
      showToast('success', 'تم حذف المادة بنجاح');
    } catch (err: any) {
      showToast('error', err?.message || 'تعذر حذف المادة');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleHeaderBack = () => {
    if (onNavigate) {
      onNavigate('overview');
    } else if (window.history.length > 1) {
      window.history.back();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#EFF6F4]">
        <Loader2 className="w-10 h-10 text-[#5B9F48] animate-spin mb-3" />
        <p className="text-sm font-medium text-[#0D4A5F]">جاري تحميل الفصول والمواد...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] bg-[#EFF6F4] flex flex-col justify-between select-none" dir="rtl">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg text-white font-medium text-sm ${
              toast.type === 'success' ? 'bg-[#5B9F48]' : 'bg-[#E43700]'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div>
        <div className="px-4 md:px-8 py-3.5 flex items-center justify-between bg-[#EFF6F4]">
          <button
            type="button"
            onClick={handleHeaderBack}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs text-[#0D4A5F] hover:bg-slate-50 transition-colors cursor-pointer"
            title="رجوع"
          >
            <ChevronRight size={22} />
          </button>

          <h1 className="text-lg md:text-xl font-bold text-[#0D4A5F]">الفصول والمواد</h1>

          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs text-[#0D4A5F] hover:bg-slate-50 transition-colors cursor-pointer"
            title="معلومات"
          >
            <Info size={20} />
          </button>
        </div>

        {levels.length > 0 && (
          <div className="px-4 md:px-8 mt-2">
            <div className="bg-white rounded-2xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto no-scrollbar">
              {levels.map((level) => {
                const isSelected = selectedLevelId === level.id;
                const label = getLevelLabel(level, mySubjects);
                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => handleLevelSelect(level.id)}
                    className={`flex-1 min-w-[90px] py-2.5 px-3 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer text-center ${
                      isSelected
                        ? 'bg-[#EAF2F0] text-[#0D4A5F] shadow-xs'
                        : 'bg-transparent text-[#0D4A5F] hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeClasses.length > 0 && (
          <div className="px-4 md:px-8 mt-3.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-sm font-medium text-[#798B8F] shrink-0">الصف:</span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {activeClasses.map((schoolClass) => {
                const isSelected = selectedClassId === schoolClass.id;
                const label = getShortClassName(schoolClass, mySubjects, activeLevel!);
                return (
                  <button
                    key={schoolClass.id}
                    type="button"
                    onClick={() => handleClassSelect(schoolClass.id)}
                    className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#0D4A5F] text-white shadow-sm'
                        : 'bg-white text-[#0D4A5F] shadow-xs hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-4 md:px-8 mt-4 space-y-3 pb-28">
          {filteredSubjects.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 rounded-full bg-[#EAF2F0] flex items-center justify-center text-[#0D4A5F] mb-4">
                <BookOpen size={44} className="stroke-[1.5]" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-[#0D4A5F] mb-2">ابدأ بإضافة المواد الدراسية</h3>
              <p className="text-sm text-[#67777A] max-w-sm px-4 leading-relaxed mb-6">
                حدّد المواد الدراسية المناسبة لك ليتمكن الطلاب من حجز الحصص.
              </p>
              <button
                type="button"
                onClick={handleOpenAddSheet}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#5B9F48] hover:bg-[#4d863c] text-white font-bold text-sm rounded-2xl shadow-sm transition-all cursor-pointer"
              >
                <Plus size={20} />
                <span>إضافة مادة</span>
              </button>
            </div>
          ) : (
            filteredSubjects.map((subject) => (
              <div
                key={subject.id}
                className="h-[68px] bg-white rounded-2xl shadow-[0_2px_8px_rgba(13,74,95,0.04)] border border-slate-100 px-4 flex items-center justify-between transition-all hover:shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setSubjectToDelete(subject)}
                  className="w-10 h-10 rounded-full bg-[#FFF0ED] text-[#E43700] flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer"
                  title="حذف المادة"
                >
                  <Trash2 size={20} />
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-sm md:text-base font-bold text-[#0D4A5F]">
                    {subject.name_ar || subject.name || subject.name_en}
                  </span>
                  <BookOpen size={22} className="text-[#0D4A5F]" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sticky bottom-0 left-0 right-0 p-4 md:p-6 bg-[#EFF6F4]/90 backdrop-blur-md border-t border-slate-200/50 md:border-0 z-20 flex justify-center">
        <div className="w-full max-w-3xl">
          <button
            type="button"
            onClick={handleOpenAddSheet}
            className="w-full h-14 bg-[#5B9F48] hover:bg-[#4d863c] text-white text-base font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
          >
            <Plus size={22} />
            <span>إضافة مادة</span>
          </button>
        </div>
      </div>

      {subjectToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertTriangle size={30} />
            </div>

            <h3 className="text-lg font-bold text-[#0D4A5F] mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-[#67777A] mb-6 leading-relaxed">
              هل أنت متأكد من حذف مادة &quot;{subjectToDelete.name_ar || subjectToDelete.name}&quot;؟
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-3 bg-[#E43700] hover:bg-red-700 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <span>حذف</span>}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSubjectToDelete(null)}
                className="flex-1 py-3 bg-[#9EAEB3] hover:bg-slate-400 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {showInfoModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#EAF2F0] text-[#0D4A5F] flex items-center justify-center mx-auto mb-3">
              <Info size={26} />
            </div>
            <h3 className="text-lg font-bold text-[#0D4A5F] text-center mb-2">الفصول والمواد الدراسية</h3>
            <p className="text-sm text-[#67777A] text-center leading-relaxed mb-6">
              تتيح لك هذه الشاشة إدارة وتحديد المواد الدراسية والمراحل والصفوف التي تقدم دروساً خصوصية فيها. اختيار المواد بدقة يساعد الطلاب في العثور عليك وحجز الحصص المناسبة معك.
            </p>
            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="w-full py-3 bg-[#0D4A5F] hover:bg-[#093544] text-white font-bold rounded-xl transition-colors cursor-pointer"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}

      {isAddSheetOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-[#EFF6F4] w-full md:max-w-2xl rounded-t-[28px] md:rounded-[28px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-200/60 bg-[#EFF6F4]">
              <button
                type="button"
                onClick={() => setIsAddSheetOpen(false)}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#0D4A5F] shadow-xs hover:bg-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>

              <h2 className="text-base md:text-lg font-bold text-[#0D4A5F]">إضافة مادة دراسية</h2>

              <div className="w-10" />
            </div>

            {levels.length > 0 && (
              <div className="px-5 mt-3">
                <div className="bg-white rounded-2xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {levels.map((level) => {
                    const isSelected = sheetLevelId === level.id;
                    const label = getLevelLabel(level, draftSubjects);
                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => handleSheetLevelSelect(level.id)}
                        className={`flex-1 min-w-[85px] py-2 px-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer text-center ${
                          isSelected
                            ? 'bg-[#EAF2F0] text-[#0D4A5F] shadow-xs'
                            : 'bg-transparent text-[#0D4A5F] hover:bg-slate-50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeSheetClasses.length > 0 && (
              <div className="px-5 mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-sm font-medium text-[#798B8F] shrink-0">الصف:</span>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {activeSheetClasses.map((schoolClass) => {
                    const isSelected = sheetClassId === schoolClass.id;
                    const label = getShortClassName(schoolClass, draftSubjects, activeSheetLevel!);
                    return (
                      <button
                        key={schoolClass.id}
                        type="button"
                        onClick={() => handleSheetClassSelect(schoolClass.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-[#0D4A5F] text-white shadow-sm'
                            : 'bg-white text-[#0D4A5F] shadow-xs hover:bg-slate-50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-[220px]">
              {loadingSheetSubjects ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#5B9F48] animate-spin mb-2" />
                  <p className="text-xs text-[#798B8F]">جاري تحميل المواد المتاحة...</p>
                </div>
              ) : availableSubjectsForSheet.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#798B8F]">
                  لا توجد مواد مسجلة لهذا الصف حالياً
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availableSubjectsForSheet.map((subject) => {
                    const isSelected = isSubjectInDraft(subject);
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => toggleSubjectInDraft(subject)}
                        className={`h-[52px] px-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#E8F6EF] border-[#5B9F48] shadow-xs'
                            : 'bg-white border-transparent shadow-xs hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            isSelected ? 'text-[#5B9F48]' : 'text-[#0D4A5F]'
                          }`}
                        >
                          {isSelected ? <Minus size={18} /> : <Plus size={18} />}
                        </div>

                        <span
                          className={`text-xs md:text-sm font-semibold truncate ${
                            isSelected ? 'text-[#5B9F48]' : 'text-[#0D4A5F]'
                          }`}
                        >
                          {subject.name_ar || subject.name || subject.name_en}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 bg-[#EFF6F4] border-t border-slate-200/60">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveDraft}
                className="w-full h-12 bg-[#5B9F48] hover:bg-[#4d863c] text-white font-bold text-sm md:text-base rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
              >
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <span>حفظ</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};