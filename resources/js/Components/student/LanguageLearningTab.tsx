import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Globe, Loader2 } from 'lucide-react';
import { studentService } from '../../Services/api';
import { TeacherCard } from './TeacherCard';

export const LanguageLearningTab: React.FC = () => {
  const { t, language } = useLanguage();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      try {
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

  const handleViewDetails = (teacher: any) => {
    const profile = teacher?.profile || {};
    const langSubject = profile?.teacher_subjects?.[0]?.title || 'Language';
    const price = profile?.individual_hour_price || 0;
    const firstName = teacher?.first_name || '';
    window.open(`/student/booking?teacher_id=${teacher.id}`, '_self');
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-[var(--text-main)]">{t.languageLearning}</h2>

      {teachers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] text-[var(--text-muted)]">
          <div className="mx-auto h-16 w-16 bg-[var(--green-pale)] rounded-full flex items-center justify-center mb-3">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <p>{language === 'ar' ? 'لا يوجد معلمون متاحون حالياً' : 'No language teachers available at the moment.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              teacher={teacher}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};
