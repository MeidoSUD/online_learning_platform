import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Smartphone,
  Landmark,
  Pencil
} from 'lucide-react';
import { teacherService } from '../../Services/api';

interface TeacherWithdrawalCardsTabProps {
  onNavigate?: (tab: string) => void;
}

export const TeacherWithdrawalCardsTab: React.FC<TeacherWithdrawalCardsTabProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [cardType, setCardType] = useState<'stc_pay' | 'bank_account'>('bank_account');
  const [stcPhone, setStcPhone] = useState('');
  const [iban, setIban] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const maskIban = (ibanStr: string) => {
    if (!ibanStr || ibanStr.length <= 8) return ibanStr || '';
    return `${ibanStr.substring(0, 4)}****${ibanStr.substring(ibanStr.length - 4)}`;
  };

  const loadCards = async () => {
    setLoading(true);
    try {
      const res = await teacherService.getWithdrawalCards();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setCards(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const openAddModal = () => {
    setEditingCard(null);
    setCardType('bank_account');
    setStcPhone('');
    setIban('');
    setIsDefault(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (card: any) => {
    setEditingCard(card);
    const isStc = card.type === 'stc_pay' || card.withdrawal_type === 'stc_pay' || card.card_type === 'stc_pay';
    setCardType(isStc ? 'stc_pay' : 'bank_account');
    setStcPhone(card.details?.phone_number || card.phone_number || '');
    setIban(card.details?.iban || card.iban || '');
    setIsDefault(Boolean(card.is_default || card.details?.is_default));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSetDefault = async (cardId: number) => {
    setActionLoadingId(cardId);
    try {
      await teacherService.setDefaultWithdrawalCard(cardId);
      await loadCards();
    } catch (e: any) {
      alert(e?.message || (isAr ? 'فشل تعيين الوسيلة كافتراضية' : 'Failed to set as default'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذه البطاقة؟' : 'Are you sure you want to delete this card?')) {
      return;
    }

    setActionLoadingId(cardId);
    try {
      await teacherService.deleteWithdrawalCard(cardId);
      await loadCards();
    } catch (e: any) {
      alert(e?.message || (isAr ? 'فشل حذف البطاقة' : 'Failed to delete card'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    let payload: any;
    if (cardType === 'stc_pay') {
      const cleanPhone = stcPhone.trim();
      if (!cleanPhone) {
        setFormError(isAr ? 'هذا الحقل مطلوب' : 'This field is required');
        return;
      }
      if (!cleanPhone.startsWith('05') || cleanPhone.length !== 10) {
        setFormError(isAr ? 'يجب أن يبدأ الرقم بـ 05 ويتكون من 10 أرقام' : 'Number must start with 05 and consist of 10 digits');
        return;
      }
      payload = {
        type: 'stc_pay',
        status: 'active',
        is_default: isDefault,
        details: {
          phone_number: cleanPhone,
          is_default: isDefault,
        },
      };
    } else {
      const cleanIban = iban.trim().toUpperCase().replace(/\s+/g, '');
      if (!cleanIban) {
        setFormError(isAr ? 'هذا الحقل مطلوب' : 'This field is required');
        return;
      }
      if (!cleanIban.startsWith('SA')) {
        setFormError(isAr ? 'يجب أن يبدأ الآيبان بـ SA' : 'IBAN must start with SA');
        return;
      }
      if (cleanIban.length !== 24) {
        setFormError(isAr ? 'يجب أن يتكون الآيبان من 24 رمزاً' : 'IBAN must consist of 24 characters');
        return;
      }
      payload = {
        type: 'bank_account',
        status: 'active',
        is_default: isDefault,
        details: {
          iban: cleanIban,
          is_default: isDefault,
        },
      };
    }

    setSubmitting(true);
    try {
      if (editingCard?.id) {
        await teacherService.updateWithdrawalCard(editingCard.id, payload);
      } else {
        await teacherService.addWithdrawalCard(payload);
      }
      setIsModalOpen(false);
      setStcPhone('');
      setIban('');
      setIsDefault(false);
      setEditingCard(null);
      await loadCards();
    } catch (err: any) {
      setFormError(err?.message || (isAr ? 'حدث خطأ أثناء حفظ وسيلة السحب' : 'Failed to save withdrawal method'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('withdrawal-options')}
              className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            >
              {isAr ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-[#0D4A5F]">
              {isAr ? 'بطاقات ومحافظ السحب الرقمية' : 'Withdrawal Cards & Wallets'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isAr
                ? 'إدارة بطاقاتك ومحافظك الرقمية لتحويل وسحب الأرباح بسهولة'
                : 'Manage your cards and digital wallets to withdraw earnings smoothly'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5B9F48] hover:bg-[#4d863d] text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Plus size={16} />
          <span>{isAr ? 'إضافة بطاقة جديدة' : 'Add New Card'}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="animate-spin text-[#5B9F48] h-10 w-10" />
        </div>
      ) : cards.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <CreditCard size={32} />
          </div>
          <h3 className="text-base font-bold text-[#0D4A5F]">
            {isAr ? 'لا توجد بطاقات مضافة' : 'No cards added'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isAr
              ? 'أضف بطاقتك لاستخدامها في السحب'
              : 'Add your card to use for withdrawals'}
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#5B9F48] text-white rounded-xl text-xs font-bold hover:bg-[#4d863d] transition shadow-sm"
          >
            <Plus size={16} />
            <span>{isAr ? 'إضافة بطاقة جديدة' : 'Add New Card'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => {
            const isStc = card.type === 'stc_pay' || card.withdrawal_type === 'stc_pay' || card.card_type === 'stc_pay';
            const isBank = card.type === 'bank_account' || card.withdrawal_type === 'bank_account' || card.card_type === 'bank_account';
            const details = card.details || {};
            const isCardDefault = Boolean(card.is_default || details.is_default);

            const title = isStc
              ? 'STC Pay'
              : isBank
              ? (isAr ? 'حساب بنكي' : 'Bank Account')
              : (card.card_type ? card.card_type.toUpperCase() : (isAr ? 'وسيلة سحب' : 'Withdrawal Method'));

            const rawSubtitle = isStc
              ? (details.phone_number || card.phone_number || '')
              : isBank
              ? maskIban(details.iban || card.iban || '')
              : (details.card_number || card.card_number || '');

            const gradient = isStc
              ? 'from-[#8B5CF6] to-[#6D28D9]'
              : isBank
              ? 'from-[#0EA5E9] to-[#0369A1]'
              : 'from-[#6366F1] to-[#4338CA]';

            return (
              <div
                key={card.id}
                className={`bg-gradient-to-r ${gradient} text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[160px]`}
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2.5">
                      {isStc ? (
                        <Smartphone size={22} className="text-white" />
                      ) : (
                        <Landmark size={22} className="text-white" />
                      )}
                      <h4 className="text-base font-bold text-white">
                        {title}
                      </h4>
                    </div>

                    {isCardDefault && (
                      <span className="inline-flex items-center px-2.5 py-1 bg-white/20 text-white rounded-full text-xs font-semibold backdrop-blur-sm">
                        {isAr ? 'افتراضية' : 'Default'}
                      </span>
                    )}
                  </div>

                  {rawSubtitle && (
                    <div className="text-sm font-mono text-white/95 mt-1 tracking-wider" dir="ltr">
                      {rawSubtitle}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/15 mt-3">
                  <div>
                    {!isCardDefault ? (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(card.id)}
                        disabled={actionLoadingId === card.id}
                        className="text-xs font-bold text-white/90 hover:text-white underline transition"
                      >
                        {actionLoadingId === card.id ? (
                          <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          isAr ? 'تعيين كافتراضية' : 'Set as default'
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-white/70 font-medium">
                        {isAr ? 'طريقة السحب الأساسية' : 'Primary method'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(card)}
                      className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
                      title={isAr ? 'تعديل' : 'Edit'}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCard(card.id)}
                      disabled={actionLoadingId === card.id}
                      className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 mb-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
              >
                {isAr ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>

              <h3 className="text-base font-bold text-slate-800 text-center flex-1">
                {editingCard
                  ? (isAr ? 'تعديل وسيلة السحب' : 'Edit Withdrawal Method')
                  : (isAr ? 'إضافة وسيلة سحب' : 'Add Withdrawal Method')}
              </h3>

              <div className="w-10" />
            </div>

            <div
              className="w-full py-3 px-4 rounded-xl text-center text-xs sm:text-sm font-semibold mb-5"
              style={{ backgroundColor: '#B5DB6C', color: '#1E5214' }}
            >
              {isAr
                ? 'سيتم تحويل أرباحك إلى هذه الوسيلة عند طلب السحب'
                : 'Your earnings will be transferred to this method when requesting a withdrawal'}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-800 mb-2">
                {isAr ? 'نوع وسيلة السحب' : 'Withdrawal Method Type'}{' '}
                <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCardType('bank_account')}
                  className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                    cardType === 'bank_account'
                      ? 'bg-[#5B9F48] text-white border-[#5B9F48]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Landmark size={18} />
                  <span>{isAr ? 'حساب بنكي' : 'Bank Account'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCardType('stc_pay')}
                  className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
                    cardType === 'stc_pay'
                      ? 'bg-[#5B9F48] text-white border-[#5B9F48]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone size={18} />
                  <span>STC Pay</span>
                </button>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {cardType === 'stc_pay' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    {isAr ? 'رقم الهاتف' : 'Phone Number'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    maxLength={10}
                    value={stcPhone}
                    onChange={(e) => setStcPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="05XXXXXXXX"
                    className="w-full text-sm font-mono p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5B9F48] focus:border-transparent tracking-wider"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    {isAr ? 'رقم الآيبان (IBAN)' : 'IBAN Number'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    maxLength={24}
                    value={iban}
                    onChange={(e) => setIban(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    placeholder="SA0000000000000000000000"
                    className="w-full text-sm font-mono p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#5B9F48] focus:border-transparent tracking-wider"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="defaultMethodCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#5B9F48] focus:ring-[#5B9F48]"
                />
                <label htmlFor="defaultMethodCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                  {isAr ? 'تعيين كوسيلة افتراضية' : 'Set as default method'}
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 bg-[#5B9F48] hover:bg-[#4d863d] text-white rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>
                      {editingCard
                        ? (isAr ? 'حفظ' : 'Save')
                        : (isAr ? 'إضافة وسيلة سحب' : 'Add Withdrawal Method')}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
