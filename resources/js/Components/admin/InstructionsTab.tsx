import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { adminService } from '../../Services/api';
import type { Instruction, InstructionPayload } from '../../Utils/types';
import { useToast } from '../../Contexts/ToastContext';
import { BookOpen, Plus, RefreshCw, Edit2, Trash2, X, Check } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

type FilterType = 'all' | 'student' | 'teacher' | 'both';

export const InstructionsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Instruction | null>(null);
  const [form, setForm] = useState<InstructionPayload>({
    title: '',
    content: '',
    type: 'session_start',
    target_audience: 'both',
    is_active: true,
  });

  const fetchInstructions = async () => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (filterType !== 'all') filters.target_audience = filterType;
      const res = await adminService.getInstructions(filters);
      setInstructions(res?.data || []);
    } catch (error: any) {
      showToast(error.message || t.errorOccurred, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructions();
  }, [filterType]);

  const resetForm = () => {
    setForm({ title: '', content: '', type: 'session_start', target_audience: 'both', is_active: true });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (item: Instruction) => {
    setEditing(item);
    setForm({
      title: item.title,
      content: item.content,
      type: item.type,
      target_audience: item.target_audience,
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.content || !form.type) {
      showToast(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await adminService.updateInstruction(editing.id, form);
        showToast(language === 'ar' ? 'تم التحديث بنجاح' : 'Updated successfully', 'success');
      } else {
        await adminService.createInstruction(form);
        showToast(language === 'ar' ? 'تم الإنشاء بنجاح' : 'Created successfully', 'success');
      }
      setShowModal(false);
      resetForm();
      fetchInstructions();
    } catch (error: any) {
      showToast(error.message || t.errorOccurred, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: Instruction) => {
    try {
      await adminService.toggleInstruction(item.id);
      showToast(language === 'ar' ? 'تم تغيير الحالة' : 'Status toggled', 'success');
      fetchInstructions();
    } catch (error: any) {
      showToast(error.message || t.errorOccurred, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const msg = language === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?';
    if (!confirm(msg)) return;
    try {
      await adminService.deleteInstruction(id);
      showToast(language === 'ar' ? 'تم الحذف' : 'Deleted', 'success');
      fetchInstructions();
    } catch (error: any) {
      showToast(error.message || t.errorOccurred, 'error');
    }
  };

  const audienceLabel = (audience: string) => {
    const labels: Record<string, string> = {
      student: language === 'ar' ? 'الطلاب' : 'Students',
      teacher: language === 'ar' ? 'المعلمين' : 'Teachers',
      both: language === 'ar' ? 'الكل' : 'Both',
    };
    return labels[audience] || audience;
  };

  const audienceBadge = (audience: string) => {
    const colors: Record<string, string> = {
      student: 'bg-blue-100 text-blue-700',
      teacher: 'bg-purple-100 text-purple-700',
      both: 'bg-green-100 text-green-700',
    };
    return (
      <span className={`text-xs px-2 py-1 rounded ${colors[audience] || 'bg-slate-100 text-slate-600'}`}>
        {audienceLabel(audience)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-navy flex items-center gap-2">
          <BookOpen className="text-primary" />
          {language === 'ar' ? 'إدارة التعليمات' : 'Instructions Management'}
        </h2>
        <div className="flex items-center gap-3">
          <Button onClick={openCreate}>
            <Plus size={18} className="mr-2" />
            {language === 'ar' ? 'إضافة جديدة' : 'Add New'}
          </Button>
          <Button variant="secondary" onClick={fetchInstructions} isLoading={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'student', 'teacher', 'both'] as FilterType[]).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === type
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {type === 'all' ? (language === 'ar' ? 'الكل' : 'All') : audienceLabel(type)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="animate-spin mx-auto text-primary" size={32} />
          </div>
        ) : instructions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {language === 'ar' ? 'لا توجد تعليمات' : 'No instructions found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--light-bg)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-navy">
                    {language === 'ar' ? 'العنوان' : 'Title'}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-navy">
                    {language === 'ar' ? 'النوع' : 'Type'}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-navy">
                    {language === 'ar' ? 'الجمهور' : 'Audience'}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-navy">
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-navy">
                    {language === 'ar' ? 'إجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {instructions.map(item => (
                  <tr key={item.id} className="hover:bg-[var(--light-bg)]">
                    <td className="px-4 py-3 text-sm font-medium text-navy max-w-[200px] truncate">
                      {item.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{audienceBadge(item.target_audience)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.is_active
                          ? (language === 'ar' ? 'نشط' : 'Active')
                          : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
                          <Edit2 size={14} />
                        </Button>
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`p-2 rounded-lg text-sm transition-all ${
                            item.is_active
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          title={item.is_active
                            ? (language === 'ar' ? 'إلغاء التفعيل' : 'Deactivate')
                            : (language === 'ar' ? 'تفعيل' : 'Activate')}
                        >
                          {item.is_active ? <X size={14} /> : <Check size={14} />}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-lg text-sm bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                          title={language === 'ar' ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={14} />
                        </button>
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
          ? (language === 'ar' ? 'تعديل التعليمة' : 'Edit Instruction')
          : (language === 'ar' ? 'إضافة تعليمات جديدة' : 'Add New Instruction')}
      >
        <div className="space-y-4">
          <Input
            label={language === 'ar' ? 'العنوان' : 'Title'}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={language === 'ar' ? 'عنوان التعليمة' : 'Instruction title'}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {language === 'ar' ? 'المحتوى (فواصل منفصلة بـ |)' : 'Content (pipe-separated lines)'}
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              dir="rtl"
              placeholder={language === 'ar' ? 'أدخل كل سطر مفصلاً بـ |' : 'Enter each line separated by |'}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {language === 'ar' ? 'النوع' : 'Type'}
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="session_start">{language === 'ar' ? 'بدء الجلسة' : 'Session Start'}</option>
                <option value="session_end">{language === 'ar' ? 'نهاية الجلسة' : 'Session End'}</option>
                <option value="booking">{language === 'ar' ? 'الحجز' : 'Booking'}</option>
                <option value="payment">{language === 'ar' ? 'الدفع' : 'Payment'}</option>
                <option value="general">{language === 'ar' ? 'عام' : 'General'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {language === 'ar' ? 'الجمهور المستهدف' : 'Target Audience'}
              </label>
              <select
                value={form.target_audience}
                onChange={(e) => setForm({ ...form, target_audience: e.target.value as InstructionPayload['target_audience'] })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="both">{audienceLabel('both')}</option>
                <option value="student">{audienceLabel('student')}</option>
                <option value="teacher">{audienceLabel('teacher')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {language === 'ar' ? 'الحالة' : 'Status'}
            </label>
            <select
              value={form.is_active ? '1' : '0'}
              onChange={(e) => setForm({ ...form, is_active: e.target.value === '1' })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="1">{language === 'ar' ? 'نشط' : 'Active'}</option>
              <option value="0">{language === 'ar' ? 'غير نشط' : 'Inactive'}</option>
            </select>
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
    </div>
  );
};
