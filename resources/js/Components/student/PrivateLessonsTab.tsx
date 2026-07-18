import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Search, Filter, X, Loader2, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { studentService, ReferenceItem } from '../../Services/api';
import { TeacherCard } from './TeacherCard';

interface PrivateLessonsTabProps {
  onTeacherSelect?: (teacher: any) => void;
}

export const PrivateLessonsTab: React.FC<PrivateLessonsTabProps> = ({ onTeacherSelect }) => {
  const { t, direction, language } = useLanguage();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [priceRange, setPriceRange] = useState(500);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [levels, setLevels] = useState<ReferenceItem[]>([]);
  const [classes, setClasses] = useState<ReferenceItem[]>([]);
  const [subjects, setSubjects] = useState<ReferenceItem[]>([]);

  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    studentService.getEducationLevels()
      .then(data => setLevels(Array.isArray(data) ? data : []))
      .catch(() => setLevels([]));
  }, []);

  useEffect(() => {
    if (selectedLevel) {
      studentService.getClasses(Number(selectedLevel))
        .then(data => setClasses(Array.isArray(data) ? data : []))
        .catch(() => setClasses([]));
      setSelectedClass('');
      setSubjects([]);
      setSelectedSubject('');
    } else {
      setClasses([]);
      setSubjects([]);
      setSelectedClass('');
      setSelectedSubject('');
    }
  }, [selectedLevel]);

  useEffect(() => {
    if (selectedClass) {
      studentService.getReferenceSubjects(Number(selectedClass))
        .then(data => setSubjects(Array.isArray(data) ? data : []))
        .catch(() => setSubjects([]));
      setSelectedSubject('');
    } else {
      setSubjects([]);
      setSelectedSubject('');
    }
  }, [selectedClass]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (selectedLevel) filters.level_id = selectedLevel;
      if (selectedClass) filters.class_id = selectedClass;
      if (selectedSubject) filters.subject_id = selectedSubject;
      if (priceRange) filters.price_max = priceRange;
      if (searchQuery) filters.search = searchQuery;

      const data = await studentService.getTeachers(filters);
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleApplyFilters = () => {
    fetchTeachers();
    setShowMobileFilters(false);
  };

  const handleSearch = () => {
    fetchTeachers();
  };

  const getName = (item: ReferenceItem) => language === 'ar' ? (item.name_ar || item.name) : (item.name_en || item.name);

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in relative">

      <div className="lg:hidden mb-4">
        <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => setShowMobileFilters(true)}>
          <Filter size={18} /> {t.filters}
        </Button>
      </div>

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
              options={[{ value: '', label: language === 'ar' ? 'الكل' : 'All' }, ...levels.map(l => ({ value: String(l.id), label: getName(l) }))]}
              className="mb-0"
            />
            <Select
              label={language === 'ar' ? 'الصف الدراسي' : 'Class'}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              options={[{ value: '', label: language === 'ar' ? 'الكل' : 'All' }, ...classes.map(c => ({ value: String(c.id), label: getName(c) }))]}
              disabled={!selectedLevel}
              className="mb-0"
            />
            <Select
              label={language === 'ar' ? 'المادة' : 'Subject'}
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              options={[{ value: '', label: language === 'ar' ? 'الكل' : 'All' }, ...subjects.map(s => ({ value: String(s.id), label: getName(s) }))]}
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
              setSearchQuery('');
              fetchTeachers();
            }}>{t.clearFilters}</Button>
          </div>
        </div>
      </div>

      {showMobileFilters && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setShowMobileFilters(false)}></div>
      )}

      <div className="flex-1 space-y-6">
        <div className="relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${direction === 'rtl' ? 'right-4' : 'left-4'}`} size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
            <p className="text-slate-500">{language === 'ar' ? 'لم يتم العثور على معلمين' : 'No teachers found matching your criteria.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {teachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                onViewDetails={onTeacherSelect || (() => {})}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
