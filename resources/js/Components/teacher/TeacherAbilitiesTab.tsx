// =====================================================
// TeacherAbilitiesTab — Flutter parity
// (features/abilities/presentation/screens/abilities_manage_screen.dart)
// - عرض قدرات المعلم + حذف مع تأكيد
// - إضافة عبر حوار اختيار متعدد (يرسل الحالي + الجديد = مزامنة كاملة)
// =====================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Award, Plus, Trash2, Loader2, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { abilityService, authService, UserData } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';

interface Ability {
  id: number;
  name_en?: string;
  name_ar?: string;
  status?: number | boolean;
}

interface TeacherAbilitiesTabProps {
  user?: UserData;
}

export const TeacherAbilitiesTab: React.FC<TeacherAbilitiesTabProps> = ({ user }) => {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const isAr = language === 'ar';

  const [teacherAbilities, setTeacherAbilities] = useState<Ability[]>([]);
  const [allAbilities, setAllAbilities] = useState<Ability[]>([]);
  const [teacherId, setTeacherId] = useState<number | null>(user?.id ?? null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const getName = (a: Ability) => (isAr ? (a.name_ar || a.name_en) : (a.name_en || a.name_ar)) || '';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let tid = user?.id;
      if (!tid) {
        const res = await authService.getUserDetails();
        const u: UserData = res.user?.data || res.data || res;
        tid = u?.id;
      }
      if (!tid) throw new Error(isAr ? 'تعذر تحديد المستخدم' : 'User ID not found');
      setTeacherId(tid);

      const [all, mine] = await Promise.all([
        abilityService.getAll(),
        abilityService.getTeacherAbilities(tid),
      ]);
      setAllAbilities(Array.isArray(all) ? all : []);
      setTeacherAbilities(Array.isArray(mine) ? mine : []);
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || (isAr ? 'فشل تحميل القدرات' : 'Failed to load abilities'), 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
  }, [loadData]);

  const availableAbilities = allAbilities.filter((a) => !teacherAbilities.some((ta) => ta.id === a.id));

  const openAddDialog = () => {
    if (availableAbilities.length === 0) {
      showToast(isAr ? 'تمت إضافة جميع القدرات' : 'All abilities have been added', 'success');
      return;
    }
    setSelectedIds([]);
    setIsAddOpen(true);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // مثل فلاتر _addAbilities: يرسل الحالي + المحدد (مزامنة كاملة)
  const handleAddAbilities = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    try {
      const currentIds = teacherAbilities.map((a) => a.id);
      const updated = await abilityService.saveTeacherAbilities([...currentIds, ...selectedIds]);
      setTeacherAbilities(updated);
      setIsAddOpen(false);
      setSelectedIds([]);
      showToast(isAr ? 'تمت إضافة القدرات بنجاح' : 'Abilities added successfully', 'success');
    } catch (e: any) {
      showToast(e?.message || (isAr ? 'فشلت إضافة القدرات' : 'Failed to add abilities'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAbility = async (abilityId: number) => {
    setSaving(true);
    try {
      await abilityService.deleteTeacherAbility(abilityId);
      if (teacherId) {
        const updated = await abilityService.getTeacherAbilities(teacherId);
        setTeacherAbilities(updated);
      } else {
        setTeacherAbilities((prev) => prev.filter((a) => a.id !== abilityId));
      }
      setConfirmDeleteId(null);
      showToast(isAr ? 'تم حذف القدرة بنجاح' : 'Ability deleted successfully', 'success');
    } catch (e: any) {
      showToast(e?.message || (isAr ? 'فشل حذف القدرة' : 'Failed to delete ability'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="animate-spin text-primary h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[var(--text-main)]">
          {isAr ? 'إدارة القدرات' : 'Manage Abilities'}
        </h2>
        <Button onClick={openAddDialog}>
          <Plus size={18} className="mr-2" />
          {isAr ? 'إضافة قدرة' : 'Add Ability'}
        </Button>
      </div>

      {teacherAbilities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-[var(--radius-md)] border border-[var(--border)]">
          <Award className="mx-auto h-12 w-12 text-[var(--text-muted)] mb-3" />
          <p className="font-medium text-[var(--text-main)]">
            {isAr ? 'لا توجد قدرات مضافة بعد.' : 'No abilities added yet.'}
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {isAr ? 'أضف القدرات التي تتخصص بها.' : 'Add the abilities you specialize in.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
          {saving && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-[var(--radius-md)]">
              <Loader2 className="animate-spin text-primary h-8 w-8" />
            </div>
          )}
          {teacherAbilities.map((ability) => {
            const isConfirming = confirmDeleteId === ability.id;
            return (
              <div
                key={ability.id}
                className="bg-white p-4 rounded-[var(--radius-md)] border border-primary/30 shadow-[var(--shadow-sm)] flex justify-between items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                    <Award size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--text-main)] truncate">{ability.name_ar || getName(ability)}</p>
                    {ability.name_en && (
                      <p className="text-xs text-[var(--text-muted)] truncate">{ability.name_en}</p>
                    )}
                  </div>
                </div>
                {isConfirming ? (
                  <div className="flex gap-1 items-center shrink-0">
                    <span className="text-[10px] font-bold text-red-500 uppercase mr-1">
                      {isAr ? 'حذف؟' : 'Del?'}
                    </span>
                    <button
                      onClick={() => handleDeleteAbility(ability.id)}
                      className="h-8 w-8 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors"
                      title={isAr ? 'نعم' : 'Yes'}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="h-8 w-8 bg-[var(--light-bg)] text-[var(--text-muted)] rounded-lg flex items-center justify-center hover:bg-[var(--border)] transition-colors"
                      title={isAr ? 'لا' : 'No'}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(ability.id)}
                    className="text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-all p-2 rounded-full shrink-0"
                    title={isAr ? 'حذف القدرة' : 'Delete ability'}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* حوار الإضافة: اختيار متعدد مثل فلاتر */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={isAr ? 'إضافة القدرات' : 'Add Abilities'}
      >
        <div className="space-y-2 max-h-[40vh] overflow-y-auto py-1">
          {availableAbilities.map((ability) => {
            const selected = selectedIds.includes(ability.id);
            return (
              <button
                key={ability.id}
                type="button"
                onClick={() => toggleSelect(ability.id)}
                className="w-full flex items-center gap-4 px-2 py-3 rounded-xl hover:bg-[var(--light-bg)] transition-colors text-start"
              >
                <span
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    selected ? 'bg-primary border-primary' : 'border-[var(--border)]'
                  }`}
                >
                  {selected && <Check size={14} className="text-white" />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-[var(--text-main)]">{ability.name_ar || getName(ability)}</span>
                  {ability.name_en && (
                    <span className="block text-sm text-[var(--text-muted)]">{ability.name_en}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 pt-4">
          <Button variant="ghost" className="flex-1" onClick={() => setIsAddOpen(false)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button className="flex-1" onClick={handleAddAbilities} disabled={selectedIds.length === 0} isLoading={saving}>
            {isAr ? 'إضافة' : 'Add'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
