import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { adminService } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';
import { Settings as SettingsIcon, Save, RefreshCw, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface Setting {
  id: number;
  key: string;
  value: string;
  type: string;
  group: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const AdminSettingsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    type: 'string',
    group: 'app',
    description: ''
  });

  const groups = ['all', 'app', 'contact', 'payment', 'general'];

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = activeGroup === 'all' 
        ? await adminService.getSettings()
        : await adminService.getSettingsByGroup(activeGroup);
      setSettings(Array.isArray(data) ? data : (data.data || []));
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
      showToast(error.message || t.errorOccurred, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [activeGroup]);

  const handleSave = async (setting: Setting) => {
    setSaving(true);
    try {
      await adminService.updateSetting(setting.id, {
        key: setting.key,
        value: editValue,
        type: setting.type,
        group: setting.group,
        description: setting.description
      });
      showToast(language === 'ar' ? 'تم التحديث بنجاح' : 'Updated successfully', 'success');
      setEditingId(null);
      fetchSettings();
    } catch (error: any) {
      showToast(error.message || t.errorOccurred, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNew = async () => {
    if (!newSetting.key || !newSetting.value) {
      showToast(language === 'ar' ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminService.createSetting(newSetting);
      showToast(language === 'ar' ? 'تم الإضافة بنجاح' : 'Added successfully', 'success');
      setShowAddModal(false);
      setNewSetting({ key: '', value: '', type: 'string', group: 'app', description: '' });
      fetchSettings();
    } catch (error: any) {
      showToast(error.message || t.errorOccurred, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      string: language === 'ar' ? 'نص' : 'Text',
      bool: language === 'ar' ? 'منطقي' : 'Boolean',
      number: language === 'ar' ? 'رقم' : 'Number',
      textarea: language === 'ar' ? 'نص طويل' : 'Text Area',
      select: language === 'ar' ? 'اختيار' : 'Select'
    };
    return labels[type] || type;
  };

  const getGroupLabel = (group: string) => {
    const labels: Record<string, string> = {
      app: language === 'ar' ? 'التطبيق' : 'App',
      contact: language === 'ar' ? 'معلومات الاتصال' : 'Contact',
      payment: language === 'ar' ? 'الدفع' : 'Payment',
      general: language === 'ar' ? 'عام' : 'General'
    };
    return labels[group] || group;
  };

  const renderValueInput = (setting: Setting) => {
    if (editingId === setting.id) {
      if (setting.type === 'bool') {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="1">{language === 'ar' ? 'نعم' : 'Yes'}</option>
            <option value="0">{language === 'ar' ? 'لا' : 'No'}</option>
          </select>
        );
      }
      if (setting.type === 'textarea') {
        return (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        );
      }
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          type={setting.type === 'number' ? 'number' : 'text'}
        />
      );
    }

    if (setting.type === 'bool') {
      return (
        <span className={`px-3 py-1 rounded-full text-sm ${setting.value === '1' || setting.value === 'true' 
          ? 'bg-green-100 text-green-700' 
          : 'bg-red-100 text-red-700'}`}>
          {setting.value === '1' || setting.value === 'true' 
            ? (language === 'ar' ? 'مفعل' : 'Enabled')
            : (language === 'ar' ? 'معطل' : 'Disabled')}
        </span>
      );
    }

    return <span className="text-slate-700">{setting.value}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="text-primary" />
          {language === 'ar' ? 'إعدادات النظام' : 'System Settings'}
        </h2>
        
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} className="mr-2" />
            {language === 'ar' ? 'إضافة إعداد' : 'Add Setting'}
          </Button>
          <Button variant="secondary" onClick={fetchSettings} isLoading={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Group Filter */}
      <div className="flex flex-wrap gap-2">
        {groups.map(group => (
          <button
            key={group}
            onClick={() => setActiveGroup(group)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeGroup === group
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {group === 'all' ? (language === 'ar' ? 'الكل' : 'All') : getGroupLabel(group)}
          </button>
        ))}
      </div>

      {/* Settings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="animate-spin mx-auto text-primary" size={32} />
          </div>
        ) : settings.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {language === 'ar' ? 'لا توجد إعدادات' : 'No settings found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-slate-700">
                    {language === 'ar' ? 'المفتاح' : 'Key'}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-slate-700">
                    {language === 'ar' ? 'القيمة' : 'Value'}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-slate-700">
                    {language === 'ar' ? 'النوع' : 'Type'}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-slate-700">
                    {language === 'ar' ? 'المجموعة' : 'Group'}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-slate-700">
                    {language === 'ar' ? 'الوصف' : 'Description'}
                  </th>
                  <th className="px-4 py-3 text-start text-sm font-semibold text-slate-700">
                    {language === 'ar' ? 'إجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settings.map(setting => (
                  <tr key={setting.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <code className="text-sm bg-slate-100 px-2 py-1 rounded">{setting.key}</code>
                    </td>
                    <td className="px-4 py-3 min-w-[200px]">
                      {renderValueInput(setting)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {getTypeLabel(setting.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">{getGroupLabel(setting.group)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-500">{setting.description || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {editingId === setting.id ? (
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => handleSave(setting)} isLoading={saving}>
                            <Check size={16} />
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                            <X size={16} />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => {
                            setEditingId(setting.id);
                            setEditValue(setting.value);
                          }}
                        >
                          <Edit2 size={16} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Setting Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={language === 'ar' ? 'إضافة إعداد جديد' : 'Add New Setting'}
      >
        <div className="space-y-4">
          <Input
            label={language === 'ar' ? 'المفتاح' : 'Key'}
            value={newSetting.key}
            onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
            placeholder="e.g., app_name"
          />
          <Input
            label={language === 'ar' ? 'القيمة' : 'Value'}
            value={newSetting.value}
            onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {language === 'ar' ? 'النوع' : 'Type'}
            </label>
            <select
              value={newSetting.type}
              onChange={(e) => setNewSetting({ ...newSetting, type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="string">{language === 'ar' ? 'نص' : 'Text'}</option>
              <option value="number">{language === 'ar' ? 'رقم' : 'Number'}</option>
              <option value="bool">{language === 'ar' ? 'منطقي' : 'Boolean'}</option>
              <option value="textarea">{language === 'ar' ? 'نص طويل' : 'Text Area'}</option>
              <option value="select">{language === 'ar' ? 'اختيار' : 'Select'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {language === 'ar' ? 'المجموعة' : 'Group'}
            </label>
            <select
              value={newSetting.group}
              onChange={(e) => setNewSetting({ ...newSetting, group: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="app">{language === 'ar' ? 'التطبيق' : 'App'}</option>
              <option value="contact">{language === 'ar' ? 'معلومات الاتصال' : 'Contact'}</option>
              <option value="payment">{language === 'ar' ? 'الدفع' : 'Payment'}</option>
              <option value="general">{language === 'ar' ? 'عام' : 'General'}</option>
            </select>
          </div>
          <Input
            label={language === 'ar' ? 'الوصف' : 'Description'}
            value={newSetting.description}
            onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleAddNew} isLoading={saving}>
              <Save size={18} className="mr-2" />
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
