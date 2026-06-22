
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Clock, Star, ChevronRight, PlayCircle, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { UserData, studentService, Booking, TeacherProfile, Course, getStorageUrl } from '../../Services/api';

interface OverviewTabProps {
  user: UserData;
  onNavigate: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ user, onNavigate }) => {
  const { t, direction, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);
  const [topTeachers, setTopTeachers] = useState<TeacherProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Last Booking
            const bookings = await studentService.getBookings();
            if (Array.isArray(bookings) && bookings.length > 0) {
                // Sort by date desc (if not already sorted) or take the first one
                setLastBooking(bookings[0]);
            }

            // Fetch Top Teachers (limit to 4 for display)
            const teachers = await studentService.getTeachers();
            setTopTeachers(Array.isArray(teachers) ? teachers.slice(0, 4) : []);

            // Fetch Recommended Courses (limit to 3)
            const allCourses = await studentService.getCourses();
            setCourses(Array.isArray(allCourses) ? allCourses.slice(0, 3) : []);

        } catch (e) {
            console.error("Overview Data Fetch Error:", e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  const getSubjectName = (booking: Booking): string => {
    if (booking.teacher_subject) {
        return language === 'ar' ? booking.teacher_subject.name_ar : booking.teacher_subject.name_en;
    }
    if (typeof booking.subject === 'object' && booking.subject !== null) {
        const subj = booking.subject as any;
        return language === 'ar' ? (subj.name_ar || subj.name) : (subj.name_en || subj.name);
    }
    if (typeof booking.subject === 'string') {
        return booking.subject;
    }
    return 'N/A';
  };

  if (loading) {
      return (
          <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-8 text-white shadow-lg shadow-blue-200">
        <h1 className="text-3xl font-bold mb-2">{t.welcomeBack} {user.first_name}!</h1>
        <p className="text-blue-100 opacity-90">Ready to learn something new today?</p>
      </div>

      {/* Last Booking Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">{t.lastBooking}</h2>
            <button className="text-sm text-primary font-medium hover:underline" onClick={() => onNavigate('schedule')}>
                {t.viewAll}
            </button>
        </div>
        
        {lastBooking ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">
                            {getSubjectName(lastBooking)}
                        </h3>
                        <p className="text-slate-500 text-sm">with {lastBooking.teacher?.first_name} {lastBooking.teacher?.last_name}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                            <span>{new Date(lastBooking.created_at || Date.now()).toLocaleDateString()}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                lastBooking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                                {lastBooking.status}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none text-xs h-10" onClick={() => onNavigate('bookings')}>
                        View Details
                    </Button>
                </div>
            </div>
        ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
                {t.noBookings}
            </div>
        )}
      </div>

      {/* Top Teachers */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">{t.topTeachers}</h2>
            <button className="text-sm text-primary font-medium hover:underline" onClick={() => onNavigate('private-lessons')}>
                {t.viewAll}
            </button>
        </div>
        
        {topTeachers.length === 0 ? (
             <div className="text-center py-10 bg-slate-50 rounded-xl text-slate-500">No teachers found.</div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {topTeachers.map((teacher) => (
                    <div key={teacher.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => onNavigate('private-lessons')}>
                        <div className="flex items-start justify-between mb-3">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold overflow-hidden">
                                {teacher.profile_image ? (
                                    <img src={getStorageUrl(teacher.profile_image)} alt={teacher.first_name || ''} className="h-full w-full object-cover" />
                                ) : (
                                    (teacher.first_name?.charAt(0) || teacher.name?.charAt(0) || '?').toUpperCase()
                                )}
                            </div>
                            <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                                <Star size={14} fill="currentColor" /> {teacher.rating || '5.0'}
                            </div>
                        </div>
                        <h3 className="font-bold text-slate-900 truncate">{teacher.first_name} {teacher.last_name}</h3>
                        <p className="text-sm text-slate-500 mb-3 truncate">{teacher.teacher_subjects?.[0]?.title || 'Teacher'}</p>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                            <span className="text-sm font-semibold text-primary">{teacher.individual_hour_price} {t.sar}<span className="text-slate-400 text-xs font-normal">{t.perHour}</span></span>
                            <ChevronRight size={18} className={`text-slate-300 group-hover:text-primary transition-colors ${direction === 'rtl' ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Recommended Courses */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">{t.recommendedCourses}</h2>
            <button className="text-sm text-primary font-medium hover:underline" onClick={() => onNavigate('courses')}>
                {t.viewAll}
            </button>
        </div>

        {courses.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl text-slate-500">No courses available.</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <div key={course.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-32 bg-slate-100 flex items-center justify-center text-slate-300 overflow-hidden">
                             {course.cover_image ? (
                                 <img src={getStorageUrl(course.cover_image)} alt={course.name} className="w-full h-full object-cover" />
                             ) : (
                                 <BookOpen size={40} />
                             )}
                        </div>
                        <div className="p-5">
                            <h3 className="font-bold text-slate-900 mb-1 truncate">{course.name}</h3>
                            <p className="text-sm text-slate-500 mb-4 truncate">by {course.teacher_basic?.first_name} {course.teacher_basic?.last_name}</p>
                            
                            <div className="flex items-center justify-between mb-4 text-xs text-slate-500 font-medium bg-slate-50 p-2 rounded-lg">
                                <span className="flex items-center gap-1"><PlayCircle size={14} /> {course.duration_hours || 'N/A'} Hours</span>
                                <span>{course.course_type}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-primary">{course.price} {t.sar}</span>
                                <Button variant="outline" className="h-9 text-xs px-3" onClick={() => onNavigate('courses')}>View</Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
