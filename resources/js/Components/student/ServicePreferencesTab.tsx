import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Info, SlidersHorizontal, Loader2, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { studentService, getStorageUrl } from '../../Services/api';

interface ServicePreferencesTabProps {
  onBack?: () => void;
}

export const ServicePreferencesTab: React.FC<ServicePreferencesTabProps> = ({ onBack }) => {
  const { language, direction } = useLanguage();

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchPreferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.getServicePreferences();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setServices(list);
    } catch (err: any) {
      setError(err.message || 'Error loading preferences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  const handleToggle = async (serviceId: number) => {
    const updatedServices = services.map(s => {
      if (s.id === serviceId) {
        return { ...s, is_hidden: !s.is_hidden };
      }
      return s;
    });

    setServices(updatedServices);
    setSaving(true);
    setSavedSuccess(false);

    const hiddenIds = updatedServices.filter(s => s.is_hidden).map(s => s.id);

    try {
      await studentService.updateServicePreferences(hiddenIds);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const ArrowIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] shadow-sm"
            >
              <ArrowIcon size={18} />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-black text-[var(--text-main)]">
              {language === 'ar' ? 'تفضيلات الخدمات التعليمية' : 'Service Preferences'}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {language === 'ar'
                ? 'خصص الخدمات التي تود استعراضها وتلقي الإشعارات عنها'
                : 'Customize the services you want to see and interact with'}
            </p>
          </div>
        </div>

        {savedSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 animate-fade-in">
            <CheckCircle2 size={14} />
            {language === 'ar' ? 'تم الحفظ تلقائياً' : 'Saved'}
          </span>
        )}
      </div>

      <div className="p-4 rounded-2xl bg-primary-pale/60 border border-primary/20 text-primary flex items-start gap-3">
        <Info size={20} className="shrink-0 mt-0.5 text-primary" />
        <p className="text-xs leading-relaxed">
          {language === 'ar'
            ? 'يمكنك التحكم في الخدمات التعليمية التي تظهر في شاشتك الرئيسية، حيث يتم إخفاء الخدمات غير المفعلة تلقائياً.'
            : 'Customize the services shown on your main dashboard. Disabled services are hidden automatically.'}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm flex items-center gap-2 border border-red-200">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 flex justify-center items-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : services.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-[var(--border)] p-8">
          <SlidersHorizontal size={36} className="mx-auto text-gray-400 mb-3" />
          <h3 className="font-bold text-sm text-[var(--text-main)]">
            {language === 'ar' ? 'لا توجد خدمات متاحة' : 'No services available'}
          </h3>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => {
            const title = language === 'ar'
              ? (service.name_ar || service.name_en || service.key_name)
              : (service.name_en || service.name_ar || service.key_name);
            const desc = language === 'ar'
              ? (service.description_ar || service.description_en || '')
              : (service.description_en || service.description_ar || '');
            const isVisible = !service.is_hidden;

            return (
              <div
                key={service.id}
                className="p-5 rounded-2xl bg-white border border-[var(--border)] shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gray-50 border border-[var(--border)] overflow-hidden shrink-0 flex items-center justify-center font-bold text-gray-500">
                    {service.image ? (
                      <img src={getStorageUrl(service.image)} alt={title} className="h-full w-full object-contain p-2" />
                    ) : (
                      <SlidersHorizontal size={22} className="text-primary" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text-main)]">{title}</h4>
                    {desc && <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{desc}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold ${isVisible ? 'text-primary' : 'text-gray-400'}`}>
                    {isVisible
                      ? (language === 'ar' ? 'مفعلة' : 'Active')
                      : (language === 'ar' ? 'مخفية' : 'Hidden')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggle(service.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isVisible ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isVisible
                          ? (direction === 'rtl' ? '-translate-x-5' : 'translate-x-5')
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

