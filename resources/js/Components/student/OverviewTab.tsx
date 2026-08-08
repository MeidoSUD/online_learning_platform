import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Clock, Star, ChevronRight, PlayCircle, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { UserData, studentService, Booking, Course, getStorageUrl } from '../../Services/api';
import { TeacherCard } from './TeacherCard';
import { COUNTRIES } from '../../Utils/constants';

interface OverviewTabProps {
  user: UserData;
  onNavigate: (tab: string) => void;
}

function getNationalityFlag(nationality?: string | null): string {
  if (!nationality) return '';
  const country = COUNTRIES.find(
    c => c.label.toLowerCase() === nationality.toLowerCase()
  );
  return country?.flag || '';
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ user, onNavigate }) => {
  const { t, direction, language } = useLanguage();
  const [loading, setLoading] = useState(true);

  const [lastBooking, setLastBooking] = useState<Booking | null>(null);
  const [topTeachers, setTopTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const bookings = await studentService.getBookings();
        if (Array.isArray(bookings) && bookings.length > 0) {
          setLastBooking(bookings[0]);
        }

        const teachers = await studentService.getTeachers();
        setTopTeachers(Array.isArray(teachers) ? teachers.slice(0, 4) : []);

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
      <div className="bg-gradient-to-r from-primary to-blue-600 rounded-[var(--radius-md)] p-8 text-white shadow-[var(--shadow-lg)] shadow-blue-200">
        <h1 className="text-3xl font-bold mb-2">{t.welcomeBack} {user.first_name}!</h1>
        <p className="text-blue-100 opacity-90">Ready to learn something new today?</p>
      </div>

      {/* Last Booking Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--text-main)]">{t.lastBooking}</h2>
          <button className="text-sm text-primary font-medium hover:underline" onClick={() => onNavigate('schedule')}>
            {t.viewAll}
          </button>
        </div>

        {lastBooking ? (
          <div className="bg-white p-6 rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary-pale text-primary flex items-center justify-center">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-main)]">{getSubjectName(lastBooking)}</h3>
                <p className="text-[var(--text-muted)] text-sm">with {lastBooking.teacher?.first_name} {lastBooking.teacher?.last_name}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                  <span>{new Date(lastBooking.created_at || Date.now()).toLocaleDateString()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${lastBooking.status === 'confirmed' ? 'bg-primary-pale text-primary' : 'bg-yellow-100 text-yellow-700'}`}>
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
          <div className="p-8 text-center bg-[var(--light-bg)] rounded-[var(--radius-md)] border border-dashed border-[var(--border)] text-[var(--text-muted)]">
            {t.noBookings}
          </div>
        )}
      </div>

      {/* Top Teachers */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--text-main)]">{t.topTeachers}</h2>
          <button className="text-sm text-primary font-medium hover:underline" onClick={() => onNavigate('private-lessons')}>
            {t.viewAll}
          </button>
        </div>

        {topTeachers.length === 0 ? (
          <div className="text-center py-10 bg-[var(--light-bg)] rounded-[var(--radius-md)] text-[var(--text-muted)]">No teachers found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topTeachers.map((teacher) => {
              const profile = teacher?.profile || {};
              const profileImage = profile.profile_photo || teacher?.profile_image || null;
              const firstName = teacher?.first_name || '';
              const lastName = teacher?.last_name || '';
              const nationality = teacher?.nationality || '';
              const rating = profile?.rating ?? teacher?.rating ?? 0;
              const subjectTitle = profile?.teacher_subjects?.[0]?.title || 'Teacher';
              const price = profile?.individual_hour_price ?? 0;
              const flag = getNationalityFlag(nationality);

              return (
                <div
                  key={teacher.id}
                  className="bg-white p-4 rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all group cursor-pointer"
                  onClick={() => onNavigate('private-lessons')}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-12 w-12 rounded-full bg-[var(--light-bg)] flex items-center justify-center text-[var(--text-muted)] font-bold overflow-hidden shrink-0">
                      {profileImage ? (
                        <img src={getStorageUrl(profileImage)} alt={firstName} className="h-full w-full object-cover" />
                      ) : (
                        (firstName?.charAt(0) || '?').toUpperCase()
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                      <Star size={14} fill="currentColor" /> {rating > 0 ? rating.toFixed(1) : '0.0'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    {flag && <span className="text-base">{flag}</span>}
                    <h3 className="font-bold text-[var(--text-main)] truncate">{firstName} {lastName}</h3>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mb-3 truncate">{subjectTitle}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <span className="text-sm font-semibold text-primary">
                      {Number(price).toFixed(2)} {t.sar}<span className="text-[var(--text-muted)] text-xs font-normal">{t.perHour}</span>
                    </span>
                    <ChevronRight size={18} className={`text-[var(--text-muted)] group-hover:text-primary transition-colors ${direction === 'rtl' ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recommended Courses */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--text-main)]">{t.recommendedCourses}</h2>
          <button className="text-sm text-primary font-medium hover:underline" onClick={() => onNavigate('courses')}>
            {t.viewAll}
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-10 bg-[var(--light-bg)] rounded-[var(--radius-md)] text-[var(--text-muted)]">No courses available.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden hover:shadow-[var(--shadow-md)] transition-shadow">
                <div className="h-32 bg-[var(--light-bg)] flex items-center justify-center text-[var(--text-muted)] overflow-hidden">
                  {course.cover_image ? (
                    <img src={getStorageUrl(course.cover_image)} alt={course.name} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen size={40} />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-[var(--text-main)] mb-1 truncate">{course.name}</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-4 truncate">by {course.teacher_basic?.first_name} {course.teacher_basic?.last_name}</p>
                  <div className="flex items-center justify-between mb-4 text-xs text-[var(--text-muted)] font-medium bg-[var(--light-bg)] p-2 rounded-lg">
                    <span className="flex items-center gap-1"><PlayCircle size={14} /> {course.duration_hours || 'N/A'} Hours</span>
                    <span>{course.course_type}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{Number(course.price).toFixed(2)} {t.sar}</span>
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
