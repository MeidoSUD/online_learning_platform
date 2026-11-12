import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  Search,
  X,
  Loader2,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  ArrowUpDown,
  UserX,
  AlertCircle,
  Check,
} from 'lucide-react';
import { studentService, ReferenceItem } from '../../Services/api';
import { TeacherCard } from './TeacherCard';

interface PrivateLessonsTabProps {
  onTeacherSelect?: (teacher: any) => void;
  initialServiceId?: number | string;
  onBack?: () => void;
  onServiceChange?: (serviceId?: number) => void;
}

const NON_TEACHER_SERVICE_KEYS = [
  'study-books',
  'study_books',
  'books',
  'smart-assistant',
  'smart_assistant',
  'ai-assistant',
  'ai_assistant',
];

export const PrivateLessonsTab: React.FC<PrivateLessonsTabProps> = ({
  onTeacherSelect,
  initialServiceId,
  onBack,
  onServiceChange,
}) => {
  const { direction, language } = useLanguage();

  const [services, setServices] = useState<ReferenceItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(() => {
    if (initialServiceId !== undefined && initialServiceId !== null && initialServiceId !== '') {
      const parsed = Number(initialServiceId);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  });

  const [educationLevels, setEducationLevels] = useState<ReferenceItem[]>([]);
  const [classes, setClasses] = useState<ReferenceItem[]>([]);
  const [subjects, setSubjects] = useState<ReferenceItem[]>([]);

  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  const [tempLevelId, setTempLevelId] = useState<number | null>(null);
  const [tempClassId, setTempClassId] = useState<number | null>(null);
  const [tempSubjectId, setTempSubjectId] = useState<number | null>(null);
  const [tempMinPrice, setTempMinPrice] = useState<string>('');
  const [tempMaxPrice, setTempMaxPrice] = useState<string>('');

  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const [sortType, setSortType] = useState<string>('default');
  const [tempSortType, setTempSortType] = useState<string>('default');

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const sortTeachersList = useCallback((list: any[], type: string) => {
    if (!type || type === 'default') return list;
    const sorted = [...list];
    if (type === 'rating_desc') {
      sorted.sort((a, b) => {
        const rA = Number(a.profile?.rating ?? a.rating ?? 0);
        const rB = Number(b.profile?.rating ?? b.rating ?? 0);
        return rB - rA;
      });
    } else if (type === 'rating_asc') {
      sorted.sort((a, b) => {
        const rA = Number(a.profile?.rating ?? a.rating ?? 0);
        const rB = Number(b.profile?.rating ?? b.rating ?? 0);
        return rA - rB;
      });
    } else if (type === 'price_desc') {
      sorted.sort((a, b) => {
        const pA = Number(a.profile?.individual_hour_price ?? a.individual_hour_price ?? a.price_hour ?? a.price ?? 0);
        const pB = Number(b.profile?.individual_hour_price ?? b.individual_hour_price ?? b.price_hour ?? b.price ?? 0);
        return pB - pA;
      });
    } else if (type === 'price_asc') {
      sorted.sort((a, b) => {
        const pA = Number(a.profile?.individual_hour_price ?? a.individual_hour_price ?? a.price_hour ?? a.price ?? 0);
        const pB = Number(b.profile?.individual_hour_price ?? b.individual_hour_price ?? b.price_hour ?? b.price ?? 0);
        return pA - pB;
      });
    }
    return sorted;
  }, []);

  const fetchTeachers = useCallback(
    async (
      page: number = 1,
      append: boolean = false,
      activeService: number | null = selectedServiceId,
      activeLevel: number | null = selectedLevelId,
      activeClass: number | null = selectedClassId,
      activeSubject: number | null = selectedSubjectId,
      activeMin: string = minPrice,
      activeMax: string = maxPrice,
      activeSearch: string = searchQuery,
      activeSort: string = sortType
    ) => {
      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const filters: any = { page };
        if (activeService) filters.service_id = activeService;
        if (activeLevel) filters.education_level_id = activeLevel;
        if (activeClass) filters.class_id = activeClass;
        if (activeSubject) filters.subject_id = activeSubject;
        if (activeMin.trim()) filters.min_price = Number(activeMin.trim());
        if (activeMax.trim()) filters.max_price = Number(activeMax.trim());
        if (activeSearch.trim()) filters.search = activeSearch.trim();

        const result = await studentService.getTeachersPaginated(filters, page);
        const rawTeachers = result.teachers || [];
        const pag = result.pagination || {};

        if (append) {
          setTeachers((prev) => {
            const combined = [...prev, ...rawTeachers];
            return sortTeachersList(combined, activeSort);
          });
        } else {
          setTeachers(sortTeachersList(rawTeachers, activeSort));
        }

        setHasMore(page < (pag.last_page || 1));
        setCurrentPage(page);
      } catch (err: any) {
        setError(err?.message || (language === 'ar' ? 'حدث خطأ أثناء تحميل البيانات' : 'Error loading data'));
        if (!append) setTeachers([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      selectedServiceId,
      selectedLevelId,
      selectedClassId,
      selectedSubjectId,
      minPrice,
      maxPrice,
      searchQuery,
      sortType,
      sortTeachersList,
      language,
    ]
  );

  useEffect(() => {
    studentService
      .getServices()
      .then((data) => {
        const filtered = (Array.isArray(data) ? data : []).filter((s: any) => {
          const key = (s.key_name || '').toLowerCase();
          return !NON_TEACHER_SERVICE_KEYS.includes(key);
        });
        setServices(filtered);
      })
      .catch(() => setServices([]));

    studentService
      .getEducationLevels()
      .then((data) => setEducationLevels(Array.isArray(data) ? data : []))
      .catch(() => setEducationLevels([]));
  }, []);

  useEffect(() => {
    if (initialServiceId !== undefined && initialServiceId !== null && initialServiceId !== '') {
      const parsed = Number(initialServiceId);
      const valid = isNaN(parsed) ? null : parsed;
      setSelectedServiceId(valid);
      fetchTeachers(
        1,
        false,
        valid,
        selectedLevelId,
        selectedClassId,
        selectedSubjectId,
        minPrice,
        maxPrice,
        searchQuery,
        sortType
      );
    } else {
      fetchTeachers(
        1,
        false,
        null,
        selectedLevelId,
        selectedClassId,
        selectedSubjectId,
        minPrice,
        maxPrice,
        searchQuery,
        sortType
      );
    }
  }, [initialServiceId]);

  const handleServiceChipClick = (id: number | null) => {
    const nextService = id === null ? null : (selectedServiceId === id ? null : id);
    setSelectedServiceId(nextService);
    if (onServiceChange) {
      onServiceChange(nextService ?? undefined);
    }
    fetchTeachers(
      1,
      false,
      nextService,
      selectedLevelId,
      selectedClassId,
      selectedSubjectId,
      minPrice,
      maxPrice,
      searchQuery,
      sortType
    );
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchTeachers(
      1,
      false,
      selectedServiceId,
      selectedLevelId,
      selectedClassId,
      selectedSubjectId,
      minPrice,
      maxPrice,
      searchQuery,
      sortType
    );
  };

  const handleCancelSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
    fetchTeachers(
      1,
      false,
      selectedServiceId,
      selectedLevelId,
      selectedClassId,
      selectedSubjectId,
      minPrice,
      maxPrice,
      '',
      sortType
    );
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTeachers(
        currentPage + 1,
        true,
        selectedServiceId,
        selectedLevelId,
        selectedClassId,
        selectedSubjectId,
        minPrice,
        maxPrice,
        searchQuery,
        sortType
      );
    }
  };

  const openFilterModal = () => {
    setTempLevelId(selectedLevelId);
    setTempClassId(selectedClassId);
    setTempSubjectId(selectedSubjectId);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);

    if (selectedLevelId) {
      studentService
        .getClasses(selectedLevelId)
        .then((data) => setClasses(Array.isArray(data) ? data : []))
        .catch(() => setClasses([]));
    } else {
      setClasses([]);
    }

    if (selectedClassId) {
      studentService
        .getReferenceSubjects(selectedClassId)
        .then((data) => setSubjects(Array.isArray(data) ? data : []))
        .catch(() => setSubjects([]));
    } else {
      setSubjects([]);
    }

    setShowFilterModal(true);
  };

  const handleTempLevelClick = (levelId: number) => {
    if (tempLevelId === levelId) {
      setTempLevelId(null);
      setTempClassId(null);
      setTempSubjectId(null);
      setClasses([]);
      setSubjects([]);
    } else {
      setTempLevelId(levelId);
      setTempClassId(null);
      setTempSubjectId(null);
      setSubjects([]);
      studentService
        .getClasses(levelId)
        .then((data) => setClasses(Array.isArray(data) ? data : []))
        .catch(() => setClasses([]));
    }
  };

  const handleTempClassClick = (classId: number) => {
    if (tempClassId === classId) {
      setTempClassId(null);
      setTempSubjectId(null);
      setSubjects([]);
    } else {
      setTempClassId(classId);
      setTempSubjectId(null);
      studentService
        .getReferenceSubjects(classId)
        .then((data) => setSubjects(Array.isArray(data) ? data : []))
        .catch(() => setSubjects([]));
    }
  };

  const handleTempSubjectClick = (subjectId: number) => {
    if (tempSubjectId === subjectId) {
      setTempSubjectId(null);
    } else {
      setTempSubjectId(subjectId);
    }
  };

  const handleApplyFilterModal = () => {
    setSelectedLevelId(tempLevelId);
    setSelectedClassId(tempClassId);
    setSelectedSubjectId(tempSubjectId);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setShowFilterModal(false);

    fetchTeachers(
      1,
      false,
      selectedServiceId,
      tempLevelId,
      tempClassId,
      tempSubjectId,
      tempMinPrice,
      tempMaxPrice,
      searchQuery,
      sortType
    );
  };

  const handleResetFilterModal = () => {
    setTempLevelId(null);
    setTempClassId(null);
    setTempSubjectId(null);
    setTempMinPrice('');
    setTempMaxPrice('');
    setClasses([]);
    setSubjects([]);

    setSelectedLevelId(null);
    setSelectedClassId(null);
    setSelectedSubjectId(null);
    setMinPrice('');
    setMaxPrice('');
    setShowFilterModal(false);

    fetchTeachers(
      1,
      false,
      selectedServiceId,
      null,
      null,
      null,
      '',
      '',
      searchQuery,
      sortType
    );
  };

  const openSortModal = () => {
    setTempSortType(sortType);
    setShowSortModal(true);
  };

  const handleApplySortModal = () => {
    setSortType(tempSortType);
    setTeachers((prev) => sortTeachersList(prev, tempSortType));
    setShowSortModal(false);
  };

  const sortOptions = [
    { id: 'default', label: language === 'ar' ? 'الافتراضي' : 'Default' },
    { id: 'rating_desc', label: language === 'ar' ? 'الأعلى تقييماً' : 'Rating: High to Low' },
    { id: 'rating_asc', label: language === 'ar' ? 'الأقل تقييماً' : 'Rating: Low to High' },
    { id: 'price_desc', label: language === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low' },
    { id: 'price_asc', label: language === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High' },
  ];

  const hasActiveFilters = Boolean(
    selectedLevelId || selectedClassId || selectedSubjectId || minPrice || maxPrice
  );

  return (
    <div className="relative min-h-[75vh] flex flex-col">
      <div className="w-full pb-3">
        <div className="flex items-center gap-3">
          {!isSearching && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-[#0D4A5F] hover:bg-gray-50 shrink-0 transition-colors"
            >
              {direction === 'rtl' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          )}

          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="h-12 bg-white rounded-full shadow-sm border border-gray-100 flex items-center px-4 relative">
              <Search size={20} className="text-[#CFCFCF] shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearching(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'ar'
                    ? 'ابحث عن المعلم أو المادة...'
                    : 'Search for teacher or subject...'
                }
                className="w-full bg-transparent border-none outline-none text-sm px-3 text-[#171717] placeholder:text-[#CFCFCF]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-[#738989] hover:text-[#171717]"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </form>

          {isSearching && (
            <button
              type="button"
              onClick={handleCancelSearch}
              className="text-[#5B9F48] font-bold text-sm px-2 shrink-0 hover:underline"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
          )}
        </div>

        {!isSearching && services.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3 mt-1">
            <button
              type="button"
              onClick={() => handleServiceChipClick(null)}
              className={`h-10 px-5 rounded-full text-sm font-medium transition-all shrink-0 whitespace-nowrap border ${
                selectedServiceId === null
                  ? 'bg-[#0D4A5F] text-white border-[#0D4A5F] shadow-sm'
                  : 'bg-white text-[#171717] border-[#E6E6E6] hover:bg-gray-50'
              }`}
            >
              {language === 'ar' ? 'الكل' : 'All'}
            </button>
            {services.map((service: any) => {
              const id = Number(service.id);
              const isSelected = selectedServiceId === id;
              const name =
                language === 'ar'
                  ? service.name_ar || service.name || service.title || ''
                  : service.name_en || service.name || service.title || '';

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleServiceChipClick(id)}
                  className={`h-10 px-5 rounded-full text-sm font-medium transition-all shrink-0 whitespace-nowrap border ${
                    isSelected
                      ? 'bg-[#0D4A5F] text-white border-[#0D4A5F] shadow-sm'
                      : 'bg-white text-[#171717] border-[#E6E6E6] hover:bg-gray-50'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28">
            <Loader2 className="animate-spin h-10 w-10 text-[#5B9F48] mb-3" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle size={56} className="text-red-400 mb-4" />
            <p className="text-base font-bold text-[#171717] mb-4">{error}</p>
            <button
              type="button"
              onClick={() => fetchTeachers(1, false)}
              className="px-6 py-2.5 bg-[#5B9F48] text-white text-sm font-semibold rounded-xl hover:bg-[#4d863d] transition-colors"
            >
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : teachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-[#0D4A5F]/10 flex items-center justify-center mb-6">
              <UserX size={44} className="text-[#0D4A5F]/70" />
            </div>
            <h3 className="text-lg font-bold text-[#0D4A5F] mb-2">
              {language === 'ar' ? 'لم يتم العثور على معلمين' : 'No Teachers Found'}
            </h3>
            <p className="text-sm text-[#171717]">
              {language === 'ar'
                ? 'جرّب تغيير خيارات البحث أو التصفية'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {teachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  onViewDetails={onTeacherSelect}
                  onBookNow={onTeacherSelect}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center pt-8">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-full bg-white border border-[#E6E6E6] text-sm font-bold text-[#0D4A5F] hover:bg-gray-50 shadow-sm transition-colors flex items-center gap-2"
                >
                  {loadingMore && <Loader2 className="animate-spin h-4 w-4 text-[#5B9F48]" />}
                  <span>{language === 'ar' ? 'تحميل المزيد' : 'Load More'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {!isSearching && !loading && !error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <div className="h-12 px-6 rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-[#E6E6E6] flex items-center gap-4">
            <button
              type="button"
              onClick={openFilterModal}
              className="flex items-center gap-2 text-sm font-medium text-[#171717] hover:text-[#5B9F48] transition-colors relative"
            >
              <SlidersHorizontal size={18} className="text-[#171717]" />
              <span>{language === 'ar' ? 'فلترة' : 'Filter'}</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#5B9F48]" />
              )}
            </button>

            <div className="w-px h-6 bg-[#E6E6E6]" />

            <button
              type="button"
              onClick={openSortModal}
              className="flex items-center gap-2 text-sm font-medium text-[#171717] hover:text-[#5B9F48] transition-colors relative"
            >
              <ArrowUpDown size={18} className="text-[#171717]" />
              <span>{language === 'ar' ? 'ترتيب' : 'Sort'}</span>
              {sortType !== 'default' && (
                <span className="w-2 h-2 rounded-full bg-[#5B9F48]" />
              )}
            </button>
          </div>
        </div>
      )}

      {showFilterModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="bg-[#EFF6F4] w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-black/5">
              <h3 className="text-lg font-bold text-[#171717]">
                {language === 'ar' ? 'تصفية الدروس الخصوصية' : 'Filter Private Lessons'}
              </h3>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="p-1 rounded-full hover:bg-black/5 text-[#171717]"
              >
                <X size={22} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-6 flex-1 py-4 pr-1">
              {educationLevels.length > 0 && (
                <div>
                  <h4 className="text-base font-bold text-[#171717] mb-3">
                    {language === 'ar' ? 'المراحل الدراسية' : 'Education Levels'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTempLevelId(null);
                        setTempClassId(null);
                        setTempSubjectId(null);
                        setClasses([]);
                        setSubjects([]);
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        tempLevelId === null
                          ? 'bg-[#0D4A5F] text-white border-[#0D4A5F]'
                          : 'bg-white text-[#171717] border-[#E6E6E6] hover:bg-gray-50'
                      }`}
                    >
                      {language === 'ar' ? 'الكل' : 'All'}
                    </button>
                    {educationLevels.map((lvl: any) => {
                      const id = Number(lvl.id);
                      const isSelected = tempLevelId === id;
                      const name =
                        language === 'ar' ? lvl.name_ar || lvl.name : lvl.name_en || lvl.name;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleTempLevelClick(id)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                            isSelected
                              ? 'bg-[#0D4A5F] text-white border-[#0D4A5F]'
                              : 'bg-white text-[#171717] border-[#E6E6E6] hover:bg-gray-50'
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {classes.length > 0 && (
                <div>
                  <h4 className="text-base font-bold text-[#171717] mb-3">
                    {language === 'ar' ? 'الصفوف الدراسية' : 'Grades'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTempClassId(null);
                        setTempSubjectId(null);
                        setSubjects([]);
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        tempClassId === null
                          ? 'bg-[#0D4A5F] text-white border-[#0D4A5F]'
                          : 'bg-white text-[#171717] border-[#E6E6E6] hover:bg-gray-50'
                      }`}
                    >
                      {language === 'ar' ? 'الكل' : 'All'}
                    </button>
                    {classes.map((cls: any) => {
                      const id = Number(cls.id);
                      const isSelected = tempClassId === id;
                      const name =
                        language === 'ar' ? cls.name_ar || cls.name : cls.name_en || cls.name;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleTempClassClick(id)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                            isSelected
                              ? 'bg-[#0D4A5F] text-white border-[#0D4A5F]'
                              : 'bg-white text-[#171717] border-[#E6E6E6] hover:bg-gray-50'
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {subjects.length > 0 && (
                <div>
                  <h4 className="text-base font-bold text-[#171717] mb-3">
                    {language === 'ar' ? 'المواد' : 'Subjects'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setTempSubjectId(null)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        tempSubjectId === null
                          ? 'bg-[#0D4A5F] text-white border-[#0D4A5F]'
                          : 'bg-white text-[#171717] border-[#E6E6E6] hover:bg-gray-50'
                      }`}
                    >
                      {language === 'ar' ? 'الكل' : 'All'}
                    </button>
                    {subjects.map((sub: any) => {
                      const id = Number(sub.id);
                      const isSelected = tempSubjectId === id;
                      const name =
                        language === 'ar' ? sub.name_ar || sub.name : sub.name_en || sub.name;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleTempSubjectClick(id)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                            isSelected
                              ? 'bg-[#0D4A5F] text-white border-[#0D4A5F]'
                              : 'bg-white text-[#171717] border-[#E6E6E6] hover:bg-gray-50'
                          }`}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-base font-bold text-[#171717] mb-3">
                  {language === 'ar' ? 'سعر الحصة' : 'Session Price'}
                </h4>
                <div className="flex gap-4">
                  <div className="flex-1 bg-white rounded-xl overflow-hidden border border-[#E6E6E6]">
                    <input
                      type="number"
                      value={tempMinPrice}
                      onChange={(e) => setTempMinPrice(e.target.value)}
                      placeholder={language === 'ar' ? 'أدنى سعر' : 'Min Price'}
                      className="w-full h-12 text-center text-sm font-medium bg-transparent border-none outline-none text-[#171717] placeholder:text-[#CFCFCF]"
                    />
                  </div>
                  <div className="flex-1 bg-white rounded-xl overflow-hidden border border-[#E6E6E6]">
                    <input
                      type="number"
                      value={tempMaxPrice}
                      onChange={(e) => setTempMaxPrice(e.target.value)}
                      placeholder={language === 'ar' ? 'أعلى سعر' : 'Max Price'}
                      className="w-full h-12 text-center text-sm font-medium bg-transparent border-none outline-none text-[#171717] placeholder:text-[#CFCFCF]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-black/5 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleApplyFilterModal}
                className="w-full h-14 bg-[#5B9F48] hover:bg-[#4d863d] text-white font-bold text-base rounded-2xl transition-colors shadow-sm"
              >
                {language === 'ar' ? 'تطبيق الفلتر' : 'Apply Filters'}
              </button>
              <button
                type="button"
                onClick={handleResetFilterModal}
                className="w-full py-2 text-red-500 font-bold text-base hover:underline transition-colors"
              >
                {language === 'ar' ? 'إعادة التعيين' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSortModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowSortModal(false)}
        >
          <div
            className="bg-[#EFF6F4] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-black/5">
              <h3 className="text-lg font-bold text-[#171717]">
                {language === 'ar' ? 'ترتيب حسب:' : 'Sort By:'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSortModal(false)}
                className="p-1 rounded-full hover:bg-black/5 text-[#171717]"
              >
                <X size={22} />
              </button>
            </div>

            <div className="bg-white rounded-2xl divide-y divide-[#E6E6E6] my-5 overflow-hidden border border-[#E6E6E6]">
              {sortOptions.map((opt) => {
                const isSelected = tempSortType === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setTempSortType(opt.id)}
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <span
                      className={`text-sm ${
                        isSelected ? 'font-bold text-[#171717]' : 'font-medium text-[#738989]'
                      }`}
                    >
                      {opt.label}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-[#5B9F48] bg-[#5B9F48]'
                          : 'border-[#CFCFCF] bg-white'
                      }`}
                    >
                      {isSelected && <Check size={14} className="text-white stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleApplySortModal}
              className="w-full h-14 bg-[#5B9F48] hover:bg-[#4d863d] text-white font-bold text-base rounded-2xl transition-colors shadow-sm"
            >
              {language === 'ar' ? 'تطبيق' : 'Apply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
