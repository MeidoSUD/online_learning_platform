import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { adminService } from '../../Services/api';
import type { TermsConditions, TermsConditionsPayload } from '../../Utils/types';
import { useToast } from '../../Contexts/ToastContext';
import { FileText, Plus, RefreshCw, Edit2, Trash2, X, Check, Undo2, Eye } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

type FilterType = 'all' | 'terms' | 'conditions' | 'privacy_policy';

export const TermsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [terms, setTerms] = useState<TermsConditions[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showDeleted, setShowDeleted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TermsConditions | null>(null);
  const [showPreview, setShowPreview] = useState<TermsConditions | null>(null);
  const [form, setForm] = useState<TermsConditionsPayload>({
    title_en: '',
    title_ar: '',
    content_en: '',
    content_ar: '',
    type: 'terms',
    status: true,
  });

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (filterType !== 'all') filters.type = filterType;
      if (showDeleted) filters.include_deleted = '1';
      const res = await adminService.getTermsConditions(filters);
      setTerms(res?.data || []);
    } catch (error: any) {
      showToast(error.message || t.errorOccurred, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, [filterType, showDeleted]);

  const resetForm = () => {
    setForm({ title_en: '', title_ar: '', content_en: '', content_ar: '', type: 'terms', status: true });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (term: TermsConditions) => {
    setEditing(term);
    setForm({
      title_en: term.title_en,
      title_ar: term.title_ar,
      content_en: term.content_en,
      content_ar: term.content_ar,
      type: term.type,
      status: term.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title_en || !form.title_ar || !form.content_en || !form.content_ar) {
      showToast(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await adminService.updateTermsCondition(editing.id, form);
        showToast(language === 'ar' ? 'تم التحديث بنجاح' : 'Updated successfully', 'success');
      } else {
        await adminService.createTermsCondition(form);
        showToast(language === 'ar' ? 'تم الإنشاء بنجاح' : 'Created successfully', 'success');
      }
      setShowModal(false);
      resetForm();
      fetchTerms();
    } catch (error: any) {
      showToast(error.message || t.errorOccurred, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (term: TermsConditions) => {
    try {
      await adminService.updateTermsCondition(term.id, { status: !term.status });
      showToast(language === 'ar' ? 'تم تغيير الحالة' : 'Status toggled', 'success');
      fetchTerms();
    } catch (error: any) {
      showToast(error.message || t.errorOccurred, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminService.deleteTermsCondition(id);
      showToast(language === 'ar' ? 'تم الحذف' : 'Deleted', 'success');
      fetchTerms();
    } catch (error: any) {
      showToast(error.message || t.errorOccurred, 'error');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await adminService.restoreTermsCondition(id);
      showToast(language === 'ar' ? 'تم الاستعادة' : 'Restored', 'success');
      fetchTerms();
    } catch (error: any) {
      showToast(error.message || t.errorOccurred, 'error');
    }
  };

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      terms: language === 'ar' ? 'شروط الخدمة' : 'Terms',
      conditions: language === 'ar' ? 'الأحكام' : 'Conditions',
      privacy_policy: language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy',
    };
    return labels[type] || type;
  };

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = {
      terms: 'bg-blue-100 text-blue-700',
      conditions: 'bg-purple-100 text-purple-700',
      privacy_policy: 'bg-green-100 text-green-700',
    };
    return (
      <span className={`text-xs px-2 py-1 rounded ${colors[type] || 'bg-slate-100 text-slate-600'}`}>
        {typeLabel(type)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="text-primary" />
          {language === 'ar' ? 'إدارة الشروط والأحكام' : 'Terms & Conditions'}
        </h2>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setShowDeleted(!showDeleted)}>
            <Eye size={18} className="mr-2" />
            {showDeleted
              ? (language === 'ar' ? 'إخفاء المحذوف' : 'Hide Deleted')
              : (language === 'ar' ? 'عرض المحذوف' : 'Show Deleted')}
          </Button>
          <Button onClick={openCreate}>
            <Plus size={18} className="mr-2" />
            {language === 'ar' ? 'إضافة جديدة' : 'Add New'}
          </Button>
          <Button variant="secondary" onClick={fetchTerms} isLoading={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'terms', 'conditions', 'privacy_policy'] as FilterType[]).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === type
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {type === 'all' ? (language === 'ar' ? 'الكل' : 'All') : typeLabel(type)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="animate-spin mx-auto text-primary" size={32} />
          </div>
        ) : terms.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {language === 'ar' ? 'لا توجد شروط وأحكام' : 'No terms & conditions found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-slate-700">
                    {language === 'ar' ? 'العنوان (عربي)' : 'Title (AR)'}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-slate-700">
                    {language === 'ar' ? 'العنوان (إنجليزي)' : 'Title (EN)'}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-slate-700">
                    {language === 'ar' ? 'النوع' : 'Type'}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-slate-700">
                    {language === 'ar' ? 'الإصدار' : 'Version'}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-slate-700">
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-slate-700">
                    {language === 'ar' ? 'إجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {terms.map(term => (
                  <tr key={term.id} className={`hover:bg-slate-50 ${term.is_deleted ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{term.title_ar}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{term.title_en}</td>
                    <td className="px-4 py-3">{typeBadge(term.type)}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">v{term.version}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        term.is_deleted
                          ? 'bg-red-100 text-red-700'
                          : term.status
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {term.is_deleted
                          ? (language === 'ar' ? 'محذوف' : 'Deleted')
                          : term.status
                            ? (language === 'ar' ? 'نشط' : 'Active')
                            : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {term.is_deleted ? (
                          <Button size="sm" variant="secondary" onClick={() => handleRestore(term.id)}>
                            <Undo2 size={14} />
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => openEdit(term)}>
                              <Edit2 size={14} />
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setShowPreview(term)}>
                              <Eye size={14} />
                            </Button>
                            <button
                              onClick={() => handleToggleStatus(term)}
                              className={`p-2 rounded-lg text-sm transition-all ${
                                term.status
                                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                              title={term.status
                                ? (language === 'ar' ? 'إلغاء التفعيل' : 'Deactivate')
                                : (language === 'ar' ? 'تفعيل' : 'Activate')}
                            >
                              {term.status ? <X size={14} /> : <Check size={14} />}
                            </button>
                            <button
                              onClick={() => handleDelete(term.id)}
                              className="p-2 rounded-lg text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                              title={language === 'ar' ? 'حذف' : 'Delete'}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editing
          ? (language === 'ar' ? 'تعديل الشروط والأحكام' : 'Edit Terms & Conditions')
          : (language === 'ar' ? 'إضافة شروط وأحكام جديدة' : 'Add New Terms & Conditions')}
      >
        <div className="space-y-4">
          <Input
            label={language === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}
            value={form.title_ar}
            onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
            placeholder={language === 'ar' ? 'شروط الخدمة' : 'شروط الخدمة'}
          />
          <Input
            label={language === 'ar' ? 'العنوان (إنجليزي)' : 'Title (English)'}
            value={form.title_en}
            onChange={(e) => setForm({ ...form, title_en: e.target.value })}
            placeholder="Terms of Service"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {language === 'ar' ? 'المحتوى (عربي)' : 'Content (Arabic)'}
            </label>
            <textarea
              value={form.content_ar}
              onChange={(e) => setForm({ ...form, content_ar: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              dir="rtl"
              placeholder={language === 'ar' ? 'محتوى الشروط بالعربية...' : 'محتوى الشروط بالعربية...'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {language === 'ar' ? 'المحتوى (إنجليزي)' : 'Content (English)'}
            </label>
            <textarea
              value={form.content_en}
              onChange={(e) => setForm({ ...form, content_en: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Full terms content in English..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {language === 'ar' ? 'النوع' : 'Type'}
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as TermsConditionsPayload['type'] })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="terms">{typeLabel('terms')}</option>
                <option value="conditions">{typeLabel('conditions')}</option>
                <option value="privacy_policy">{typeLabel('privacy_policy')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {language === 'ar' ? 'الحالة' : 'Status'}
              </label>
              <select
                value={form.status ? '1' : '0'}
                onChange={(e) => setForm({ ...form, status: e.target.value === '1' })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="1">{language === 'ar' ? 'نشط' : 'Active'}</option>
                <option value="0">{language === 'ar' ? 'غير نشط' : 'Inactive'}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} isLoading={saving}>
              <Check size={18} className="mr-2" />
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={!!showPreview}
        onClose={() => setShowPreview(null)}
        title={showPreview
          ? (language === 'ar' ? showPreview.title_ar : showPreview.title_en)
          : ''}
      >
        {showPreview && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {typeBadge(showPreview.type)}
              <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">v{showPreview.version}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                showPreview.status ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {showPreview.status
                  ? (language === 'ar' ? 'نشط' : 'Active')
                  : (language === 'ar' ? 'غير نشط' : 'Inactive')}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                {language === 'ar' ? 'المحتوى (عربي)' : 'Arabic Content'}
              </h4>
              <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap leading-relaxed" dir="rtl">
                {showPreview.content_ar}
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                {language === 'ar' ? 'المحتوى (إنجليزي)' : 'English Content'}
              </h4>
              <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {showPreview.content_en}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
