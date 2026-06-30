import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
    ArrowLeft, Building, Plus, Trash2, CheckCircle, Loader2,
    CreditCard, Globe, Hash, User, CheckSquare, Square
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { BankAccount, BankReference } from '../../Utils/types';
import { teacherService, referenceService, UserData } from '../../Services/api';

interface BankAccountsPageProps {
    user?: UserData;
    onNavigate?: (tab: string) => void;
}

export const BankAccountsPage: React.FC<BankAccountsPageProps> = ({ user, onNavigate }) => {
    const { t, language } = useLanguage();
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [availableBanks, setAvailableBanks] = useState<BankReference[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({
        bank_id: '',
        account_holder_name: '',
        account_number: '',
        iban: '',
        swift_code: '',
        is_default: false
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const banksList = await referenceService.getBanks().catch(() => []);
            setAvailableBanks(banksList);
            const accounts = await teacherService.getBankAccounts();
            setBankAccounts(Array.isArray(accounts) ? accounts : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({ bank_id: '', account_holder_name: '', account_number: '', iban: '', swift_code: '', is_default: false });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (acc: BankAccount) => {
        setForm({
            bank_id: String(acc.bank_id || ''),
            account_holder_name: acc.account_holder_name || '',
            account_number: acc.account_number || '',
            iban: acc.iban || '',
            swift_code: acc.swift_code || '',
            is_default: !!acc.is_default
        });
        setEditingId(acc.id);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.bank_id || !form.account_number || !form.iban || !form.account_holder_name) {
            alert(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
            return;
        }
        setSaving(true);
        try {
            const payload = { ...form, is_default: form.is_default ? 1 : 0 };
            if (editingId) {
                // update
                await teacherService.addPaymentMethod({ ...payload, id: editingId, _method: 'PUT' });
            } else {
                await teacherService.addPaymentMethod(payload);
            }
            await loadData();
            resetForm();
            alert(language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully');
        } catch (e: any) {
            alert(e.message || (language === 'ar' ? 'فشل الحفظ' : 'Save failed'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(language === 'ar' ? 'حذف هذا الحساب البنكي؟' : 'Delete this bank account?')) return;
        try {
            await teacherService.deletePaymentMethod(id);
            await loadData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleSetDefault = async (id: number) => {
        try {
            await teacherService.setDefaultPaymentMethod(id);
            await loadData();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header with back button */}
            <div className="flex items-center gap-4">
                {onNavigate && (
                    <button
                        onClick={() => onNavigate('wallet')}
                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all"
                    >
                        <ArrowLeft size={22} />
                    </button>
                )}
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{t.bankAccounts}</h2>
                    <p className="text-sm text-slate-500">{language === 'ar' ? 'إدارة حساباتك البنكية' : 'Manage your bank accounts'}</p>
                </div>
                <div className="ml-auto">
                    <Button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2">
                        <Plus size={18} /> {t.addBank}
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={32} /></div>
            ) : (
                <>
                    {/* Bank Accounts Grid */}
                    {bankAccounts.length === 0 && !showForm ? (
                        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <Building size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500 font-medium">{language === 'ar' ? 'لا توجد حسابات بنكية' : 'No bank accounts yet'}</p>
                            <p className="text-sm text-slate-400 mt-1">
                                {language === 'ar' ? 'أضف حساب بنكي لسحب أرباحك' : 'Add a bank account to withdraw your earnings'}
                            </p>
                            <Button onClick={() => setShowForm(true)} variant="outline" className="mt-4">
                                <Plus size={16} className="mr-2" /> {t.addBank}
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {bankAccounts.map(acc => {
                                const bankName = language === 'ar'
                                    ? (acc.banks?.name_ar || 'بنك')
                                    : (acc.banks?.name_en || 'Bank');
                                return (
                                    <div
                                        key={acc.id}
                                        className={`p-5 rounded-xl border transition-all group ${acc.is_default ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-slate-200 hover:border-primary/30'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${acc.is_default ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    <Building size={28} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-slate-900">{bankName}</h4>
                                                        {acc.is_default && (
                                                            <span className="text-blue-600"><CheckCircle size={16} /></span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-mono text-slate-500 mt-0.5">**** {acc.account_number?.slice(-4) || '****'}</p>
                                                    <p className="text-xs text-slate-400">{acc.account_holder_name}</p>
                                                    {acc.iban && <p className="text-[10px] text-slate-400 font-mono mt-0.5">IBAN: {acc.iban}</p>}
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!acc.is_default && (
                                                    <button
                                                        onClick={() => handleSetDefault(acc.id)}
                                                        className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600"
                                                        title={language === 'ar' ? 'تعيين افتراضي' : 'Set default'}
                                                    >
                                                        <CheckSquare size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(acc)}
                                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                                                    title={language === 'ar' ? 'تعديل' : 'Edit'}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(acc.id)}
                                                    className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"
                                                    title={language === 'ar' ? 'حذف' : 'Delete'}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Add/Edit Form */}
                    {showForm && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900">
                                    {editingId
                                        ? (language === 'ar' ? 'تعديل الحساب البنكي' : 'Edit Bank Account')
                                        : (language === 'ar' ? 'إضافة حساب بنكي جديد' : 'Add New Bank Account')}
                                </h3>
                                <button onClick={resetForm} className="text-sm text-slate-400 hover:text-slate-600">
                                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label={t.bankName}
                                    value={form.bank_id}
                                    onChange={(e) => setForm({ ...form, bank_id: e.target.value })}
                                    options={[
                                        { value: '', label: language === 'ar' ? '-- اختر البنك --' : '-- Select Bank --' },
                                        ...availableBanks.map(b => ({
                                            value: String(b.id),
                                            label: language === 'ar' ? b.name_ar : b.name_en
                                        }))
                                    ]}
                                />
                                <Input
                                    label={language === 'ar' ? 'اسم صاحب الحساب' : 'Account Holder Name'}
                                    placeholder={language === 'ar' ? 'الاسم الكامل كما في البنك' : 'Full Name as in Bank'}
                                    value={form.account_holder_name}
                                    onChange={(e) => setForm({ ...form, account_holder_name: e.target.value })}
                                />
                                <Input
                                    label={t.accountNumber}
                                    placeholder="1234567890"
                                    value={form.account_number}
                                    onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                                />
                                <Input
                                    label={t.iban}
                                    placeholder={t.phIBAN}
                                    value={form.iban}
                                    onChange={(e) => setForm({ ...form, iban: e.target.value })}
                                />
                                <Input
                                    label={t.swift}
                                    placeholder="SWIFTCODE"
                                    value={form.swift_code}
                                    onChange={(e) => setForm({ ...form, swift_code: e.target.value })}
                                />
                                <div className="flex items-center pt-6">
                                    <input
                                        type="checkbox"
                                        id="isDefault"
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                        checked={form.is_default}
                                        onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                                    />
                                    <label htmlFor="isDefault" className="ml-2 block text-sm text-slate-900">
                                        {language === 'ar' ? 'تعيين كحساب افتراضي' : 'Set as default payment method'}
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <Button variant="outline" onClick={resetForm} className="flex-1">
                                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button onClick={handleSave} isLoading={saving} className="flex-1">
                                    {saving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (editingId ? (language === 'ar' ? 'تحديث' : 'Update') : (language === 'ar' ? 'إضافة' : 'Add'))}
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
