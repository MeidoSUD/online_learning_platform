
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { BookOpen, Plus, Trash2, Layers, GraduationCap, Loader2, Lock, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { teacherService, ReferenceItem, UserData } from '../../Services/api';

interface SubjectsTabProps {
    user?: UserData;
}

export const SubjectsTab: React.FC<SubjectsTabProps> = ({ user }) => {
  const { t, language } = useLanguage();
  
  const isVerified = user?.verified === true || 
                     user?.verified === 1 || 
                     String(user?.verified) === '1' || 
                     String(user?.verified).toLowerCase() === 'true';

  if (user && !isVerified) {
      return (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
              <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600">
                  <Lock size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Verification Required</h3>
              <p className="text-slate-500 max-w-md text-center">
                  You must verify your account and select Private Lessons as your service before managing subjects.
              </p>
          </div>
      );
  }

  const [isLoading, setIsLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  
  const [mySubjects, setMySubjects] = useState<any[]>([]);
  const [levels, setLevels] = useState<ReferenceItem[]>([]);
  const [classes, setClasses] = useState<ReferenceItem[]>([]);
  const [subjects, setSubjects] = useState<ReferenceItem[]>([]);
  
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const getName = (item: any) => {
    if (!item) return '';
    return language === 'ar' ? (item.name_ar || item.name) : (item.name_en || item.name);
  };

  useEffect(() => {
    loadLevels();
    loadMySubjects();
  }, []);

  useEffect(() => {
      if (selectedLevel) {
          setSelectedClass('');
          setSelectedSubject('');
          loadClasses(Number(selectedLevel));
      } else {
          setClasses([]);
          setSubjects([]);
      }
  }, [selectedLevel]);

  useEffect(() => {
      if (selectedClass) {
          setSelectedSubject('');
          loadSubjects(Number(selectedClass));
      } else {
          setSubjects([]);
      }
  }, [selectedClass]);

  const loadLevels = async () => {
    try {
      const data = await teacherService.getEducationLevels();
      setLevels(data);
    } catch (e) { console.error(e); }
  };

  const loadClasses = async (levelId: number) => {
    setClassesLoading(true);
    try {
      const data = await teacherService.getClassesByLevel(levelId);
      setClasses(data);
    } catch (e) { console.error(e); }
    finally { setClassesLoading(false); }
  };

  const loadSubjects = async (classId: number) => {
    setSubjectsLoading(true);
    try {
      const data = await teacherService.getSubjectsByClass(classId);
      setSubjects(data);
    } catch (e) { console.error(e); }
    finally { setSubjectsLoading(false); }
  };

  const loadMySubjects = async () => {
    setIsLoading(true);
    try {
      const data = await teacherService.getSubjects();
      setMySubjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;

    setIsLoading(true);
    try {
      await teacherService.addSubjects([Number(selectedSubject)]);
      await loadMySubjects();
      setSelectedSubject('');
      alert(language === 'ar' ? "تم إضافة المادة بنجاح" : "Subject added successfully!");
    } catch (e: any) {
      console.error(e);
      alert(e.message || (language === 'ar' ? "فشل إضافة المادة" : "Failed to add subject"));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteSubject = async (id: number) => {
      setIsLoading(true);
      try {
          await teacherService.deleteSubject(id);
          await loadMySubjects();
          setConfirmDeleteId(null);
          alert(language === 'ar' ? "تم الحذف بنجاح" : "Subject deleted successfully");
      } catch (e: any) {
          console.error("Delete failed:", e);
          alert(e.message || (language === 'ar' ? "حدث خطأ أثناء الحذف" : "Error deleting subject"));
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
        {isLoading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-primary h-8 w-8" />
            </div>
        )}
        
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Plus className="text-primary" /> 
          {language === 'ar' ? 'إضافة مادة جديدة' : 'Add New Subject'}
        </h2>
        
        <form onSubmit={handleAddSubject} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Select
            label={language === 'ar' ? "المرحلة الدراسية" : "Education Level"}
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            options={[
                {value: '', label: language === 'ar' ? '-- اختر المرحلة --' : '-- Select Level --'}, 
                ...levels.map(l => ({ value: String(l.id), label: getName(l) }))
            ]}
            className="mb-0"
          />
          
          <Select
            label={language === 'ar' ? "الصف الدراسي" : "Class / Grade"}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            options={[
                {
                    value: '', 
                    label: classesLoading 
                        ? (language === 'ar' ? 'جاري التحميل...' : 'Loading classes...') 
                        : (language === 'ar' ? '-- اختر الصف --' : '-- Select Class --')
                }, 
                ...classes.map(c => ({ value: String(c.id), label: getName(c) }))
            ]}
            disabled={!selectedLevel || classesLoading}
            className="mb-0"
          />
          
          <Select
            label={language === 'ar' ? "المادة" : "Subject"}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            options={[
                {
                    value: '', 
                    label: subjectsLoading 
                        ? (language === 'ar' ? 'جاري التحميل...' : 'Loading subjects...') 
                        : (language === 'ar' ? '-- اختر المادة --' : '-- Select Subject --')
                }, 
                ...subjects.map(s => ({ value: String(s.id), label: getName(s) }))
            ]}
            disabled={!selectedClass || subjectsLoading}
            className="mb-0"
          />

          <div className="mb-[2px]">
            <Button type="submit" className="w-full" disabled={isLoading || !selectedSubject}>
                {isLoading ? (language === 'ar' ? 'جاري الإضافة...' : 'Adding...') : (language === 'ar' ? 'إضافة' : 'Add')}
            </Button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          {language === 'ar' ? 'المواد التي أدرسها' : 'My Teaching Subjects'}
        </h3>
        
        {mySubjects.length === 0 && !isLoading ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p className="text-slate-500">
                  {language === 'ar' ? 'لم تقم بإضافة أي مواد بعد.' : "You haven't added any subjects yet."}
                </p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {mySubjects.map((item, index) => {
               const subjectName = language === 'ar' ? (item.name_ar || item.title) : (item.name_en || item.title);
               const className = language === 'ar' ? (item.class_name_ar || item.class_title) : (item.class_name_en || item.class_title);
               const levelName = language === 'ar' ? (item.education_level_name_ar || item.class_level_title) : (item.education_level_name_en || item.class_level_title);
               const isConfirming = confirmDeleteId === item.id;

               return (
                <div key={item.id || index} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group relative">
                    <div className="h-2 bg-primary w-full"></div>
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-primary/10 text-primary rounded-lg">
                                <BookOpen size={24} />
                            </div>
                            
                            <div className="flex gap-2">
                                {isConfirming ? (
                                    <div className="flex gap-1 animate-fade-in items-center">
                                        <span className="text-[10px] font-bold text-red-500 uppercase mr-1">{language === 'ar' ? 'حذف؟' : 'Del?'}</span>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSubject(item.id); }} className="h-8 w-8 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 shadow-sm transition-colors" title="Yes"><Check size={14}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }} className="h-8 w-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors" title="No"><X size={14}/></button>
                                    </div>
                                ) : (
                                    <button 
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(item.id); }}
                                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all p-2 rounded-full cursor-pointer relative" 
                                        title="Delete Subject"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <h4 className="text-lg font-bold text-slate-900 mb-1 leading-tight">{subjectName}</h4>
                        
                        <div className="space-y-2 mt-4">
                            <div className="flex items-center text-xs text-slate-600">
                                <GraduationCap size={14} className={`shrink-0 text-slate-400 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                                {levelName || (language === 'ar' ? 'المرحلة غير محددة' : 'Level N/A')}
                            </div>
                            <div className="flex items-center text-xs text-slate-600">
                                <Layers size={14} className={`shrink-0 text-slate-400 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                                {className || (language === 'ar' ? 'الصف غير محدد' : 'Class N/A')}
                            </div>
                        </div>
                    </div>
                </div>
               );
            })}
            </div>
        )}
      </div>
    </div>
  );
};
