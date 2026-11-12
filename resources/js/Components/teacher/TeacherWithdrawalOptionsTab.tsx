import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Building, CreditCard, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

interface TeacherWithdrawalOptionsTabProps {
  onNavigate?: (tab: string) => void;
}

export const TeacherWithdrawalOptionsTab: React.FC<TeacherWithdrawalOptionsTabProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('wallet')}
            className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            {isAr ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}
        <div>
          <h2 className="text-xl font-bold text-[#0D4A5F]">
            {isAr ? 'خيارات وطرق السحب' : 'Withdrawal Options'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'اختر الطريقة المناسبة لتحويل واستلام أرباحك المسجلة في المحفظة'
              : 'Choose your preferred method to receive earnings from your wallet'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        <div
          onClick={() => onNavigate && onNavigate('bank-accounts')}
          className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer relative group flex flex-col justify-between"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#5B9F48] flex items-center justify-center mb-5">
              <Building size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">
              {isAr ? 'الحسابات البنكية' : 'Bank Accounts'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAr
                ? 'إيداع الأرباح مباشرة عبر التحويل البنكي إلى حسابك البنكي المحلي (آيبان معتمد)'
                : 'Direct deposit into your local verified bank account via IBAN'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6 text-xs font-bold text-[#5B9F48]">
            <span>{isAr ? 'إدارة الحسابات البنكية' : 'Manage Bank Accounts'}</span>
            {isAr ? (
              <ChevronLeft size={18} className="group-hover:-translate-x-1 transition duration-200" />
            ) : (
              <ChevronRight size={18} className="group-hover:translate-x-1 transition duration-200" />
            )}
          </div>
        </div>

        <div
          onClick={() => onNavigate && onNavigate('withdrawal-cards')}
          className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer relative group flex flex-col justify-between"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-5">
              <CreditCard size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">
              {isAr ? 'بطاقات ومحافظ السحب الرقمية' : 'Withdrawal Cards & Digital Wallets'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAr
                ? 'استلام فوري للأرباح عبر محفظة STC Pay أو بطاقات السحب الرقمية المعتمدة'
                : 'Fast withdrawal to your STC Pay wallet or verified digital withdrawal cards'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6 text-xs font-bold text-sky-600">
            <span>{isAr ? 'إدارة بطاقات ومحافظ السحب' : 'Manage Cards & Wallets'}</span>
            {isAr ? (
              <ChevronLeft size={18} className="group-hover:-translate-x-1 transition duration-200" />
            ) : (
              <ChevronRight size={18} className="group-hover:translate-x-1 transition duration-200" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

