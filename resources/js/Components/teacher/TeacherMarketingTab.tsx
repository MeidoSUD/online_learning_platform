import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { teacherService, UserData } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';
import { 
  Rocket, 
  Sparkles, 
  CheckCircle, 
  Calendar, 
  Clock, 
  Wallet, 
  CreditCard, 
  Eye, 
  MousePointer, 
  Upload, 
  Loader2, 
  AlertCircle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface TeacherMarketingTabProps {
  user: UserData;
  onNavigate?: (tab: string) => void;
}

export const TeacherMarketingTab: React.FC<TeacherMarketingTabProps> = ({ user, onNavigate }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Subscribe modal
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [marketingTitle, setMarketingTitle] = useState('');
  const [marketingBio, setMarketingBio] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit banner modal
  const [showEditBannerModal, setShowEditBannerModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [updatingBanner, setUpdatingBanner] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, statusRes, walletRes] = await Promise.all([
        teacherService.getMarketingPlans(),
        teacherService.getMarketingStatus(),
        teacherService.getWallet().catch(() => ({ balance: 0 })),
      ]);

      setPlans(Array.isArray(plansRes) ? plansRes : []);
      setStatusData(statusRes?.data || statusRes);
      setWalletBalance(parseFloat(walletRes?.balance ?? walletRes?.data?.balance ?? 0));
    } catch (e) {
      console.error(e);
      showToast(isAr ? 'فشل تحميل بيانات الترويج' : 'Failed to load marketing data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubscribe = (plan: any) => {
    setSelectedPlan(plan);
    setMarketingTitle('');
    setMarketingBio('');
    setBannerFile(null);
    setBannerPreview(null);
    setPaymentMethod(walletBalance >= plan.price ? 'wallet' : 'card');
    setShowSubscribeModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isEdit) {
        setEditFile(file);
        setEditPreview(URL.createObjectURL(file));
      } else {
        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('plan_id', selectedPlan.id);
      formData.append('payment_method', paymentMethod);
      if (marketingTitle) formData.append('marketing_title', marketingTitle);
      if (marketingBio) formData.append('marketing_bio', marketingBio);
      if (bannerFile) formData.append('banner_image', bannerFile);
      formData.append('callback_url', window.location.href);

      const res: any = await teacherService.subscribeMarketing(formData);

      if (paymentMethod === 'wallet') {
        showToast(isAr ? 'تم الاشتراك وتفعيل الترويج بنجاح!' : 'Boost activated successfully!', 'success');
        setShowSubscribeModal(false);
        loadData();
      } else if (res?.data?.redirect_url) {
        // Redirect to Moyasar payment
        window.location.href = res.data.redirect_url;
      }
    } catch (e: any) {
      console.error(e);
      showToast(e.message || (isAr ? 'فشل الاشتراك' : 'Subscription failed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditBanner = () => {
    const active = statusData?.active_subscription;
    setEditTitle(active?.marketing_title || '');
    setEditBio(active?.marketing_bio || '');
    setEditPreview(active?.banner_url || null);
    setEditFile(null);
    setShowEditBannerModal(true);
  };

  const handleUpdateBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingBanner(true);
    try {
      const formData = new FormData();
      if (editTitle) formData.append('marketing_title', editTitle);
      if (editBio) formData.append('marketing_bio', editBio);
      if (editFile) formData.append('banner_image', editFile);

      await teacherService.updateMarketingBanner(formData);
      showToast(isAr ? 'تم تحديث بيانات الإعلان بنجاح' : 'Banner updated successfully', 'success');
      setShowEditBannerModal(false);
      loadData();
    } catch (e: any) {
      showToast(e.message || (isAr ? 'فشل التحديث' : 'Failed to update'), 'error');
    } finally {
      setUpdatingBanner(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex justify-center items-center">
        <Loader2 className="animate-spin text-amber-500" size={36} />
      </div>
    );
  }

  const isBoosted = statusData?.is_boosted;
  const activeSub = statusData?.active_subscription;

  return (
    <div className="space-y-6">
      {/* 1. Boost Status Hero Header */}
      {isBoosted && activeSub ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-6 sm:p-8 shadow-xl shadow-amber-500/10">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-amber-100">
                <Sparkles size={14} className="text-yellow-200" />
                <span>{isAr ? activeSub.badge_text_ar : activeSub.badge_text_en}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {isAr ? 'حسابك مروّج كمعلم مميز حالياً!' : 'Your Profile is Currently Boosted!'}
              </h2>
              <p className="text-amber-100 text-sm max-w-xl">
                {isAr
                  ? 'يظهر حسابك وبنرك الشخصي في أعلى الصفحة الرئيسية وتطبيق الجوال لكافة الطلاب والزوار.'
                  : 'Your profile banner is actively featured at the top of the homepage and mobile app.'}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-6 text-center">
              <div>
                <div className="text-3xl font-black text-white">{activeSub.days_remaining}</div>
                <div className="text-xs text-amber-100">{isAr ? 'يوماً متبقياً' : 'Days Left'}</div>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <div className="text-2xl font-bold text-white flex items-center justify-center gap-1">
                  <Eye size={18} /> {activeSub.views_count || 0}
                </div>
                <div className="text-xs text-amber-100">{isAr ? 'مشاهدة' : 'Views'}</div>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div>
                <div className="text-2xl font-bold text-white flex items-center justify-center gap-1">
                  <MousePointer size={18} /> {activeSub.clicks_count || 0}
                </div>
                <div className="text-xs text-amber-100">{isAr ? 'نقرة طالب' : 'Clicks'}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-amber-100">
              <span className="font-semibold">{isAr ? 'تاريخ الانتهاء:' : 'Expires:'}</span>{' '}
              {new Date(activeSub.end_date).toLocaleDateString()}
            </div>
            <Button
              onClick={handleOpenEditBanner}
              className="bg-white text-amber-700 hover:bg-amber-50 font-bold px-4 py-2 rounded-xl text-xs shadow-md"
            >
              {isAr ? 'تعديل نص الإعلان والبنر' : 'Edit Promo Banner & Title'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold">
                <Rocket size={14} />
                <span>{isAr ? 'خدمة الإعلانات والترويج' : 'Profile Marketing & Boost'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold">
                {isAr ? 'روّج لحسابك كمعلم مميز واكسب المزيد من الطلاب!' : 'Boost Your Profile as a Featured Teacher!'}
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                {isAr
                  ? 'اشترك في باقة الترويج ليظهر حسابك في بنرات الصفحة الرئيسية وتطبيق الجوال، ويصل ملفك الشخصي لآلاف الطلاب مباشرة.'
                  : 'Subscribe to a boost plan to feature your account on the home screen banner across web & mobile.'}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center space-y-2">
              <span className="text-xs text-slate-400 block">{isAr ? 'رصيد محفظتك الحالي' : 'Wallet Balance'}</span>
              <span className="text-2xl font-black text-amber-400">{walletBalance} SAR</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Available Plans Grid */}
      <div>
        <div className="text-center max-w-xl mx-auto my-6">
          <h3 className="text-xl font-bold text-slate-800">
            {isAr ? 'اختر باقة الترويج المناسبة لك' : 'Choose Your Boost Plan'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isAr ? 'يمكنك الدفع مباشرة من رصيد محفظتك أو بالبطاقة الائتمانية' : 'Pay easily via your wallet balance or bank card'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-3xl border-2 border-slate-100 hover:border-amber-400 p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 group"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    {isAr ? plan.badge_text_ar : plan.badge_text_en}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {plan.duration_days} {isAr ? 'يوماً' : 'Days'}
                  </span>
                </div>

                <h4 className="text-xl font-extrabold text-slate-800 mb-2 group-hover:text-amber-600 transition-colors">
                  {isAr ? plan.name_ar : plan.name_en}
                </h4>

                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  {isAr ? plan.description_ar : plan.description_en}
                </p>

                <div className="flex items-baseline gap-1 my-6 bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                  <span className="text-4xl font-black text-amber-600">{plan.price}</span>
                  <span className="text-sm font-bold text-slate-600">SAR</span>
                  <span className="text-xs text-slate-400 ms-2">
                    / {plan.duration_months} {isAr ? (plan.duration_months === 1 ? 'شهر' : 'أشهر') : 'Months'}
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>{isAr ? 'ظهور مميز في بنرات الصفحة الرئيسية' : 'Featured home screen banner'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>{isAr ? 'شارة معلم مميز ذهبية في نتائج البحث' : 'Golden Featured Teacher badge'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>{isAr ? 'إحصاءات حية لعدد المشاهدات ونقرات الطلاب' : 'Live impression & click analytics'}</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => handleOpenSubscribe(plan)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-md shadow-amber-500/20"
              >
                {isBoosted ? (isAr ? 'تمديد الترويج' : 'Extend Boost') : (isAr ? 'اشتراك وتفعيل الآن' : 'Subscribe Now')}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Subscription Modal */}
      <Modal
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        title={isAr ? `الاشتراك في: ${selectedPlan?.name_ar || ''}` : `Subscribe to ${selectedPlan?.name_en || ''}`}
      >
        <form onSubmit={handleSubscribeSubmit} className="space-y-5">
          {/* Plan Summary */}
          {selectedPlan && (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-amber-800 block">
                  {isAr ? selectedPlan.name_ar : selectedPlan.name_en}
                </span>
                <span className="text-xs text-amber-600">
                  {selectedPlan.duration_days} {isAr ? 'يوماً من الترويج المستمر' : 'Days of featured exposure'}
                </span>
              </div>
              <div className="text-end">
                <span className="text-2xl font-black text-amber-700">{selectedPlan.price}</span>
                <span className="text-xs font-bold text-amber-600 ms-1">SAR</span>
              </div>
            </div>
          )}

          {/* Marketing Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isAr ? 'عنوان الإعلان أو التخصص (اختياري)' : 'Promo Headline (Optional)'}
            </label>
            <input
              type="text"
              value={marketingTitle}
              onChange={(e) => setMarketingTitle(e.target.value)}
              placeholder={isAr ? 'مثال: معلم خبير في الرياضيات والقدرات لأكثر من 10 سنوات' : 'e.g. Certified Math & Physics Expert'}
              className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Marketing Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isAr ? 'نبذة تسويقية مختصرة تظهر في البنر (اختياري)' : 'Short Promo Bio (Optional)'}
            </label>
            <textarea
              rows={2}
              value={marketingBio}
              onChange={(e) => setMarketingBio(e.target.value)}
              placeholder={isAr ? 'اكتب عبارة تشجع الطلاب على حجز حصص معك...' : 'Encourage students to book with you...'}
              className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Custom Banner Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isAr ? 'صورة بنر مخصصة (اختياري - سيتم استخدام صورة ملفك الشخصي كافتراضي)' : 'Custom Banner Image (Optional)'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, false)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
            />
            {bannerPreview && (
              <div className="mt-2 relative rounded-xl overflow-hidden h-24 border">
                <img src={bannerPreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              {isAr ? 'طريقة الدفع' : 'Payment Method'} *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex flex-col p-3 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'wallet' ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="pm"
                    checked={paymentMethod === 'wallet'}
                    onChange={() => setPaymentMethod('wallet')}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <Wallet size={16} className="text-amber-600" />
                  <span className="text-xs font-bold text-slate-800">{isAr ? 'رصيد المحفظة' : 'Wallet'}</span>
                </div>
                <span className="text-[11px] text-slate-500 ps-6">
                  {isAr ? `الرصيد: ${walletBalance} ر.س` : `Balance: ${walletBalance} SAR`}
                </span>
                {selectedPlan && walletBalance < selectedPlan.price && (
                  <span className="text-[10px] text-rose-500 ps-6 font-semibold">
                    {isAr ? 'الرصيد غير كافٍ' : 'Insufficient balance'}
                  </span>
                )}
              </label>

              <label
                className={`flex flex-col p-3 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'card' ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="pm"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <CreditCard size={16} className="text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">{isAr ? 'بطاقة / مدى / أبل باي' : 'Card / Apple Pay'}</span>
                </div>
                <span className="text-[11px] text-slate-500 ps-6">
                  {isAr ? 'بوابة ميسر الآمنة' : 'Secure payment via Moyasar'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setShowSubscribeModal(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={submitting || (paymentMethod === 'wallet' && selectedPlan && walletBalance < selectedPlan.price)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              {submitting && <Loader2 size={16} className="animate-spin me-2" />}
              {paymentMethod === 'wallet'
                ? (isAr ? 'دفع وتفعيل فوري' : 'Pay & Activate Now')
                : (isAr ? 'المتابعة إلى بوابة الدفع' : 'Proceed to Payment')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Edit Banner Modal */}
      <Modal
        isOpen={showEditBannerModal}
        onClose={() => setShowEditBannerModal(false)}
        title={isAr ? 'تعديل الإعلان والبنر' : 'Edit Promo Banner'}
      >
        <form onSubmit={handleUpdateBannerSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isAr ? 'عنوان الإعلان أو التخصص' : 'Promo Headline'}
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isAr ? 'النبذة التسويقية' : 'Promo Bio'}
            </label>
            <textarea
              rows={3}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isAr ? 'تغيير صورة البنر' : 'Change Banner Image'}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, true)}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700"
            />
            {editPreview && (
              <div className="mt-2 relative rounded-xl overflow-hidden h-28 border">
                <img src={editPreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setShowEditBannerModal(false)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={updatingBanner} className="bg-amber-500 hover:bg-amber-600 text-white font-bold">
              {updatingBanner && <Loader2 size={16} className="animate-spin me-2" />}
              {isAr ? 'حفظ التعديلات' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

