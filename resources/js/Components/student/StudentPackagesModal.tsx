import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { X, Package, Check, Sparkles, Loader2, AlertCircle, CreditCard } from 'lucide-react';
import { Button } from '../ui/Button';
import { studentService } from '../../Services/api';

interface StudentPackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StudentPackagesModal: React.FC<StudentPackagesModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { language, t } = useLanguage();

  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'wallet'>('card');

  useEffect(() => {
    if (!isOpen) return;
    const fetchPackages = async () => {
      setLoading(true);
      setError(null);
      try {
        const pkgs = await studentService.getPublicPackages();
        setPackages(Array.isArray(pkgs) ? pkgs : []);
      } catch (err: any) {
        setError(err.message || 'Error loading packages');
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, [isOpen]);

  const handlePurchase = async (pkg: any) => {
    setPurchasingId(pkg.id);
    setError(null);

    try {
      const res = await studentService.purchasePackage({
        package_id: pkg.id,
        payment_method: selectedMethod,
      });

      if (res?.redirect_url || res?.data?.redirect_url) {
        window.location.href = res.redirect_url || res.data.redirect_url;
        return;
      }

      alert(language === 'ar' ? 'تم شراء الباقة بنجاح وإضافتها لرصيدك' : 'Package purchased successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || (language === 'ar' ? 'فشل إتمام شراء الباقة' : 'Failed to purchase package'));
    } finally {
      setPurchasingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[var(--border)] animate-fade-in my-8">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-gradient-to-r from-emerald-700 via-teal-800 to-navy text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Package size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {language === 'ar' ? 'باقات الساعات التعليمية المتكاملة' : 'Educational Hours Packages'}
              </h3>
              <p className="text-xs text-white/80">
                {language === 'ar'
                  ? 'اشترك في باقات الحصص واستفد من أسعار تفضيلية وخصومات حصرية'
                  : 'Subscribe to session packages and enjoy special discounted rates'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-red-50 text-red-700 text-sm flex items-center gap-2 border border-red-200">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="p-16 flex justify-center items-center">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : packages.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)]">
              {language === 'ar' ? 'لا توجد باقات متاحة حالياً.' : 'No packages available currently.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg) => {
                const name = language === 'ar' ? (pkg.name_ar || pkg.name) : (pkg.name_en || pkg.name);
                const desc = language === 'ar' ? (pkg.description_ar || pkg.description) : (pkg.description_en || pkg.description);
                const isBuying = purchasingId === pkg.id;

                return (
                  <div
                    key={pkg.id}
                    className="relative rounded-3xl border-2 border-[var(--border)] hover:border-primary p-6 bg-white shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
                  >
                    {pkg.discount_percentage > 0 && (
                      <div className="absolute top-4 left-4 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-black border border-red-200 flex items-center gap-1">
                        <Sparkles size={12} />
                        <span>{pkg.discount_percentage}% {language === 'ar' ? 'خصم' : 'OFF'}</span>
                      </div>
                    )}

                    <div>
                      <div className="h-12 w-12 rounded-2xl bg-primary-pale text-primary flex items-center justify-center mb-4 font-black text-lg">
                        {pkg.sessions_count || 1}
                      </div>

                      <h4 className="font-bold text-lg text-[var(--text-main)] mb-1">{name}</h4>
                      <p className="text-xs text-[var(--text-muted)] mb-4 min-h-[36px]">{desc}</p>

                      <ul className="space-y-2 mb-6 text-xs text-[var(--text-main)]">
                        <li className="flex items-center gap-2">
                          <Check size={14} className="text-primary" />
                          <span>{pkg.sessions_count} {language === 'ar' ? 'حصص تعليمية مباشرة' : 'Direct Live Sessions'}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={14} className="text-primary" />
                          <span>{language === 'ar' ? 'حجز فوري مع أي معلم معتمد' : 'Instant booking with verified teachers'}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={14} className="text-primary" />
                          <span>{language === 'ar' ? 'صلاحية مرنة لكامل الفصل الدراسي' : 'Full semester validity'}</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-[var(--border)]">
                      <div className="mb-4">
                        <span className="text-2xl font-black text-primary">{Number(pkg.price).toFixed(2)}</span>
                        <span className="text-xs text-[var(--text-muted)] mr-1 ml-1">{t.sar}</span>
                        {pkg.price_per_session && (
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                            {Number(pkg.price_per_session).toFixed(2)} {t.sar} / {language === 'ar' ? 'الحصة' : 'Session'}
                          </div>
                        )}
                      </div>

                      <Button
                        disabled={isBuying}
                        onClick={() => handlePurchase(pkg)}
                        className="w-full rounded-xl py-2.5 font-bold flex items-center justify-center gap-2"
                      >
                        {isBuying && <Loader2 size={16} className="animate-spin" />}
                        <span>{language === 'ar' ? 'شراء الباقة الآن' : 'Purchase Package'}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[var(--border)] bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[var(--text-muted)]">
              {language === 'ar' ? 'وسيلة الدفع المفضلة:' : 'Payment Method:'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('card')}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  selectedMethod === 'card'
                    ? 'border-primary bg-primary-pale text-primary'
                    : 'border-[var(--border)] bg-white text-gray-600'
                }`}
              >
                {language === 'ar' ? 'بطاقة مدى / ائتمان' : 'Card'}
              </button>
            </div>
          </div>
          <Button variant="outline" onClick={onClose} className="text-xs h-9 px-4">
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
};

