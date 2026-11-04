import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { AlertCircle, Plus, Loader2, CheckCircle, Clock, ShieldCheck, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { studentService } from '../../Services/api';

export const DisputesTab: React.FC = () => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formReason, setFormReason] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSessionId, setFormSessionId] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const [disputesData, complaintsData, sessionsData] = await Promise.all([
        studentService.getMyDisputes().catch(() => []),
        studentService.getMyComplaints().catch(() => []),
        studentService.getBookings().catch(() => [])
      ]);
      const combined = [
        ...(Array.isArray(disputesData) ? disputesData : []),
        ...(Array.isArray(complaintsData) ? complaintsData : [])
      ];
      setDisputes(combined);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
    } catch {
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReason.trim() || !formDescription.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await studentService.createDispute({
        reason: formReason,
        description: formDescription,
        booking_id: formSessionId ? Number(formSessionId) : undefined,
      });
      setIsModalOpen(false);
      setFormReason('');
      setFormDescription('');
      setFormSessionId('');
      setSuccessMessage(language === 'ar' ? 'تم تقديم الشكوى بنجاح وسيتم مراجعتها من قبل الإدارة' : 'Dispute submitted successfully');
      fetchDisputes();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || (language === 'ar' ? 'تعذر إرسال الشكوى' : 'Failed to submit dispute'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-main)]">
            {language === 'ar' ? 'الشكاوى والنزاعات' : 'Complaints & Disputes'}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {language === 'ar' ? 'متابعة الشكاوى والنزاعات المقدمة على الجلسات التعليمية' : 'Track complaints and dispute tickets'}
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
        >
          <Plus size={16} className="mr-1.5 inline" />
          {language === 'ar' ? 'تقديم شكوى جديدة' : 'Open Dispute'}
        </Button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle size={18} className="text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {disputes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <ShieldCheck size={32} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">
            {language === 'ar' ? 'سجلك خالٍ من أي شكاوى أو نزاعات' : 'No Open Disputes'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {language === 'ar'
              ? 'في حال واجهتك أي مشكلة أثناء حضور الدرس أو في المستحقات، يمكنك فتح تذكرة نزاع هنا وسيقوم فريق الدعم بحلها فوراً.'
              : 'If you encounter any issues during a session, you can open a dispute ticket here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-600">
                <tr>
                  <th className="px-6 py-4">{language === 'ar' ? 'رقم الشكوى' : 'Case #'}</th>
                  <th className="px-6 py-4">{language === 'ar' ? 'السبب' : 'Reason'}</th>
                  <th className="px-6 py-4">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="px-6 py-4">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {disputes.map((item, idx) => {
                  const isResolved = item.status === 'resolved' || item.status === 'closed';
                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {item.case_number || item.ticket_number || `CASE-${item.id}`}
                      </td>
                      <td className="px-6 py-4 font-medium">{item.reason || item.title || 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(item.created_at || Date.now()).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isResolved
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isResolved ? (language === 'ar' ? 'تم الحل' : 'Resolved') : (language === 'ar' ? 'قيد المراجعة' : 'Under Review')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base">
                {language === 'ar' ? 'تقديم تذكرة شكوى أو نزاع' : 'Open Dispute Ticket'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
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
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {language === 'ar' ? 'اختر الحجز المتعلق بالشكوى' : 'Related Session'}
                  </label>
                  <select
                    value={formSessionId}
                    onChange={(e) => setFormSessionId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  >
                    <option value="">{language === 'ar' ? '-- بدون ربط بحجز محدد --' : '-- No specific booking --'}</option>
                    {sessions.map((b) => (
                      <option key={b.id} value={b.id}>
                        #{b.id} - {b.teacher?.first_name || 'Teacher'} - {b.subject?.name || 'Lesson'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {language === 'ar' ? 'سبب الشكوى *' : 'Reason *'}
                </label>
                <input
                  type="text"
                  required
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: المعلم لم يحضر، مشكلة في الصوت، إلغاء غير مبرر...' : 'e.g., Tutor was absent, technical issues'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {language === 'ar' ? 'تفاصيل المشكلة والوقائع *' : 'Details & Explanation *'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={language === 'ar' ? 'اشرح بالتفصيل ما حدث ليتسنى لفريق المراجعة التحقق...' : 'Describe what happened...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
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
                  className="flex-1 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
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
