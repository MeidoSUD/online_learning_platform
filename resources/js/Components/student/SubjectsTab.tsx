
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { BookOpen, Video, Users, Star, Loader2, Layers } from 'lucide-react';
import { Button } from '../ui/Button';
import { BookingModal } from './BookingModal';
import { studentService, Course, getStorageUrl } from '../../Services/api';

export const SubjectsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');
  const [bookingItem, setBookingItem] = useState<{title: string, price: number} | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await studentService.getCourses();
      setCourses(data);
    } catch (e) {
      console.error("Failed to load courses:", e);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique categories from the loaded courses
  const categories = React.useMemo(() => {
    const uniqueMap = new Map();
    courses.forEach(course => {
      if (course.category && !uniqueMap.has(course.category.id)) {
        uniqueMap.set(course.category.id, course.category);
      }
    });
    return Array.from(uniqueMap.values());
  }, [courses]);

  const filteredCourses = activeCategory === 'all' 
    ? courses 
    : courses.filter(c => c.category_id === activeCategory);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">{t.courses}</h2>
      </div>

      {/* Categories Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            activeCategory === 'all'
              ? 'bg-primary text-white shadow-md shadow-primary/30'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {language === 'ar' ? 'الكل' : 'All'}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-primary text-white shadow-md shadow-primary/30'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {language === 'ar' ? cat.name_ar : cat.name_en}
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
             {t.noBookings || "No courses available."}
          </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
                const teacherName = course.teacher_basic ? `${course.teacher_basic.first_name} ${course.teacher_basic.last_name}` : 'Unknown Teacher';
                const coverImg = course.cover_image ? getStorageUrl(course.cover_image) : null;
                
                return (
                <div key={course.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group">
                    {/* Course Image Placeholder */}
                    <div className="h-40 bg-slate-100 relative flex items-center justify-center group-hover:bg-slate-200 transition-colors overflow-hidden">
                    {coverImg ? (
                        <img src={coverImg} alt={course.name} className="w-full h-full object-cover" />
                    ) : (
                        <BookOpen size={48} className="text-slate-300" />
                    )}
                    
                    {/* Tags */}
                    {course.course_type && (
                         <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium capitalize">
                            {course.course_type}
                        </div>
                    )}
                    </div>
                    
                    <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{course.name}</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{course.description}</p>
                    <p className="text-xs text-slate-400 mb-2">by {teacherName}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                         {course.duration_hours && (
                             <span className="flex items-center gap-1"><Video size={14} /> {course.duration_hours} Hours</span>
                         )}
                         {course.category && (
                             <span className="flex items-center gap-1"><Layers size={14} /> {language === 'ar' ? course.category.name_ar : course.category.name_en}</span>
                         )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <span className="text-xl font-bold text-primary">{course.price} <span className="text-xs font-normal text-slate-400">{t.sar}</span></span>
                        <Button 
                            className="h-9 px-4 text-sm"
                            onClick={() => setBookingItem({ title: course.name, price: parseFloat(course.price) })}
                        >
                            {t.bookNow}
                        </Button>
                    </div>
                    </div>
                </div>
                );
            })}
        </div>
      )}

      {/* Booking Modal (Simple Mock for now) */}
      <BookingModal 
        isOpen={!!bookingItem}
        onClose={() => setBookingItem(null)}
        title={bookingItem?.title || ''}
        price={bookingItem?.price || 0}
      />
    </div>
  );
};
