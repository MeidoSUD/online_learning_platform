import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  Download,
  Check,
  X,
  CreditCard,
  Building2,
  Smartphone,
  Plus,
  Coins,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  AlertTriangle
} from 'lucide-react';
import { BankAccount, BankReference, WalletResponse, Withdrawal } from '../../Utils/types';
import { teacherService, referenceService, UserData } from '../../Services/api';

interface WalletTabProps {
  user?: UserData;
  onNavigate?: (tab: string) => void;
}

export const WalletTab: React.FC<WalletTabProps> = ({ user, onNavigate }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [initLoading, setInitLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletData, setWalletData] = useState<WalletResponse | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState<'form' | 'status'>('form');
  const [withdrawStatusSuccess, setWithdrawStatusSuccess] = useState(true);
  const [withdrawStatusError, setWithdrawStatusError] = useState('');

  const [methodsLoading, setMethodsLoading] = useState(false);
  const [withdrawalMethods, setWithdrawalMethods] = useState<{ isBankAccountActive: boolean; isCardActive: boolean }>({
    isBankAccountActive: true,
    isCardActive: true,
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [availableBanks, setAvailableBanks] = useState<BankReference[]>([]);

  const [selectedMethod, setSelectedMethod] = useState<'bank' | 'card' | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  const [showAddBank, setShowAddBank] = useState(false);
  const [bankForm, setBankForm] = useState({
    bank_id: '',
    account_holder_name: '',
    account_number: '',
    iban: '',
  });
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);

  const [showAddCard, setShowAddCard] = useState(false);
  const [cardFormType, setCardFormType] = useState<'stc_pay' | 'bank_account'>('stc_pay');
  const [cardFormPhone, setCardFormPhone] = useState('');
  const [cardFormIban, setCardFormIban] = useState('');
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setInitLoading(true);
    }

    try {
      const [walletRes, methodsRes, bankAccountsRes, cardsRes, banksList] = await Promise.all([
        teacherService.getWallet().catch(() => null),
        teacherService.getWithdrawalMethods().catch(() => ({ isBankAccountActive: true, isCardActive: true })),
        teacherService.getBankAccounts().catch(() => []),
        teacherService.getWithdrawalCards().catch(() => []),
        referenceService.getBanks().catch(() => []),
      ]);

      setWalletData(walletRes);

      if (methodsRes) {
        const isBankActive = methodsRes.isBankAccountActive ?? methodsRes.bank_account ?? true;
        const isCardActive = methodsRes.isCardActive ?? methodsRes.card ?? true;
        setWithdrawalMethods({
          isBankAccountActive: Boolean(isBankActive),
          isCardActive: Boolean(isCardActive),
        });
      }

      setBankAccounts(Array.isArray(bankAccountsRes) ? bankAccountsRes : []);
      const parsedCards = Array.isArray(cardsRes) ? cardsRes : (cardsRes?.data || []);
      setCards(parsedCards);
      setAvailableBanks(Array.isArray(banksList) ? banksList : []);
    } catch (e) {
      console.error(e);
    } finally {
      setInitLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableBalance = useMemo(() => {
    if (walletData?.total_balance !== undefined && walletData?.total_balance !== null) {
      return Number(walletData.total_balance);
    }
    const bal = Number(walletData?.balance ?? user?.current_balance ?? 0);
    const pend = Number((walletData as any)?.pending_balance ?? 0);
    return bal + pend;
  }, [walletData, user]);

  const withdrawableBalance = useMemo(() => {
    return Number(walletData?.balance ?? user?.current_balance ?? 0);
  }, [walletData, user]);

  const pendingBalance = useMemo(() => {
    return Number((walletData as any)?.pending_balance ?? 0);
  }, [walletData]);

  const withdrawalsList: Withdrawal[] = useMemo(() => {
    const raw = walletData?.withdrawals;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray((raw as any).data)) return (raw as any).data;
    const payouts = walletData?.payouts;
    if (payouts && Array.isArray(payouts.data)) return payouts.data;
    return [];
  }, [walletData]);

  const weeklyData = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0];
    const now = new Date();
    withdrawalsList.forEach((w) => {
      const dateStr = w.requested_at || w.created_at;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 6) {
        counts[5 - diffDays] += Number(w.amount) || 1;
      }
    });
    const hasAny = counts.some((c) => c > 0);
    if (!hasAny) {
      return [10, 20, 40, 60, 30, 0];
    }
    return counts;
  }, [withdrawalsList]);

  const handleCancelWithdrawal = async (id: number) => {
    setCancellingId(id);
    try {
      await teacherService.cancelWithdrawal(id);
      await loadData(true);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || (isAr ? 'فشل إلغاء طلب السحب' : 'Failed to cancel withdrawal'));
    } finally {
      setCancellingId(null);
    }
  };

  const handleOpenWithdraw = () => {
    setSelectedMethod(null);
    setSelectedBankId(null);
    setSelectedCardId(null);
    setWithdrawAmount('');
    setWithdrawStep('form');
    setWithdrawStatusError('');
    setShowAddBank(false);
    setShowAddCard(false);
    setShowWithdraw(true);
  };

  const handleSelectMethod = (method: 'bank' | 'card') => {
    setSelectedMethod(method);
    setSelectedBankId(null);
    setSelectedCardId(null);
    setShowAddBank(false);
    setShowAddCard(false);
  };

  const handleSubmitWithdraw = async () => {
    const numericAmount = parseFloat(withdrawAmount);
    if (isNaN(numericAmount) || numericAmount < 10) {
      setWithdrawStatusSuccess(false);
      setWithdrawStatusError(isAr ? 'الحد الأدنى للسحب هو 10 ريال سعودي' : 'Minimum withdrawal is 10 SAR');
      setWithdrawStep('status');
      return;
    }

    if (numericAmount > withdrawableBalance) {
      setWithdrawStatusSuccess(false);
      setWithdrawStatusError(isAr ? 'المبلغ المطلوب أكبر من الرصيد القابل للسحب' : 'Amount exceeds withdrawable balance');
      setWithdrawStep('status');
      return;
    }

    if (selectedMethod === 'bank' && !selectedBankId) {
      setWithdrawStatusSuccess(false);
      setWithdrawStatusError(isAr ? 'يرجى اختيار حساب بنكي لاستلام الأرباح' : 'Please select a bank account');
      setWithdrawStep('status');
      return;
    }

    if (selectedMethod === 'card' && !selectedCardId) {
      setWithdrawStatusSuccess(false);
      setWithdrawStatusError(isAr ? 'يرجى اختيار بطاقة سحب لاستلام الأرباح' : 'Please select a withdrawal card');
      setWithdrawStep('status');
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      const payload: any = { amount: numericAmount };
      if (selectedMethod === 'bank') {
        payload.payment_method_id = selectedBankId;
      } else {
        payload.card_id = selectedCardId;
      }

      await teacherService.withdraw(payload);
      setWithdrawStatusSuccess(true);
      setWithdrawStatusError('');
      setWithdrawStep('status');
      await loadData(true);
    } catch (e: any) {
      setWithdrawStatusSuccess(false);
      setWithdrawStatusError(
        e?.message ||
        (isAr
          ? 'لم نتمكن من إتمام عملية السحب. يرجى المحاولة مرة أخرى، أو التحقق من البيانات'
          : 'Failed to complete withdrawal. Please try again.')
      );
      setWithdrawStep('status');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.bank_id || !bankForm.account_holder_name || !bankForm.account_number || !bankForm.iban) {
      alert(isAr ? 'يرجى ملء كافة الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    setIsSubmittingBank(true);
    try {
      await teacherService.addPaymentMethod({
        bank_id: Number(bankForm.bank_id),
        account_holder_name: bankForm.account_holder_name.trim(),
        account_number: bankForm.account_number.trim(),
        iban: bankForm.iban.trim().toUpperCase(),
        is_default: bankAccounts.length === 0,
      });

      const updatedAccounts = await teacherService.getBankAccounts();
      const accountsList = Array.isArray(updatedAccounts) ? updatedAccounts : [];
      setBankAccounts(accountsList);

      const latest = accountsList[accountsList.length - 1];
      if (latest) {
        setSelectedBankId(latest.id);
      }

      setShowAddBank(false);
      setBankForm({ bank_id: '', account_holder_name: '', account_number: '', iban: '' });
    } catch (e: any) {
      console.error(e);
      alert(e?.message || (isAr ? 'فشل إضافة الحساب البنكي' : 'Failed to add bank account'));
    } finally {
      setIsSubmittingBank(false);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardFormType === 'stc_pay' && !cardFormPhone.trim()) {
      alert(isAr ? 'يرجى إدخال رقم هاتف STC Pay' : 'Please enter STC Pay phone number');
      return;
    }
    if (cardFormType === 'bank_account' && !cardFormIban.trim()) {
      alert(isAr ? 'يرجى إدخال رقم الآيبان' : 'Please enter IBAN');
      return;
    }

    setIsSubmittingCard(true);
    try {
      const payload: any = {
        type: 'card',
        card_type: cardFormType,
        withdrawal_type: cardFormType,
        is_default: cards.length === 0,
        details: cardFormType === 'stc_pay'
          ? { phone_number: cardFormPhone.trim() }
          : { iban: cardFormIban.trim().toUpperCase() },
      };

      await teacherService.addWithdrawalCard(payload);
      const updatedCards = await teacherService.getWithdrawalCards();
      const cardList = Array.isArray(updatedCards) ? updatedCards : (updatedCards?.data || []);
      setCards(cardList);

      const latest = cardList[cardList.length - 1];
      if (latest) {
        setSelectedCardId(latest.id);
      }

      setShowAddCard(false);
      setCardFormPhone('');
      setCardFormIban('');
    } catch (e: any) {
      console.error(e);
      alert(e?.message || (isAr ? 'فشل إضافة بطاقة السحب' : 'Failed to add card'));
    } finally {
      setIsSubmittingCard(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${hours}:${minutes} ${year}/${month}/${day}`;
  };

  const dayLabels = isAr
    ? ['خم', 'ار', 'ثل', 'اث', 'اح', 'سب']
    : ['Th', 'We', 'Tu', 'Mo', 'Su', 'Sa'];

  const maxVal = Math.max(1, ...weeklyData);

  if (initLoading) {
    return (
      <div className="min-h-[350px] flex items-center justify-center">
        <div className="animate-spin w-9 h-9 border-4 border-[#5B9F48] border-t-transparent rounded-full" />
      </div>
    );
  }

  const canWithdraw = withdrawableBalance > 0;

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto pb-12 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0D4A5F]">
            {isAr ? 'المحفظة' : 'Wallet'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('withdrawal-options')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-[#0D4A5F] hover:bg-slate-50 transition shadow-sm"
            >
              <SlidersHorizontal size={14} className="text-[#5B9F48]" />
              <span>{isAr ? 'خيارات وطرق السحب' : 'Withdrawal Options'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-[#5B9F48]' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-slate-100">
        <div className="flex items-center justify-between gap-4">
          <div className="w-[140px] sm:w-[160px] h-[64px] flex items-end justify-between">
            {dayLabels.map((day, idx) => {
              const val = idx < weeklyData.length ? weeklyData[idx] : 0;
              const ratio = Math.max(0.12, Math.min(1.0, val / maxVal));
              const barHeight = Math.round(36 * ratio);

              return (
                <div key={idx} className="flex flex-col items-center justify-end h-full">
                  <div
                    style={{ height: `${barHeight}px` }}
                    className={`w-[12px] rounded-[3px] transition-all duration-300 ${
                      val > 0 ? 'bg-[#B4D584]' : 'bg-[#E6E6E6]'
                    }`}
                  />
                  <span className="text-[10px] text-[#0D4A5F] font-medium mt-1 leading-none">
                    {day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-end">
            <span className="text-xs sm:text-sm text-[#738989] font-medium block">
              {isAr ? 'الرصيد المتاح' : 'Available Balance'}
            </span>
            <div className="flex items-baseline justify-end gap-1.5 mt-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#0D4A5F] tracking-tight">
                {availableBalance.toFixed(0)}
              </span>
              <span className="text-lg sm:text-xl font-bold text-[#738989]">
                ﷼
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-1 font-bold text-[#171717]">
              <span>{withdrawableBalance.toFixed(0)}</span>
              <span className="text-xs text-[#738989] font-normal">﷼</span>
            </div>
            <span className="text-[#738989] font-medium">
              {isAr ? 'الرصيد القابل للسحب' : 'Withdrawable Balance'}
            </span>
          </div>

          <div className="border-b border-dashed border-[#E6E6E6]" />

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-1 font-bold text-[#171717]">
              <span>{pendingBalance.toFixed(0)}</span>
              <span className="text-xs text-[#738989] font-normal">﷼</span>
            </div>
            <span className="text-[#738989] font-medium">
              {isAr ? 'الرصيد المعلق' : 'Pending Balance'}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleOpenWithdraw}
            disabled={!canWithdraw}
            className={`w-full h-12 rounded-[14px] font-semibold text-sm sm:text-base flex items-center justify-center gap-2 transition duration-200 shadow-sm ${
              canWithdraw
                ? 'bg-[#0D4A5F] hover:bg-[#093544] text-white active:scale-[0.99]'
                : 'bg-[#E5EBEA] text-[#738989] cursor-not-allowed'
            }`}
          >
            <Coins size={20} className={canWithdraw ? 'text-white' : 'text-[#738989]'} />
            <span>{isAr ? 'سحب الأرباح' : 'Withdraw Profits'}</span>
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[#738989] mb-3">
          {isAr ? 'المعاملات الأخيرة' : 'Recent Transactions'}
        </h2>

        {withdrawalsList.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-24 h-24 rounded-[28px] bg-[#D6EAE7] flex items-center justify-center mx-auto mb-4">
              <Download size={40} className="text-[#0D4A5F]" />
            </div>
            <p className="text-base font-semibold text-[#0D4A5F]">
              {isAr ? 'لا توجد معاملات' : 'No transactions'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawalsList.map((item) => {
              const statusStr = String(item.status || '').toLowerCase();
              const isPending = statusStr.includes('pending') || statusStr.includes('قيد الانتظار') || statusStr === '1';
              const isCancelled = statusStr.includes('cancel') || statusStr.includes('ملغي') || statusStr === '3';
              const isFailed = statusStr.includes('failed') || statusStr.includes('فشل') || statusStr === '4';

              let statusTitle = isAr ? 'سحب (تم الإيداع)' : 'Withdrawal (Deposited)';
              let statusColor = '#059669';
              let badgeBg = '#D1FAE5';

              if (isPending) {
                statusTitle = isAr ? 'سحب (قيد الانتظار)' : 'Withdrawal (Pending)';
                statusColor = '#D97706';
                badgeBg = '#FEF3C7';
              } else if (isCancelled) {
                statusTitle = isAr ? 'سحب (ملغي)' : 'Withdrawal (Cancelled)';
                statusColor = '#DC2626';
                badgeBg = '#FEE2E2';
              } else if (isFailed) {
                statusTitle = isAr ? 'سحب (فشل التحويل)' : 'Withdrawal (Failed)';
                statusColor = '#DC2626';
                badgeBg = '#FEE2E2';
              }

              const formattedDate = formatDate(item.requested_at || item.created_at);
              const numericAmount = parseFloat(String(item.amount || '0')) || 0;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-[18px] p-4 sm:p-5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-baseline gap-1 font-bold text-base sm:text-lg" style={{ color: statusColor }}>
                      <span>{numericAmount.toFixed(0)}</span>
                      <span className="text-xs font-normal">﷼</span>
                    </div>

                    <div className="flex items-center gap-3 text-end">
                      <div>
                        <div className="text-xs sm:text-sm font-semibold" style={{ color: statusColor }}>
                          {statusTitle}
                        </div>
                        <div className="text-[11px] text-[#738989] mt-0.5 font-mono">
                          {formattedDate}
                        </div>
                      </div>

                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: badgeBg, color: statusColor }}
                      >
                        {isPending ? (
                          <Download size={18} />
                        ) : isCancelled || isFailed ? (
                          <X size={18} />
                        ) : (
                          <Check size={18} />
                        )}
                      </div>
                    </div>
                  </div>

                  {isPending && (
                    <div className="mt-3 pt-3 border-t border-slate-50">
                      <button
                        type="button"
                        onClick={() => handleCancelWithdrawal(item.id)}
                        disabled={cancellingId === item.id}
                        className="w-full h-10 rounded-xl bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#E11D48] text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {cancellingId === item.id ? (
                          <div className="w-4 h-4 border-2 border-[#E11D48] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span>{isAr ? 'إلغاء عملية السحب' : 'Cancel Withdrawal'}</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-[28px] p-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            {withdrawStep === 'form' ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-[#0D4A5F]">
                    {isAr ? 'سحب الأرباح' : 'Withdraw Profits'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowWithdraw(false)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-[#A3CF73] rounded-2xl p-4 flex items-center justify-between text-[#0D4A5F]">
                  <div className="flex items-baseline gap-1 font-bold text-xl sm:text-2xl">
                    <span>{withdrawableBalance.toFixed(0)}</span>
                    <span className="text-sm font-semibold">﷼</span>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold">
                    {isAr ? 'الرصيد القابل للسحب' : 'Withdrawable Balance'}
                  </span>
                </div>

                <div>
                  <div className="mb-2">
                    <h4 className="text-sm font-bold text-[#171717]">
                      {isAr ? 'خيارات السحب' : 'Withdrawal Options'}
                    </h4>
                    <p className="text-xs text-[#738989] mt-0.5">
                      {isAr
                        ? 'اختر الطريقة أولاً ثم اختر الحساب أو البطاقة'
                        : 'Select method first, then choose account or card'}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div
                      onClick={() => withdrawalMethods.isBankAccountActive && handleSelectMethod('bank')}
                      className={`p-3.5 rounded-2xl border transition duration-200 flex items-center justify-between ${
                        !withdrawalMethods.isBankAccountActive
                          ? 'opacity-60 bg-[#F3F4F5] border-[#E6E6E6] cursor-not-allowed'
                          : selectedMethod === 'bank'
                          ? 'bg-[#5B9F48]/10 border-[#5B9F48] cursor-pointer'
                          : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#5B9F48] flex items-center justify-center">
                          <Building2 size={20} />
                        </div>
                        <span className="text-sm font-semibold text-[#171717]">
                          {isAr ? 'حساب بنكي' : 'Bank Account'}
                        </span>
                      </div>

                      {!withdrawalMethods.isBankAccountActive ? (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-[#738989] font-medium">
                          {isAr ? 'غير متاح' : 'Unavailable'}
                        </span>
                      ) : selectedMethod === 'bank' ? (
                        <div className="w-6 h-6 rounded-full bg-[#5B9F48] text-white flex items-center justify-center">
                          <Check size={14} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-300" />
                      )}
                    </div>

                    <div
                      onClick={() => withdrawalMethods.isCardActive && handleSelectMethod('card')}
                      className={`p-3.5 rounded-2xl border transition duration-200 flex items-center justify-between ${
                        !withdrawalMethods.isCardActive
                          ? 'opacity-60 bg-[#F3F4F5] border-[#E6E6E6] cursor-not-allowed'
                          : selectedMethod === 'card'
                          ? 'bg-[#5B9F48]/10 border-[#5B9F48] cursor-pointer'
                          : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#5B9F48] flex items-center justify-center">
                          <CreditCard size={20} />
                        </div>
                        <span className="text-sm font-semibold text-[#171717]">
                          {isAr ? 'بطاقات ومحافظ السحب' : 'Withdrawal Cards'}
                        </span>
                      </div>

                      {!withdrawalMethods.isCardActive ? (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-[#738989] font-medium">
                          {isAr ? 'غير متاح' : 'Unavailable'}
                        </span>
                      ) : selectedMethod === 'card' ? (
                        <div className="w-6 h-6 rounded-full bg-[#5B9F48] text-white flex items-center justify-center">
                          <Check size={14} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-300" />
                      )}
                    </div>
                  </div>
                </div>

                {selectedMethod === 'bank' && (
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-[#0D4A5F]">
                        {isAr ? 'قائمة الحسابات البنكية' : 'Bank Accounts List'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAddBank(!showAddBank)}
                        className="text-xs font-semibold text-[#5B9F48] hover:underline flex items-center gap-1"
                      >
                        <Plus size={14} />
                        <span>{isAr ? 'إضافة حساب بنكي جديد' : 'Add New Bank Account'}</span>
                      </button>
                    </div>

                    {showAddBank && (
                      <form onSubmit={handleCreateBank} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-fade-in">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {isAr ? 'اختر البنك' : 'Select Bank'}
                          </label>
                          <select
                            value={bankForm.bank_id}
                            onChange={(e) => setBankForm({ ...bankForm, bank_id: e.target.value })}
                            required
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                          >
                            <option value="">{isAr ? '-- اختر البنك --' : '-- Select Bank --'}</option>
                            {availableBanks.map((b) => (
                              <option key={b.id} value={b.id}>
                                {isAr ? (b.name_ar || b.name) : (b.name_en || b.name)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            {isAr ? 'اسم صاحب الحساب' : 'Account Holder Name'}
                          </label>
                          <input
                            type="text"
                            value={bankForm.account_holder_name}
                            onChange={(e) => setBankForm({ ...bankForm, account_holder_name: e.target.value })}
                            required
                            placeholder={isAr ? 'الاسم الثلاثي' : 'Full Name'}
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {isAr ? 'رقم الحساب' : 'Account Number'}
                            </label>
                            <input
                              type="text"
                              value={bankForm.account_number}
                              onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
                              required
                              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {isAr ? 'رقم الآيبان (IBAN)' : 'IBAN'}
                            </label>
                            <input
                              type="text"
                              value={bankForm.iban}
                              onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                              required
                              placeholder="SA..."
                              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none font-mono uppercase"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            type="submit"
                            disabled={isSubmittingBank}
                            className="flex-1 py-2 bg-[#5B9F48] hover:bg-[#4d863d] text-white text-xs font-bold rounded-xl transition"
                          >
                            {isSubmittingBank ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ الحساب' : 'Save')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddBank(false)}
                            className="px-3 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                          >
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>
                        </div>
                      </form>
                    )}

                    {bankAccounts.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-[#738989]">
                        {isAr ? 'لا توجد حسابات بنكية مضافة' : 'No bank accounts added'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {bankAccounts.map((acc) => {
                          const isSelected = selectedBankId === acc.id;
                          const bankName = isAr
                            ? (acc.banks?.name_ar || acc.bank_name || 'حساب بنكي')
                            : (acc.banks?.name_en || acc.bank_name || 'Bank Account');
                          const subtitle = acc.iban || acc.account_number;

                          return (
                            <div
                              key={acc.id}
                              onClick={() => setSelectedBankId(acc.id)}
                              className={`p-3 rounded-2xl border transition duration-200 flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-[#5B9F48]/10 border-[#5B9F48]'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#5B9F48] flex items-center justify-center">
                                  <Building2 size={18} />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-[#171717]">
                                    {bankName}
                                  </div>
                                  <div className="text-[11px] text-[#738989] font-mono">
                                    {subtitle}
                                  </div>
                                </div>
                              </div>

                              {isSelected ? (
                                <div className="w-5 h-5 rounded-full bg-[#5B9F48] text-white flex items-center justify-center">
                                  <Check size={12} />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-slate-300" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {selectedMethod === 'card' && (
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-[#0D4A5F]">
                        {isAr ? 'قائمة البطاقات والمحافظ' : 'Cards List'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAddCard(!showAddCard)}
                        className="text-xs font-semibold text-[#5B9F48] hover:underline flex items-center gap-1"
                      >
                        <Plus size={14} />
                        <span>{isAr ? 'إضافة بطاقة جديدة' : 'Add New Card'}</span>
                      </button>
                    </div>

                    {showAddCard && (
                      <form onSubmit={handleCreateCard} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-fade-in">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setCardFormType('stc_pay')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                              cardFormType === 'stc_pay' ? 'bg-[#5B9F48] text-white' : 'bg-white border text-slate-600'
                            }`}
                          >
                            STC Pay
                          </button>
                          <button
                            type="button"
                            onClick={() => setCardFormType('bank_account')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                              cardFormType === 'bank_account' ? 'bg-[#5B9F48] text-white' : 'bg-white border text-slate-600'
                            }`}
                          >
                            {isAr ? 'آيبان' : 'IBAN'}
                          </button>
                        </div>

                        {cardFormType === 'stc_pay' ? (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {isAr ? 'رقم هاتف STC Pay' : 'STC Pay Phone'}
                            </label>
                            <input
                              type="tel"
                              value={cardFormPhone}
                              onChange={(e) => setCardFormPhone(e.target.value)}
                              required
                              placeholder="05xxxxxxxx"
                              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none font-mono"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {isAr ? 'رقم الآيبان (IBAN)' : 'IBAN'}
                            </label>
                            <input
                              type="text"
                              value={cardFormIban}
                              onChange={(e) => setCardFormIban(e.target.value)}
                              required
                              placeholder="SA..."
                              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white outline-none font-mono uppercase"
                            />
                          </div>
                        )}

                        <div className="flex gap-2 pt-1">
                          <button
                            type="submit"
                            disabled={isSubmittingCard}
                            className="flex-1 py-2 bg-[#5B9F48] hover:bg-[#4d863d] text-white text-xs font-bold rounded-xl transition"
                          >
                            {isSubmittingCard ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ' : 'Save')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddCard(false)}
                            className="px-3 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                          >
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>
                        </div>
                      </form>
                    )}

                    {cards.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-[#738989]">
                        {isAr ? 'لا توجد بطاقات مضافة' : 'No cards added'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {cards.map((c) => {
                          const isSelected = selectedCardId === c.id;
                          const isStc = c.type === 'stc_pay' || c.withdrawal_type === 'stc_pay' || c.card_type === 'stc_pay';
                          const details = c.details || {};
                          const title = isStc ? 'STC Pay' : (details.card_brand || (isAr ? 'بطاقة سحب' : 'Card'));
                          const subtitle = isStc ? details.phone_number : (details.iban || (details.card_number ? `**** ${String(details.card_number).slice(-4)}` : ''));

                          return (
                            <div
                              key={c.id}
                              onClick={() => setSelectedCardId(c.id)}
                              className={`p-3 rounded-2xl border transition duration-200 flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? 'bg-[#5B9F48]/10 border-[#5B9F48]'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#5B9F48] flex items-center justify-center">
                                  {isStc ? <Smartphone size={18} /> : <CreditCard size={18} />}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-[#171717]">
                                    {title}
                                  </div>
                                  <div className="text-[11px] text-[#738989] font-mono">
                                    {subtitle}
                                  </div>
                                </div>
                              </div>

                              {isSelected ? (
                                <div className="w-5 h-5 rounded-full bg-[#5B9F48] text-white flex items-center justify-center">
                                  <Check size={12} />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-slate-300" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {((selectedMethod === 'bank' && selectedBankId) || (selectedMethod === 'card' && selectedCardId)) && (
                  <div className="pt-2 border-t border-slate-100 space-y-2 animate-fade-in">
                    <label className="block text-xs sm:text-sm font-bold text-[#171717]">
                      {isAr ? 'مبلغ السحب' : 'Withdrawal Amount'}
                    </label>

                    <div className="bg-[#EFEFEF] rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                      <span className="text-xl font-bold text-[#738989]">
                        ﷼
                      </span>
                      <input
                        type="number"
                        min="10"
                        step="0.01"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-transparent border-0 outline-none text-2xl font-bold text-[#171717] w-full text-end placeholder-[#738989]"
                      />
                    </div>

                    <div className="text-[11px] font-semibold text-[#5B9F48]">
                      {isAr ? 'الحد الأدنى للسحب: 10 ريال سعودي' : 'Minimum withdrawal: 10 Saudi Riyal'}
                    </div>
                  </div>
                )}

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleSubmitWithdraw}
                    disabled={
                      isSubmittingWithdraw ||
                      !selectedMethod ||
                      (selectedMethod === 'bank' && !selectedBankId) ||
                      (selectedMethod === 'card' && !selectedCardId) ||
                      !withdrawAmount ||
                      parseFloat(withdrawAmount) < 10 ||
                      parseFloat(withdrawAmount) > withdrawableBalance
                    }
                    className="w-full h-[52px] rounded-2xl bg-[#5B9F48] hover:bg-[#4d863d] disabled:opacity-40 text-white font-bold text-sm sm:text-base transition duration-200 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSubmittingWithdraw ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>{isAr ? 'تأكيد السحب' : 'Confirm Withdrawal'}</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 px-2 space-y-4 animate-fade-in">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
                    withdrawStatusSuccess
                      ? 'bg-[#C3EEA5] text-[#1A542E]'
                      : 'bg-[#FFFFECE6] text-[#E43700]'
                  }`}
                >
                  {withdrawStatusSuccess ? <Check size={40} /> : <AlertTriangle size={40} />}
                </div>

                <h3
                  className={`text-xl font-bold ${
                    withdrawStatusSuccess ? 'text-[#0D4A5F]' : 'text-[#E43700]'
                  }`}
                >
                  {withdrawStatusSuccess
                    ? (isAr ? 'نجاح' : 'Success')
                    : (isAr ? 'فشلت العملية' : 'Operation Failed')}
                </h3>

                <p className="text-xs sm:text-sm text-[#738989] max-w-sm mx-auto leading-relaxed">
                  {withdrawStatusSuccess
                    ? (isAr
                        ? 'تم إرسال طلب السحب، وسيتم تحويل المبلغ إلى حسابك بعد اكتمال المعالجة'
                        : 'Withdrawal request submitted, funds will be transferred after processing')
                    : (withdrawStatusError ||
                        (isAr
                          ? 'لم نتمكن من إتمام عملية السحب. يرجى المحاولة مرة أخرى، أو التحقق من البيانات'
                          : 'Unable to complete withdrawal. Please try again.'))}
                </p>

                <div className="pt-4">
                  {withdrawStatusSuccess ? (
                    <button
                      type="button"
                      onClick={() => setShowWithdraw(false)}
                      className="w-full h-12 bg-[#5B9F48] hover:bg-[#4d863d] text-white font-bold text-sm rounded-2xl transition"
                    >
                      {isAr ? 'تم' : 'Done'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setWithdrawStep('form')}
                      className="w-full h-12 bg-[#5B9F48] hover:bg-[#4d863d] text-white font-bold text-sm rounded-2xl transition"
                    >
                      {isAr ? 'إعادة المحاولة' : 'Retry'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
