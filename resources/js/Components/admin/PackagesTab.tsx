import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { adminService, SessionsPackage, AdminTeacherPackageApproval } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';
import { Plus, Edit2, Trash2, ShieldCheck, ShieldAlert, Loader2, Play, Pause } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export const PackagesTab: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'system' | 'teachers'>('system');
  
  const [packages, setPackages] = useState<SessionsPackage[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<AdminTeacherPackageApproval[]>([]);
  const [approvedTeachers, setApprovedTeachers] = useState<AdminTeacherPackageApproval[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SessionsPackage | null>(null);
  
  const [teacherTab, setTeacherTab] = useState<'pending' | 'approved'>('pending');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sessions_count: 5,
    total_price: 100,
    is_active: true
  });

  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'system') {
        const data = await adminService.getPackages();
        setPackages(data);
      } else {
        const [pending, approved] = await Promise.all([
          adminService.getPendingTeacherPackages(),
          adminService.getApprovedTeacherPackages()
        ]);
        setPendingTeachers(pending);
        setApprovedTeachers(approved);
      }
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
      name: '',
      description: '',
      sessions_count: 5,
      total_price: 100,
      is_active: true
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleOpenEditModal = (pkg: SessionsPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      sessions_count: pkg.sessions_count,
      total_price: pkg.total_price,
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

  const handleApproveTeacher = async (id: number) => {
    if (!confirm(t.confirmApproveTeacherPackages)) return;
    setActionLoadingId(id);
    try {
      await adminService.approveTeacherPackages(id);
      showToast(t.success, 'success');
      const teacher = pendingTeachers.find(t => t.id === id);
      if (teacher) {
        setPendingTeachers(prev => prev.filter(t => t.id !== id));
        setApprovedTeachers(prev => [...prev, { ...teacher, packages_approved: true, offer_packages: true }]);
      }
    } catch (e) {
      showToast(t.error, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevokeTeacher = async (id: number) => {
    if (!confirm(t.confirmRevokeTeacherPackages)) return;
    setActionLoadingId(id);
    try {
      await adminService.revokeTeacherPackages(id);
      showToast(t.success, 'success');
      const teacher = approvedTeachers.find(t => t.id === id);
      if (teacher) {
        setApprovedTeachers(prev => prev.filter(t => t.id !== id));
        setPendingTeachers(prev => [...prev, { ...teacher, packages_approved: false, offer_packages: false }]);
      }
    } catch (e) {
      showToast(t.error, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t.packagesManagement}</h2>
        </div>
        {activeSubTab === 'system' && (
          <Button onClick={handleOpenAddModal} className="bg-primary hover:bg-primary/95 text-white flex items-center gap-2">
            <Plus size={18} />
            {t.addPackage}
          </Button>
        )}
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('system')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeSubTab === 'system'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {t.packages}
        </button>
        <button
          onClick={() => setActiveSubTab('teachers')}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeSubTab === 'teachers'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {t.packagesApproval}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : activeSubTab === 'system' ? (
        packages.length === 0 ? (
          <div className="text-center py-12 text-slate-500">{t.noPackagesFound}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map(pkg => (
              <div key={pkg.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-slate-900">{pkg.name}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      pkg.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {pkg.is_active ? t.statusActive : t.statusInactive}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-3 min-h-[60px]">{pkg.description || t.na}</p>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 py-3 text-sm">
                    <div>
                      <span className="block text-xs text-slate-400">{t.sessionsCount}</span>
                      <span className="font-bold text-slate-700">{pkg.sessions_count}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-400">{t.totalPriceSar}</span>
                      <span className="font-bold text-slate-700">{pkg.total_price} {t.sar}</span>
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
        )
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex gap-4 border-b border-slate-100 pb-4">
            <button
              onClick={() => setTeacherTab('pending')}
              className={`pb-2 text-sm font-semibold transition-all ${
                teacherTab === 'pending'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.pendingTeacherPackages} ({pendingTeachers.length})
            </button>
            <button
              onClick={() => setTeacherTab('approved')}
              className={`pb-2 text-sm font-semibold transition-all ${
                teacherTab === 'approved'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.approvedTeacherPackages} ({approvedTeachers.length})
            </button>
          </div>

          <div className="overflow-x-auto">
            {teacherTab === 'pending' ? (
              pendingTeachers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">{t.noTeachersFound}</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-slate-700">{t.name}</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">{t.email}</th>
                      <th className="px-6 py-3 font-semibold text-slate-700 text-right">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingTeachers.map(teacher => (
                      <tr key={teacher.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-900">{teacher.name}</td>
                        <td className="px-6 py-4 text-slate-600">{teacher.email}</td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            isLoading={actionLoadingId === teacher.id}
                            onClick={() => handleApproveTeacher(teacher.id)}
                            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5 ml-auto"
                          >
                            <ShieldCheck size={16} />
                            {t.approve}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              approvedTeachers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">{t.noTeachersFound}</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-slate-700">{t.name}</th>
                      <th className="px-6 py-3 font-semibold text-slate-700">{t.email}</th>
                      <th className="px-6 py-3 font-semibold text-slate-700 text-right">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {approvedTeachers.map(teacher => (
                      <tr key={teacher.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-bold text-slate-900">{teacher.name}</td>
                        <td className="px-6 py-4 text-slate-600">{teacher.email}</td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={actionLoadingId === teacher.id}
                            onClick={() => handleRevokeTeacher(teacher.id)}
                            className="border-red-200 hover:bg-red-50 text-red-600 flex items-center gap-1.5 ml-auto"
                          >
                            <ShieldAlert size={16} />
                            {t.revoke}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      )}

      <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)} title={editingPackage ? t.editPackage : t.addPackage}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">{t.packageName}</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-sm"
            />
            {formErrors.name && (
              <p className="text-xs text-red-500">{formErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">{t.packageDescription}</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-sm h-24 resize-none"
            />
            {formErrors.description && (
              <p className="text-xs text-red-500">{formErrors.description[0]}</p>
            )}
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
              <label className="block text-sm font-semibold text-slate-700">{t.totalPriceSar}</label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={formData.total_price}
                onChange={e => setFormData(prev => ({ ...prev, total_price: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-primary text-sm"
              />
              {formErrors.total_price && (
                <p className="text-xs text-red-500">{formErrors.total_price[0]}</p>
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
