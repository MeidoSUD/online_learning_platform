import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { adminService, SessionsPackage } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';
import { Plus, Edit2, Trash2, Loader2, Play, Pause } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const PackagesTab: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [packages, setPackages] = useState<SessionsPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SessionsPackage | null>(null);

  const [formSubmitting, setFormSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    sessions_count: 5,
    price: 100,
    is_active: true
  });

  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPackages();
      setPackages(data);
    } catch (e) {
      console.error(e);
      showToast(t.error, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingPackage(null);
    setFormData({
      name_ar: '',
      name_en: '',
      description_ar: '',
      description_en: '',
      sessions_count: 5,
      price: 100,
      is_active: true
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleOpenEditModal = (pkg: SessionsPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name_ar: pkg.name_ar,
      name_en: pkg.name_en,
      description_ar: pkg.description_ar || '',
      description_en: pkg.description_en || '',
      sessions_count: pkg.sessions_count,
      price: pkg.price,
      is_active: pkg.is_active
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormErrors({});
    try {
      if (editingPackage) {
        await adminService.updatePackage(editingPackage.id, formData);
        showToast(t.packageUpdatedSuccess, 'success');
      } else {
        await adminService.createPackage(formData);
        showToast(t.packageCreatedSuccess, 'success');
      }
      setShowFormModal(false);
      fetchData();
    } catch (e: any) {
      if (e.status === 422 && e.errors) {
        setFormErrors(e.errors);
      } else {
        showToast(e.message || t.error, 'error');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await adminService.togglePackageActive(id);
      setPackages(prev =>
        prev.map(p => (p.id === id ? { ...p, is_active: !p.is_active } : p))
      );
      showToast(t.updatedSuccessfully, 'success');
    } catch (e) {
      showToast(t.error, 'error');
    }
  };

  const handleDeletePackage = async (id: number) => {
    if (!confirm(t.confirmAction)) return;
    try {
      const response = await adminService.deletePackage(id);
      if (response.status) {
        setPackages(prev => prev.filter(p => p.id !== id));
        showToast(t.packageDeletedSuccess, 'success');
      } else {
        showToast(response.message || t.error, 'error');
      }
    } catch (e: any) {
      showToast(e.message || t.error, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.packagesManagement}</h2>
        </div>
        <Button onClick={handleOpenAddModal} className="bg-primary hover:bg-primary/95 text-white flex items-center gap-2">
          <Plus size={18} />
          {t.addPackage}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12 text-slate-500">{t.noPackagesFound}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-slate-900">{pkg.name_ar || pkg.name_en}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    pkg.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {pkg.is_active ? t.statusActive : t.statusInactive}
                  </span>
                </div>
                <p className="text-sm text-slate-500 line-clamp-3 min-h-[60px]">{pkg.description_ar || pkg.description_en || t.na}</p>

                <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-3 text-sm">
                  <div>
                    <span className="block text-xs text-slate-400">{t.sessionsCount}</span>
                    <span className="font-bold text-slate-700">{pkg.sessions_count}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-400">{t.totalPriceSar}</span>
                    <span className="font-bold text-slate-700">{pkg.price} {t.sar}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs text-slate-400">{t.pricePerSessionSar}</span>
                    <span className="font-bold text-primary">{pkg.price_per_session} {t.sar}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-400">
                  {pkg.total_subscriptions !== undefined && (
                    <span>الاشتراكات: {pkg.total_subscriptions}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(pkg.id)}
                    className={`p-2 rounded-lg border transition-colors ${
                      pkg.is_active
                        ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                        : 'border-green-200 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {pkg.is_active ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(pkg)}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeletePackage(pkg.id)}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)} title={editingPackage ? t.editPackage : t.addPackage}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">{t.packageNameAr}</label>
              <input
                type="text"
                required
                value={formData.name_ar}
                onChange={e => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-sm"
              />
              {formErrors.name_ar && (
                <p className="text-xs text-red-500">{formErrors.name_ar[0]}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">{t.packageNameEn}</label>
              <input
                type="text"
                required
                value={formData.name_en}
                onChange={e => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-sm"
              />
              {formErrors.name_en && (
                <p className="text-xs text-red-500">{formErrors.name_en[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">{t.packageDescriptionAr}</label>
              <textarea
                value={formData.description_ar}
                onChange={e => setFormData(prev => ({ ...prev, description_ar: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-sm h-24 resize-none"
              />
              {formErrors.description_ar && (
                <p className="text-xs text-red-500">{formErrors.description_ar[0]}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">{t.packageDescriptionEn}</label>
              <textarea
                value={formData.description_en}
                onChange={e => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-sm h-24 resize-none"
              />
              {formErrors.description_en && (
                <p className="text-xs text-red-500">{formErrors.description_en[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">{t.sessionsCount}</label>
              <input
                type="number"
                required
                min={1}
                max={100}
                value={formData.sessions_count}
                onChange={e => setFormData(prev => ({ ...prev, sessions_count: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-sm"
              />
              {formErrors.sessions_count && (
                <p className="text-xs text-red-500">{formErrors.sessions_count[0]}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">{t.price}</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={formData.price}
                onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-sm"
              />
              {formErrors.price && (
                <p className="text-xs text-red-500">{formErrors.price[0]}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
              {t.activeStatus}
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFormModal(false)}
              className="flex-1"
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              isLoading={formSubmitting}
              className="flex-1 bg-primary text-white hover:bg-primary/95"
            >
              {t.save}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
