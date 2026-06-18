
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Wallet, ArrowDownLeft, ArrowUpRight, Plus, Trash2, Building, CheckCircle, Loader } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { BankAccount, BankReference, WalletResponse, Withdrawal } from '../../Utils/types';
import { teacherService, referenceService, UserData } from '../../Services/api';

interface WalletTabProps {
  user?: UserData;
}

export const WalletTab: React.FC<WalletTabProps> = ({ user }) => {
  const { t, language } = useLanguage();
  const [showAddBank, setShowAddBank] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  
  // Data
  const [myBankAccounts, setMyBankAccounts] = useState<BankAccount[]>([]);
  const [availableBanks, setAvailableBanks] = useState<BankReference[]>([]);
  const [walletData, setWalletData] = useState<WalletResponse | null>(null);
  
  // Forms
  const [bankForm, setBankForm] = useState({ 
    bank_id: '', 
    account_number: '', 
    iban: '', 
    swift_code: '', 
    account_holder_name: '',
    is_default: false
  });
  
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bankId: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      setInitLoading(true);
      
      try {
          // 1. Fetch Banks List (Reference)
          const banksList = await referenceService.getBanks().catch(() => []);
          setAvailableBanks(banksList);

          // 2. Fetch Wallet Data (Balance + Payouts)
          // api.ts now returns unwrapped data: { balance: ..., withdrawals: { data: [...] } }
          const wallet = await teacherService.getWallet();
          setWalletData(wallet);

          // 3. Fetch My Bank Accounts
          const accounts = await teacherService.getBankAccounts();
          
          if (Array.isArray(accounts)) {
              setMyBankAccounts(accounts);
          } else {
              setMyBankAccounts([]);
          }
      } catch (e) { 
          console.error("Failed to load wallet data:", e);
      } finally {
          setInitLoading(false);
      }
  };

  const handleAddBank = async () => {
      if (!bankForm.bank_id || !bankForm.account_number || !bankForm.iban || !bankForm.account_holder_name) {
          alert(language === 'ar' ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
          return;
      }

      setLoading(true);
      try {
          await teacherService.addPaymentMethod({
              ...bankForm,
              is_default: bankForm.is_default ? 1 : 0
          });
          
          await loadData(); 
          
          setShowAddBank(false);
          setBankForm({ 
            bank_id: '', 
            account_number: '', 
            iban: '', 
            swift_code: '', 
            account_holder_name: '',
            is_default: false 
          });
          alert(language === 'ar' ? "تم إضافة الحساب بنجاح" : "Bank account added successfully");
      } catch (e: any) {
          console.error("Add Bank Error:", e);
          alert(e.message || "Failed to add bank account");
      } finally {
          setLoading(false);
      }
  };

  const handleDeleteBank = async (id: number) => {
      if(!confirm("Delete this bank account?")) return;
      try {
          await teacherService.deletePaymentMethod(id);
          await loadData();
      } catch(e) { console.error(e); }
  };

  const handleSetDefault = async (id: number) => {
      try {
          await teacherService.setDefaultPaymentMethod(id);
          await loadData();
          alert(language === 'ar' ? "تم تعيين الحساب الافتراضي" : "Default account set successfully");
      } catch (e) {
          console.error(e);
      }
  }

  const handleWithdraw = async () => {
      if (!withdrawForm.amount || !withdrawForm.bankId) return;
      setLoading(true);
      try {
          // Payload matches request: { amount: number, payment_method_id: number }
          await teacherService.withdraw({
             amount: Number(withdrawForm.amount),
             payment_method_id: Number(withdrawForm.bankId)
          });
          
          alert(language === 'ar' ? "تم إرسال طلب السحب بنجاح" : "Withdrawal request submitted successfully");
          await loadData();
          
          setShowWithdraw(false);
          setWithdrawForm({ amount: '', bankId: '' });
      } catch(e: any) {
          console.error(e);
          alert(e.message || "Failed to request withdraw. Check your balance.");
      } finally {
          setLoading(false);
      }
  };

  const handleCancelWithdrawal = async (id: number) => {
      if(!confirm(language === 'ar' ? "هل أنت متأكد من إلغاء هذا الطلب؟" : "Are you sure you want to cancel this request?")) return;
      setLoading(true);
      try {
          await teacherService.cancelWithdrawal(id);
          await loadData();
          alert(language === 'ar' ? "تم إلغاء الطلب بنجاح" : "Request cancelled successfully");
      } catch(e: any) {
          console.error(e);
          alert(e.message || "Failed to cancel request");
      } finally {
          setLoading(false);
      }
  };

  if (initLoading) {
      return <div className="p-10 text-center"><div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  const displayBalance = walletData?.balance ?? user?.current_balance ?? 0;
  
  // FIX: Access withdrawals.data based on API JSON structure provided
  // Structure: { balance: ..., withdrawals: { data: [...], current_page: ... } }
  const displayWithdrawals = 
      walletData?.withdrawals?.data || 
      walletData?.payouts?.data || 
      [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-medium mb-2">{t.balance}</p>
            <h2 className="text-4xl font-bold mb-6">
              {Number(displayBalance).toFixed(2)} <span className="text-lg font-normal text-slate-400">{t.sar}</span>
            </h2>
            <div className="flex gap-3">
              <Button onClick={() => setShowWithdraw(true)} className="bg-primary hover:bg-primary/90 text-white border-0">
                <ArrowUpRight size={18} className="mr-2" /> {t.requestPayout}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
            <h3 className="text-slate-500 font-medium mb-4">{t.pending}</h3>
            <div className="text-2xl font-bold text-slate-900 mb-2">
               {displayWithdrawals
                   .filter((w: Withdrawal) => w.status === 'pending')
                   .reduce((sum: number, w: Withdrawal) => sum + Number(w.amount), 0).toFixed(2)} {t.sar}
            </div>
            <p className="text-xs text-slate-400">Payouts currently in processing</p>
        </div>
      </div>

      {/* Bank Accounts */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900">{t.bankAccounts}</h3>
          <Button variant="outline" onClick={() => setShowAddBank(true)}>
            <Plus size={16} className="mr-2" /> {t.addBank}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myBankAccounts.map((acc) => {
             const bankName = acc.bank_name || (language === 'ar' ? (acc.banks?.name_ar || "Bank") : (acc.banks?.name_en || "Bank"));
             
             return (
              <div key={acc.id} className={`p-5 rounded-xl border transition-all relative group ${acc.is_default ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${acc.is_default ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Building size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{bankName}</h4>
                      <p className="text-sm text-slate-500 font-mono mt-1">**** {acc.account_number.slice(-4)}</p>
                      <p className="text-xs text-slate-400 mt-1">{acc.account_holder_name}</p>
                    </div>
                  </div>
                  {acc.is_default ? (
                    <span className="text-blue-600">
                      <CheckCircle size={20} />
                    </span>
                  ) : (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                          onClick={() => handleSetDefault(acc.id)}
                          className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600"
                       >
                          Set Default
                       </button>
                       <button onClick={() => handleDeleteBank(acc.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={18} />
                       </button>
                    </div>
                  )}
                </div>
              </div>
             );
          })}
          
          {myBankAccounts.length === 0 && (
              <div className="col-span-full text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                  No bank accounts added yet.
              </div>
          )}
        </div>
      </div>

      {/* Transactions History */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">{t.history}</h3>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-3 font-semibold text-slate-700">Description</th>
                  <th className="px-6 py-3 font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayWithdrawals.length === 0 && (
                     <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                            No withdrawal history found.
                        </td>
                    </tr>
                )}
                {displayWithdrawals.map((tx: Withdrawal) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-slate-600">
                        {new Date(tx.requested_at || tx.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                        Withdrawal to {language === 'ar' ? tx.payment_method?.banks?.name_ar : tx.payment_method?.banks?.name_en || 'Bank'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === 'completed' || tx.status === 'approved' ? 'bg-green-100 text-green-800' :
                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                            <span className="font-bold text-slate-900">-{tx.amount} {t.sar}</span>
                            {tx.status === 'pending' && (
                                <button 
                                    onClick={() => handleCancelWithdrawal(tx.id)}
                                    className="text-xs text-red-500 hover:underline"
                                >
                                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                </button>
                            )}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showAddBank} onClose={() => setShowAddBank(false)} title={t.addBank}>
        <div className="space-y-4">
          <Select
            label={t.bankName}
            value={bankForm.bank_id}
            onChange={(e) => setBankForm({...bankForm, bank_id: e.target.value})}
            options={[
                { value: '', label: language === 'ar' ? '-- اختر البنك --' : '-- Select Bank --' },
                ...availableBanks.map(bank => ({
                    value: String(bank.id),
                    label: language === 'ar' ? bank.name_ar : bank.name_en
                }))
            ]}
          />
          
          <Input 
            label={t.cardHolder}
            placeholder="Full Name as in Bank"
            value={bankForm.account_holder_name}
            onChange={(e) => setBankForm({...bankForm, account_holder_name: e.target.value})}
          />

          <Input 
            label={t.accountNumber}
            placeholder="1234567890"
            value={bankForm.account_number}
            onChange={(e) => setBankForm({...bankForm, account_number: e.target.value})}
          />
          
          <Input 
            label={t.iban}
            placeholder={t.phIBAN}
            value={bankForm.iban}
            onChange={(e) => setBankForm({...bankForm, iban: e.target.value})}
          />
          
          <Input 
            label={t.swift}
            placeholder="SWIFTCODE"
            value={bankForm.swift_code}
            onChange={(e) => setBankForm({...bankForm, swift_code: e.target.value})}
          />

          <div className="flex items-center">
            <input 
                type="checkbox" 
                id="isDefault" 
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                checked={bankForm.is_default}
                onChange={(e) => setBankForm({...bankForm, is_default: e.target.checked})}
            />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-slate-900">Set as default payment method</label>
          </div>

          <div className="pt-2">
            <Button className="w-full" onClick={handleAddBank} isLoading={loading}>
              {t.addBank}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} title={t.requestPayout}>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg mb-4">
            <p className="text-sm text-blue-700">Available Balance: <strong>{Number(displayBalance).toFixed(2)} {t.sar}</strong></p>
          </div>
          
          <Input 
            label={t.withdrawAmount}
            type="number"
            placeholder="0.00"
            value={withdrawForm.amount}
            onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
          />
          
          <Select 
            label={t.selectBank}
            options={[
                { value: '', label: '-- Select --' },
                ...myBankAccounts.map(acc => ({ 
                    value: String(acc.id), 
                    label: `${acc.bank_name || (language === 'ar' ? acc.banks?.name_ar : acc.banks?.name_en)} (****${acc.account_number.slice(-4)})`
                }))
            ]}
            value={withdrawForm.bankId}
            onChange={(e) => setWithdrawForm({...withdrawForm, bankId: e.target.value})}
          />
          
          <div className="pt-2">
             <Button className="w-full" onClick={handleWithdraw} isLoading={loading}>
                {t.submitRequest}
             </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
