import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { 
  Search, 
  Filter, 
  BookOpen, 
  User, 
  Calendar, 
  Clock, 
  DollarSign, 
  Send, 
  Loader2, 
  AlertCircle, 
  X, 
  FileText, 
  CheckCircle2, 
  Clock3, 
  Inbox,
  Trash2
} from 'lucide-react';
import { teacherService, UserData } from '../../Services/api';
import { SubmitProposalModal } from './SubmitProposalModal';

interface TeacherOrdersTabProps {
  user?: UserData;
}

export const TeacherOrdersTab: React.FC<TeacherOrdersTabProps> = ({ user }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [orders, setOrders] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'available' | 'applied'>('available');

  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<any | null>(null);
  const [selectedOrderForProposal, setSelectedOrderForProposal] = useState<any | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [browseRes, applicationsRes] = await Promise.all([
        teacherService.getTeacherOrders().catch(() => []),
        teacherService.getMyApplications().catch(() => []),
      ]);

      const browseList = Array.isArray(browseRes) ? browseRes : (browseRes?.data || []);
      const appList = Array.isArray(applicationsRes) ? applicationsRes : (applicationsRes?.data || []);

      setOrders(browseList);
      setMyApplications(appList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelApplication = async (applicationId: number) => {
    if (!confirm(isAr ? 'هل أنت متأكد من رغبتك في إلغاء هذا العرض؟' : 'Are you sure you want to cancel this proposal?')) {
      return;
    }

    setCancellingId(applicationId);
    try {
      await teacherService.cancelApplication(applicationId);
      setActionSuccessMessage(isAr ? 'تم إلغاء العرض بنجاح' : 'Proposal cancelled successfully');
      await loadData();
      setTimeout(() => setActionSuccessMessage(null), 3500);
    } catch (e: any) {
      alert(e?.message || (isAr ? 'فشل إلغاء العرض' : 'Failed to cancel proposal'));
    } finally {
      setCancellingId(null);
    }
  };

  const appliedOrderIds = new Set(myApplications.map((app) => app.order_id));

  const filteredOrders = orders.filter((order) => {
    const subjectName = String(order.subject?.name_ar || order.subject?.name_en || order.subject?.title || '').toLowerCase();
    const studentName = String(order.student ? `${order.student.first_name} ${order.student.last_name}` : '').toLowerCase();
    const notes = String(order.notes || '').toLowerCase();
    const q = searchQuery.toLowerCase();

    return subjectName.includes(q) || studentName.includes(q) || notes.includes(q);
  });

  const filteredApplications = myApplications.filter((app) => {
    const order = app.order || {};
    const subjectName = String(order.subject?.name_ar || order.subject?.name_en || order.subject?.title || '').toLowerCase();
    const studentName = String(order.student ? `${order.student.first_name} ${order.student.last_name}` : '').toLowerCase();
    const q = searchQuery.toLowerCase();

    return subjectName.includes(q) || studentName.includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0D4A5F]">
            {isAr ? 'طلبات الطلاب الخاصة' : 'Student Private Requests'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'تصفح طلبات الطلاب المطابقة لتخصصك وقدم عروض أسعار تنافسية'
              : 'Browse matching student requests and submit competitive proposals'}
          </p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setSelectedTab('available')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedTab === 'available'
                ? 'bg-white text-[#5B9F48] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isAr ? 'الطلبات المتاحة' : 'Available Requests'}
            <span className="ms-2 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
              {orders.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('applied')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedTab === 'applied'
                ? 'bg-white text-[#5B9F48] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isAr ? 'عروضي المقدمة' : 'My Proposals'}
            <span className="ms-2 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
              {myApplications.length}
            </span>
          </button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-[#00BB29] rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            isAr
              ? 'البحث باسم الطالب أو المادة أو التفاصيل...'
              : 'Search by student name, subject, or details...'
          }
          className="w-full ps-10 pe-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B9F48] focus:border-transparent transition shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="animate-spin text-[#5B9F48] h-10 w-10" />
        </div>
      ) : selectedTab === 'available' ? (
        filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Inbox size={32} />
            </div>
            <h3 className="text-base font-bold text-[#0D4A5F]">
              {isAr ? 'لا توجد طلبات متاحة حالياً' : 'No available requests found'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery
                ? (isAr ? 'لم نجد أي طلب يطابق معايير البحث' : 'No requests matched your search criteria')
                : (isAr ? 'سيتم إشعارك فور طرح طلبات جديدة تطابق تخصصك' : 'You will be notified when new requests are posted')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOrders.map((order) => {
              const subjectName = isAr
                ? order.subject?.name_ar || order.subject?.name_en || order.subject?.title
                : order.subject?.name_en || order.subject?.name_ar || order.subject?.title;

              const studentName = order.student
                ? `${order.student.first_name || ''} ${order.student.last_name || ''}`.trim()
                : (isAr ? 'طالب' : 'Student');

              const isApplied = appliedOrderIds.has(order.id);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#5B9F48] flex items-center justify-center">
                          <User size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{studentName}</h4>
                          <span className="text-[11px] text-slate-400">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : ''}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          isApplied
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-emerald-50 text-[#5B9F48] border border-emerald-200'
                        }`}
                      >
                        {isApplied ? (isAr ? 'تم تقديم عرض' : 'Applied') : (isAr ? 'متاح للتقديم' : 'Open')}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl mb-3 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0D4A5F] mb-1">
                        <BookOpen size={14} className="text-[#5B9F48]" />
                        <span>{subjectName}</span>
                      </div>
                      {order.notes && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {order.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center py-2 border-t border-slate-100 text-xs mb-3">
                      <span className="text-slate-500">{isAr ? 'الميزانية:' : 'Budget:'}</span>
                      <span className="font-bold text-[#5B9F48]">
                        {order.min_price || 0} - {order.max_price || 0} {isAr ? 'ر.س' : 'SAR'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForDetails(order)}
                        className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                      >
                        {isAr ? 'التفاصيل' : 'Details'}
                      </button>

                      {!isApplied ? (
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForProposal(order)}
                          className="flex-1 py-2.5 px-3 bg-[#5B9F48] hover:bg-[#4d863d] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Send size={13} />
                          <span>{isAr ? 'تقديم عرض' : 'Apply'}</span>
                        </button>
                      ) : (
                        <span className="flex-1 py-2.5 px-3 bg-slate-50 text-slate-400 rounded-xl text-xs font-bold text-center border border-slate-200/60">
                          {isAr ? 'قيد المراجعة' : 'Pending'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        filteredApplications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Inbox size={32} />
            </div>
            <h3 className="text-base font-bold text-[#0D4A5F]">
              {isAr ? 'لم تقدم أي عروض بعد' : 'No proposals submitted yet'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isAr
                ? 'تصفح الطلبات المتاحة وقدم عروض أسعار لبدء التواصل مع الطلاب'
                : 'Browse available requests and submit proposals to start working'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredApplications.map((app) => {
              const order = app.order || {};
              const subjectName = isAr
                ? order.subject?.name_ar || order.subject?.name_en || order.subject?.title
                : order.subject?.name_en || order.subject?.name_ar || order.subject?.title;

              const studentName = order.student
                ? `${order.student.first_name || ''} ${order.student.last_name || ''}`.trim()
                : (isAr ? 'طالب' : 'Student');

              const isPending = app.status === 'pending';
              const isAccepted = app.status === 'accepted';
              const isRejected = app.status === 'rejected';

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                          <User size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">{studentName}</h4>
                          <span className="text-[11px] text-slate-400">
                            {app.created_at ? new Date(app.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US') : ''}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          isAccepted
                            ? 'bg-emerald-50 text-[#00BB29] border border-emerald-200'
                            : isRejected
                            ? 'bg-red-50 text-[#E43700] border border-red-200'
                            : 'bg-amber-50 text-[#F49E00] border border-amber-200'
                        }`}
                      >
                        {isAccepted
                          ? (isAr ? 'مقبول' : 'Accepted')
                          : isRejected
                          ? (isAr ? 'مرفوض' : 'Rejected')
                          : (isAr ? 'قيد المراجعة' : 'Pending')}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl mb-3 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#0D4A5F] mb-1">
                        <BookOpen size={14} className="text-[#5B9F48]" />
                        <span>{subjectName}</span>
                      </div>
                      {app.message && (
                        <p className="text-xs text-slate-600 bg-white p-2 rounded-xl border border-slate-200/50 mt-1">
                          {app.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center py-2 border-t border-slate-100 text-xs mb-3">
                      <span className="text-slate-500">{isAr ? 'سعرك المعروض:' : 'Your Proposed Price:'}</span>
                      <span className="font-bold text-[#5B9F48]">
                        {app.proposed_price || 0} {isAr ? 'ر.س' : 'SAR'}
                      </span>
                    </div>

                    {isPending && (
                      <button
                        type="button"
                        onClick={() => handleCancelApplication(app.id)}
                        disabled={cancellingId === app.id}
                        className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        {cancellingId === app.id ? (
                          <span className="inline-block w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Trash2 size={13} />
                            <span>{isAr ? 'إلغاء العرض' : 'Cancel Proposal'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {selectedOrderForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedOrderForDetails(null)}
              className="absolute top-5 left-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#0D4A5F] flex items-center justify-center font-bold">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0D4A5F]">
                  {isAr ? 'تفاصيل طلب التدريس' : 'Request Details'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr ? `الطلب #${selectedOrderForDetails.id}` : `Order #${selectedOrderForDetails.id}`}
                </p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">{isAr ? 'اسم الطالب:' : 'Student:'}</span>
                <span className="font-bold text-slate-800">
                  {selectedOrderForDetails.student
                    ? `${selectedOrderForDetails.student.first_name || ''} ${selectedOrderForDetails.student.last_name || ''}`.trim()
                    : (isAr ? 'طالب' : 'Student')}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">{isAr ? 'المادة:' : 'Subject:'}</span>
                <span className="font-bold text-[#0D4A5F]">
                  {isAr
                    ? selectedOrderForDetails.subject?.name_ar || selectedOrderForDetails.subject?.name_en || selectedOrderForDetails.subject?.title
                    : selectedOrderForDetails.subject?.name_en || selectedOrderForDetails.subject?.name_ar || selectedOrderForDetails.subject?.title}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">{isAr ? 'نوع الدرس:' : 'Lesson Type:'}</span>
                <span className="font-bold text-slate-800">
                  {selectedOrderForDetails.type === 'single'
                    ? (isAr ? 'درس فردي (أونلاين)' : 'Individual (Online)')
                    : (isAr ? 'درس جماعي' : 'Group')}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">{isAr ? 'الميزانية المتاحة:' : 'Budget:'}</span>
                <span className="font-bold text-[#5B9F48]">
                  {selectedOrderForDetails.min_price || 0} - {selectedOrderForDetails.max_price || 0} {isAr ? 'ر.س' : 'SAR'}
                </span>
              </div>

              {selectedOrderForDetails.notes && (
                <div className="pt-2">
                  <span className="block text-slate-500 mb-1.5">{isAr ? 'ملاحظات وتفاصيل إضافية:' : 'Additional Notes:'}</span>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed">
                    {selectedOrderForDetails.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedOrderForDetails(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>

              {!appliedOrderIds.has(selectedOrderForDetails.id) && (
                <button
                  type="button"
                  onClick={() => {
                    const o = selectedOrderForDetails;
                    setSelectedOrderForDetails(null);
                    setSelectedOrderForProposal(o);
                  }}
                  className="flex-1 py-3 px-4 bg-[#5B9F48] hover:bg-[#4d863d] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Send size={15} />
                  <span>{isAr ? 'تقديم عرض' : 'Apply'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedOrderForProposal && (
        <SubmitProposalModal
          order={selectedOrderForProposal}
          isOpen={Boolean(selectedOrderForProposal)}
          onClose={() => setSelectedOrderForProposal(null)}
          onSuccess={() => {
            setActionSuccessMessage(isAr ? 'تم إرسال عرضك بنجاح' : 'Proposal submitted successfully');
            loadData();
            setTimeout(() => setActionSuccessMessage(null), 3500);
          }}
        />
      )}
    </div>
  );
};

