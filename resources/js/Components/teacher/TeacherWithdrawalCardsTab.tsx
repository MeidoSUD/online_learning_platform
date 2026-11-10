import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  AlertCircle,
  Smartphone
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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [cardType, setCardType] = useState<'stc_pay' | 'card'>('stc_pay');
  const [stcPhone, setStcPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiryMonth, setCardExpiryMonth] = useState('');
  const [cardExpiryYear, setCardExpiryYear] = useState('');
  const [cardBrand, setCardBrand] = useState('MADA');
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  const handleSetDefault = async (cardId: number) => {
    setActionLoadingId(cardId);
    try {
      await teacherService.setDefaultWithdrawalCard(cardId);
      await loadCards();
    } catch (e: any) {
      alert(e?.message || (isAr ? 'فشل تعيين البطاقة كافتراضية' : 'Failed to set as default'));
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

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    let payload: any;
    if (cardType === 'stc_pay') {
      if (!stcPhone.trim()) {
        setFormError(isAr ? 'يرجى إدخال رقم هاتف STC Pay' : 'Please enter STC Pay phone number');
        return;
      }
      payload = {
        type: 'stc_pay',
        status: 'active',
        is_default: isDefault,
        details: {
          phone_number: stcPhone.trim(),
          is_default: isDefault,
        },
      };
    } else {
      if (!cardNumber.trim() || !cardHolder.trim()) {
        setFormError(isAr ? 'يرجى إكمال جميع بيانات البطاقة' : 'Please complete all card details');
        return;
      }
      payload = {
        type: 'card',
        status: 'active',
        is_default: isDefault,
        details: {
          card_number: cardNumber.replace(/\s+/g, ''),
          card_holder_name: cardHolder.trim(),
          card_brand: cardBrand,
          expiry_month: cardExpiryMonth,
          expiry_year: cardExpiryYear,
          is_default: isDefault,
        },
      };
    }

    setSubmitting(true);
    try {
      await teacherService.addWithdrawalCard(payload);
      setIsAddOpen(false);
      setStcPhone('');
      setCardNumber('');
      setCardHolder('');
      setCardExpiryMonth('');
      setCardExpiryYear('');
      setIsDefault(false);
      await loadCards();
    } catch (err: any) {
      setFormError(err?.message || (isAr ? 'فشل إضافة البطاقة' : 'Failed to add card'));
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
          onClick={() => setIsAddOpen(true)}
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
            {isAr ? 'لا توجد بطاقات سحب رقمية مضافة' : 'No withdrawal cards added'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isAr
              ? 'أضف محفظة STC Pay أو بطاقة سحب رقمية معتمدة لتتمكن من استلام أرباحك بشكل فوري'
              : 'Add an STC Pay wallet or verified withdrawal card to receive instant earnings'}
          </p>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#5B9F48] text-white rounded-xl text-xs font-bold hover:bg-[#4d863d] transition shadow-sm"
          >
            <Plus size={16} />
            <span>{isAr ? 'إضافة بطاقة سحب' : 'Add Card'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => {
            const isStc = card.type === 'stc_pay' || card.withdrawal_type === 'stc_pay';
            const details = card.details || {};
            const isCardDefault = Boolean(card.is_default || details.is_default);

            return (
              <div
                key={card.id}
                className={`p-5 rounded-3xl border transition flex flex-col justify-between ${
                  isCardDefault
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          isStc ? 'bg-purple-50 text-purple-600' : 'bg-sky-50 text-sky-600'
                        }`}
                      >
                        {isStc ? <Smartphone size={24} /> : <CreditCard size={24} />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          {isStc
                            ? 'STC Pay'
                            : details.card_brand || (isAr ? 'بطاقة سحب' : 'Withdrawal Card')}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {isStc
                            ? details.phone_number || (isAr ? 'محفظة رقمية' : 'Digital Wallet')
                            : `**** **** **** ${String(details.card_number || '0000').slice(-4)}`}
                        </p>
                      </div>
                    </div>

                    {isCardDefault && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-[#5B9F48] text-white rounded-full">
                        <CheckCircle size={12} />
                        <span>{isAr ? 'الافتراضية' : 'Default'}</span>
                      </span>
                    )}
                  </div>

                  {!isStc && details.card_holder_name && (
                    <div className="text-xs text-slate-500 mb-2">
                      <span className="text-slate-400 me-1">{isAr ? 'الاسم:' : 'Holder:'}</span>
                      <span className="font-medium text-slate-700">{details.card_holder_name}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                  {!isCardDefault ? (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(card.id)}
                      disabled={actionLoadingId === card.id}
                      className="text-xs font-bold text-[#5B9F48] hover:underline"
                    >
                      {actionLoadingId === card.id ? (
                        <span className="inline-block w-3.5 h-3.5 border-2 border-[#5B9F48] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        isAr ? 'تعيين كافتراضية' : 'Set as default'
                      )}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">
                      {isAr ? 'طريقة السحب الأساسية' : 'Primary method'}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteCard(card.id)}
                    disabled={actionLoadingId === card.id}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="absolute top-5 left-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#5B9F48] flex items-center justify-center font-bold">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0D4A5F]">
                  {isAr ? 'إضافة وسيلة سحب جديدة' : 'Add Withdrawal Method'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr ? 'سحب فوري للأرباح' : 'Instant earnings withdrawal'}
                </p>
              </div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 my-4">
              <button
                type="button"
                onClick={() => setCardType('stc_pay')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  cardType === 'stc_pay'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                <Smartphone size={14} />
                <span>STC Pay</span>
              </button>
              <button
                type="button"
                onClick={() => setCardType('card')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  cardType === 'card'
                    ? 'bg-white text-sky-700 shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                <CreditCard size={14} />
                <span>{isAr ? 'بطاقة بنكية / مدى' : 'Card / Mada'}</span>
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddCard} className="space-y-3.5">
              {cardType === 'stc_pay' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'رقم هاتف STC Pay' : 'STC Pay Phone Number'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={stcPhone}
                    onChange={(e) => setStcPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B9F48]"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isAr ? 'اسم حامل البطاقة' : 'Cardholder Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder={isAr ? 'الاسم كما يظهر على البطاقة' : 'Name as on card'}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B9F48]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isAr ? 'رقم البطاقة' : 'Card Number'}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4000 0000 0000 0000"
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5B9F48]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isAr ? 'نوع البطاقة' : 'Brand'}
                      </label>
                      <select
                        value={cardBrand}
                        onChange={(e) => setCardBrand(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="MADA">مدى</option>
                        <option value="VISA">Visa</option>
                        <option value="MASTERCARD">Mastercard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isAr ? 'الشهر' : 'Month'}
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="MM"
                        value={cardExpiryMonth}
                        onChange={(e) => setCardExpiryMonth(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isAr ? 'السنة' : 'Year'}
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="YYYY"
                        value={cardExpiryYear}
                        onChange={(e) => setCardExpiryYear(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl text-center"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="defaultCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-slate-300 text-[#5B9F48] focus:ring-[#5B9F48]"
                />
                <label htmlFor="defaultCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  {isAr ? 'تعيين كوسيلة سحب افتراضية' : 'Set as default withdrawal method'}
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  disabled={submitting}
                  className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 bg-[#5B9F48] hover:bg-[#4d863d] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{isAr ? 'حفظ البطاقة' : 'Save'}</span>
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

