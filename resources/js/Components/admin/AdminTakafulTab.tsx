import React, { useState, useEffect, useCallback } from 'react';
import { 
  HeartHandshake, 
  Search, 
  Check, 
  X, 
  PauseCircle, 
  Trash2, 
  Eye, 
  Loader2, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ExternalLink,
  User,
  Mail,
  Phone,
  FileCheck,
  FileText
} from 'lucide-react';
import { takafulService, getStorageUrl } from '../../Services/api';

export const AdminTakafulTab: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [previewFile, setPreviewFile] = useState<{ url: string; title: string; isPdf: boolean } | null>(null);

  const [rejectModalItem, setRejectModalItem] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [deleteModalItem, setDeleteModalItem] = useState<any | null>(null);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await takafulService.adminGetAll({
        status: activeFilter !== 'all' ? activeFilter : undefined,
        search: searchQuery.trim() || undefined,
        per_page: 50,
      });

      const list = res?.data?.data || res?.data || [];
      setRequests(Array.isArray(list) ? list : []);
    } catch {
      showToast('تعذر تحميل طلبات النظام التكافلي', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRequests();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadRequests]);

  const handleUpdateStatus = async (id: number, status: string, reason?: string) => {
    setActionLoadingId(id);
    try {
      await takafulService.adminUpdateStatus(id, {
        status,
        rejection_reason: reason,
      });
      showToast('تم تحديث حالة الطلب بنجاح');
      if (rejectModalItem) {
        setRejectModalItem(null);
        setRejectionReason('');
        setRejectError(null);
      }
      await loadRequests();
    } catch (err: any) {
      showToast(err?.message || 'حدث خطأ أثناء تعديل الحالة', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      setRejectError('يرجى توضيح سبب الرفض للطالب');
      return;
    }
    if (rejectModalItem) {
      handleUpdateStatus(rejectModalItem.id, 'rejected', rejectionReason.trim());
    }
  };

  const handleDeleteRequest = async () => {
    if (!deleteModalItem) return;
    setActionLoadingId(deleteModalItem.id);
    try {
      await takafulService.adminDelete(deleteModalItem.id);
      showToast('تم حذف الطلب بنجاح');
      setDeleteModalItem(null);
      await loadRequests();
    } catch (err: any) {
      showToast(err?.message || 'تعذر حذف الطلب', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openViewer = (rawUrl: string, title: string) => {
    const isPdf = rawUrl.toLowerCase().endsWith('.pdf');
    setPreviewFile({ url: rawUrl, title, isPdf });
  };

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    accepted: requests.filter((r) => r.status === 'accepted').length,
    suspended: requests.filter((r) => r.status === 'suspended').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div
          className={`fixed bottom-6 end-6 z-50 px-5 py-3 rounded-2xl shadow-lg border text-sm font-semibold flex items-center gap-3 transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-red-600 text-white border-red-500'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">إدارة النظام التكافلي</h1>
            <p className="text-xs text-slate-500 mt-0.5">مراجعة وإدارة طلبات الطلاب للأيتام وفاقدي الوالد</p>
          </div>
        </div>

        <button
          onClick={loadRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold self-start sm:self-auto transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveFilter('pending')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeFilter === 'pending' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white border-slate-100 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${activeFilter === 'pending' ? 'text-amber-100' : 'text-slate-500'}`}>قيد المراجعة</span>
            <Clock className={`w-5 h-5 ${activeFilter === 'pending' ? 'text-white' : 'text-amber-500'}`} />
          </div>
          <span className="text-2xl font-black block mt-2">{counts.pending}</span>
        </div>

        <div 
          onClick={() => setActiveFilter('accepted')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeFilter === 'accepted' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white border-slate-100 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${activeFilter === 'accepted' ? 'text-emerald-100' : 'text-slate-500'}`}>المقبولة</span>
            <CheckCircle className={`w-5 h-5 ${activeFilter === 'accepted' ? 'text-white' : 'text-emerald-600'}`} />
          </div>
          <span className="text-2xl font-black block mt-2">{counts.accepted}</span>
        </div>

        <div 
          onClick={() => setActiveFilter('suspended')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeFilter === 'suspended' ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white border-slate-100 hover:border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${activeFilter === 'suspended' ? 'text-orange-100' : 'text-slate-500'}`}>المعلقة</span>
            <PauseCircle className={`w-5 h-5 ${activeFilter === 'suspended' ? 'text-white' : 'text-orange-500'}`} />
          </div>
          <span className="text-2xl font-black block mt-2">{counts.suspended}</span>
        </div>

        <div 
          onClick={() => setActiveFilter('rejected')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            activeFilter === 'rejected' ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white border-slate-100 hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${activeFilter === 'rejected' ? 'text-red-100' : 'text-slate-500'}`}>المرفوضة</span>
            <XCircle className={`w-5 h-5 ${activeFilter === 'rejected' ? 'text-white' : 'text-red-600'}`} />
          </div>
          <span className="text-2xl font-black block mt-2">{counts.rejected}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'all', label: 'الكل' },
              { key: 'pending', label: 'قيد المراجعة' },
              { key: 'accepted', label: 'مقبول' },
              { key: 'suspended', label: 'معلق' },
              { key: 'rejected', label: 'مرفوض' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  activeFilter === tab.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم الطالب أو البريد أو الهاتف..."
              className="w-full ps-9 pe-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-slate-400 font-medium">جاري جلب الطلبات...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center">
            <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">لا توجد طلبات</h3>
            <p className="text-xs text-slate-400 mt-1">لم يتم العثور على أي طلبات مطابقة للمعايير المحددة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4 text-start">الطالب (الحساب)</th>
                  <th className="py-3 px-4 text-start">إثبات الهوية</th>
                  <th className="py-3 px-4 text-start">شهادة وفاة الوالد</th>
                  <th className="py-3 px-4 text-start">تاريخ الإرسال</th>
                  <th className="py-3 px-4 text-start">الحالة</th>
                  <th className="py-3 px-4 text-end">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((item) => {
                  const student = item.user;
                  const idDocUrl = item.identity_proof_url || getStorageUrl(item.identity_proof_file);
                  const deathDocUrl = item.death_certificate_url || getStorageUrl(item.death_certificate_file);
                  const isActionLoading = actionLoadingId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {student?.first_name ? student.first_name.charAt(0) : <User className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {student?.first_name} {student?.last_name}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              {(student?.phone_number || student?.phone) && (
                                <span className="flex items-center gap-0.5">
                                  <Phone className="w-2.5 h-2.5" />
                                  <span dir="ltr">{student.phone_number || student.phone}</span>
                                </span>
                              )}
                              {student?.email && (
                                <span className="flex items-center gap-0.5">
                                  <Mail className="w-2.5 h-2.5" />
                                  <span>{student.email}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {idDocUrl ? (
                          <button
                            type="button"
                            onClick={() => openViewer(idDocUrl, 'إثبات الهوية')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-primary hover:text-primary bg-white text-[11px] font-medium transition-all group shadow-2xs"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary" />
                            <span>معاينة الهوية</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">غير متوفر</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {deathDocUrl ? (
                          <button
                            type="button"
                            onClick={() => openViewer(deathDocUrl, 'شهادة الوفاة')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-primary hover:text-primary bg-white text-[11px] font-medium transition-all group shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary" />
                            <span>معاينة الشهادة</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">غير متوفر</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          {item.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" />
                              <span>قيد المراجعة</span>
                            </span>
                          )}
                          {item.status === 'accepted' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle className="w-3 h-3" />
                              <span>مقبول</span>
                            </span>
                          )}
                          {item.status === 'suspended' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                              <PauseCircle className="w-3 h-3" />
                              <span>معلق</span>
                            </span>
                          )}
                          {item.status === 'rejected' && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                                <XCircle className="w-3 h-3" />
                                <span>مرفوض</span>
                              </span>
                              {item.rejection_reason && (
                                <p className="text-[10px] text-red-600 mt-1 max-w-xs truncate" title={item.rejection_reason}>
                                  السبب: {item.rejection_reason}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status !== 'accepted' && (
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleUpdateStatus(item.id, 'accepted')}
                              title="قبول الطلب"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {item.status !== 'suspended' && (
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleUpdateStatus(item.id, 'suspended')}
                              title="تعليق الطلب"
                              className="p-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-all disabled:opacity-50"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          )}

                          {item.status !== 'rejected' && (
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => {
                                setRejectModalItem(item);
                                setRejectionReason(item.rejection_reason || '');
                                setRejectError(null);
                              }}
                              title="رفض الطلب"
                              className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-all disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => setDeleteModalItem(item)}
                            title="حذف الطلب"
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-transparent transition-all disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {previewFile && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl p-4 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
              <h3 className="font-bold text-sm text-slate-800">{previewFile.title}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all"
                  title="فتح في تبويب جديد"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center min-h-[300px]">
              {previewFile.isPdf ? (
                <iframe src={previewFile.url} title={previewFile.title} className="w-full h-[70vh] rounded-lg border border-slate-200" />
              ) : (
                <img src={previewFile.url} alt={previewFile.title} className="max-h-[75vh] w-auto object-contain rounded-xl" />
              )}
            </div>
          </div>
        </div>
      )}

      {rejectModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">رفض طلب النظام التكافلي</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  طلب الطالب: {rejectModalItem.user?.first_name} {rejectModalItem.user?.last_name}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                سبب الرفض <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (rejectError) setRejectError(null);
                }}
                rows={3}
                placeholder="وضح سبب رفض الطلب ليظهر للطالب (مثال: الوثائق غير واضحة، شهادة الوفاة غير مطابقة)..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none transition-all"
              />
              {rejectError && <p className="text-[11px] text-red-600 mt-1">{rejectError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectModalItem(null);
                  setRejectionReason('');
                  setRejectError(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={actionLoadingId === rejectModalItem.id}
                onClick={handleConfirmReject}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {actionLoadingId === rejectModalItem.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>تأكيد الرفض</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">حذف طلب التكافل نهائياً؟</h3>
              <p className="text-xs text-slate-500 mt-1">
                سيتم حذف طلب الطالب <span className="font-bold text-slate-700">{deleteModalItem.user?.first_name} {deleteModalItem.user?.last_name}</span> ومستنداته بالكامل ولا يمكن التراجع.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={actionLoadingId === deleteModalItem.id}
                onClick={handleDeleteRequest}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {actionLoadingId === deleteModalItem.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>نعم، حذف الطلب</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
