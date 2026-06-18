import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Search, Star, Filter, X, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { studentService, TeacherProfile, getStorageUrl, ReferenceItem } from '../../Services/api';

interface PrivateLessonsTabProps {
  onTeacherSelect?: (teacher: TeacherProfile) => void;
}

export const PrivateLessonsTab: React.FC<PrivateLessonsTabProps> = ({ onTeacherSelect }) => {
  const { t, direction, language } = useLanguage();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [priceRange, setPriceRange] = useState(500);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);

  // Cascading Filters State
  const [levels, setLevels] = useState<ReferenceItem[]>([]);
  const [classes, setClasses] = useState<ReferenceItem[]>([]);
  const [subjects, setSubjects] = useState<ReferenceItem[]>([]);

  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Load Levels on mount
  useEffect(() => {
      const loadLevels = async () => {
          try {
              // Using studentService
              const data = await studentService.getEducationLevels();
              setLevels(Array.isArray(data) ? data : []);
          } catch(e) { 
            console.error(e); 
            setLevels([]); 
          }
      };
      loadLevels();
  }, []);

  // Load Classes when Level changes
  useEffect(() => {
      if(selectedLevel) {
          // Using studentService
          studentService.getClasses(Number(selectedLevel))
              .then(data => setClasses(Array.isArray(data) ? data : []))
              .catch(() => setClasses([]));
          // Reset downstream
          setSelectedClass('');
          setClasses([]);
          setSelectedSubject('');
          setSubjects([]);
      } else {
          setClasses([]);
          setSubjects([]);
          setSelectedClass('');
          setSelectedSubject('');
      }
  }, [selectedLevel]);

  // Load Subjects when Class changes
  useEffect(() => {
      if(selectedClass) {
          // Using studentService (getReferenceSubjects)
          studentService.getReferenceSubjects(Number(selectedClass))
              .then(data => setSubjects(Array.isArray(data) ? data : []))
              .catch(() => setSubjects([]));
          // Reset downstream
          setSelectedSubject('');
          setSubjects([]);
      } else {
          setSubjects([]);
          setSelectedSubject('');
      }
  }, [selectedClass]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async (extraFilters?: any) => {
    setLoading(true);
    try {
      // Build filter object
      const filters: any = {};
      if (selectedLevel) filters.level_id = selectedLevel;
      if (selectedClass) filters.class_id = selectedClass;
      if (selectedSubject) filters.subject_id = selectedSubject;
      if (priceRange) filters.price_max = priceRange;
      
      const data = await studentService.getTeachers(filters);
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchTeachers();
    setShowMobileFilters(false);
  };

  const getName = (item: ReferenceItem) => language === 'ar' ? (item.name_ar || item.name) : (item.name_en || item.name);

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in relative">
      
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => setShowMobileFilters(true)}>
            <Filter size={18} /> {t.filters}
        </Button>
      </div>

      {/* Sidebar Filters */}
      <div className={`
        fixed inset-y-0 z-40 w-64 bg-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:w-72 lg:block lg:bg-transparent
        ${showMobileFilters ? 'translate-x-0' : (direction === 'rtl' ? 'translate-x-full' : '-translate-x-full')}
        ${direction === 'rtl' ? 'right-0 left-auto' : 'left-0 right-auto'}
      `}>
        <div className="h-full overflow-y-auto p-6 bg-white rounded-2xl border border-slate-100 shadow-sm lg:sticky lg:top-24">
            <div className="flex justify-between items-center mb-6 lg:hidden">
                <h3 className="font-bold text-lg">{t.filters}</h3>
                <button onClick={() => setShowMobileFilters(false)}><X size={24} /></button>
            </div>

            <div className="space-y-4">
                <Select 
                    label={language === 'ar' ? 'المرحلة الدراسية' : 'Education Level'}
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    options={[{value: '', label: language === 'ar' ? 'الكل' : 'All'}, ...levels.map(l => ({value: String(l.id), label: getName(l)}))]}
                    className="mb-0"
                />
                <Select 
                    label={language === 'ar' ? 'الصف الدراسي' : 'Class'}
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    options={[{value: '', label: language === 'ar' ? 'الكل' : 'All'}, ...classes.map(c => ({value: String(c.id), label: getName(c)}))]}
                    disabled={!selectedLevel}
                    className="mb-0"
                />
                <Select 
                    label={language === 'ar' ? 'المادة' : 'Subject'}
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    options={[{value: '', label: language === 'ar' ? 'الكل' : 'All'}, ...subjects.map(s => ({value: String(s.id), label: getName(s)}))]}
                    disabled={!selectedClass}
                    className="mb-0"
                />

                <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">{t.rating}</h4>
                    <div className="space-y-2">
                        {[5, 4, 3].map(star => (
                            <label key={star} className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" />
                                <div className="flex text-amber-400 group-hover:opacity-80">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={16} fill={i < star ? "currentColor" : "none"} className={i >= star ? "text-slate-300" : ""} />
                                    ))}
                                </div>
                                <span className="text-sm text-slate-600">& Up</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">{t.priceRange}</h4>
                    <input 
                        type="range" 
                        min="50" 
                        max="500" 
                        value={priceRange} 
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-sm text-slate-500 mt-2 font-medium">
                        <span>50 {t.sar}</span>
                        <span>{priceRange} {t.sar}</span>
                    </div>
                </div>

                <Button className="w-full mt-4" onClick={handleApplyFilters}>{t.applyFilters}</Button>
                <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-700" onClick={() => {
                    setSelectedLevel('');
                    setSelectedClass('');
                    setSelectedSubject('');
                    setPriceRange(500);
                    fetchTeachers({});
                }}>{t.clearFilters}</Button>
            </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setShowMobileFilters(false)}></div>
      )}

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Search Bar */}
        <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${direction === 'rtl' ? 'right-4' : 'left-4'}`} size={20} />
            <input 
                type="text" 
                placeholder={t.searchPlaceholder}
                className={`w-full h-12 rounded-xl border border-slate-200 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all ${direction === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
            />
        </div>

        {loading ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        ) : teachers.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500">No teachers found matching your criteria.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {teachers.map((teacher) => (
                    <div key={teacher.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                        <div className="p-5 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-3">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 overflow-hidden">
                                        {teacher.profile_image ? (
                                            <img src={getStorageUrl(teacher.profile_image)} alt={teacher.first_name} className="h-full w-full object-cover" />
                                        ) : (
                                            teacher.first_name.charAt(0)
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{teacher.first_name} {teacher.last_name}</h3>
                                        <p className="text-xs text-slate-500">{teacher.nationality}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg text-amber-500 text-xs font-bold">
                                    <Star size={12} fill="currentColor" /> {teacher.rating?.toFixed(1) || '5.0'}
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                {teacher.teacher_subjects?.slice(0, 2).map(sub => (
                                     <span key={sub.id} className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs font-semibold mb-2 mr-1">
                                        {sub.title}
                                    </span>
                                ))}
                                <p className="text-sm text-slate-600 line-clamp-2 mt-2">{teacher.bio || "No biography provided."}</p>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <div>
                                <span className="block text-xs text-slate-400">Rate</span>
                                <span className="font-bold text-primary">{teacher.individual_hour_price} <span className="text-xs font-normal text-slate-500">{t.sar}{t.perHour}</span></span>
                            </div>
                            <Button 
                                className="h-9 px-4 text-sm"
                                onClick={() => onTeacherSelect && onTeacherSelect(teacher)}
                            >
                                {t.bookNow}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};