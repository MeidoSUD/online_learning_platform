import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { 
  AlertCircle, 
  Plus, 
  Gavel, 
  CheckCircle2, 
  Clock, 
  X, 
  Loader2, 
  ChevronRight, 
  MessageSquare,
  User,
  Video
} from 'lucide-react';
import { Button } from '../ui/Button';
import { studentService } from '../../Services/api';

export const DisputesTab: React.FC = () => {
  const { language } = useLanguage();

  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [selectedSessionId, setSelectedSessionId] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.getComplaints();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setComplaints(list);
    } catch (err: any) {
      setError(err.message || 'Error loading complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    setSubmitError(null);
    setSelectedSessionId('');
    setReason('');
    setSessionsLoading(true);
    try {
      const sess = await studentService.getSessions();
      setSessions(Array.isArray(sess) ? sess : []);
    } catch (err: any) {
      setSubmitError(err.message || 'Error fetching sessions');
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) {
      setSubmitError(language === 'ar' ? 'يرجى اختيار الجلسة المراد تقديم شكوى عليها' : 'Please select a session');
      return;
    }
    if (!reason.trim()) {
      setSubmitError(language === 'ar' ? 'يرجى كتابة سبب الشكوى والتفاصيل' : 'Please write complaint reason');
      return;
    }

    const sessionObj = sessions.find(s => s.id === Number(selectedSessionId));
    const teacherId = sessionObj?.teacher_id || sessionObj?.teacher?.id;

    if (!teacherId) {
      setSubmitError(language === 'ar' ? 'معرف المعلم غير متوفر لهذه الجلسة' : 'Teacher ID not found for this session');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await studentService.submitComplaint({
        session_id: Number(selectedSessionId),
        teacher_id: Number(teacherId),
        reason: reason.trim(),
      });
      alert(language === 'ar' ? 'تم تقديم الشكوى بنجاح وسيتم مراجعتها من قبل الإدارة' : 'Complaint submitted successfully');
      setIsModalOpen(false);
      fetchComplaints();
    } catch (err: any) {
      setSubmitError(err.message || (language === 'ar' ? 'فشل إرسال الشكوى' : 'Failed to submit complaint'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || 'under_review').toLowerCase();
    if (s === 'resolved' || s === 'closed') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
          <CheckCircle2 size={12} />
          {language === 'ar' ? 'تمت المعالجة' : 'Resolved'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock size={12} />
        {language === 'ar' ? 'قيد المراجعة' : 'Under Review'}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[var(--text-main)]">
            {language === 'ar' ? 'الشكاوى والنزاعات الرسمية' : 'Complaints & Disputes'}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {language === 'ar'
              ? 'متابعة الشكاوى المرفوعة على الجلسات وقرارات الإدارة لحفظ حقوقك'
              : 'Track submitted session complaints and administrative resolutions'}
          </p>
        </div>

        <Button
          onClick={handleOpenModal}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 shadow-sm bg-red-600 hover:bg-red-700 text-white font-bold self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>{language === 'ar' ? 'تقديم شكوى جديدة' : 'New Complaint'}</span>
        </Button>
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
      ) : complaints.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-[var(--border)] p-8">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-primary-pale text-primary flex items-center justify-center mb-4">
            <Gavel size={32} />
          </div>
          <h3 className="font-bold text-lg text-[var(--text-main)] mb-1">
            {language === 'ar' ? 'لا توجد شكاوى سابقة' : 'No previous complaints'}
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mb-6">
            {language === 'ar'
              ? 'في حال واجهتك أي مشكلة أثناء الدرس أو مع المعلم، يمكنك رفع شكوى رسمية مباشرة.'
              : 'If you faced any issue during your session, you can submit an official dispute.'}
          </p>
          <Button onClick={handleOpenModal} className="rounded-xl text-xs px-5">
            {language === 'ar' ? 'تقديم شكوى الآن' : 'Submit Complaint'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => {
            const teacher = c.teacher || {};
            const teacherName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'Teacher';
            const sessionTitle = c.session?.session_title || c.session?.title || (c.session_id ? `Session #${c.session_id}` : 'General Session');

            return (
              <div
                key={c.id}
                onClick={() => setSelectedComplaint(c)}
                className="p-5 rounded-2xl border border-[var(--border)] bg-white hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Gavel size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-500">
                        #TKT-{c.id}
                      </span>
                      <span>•</span>
                      <span className="text-xs text-primary font-medium">
                        {new Date(c.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-[var(--text-main)] mt-1">
                      {sessionTitle} - {teacherName}
                    </h4>

                    <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-1">
                      {c.reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {getStatusBadge(c.status)}
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-[var(--border)] animate-fade-in my-8">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-[var(--light-bg)]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Gavel size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--text-main)]">
                    {language === 'ar' ? 'رفع شكوى على جلسة' : 'Submit Session Complaint'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {language === 'ar' ? 'سيتم تحويل الشكوى لفريق الدعم للتحقق' : 'Will be reviewed by support team'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full text-[var(--text-muted)] hover:bg-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {submitError && (
              <div className="mx-6 mt-4 p-4 rounded-xl bg-red-50 text-red-700 text-sm flex items-center gap-2 border border-red-200">
                <AlertCircle size={18} className="shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                  {language === 'ar' ? 'اختر الجلسة المعنية *' : 'Select Session *'}
                </label>
                {sessionsLoading ? (
                  <div className="p-3 text-xs text-center text-gray-500 bg-gray-50 rounded-xl">
                    <Loader2 size={16} className="animate-spin inline mr-2" />
                    {language === 'ar' ? 'جاري تحميل الجلسات...' : 'Loading sessions...'}
                  </div>
                ) : (
                  <select
                    required
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">{language === 'ar' ? 'اختر الجلسة' : 'Choose Session'}</option>
                    {sessions.map((s) => {
                      const tName = s.teacher ? `${s.teacher.first_name} ${s.teacher.last_name}` : 'Teacher';
                      const title = s.session_title || s.title || `Session #${s.id}`;
                      const date = s.session_date || s.date || '';
                      return (
                        <option key={s.id} value={s.id}>
                          {title} - {tName} {date ? `(${date})` : ''}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                  {language === 'ar' ? 'تفاصيل وسبب الشكوى *' : 'Reason and Details *'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={language === 'ar' ? 'اشرح بالتفصيل ما حدث خلال الجلسة...' : 'Describe what happened in detail...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2">
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  <span>{language === 'ar' ? 'إرسال الشكوى' : 'Submit'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedComplaint && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-[var(--border)] animate-fade-in my-8">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-[var(--light-bg)]">
              <div>
                <h3 className="font-bold text-lg text-[var(--text-main)]">
                  {language === 'ar' ? 'تفاصيل الشكوى' : 'Complaint Details'}
                </h3>
                <span className="font-mono text-xs text-primary font-bold">
                  #TKT-{selectedComplaint.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-2 rounded-full text-[var(--text-muted)] hover:bg-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  {language === 'ar' ? 'حالة الشكوى:' : 'Status:'}
                </span>
                {getStatusBadge(selectedComplaint.status)}
              </div>

              <div>
                <span className="text-xs font-bold text-[var(--text-muted)] block mb-1">
                  {language === 'ar' ? 'سبب الشكوى وملاحظات الطالب:' : 'Student Reason:'}
                </span>
                <p className="text-xs text-[var(--text-main)] bg-[var(--light-bg)] p-3 rounded-xl whitespace-pre-wrap">
                  {selectedComplaint.reason}
                </p>
              </div>

              {selectedComplaint.admin_reply || selectedComplaint.response ? (
                <div>
                  <span className="text-xs font-bold text-emerald-700 block mb-1">
                    {language === 'ar' ? 'رد وقرار الإدارة:' : 'Admin Response:'}
                  </span>
                  <p className="text-xs text-emerald-900 bg-emerald-50 p-3 rounded-xl border border-emerald-200 whitespace-pre-wrap">
                    {selectedComplaint.admin_reply || selectedComplaint.response}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
                  <Clock size={16} className="shrink-0" />
                  <span>
                    {language === 'ar'
                      ? 'الشكوى قيد المراجعة لدى فريق الدعم، وسيتم التواصل معك قريباً.'
                      : 'The complaint is currently under review by our support team.'}
                  </span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[var(--border)] bg-gray-50 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedComplaint(null)} className="text-xs h-9 px-4">
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
