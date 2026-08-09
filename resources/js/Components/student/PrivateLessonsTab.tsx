import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Search, Filter, X, Loader2, Star, Tag } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { studentService, ReferenceItem } from '../../Services/api';
import { TeacherCard } from './TeacherCard';

interface PrivateLessonsTabProps {
  onTeacherSelect?: (teacher: any) => void;
}

interface ActiveFilter {
  key: string;
  label: string;
}

export const PrivateLessonsTab: React.FC<PrivateLessonsTabProps> = ({ onTeacherSelect }) => {
  const { t, direction, language } = useLanguage();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [priceRange, setPriceRange] = useState(500);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [codeQuery, setCodeQuery] = useState('');
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [codeInput, setCodeInput] = useState('');

  const [levels, setLevels] = useState<ReferenceItem[]>([]);
  const [classes, setClasses] = useState<ReferenceItem[]>([]);
  const [subjects, setSubjects] = useState<ReferenceItem[]>([]);
  const [services, setServices] = useState<ReferenceItem[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);

  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalTeachers, setTotalTeachers] = useState(0);

  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLanguageService = selectedService
    ? services.some(s => {
        const id = Number(selectedService);
        const sid = Number(s.id);
        const name = (language === 'ar' ? s.name_ar || s.name : s.name_en || s.name) || '';
        return sid === id && (name.toLowerCase().includes('language') || name.includes('لغ'));
      })
    : false;

  useEffect(() => {
    studentService.getEducationLevels()
      .then(data => setLevels(Array.isArray(data) ? data : []))
      .catch(() => setLevels([]));
    studentService.getServices()
      .then(data => setServices(Array.isArray(data) ? data : []))
      .catch(() => setServices([]));
    studentService.getLanguages()
      .then(data => setLanguages(Array.isArray(data) ? data : []))
      .catch(() => setLanguages([]));
  }, []);

  useEffect(() => {
    if (selectedLevel && !isLanguageService) {
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
  }, [selectedLevel, isLanguageService]);

  useEffect(() => {
    if (selectedClass && !isLanguageService) {
      studentService.getReferenceSubjects(Number(selectedClass))
        .then(data => setSubjects(Array.isArray(data) ? data : []))
        .catch(() => setSubjects([]));
      setSelectedSubject('');
    } else {
      setSubjects([]);
      setSelectedSubject('');
    }
  }, [selectedClass, isLanguageService]);

  const buildFilters = useCallback((page: number = 1) => {
    const filters: any = { page };
    if (selectedService) filters.service_id = selectedService;
    if (selectedLanguage && isLanguageService) filters.language_id = selectedLanguage;
    if (selectedLevel && !isLanguageService) filters.education_level_id = selectedLevel;
    if (selectedClass && !isLanguageService) filters.class_id = selectedClass;
    if (selectedSubject && !isLanguageService) filters.subject_id = selectedSubject;
    if (priceRange && priceRange < 500) filters.max_price = priceRange;
    if (selectedRating > 0) filters.min_rate = selectedRating;
    if (searchQuery) filters.search = searchQuery;
    if (codeQuery) filters.search = codeQuery;
    return filters;
  }, [selectedService, selectedLanguage, isLanguageService, selectedLevel, selectedClass, selectedSubject, priceRange, selectedRating, searchQuery, codeQuery]);

  const fetchTeachers = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    try {
      const filters = buildFilters(page);
      const result = await studentService.getTeachersPaginated(filters, page);
      const newTeachers = result.teachers || [];
      const pag = result.pagination || {};
      if (append) {
        setTeachers(prev => [...prev, ...newTeachers]);
      } else {
        setTeachers(newTeachers);
      }
      setTotalTeachers(pag.total || 0);
      setHasMore(page < (pag.last_page || 1));
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
      if (!append) setTeachers([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsFirstLoad(false);
    }
  }, [buildFilters]);

  useEffect(() => {
    fetchTeachers(1, false);
  }, []);

  const handleApplyFilters = () => {
    fetchTeachers(1, false);
    setShowMobileFilters(false);
  };

  const handleSearch = () => {
    setCodeQuery('');
    fetchTeachers(1, false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTeachers(currentPage + 1, true);
    }
  };

  const handleCodeSearch = () => {
    setCodeQuery(codeInput.trim().toUpperCase());
    setShowCodeDialog(false);
    setSearchQuery('');
    setTimeout(() => fetchTeachers(1, false), 0);
  };

  const handleClearCodeSearch = () => {
    setCodeQuery('');
    setCodeInput('');
    fetchTeachers(1, false);
  };

  const clearAllFilters = () => {
    setSelectedService('');
    setSelectedLanguage('');
    setSelectedLevel('');
    setSelectedClass('');
    setSelectedSubject('');
    setPriceRange(500);
    setSelectedRating(0);
    setSearchQuery('');
    setCodeQuery('');
    setCodeInput('');
    fetchTeachers(1, false);
  };

  const removeFilter = (key: string) => {
    if (key === 'service') { setSelectedService(''); setSelectedLanguage(''); }
    if (key === 'language') setSelectedLanguage('');
    if (key === 'level') { setSelectedLevel(''); setSelectedClass(''); setSelectedSubject(''); }
    if (key === 'class') { setSelectedClass(''); setSelectedSubject(''); }
    if (key === 'subject') setSelectedSubject('');
    if (key === 'price') setPriceRange(500);
    if (key === 'rating') setSelectedRating(0);
    if (key === 'search') { setSearchQuery(''); setCodeQuery(''); setCodeInput(''); }
    setTimeout(() => fetchTeachers(1, false), 0);
  };

  const getName = (item: any) => language === 'ar' ? (item.name_ar || item.name) : (item.name_en || item.name);

  const activeFilters: ActiveFilter[] = [];
  if (selectedService) {
    const svc = services.find(s => String(s.id) === selectedService);
    if (svc) activeFilters.push({ key: 'service', label: getName(svc) });
  }
  if (selectedLanguage) {
    const lang = languages.find(l => String(l.id) === selectedLanguage);
    if (lang) activeFilters.push({ key: 'language', label: getName(lang) });
  }
  if (selectedLevel) {
    const lvl = levels.find(l => String(l.id) === selectedLevel);
    if (lvl) activeFilters.push({ key: 'level', label: getName(lvl) });
  }
  if (selectedClass) {
    const cls = classes.find(c => String(c.id) === selectedClass);
    if (cls) activeFilters.push({ key: 'class', label: getName(cls) });
  }
  if (selectedSubject) {
    const sub = subjects.find(s => String(s.id) === selectedSubject);
    if (sub) activeFilters.push({ key: 'subject', label: getName(sub) });
  }
  if (priceRange < 500) {
    activeFilters.push({ key: 'price', label: `${language === 'ar' ? 'حتى' : 'Up to'} ${priceRange} ${t.sar}` });
  }
  if (selectedRating > 0) {
    activeFilters.push({ key: 'rating', label: `${selectedRating}★ ${language === 'ar' ? 'فما فوق' : '& Up'}` });
  }
  if (codeQuery) {
    activeFilters.push({ key: 'search', label: `${language === 'ar' ? 'الكود' : 'Code'}: ${codeQuery}` });
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in relative">
      <div className="lg:hidden mb-4 flex gap-2">
        <Button variant="outline" className="flex-1 flex items-center justify-center gap-2" onClick={() => setShowMobileFilters(true)}>
          <Filter size={18} /> {t.filters}
        </Button>
        <Button variant="outline" className="flex items-center justify-center gap-2 px-3" onClick={() => setShowCodeDialog(true)}>
          <Tag size={18} />
        </Button>
      </div>

      <div className={`
        fixed inset-y-0 z-40 w-64 bg-[var(--navy-dark)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:w-72 lg:block lg:bg-transparent
        ${showMobileFilters ? 'translate-x-0' : (direction === 'rtl' ? 'translate-x-full' : '-translate-x-full')}
        ${direction === 'rtl' ? 'right-0 left-auto' : 'left-0 right-auto'}
      `}>
        <div className="h-full overflow-y-auto p-6 bg-gradient-to-br from-[var(--navy)] to-[var(--navy-dark)] rounded-[var(--radius-md)] border border-white/10 shadow-[var(--shadow-md)] lg:sticky lg:top-24 filters-sidebar-dark">
          <div className="flex justify-between items-center mb-6 lg:hidden">
            <h3 className="font-bold text-lg">{t.filters}</h3>
            <button onClick={() => setShowMobileFilters(false)}><X size={24} /></button>
          </div>

          <div className="space-y-4">
            <Select
              label={t.serviceType || (language === 'ar' ? 'نوع الخدمة' : 'Service Type')}
              value={selectedService}
              onChange={(e) => {
                setSelectedService(e.target.value);
                setSelectedLanguage('');
                setSelectedLevel('');
                setSelectedClass('');
                setSelectedSubject('');
              }}
              options={[{ value: '', label: language === 'ar' ? 'الكل' : 'All' }, ...services.map(s => ({ value: String(s.id), label: getName(s) }))]}
              className="mb-0"
            />

            {isLanguageService ? (
              <Select
                label={t.language || (language === 'ar' ? 'اللغة' : 'Language')}
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                options={[{ value: '', label: language === 'ar' ? 'الكل' : 'All' }, ...languages.map(l => ({ value: String(l.id), label: getName(l) }))]}
                className="mb-0"
              />
            ) : (
              <>
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
              </>
            )}

            <div>
              <h4 className="text-sm font-bold text-[var(--text-main)] mb-3 uppercase tracking-wider">{t.rating}</h4>
              <div className="space-y-2">
                {[5, 4, 3].map(star => (
                  <label key={star} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="rating"
                      checked={selectedRating === star}
                      onChange={() => setSelectedRating(selectedRating === star ? 0 : star)}
                      className="rounded-full border-[var(--border)] text-primary focus:ring-primary/20"
                    />
                    <div className="flex text-amber-400 group-hover:opacity-80">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill={i < star ? "currentColor" : "none"} className={i >= star ? "text-[var(--text-muted)]" : ""} />
                      ))}
                    </div>
                    <span className="text-sm text-[var(--text-muted)]">& Up</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[var(--text-main)] mb-3 uppercase tracking-wider">{t.priceRange}</h4>
              <input
                type="range"
                min="50"
                max="500"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-sm text-[var(--text-muted)] mt-2 font-medium">
                <span>50 {t.sar}</span>
                <span>{priceRange} {t.sar}</span>
              </div>
            </div>

            <Button className="w-full mt-4" onClick={handleApplyFilters}>{t.applyFilters}</Button>
            <Button variant="ghost" className="w-full text-white/70 hover:text-[var(--green-light)]" onClick={clearAllFilters}>
              {t.clearFilters}
            </Button>
          </div>
        </div>
      </div>

      {showMobileFilters && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setShowMobileFilters(false)}></div>
      )}

      <div className="flex-1 space-y-4" ref={scrollRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] ${direction === 'rtl' ? 'right-4' : 'left-4'}`} size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t.searchPlaceholder}
              className={`w-full h-12 rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all ${direction === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
            />
          </div>
          <button
            onClick={() => setShowCodeDialog(true)}
            className="h-12 px-4 rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] hover:bg-[var(--light-bg)] transition-colors flex items-center gap-2 text-[var(--text-muted)]"
            title={t.searchByCode || (language === 'ar' ? 'البحث بالكود' : 'Search by Code')}
          >
            <Tag size={20} />
            <span className="hidden sm:inline text-sm font-medium">{t.code || (language === 'ar' ? 'كود' : 'Code')}</span>
          </button>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-[var(--text-muted)]">{t.activeFilters || (language === 'ar' ? 'التصفية النشطة' : 'Active Filters')}:</span>
            {activeFilters.map(f => (
              <span key={f.key} className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-pale text-primary text-sm font-medium rounded-full">
                {f.label}
                <button onClick={() => removeFilter(f.key)} className="hover:text-primary/70">
                  <X size={14} />
                </button>
              </span>
            ))}
            <button onClick={clearAllFilters} className="text-xs text-red-500 hover:text-red-600 font-medium">
              {t.clearAll || (language === 'ar' ? 'مسح الكل' : 'Clear All')}
            </button>
          </div>
        )}

        {!isFirstLoad && !loading && (
          <p className="text-sm text-[var(--text-muted)]">
            {t.teachersAvailable ? t.teachersAvailable(totalTeachers) : `${totalTeachers} ${language === 'ar' ? 'معلم متاح' : 'teachers available'}`}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-20 bg-[var(--light-bg)] rounded-[var(--radius-md)] border border-dashed border-[var(--border)]">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-[var(--green-pale)] flex items-center justify-center">
                <Search size={36} className="text-primary" />
              </div>
            </div>
            <p className="text-lg font-semibold text-navy mb-2">{t.noTeachersFound || (language === 'ar' ? 'لم يتم العثور على معلمين' : 'No teachers found')}</p>
            <p className="text-sm text-[var(--text-muted)]">{t.tryAdjustingSearch || (language === 'ar' ? 'حاول تعديل البحث أو التصفية' : 'Try adjusting your search or filters')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {teachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  onViewDetails={onTeacherSelect || (() => {})}
                />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8"
                >
                  {loadingMore ? (
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  ) : null}
                  {language === 'ar' ? 'تحميل المزيد' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {showCodeDialog && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={() => setShowCodeDialog(false)}>
          <div className="bg-white rounded-[var(--radius-md)] p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">{t.searchByCode || (language === 'ar' ? 'البحث بكود المعلم' : 'Search by Teacher Code')}</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">{language === 'ar' ? 'أدخل كود المعلم المكون من 3 أحرف وأرقام' : 'Enter the 3-letter + numbers teacher code'}</p>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleCodeSearch()}
              placeholder={t.enterCode || (language === 'ar' ? 'أدخل كود المعلم' : 'Enter teacher code')}
              className="w-full h-12 px-4 rounded-[var(--radius-md)] border border-[var(--border)] focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-center text-lg font-mono tracking-widest"
              autoFocus
              dir="ltr"
            />
            <div className="flex gap-2 mt-4">
              <Button variant="ghost" className="flex-1" onClick={() => { setShowCodeDialog(false); if (codeQuery) handleClearCodeSearch(); }}>
                {codeQuery ? (language === 'ar' ? 'مسح' : 'Clear') : (language === 'ar' ? 'إلغاء' : 'Cancel')}
              </Button>
              <Button className="flex-1" onClick={handleCodeSearch}>{language === 'ar' ? 'بحث' : 'Search'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
