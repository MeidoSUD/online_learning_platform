

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Plus, Trash2, CreditCard, Loader2, AlertCircle, CheckCircle, RefreshCw, Bug } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { StudentPaymentMethod } from '../../Utils/types';
import { studentService } from '../../Services/api';

export const PaymentMethodsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const [cards, setCards] = useState<StudentPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<Record<string, string[]>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Form using API field names
  const [form, setForm] = useState({
    card_number: '',
    card_expiry_month: '',
    card_expiry_year: '',
    card_cvc: '',
    card_holder_name: '',
    card_type: 'visa' as 'visa' | 'mastercard' | 'mada'
  });

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await studentService.getPaymentMethods();
      console.log("Loaded Cards in Component:", data);
      setCards(Array.isArray(data) ? [...data] : []);
    } catch (e) {
      console.error("Failed to load cards:", e);
      setCards([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    setApiErrors({});
    setSuccessMsg(null);

    setSubmitting(true);
    try {
      const typeMap: Record<string, number> = { 'visa': 1, 'mastercard': 2, 'mada': 3 };
      
      const payload = {
          payment_method_id: typeMap[form.card_type] || 1,
          card_number: form.card_number,
          card_holder_name: form.card_holder_name,
          card_cvc: form.card_cvc,
          card_expiry_month: form.card_expiry_month,
          card_expiry_year: form.card_expiry_year
      };

      const response = await studentService.addPaymentMethod(payload);
      
      await loadCards();
      setIsModalOpen(false);
      
      setSuccessMsg(response.message || (language === 'ar' ? "تم حفظ البطاقة بنجاح" : "Card saved successfully"));
      setTimeout(() => setSuccessMsg(null), 3000);

      setForm({
        card_number: '',
        card_expiry_month: '',
        card_expiry_year: '',
        card_cvc: '',
        card_holder_name: '',
        card_type: 'visa'
      });
      
    } catch (e: any) {
      console.error(e);
      if (e.errors) {
          setApiErrors(e.errors);
      } else {
          alert(e.message || "Failed to save card");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this card?")) return;
    try {
      await studentService.deletePaymentMethod(id);
      await loadCards();
    } catch (e) {
      console.error(e);
    }
  };

  const getBrandName = (card: StudentPaymentMethod) => {
      if (card.payment_method) {
          return language === 'ar' ? card.payment_method.name_ar : card.payment_method.name_en;
      }
      const map: Record<number, string> = { 1: 'Visa', 2: 'Mastercard', 3: 'Mada' };
      return map[card.payment_method_id] || 'Card';
  };

  const getCardStyle = (brandName: string) => {
    const lower = String(brandName).toLowerCase();
    if (lower.includes('visa')) return 'bg-gradient-to-br from-blue-600 to-blue-800';
    if (lower.includes('master')) return 'bg-gradient-to-br from-slate-800 to-black';
    if (lower.includes('mada')) return 'bg-gradient-to-br from-teal-600 to-teal-800';
    return 'bg-gradient-to-br from-slate-600 to-slate-800';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {successMsg && (
          <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2 animate-fade-in">
              <CheckCircle size={20} />
              <span>{successMsg}</span>
          </div>
      )}

      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">{t.paymentMethods}</h2>
        <div className="flex gap-2">
            <Button variant="outline" onClick={loadCards} disabled={loading} className="px-3" title="Refresh List">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </Button>
            <Button variant="ghost" onClick={() => setShowDebug(!showDebug)} className="px-3 text-slate-400" title="Debug Info">
                <Bug size={18} />
            </Button>
            <Button onClick={() => { setIsModalOpen(true); setApiErrors({}); }}>
                <Plus size={18} className="mr-2 text-white/80" /> {t.addNewCard}
            </Button>
        </div>
      </div>

      {showDebug && (
          <div className="bg-slate-900 text-green-400 p-4 rounded-xl text-xs font-mono overflow-auto max-h-60">
              <p className="mb-2 text-white font-bold">Debug: Cards State ({Array.isArray(cards) ? cards.length : 'Not Array'})</p>
              <pre>{JSON.stringify(cards, null, 2)}</pre>
          </div>
      )}

      {loading ? (
          <div className="p-12 text-center">
              <Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" />
              <p className="text-slate-500 mt-2">Loading your cards...</p>
          </div>
      ) : (!Array.isArray(cards) || cards.length === 0) ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
          <CreditCard className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p>{t.noCards}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => {
            const brandName = getBrandName(card);
            return (
                <div key={card.id} className={`relative p-6 rounded-2xl text-white shadow-xl ${getCardStyle(brandName)} aspect-[1.58/1] flex flex-col justify-between overflow-hidden group`}>
                <button onClick={() => handleDelete(card.id)} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 text-white z-10">
                    <Trash2 size={16} />
                </button>
                <div className="flex justify-between items-start">
                    <span className="text-xl font-bold font-mono uppercase italic opacity-80">{brandName}</span>
                    <CreditCard size={24} className="opacity-50" />
                </div>
                <div className="mt-4">
                    <div className="text-lg font-mono tracking-widest mb-1">
                        **** **** **** {card.card_number?.slice(-4)}
                    </div>
                    <div className="flex justify-between items-end mt-4">
                        <div>
                            <p className="text-[10px] text-white/70 uppercase tracking-wider">{t.cardHolder}</p>
                            <p className="font-medium text-sm truncate max-w-[150px]">{card.card_holder_name}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/70 uppercase tracking-wider text-right">EXP</p>
                            <p className="font-medium text-sm">
                                {String(card.card_expiry_month).padStart(2, '0')}/{String(card.card_expiry_year).slice(-2)}
                            </p>
                        </div>
                    </div>
                </div>
                </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t.addNewCard}>
        <div className="space-y-4">
           {Object.keys(apiErrors).length > 0 && (
               <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                   <p className="font-semibold">Please correct the errors:</p>
               </div>
           )}
           <Select 
             label="Card Type"
             options={[{ value: 'visa', label: 'Visa' }, { value: 'mastercard', label: 'Mastercard' }, { value: 'mada', label: 'Mada' }]}
             value={form.card_type}
             onChange={(e) => setForm({...form, card_type: e.target.value as any})}
             error={apiErrors.payment_method_id?.[0]}
           />
           <Input 
             label={t.cardNumber}
             placeholder="0000 0000 0000 0000"
             value={form.card_number}
             onChange={(e) => setForm({...form, card_number: e.target.value.replace(/\D/g, '')})}
             error={apiErrors.card_number?.[0]}
           />
           <div className="grid grid-cols-2 gap-4">
              <div className="flex gap-2">
                 <Input 
                    label="Month" placeholder="MM" value={form.card_expiry_month}
                    onChange={(e) => setForm({...form, card_expiry_month: e.target.value})}
                    error={apiErrors.card_expiry_month?.[0]}
                 />
                 <Input 
                    label="Year" placeholder="YY" value={form.card_expiry_year}
                    onChange={(e) => setForm({...form, card_expiry_year: e.target.value})}
                    error={apiErrors.card_expiry_year?.[0]}
                 />
              </div>
              <Input 
                label={t.cvv} placeholder="123" value={form.card_cvc}
                onChange={(e) => setForm({...form, card_cvc: e.target.value})}
                error={apiErrors.card_cvc?.[0]}
              />
           </div>
           <Input 
             label={t.cardHolder} placeholder="Name on card" value={form.card_holder_name}
             onChange={(e) => setForm({...form, card_holder_name: e.target.value})}
             error={apiErrors.card_holder_name?.[0]}
           />
           <Button className="w-full mt-2" onClick={handleAddCard} isLoading={submitting}>{t.saveCard}</Button>
        </div>
      </Modal>
    </div>
  );
};
