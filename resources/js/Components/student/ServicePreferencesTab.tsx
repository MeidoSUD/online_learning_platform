import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  Sliders,
  CheckCircle,
  AlertCircle,
  Loader2,
  GraduationCap,
  Users,
  Brain,
  Languages,
  BookCheck,
  BookOpen,
  Save
} from 'lucide-react';
import { Button } from '../ui/Button';
import { studentService } from '../../Services/api';

export const ServicePreferencesTab: React.FC = () => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    private_lesson: true,
    group_classes: true,
    qiyas: true,
    language_learning: true,
    courses: true,
    study_books: true,
  });

  useEffect(() => {
    fetchPrefs();
  }, []);

  const fetchPrefs = async () => {
    setLoading(true);
    try {
      const res = await studentService.getServicePreferences();
      const data = res?.data || res;
      if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        setPreferences(prev => ({ ...prev, ...data }));
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await studentService.updateServicePreferences(preferences);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const services = [
    { key: 'private_lesson', title: language === 'ar' ? 'الدروس الخصوصية الفردية' : 'Private Lessons', icon: GraduationCap },
    { key: 'group_classes', title: language === 'ar' ? 'الحصص الجماعية التفاعلية' : 'Group Classes', icon: Users },
    { key: 'qiyas', title: language === 'ar' ? 'اختبارات القدرات والقياس' : 'Qiyas & Abilities', icon: Brain },
    { key: 'language_learning', title: language === 'ar' ? 'تعلم اللغات الحية' : 'Language Learning', icon: Languages },
    { key: 'courses', title: language === 'ar' ? 'الدورات والبرامج التدريبية' : 'Training Courses', icon: BookCheck },
    { key: 'study_books', title: language === 'ar' ? 'كتب ومناهج المدارس (كتبي)' : 'Curriculum Books', icon: BookOpen },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Sliders size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {language === 'ar' ? 'تفضيلات الخدمات التعليمية' : 'Service Preferences'}
            </h1>
            <p className="text-xs text-slate-500">
              {language === 'ar' ? 'حدد الخدمات التي ترغب في ظهورها في صفحتك الرئيسية وتلقي تنبيهاتها' : 'Choose which services appear on your home screen'}
            </p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl font-bold text-xs bg-primary hover:bg-primary-dark text-white shadow-sm h-10 px-5"
        >
          {saving ? <Loader2 className="animate-spin h-4 w-4" /> : (
            <>
              <Save size={15} className="mr-1.5 inline" />
              {language === 'ar' ? 'حفظ التفضيلات' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle size={18} className="text-emerald-600" />
          <span>{language === 'ar' ? 'تم حفظ التفضيلات بنجاح!' : 'Preferences saved successfully!'}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
        {services.map((svc) => {
          const Icon = svc.icon;
          const isEnabled = preferences[svc.key] !== false;
          return (
            <div
              key={svc.key}
              onClick={() => handleToggle(svc.key)}
              className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <span className="text-sm font-bold text-slate-800">{svc.title}</span>
              </div>

              <div
                className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex items-center ${isEnabled ? 'bg-primary' : 'bg-slate-300'
                  }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

