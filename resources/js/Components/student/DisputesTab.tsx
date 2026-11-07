import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Gavel, ChevronLeft, ChevronRight, Plus, Loader2, CheckCircle, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { studentService } from '../../Services/api';

export const DisputesTab: React.FC = () => {
  const { language, direction } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formReason, setFormReason] = useState('');
  const [formSessionId, setFormSessionId] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const [complaintsData, disputesData, bookingsData] = await Promise.all([
        studentService.getMyComplaints().catch(() => []),
        studentService.getMyDisputes().catch(() => []),
        studentService.getBookings().catch(() => [])
      ]);

      const rawComplaints = Array.isArray(complaintsData) ? complaintsData : [];
      const rawDisputes = Array.isArray(disputesData) ? disputesData : [];

      const normalizedComplaints = rawComplaints.map((item: any) => ({
        id: item.id,
        rawId: item.id,
        source: 'complaint',
        ticketNumber: `#TKT-${item.id}`,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        status: item.status || 'open',
        isUnderReview: item.status !== 'resolved' && item.status !== 'closed',
        reason: item.reason || '',
        resolutionNote: item.resolution_note || '',
        session: item.session,
        sessionId: item.session_id,
        teacher: item.teacher,
        category: item.session ? (language === 'ar' ? 'الحصص والحجوزات' : 'Sessions & Bookings') : (language === 'ar' ? 'عام' : 'General'),
      }));

      const normalizedDisputes = rawDisputes.map((item: any) => ({
        id: item.id,
        rawId: item.id,
        source: 'dispute',
        ticketNumber: item.case_number || item.ticket_number || `#TKT-${item.id}`,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        status: item.status || 'open',
        isUnderReview: item.status !== 'resolved' && item.status !== 'closed',
        reason: item.reason || item.description || '',
        resolutionNote: item.resolution_note || '',
        session: item.booking,
        sessionId: item.booking_id,
        teacher: item.booking?.teacher,
        category: item.booking ? (language === 'ar' ? 'الحصص والحجوزات' : 'Sessions & Bookings') : (language === 'ar' ? 'عام' : 'General'),
      }));

      const merged = [...normalizedComplaints, ...normalizedDisputes];

      merged.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return Number(b.id || 0) - Number(a.id || 0);
      });

      setComplaints(merged);
      setSessions(Array.isArray(bookingsData) ? bookingsData : []);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReason.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const selectedSession = sessions.find((s: any) => String(s.id) === String(formSessionId));
      const teacherId = selectedSession?.teacher_id || selectedSession?.teacher?.id;

      if (formSessionId && teacherId) {
        await studentService.submitComplaint({
          session_id: Number(formSessionId),
          teacher_id: Number(teacherId),
          reason: formReason,
        });
      } else {
        await studentService.createDispute({
          reason: formReason,
          description: formReason,
          booking_id: formSessionId ? Number(formSessionId) : undefined,
          against_user_id: teacherId || 1,
        });
      }

      setIsModalOpen(false);
      setFormReason('');
      setFormSessionId('');
      setSuccessMessage(language === 'ar' ? 'تم إرسال الشكوى بنجاح' : 'Complaint submitted successfully');
      fetchComplaints();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || (language === 'ar' ? 'تعذر إرسال الشكوى' : 'Failed to submit complaint'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-[#1B3B36]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {language === 'ar' ? 'الشكاوى' : 'Complaints'}
          </h2>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl font-bold text-xs bg-[#1B3B36] hover:bg-[#152e2a] text-white shadow-sm px-4 py-2"
        >
          <Plus size={16} className={direction === 'rtl' ? 'ml-1.5' : 'mr-1.5'} />
          {language === 'ar' ? 'تقديم شكوى' : 'Submit Complaint'}
        </Button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle size={18} className="text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {complaints.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[380px]">
          <div className="w-28 h-28 relative flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-[#D3E2E6] rounded-[20px] rotate-45 transform" />
            <div className="absolute w-20 h-20 bg-[#D3E2E6]/80 rounded-[20px] flex items-center justify-center">
              <Gavel size={36} className="text-[#1B3B36]" />
            </div>
          </div>
          <h3 className="font-semibold text-lg text-[#1B3B36] mb-2">
            {language === 'ar' ? 'لا توجد شكاوى' : 'No Complaints'}
          </h3>
          <p className="text-sm text-slate-600 max-w-xs text-center leading-relaxed">
            {language === 'ar' ? 'لم تقم بتقديم أي شكوى بعد' : 'You have not submitted any complaints yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((item) => (
            <div
              key={`${item.source}-${item.id}`}
              onClick={() => setSelectedComplaint(item)}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0 text-start">
                <div className="text-base font-semibold text-slate-900">
                  {item.ticketNumber}
                </div>
                <div className="text-xs font-medium text-[#1B3B36] mt-1.5">
                  {formatDate(item.createdAt)}
                </div>
                {item.session?.session_title && (
                  <div className="text-xs text-[#667085] mt-1.5 truncate">
                    {item.session.session_title}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-medium ${
                    item.isUnderReview
                      ? 'bg-[#FFF7E6] text-[#F79009]'
                      : 'bg-[#F2F4F7] text-[#667085]'
                  }`}
                >
                  {item.isUnderReview
                    ? (language === 'ar' ? 'قيد المراجعة' : 'Under Review')
                    : (language === 'ar' ? 'منتهية' : 'Finished')}
                </span>

                {direction === 'rtl' ? (
                  <ChevronLeft size={22} className="text-slate-800" />
                ) : (
                  <ChevronRight size={22} className="text-slate-800" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedComplaint && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedComplaint(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">{selectedComplaint.ticketNumber}</h2>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <h3 className="text-base font-semibold text-slate-900 text-start">
                {language === 'ar' ? 'تفاصيل الشكوى' : 'Complaint Details'}
              </h3>

              <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-100 space-y-3.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{language === 'ar' ? 'رقم الشكوى' : 'Complaint Number'}</span>
                  <span className="font-semibold text-slate-900">{selectedComplaint.ticketNumber}</span>
                </div>

                <div className="border-t border-slate-200/60" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{language === 'ar' ? 'الحالة' : 'Status'}</span>
                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-medium ${
                      selectedComplaint.isUnderReview ? 'bg-[#FFF7E6] text-[#F79009]' : 'bg-[#F2F4F7] text-[#667085]'
                    }`}
                  >
                    {selectedComplaint.isUnderReview
                      ? (language === 'ar' ? 'قيد المراجعة' : 'Under Review')
                      : (language === 'ar' ? 'منتهية' : 'Finished')}
                  </span>
                </div>

                <div className="border-t border-slate-200/60" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{language === 'ar' ? 'التصنيف' : 'Category'}</span>
                  <span className="font-medium text-slate-900">{selectedComplaint.category}</span>
                </div>

                <div className="border-t border-slate-200/60" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{language === 'ar' ? 'تاريخ الإرسال' : 'Send Date'}</span>
                  <span className="font-medium text-slate-900">{formatDate(selectedComplaint.createdAt)}</span>
                </div>

                {selectedComplaint.session && (
                  <>
                    <div className="border-t border-slate-200/60" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{language === 'ar' ? 'تفاصيل الجلسة' : 'Session Details'}</span>
                      <span className="font-medium text-slate-900 truncate max-w-xs sm:max-w-md">
                        {selectedComplaint.session.session_title ||
                          selectedComplaint.session.subject?.name ||
                          `#${selectedComplaint.sessionId}`}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="w-full p-4 sm:p-5 rounded-2xl bg-[#EFF8FF] border border-blue-100 text-start">
                <div className="font-semibold text-sm text-slate-900">
                  {formatDate(selectedComplaint.createdAt)}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed mt-2 whitespace-pre-wrap">
                  {selectedComplaint.reason}
                </p>
              </div>

              {selectedComplaint.resolutionNote && selectedComplaint.resolutionNote.trim() !== '' && (
                <div className="w-full p-4 sm:p-5 rounded-2xl bg-[#ECFDF3] border border-emerald-200 text-start">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#027A48] font-semibold text-sm">
                      <ShieldCheck size={18} />
                      <span>{language === 'ar' ? 'رد الإدارة:' : 'Admin Reply:'}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatDate(selectedComplaint.updatedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-emerald-950 leading-relaxed mt-2 whitespace-pre-wrap">
                    {selectedComplaint.resolutionNote}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedComplaint(null)}
                className="rounded-xl text-xs px-6 py-2"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base">
                {language === 'ar' ? 'تقديم شكوى' : 'Submit Complaint'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {sessions.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 text-start">
                    {language === 'ar' ? 'الحصة المتعلقة بالشكوى' : 'Related Session'}
                  </label>
                  <select
                    value={formSessionId}
                    onChange={(e) => setFormSessionId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1B3B36]/20 focus:border-[#1B3B36]"
                  >
                    <option value="">{language === 'ar' ? '-- بدون ربط بحجز محدد --' : '-- No specific booking --'}</option>
                    {sessions.map((b) => (
                      <option key={b.id} value={b.id}>
                        #{b.id} - {b.teacher?.first_name || b.teacher?.name || 'Teacher'} - {b.subject?.name || b.session_title || 'Lesson'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 text-start">
                  {language === 'ar' ? 'وصف الشكوى *' : 'Complaint Description *'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب تفاصيل الشكوى هنا...' : 'Write complaint details here...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B36]/20 focus:border-[#1B3B36] resize-none"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl text-xs"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl text-xs font-bold bg-[#1B3B36] hover:bg-[#152e2a] text-white"
                >
                  {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : (language === 'ar' ? 'إرسال الشكوى' : 'Submit')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
