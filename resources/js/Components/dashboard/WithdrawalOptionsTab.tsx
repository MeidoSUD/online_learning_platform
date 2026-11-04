import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  CreditCard,
  Building,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  X,
  Smartphone,
  Check
} from 'lucide-react';
import { Button } from '../ui/Button';
import { teacherService, cardService, UserData } from '../../Services/api';

interface WithdrawalOptionsTabProps {
  user: UserData;
  onNavigate?: (tab: string) => void;
}

export const WithdrawalOptionsTab: React.FC<WithdrawalOptionsTabProps> = ({ user, onNavigate }) => {
  const { t, language, direction } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [digitalCards, setDigitalCards] = useState<any[]>([]);
  const [balance, setBalance] = useState<number>(0);

  const [isAddBankOpen, setIsAddBankOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [iban, setIban] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardBrand, setCardBrand] = useState('stc_pay');

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [banks, cards, wallet] = await Promise.all([
        teacherService.getBankAccounts().catch(() => []),
        cardService.getCards().catch(() => []),
        teacherService.getWallet().catch(() => null)
      ]);
      setBankAccounts(Array.isArray(banks) ? banks : []);
      setDigitalCards(Array.isArray(cards) ? cards : (cards?.data || []));
      setBalance(Number(wallet?.balance || user.current_balance || 0));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      await teacherService.addPaymentMethod({
        bank_name: bankName,
        account_name: accountName,
        account_number: iban,
        iban: iban,
      });
      setIsAddBankOpen(false);
      setBankName('');
      setAccountName('');
      setIban('');
      setActionSuccess(language === 'ar' ? 'تمت إضافة الحساب البنكي بنجاح' : 'Bank account added successfully');
      loadAll();
    } catch (err: any) {
      setActionError(err.message || (language === 'ar' ? 'فشل إضافة الحساب' : 'Failed to add bank'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDigitalCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      await cardService.addCard({
        card_number: cardNumber,
        holder_name: cardHolder,
        expiry: cardExpiry,
        brand: cardBrand,
      });
      setIsAddCardOpen(false);
      setCardNumber('');
      setCardHolder('');
      setCardExpiry('');
      setActionSuccess(language === 'ar' ? 'تمت إضافة بطاقة السحب الرقمية بنجاح' : 'Digital card added successfully');
      loadAll();
    } catch (err: any) {
      setActionError(err.message || (language === 'ar' ? 'فشل إضافة البطاقة' : 'Failed to add card'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBank = async (id: number) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا الحساب؟' : 'Delete this bank account?')) return;
    try {
      await teacherService.deletePaymentMethod(id);
      setBankAccounts(prev => prev.filter(b => b.id !== id));
    } catch {}
  };

  const handleDeleteCard = async (id: number) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه البطاقة؟' : 'Delete this card?')) return;
    try {
      await cardService.deleteCard(id);
      setDigitalCards(prev => prev.filter(c => c.id !== id));
    } catch {}
  };

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0 || amt > balance) {
      setActionError(language === 'ar' ? 'يرجى إدخال مبلغ سحب صالح لا يتجاوز الرصيد' : 'Invalid withdrawal amount');
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      await teacherService.withdraw({
        amount: amt,
        payment_method_id: selectedMethodId || undefined,
      });
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
      setActionSuccess(language === 'ar' ? 'تم تقديم طلب السحب بنجاح وسيتم تحويله قريباً' : 'Withdrawal request submitted successfully');
      loadAll();
    } catch (err: any) {
      setActionError(err.message || (language === 'ar' ? 'فشل إتمام طلب السحب' : 'Withdrawal failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CreditCard size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)]">
              {language === 'ar' ? 'خيارات وبطاقات السحب للمعلم' : 'Withdrawal Options & Cards'}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              {language === 'ar' ? 'إدارة الحسابات البنكية وبطاقات السحب الرقمية ومحافظ STC Pay' : 'Manage bank accounts, digital cards and STC Pay wallets'}
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsWithdrawOpen(true)}
          className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-10 px-5"
        >
          <DollarSign size={16} className="mr-1.5 inline" />
          {language === 'ar' ? 'طلب سحب أرباح' : 'Request Payout'}
        </Button>
      </div>

      <div className="bg-gradient-to-br from-[#002B36] to-[#034354] rounded-3xl p-6 text-white shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs text-white/70 block mb-1">
            {language === 'ar' ? 'الرصيد القابل للسحب حالياً' : 'Available Balance'}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#4ADE80]">{balance.toFixed(2)}</span>
            <span className="text-sm font-bold text-[#4ADE80]">{t.sar}</span>
          </div>
        </div>
        <div className="p-3 bg-white/10 rounded-2xl">
          <CreditCard size={28} className="text-[#4ADE80]" />
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle size={18} className="text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building size={18} className="text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">
              {language === 'ar' ? 'الحسابات البنكية المسجلة' : 'Registered Bank Accounts'}
            </h2>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddBankOpen(true)}
            className="rounded-xl text-xs font-bold border-slate-200"
          >
            <Plus size={14} className="mr-1 inline" />
            {language === 'ar' ? 'إضافة حساب بنكي' : 'Add Bank'}
          </Button>
        </div>

        {bankAccounts.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 text-slate-400 text-xs">
            {language === 'ar' ? 'لم تقم بإضافة أي حساب بنكي بعد.' : 'No bank accounts registered.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map((b) => (
              <div
                key={b.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <Building size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{b.bank_name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{b.account_name}</p>
                    <p className="text-xs font-mono text-slate-400 mt-1">{b.iban || b.account_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBank(b.id)}
                  className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone size={18} className="text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              {language === 'ar' ? 'بطاقات ومحافظ السحب الرقمية (STC Pay)' : 'Digital Withdrawal Cards & STC Pay'}
            </h2>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddCardOpen(true)}
            className="rounded-xl text-xs font-bold border-slate-200"
          >
            <Plus size={14} className="mr-1 inline" />
            {language === 'ar' ? 'إضافة بطاقة رقمية' : 'Add Card'}
          </Button>
        </div>

        {digitalCards.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 text-slate-400 text-xs">
            {language === 'ar' ? 'لم تقم بإضافة أي بطاقة سحب رقمية أو محفظة STC Pay.' : 'No digital cards added.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {digitalCards.map((c) => (
              <div
                key={c.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700">
                      {c.brand || 'STC Pay'}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm mt-1">{c.holder_name || user.first_name}</h4>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">**** **** **** {c.last_four || c.card_number?.slice(-4) || '****'}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCard(c.id)}
                  className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAddBankOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base">
                {language === 'ar' ? 'إضافة حساب بنكي جديد' : 'Add Bank Account'}
              </h3>
              <button onClick={() => setIsAddBankOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddBank} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">{language === 'ar' ? 'اسم البنك *' : 'Bank Name *'}</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: مصرف الراجحي، بنك الرياض' : 'e.g., Al Rajhi Bank'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">{language === 'ar' ? 'اسم صاحب الحساب *' : 'Account Holder Name *'}</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder={language === 'ar' ? 'الاسم الثلاثي كما يظهر في البنك' : 'Full Name'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">{language === 'ar' ? 'رقم الآيبان IBAN *' : 'IBAN Number *'}</label>
                <input
                  type="text"
                  required
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="SA0000000000000000000000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsAddBankOpen(false)} className="flex-1 rounded-xl text-xs">
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                  {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : (language === 'ar' ? 'حفظ الحساب' : 'Save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddCardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base">
                {language === 'ar' ? 'إضافة بطاقة رقمية / STC Pay' : 'Add Digital Card'}
              </h3>
              <button onClick={() => setIsAddCardOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDigitalCard} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">{language === 'ar' ? 'نوع المحفظة / البطاقة' : 'Card Brand'}</label>
                <select
                  value={cardBrand}
                  onChange={(e) => setCardBrand(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="stc_pay">STC Pay</option>
                  <option value="mada">Mada</option>
                  <option value="visa">Visa</option>
                  <option value="mastercard">MasterCard</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">{language === 'ar' ? 'اسم حامل البطاقة / رقم الجوال' : 'Holder / Mobile'}</label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: 05XXXXXXXX أو الاسم' : 'e.g. 05XXXXXXXX'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">{language === 'ar' ? 'رقم البطاقة' : 'Card Number'}</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="0000 0000 0000 0000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsAddCardOpen(false)} className="flex-1 rounded-xl text-xs">
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white">
                  {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : (language === 'ar' ? 'حفظ البطاقة' : 'Save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isWithdrawOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base">
                {language === 'ar' ? 'طلب سحب رصيد الأرباح' : 'Request Profit Payout'}
              </h3>
              <button onClick={() => setIsWithdrawOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRequestWithdrawal} className="p-6 space-y-4">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <span className="text-xs text-emerald-800 font-medium">{language === 'ar' ? 'الرصيد المتاح للسحب' : 'Available'}</span>
                <span className="text-lg font-black text-emerald-800">{balance.toFixed(2)} {t.sar}</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {language === 'ar' ? 'المبلغ المراد سحبه (ريال) *' : 'Amount to withdraw (SAR) *'}
                </label>
                <input
                  type="number"
                  required
                  max={balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="100"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {language === 'ar' ? 'اختر وسيلة الاستلام' : 'Receiving Method'}
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {bankAccounts.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedMethodId(b.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${
                        selectedMethodId === b.id ? 'bg-emerald-50 border-emerald-600 font-bold text-emerald-900' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{b.bank_name}</span>
                      <span className="font-mono text-[11px]">{b.iban ? b.iban.slice(0, 10) + '...' : ''}</span>
                    </div>
                  ))}
                  {digitalCards.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedMethodId(c.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${
                        selectedMethodId === c.id ? 'bg-emerald-50 border-emerald-600 font-bold text-emerald-900' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{c.brand || 'Digital Card'}</span>
                      <span className="font-mono text-[11px]">**** {c.last_four || ''}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsWithdrawOpen(false)} className="flex-1 rounded-xl text-xs">
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                  {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : (language === 'ar' ? 'تأكيد السحب' : 'Confirm Payout')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

