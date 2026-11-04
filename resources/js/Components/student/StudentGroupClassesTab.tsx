import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  Users,
  Search,
  Calendar,
  Clock,
  Star,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Heart,
  Coins,
  CheckSquare,
  Square,
  CheckCircle2,
  Bookmark,
  Check
} from 'lucide-react';
import { Button } from '../ui/Button';
import { studentService, getStorageUrl } from '../../Services/api';

interface StudentGroupClassesTabProps {
  onNavigateToSessions?: () => void;
}

export const StudentGroupClassesTab: React.FC<StudentGroupClassesTabProps> = ({ onNavigateToSessions }) => {
  const { t, language, direction } = useLanguage();
  const isAr = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [educationLevels, setEducationLevels] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const [tempLevelId, setTempLevelId] = useState<number | null>(null);
  const [tempClassId, setTempClassId] = useState<number | null>(null);
  const [tempSubjectId, setTempSubjectId] = useState<number | null>(null);
  const [tempMinPrice, setTempMinPrice] = useState<string>('');
  const [tempMaxPrice, setTempMaxPrice] = useState<string>('');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState<string>('default');

  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [groupClasses, setGroupClasses] = useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const [selectedClassForLessons, setSelectedClassForLessons] = useState<any | null>(null);
  const [selectedLessonIds, setSelectedLessonIds] = useState<number[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchInitialData();
    fetchTeachers();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [servicesRes, levelsRes] = await Promise.all([
        studentService.getServices().catch(() => []),
        studentService.getEducationLevels().catch(() => []),
      ]);

      const nonTeacherKeys = ['study-books', 'study_books', 'books', 'smart-assistant', 'smart_assistant', 'ai-assistant', 'ai_assistant'];
      const validServices = (Array.isArray(servicesRes) ? servicesRes : []).filter((s: any) => {
        const key = (s.key_name || s.name || '').toLowerCase();
        return !nonTeacherKeys.includes(key);
      });

      setServices(validServices);
      setEducationLevels(Array.isArray(levelsRes) ? levelsRes : []);
    } catch {
      setServices([]);
      setEducationLevels([]);
    }
  };

  const fetchTeachers = async (customFilters?: {
    levelId?: number | null;
    classId?: number | null;
    subjectId?: number | null;
    min?: string;
    max?: string;
    serviceId?: number | null;
    search?: string;
  }) => {
    setLoading(true);
    try {
      const activeLevel = customFilters && customFilters.levelId !== undefined ? customFilters.levelId : selectedLevelId;
      const activeClass = customFilters && customFilters.classId !== undefined ? customFilters.classId : selectedClassId;
      const activeSubject = customFilters && customFilters.subjectId !== undefined ? customFilters.subjectId : selectedSubjectId;
      const activeMin = customFilters && customFilters.min !== undefined ? customFilters.min : minPrice;
      const activeMax = customFilters && customFilters.max !== undefined ? customFilters.max : maxPrice;
      const activeService = customFilters && customFilters.serviceId !== undefined ? customFilters.serviceId : selectedServiceId;
      const activeSearch = customFilters && customFilters.search !== undefined ? customFilters.search : searchQuery;

      const params: any = {};
      if (activeService) params.service_id = activeService;
      if (activeLevel) params.education_level_id = activeLevel;
      if (activeClass) params.class_id = activeClass;
      if (activeSubject) params.subject_id = activeSubject;
      if (activeMin && !isNaN(Number(activeMin))) params.min_price = Number(activeMin);
      if (activeMax && !isNaN(Number(activeMax))) params.max_price = Number(activeMax);
      if (activeSearch && activeSearch.trim()) params.search = activeSearch.trim();

      const res = await studentService.getTeachers(params);
      const list = Array.isArray(res) ? res : [];
      setTeachers(list);
    } catch {
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTeachers({ search: searchQuery });
  };

  const handleServiceClick = (serviceId: number) => {
    const nextServiceId = selectedServiceId === serviceId ? null : serviceId;
    setSelectedServiceId(nextServiceId);
    fetchTeachers({ serviceId: nextServiceId });
  };

  const handleOpenFilterModal = async () => {
    setTempLevelId(selectedLevelId);
    setTempClassId(selectedClassId);
    setTempSubjectId(selectedSubjectId);
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);

    if (selectedLevelId) {
      try {
        const cls = await studentService.getClasses(selectedLevelId);
        setClasses(Array.isArray(cls) ? cls : []);
      } catch {
        setClasses([]);
      }
    } else {
      setClasses([]);
    }

    if (selectedClassId) {
      try {
        const subs = await studentService.getReferenceSubjects(selectedClassId);
        setSubjects(Array.isArray(subs) ? subs : []);
      } catch {
        setSubjects([]);
      }
    } else {
      setSubjects([]);
    }

    setIsFilterOpen(true);
  };

  const handleTempLevelClick = async (levelId: number) => {
    if (tempLevelId === levelId) {
      setTempLevelId(null);
      setTempClassId(null);
      setTempSubjectId(null);
      setClasses([]);
      setSubjects([]);
      return;
    }

    setTempLevelId(levelId);
    setTempClassId(null);
    setTempSubjectId(null);
    setClasses([]);
    setSubjects([]);

    try {
      const cls = await studentService.getClasses(levelId);
      setClasses(Array.isArray(cls) ? cls : []);
    } catch {
      setClasses([]);
    }
  };

  const handleTempClassClick = async (classId: number) => {
    if (tempClassId === classId) {
      setTempClassId(null);
      setTempSubjectId(null);
      setSubjects([]);
      return;
    }

    setTempClassId(classId);
    setTempSubjectId(null);
    setSubjects([]);

    try {
      const subs = await studentService.getReferenceSubjects(classId);
      setSubjects(Array.isArray(subs) ? subs : []);
    } catch {
      setSubjects([]);
    }
  };

  const handleTempSubjectClick = (subjectId: number) => {
    if (tempSubjectId === subjectId) {
      setTempSubjectId(null);
    } else {
      setTempSubjectId(subjectId);
    }
  };

  const handleApplyFilter = () => {
    setSelectedLevelId(tempLevelId);
    setSelectedClassId(tempClassId);
    setSelectedSubjectId(tempSubjectId);
    setMinPrice(tempMinPrice);
    setMaxPrice(tempMaxPrice);
    setIsFilterOpen(false);

    fetchTeachers({
      levelId: tempLevelId,
      classId: tempClassId,
      subjectId: tempSubjectId,
      min: tempMinPrice,
      max: tempMaxPrice,
    });
  };

  const handleResetFilter = () => {
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
    setIsFilterOpen(false);

    fetchTeachers({
      levelId: null,
      classId: null,
      subjectId: null,
      min: '',
      max: '',
    });
  };

  const handleResetAllFilters = () => {
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
    setSelectedServiceId(null);
    setSearchQuery('');
    setSelectedSort('default');
    setIsFilterOpen(false);

    fetchTeachers({
      levelId: null,
      classId: null,
      subjectId: null,
      min: '',
      max: '',
      serviceId: null,
      search: '',
    });
  };

  const handleSelectTeacher = async (teacher: any) => {
    setSelectedTeacher(teacher);
    setLoadingClasses(true);
    setSelectedClassForLessons(null);
    setSelectedLessonIds([]);
    setBookingError(null);
    setBookingSuccess(false);

    try {
      const classesData = await studentService.getTeacherGroupClasses(teacher.id);
      setGroupClasses(Array.isArray(classesData) ? classesData : []);
    } catch {
      setGroupClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleOpenLessons = (groupClass: any) => {
    setSelectedClassForLessons(groupClass);
    const rawLessons = groupClass.lessons || [];
    setSelectedLessonIds(rawLessons.map((l: any) => l.id));
    setBookingError(null);
    setBookingSuccess(false);
  };

  const toggleLesson = (lessonId: number) => {
    setSelectedLessonIds(prev =>
      prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]
    );
  };

  const toggleSelectAll = (lessons: any[]) => {
    const allIds = lessons.map(l => l.id);
    if (selectedLessonIds.length === allIds.length) {
      setSelectedLessonIds([]);
    } else {
      setSelectedLessonIds(allIds);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedClassForLessons || selectedLessonIds.length === 0 || !selectedTeacher) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      await studentService.bookGroupClass({
        group_class_id: selectedClassForLessons.id,
        teacher_id: selectedTeacher.id,
        lesson_ids: selectedLessonIds,
      });
      setBookingSuccess(true);
    } catch (err: any) {
      setBookingError(err.message || (isAr ? 'تعذر إتمام الحجز، يرجى المحاولة لاحقاً' : 'Booking failed, please try again'));
    } finally {
      setBookingLoading(false);
    }
  };

  const toggleFavorite = (teacherId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => ({
      ...prev,
      [teacherId]: !prev[teacherId]
    }));
  };

  const formatSessionsCount = (count: number) => {
    if (count === 0) return isAr ? '0 حصة' : '0 sessions';
    if (count === 1) return isAr ? 'حصة واحدة' : '1 session';
    if (count === 2) return isAr ? 'حصتان' : '2 sessions';
    if (count >= 3 && count <= 10) return isAr ? `${count} حصص` : `${count} sessions`;
    return isAr ? `${count} حصة` : `${count} sessions`;
  };

  const activeFiltersCount = [
    selectedLevelId,
    selectedClassId,
    selectedSubjectId,
    minPrice ? true : null,
    maxPrice ? true : null
  ].filter(Boolean).length;

  const sortedTeachers = [...teachers].sort((a, b) => {
    const ratingA = Number(a.profile?.rating ?? a.rating ?? 5.0);
    const ratingB = Number(b.profile?.rating ?? b.rating ?? 5.0);
    const priceA = Number(a.profile?.group_hour_price || a.profile?.individual_hour_price || 20);
    const priceB = Number(b.profile?.group_hour_price || b.profile?.individual_hour_price || 20);

    if (selectedSort === 'rating_desc') return ratingB - ratingA;
    if (selectedSort === 'rating_asc') return ratingA - ratingB;
    if (selectedSort === 'price_desc') return priceB - priceA;
    if (selectedSort === 'price_asc') return priceA - priceB;
    return 0;
  });

  return (
    <div className="space-y-6 pb-24 animate-fade-in relative min-h-[500px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <Users size={26} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isAr ? 'الحصص الجماعية' : 'Group Classes'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr ? 'انضم إلى مجموعات تفاعلية بتكلفة أقل وتجربة تعليمية تشاركية' : 'Join collaborative classes at lower rates'}
            </p>
          </div>
        </div>

        {onNavigateToSessions && (
          <Button
            onClick={onNavigateToSessions}
            variant="outline"
            className="rounded-xl text-xs font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 px-4 py-2.5 flex items-center gap-2 shadow-sm"
          >
            <Calendar size={15} className="text-emerald-600" />
            <span>{isAr ? 'جلساتي الجماعية' : 'My Sessions'}</span>
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث عن المعلمين...' : 'Search teachers...'}
            className="w-full h-12 pl-12 pr-12 bg-white rounded-full border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 shadow-sm"
          />
          <Search size={18} className={`absolute top-3.5 ${direction === 'rtl' ? 'left-4' : 'right-4'} text-slate-400`} />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                fetchTeachers({ search: '' });
              }}
              className={`absolute top-3.5 ${direction === 'rtl' ? 'left-11' : 'right-11'} text-slate-400 hover:text-slate-600 p-0.5 rounded-full`}
            >
              <X size={15} />
            </button>
          )}
        </form>

        {services.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {services.map((service) => {
              const id = Number(service.id);
              const isSelected = selectedServiceId === id;
              const name = isAr
                ? (service.name_ar || service.name || service.title || '')
                : (service.name_en || service.name || service.title || '');

              return (
                <button
                  key={id}
                  onClick={() => handleServiceClick(id)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap shadow-sm border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[380px]">
          <Loader2 className="animate-spin h-9 w-9 text-emerald-600" />
        </div>
      ) : sortedTeachers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[340px]">
          <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
            <Users size={38} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {isAr ? 'لم نتمكن من العثور على معلمين' : 'No Teachers Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mb-6">
            {isAr ? 'يرجى تجربة فلتر آخر أو كلمة بحث بديلة' : 'Try searching with another keyword or adjust filters'}
          </p>
          {(searchQuery || selectedServiceId || activeFiltersCount > 0) && (
            <Button
              onClick={handleResetAllFilters}
              variant="outline"
              className="rounded-xl font-bold text-xs"
            >
              {isAr ? 'إعادة ضبط البحث' : 'Reset Filters'}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedTeachers.map((teacher) => {
            const profile = teacher?.profile || {};
            const photo = profile?.profile_photo || teacher?.profile_image;
            const fullName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || teacher.name;
            const rating = Number(profile?.rating ?? teacher?.rating ?? 5.0).toFixed(1);

            const serviceName = profile?.teacher_subjects?.[0]?.title
              || profile?.specialization
              || (isAr ? 'حصة جماعية' : 'Group Class');

            const points = Number(profile?.group_hour_price || profile?.individual_hour_price || 20).toFixed(0);
            const isFav = !!favorites[teacher.id];

            return (
              <div
                key={teacher.id}
                onClick={() => handleSelectTeacher(teacher)}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="flex items-start gap-3.5 mb-3">
                  <div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                    {photo ? (
                      <img src={getStorageUrl(photo)} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={28} className="text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-emerald-700 transition-colors">
                      {fullName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 truncate">
                      <BookOpen size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{serviceName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mt-1.5">
                      <Star size={13} fill="currentColor" />
                      <span>{rating}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between shrink-0 self-stretch">
                    <button
                      onClick={(e) => toggleFavorite(teacher.id, e)}
                      className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <Heart size={20} className={isFav ? 'fill-rose-500 text-rose-500' : ''} />
                    </button>

                    <div className="flex items-center gap-1 mt-auto">
                      <Coins size={15} className="text-amber-500" />
                      <span className="text-lg font-bold text-slate-900">{points}</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {isAr ? 'نقطة' : 'pts'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                  <Button
                    onClick={() => handleSelectTeacher(teacher)}
                    className="h-9 px-5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    {isAr ? 'احجز الآن' : 'Book Now'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-white rounded-full px-6 py-2.5 shadow-xl border border-slate-200/80 flex items-center gap-5 text-sm font-bold text-slate-800">
          <button
            onClick={handleOpenFilterModal}
            className="flex items-center gap-2 hover:text-emerald-700 transition-colors relative"
          >
            <SlidersHorizontal size={17} />
            <span>{isAr ? 'تصفية' : 'Filter'}</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <button
            onClick={() => setIsSortOpen(true)}
            className="flex items-center gap-2 hover:text-emerald-700 transition-colors"
          >
            <ArrowUpDown size={17} />
            <span>{isAr ? 'ترتيب' : 'Sort'}</span>
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <h3 className="font-bold text-slate-900 text-lg">
                {isAr ? 'تصفية الدروس' : 'Filter Lessons'}
              </h3>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {educationLevels.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-3">
                    {isAr ? 'المرحلة التعليمية' : 'Education Level'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {educationLevels.map((lvl) => {
                      const isSelected = tempLevelId === lvl.id;
                      const name = isAr ? lvl.name_ar : lvl.name_en;
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => handleTempLevelClick(lvl.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
                  <h4 className="text-sm font-bold text-slate-900 mb-3">
                    {isAr ? 'الصف الدراسي' : 'Grade / Class'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {classes.map((cls) => {
                      const isSelected = tempClassId === cls.id;
                      const name = isAr ? cls.name_ar : cls.name_en;
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => handleTempClassClick(cls.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
                  <h4 className="text-sm font-bold text-slate-900 mb-3">
                    {isAr ? 'المادة الدراسية' : 'Subject'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((sub) => {
                      const isSelected = tempSubjectId === sub.id;
                      const name = isAr ? sub.name_ar : sub.name_en;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleTempSubjectClick(sub.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
                <h4 className="text-sm font-bold text-slate-900 mb-3">
                  {isAr ? 'سعر الحصة' : 'Session Price'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      value={tempMinPrice}
                      onChange={(e) => setTempMinPrice(e.target.value)}
                      placeholder={isAr ? 'الحد الأدنى' : 'Min price'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={tempMaxPrice}
                      onChange={(e) => setTempMaxPrice(e.target.value)}
                      placeholder={isAr ? 'الحد الأقصى' : 'Max price'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex flex-col gap-2 bg-slate-50/60">
              <Button
                onClick={handleApplyFilter}
                className="w-full h-12 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
              >
                {isAr ? 'تطبيق الفلتر' : 'Apply Filter'}
              </Button>
              <button
                type="button"
                onClick={handleResetFilter}
                className="w-full py-2.5 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
              >
                {isAr ? 'إعادة ضبط' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSortOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scale-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">{isAr ? 'ترتيب حسب' : 'Sort By'}</h3>
              <button onClick={() => setIsSortOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
                <X size={18} />
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
              {[
                { id: 'default', label: isAr ? 'الافتراضي' : 'Default' },
                { id: 'rating_desc', label: isAr ? 'الأعلى تقييماً' : 'Highest Rated' },
                { id: 'rating_asc', label: isAr ? 'الأقل تقييماً' : 'Lowest Rated' },
                { id: 'price_desc', label: isAr ? 'السعر: من الأعلى إلى الأقل' : 'Price: High to Low' },
                { id: 'price_asc', label: isAr ? 'السعر: من الأقل إلى الأعلى' : 'Price: Low to High' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSelectedSort(opt.id);
                    setIsSortOpen(false);
                  }}
                  className="w-full p-3.5 text-sm font-semibold text-start flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <span className={selectedSort === opt.id ? 'font-bold text-slate-900' : 'text-slate-700'}>
                    {opt.label}
                  </span>
                  {selectedSort === opt.id && <Check size={18} className="text-slate-900" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTeacher && !selectedClassForLessons && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                  {selectedTeacher.profile?.profile_photo || selectedTeacher.profile_image ? (
                    <img
                      src={getStorageUrl(selectedTeacher.profile?.profile_photo || selectedTeacher.profile_image)}
                      alt={selectedTeacher.first_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users size={22} className="text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-base truncate">
                    {selectedTeacher.first_name} {selectedTeacher.last_name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold mt-0.5">
                    <Star size={12} fill="currentColor" />
                    <span>{Number(selectedTeacher.profile?.rating ?? selectedTeacher.rating ?? 5.0).toFixed(1)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center gap-2 pb-2">
                <Bookmark size={18} className="text-emerald-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  {isAr ? 'المجموعات المتاحة' : 'Available Groups'}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                  {groupClasses.length}
                </span>
              </div>

              {loadingClasses ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
                </div>
              ) : groupClasses.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  {isAr ? 'لا توجد مجموعات حصص جماعية متاحة لهذا المعلم حالياً.' : 'No group classes scheduled currently for this teacher.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {groupClasses.map((item) => {
                    const title = item.title || (isAr ? 'مجموعة حصص' : 'Group Class');
                    const description = item.description || '';
                    const subjectName = isAr
                      ? (item.subject?.name_ar || item.subject?.name_en || item.subject?.name || '')
                      : (item.subject?.name_en || item.subject?.name_ar || item.subject?.name || '');
                    const levelName = isAr
                      ? (item.education_level?.name_ar || item.education_level?.name_en || '')
                      : (item.education_level?.name_en || item.education_level?.name_ar || '');
                    const className = isAr
                      ? (item.class?.name_ar || item.class?.name_en || '')
                      : (item.class?.name_en || item.class?.name_ar || '');

                    const academicInfo = [levelName, className, subjectName].filter(Boolean).join(' • ');
                    const rawLessons = item.lessons || [];
                    const totalSessions = rawLessons.length || item.total_sessions || 0;
                    const startDate = item.start_date || '';

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleOpenLessons(item)}
                        className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors truncate">
                            {title}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 shrink-0">
                            {formatSessionsCount(totalSessions)}
                          </span>
                        </div>

                        {academicInfo && (
                          <p className="text-xs text-slate-500 font-medium">
                            {academicInfo}
                          </p>
                        )}

                        {description && description !== title && (
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {description}
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          {startDate ? (
                            <span className="flex items-center gap-1.5 text-slate-600">
                              <Calendar size={13} className="text-emerald-600" />
                              <span>{isAr ? `تاريخ البدء: ${startDate}` : `Starts: ${startDate}`}</span>
                            </span>
                          ) : <span />}

                          <span className="font-bold text-emerald-600 group-hover:translate-x-[-2px] transition-transform flex items-center gap-1">
                            <span>{isAr ? 'عرض الحصص' : 'View Lessons'}</span>
                            {direction === 'rtl' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedClassForLessons && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedClassForLessons(null)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                >
                  {direction === 'rtl' ? <ArrowRight size={17} /> : <ArrowLeft size={17} />}
                </button>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedClassForLessons.title}</h3>
                  <p className="text-xs text-slate-500">{isAr ? 'اختر الدروس التي ترغب في حضورها' : 'Select lessons to enroll'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedClassForLessons(null);
                  setSelectedTeacher(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {bookingSuccess ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={36} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">{isAr ? 'تم إتمام الحجز بنجاح!' : 'Booking Confirmed!'}</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {isAr ? 'تم حجز مقعدك في الحصص المختارة. يمكنك متابعة المواعيد والدخول للفصل من صفحة جلساتي.' : 'Your seat is confirmed. Check your sessions schedule anytime.'}
                  </p>
                  <div className="flex gap-3 justify-center pt-2">
                    {onNavigateToSessions && (
                      <Button
                        onClick={() => {
                          setSelectedClassForLessons(null);
                          setSelectedTeacher(null);
                          onNavigateToSessions();
                        }}
                        className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-5"
                      >
                        {isAr ? 'الانتقال إلى جلساتي الجماعية' : 'Go to My Sessions'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedClassForLessons(null);
                        setSelectedTeacher(null);
                      }}
                      className="rounded-xl font-bold text-xs"
                    >
                      {isAr ? 'إغلاق' : 'Close'}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {bookingError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-bold text-slate-700">
                      {isAr ? `قائمة الدروس (${selectedClassForLessons.lessons?.length || 0})` : `Lessons List (${selectedClassForLessons.lessons?.length || 0})`}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSelectAll(selectedClassForLessons.lessons || [])}
                      className="text-xs font-bold text-emerald-600 hover:underline"
                    >
                      {selectedLessonIds.length === (selectedClassForLessons.lessons?.length || 0)
                        ? (isAr ? 'إلغاء تحديد الكل' : 'Deselect All')
                        : (isAr ? 'تحديد الكل' : 'Select All')}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(selectedClassForLessons.lessons || []).map((lesson: any, idx: number) => {
                      const isSelected = selectedLessonIds.includes(lesson.id);
                      const lessonNum = lesson.lesson_number || idx + 1;
                      const title = lesson.title || (isAr ? `الدرس ${lessonNum}` : `Lesson ${lessonNum}`);
                      const date = lesson.lesson_date || '';
                      const time = lesson.start_time ? `${lesson.start_time} - ${lesson.end_time || ''}` : '';
                      const duration = lesson.duration || 60;

                      return (
                        <div
                          key={lesson.id}
                          onClick={() => toggleLesson(lesson.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/40'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="pt-0.5 text-emerald-600">
                            {isSelected ? <CheckSquare size={19} /> : <Square size={19} className="text-slate-400" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="font-bold text-slate-900 text-sm truncate">{title}</h5>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 shrink-0">
                                {isAr ? `الدرس ${lessonNum}` : `Lesson ${lessonNum}`}
                              </span>
                            </div>

                            {lesson.topic && lesson.topic !== title && (
                              <p className="text-xs text-slate-500 mt-0.5 truncate">{lesson.topic}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-2">
                              {date && (
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  <span>{date}</span>
                                </span>
                              )}
                              {time && (
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  <span>{time}</span>
                                </span>
                              )}
                              <span>{duration} {isAr ? 'دقيقة' : 'mins'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {!bookingSuccess && (
              <div className="p-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">
                    {isAr ? 'الدروس المحددة:' : 'Selected Lessons:'}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedLessonIds.length} {isAr ? 'دروس' : 'lessons'}
                  </span>
                </div>

                <Button
                  disabled={selectedLessonIds.length === 0 || bookingLoading}
                  onClick={handleConfirmBooking}
                  className="h-11 px-6 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                >
                  {bookingLoading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <span>{isAr ? 'تأكيد وحجز الحصص' : 'Confirm Booking'}</span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};