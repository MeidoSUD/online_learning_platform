import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  PlusCircle, 
  MinusCircle, 
  Loader2, 
  GraduationCap, 
  Globe, 
  BookOpen, 
  BookMarked, 
  Sparkles, 
  RefreshCw,
  FileCheck2,
  Upload,
  Check,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../ui/Button';
import { teacherService, studentService, authService, UserData, getStorageUrl } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';

interface TeacherServicesTabProps {
  onNavigate?: (tab: string) => void;
}

export const TeacherServicesTab: React.FC<TeacherServicesTabProps> = ({ onNavigate }) => {
  const { language, direction } = useLanguage();
  const { showToast } = useToast();
  const isAr = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [currentServiceIds, setCurrentServiceIds] = useState<Set<number>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateTitle, setCertificateTitle] = useState('');
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [currentCertificateUrl, setCurrentCertificateUrl] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, srvRes] = await Promise.all([
        authService.getUserDetails().catch(() => null),
        teacherService.getTeacherServices().catch(() => null)
      ]);

      const userData: UserData = userRes?.user?.data || userRes?.data || userRes;
      const profile: any = userData?.profile;

      if (profile) {
        setIsVerified(Boolean(userData?.verified || profile?.verified));
        const certRaw: string =
          profile.certificate ||
          profile.certificate_attachment?.file_path ||
          profile.certificate_attachment?.filePath ||
          profile.resume ||
          '';
        const certClean = certRaw
          ? (/^https?:\/\//i.test(certRaw)
              ? certRaw
              : getStorageUrl(String(certRaw).replace(/^\//, '').replace(/^storage\//, '')))
          : '';
        setCurrentCertificateUrl(certClean);
      }

      const svcData = srvRes?.data || srvRes;
      let catalog: any[] = Array.isArray(svcData?.all_services) ? svcData.all_services : (Array.isArray(srvRes?.all_services) ? srvRes.all_services : []);

      if (catalog.length === 0) {
        try {
          const list = await studentService.getServices();
          if (Array.isArray(list) && list.length > 0) catalog = list;
        } catch {}
      }

      if (catalog.length === 0) {
        catalog = [
          {
            id: 1,
            name_ar: 'الحصص الخصوصية',
            name_en: 'Private Lessons',
            key_name: 'private_lesson',
            description_ar: 'حصص خصوصية للطلاب',
            description_en: 'Private lessons for students'
          },
          {
            id: 2,
            name_ar: 'تعلم اللغات',
            name_en: 'Language Learning',
            key_name: 'language_learning',
            description_ar: 'تعليم اللغات',
            description_en: 'Language Learning'
          },
          {
            id: 3,
            name_ar: 'الدورات المخصصة',
            name_en: 'Specialized Courses',
            key_name: 'courses',
            description_ar: 'دورات تدريبية متخصصة',
            description_en: 'Specialized training courses'
          },
          {
            id: 5,
            name_ar: 'الكتب الدراسية',
            name_en: 'Study Books',
            key_name: 'books',
            description_ar: 'مكتبة ومناهج الكتب الدراسية',
            description_en: 'Study books library'
          }
        ];
      }
      setServices(catalog);

      const ids = new Set<number>();
      const currentList = Array.isArray(svcData?.current_services) ? svcData.current_services : (Array.isArray(srvRes?.current_services) ? srvRes.current_services : []);
      currentList.forEach((s: any) => {
        const sid = Number(s?.id || s?.service_id);
        if (sid > 0) ids.add(sid);
      });

      if (Array.isArray(profile?.services)) {
        profile.services.forEach((s: any) => {
          const sid = Number(s?.id || s?.service_id);
          if (sid > 0) ids.add(sid);
        });
      }

      if (profile?.teacher_service?.service_id) {
        const sid = Number(profile.teacher_service.service_id);
        if (sid > 0) ids.add(sid);
      }

      setCurrentServiceIds(ids);

    } catch (e: any) {
      setError(e?.message || (isAr ? 'فشل تحميل الخدمات' : 'Failed to load services'));
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleService = async (serviceId: number) => {
    if (togglingIds.has(serviceId)) return;
    const isCurrentlySelected = currentServiceIds.has(serviceId);

    setTogglingIds(prev => new Set(prev).add(serviceId));

    try {
      if (isCurrentlySelected) {
        await teacherService.deleteTeacherService(serviceId);
        setCurrentServiceIds(prev => {
          const next = new Set(prev);
          next.delete(serviceId);
          return next;
        });
        showToast(isAr ? 'تم تعطيل الخدمة بنجاح' : 'Service deactivated successfully', 'success');
      } else {
        await teacherService.addTeacherService({ service_id: serviceId });
        setCurrentServiceIds(prev => {
          const next = new Set(prev);
          next.add(serviceId);
          return next;
        });
        showToast(isAr ? 'تم تفعيل الخدمة بنجاح' : 'Service activated successfully', 'success');
      }
    } catch (e: any) {
      showToast(e?.message || (isAr ? 'حدث خطأ أثناء تحديث الخدمة' : 'Error updating service'), 'error');
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(serviceId);
        return next;
      });
    }
  };

  const MAX_CERT_SIZE = 5 * 1024 * 1024;

  const handleCertificateFilePick = (file: File | null) => {
    if (file && file.size > MAX_CERT_SIZE) {
      showToast(isAr ? 'حجم الملف كبير (الحد الأقصى 5MB)' : 'File too large (max 5MB)', 'error');
      return;
    }
    setCertificateFile(file);
  };

  const handleUploadCertificate = async () => {
    if (!certificateFile) {
      showToast(isAr ? 'يرجى اختيار ملف الشهادة أولاً' : 'Please choose a certificate file first', 'error');
      return;
    }
    setUploadingCertificate(true);
    try {
      const formData = new FormData();
      formData.append('certificate', certificateFile);
      if (certificateTitle.trim()) formData.append('title', certificateTitle.trim());
      await teacherService.uploadTeacherCertificate(formData);
      showToast(isAr ? 'تم رفع الشهادة بنجاح' : 'Certificate uploaded successfully', 'success');
      setCertificateFile(null);
      setCertificateTitle('');
      await loadData();
    } catch (e: any) {
      showToast(e?.message || (isAr ? 'فشل رفع الشهادة' : 'Failed to upload certificate'), 'error');
    } finally {
      setUploadingCertificate(false);
    }
  };

  const getServiceIcon = (id: number, keyName?: string) => {
    const k = String(keyName || '').toLowerCase();
    if (id === 1 || k.includes('private')) {
      return <GraduationCap size={26} />;
    }
    if (id === 2 || k.includes('lang')) {
      return <Globe size={26} />;
    }
    if (k.includes('book')) {
      return <BookMarked size={26} />;
    }
    if (k.includes('course') || k.includes('training')) {
      return <BookOpen size={26} />;
    }
    return <Sparkles size={26} />;
  };

  const getServiceDescription = (service: any) => {
    if (isAr) {
      if (service.description_ar) return service.description_ar;
      if (service.id === 1) return 'حصص خصوصية للطلاب';
      if (service.id === 2) return 'تعليم اللغات';
      if (service.id === 3) return 'دورات تدريبية متخصصة';
      if (service.id === 5 || String(service.key_name).includes('book')) return 'مكتبة ومناهج الكتب الدراسية والمذكرات';
      return service.description || 'خدمة تعليمية معتمدة';
    } else {
      if (service.description_en) return service.description_en;
      if (service.id === 1) return 'Private lessons for students';
      if (service.id === 2) return 'Language Learning';
      if (service.id === 3) return 'Specialized Courses';
      if (service.id === 5 || String(service.key_name).includes('book')) return 'Study books and educational resources';
      return service.description || 'Certified educational service';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16">
        <Loader2 className="animate-spin text-[#5B9F48] h-10 w-10 mb-2" />
        <p className="text-xs text-slate-500 font-medium">
          {isAr ? 'جارٍ تحميل الخدمات...' : 'Loading services...'}
        </p>
      </div>
    );
  }

  if (error && services.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
          <RefreshCw size={26} />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          {isAr ? 'تعذر تحميل الخدمات' : 'Failed to load services'}
        </h3>
        <p className="text-xs text-slate-500 mb-4">{error}</p>
        <button
          type="button"
          onClick={loadData}
          className="px-5 py-2.5 rounded-xl bg-[#5B9F48] hover:bg-[#4d863d] text-white font-bold text-xs transition inline-flex items-center gap-2"
        >
          <RefreshCw size={14} />
          <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in font-sans" dir={direction}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('profile')}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#0D4A5F] hover:bg-slate-50 transition shadow-sm"
          >
            {direction === 'rtl' ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
          </button>
          <div>
            <h2 className="text-lg font-bold text-[#0D4A5F]">
              {isAr ? 'إدارة الخدمات' : 'Service Management'}
            </h2>
            <p className="text-xs text-slate-500">
              {isAr ? 'تفعيل وتعطيل الخدمات التعليمية المقدمة' : 'Activate and manage your educational services'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#5B9F48] hover:bg-slate-50 transition shadow-sm"
          title={isAr ? 'تحديث' : 'Refresh'}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {services.map((service) => {
          const id = Number(service.id);
          const name = isAr
            ? (service.name_ar || service.name || service.title || '')
            : (service.name_en || service.name || service.title || '');
          const description = getServiceDescription(service);
          const isSelected = currentServiceIds.has(id);
          const isToggling = togglingIds.has(id);

          return (
            <div
              key={id}
              className={`rounded-2xl p-4 sm:p-5 transition-all shadow-sm ${
                isSelected
                  ? 'bg-[#5B9F48]/5 border-2 border-[#5B9F48]'
                  : 'bg-white border border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#5B9F48]/10 text-[#5B9F48] flex items-center justify-center shrink-0">
                  {getServiceIcon(id, service.key_name)}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-[#5B9F48] truncate">
                    {name || `Service ${id}`}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {description}
                  </p>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <CheckCircle2 size={28} className="text-[#5B9F48]" />
                  ) : (
                    <PlusCircle size={28} className="text-slate-300" />
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                {isSelected ? (
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => handleToggleService(id)}
                    className="w-full py-2.5 px-4 rounded-xl border border-red-500 text-red-500 hover:bg-red-50 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {isToggling ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <MinusCircle size={16} />
                    )}
                    <span>{isAr ? 'تعطيل' : 'Deactivate'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => handleToggleService(id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#5B9F48] hover:bg-[#4d863d] text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm"
                  >
                    {isToggling ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <PlusCircle size={16} />
                    )}
                    <span>{isAr ? 'تفعيل' : 'Activate'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck2 size={22} className="text-[#5B9F48]" />
          <h3 className="font-bold text-[#0D4A5F] text-base">
            {isAr ? 'الشهادة الأكاديمية والمؤهلات' : 'Academic Certificate & Qualifications'}
          </h3>
        </div>

        {isVerified && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 inline-flex items-center gap-2 font-medium">
            <Check size={16} />
            <span>{isAr ? 'حسابك موثق من قبل الإدارة' : 'Your account is verified by administration'}</span>
          </p>
        )}

        {currentCertificateUrl ? (
          <a
            href={currentCertificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs font-semibold text-[#5B9F48] underline"
          >
            {isAr ? 'الشهادة الحالية مرفقة (عرض الملف)' : 'Current certificate attached (view file)'}
          </a>
        ) : (
          <p className="text-xs text-slate-500">
            {isAr ? 'لا توجد شهادة مرفقة بعد.' : 'No certificate attached yet.'}
          </p>
        )}

        <div className="space-y-3 pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 leading-relaxed">
            {isAr
              ? (currentCertificateUrl
                  ? 'يمكنك استبدال الشهادة برفع ملف جديد (PDF أو JPG أو PNG، بحد أقصى 5MB).'
                  : 'ارفع شهادتك الأكاديمية (PDF أو JPG أو PNG، بحد أقصى 5MB) لتوثيق حسابك من قبل الإدارة.')
              : (currentCertificateUrl
                  ? 'You can replace the certificate by uploading a new file (PDF, JPG, or PNG, max 5MB).'
                  : 'Upload your academic certificate (PDF, JPG, or PNG, max 5MB) for verification.')}
          </p>

          <input
            type="text"
            value={certificateTitle}
            onChange={(e) => setCertificateTitle(e.target.value)}
            placeholder={isAr ? 'عنوان الشهادة (اختياري)' : 'Certificate title (optional)'}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#5B9F48]"
          />

          <label className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl p-4 cursor-pointer hover:border-[#5B9F48] transition-colors">
            <Upload size={20} className="text-[#5B9F48] shrink-0" />
            <span className="text-xs text-slate-600 truncate">
              {certificateFile ? certificateFile.name : (isAr ? 'اختر ملف الشهادة (PDF, JPG, PNG)' : 'Choose certificate file')}
            </span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => handleCertificateFilePick(e.target.files?.[0] || null)}
            />
          </label>

          <button
            type="button"
            onClick={handleUploadCertificate}
            disabled={!certificateFile || uploadingCertificate}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0D4A5F] hover:bg-[#093544] text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm"
          >
            {uploadingCertificate ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            <span>
              {currentCertificateUrl
                ? (isAr ? 'استبدال الشهادة' : 'Replace certificate')
                : (isAr ? 'رفع الشهادة' : 'Upload certificate')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
