import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { X, User, Star, DollarSign, Check, AlertCircle, Loader2, Calendar, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { studentService, getStorageUrl } from '../../Services/api';

interface StudentOrderApplicationsModalProps {
  orderId: number;
  orderData: any;
  isOpen: boolean;
  onClose: () => void;
  onAccepted?: () => void;
}

export const StudentOrderApplicationsModal: React.FC<StudentOrderApplicationsModalProps> = ({
  orderId,
  orderData,
  isOpen,
  onClose,
  onAccepted,
}) => {
  const { language } = useLanguage();

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchApplications = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await studentService.getOrderApplications(orderId);
        const list = Array.isArray(res) ? res : (res?.data || []);
        setApplications(list);
      } catch (err: any) {
        setError(err.message || 'Error loading applications');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [isOpen, orderId]);

  const handleAccept = async (appId: number) => {
    const confirmed = window.confirm(
      language === 'ar'
        ? 'هل أنت متأكد من قبول عرض هذا المعلم؟'
        : 'Are you sure you want to accept this teacher offer?'
    );
    if (!confirmed) return;

    setAcceptingId(appId);
    setError(null);

    const slotId = orderData?.available_slots?.[0]?.id || 1;

    try {
      await studentService.acceptApplication(orderId, appId);
      alert(language === 'ar' ? 'تم قبول العرض بنجاح' : 'Offer accepted successfully');
      if (onAccepted) onAccepted();
      onClose();
    } catch (err: any) {
      setError(err.message || (language === 'ar' ? 'فشل قبول العرض' : 'Failed to accept offer'));
    } finally {
      setAcceptingId(null);
    }
  };

  if (!isOpen) return null;

  const subjectName = language === 'ar'
    ? (orderData?.subject?.name_ar || orderData?.subject?.name || 'طلب خاص')
    : (orderData?.subject?.name_en || orderData?.subject?.name || 'Special Order');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[var(--border)] animate-fade-in my-8">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-[var(--light-bg)]">
          <div>
            <h3 className="font-bold text-lg text-[var(--text-main)]">
              {language === 'ar' ? 'عروض المعلمين المقدمة' : 'Teacher Applications'}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {subjectName} (#{orderId})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[var(--text-muted)] hover:bg-white hover:text-[var(--text-main)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-red-50 text-red-700 text-sm flex items-center gap-2 border border-red-200">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : applications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="h-16 w-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                <User size={30} />
              </div>
              <h4 className="font-bold text-[var(--text-main)] mb-1">
                {language === 'ar' ? 'لا توجد عروض مقدمة حتى الآن' : 'No applications received yet'}
              </h4>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                {language === 'ar'
                  ? 'طلبك منشور في المنصة وسيتم إشعارك فور قيام المعلمين بتقديم عروضهم.'
                  : 'Your request is visible to teachers. You will be notified once offers arrive.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const teacher = app.teacher || {};
                const profile = teacher.profile || {};
                const name = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'Teacher';
                const avatar = profile.profile_photo || teacher.profile_image;
                const isAccepted = app.status === 'accepted';
                const isPending = app.status === 'pending';

                return (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl border border-[var(--border)] bg-white hover:border-primary/40 transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-[var(--light-bg)] overflow-hidden shrink-0 flex items-center justify-center font-bold text-gray-500">
                        {avatar ? (
                          <img src={getStorageUrl(avatar)} alt={name} className="h-full w-full object-cover" />
                        ) : (
                          name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[var(--text-main)] text-sm">{name}</h4>
                          {profile.rating > 0 && (
                            <span className="flex items-center text-xs text-amber-500 font-bold gap-0.5">
                              <Star size={12} fill="currentColor" /> {Number(profile.rating).toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {app.notes || (language === 'ar' ? 'جاهز لتقديم الحصة في الموعد المحدد' : 'Ready for the requested session')}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--text-muted)]">
                          <span className="font-bold text-primary text-sm">
                            {Number(app.price || app.offer_price || 0).toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}
                          </span>
                          <span>•</span>
                          <span>{new Date(app.created_at || Date.now()).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex sm:flex-col items-center justify-end gap-2">
                      {isAccepted ? (
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 flex items-center gap-1 border border-green-200">
                          <Check size={14} />
                          {language === 'ar' ? 'تم القبول' : 'Accepted'}
                        </span>
                      ) : (
                        <Button
                          disabled={acceptingId === app.id || !isPending}
                          onClick={() => handleAccept(app.id)}
                          className="w-full sm:w-auto text-xs px-4 py-2 h-9 rounded-xl flex items-center gap-1.5"
                        >
                          {acceptingId === app.id && <Loader2 size={14} className="animate-spin" />}
                          <span>{language === 'ar' ? 'قبول العرض' : 'Accept Offer'}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] bg-gray-50 flex justify-end">
          <Button variant="outline" onClick={onClose} className="text-xs h-9 px-4">
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
};

