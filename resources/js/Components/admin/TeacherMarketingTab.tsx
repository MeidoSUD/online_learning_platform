import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { adminService } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';
import { 
  Rocket, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  Play, 
  Pause, 
  Eye, 
  MousePointer, 
  DollarSign, 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Search,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const TeacherMarketingTab: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'plans' | 'subscriptions' | 'stats'>('plans');

  // Plans state
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subFilter, setSubFilter] = useState<'all' | 'active' | 'expired' | 'pending_payment'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats state
  const [stats, setStats] = useState<any>(null);

  // Modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    duration_months: 1,
    duration_days: 30,
    price: 99,
    badge_text_ar: 'معلم مميز',
    badge_text_en: 'Featured Teacher',
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'subscriptions') {
      fetchSubscriptions();
    }
  }, [activeSubTab, subFilter]);

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const data = await adminService.getTeacherMarketingPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      showToast(isAr ? 'فشل تحميل باقات الترويج' : 'Failed to load boost plans', 'error');
    } finally {
      setPlansLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await adminService.getTeacherMarketingStats();
      setStats(res);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSubscriptions = async () => {
    setSubscriptionsLoading(true);
    try {
      const params: any = {};
      if (subFilter !== 'all') params.status = subFilter;
      if (searchQuery) params.search = searchQuery;
      const res = await adminService.getTeacherMarketingSubscriptions(params);
      setSubscriptions(res?.data?.data || res?.data || []);
    } catch (e) {
      console.error(e);
      showToast(isAr ? 'فشل تحميل الاشتراكات' : 'Failed to load subscriptions', 'error');
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingPlan(null);
    setFormData({
      name_ar: '',
      name_en: '',
      description_ar: '',
      description_en: '',
      duration_months: 1,
      duration_days: 30,
      price: 99,
      badge_text_ar: 'معلم مميز',
      badge_text_en: 'Featured Teacher',
      is_active: true,
    });
    setShowPlanModal(true);
  };

  const handleOpenEditModal = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name_ar: plan.name_ar,
      name_en: plan.name_en,
      description_ar: plan.description_ar || '',
      description_en: plan.description_en || '',
      duration_months: plan.duration_months,
      duration_days: plan.duration_days,
      price: plan.price,
      badge_text_ar: plan.badge_text_ar || 'معلم مميز',
      badge_text_en: plan.badge_text_en || 'Featured Teacher',
      is_active: plan.is_active,
    });
    setShowPlanModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      if (editingPlan) {
        await adminService.updateTeacherMarketingPlan(editingPlan.id, formData);
        showToast(isAr ? 'تم تحديث الباقة بنجاح' : 'Plan updated successfully', 'success');
      } else {
        await adminService.createTeacherMarketingPlan(formData);
        showToast(isAr ? 'تم إنشاء الباقة بنجاح' : 'Plan created successfully', 'success');
      }
      setShowPlanModal(false);
      fetchPlans();
      fetchStats();
    } catch (e: any) {
      showToast(e.message || (isAr ? 'حدث خطأ' : 'An error occurred'), 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await adminService.toggleTeacherMarketingPlan(id);
      showToast(isAr ? 'تم تعديل حالة الباقة' : 'Plan status toggled', 'success');
      fetchPlans();
    } catch (e: any) {
      showToast(e.message || (isAr ? 'فشل التعديل' : 'Failed to toggle'), 'error');
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذه الباقة؟' : 'Are you sure you want to delete this plan?')) {
      return;
    }
    try {
      await adminService.deleteTeacherMarketingPlan(id);
      showToast(isAr ? 'تم حذف الباقة بنجاح' : 'Plan deleted successfully', 'success');
      fetchPlans();
      fetchStats();
    } catch (e: any) {
      showToast(e.message || (isAr ? 'فشل حذف الباقة' : 'Failed to delete plan'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-amber-400 text-white rounded-xl shadow-md shadow-amber-500/20">
              <Rocket size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {isAr ? 'إدارة ترويج المعلمين (معلم مميز)' : 'Teacher Boost & Marketing Management'}
              </h2>
              <p className="text-sm text-slate-500">
                {isAr 
                  ? 'التحكم في باقات الإعلانات واشتراكات المعلمين المميزين في الصفحة الرئيسية وتطبيق الجوال'
                  : 'Manage featured teacher boost plans and active subscriptions across web & mobile.'}
              </p>
            </div>
          </div>
        </div>

        {activeSubTab === 'plans' && (
          <Button onClick={handleOpenAddModal} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm">
            <Plus size={18} />
            <span>{isAr ? 'إضافة باقة جديدة' : 'Add New Plan'}</span>
          </Button>
        )}
      </div>

      {/* Quick Overview Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">{isAr ? 'المعلمون المميزون حالياً' : 'Active Boosted'}</span>
              <Sparkles size={16} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.active_subscriptions || 0}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">{isAr ? 'إجمالي الأرباح' : 'Total Revenue'}</span>
              <DollarSign size={16} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.total_revenue || 0} SAR</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">{isAr ? 'مشاهدات البنرات' : 'Banner Impressions'}</span>
              <Eye size={16} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.total_views || 0}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">{isAr ? 'نقرات الطلاب' : 'Student Clicks'}</span>
              <MousePointer size={16} className="text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{stats.total_clicks || 0}</p>
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('plans')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeSubTab === 'plans'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {isAr ? 'باقات الاشتراك والأسعار' : 'Subscription Plans & Pricing'}
        </button>
        <button
          onClick={() => setActiveSubTab('subscriptions')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeSubTab === 'subscriptions'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {isAr ? 'سجل اشتراكات المعلمين' : 'Teacher Subscriptions'}
        </button>
      </div>

      {/* Tab 1: Plans Management */}
      {activeSubTab === 'plans' && (
        <div>
          {plansLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="animate-spin text-amber-500" size={32} />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-8">
              <Rocket size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">
                {isAr ? 'لا توجد باقات ترويج مضافة بعد' : 'No boost plans found'}
              </p>
              <Button onClick={handleOpenAddModal} className="mt-4 bg-amber-500 text-white">
                {isAr ? 'إضافة الباقة الأولى' : 'Add First Plan'}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                    plan.is_active ? 'border-amber-200 shadow-sm' : 'border-slate-200 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {isAr ? plan.badge_text_ar : plan.badge_text_en}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          plan.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {plan.is_active ? (isAr ? 'مفعلة' : 'Active') : (isAr ? 'معطلة' : 'Disabled')}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                      {isAr ? plan.name_ar : plan.name_en}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                      {isAr ? plan.description_ar : plan.description_en}
                    </p>

                    <div className="flex items-baseline gap-1 my-4">
                      <span className="text-3xl font-extrabold text-amber-600">{plan.price}</span>
                      <span className="text-sm font-bold text-slate-500">SAR</span>
                      <span className="text-xs text-slate-400 ms-2">
                        / {plan.duration_months} {isAr ? (plan.duration_months === 1 ? 'شهر' : 'أشهر') : 'Months'} ({plan.duration_days} {isAr ? 'يوم' : 'Days'})
                      </span>
                    </div>

                    <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 space-y-1">
                      <div className="flex justify-between">
                        <span>{isAr ? 'الاشتراكات النشطة:' : 'Active Subscriptions:'}</span>
                        <span className="font-bold text-slate-800">{plan.active_subscriptions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{isAr ? 'إجمالي المشتركين:' : 'Total Subscriptions:'}</span>
                        <span className="font-bold text-slate-800">{plan.total_subscriptions || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-4">
                    <button
                      onClick={() => handleToggleActive(plan.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        plan.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={plan.is_active ? (isAr ? 'تعطيل' : 'Disable') : (isAr ? 'تفعيل' : 'Activate')}
                    >
                      {plan.is_active ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(plan)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={isAr ? 'تعديل السعر والبيانات' : 'Edit Plan'}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Subscriptions Table */}
      {activeSubTab === 'subscriptions' && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          {/* Filters & Search */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-2">
              {(['all', 'active', 'expired', 'pending_payment'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSubFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    subFilter === filter
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter === 'all' && (isAr ? 'الكل' : 'All')}
                  {filter === 'active' && (isAr ? 'النشطة فقط' : 'Active Only')}
                  {filter === 'expired' && (isAr ? 'المنتهية' : 'Expired')}
                  {filter === 'pending_payment' && (isAr ? 'بانتظار الدفع' : 'Pending')}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isAr ? 'بحث بالاسم أو الهاتف...' : 'Search teacher...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchSubscriptions()}
                className="ps-9 pe-4 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-amber-500 w-full sm:w-64"
              />
            </div>
          </div>

          {subscriptionsLoading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="animate-spin text-amber-500" size={32} />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users size={40} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">{isAr ? 'لا توجد اشتراكات مطابقة' : 'No subscriptions found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="p-3 text-start">{isAr ? 'المعلم' : 'Teacher'}</th>
                    <th className="p-3 text-start">{isAr ? 'الباقة' : 'Plan'}</th>
                    <th className="p-3 text-start">{isAr ? 'المبلغ' : 'Amount'}</th>
                    <th className="p-3 text-start">{isAr ? 'طريقة الدفع' : 'Payment'}</th>
                    <th className="p-3 text-start">{isAr ? 'تاريخ البدء' : 'Start'}</th>
                    <th className="p-3 text-start">{isAr ? 'الانتهاء' : 'Expires'}</th>
                    <th className="p-3 text-start">{isAr ? 'الأيام المتبقية' : 'Remaining'}</th>
                    <th className="p-3 text-start">{isAr ? 'المشاهدات/النقرات' : 'Views / Clicks'}</th>
                    <th className="p-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptions.map((sub: any) => (
                    <tr key={sub.id} className="hover:bg-slate-50/60">
                      <td className="p-3">
                        <div className="font-bold text-slate-800">{sub.teacher?.name || '-'}</div>
                        <div className="text-[11px] text-slate-400">{sub.teacher?.email || sub.teacher?.phone_number}</div>
                      </td>
                      <td className="p-3 font-medium text-slate-700">
                        {isAr ? sub.plan?.name_ar : sub.plan?.name_en}
                      </td>
                      <td className="p-3 font-bold text-amber-600">
                        {sub.amount_paid} {sub.currency}
                      </td>
                      <td className="p-3 capitalize text-slate-600">
                        {sub.payment_method}
                      </td>
                      <td className="p-3 text-slate-500">
                        {sub.start_date ? new Date(sub.start_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-3 text-slate-500">
                        {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="p-3">
                        {sub.is_active ? (
                          <span className="font-bold text-emerald-600">
                            {sub.days_remaining} {isAr ? 'يوم' : 'days'}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-3 font-medium text-slate-700">
                        👁️ {sub.views_count || 0} / 👆 {sub.clicks_count || 0}
                      </td>
                      <td className="p-3">
                        {sub.status === 'active' && sub.is_active ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                            {isAr ? 'نشط' : 'Active'}
                          </span>
                        ) : sub.status === 'expired' || !sub.is_active ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {isAr ? 'منتهي' : 'Expired'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                            {sub.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Create / Edit Plan */}
      <Modal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title={editingPlan ? (isAr ? 'تعديل باقة الترويج' : 'Edit Boost Plan') : (isAr ? 'إنشاء باقة ترويج جديدة' : 'Create Boost Plan')}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isAr ? 'اسم الباقة بالعربية' : 'Plan Name (Arabic)'} *
              </label>
              <input
                type="text"
                required
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-1 focus:ring-amber-500"
                placeholder="مثال: باقة الترويج الشهري"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isAr ? 'اسم الباقة بالإنجليزية' : 'Plan Name (English)'} *
              </label>
              <input
                type="text"
                required
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-1 focus:ring-amber-500"
                placeholder="e.g. 1 Month Boost Plan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isAr ? 'السعر (ر.س)' : 'Price (SAR)'} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-xl text-sm font-bold text-amber-600 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isAr ? 'المدة بالأشهر' : 'Duration (Months)'} *
              </label>
              <select
                value={formData.duration_months}
                onChange={(e) => {
                  const m = parseInt(e.target.value);
                  setFormData({ ...formData, duration_months: m, duration_days: m * 30 });
                }}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-1 focus:ring-amber-500"
              >
                <option value={1}>1 {isAr ? 'شهر' : 'Month'}</option>
                <option value={3}>3 {isAr ? 'أشهر' : 'Months'}</option>
                <option value={6}>6 {isAr ? 'أشهر' : 'Months'}</option>
                <option value={12}>12 {isAr ? 'شهراً' : 'Months'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isAr ? 'المدة بالأيام' : 'Duration (Days)'} *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isAr ? 'شارة المعلم بالعربية' : 'Badge Text (Arabic)'}
              </label>
              <input
                type="text"
                value={formData.badge_text_ar}
                onChange={(e) => setFormData({ ...formData, badge_text_ar: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-1 focus:ring-amber-500"
                placeholder="معلم مميز"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isAr ? 'شارة المعلم بالإنجليزية' : 'Badge Text (English)'}
              </label>
              <input
                type="text"
                value={formData.badge_text_en}
                onChange={(e) => setFormData({ ...formData, badge_text_en: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-1 focus:ring-amber-500"
                placeholder="Featured Teacher"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isAr ? 'الوصف بالعربية' : 'Description (Arabic)'}
            </label>
            <textarea
              rows={2}
              value={formData.description_ar}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-1 focus:ring-amber-500"
              placeholder="وصف الباقة ومميزاتها للمعلم..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isAr ? 'الوصف بالإنجليزية' : 'Description (English)'}
            </label>
            <textarea
              rows={2}
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-1 focus:ring-amber-500"
              placeholder="Plan description and features..."
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="plan_is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="plan_is_active" className="text-sm font-semibold text-slate-700">
              {isAr ? 'الباقة مفعلة ومتاحة للاشتراك' : 'Plan is active and available'}
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPlanModal(false)}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={formSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {formSubmitting && <Loader2 size={16} className="animate-spin me-2" />}
              {editingPlan ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إنشاء الباقة' : 'Create Plan')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

