
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Globe, Star, Loader2, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';
import { BookingModal } from './BookingModal';
import { studentService, TeacherProfile, getStorageUrl } from '../../Services/api';

export const LanguageLearningTab: React.FC = () => {
  const { t, language } = useLanguage();
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingItem, setBookingItem] = useState<{title: string, price: number} | null>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        // FIX: Use getTeachers with service_id: 2 (Language Learning) instead of non-existent getLanguageTeachers
        const data = await studentService.getTeachers({ service_id: 2 });
        setTeachers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load language teachers", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  if (loading) {
      return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-900">{t.languageLearning}</h2>
      
      {teachers.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
             <Globe className="mx-auto h-12 w-12 text-slate-300 mb-3" />
             <p>{language === 'ar' ? 'لا يوجد معلمون متاحون حالياً' : 'No language teachers available at the moment.'}</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((teacher) => {
                // Determine primary language from subjects or use default
                const langSubject = teacher.teacher_subjects?.[0]?.title || 'Language';
                
                return (
                <div key={teacher.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-500 overflow-hidden">
                         {teacher.profile_image ? (
                             <img src={getStorageUrl(teacher.profile_image)} alt={teacher.first_name} className="h-full w-full object-cover" />
                         ) : (
                             teacher.first_name.charAt(0)
                         )}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">{teacher.first_name} {teacher.last_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Globe size={14} /> {langSubject}
                        </div>
                    </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl mb-4">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star size={16} fill="currentColor" /> {teacher.rating || '5.0'}
                        </div>
                        <div className="font-bold text-primary">
                            {teacher.individual_hour_price} <span className="text-slate-400 text-xs font-normal">{t.sar} {t.perHour}</span>
                        </div>
                    </div>

                    <Button 
                        className="w-full" 
                        onClick={() => setBookingItem({ title: `${langSubject} with ${teacher.first_name}`, price: teacher.individual_hour_price })}
                    >
                        {t.bookNow}
                    </Button>
                </div>
                );
            })}
        </div>
      )}

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
