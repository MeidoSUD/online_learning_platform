import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Award, Search, Loader2, Plus, CheckCircle, Eye, Trash2, BookOpen, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Pagination } from '../ui/Pagination';
import { adminService } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';

interface Certificate {
  id: number;
  certificate_number: string;
  student_name: string;
  course_name: string;
  course_id: number | null;
  booking_id: number | null;
  completion_date: string;
  issued_at: string;
  notes: string | null;
  student?: { id: number; first_name: string; last_name: string; notional_id: string | null; email: string };
  course?: { id: number; name: string };
  booking?: { id: number; booking_reference: string; teacher_id: number; sessions_count: number; sessions_completed: number };
  issuer?: { id: number; first_name: string; last_name: string };
}

interface EligibleStudent {
  booking_id: number;
  user_id: number;
  student_id: number;
  first_name: string;
  last_name: string;
  notional_id: string | null;
  course_id: number | null;
  course_name: string;
  teacher_name: string;
  type: 'course' | 'private';
  sessions_done: number;
  total_sessions: number;
}

export const CertificatesTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [activeView, setActiveView] = useState<'issued' | 'eligible'>('issued');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [eligible, setEligible] = useState<EligibleStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'course' | 'private'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedEligible, setSelectedEligible] = useState<EligibleStudent | null>(null);
  const [issueNotes, setIssueNotes] = useState('');
  const [issueLoading, setIssueLoading] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (activeView === 'issued') fetchCertificates();
    else fetchEligible();
  }, [activeView, typeFilter]);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCertificates({ search: searchTerm || undefined, type: typeFilter !== 'all' ? typeFilter : undefined });
      setCertificates(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      showToast(t.error || 'Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEligible = async () => {
    setLoading(true);
    try {
      const data = await adminService.getEligibleStudents();
      setEligible(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      showToast(t.error || 'Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!selectedEligible) return;
    setIssueLoading(true);
    try {
      await adminService.issueCertificate({
        student_id: selectedEligible.student_id,
        course_id: selectedEligible.course_id,
        booking_id: selectedEligible.booking_id,
        notes: issueNotes || undefined,
      });
      showToast(language === 'ar' ? 'تم إصدار الشهادة بنجاح' : 'Certificate issued successfully', 'success');
      setShowIssueModal(false);
      setSelectedEligible(null);
      setIssueNotes('');
      fetchEligible();
    } catch (e: any) {
      showToast(e.message || 'Failed to issue certificate', 'error');
    } finally {
      setIssueLoading(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من إلغاء هذه الشهادة؟' : 'Are you sure you want to revoke this certificate?')) return;
    try {
      await adminService.revokeCertificate(id);
      showToast(language === 'ar' ? 'تم إلغاء الشهادة' : 'Certificate revoked', 'success');
      fetchCertificates();
    } catch (e: any) {
      showToast(e.message || 'Failed to revoke', 'error');
    }
  };

  const handleViewDetail = async (cert: Certificate) => {
    setSelectedCert(cert);
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const data = await adminService.getCertificateDetails(cert.id);
      setSelectedCert(data);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredEligible = typeFilter === 'all'
    ? eligible
    : eligible.filter(e => e.type === typeFilter);

  const paged = (activeView === 'issued' ? certificates : []).slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const pagedEligible = filteredEligible.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = activeView === 'issued'
    ? Math.ceil(certificates.length / ITEMS_PER_PAGE)
    : Math.ceil(filteredEligible.length / ITEMS_PER_PAGE);

  const TypeBadge = ({ type }: { type: 'course' | 'private' }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${type === 'course' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
      {type === 'course' ? <BookOpen size={12} /> : <User size={12} />}
      {type === 'course' ? (language === 'ar' ? 'دورة' : 'Course') : (language === 'ar' ? 'دورة خاصة' : 'Private')}
    </span>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-white">
            <Award size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{language === 'ar' ? 'الشهادات' : 'Certificates'}</h2>
            <p className="text-sm text-slate-500">{language === 'ar' ? 'إصدار وإدارة شهادات التعلم — الدورات والدروس الخاصة' : 'Issue and manage learning certificates — courses and private lessons'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveView('issued'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeView === 'issued' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {language === 'ar' ? 'الصادرة' : 'Issued'}
          </button>
          <button
            onClick={() => { setActiveView('eligible'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeView === 'eligible' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {language === 'ar' ? 'مؤهل للإصدار' : 'Eligible'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'ar' ? 'بحث بالاسم أو رقم الشهادة...' : 'Search by name or certificate number...'}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); }}
            onKeyDown={(e) => e.key === 'Enter' && fetchCertificates()}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['all', 'course', 'private'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setTypeFilter(f); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${typeFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f === 'all' ? (language === 'ar' ? 'الكل' : 'All') : f === 'course' ? (language === 'ar' ? 'الدورات' : 'Courses') : (language === 'ar' ? 'الدروس الخاصة' : 'Private')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary h-8 w-8" />
        </div>
      ) : activeView === 'issued' ? (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-start font-semibold text-slate-600">{language === 'ar' ? 'رقم الشهادة' : 'Certificate No.'}</th>
                    <th className="px-4 py-3 text-start font-semibold text-slate-600">{language === 'ar' ? 'الطالب' : 'Student'}</th>
                    <th className="px-4 py-3 text-start font-semibold text-slate-600">{language === 'ar' ? 'النوع' : 'Type'}</th>
                    <th className="px-4 py-3 text-start font-semibold text-slate-600">{language === 'ar' ? 'الخدمة' : 'Service'}</th>
                    <th className="px-4 py-3 text-start font-semibold text-slate-600">{language === 'ar' ? 'تاريخ الإصدار' : 'Issued At'}</th>
                    <th className="px-4 py-3 text-start font-semibold text-slate-600">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">{language === 'ar' ? 'لا توجد شهادات' : 'No certificates yet'}</td></tr>
                  ) : paged.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{cert.certificate_number}</td>
                      <td className="px-4 py-3 text-slate-900 font-medium">{cert.student_name}</td>
                      <td className="px-4 py-3"><TypeBadge type={cert.course_id ? 'course' : 'private'} /></td>
                      <td className="px-4 py-3 text-slate-600">{cert.course_name}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(cert.issued_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleViewDetail(cert)} className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => handleRevoke(cert.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-start font-semibold text-slate-600">{language === 'ar' ? 'الطالب' : 'Student'}</th>
                    <th className="px-4 py-3 text-start font-semibold text-slate-600">{language === 'ar' ? 'الهوية' : 'National ID'}</th>
                    <th className="px-4 py-3 text-start font-semibold text-slate-600">{language === 'ar' ? 'النوع' : 'Type'}</th>
                    <th className="px-4 py-3 text-start font-semibold text-slate-600">{language === 'ar' ? 'الخدمة' : 'Service'}</th>
                    <th className="px-4 py-3 text-start font-semibold text-slate-600">{language === 'ar' ? 'الجلسات' : 'Sessions'}</th>
                    <th className="px-4 py-3 text-start font-semibold text-slate-600">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedEligible.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">{language === 'ar' ? 'لا يوجد طلاب مؤهلين' : 'No eligible students'}</td></tr>
                  ) : pagedEligible.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-900 font-medium">{s.first_name} {s.last_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.notional_id || '-'}</td>
                      <td className="px-4 py-3"><TypeBadge type={s.type} /></td>
                      <td className="px-4 py-3 text-slate-600">{s.course_name}</td>
                      <td className="px-4 py-3 text-slate-500">{s.sessions_done}/{s.total_sessions}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setSelectedEligible(s); setShowIssueModal(true); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
                        >
                          <Plus size={14} /> {language === 'ar' ? 'إصدار' : 'Issue'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}

      {/* Issue Certificate Modal */}
      <Modal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} title={language === 'ar' ? 'إصدار شهادة' : 'Issue Certificate'}>
        {selectedEligible && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p className="text-sm"><span className="font-semibold text-slate-600">{language === 'ar' ? 'الطالب' : 'Student'}:</span> {selectedEligible.first_name} {selectedEligible.last_name}</p>
              <p className="text-sm"><span className="font-semibold text-slate-600">{language === 'ar' ? 'النوع' : 'Type'}:</span> <TypeBadge type={selectedEligible.type} /></p>
              <p className="text-sm"><span className="font-semibold text-slate-600">{language === 'ar' ? 'المعلم' : 'Teacher'}:</span> {selectedEligible.teacher_name}</p>
              <p className="text-sm"><span className="font-semibold text-slate-600">{language === 'ar' ? 'الجلسات' : 'Sessions'}:</span> {selectedEligible.sessions_done}/{selectedEligible.total_sessions}</p>
              {selectedEligible.notional_id && <p className="text-sm"><span className="font-semibold text-slate-600">{language === 'ar' ? 'رقم الهوية' : 'National ID'}:</span> {selectedEligible.notional_id}</p>}
            </div>
            {selectedEligible.type === 'private' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                {language === 'ar' ? 'هذه درس خاص — لن يتم إرسال بيانات xAPI إلى NELC لأن لا توجد دورة مرتبطة.' : 'This is a private lesson — no xAPI statement will be sent to NELC as there is no linked course.'}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{language === 'ar' ? 'ملاحظات' : 'Notes'}</label>
              <textarea
                value={issueNotes}
                onChange={(e) => setIssueNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                placeholder={language === 'ar' ? 'ملاحظات اختيارية...' : 'Optional notes...'}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowIssueModal(false)}>{t.cancel || 'Cancel'}</Button>
              <Button onClick={handleIssue} isLoading={issueLoading}>
                <CheckCircle size={16} className="mr-1" /> {language === 'ar' ? 'إصدار الشهادة' : 'Issue Certificate'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Certificate Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={language === 'ar' ? 'تفاصيل الشهادة' : 'Certificate Details'}>
        {detailLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>
        ) : selectedCert && (
          <div className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
              <Award size={48} className="mx-auto text-amber-500 mb-3" />
              <p className="font-mono text-lg font-bold text-slate-900">{selectedCert.certificate_number}</p>
              <div className="mt-2"><TypeBadge type={selectedCert.course_id ? 'course' : 'private'} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase">{language === 'ar' ? 'الطالب' : 'Student'}</p>
                <p className="text-sm font-medium text-slate-900">{selectedCert.student_name}</p>
                {selectedCert.student?.notional_id && <p className="text-xs text-slate-500">{selectedCert.student.notional_id}</p>}
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase">{language === 'ar' ? 'الخدمة' : 'Service'}</p>
                <p className="text-sm font-medium text-slate-900">{selectedCert.course_name}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase">{language === 'ar' ? 'تاريخ الإكمال' : 'Completion Date'}</p>
                <p className="text-sm font-medium text-slate-900">{selectedCert.completion_date}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase">{language === 'ar' ? 'صدر بواسطة' : 'Issued By'}</p>
                <p className="text-sm font-medium text-slate-900">{selectedCert.issuer?.first_name} {selectedCert.issuer?.last_name}</p>
              </div>
            </div>
            {selectedCert.booking && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{language === 'ar' ? 'تفاصيل الحجز' : 'Booking Details'}</p>
                <p className="text-xs text-slate-600">{language === 'ar' ? 'المرجع' : 'Reference'}: {selectedCert.booking.booking_reference}</p>
                <p className="text-xs text-slate-600">{language === 'ar' ? 'الجلسات' : 'Sessions'}: {selectedCert.booking.sessions_completed}/{selectedCert.booking.sessions_count}</p>
              </div>
            )}
            {selectedCert.notes && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{language === 'ar' ? 'ملاحظات' : 'Notes'}</p>
                <p className="text-sm text-slate-600">{selectedCert.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
