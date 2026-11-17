import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Loader2, 
  ArrowRight, 
  RefreshCw, 
  Eye, 
  X,
  FileCheck,
  ExternalLink
} from 'lucide-react';
import { takafulService, getStorageUrl } from '../../Services/api';

interface TakafulTabProps {
  onBack?: () => void;
}

export const TakafulTab: React.FC<TakafulTabProps> = ({ onBack }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [myRequest, setMyRequest] = useState<any | null>(null);

  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreviewUrl, setIdPreviewUrl] = useState<string | null>(null);

  const [deathFile, setDeathFile] = useState<File | null>(null);
  const [deathPreviewUrl, setDeathPreviewUrl] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [modalFile, setModalFile] = useState<{ url: string; title: string; isPdf: boolean } | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await takafulService.getMyStatus();
      if (res && res.data) {
        setMyRequest(res.data);
      } else {
        setMyRequest(null);
      }
    } catch {
      setErrorMessage('حدث خطأ أثناء تحميل بيانات الطلب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setIdFile(selected);
      if (selected.type.startsWith('image/')) {
        const url = URL.createObjectURL(selected);
        setIdPreviewUrl(url);
      } else {
        setIdPreviewUrl(null);
      }
    }
  };

  const handleRemoveIdFile = () => {
    setIdFile(null);
    if (idPreviewUrl) {
      URL.revokeObjectURL(idPreviewUrl);
      setIdPreviewUrl(null);
    }
  };

  const handleDeathFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setDeathFile(selected);
      if (selected.type.startsWith('image/')) {
        const url = URL.createObjectURL(selected);
        setDeathPreviewUrl(url);
      } else {
        setDeathPreviewUrl(null);
      }
    }
  };

  const handleRemoveDeathFile = () => {
    setDeathFile(null);
    if (deathPreviewUrl) {
      URL.revokeObjectURL(deathPreviewUrl);
      setDeathPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const hasId = idFile || myRequest?.identity_proof_file;
    if (!hasId) {
      setErrorMessage('يرجى إرفاق إثبات الهوية (ملف أو صورة)');
      return;
    }

    const hasDeath = deathFile || myRequest?.death_certificate_file;
    if (!hasDeath) {
      setErrorMessage('يرجى إرفاق شهادة وفاة الوالد (ملف أو صورة)');
      return;
    }

    const formData = new FormData();
    if (idFile) {
      formData.append('identity_proof_file', idFile);
    }
    if (deathFile) {
      formData.append('death_certificate_file', deathFile);
    }

    setSubmitting(true);
    try {
      const res = await takafulService.submitRequest(formData);
      setSuccessMessage('تم إرسال طلبك بنجاح وسيتم مراجعته من قبل الإدارة');
      setIsEditing(false);
      handleRemoveIdFile();
      handleRemoveDeathFile();
      if (res && res.data) {
        setMyRequest(res.data);
      } else {
        await fetchStatus();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة لاحقاً');
    } finally {
      setSubmitting(false);
    }
  };

  const openViewer = (rawUrl: string, title: string) => {
    const isPdf = rawUrl.toLowerCase().endsWith('.pdf');
    setModalFile({ url: rawUrl, title, isPdf });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-500 text-sm font-medium">جاري تحميل بيانات النظام التكافلي...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">النظام التكافلي</h1>
              <p className="text-slate-500 text-sm mt-1">مبادرة لرعاية ودعم أبنائنا وبناتنا الطلاب فاقدي الوالد</p>
            </div>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl transition-all self-start sm:self-auto"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-700 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        {myRequest && !isEditing ? (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border transition-all">
              {myRequest.status === 'pending' && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-amber-50/70 border border-amber-200/70 p-5 rounded-2xl text-amber-900">
                  <div className="flex items-start gap-3">
                    <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-base">الطلب قيد المراجعة والتدقيق</h3>
                      <p className="text-xs text-amber-800/90 mt-1">
                        تم استلام مستنداتك وبانتظار تدقيقها من قبل فريق الإدارة. سيتم إشعارك فور اتخاذ القرار.
                      </p>
                    </div>
                  </div>
                  <span className="self-start md:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-amber-200/80 text-amber-900">
                    قيد المراجعة
                  </span>
                </div>
              )}

              {myRequest.status === 'accepted' && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-50/70 border border-emerald-200/70 p-5 rounded-2xl text-emerald-900">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-base">تم قبول طلبك في النظام التكافلي</h3>
                      <p className="text-xs text-emerald-800/90 mt-1">
                        تهانينا! تم التحقق من الوثائق واعتماد انضمامك إلى النظام التكافلي للاستفادة من مميزات المبادرة.
                      </p>
                    </div>
                  </div>
                  <span className="self-start md:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-emerald-200/80 text-emerald-900">
                    مقبول
                  </span>
                </div>
              )}

              {myRequest.status === 'suspended' && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-orange-50/70 border border-orange-200/70 p-5 rounded-2xl text-orange-900">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-base">الطلب معلق مؤقتاً</h3>
                      <p className="text-xs text-orange-800/90 mt-1">
                        طلبك معلق حالياً لمزيد من المراجعة والتدقيق للمستندات المرفقة.
                      </p>
                    </div>
                  </div>
                  <span className="self-start md:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-orange-200/80 text-orange-900">
                    معلق
                  </span>
                </div>
              )}

              {myRequest.status === 'rejected' && (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-red-50/80 border border-red-200 p-5 rounded-2xl text-red-900">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-base">تم رفض الطلب</h3>
                        {myRequest.rejection_reason ? (
                          <div className="mt-2 text-sm bg-white/80 p-3 rounded-xl border border-red-200/60">
                            <span className="font-semibold text-red-800">سبب الرفض: </span>
                            <span className="text-red-700">{myRequest.rejection_reason}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-red-800/90 mt-1">
                            تعذر قبول الطلب بناءً على معايير التحقق الخاصة بالنظام التكافلي.
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="self-start md:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-900">
                      مرفوض
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/95 transition-all shadow-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>تعديل المستندات وإعادة التقديم</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-2">إثبات الهوية المرفق</span>
                  {myRequest.identity_proof_url || myRequest.identity_proof_file ? (
                    <button
                      type="button"
                      onClick={() => openViewer(myRequest.identity_proof_url || getStorageUrl(myRequest.identity_proof_file), 'إثبات الهوية')}
                      className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:border-primary hover:text-primary transition-all"
                    >
                      <Eye className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                      <span>معاينة إثبات الهوية</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">غير متوفر</span>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl">
                  <span className="text-xs text-slate-400 block mb-2">شهادة وفاة الوالد المرفقة</span>
                  {myRequest.death_certificate_url || myRequest.death_certificate_file ? (
                    <button
                      type="button"
                      onClick={() => openViewer(myRequest.death_certificate_url || getStorageUrl(myRequest.death_certificate_file), 'شهادة الوفاة')}
                      className="group inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:border-primary hover:text-primary transition-all"
                    >
                      <Eye className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                      <span>معاينة شهادة الوفاة</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">غير متوفر</span>
                  )}
                </div>
              </div>

              <div className="mt-4 text-[11px] text-slate-400">
                تاريخ إرسال الطلب: {new Date(myRequest.created_at).toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {isEditing && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 text-blue-700 text-xs">
                <span>أنت الآن في وضع تعديل المستندات لإعادة إرسالها للمراجعة.</span>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="font-semibold underline hover:text-blue-900"
                >
                  إلغاء التعديل
                </button>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                إثبات الهوية (ملف أو صورة) <span className="text-red-500">*</span>
              </label>

              <div className="border-2 border-dashed border-slate-200 hover:border-primary/60 rounded-2xl p-6 text-center transition-all bg-slate-50/50">
                <input
                  type="file"
                  id="identity_proof_input"
                  accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                  onChange={handleIdFileChange}
                  className="hidden"
                />

                {!idFile && !idPreviewUrl ? (
                  <label htmlFor="identity_proof_input" className="cursor-pointer block">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 block">
                      انقر لرفع إثبات الهوية (ملف أو صورة)
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      يدعم الصور أو ملفات PDF بحجم أقصى 10 ميجابايت
                    </span>
                  </label>
                ) : (
                  <div className="space-y-3">
                    {idPreviewUrl ? (
                      <div className="relative inline-block max-w-xs rounded-xl overflow-hidden shadow-sm border border-slate-200">
                        <img src={idPreviewUrl} alt="إثبات الهوية" className="max-h-48 object-contain bg-black/5" />
                        <button
                          type="button"
                          onClick={handleRemoveIdFile}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 shadow"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3 p-3 bg-white rounded-xl border border-slate-200 max-w-md mx-auto">
                        <FileText className="w-6 h-6 text-primary" />
                        <span className="text-sm text-slate-700 truncate">{idFile?.name}</span>
                        <button
                          type="button"
                          onClick={handleRemoveIdFile}
                          className="w-6 h-6 text-slate-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div>
                      <label
                        htmlFor="identity_proof_input"
                        className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                      >
                        تغيير الملف
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                شهادة الوفاة للوالد (ملف أو صورة) <span className="text-red-500">*</span>
              </label>

              <div className="border-2 border-dashed border-slate-200 hover:border-primary/60 rounded-2xl p-6 text-center transition-all bg-slate-50/50">
                <input
                  type="file"
                  id="death_certificate_input"
                  accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                  onChange={handleDeathFileChange}
                  className="hidden"
                />

                {!deathFile && !deathPreviewUrl ? (
                  <label htmlFor="death_certificate_input" className="cursor-pointer block">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 block">
                      انقر لرفع شهادة وفاة الوالد (ملف أو صورة)
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">
                      يدعم الصور أو ملفات PDF بحجم أقصى 10 ميجابايت
                    </span>
                  </label>
                ) : (
                  <div className="space-y-3">
                    {deathPreviewUrl ? (
                      <div className="relative inline-block max-w-xs rounded-xl overflow-hidden shadow-sm border border-slate-200">
                        <img src={deathPreviewUrl} alt="شهادة الوفاة" className="max-h-48 object-contain bg-black/5" />
                        <button
                          type="button"
                          onClick={handleRemoveDeathFile}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 shadow"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3 p-3 bg-white rounded-xl border border-slate-200 max-w-md mx-auto">
                        <FileText className="w-6 h-6 text-emerald-600" />
                        <span className="text-sm text-slate-700 truncate">{deathFile?.name}</span>
                        <button
                          type="button"
                          onClick={handleRemoveDeathFile}
                          className="w-6 h-6 text-slate-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div>
                      <label
                        htmlFor="death_certificate_input"
                        className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                      >
                        تغيير الملف
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-all"
                >
                  إلغاء
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري إرسال الطلب...</span>
                  </>
                ) : (
                  <span>إرسال الطلب</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {modalFile && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setModalFile(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl p-4 shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
              <h3 className="font-bold text-sm text-slate-800">{modalFile.title}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={modalFile.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-all"
                  title="فتح في نافذة جديدة"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setModalFile(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center min-h-[300px]">
              {modalFile.isPdf ? (
                <iframe src={modalFile.url} title={modalFile.title} className="w-full h-[70vh] rounded-lg border border-slate-200" />
              ) : (
                <img src={modalFile.url} alt={modalFile.title} className="max-h-[75vh] w-auto object-contain rounded-xl" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
