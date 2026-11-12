import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { 
  X, 
  User, 
  Star, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  MessageSquare 
} from 'lucide-react';
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
  const isAr = language === 'ar';

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
        setError(err.message || (isAr ? 'فشل تحميل العروض' : 'Error loading applications'));
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, [isOpen, orderId]);

  const handleAccept = async (appId: number) => {
    const confirmed = window.confirm(
      isAr
        ? 'هل أنت متأكد من قبول عرض هذا المعلم؟'
        : 'Are you sure you want to accept this teacher offer?'
    );
    if (!confirmed) return;

    setAcceptingId(appId);
    setError(null);

    try {
      await studentService.acceptApplication(orderId, appId);
      alert(isAr ? 'تم قبول العرض بنجاح' : 'Offer accepted successfully');
      if (onAccepted) onAccepted();
      onClose();
    } catch (err: any) {
      setError(err.message || (isAr ? 'فشل قبول العرض' : 'Failed to accept offer'));
    } finally {
      setAcceptingId(null);
    }
  };

  if (!isOpen) return null;

  const subject = orderData?.subject || {};
  const subjectName = orderData?.resolvedSubjectName || (isAr
    ? (subject.name_ar || subject.name || 'طلب خاص')
    : (subject.name_en || subject.name || 'Special Order'));
  const gradeName = orderData?.resolvedGradeName || '';
  const levelName = orderData?.resolvedLevelName || '';

  const getStatusBadge = (status: string) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'accepted') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#5B9F48] border border-[#5B9F48]/30">
          {isAr ? 'تم القبول' : 'Accepted'}
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
          {isAr ? 'مرفوض' : 'Rejected'}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
        {isAr ? 'قيد الانتظار' : 'Pending'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#F1F5F9] animate-fade-in my-8">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1F5F9] bg-[#EFF6F4]/50">
          <div>
            <h3 className="font-bold text-lg text-[#0D4A5F]">
              {isAr ? `العروض المقدمة - ${subjectName}` : `Applications - ${subjectName}`}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-[#64748B]">#{orderId}</span>
              {levelName && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-[#0D4A5F] border border-[#5B9F48]/20">
                  {levelName}
                </span>
              )}
              {gradeName && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-[#0D4A5F] border border-gray-200">
                  {gradeName}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#0D4A5F] hover:bg-gray-100 transition-colors shadow-sm"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-red-50 text-[#EF4444] text-sm flex items-center gap-2 border border-red-200">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {loading ? (
            <div className="p-16 flex justify-center items-center">
              <Loader2 className="animate-spin h-8 w-8 text-[#5B9F48]" />
            </div>
          ) : applications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-24 h-24 mx-auto rounded-[28px] bg-[#DCE5EA]/50 flex items-center justify-center text-[#0D4A5F] mb-4">
                <User size={36} />
              </div>
              <h4 className="font-bold text-[#0D4A5F] text-base mb-1">
                {isAr ? 'لا توجد عروض مقدمة حتى الآن' : 'No applications received yet'}
              </h4>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                {isAr
                  ? 'طلبك منشور وسيتم إشعارك فور تقديم المعلمين لعروضهم.'
                  : 'Your request is visible. You will be notified once offers arrive.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const teacher = app.teacher || {};
                const profile = teacher.profile || {};
                const name = teacher.name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || (isAr ? 'معلم' : 'Teacher');
                const avatar = profile.profile_photo || teacher.profile_image;
                const status = (app.status || 'pending').toLowerCase();
                const isAccepted = status === 'accepted';
                const isPending = status === 'pending';
                const proposedPrice = app.proposed_price || app.price || app.offer_price || 0;
                const rating = profile.rating || teacher.rating || 5.0;

                return (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl border border-[#F1F5F9] bg-white shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#E2E8F0] overflow-hidden shrink-0 flex items-center justify-center font-bold text-[#0D4A5F]">
                          {avatar ? (
                            <img src={getStorageUrl(avatar)} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#0D4A5F]">{name}</h4>
                            <div className="flex items-center gap-0.5 text-xs text-amber-500 font-bold">
                              <Star size={12} className="fill-current" />
                              <span>{Number(rating).toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-[#64748B]">
                            <DollarSign size={14} className="text-[#5B9F48]" />
                            <span>
                              {isAr ? 'السعر المقترح:' : 'Proposed Price:'}
                            </span>
                            <span className="font-bold text-[#0D4A5F]">
                              {Number(proposedPrice).toFixed(0)} {isAr ? 'ر.س' : 'SAR'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {getStatusBadge(status)}
                    </div>

                    {(app.message || app.notes) && (
                      <div className="p-3 rounded-xl bg-gray-50 flex items-start gap-2 text-xs text-[#64748B]">
                        <MessageSquare size={14} className="shrink-0 mt-0.5 text-gray-400" />
                        <span>{app.message || app.notes}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                      {app.created_at ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                          <Calendar size={13} className="text-gray-400" />
                          <span>{new Date(app.created_at).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span />
                      )}

                      {isPending && (
                        <Button
                          disabled={acceptingId === app.id}
                          onClick={() => handleAccept(app.id)}
                          className="h-9 px-5 rounded-xl bg-[#5B9F48] hover:bg-[#4d863d] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          {acceptingId === app.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle size={15} />
                          )}
                          <span>{isAr ? 'قبول' : 'Accept'}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#F1F5F9] bg-gray-50 flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs h-9 px-5 rounded-xl border-gray-200 text-[#0D4A5F]"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentOrderApplicationsModal;
