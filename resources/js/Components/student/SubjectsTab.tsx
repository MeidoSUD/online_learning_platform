
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Search, Star, Clock, Users, X, SlidersHorizontal, BookOpen, School, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { BookingModal } from './BookingModal';
import { studentService, getStorageUrl, Course, CourseCategory } from '../../Services/api';

interface FilterState {
  categoryId: number | null;
  levelId: number | null;
  maxPrice: number | null;
}

interface EducationLevel {
  id: number;
  name_en: string;
  name_ar: string;
}

export const SubjectsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    categoryId: null,
    levelId: null,
    maxPrice: null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [bookingItem, setBookingItem] = useState<{title: string, price: number} | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadCategories = useCallback(async () => {
    try {
      const data = await studentService.getCourseCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load categories:", e);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadLevels = useCallback(async () => {
    try {
      const data = await studentService.getEducationLevels();
      setEducationLevels(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load levels:", e);
    }
  }, []);

  const loadCourses = useCallback(async (pageNum: number = 1, append: boolean = false, filterOverrides?: Partial<FilterState>) => {
    const effectiveFilters = { ...filters, ...filterOverrides };
    if (!append) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const queryFilters: any = {};
      if (effectiveFilters.categoryId) queryFilters.category_id = effectiveFilters.categoryId;
      if (effectiveFilters.levelId) queryFilters.level = effectiveFilters.levelId;
      if (effectiveFilters.maxPrice) queryFilters.max_price = effectiveFilters.maxPrice;

      const result = await studentService.getCoursesPaginated(queryFilters, pageNum);
      if (append) {
        setCourses(prev => [...prev, ...result.courses]);
      } else {
        setCourses(result.courses);
      }
      setPagination(result.pagination);
    } catch (e: any) {
      console.error("Failed to load courses:", e);
      setError(e.message || "Failed to load courses");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCategories();
    loadLevels();
  }, [loadCategories, loadLevels]);

  useEffect(() => {
    setPage(1);
    loadCourses(1, false);
  }, [filters]);

  const hasActiveFilters = filters.categoryId !== null || filters.maxPrice !== null || filters.levelId !== null;

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const q = searchQuery.toLowerCase();
    return courses.filter(course => {
      const title = (course.name || '').toLowerCase();
      const description = (course.description || '').toLowerCase();
      const teacher = course.teacher_basic
        ? `${course.teacher_basic.first_name} ${course.teacher_basic.last_name}`.toLowerCase()
        : '';
      const category = course.category
        ? (language === 'ar' ? course.category.name_ar || '' : course.category.name_en || '').toLowerCase()
        : '';
      return title.includes(q) || description.includes(q) || teacher.includes(q) || category.includes(q);
    });
  }, [courses, searchQuery, language]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadCourses(nextPage, true);
  };

  const clearFilters = () => {
    setFilters({ categoryId: null, levelId: null, maxPrice: null });
  };

  const removeFilter = (key: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [key]: null }));
  };

  const selectedCategory = categories.find(c => c.id === filters.categoryId);
  const selectedLevel = educationLevels.find(l => l.id === filters.levelId);

  if (loading && courses.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error && courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
          <BookOpen size={48} className="text-red-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">{t.errorLoadingCourses}</h3>
        <p className="text-sm text-slate-500 text-center max-w-sm">{error}</p>
        <Button onClick={() => loadCourses(1, false)} className="mt-2">{t.retry}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.trainingCourses}</h2>
          <p className="text-sm text-slate-500 mt-1">{t.coursesAvailableCount(filteredCourses.length)}</p>
        </div>
        <Button
          variant="outline"
          className="h-10 px-4 rounded-xl flex items-center gap-2"
          onClick={() => setShowFilterSheet(true)}
        >
          <SlidersHorizontal size={18} className="text-primary" />
          <span className="text-sm font-medium">{t.filters}</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category Chips */}
      {!categoriesLoading && categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilters(prev => ({ ...prev, categoryId: null }))}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filters.categoryId === null
                ? 'bg-primary text-white shadow-md shadow-primary/30'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {language === 'ar' ? 'الكل' : 'All'}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilters(prev => ({ ...prev, categoryId: prev.categoryId === cat.id ? null : cat.id }))}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filters.categoryId === cat.id
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {language === 'ar' ? cat.name_ar : cat.name_en}
            </button>
          ))}
        </div>
      )}

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">{t.activeFilters}:</span>
            <button onClick={clearFilters} className="text-xs font-medium text-red-500 hover:text-red-600">
              {t.clearAll}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                {language === 'ar' ? selectedCategory.name_ar : selectedCategory.name_en}
                <button onClick={() => removeFilter('categoryId')} className="hover:text-primary/70">
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedLevel && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                {language === 'ar' ? selectedLevel.name_ar : selectedLevel.name_en}
                <button onClick={() => removeFilter('levelId')} className="hover:text-primary/70">
                  <X size={12} />
                </button>
              </span>
            )}
            {filters.maxPrice !== null && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                ≤ {filters.maxPrice} {t.sar}
                <button onClick={() => removeFilter('maxPrice')} className="hover:text-primary/70">
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCourses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center">
            <School size={56} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">{t.noCoursesFound}</h3>
          <p className="text-sm text-slate-500">{t.tryAdjustingSearch}</p>
        </div>
      )}

      {/* Courses Grid */}
      {filteredCourses.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map(course => {
              const teacherName = course.teacher_basic
                ? `${course.teacher_basic.first_name} ${course.teacher_basic.last_name}`
                : course.teacher
                  ? `${course.teacher.first_name} ${course.teacher.last_name}`
                  : 'Unknown Teacher';
              const coverImg = course.cover_image ? getStorageUrl(course.cover_image) : null;
              const categoryName = course.category
                ? (language === 'ar' ? course.category.name_ar : course.category.name_en)
                : '';
              const levelName = '';
              const availableSeats = course.available_seats ?? 0;

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group flex flex-col cursor-pointer"
                  onClick={() => setSelectedCourse(course)}
                >
                  {/* Image */}
                  <div className="relative aspect-[2.5/1] bg-slate-100 overflow-hidden">
                    {coverImg ? (
                      <img src={coverImg} alt={course.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen size={36} className="text-slate-300" />
                      </div>
                    )}

                    {/* Category Badge */}
                    {categoryName && (
                      <span className="absolute top-3 right-3 px-3 py-1 bg-purple-600 text-white rounded-full text-[10px] font-semibold">
                        {categoryName}
                      </span>
                    )}

                    {/* Rating Badge */}
                    <span className="absolute top-3 left-3 px-2 py-1 bg-black/70 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      {(course as any).rating
                        ? typeof (course as any).rating === 'number'
                          ? (course as any).rating.toFixed(1)
                          : (course as any).rating
                        : '0.0'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-900 text-base leading-tight line-clamp-2 mb-1">
                      {course.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mb-3">{course.description}</p>

                    {/* Teacher & Level */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        <Users size={10} className="text-slate-500" />
                      </div>
                      <span className="text-xs text-slate-600 font-medium truncate flex-1">{teacherName}</span>
                    </div>

                    {/* Meta Chips */}
                    <div className="flex items-center gap-4 mb-3">
                      {course.duration_hours && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock size={13} />
                          {t.hoursShort(course.duration_hours)}
                        </span>
                      )}
                      {availableSeats > 0 && (
                        <span className={`flex items-center gap-1 text-xs ${availableSeats <= 5 ? 'text-orange-500' : 'text-slate-500'}`}>
                          <Users size={13} />
                          {t.availableSeatsCount(availableSeats)}
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-50">
                      <div>
                        <span className="text-xs text-slate-400">{t.price}</span>
                        <p className="text-lg font-bold text-primary leading-tight">
                          {Number(course.price).toFixed(2)} <span className="text-xs font-normal text-slate-400">{t.currency}</span>
                        </p>
                      </div>
                      <Button
                        className="h-9 px-4 text-xs font-bold rounded-xl"
                        onClick={(e) => { e.stopPropagation(); setSelectedCourse(course); }}
                      >
                        {t.details}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {pagination.current_page < pagination.last_page && (
            <div className="flex justify-center pt-2 pb-6">
              <Button
                variant="outline"
                className="px-8"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : null}
                {t.viewAll}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Filter Sheet Modal */}
      {showFilterSheet && <CourseFilterSheet
        filters={filters}
        categories={categories}
        educationLevels={educationLevels}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setShowFilterSheet(false);
        }}
        onClose={() => setShowFilterSheet(false)}
      />}

      {/* Course Details Modal */}
      <CourseDetailsModal
        course={selectedCourse}
        onClose={() => setSelectedCourse(null)}
        onBook={(title, price) => {
          setSelectedCourse(null);
          setBookingItem({ title, price });
        }}
      />

      {/* Booking Modal */}
      <BookingModal
        isOpen={!!bookingItem}
        onClose={() => setBookingItem(null)}
        title={bookingItem?.title || ''}
        price={bookingItem?.price || 0}
      />
    </div>
  );
};

const CourseFilterSheet: React.FC<{
  filters: FilterState;
  categories: CourseCategory[];
  educationLevels: EducationLevel[];
  onApply: (filters: FilterState) => void;
  onClose: () => void;
}> = ({ filters, categories, educationLevels, onApply, onClose }) => {
  const { t, language } = useLanguage();
  const [draft, setDraft] = useState<FilterState>({ ...filters });

  const resetDraft = () => setDraft({ categoryId: null, levelId: null, maxPrice: null });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[80vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">{t.filterCourses}</h3>
          <div className="flex items-center gap-2">
            <button onClick={resetDraft} className="text-xs font-medium text-red-500 hover:text-red-600">
              {t.reset}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {language === 'ar' ? 'الفئة' : t.category}
            </label>
            <select
              value={draft.categoryId ?? ''}
              onChange={e => setDraft(prev => ({ ...prev, categoryId: e.target.value ? Number(e.target.value) : null }))}
              className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
            >
              <option value="">{t.selectItem(language === 'ar' ? 'الفئة' : t.category)}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {language === 'ar' ? cat.name_ar : cat.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Education Level */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {language === 'ar' ? 'المرحلة الدراسية' : t.levels}
            </label>
            <select
              value={draft.levelId ?? ''}
              onChange={e => setDraft(prev => ({ ...prev, levelId: e.target.value ? Number(e.target.value) : null }))}
              className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
            >
              <option value="">{t.selectItem(language === 'ar' ? 'المرحلة الدراسية' : 'level')}</option>
              {educationLevels.map(level => (
                <option key={level.id} value={level.id}>
                  {language === 'ar' ? level.name_ar : level.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Max Price */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{t.maxPrice}</label>
            <p className="text-sm text-slate-500 mb-2">≤ {draft.maxPrice ?? 1500} {t.sar}</p>
            <input
              type="range"
              min={100}
              max={3000}
              step={100}
              value={draft.maxPrice ?? 1500}
              onChange={e => setDraft(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
              className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>100 {t.sar}</span>
              <span>3000 {t.sar}</span>
            </div>
          </div>
        </div>

        {/* Apply */}
        <div className="px-6 py-4 border-t border-slate-100">
          <Button className="w-full h-12 text-base font-bold rounded-xl" onClick={() => onApply(draft)}>
            {t.applyFilters}
          </Button>
        </div>
      </div>
    </div>
  );
};

const CourseDetailsModal: React.FC<{
  course: Course | null;
  onClose: () => void;
  onBook: (title: string, price: number) => void;
}> = ({ course, onClose, onBook }) => {
  const { t, language } = useLanguage();

  if (!course) return null;

  const teacherName = course.teacher_basic
    ? `${course.teacher_basic.first_name} ${course.teacher_basic.last_name}`
    : course.teacher
      ? `${course.teacher.first_name} ${course.teacher.last_name}`
      : 'Unknown Teacher';
  const coverImg = course.cover_image ? getStorageUrl(course.cover_image) : null;
  const categoryName = course.category
    ? (language === 'ar' ? course.category.name_ar : course.category.name_en)
    : '';
  const availableSeats = course.available_seats ?? 0;

  return (
    <Modal isOpen={!!course} onClose={onClose} title={course.name}>
      <div className="space-y-5">
        {/* Image */}
        <div className="relative aspect-[2.5/1] bg-slate-100 rounded-xl overflow-hidden -mx-6 -mt-6 mb-0">
          {coverImg ? (
            <img src={coverImg} alt={course.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen size={48} className="text-slate-300" />
            </div>
          )}
          {categoryName && (
            <span className="absolute top-3 right-3 px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-semibold">
              {categoryName}
            </span>
          )}
          <span className="absolute top-3 left-3 px-2 py-1 bg-black/70 text-white rounded-lg text-xs font-bold flex items-center gap-1">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            {(course as any).rating
              ? typeof (course as any).rating === 'number'
                ? (course as any).rating.toFixed(1)
                : (course as any).rating
              : '0.0'}
          </span>
        </div>

        {/* Teacher */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-xs text-slate-500">{language === 'ar' ? 'المعلم' : 'Teacher'}</p>
            <p className="text-sm font-semibold text-slate-900">{teacherName}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <Clock size={18} className="text-blue-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-600">{course.duration_hours || 0}</p>
            <p className="text-[10px] text-blue-500">{language === 'ar' ? 'ساعة' : 'Hours'}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <Users size={18} className="text-green-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-600">{0}</p>
            <p className="text-[10px] text-green-500">{language === 'ar' ? 'طلاب' : 'Students'}</p>
          </div>
          <div className={`rounded-xl p-3 text-center ${availableSeats <= 5 ? 'bg-orange-50' : 'bg-purple-50'}`}>
            <Users size={18} className={`mx-auto mb-1 ${availableSeats <= 5 ? 'text-orange-600' : 'text-purple-600'}`} />
            <p className={`text-lg font-bold ${availableSeats <= 5 ? 'text-orange-600' : 'text-purple-600'}`}>{availableSeats}</p>
            <p className="text-[10px] text-slate-500">{language === 'ar' ? 'مقاعد' : 'Seats'}</p>
          </div>
        </div>

        {/* Price */}
        <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">{language === 'ar' ? 'سعر الدورة' : 'Course Price'}</p>
            <p className="text-white/70 text-xs">{language === 'ar' ? 'شامل الشهادة' : 'Certificate included'}</p>
          </div>
          <p className="text-white text-2xl font-bold">
            {Number(course.price).toFixed(2)} {t.sar}
          </p>
        </div>

        {/* Description */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 mb-2">{language === 'ar' ? 'الوصف' : 'Description'}</h4>
          <p className="text-sm text-slate-600 leading-relaxed">{course.description}</p>
        </div>

        {/* Book Button */}
        <Button
          className="w-full h-12 text-base font-bold rounded-xl"
          onClick={() => onBook(course.name, parseFloat(course.price) || 0)}
        >
          {t.bookNow}
        </Button>
      </div>
    </Modal>
  );
};
