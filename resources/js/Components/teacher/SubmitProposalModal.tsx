import React, { useState } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { X, Send, DollarSign, FileText, User, BookOpen, Calendar, Clock, AlertCircle } from 'lucide-react';
import { teacherService } from '../../Services/api';

interface SubmitProposalModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubmitProposalModal: React.FC<SubmitProposalModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const subjectName = isAr
    ? order.subject?.name_ar || order.subject?.name_en || order.subject?.title
    : order.subject?.name_en || order.subject?.name_ar || order.subject?.title;

  const studentName = order.student
    ? `${order.student.first_name || ''} ${order.student.last_name || ''}`.trim()
    : (isAr ? 'طالب' : 'Student');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await teacherService.applyForOrder(order.id, message.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || (isAr ? 'فشل إرسال العرض' : 'Failed to submit proposal'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#5B9F48] flex items-center justify-center font-bold">
            <Send size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0D4A5F]">
              {isAr ? 'تقديم عرض سعر على الطلب' : 'Submit Proposal'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAr ? `الطلب #${order.id}` : `Order #${order.id}`}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 my-4 space-y-2 border border-slate-100 text-xs text-slate-700">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
            <span className="flex items-center gap-1.5 text-slate-500">
              <BookOpen size={14} />
              <span>{isAr ? 'المادة:' : 'Subject:'}</span>
            </span>
            <span className="font-bold text-slate-800">{subjectName}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
            <span className="flex items-center gap-1.5 text-slate-500">
              <User size={14} />
              <span>{isAr ? 'الطالب:' : 'Student:'}</span>
            </span>
            <span className="font-bold text-slate-800">{studentName}</span>
          </div>

          {(order.min_price || order.max_price) && (
            <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
              <span className="flex items-center gap-1.5 text-slate-500">
                <DollarSign size={14} />
                <span>{isAr ? 'الميزانية المقترحة:' : 'Budget:'}</span>
              </span>
              <span className="font-bold text-[#5B9F48]">
                {order.min_price || 0} - {order.max_price || 0} {isAr ? 'ر.س' : 'SAR'}
              </span>
            </div>
          )}

          {order.notes && (
            <div className="pt-1">
              <span className="block text-slate-500 mb-1">{isAr ? 'ملاحظات الطالب:' : 'Student Notes:'}</span>
              <p className="text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                {order.notes}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isAr ? 'رسالة العرض والمقترح التعليمي للطالب' : 'Proposal Note to Student'}
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isAr
                  ? 'اكتب تفاصيل مقترحك التعليمي، خبراتك، وكيف ستساعد الطالب في تحقيق أهدافه...'
                  : 'Write details of your proposal, your experience, and how you will help the student...'
              }
              className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B9F48] focus:border-transparent transition"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-4 bg-[#5B9F48] hover:bg-[#4d863d] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={15} />
                  <span>{isAr ? 'إرسال العرض' : 'Submit'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

