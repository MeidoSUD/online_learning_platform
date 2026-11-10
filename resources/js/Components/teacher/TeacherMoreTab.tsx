import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { 
  User, 
  Wallet, 
  CreditCard, 
  Package, 
  Send, 
  Calendar, 
  HelpCircle, 
  Headphones, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  BookOpen, 
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import { UserData, teacherService } from '../../Services/api';
import { TeacherPublicProfileModal } from './TeacherPublicProfileModal';

interface TeacherMoreTabProps {
  user: UserData;
  onNavigate?: (tab: string) => void;
  onLogout?: () => void;
}

export const TeacherMoreTab: React.FC<TeacherMoreTabProps> = ({ user, onNavigate, onLogout }) => {
  const { t, language } = useLanguage();
  const isAr = language === 'ar';

  const [balance, setBalance] = useState<number>(0);
  const [showPublicModal, setShowPublicModal] = useState(false);

  const profile = user.profile;
  const rating = Number(profile?.rating || 4.9);
  const lessonsCount = Number(profile?.total_lessons || profile?.current_lessons || 0);

  useEffect(() => {
    teacherService.getWallet()
      .then((data) => {
        if (data) setBalance(Number(data.balance || user.current_balance || 0));
      })
      .catch(() => {});
  }, [user.current_balance]);

  const handleLogoutClick = () => {
    if (confirm(isAr ? 'هل أنت متأكد من رغبتك في تسجيل الخروج؟' : 'Are you sure you want to log out?')) {
      if (onLogout) onLogout();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
            {profile?.profile_photo ? (
              <img src={profile.profile_photo} alt={user.first_name} className="w-full h-full object-cover" />
            ) : (
              <User size={26} className="text-slate-400" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {user.first_name} {user.last_name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowPublicModal(true)}
          className="px-4 py-2 bg-[#0D4A5F] hover:bg-[#093544] text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          {isAr ? 'ملفي التعريفي العام' : 'Public Profile'}
        </button>
      </div>

      <div className="rounded-3xl p-6 sm:p-7 text-[#5E3C0F] shadow-lg relative overflow-hidden bg-gradient-to-br from-[#E8AB53] to-[#F9D194] border border-white/50">
        <div className="flex justify-between items-center relative z-10">
          <div>
            <span className="text-xs font-bold text-[#5E3C0F]/80 block mb-1">
              {isAr ? 'الرصيد المتاح' : 'Available Balance'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#0D4A5F]">
                {balance.toFixed(0)}
              </span>
              <span className="text-sm font-bold text-[#0D4A5F]">
                {t.sar}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate('wallet')}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-[#0D4A5F] rounded-2xl text-xs font-extrabold transition shadow-sm flex items-center gap-1.5"
          >
            <span>{isAr ? 'سحب الأرباح' : 'Withdraw Profits'}</span>
            {isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm grid grid-cols-2 divide-x divide-x-reverse divide-slate-100">
        <div className="flex flex-col items-center justify-center p-2 text-center">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#5B9F48] flex items-center justify-center mb-2">
            <BookOpen size={20} />
          </div>
          <span className="text-xl font-extrabold text-[#0D4A5F]">{lessonsCount}</span>
          <span className="text-xs text-slate-400 mt-0.5">{isAr ? 'الدروس المنجزة' : 'Lessons'}</span>
        </div>

        <div className="flex flex-col items-center justify-center p-2 text-center">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-2">
            <Star size={20} fill="currentColor" />
          </div>
          <span className="text-xl font-extrabold text-[#0D4A5F]">{rating.toFixed(1)}</span>
          <span className="text-xs text-slate-400 mt-0.5">{isAr ? 'التقييم' : 'Rating'}</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('profile')}
          className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition text-start"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#0D4A5F] flex items-center justify-center">
              <User size={18} />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {isAr ? 'تعديل الملف الشخصي' : 'Edit Profile'}
            </span>
          </div>
          {isAr ? <ChevronLeft size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate('withdrawal-options')}
          className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition text-start"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CreditCard size={18} />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {isAr ? 'خيارات وطرق السحب' : 'Withdrawal Options'}
            </span>
          </div>
          {isAr ? <ChevronLeft size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate('packages')}
          className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition text-start"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Package size={18} />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {isAr ? 'الباقات التعليمية' : 'Educational Packages'}
            </span>
          </div>
          {isAr ? <ChevronLeft size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate('orders')}
          className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition text-start"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#5B9F48] flex items-center justify-center">
              <Send size={18} />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {isAr ? 'طلبات الطلاب الخاصة' : 'Student Private Requests'}
            </span>
          </div>
          {isAr ? <ChevronLeft size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate('schedule')}
          className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition text-start"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {isAr ? 'جدولي الدراسي' : 'Study Schedule'}
            </span>
          </div>
          {isAr ? <ChevronLeft size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate('support')}
          className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-slate-50 transition text-start"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Headphones size={18} />
            </div>
            <span className="text-xs font-bold text-slate-800">
              {isAr ? 'الدعم الفني والمساعدة' : 'Technical Support'}
            </span>
          </div>
          {isAr ? <ChevronLeft size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
        </button>

        <button
          type="button"
          onClick={handleLogoutClick}
          className="w-full p-4 sm:p-4.5 flex items-center justify-between hover:bg-red-50 transition text-start group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <LogOut size={18} />
            </div>
            <span className="text-xs font-bold text-red-600">
              {isAr ? 'تسجيل الخروج' : 'Log Out'}
            </span>
          </div>
          {isAr ? <ChevronLeft size={18} className="text-red-400 group-hover:text-red-600" /> : <ChevronRight size={18} className="text-red-400 group-hover:text-red-600" />}
        </button>
      </div>

      <TeacherPublicProfileModal
        user={user}
        isOpen={showPublicModal}
        onClose={() => setShowPublicModal(false)}
      />
    </div>
  );
};

