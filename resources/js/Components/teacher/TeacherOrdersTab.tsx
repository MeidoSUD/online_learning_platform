import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  FileText,
  Search,
  Send,
  Clock,
  DollarSign,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  X,
  Filter
} from 'lucide-react';
import { Button } from '../ui/Button';
import { teacherService } from '../../Services/api';

export const TeacherOrdersTab: React.FC = () => {
  const { t, language, direction } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'browse' | 'my-applications'>('browse');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const [bidPrice, setBidPrice] = useState('');
  const [bidNotes, setBidNotes] = useState('');
  const [bidSessions, setBidSessions] = useState('1');
  const [bidding, setBidding] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'browse') {
        const res = await teacherService.browseOrders();
        setOrders(Array.isArray(res) ? res : []);
      } else {
        const res = await teacherService.getMyApplications();
        setMyApplications(Array.isArray(res) ? res : (res?.data || []));
      }
    } catch {
      setOrders([]);
      setMyApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBidModal = (order: any) => {
    setSelectedOrder(order);
    setBidPrice(order.proposed_budget ? String(order.proposed_budget) : '');
    setBidNotes('');
    setBidSessions('1');
    setBidError(null);
    setBidSuccess(false);
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !bidPrice) return;
    setBidding(true);
    setBidError(null);
    try {
      await teacherService.applyToOrder(selectedOrder.id, {
        proposal_price: Number(bidPrice),
        proposal_notes: bidNotes,
        estimated_sessions: Number(bidSessions) || 1,
      });
      setBidSuccess(true);
      setTimeout(() => {
        setSelectedOrder(null);
        loadData();
      }, 1500);
    } catch (err: any) {
      setBidError(err.message || (language === 'ar' ? 'فشل تقديم العرض' : 'Failed to submit proposal'));
    } finally {
      setBidding(false);
    }
  };

  const handleCancelApplication = async (appId: number) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من سحب هذا العرض؟' : 'Withdraw this bid?')) return;
    try {
      await teacherService.cancelApplication(appId);
      setMyApplications(prev => prev.filter(a => a.id !== appId));
    } catch {}
  };

  const filteredOrders = orders.filter(o => {
    const text = `${o.subject_name || ''} ${o.description || ''} ${o.grade_level || ''}`.toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)]">
              {language === 'ar' ? 'طلبات الطلاب وعروض التدريس' : 'Student Requests & Bidding'}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              {language === 'ar' ? 'تصفح طلبات الطلاب الخاصة في تخصصك وقدم عروضك التعليمية' : 'Browse custom tutoring requests and send your proposals'}
            </p>
          </div>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('browse')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'browse' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? 'الطلبات المتاحة' : 'Available Requests'}
          </button>
          <button
            onClick={() => setActiveSubTab('my-applications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'my-applications' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ar' ? 'عروضي المقدمة' : 'My Proposals'}
          </button>
        </div>
      </div>

      {activeSubTab === 'browse' && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'ابحث في المادة أو الصف الدراسي...' : 'Search by subject or grade...'}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
          />
          <Search size={18} className={`absolute top-3.5 ${direction === 'rtl' ? 'left-3' : 'right-3'} text-slate-400`} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center min-h-[350px]">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : activeSubTab === 'browse' ? (
        filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <FileText size={32} />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">
              {language === 'ar' ? 'لا توجد طلبات جديدة حالياً' : 'No Tutoring Requests Found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {language === 'ar' ? 'سيتم إشعارك فور قيام أحد الطلاب بنشر طلب تدريس في مجالك.' : 'You will be notified once students post requests matching your subjects.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                      {order.subject_name || order.subject?.name || (language === 'ar' ? 'طلب مخصص' : 'Custom Request')}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {new Date(order.created_at || Date.now()).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 font-medium mb-4 line-clamp-3">
                    {order.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl mb-3 text-slate-600">
                    <div>
                      <span className="text-[11px] text-slate-400 block">{language === 'ar' ? 'المرحلة الدراسية' : 'Grade'}</span>
                      <span className="font-semibold">{order.grade_level || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">{language === 'ar' ? 'ميزانية الطالب المقترحة' : 'Student Budget'}</span>
                      <span className="font-bold text-emerald-700">
                        {order.proposed_budget ? `${Number(order.proposed_budget).toFixed(0)} ${t.sar}` : (language === 'ar' ? 'حسب العرض' : 'Open')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {order.preferred_time || (language === 'ar' ? 'أوقات مرنة' : 'Flexible time')}
                  </span>
                  <Button
                    onClick={() => handleOpenBidModal(order)}
                    className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white h-9 px-4"
                  >
                    <Send size={13} className="mr-1.5 inline" />
                    {language === 'ar' ? 'تقديم عرض سعر' : 'Send Proposal'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        myApplications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Send size={32} />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">
              {language === 'ar' ? 'لم تقدم أي عروض بعد' : 'No Proposals Sent Yet'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {language === 'ar' ? 'استعرض الطلبات المتاحة وقدم عروضك للطلاب.' : 'Browse available requests and submit your proposals.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myApplications.map((app) => (
              <div
                key={app.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                      {app.order?.subject_name || (language === 'ar' ? 'طلب درس' : 'Order')}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      app.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {app.status === 'accepted' ? (language === 'ar' ? 'تم القبول' : 'Accepted') : (language === 'ar' ? 'قيد المراجعة' : 'Pending')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{app.proposal_notes || app.cover_letter}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <div className="text-end">
                    <span className="text-base font-extrabold text-blue-700 block">
                      {Number(app.proposed_price || app.price || 0).toFixed(0)} {t.sar}
                    </span>
                    <span className="text-[10px] text-slate-400">{language === 'ar' ? 'سعرك المعروض' : 'Your Bid'}</span>
                  </div>
                  {app.status !== 'accepted' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelApplication(app.id)}
                      className="rounded-xl text-xs text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 size={13} className="mr-1 inline" />
                      {language === 'ar' ? 'سحب العرض' : 'Withdraw'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base">
                {language === 'ar' ? 'تقديم عرض تدريس' : 'Submit Tutoring Proposal'}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitBid} className="p-6 space-y-4">
              <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100 text-xs text-blue-900 space-y-1">
                <p className="font-bold">{selectedOrder.subject_name}</p>
                <p className="text-slate-600 line-clamp-2">{selectedOrder.description}</p>
              </div>

              {bidSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs text-center space-y-2">
                  <CheckCircle size={24} className="text-emerald-600 mx-auto" />
                  <p className="font-bold text-sm">{language === 'ar' ? 'تم إرسال عرضك بنجاح!' : 'Proposal sent successfully!'}</p>
                </div>
              ) : (
                <>
                  {bidError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                      <AlertCircle size={15} />
                      <span>{bidError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        {language === 'ar' ? 'سعر العرض (ريال) *' : 'Offer Price (SAR) *'}
                      </label>
                      <input
                        type="number"
                        required
                        value={bidPrice}
                        onChange={(e) => setBidPrice(e.target.value)}
                        placeholder="100"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">
                        {language === 'ar' ? 'عدد الحصص المقترحة' : 'Estimated Sessions'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={bidSessions}
                        onChange={(e) => setBidSessions(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      {language === 'ar' ? 'رسالتك للطالب وخطة التدريس' : 'Your Pitch & Plan'}
                    </label>
                    <textarea
                      rows={3}
                      value={bidNotes}
                      onChange={(e) => setBidNotes(e.target.value)}
                      placeholder={language === 'ar' ? 'وضح خبرتك في هذه المادة وكيف ستساعد الطالب...' : 'Explain your methodology...'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>

                  <div className="pt-3 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedOrder(null)}
                      className="flex-1 rounded-xl text-xs"
                    >
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button
                      type="submit"
                      disabled={bidding}
                      className="flex-1 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {bidding ? <Loader2 className="animate-spin h-4 w-4" /> : (language === 'ar' ? 'إرسال العرض' : 'Send Bid')}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

