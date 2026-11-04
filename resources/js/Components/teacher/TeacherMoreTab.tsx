import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  User,
  CreditCard,
  Layers,
  Users,
  HelpCircle,
  Headphones,
  Info,
  LogOut,
  ChevronRight,
  Globe,
  Star,
  BookOpen,
  DollarSign,
  ArrowUpRight,
  Video
} from 'lucide-react';
import { Button } from '../ui/Button';
import { UserData, teacherService, getStorageUrl } from '../../Services/api';

interface TeacherMoreTabProps {
  user: UserData;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
}

export const TeacherMoreTab: React.FC<TeacherMoreTabProps> = ({ user, onNavigate, onLogout }) => {
  const { t, language, setLanguage, direction } = useLanguage();
  const [balance, setBalance] = useState(0);
  const [finishedLessons, setFinishedLessons] = useState(0);

  const profile = user?.profile || {};
  const photo = profile?.profile_photo || user?.profile_image;
  const rating = profile?.rating ?? 5.0;

  useEffect(() => {
    fetchWalletAndLessons();
  }, [user]);

  const fetchWalletAndLessons = async () => {
    try {
      const [wallet, sessions] = await Promise.all([
        teacherService.getWallet().catch(() => null),
        teacherService.getTeacherSessions().catch(() => [])
      ]);
      setBalance(Number(wallet?.balance || user.current_balance || 0));
      if (Array.isArray(sessions)) {
        const count = sessions.filter((s: any) => s.status === 'completed' || s.status === 'finished').length;
        setFinishedLessons(count);
      }
    } catch {}
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-12">
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-xl overflow-hidden shrink-0 shadow-inner">
            {photo ? (
              <img src={getStorageUrl(photo)} alt={user.first_name} className="w-full h-full object-cover" />
            ) : (
              (user.first_name?.charAt(0) || 'T').toUpperCase()
            )}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">{user.first_name} {user.last_name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('profile')}
          className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          {language === 'ar' ? 'ملفي التعريفي' : 'Public Profile'}
        </button>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-[#E8AB53] to-[#F9D194] rounded-3xl p-6 text-slate-950 shadow-md border border-white/60">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-xs font-bold text-slate-800/80 block mb-1">
              {language === 'ar' ? 'الرصيد المتاح للسحب' : 'Available Balance'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-950">
                {balance.toFixed(0)}
              </span>
              <span className="text-sm font-extrabold text-slate-800">{t.sar}</span>
            </div>
          </div>

          <Button
            onClick={() => onNavigate('withdrawal-options')}
            className="bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs rounded-xl px-4 h-9 shadow-md"
          >
            {language === 'ar' ? 'سحب الأرباح' : 'Withdraw'}
            <ArrowUpRight size={14} className="mr-1 inline" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center">
          <span className="text-xs text-slate-400 mb-1">{language === 'ar' ? 'الدروس المكتملة' : 'Finished Lessons'}</span>
          <span className="text-2xl font-black text-slate-900">{finishedLessons}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center">
          <span className="text-xs text-slate-400 mb-1">{language === 'ar' ? 'تقييم الطلاب' : 'Student Rating'}</span>
          <div className="flex items-center gap-1.5">
            <Star size={18} className="text-amber-500 fill-amber-500" />
            <span className="text-2xl font-black text-slate-900">{Number(rating).toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
        <button
          onClick={() => onNavigate('profile')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <User size={18} />
            </div>
            <span className="text-sm font-bold text-slate-800">{language === 'ar' ? 'الملف الشخصي والأسعار' : 'Profile & Pricing'}</span>
          </div>
          <ChevronRight size={18} className={`text-slate-400 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={() => onNavigate('sessions')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Video size={18} />
            </div>
            <span className="text-sm font-bold text-slate-800">{language === 'ar' ? 'جلساتي' : 'My Sessions'}</span>
          </div>
          <ChevronRight size={18} className={`text-slate-400 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={() => onNavigate('withdrawal-options')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard size={18} />
            </div>
            <span className="text-sm font-bold text-slate-800">{language === 'ar' ? 'خيارات وبطاقات السحب' : 'Withdrawal Options & Cards'}</span>
          </div>
          <ChevronRight size={18} className={`text-slate-400 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={() => onNavigate('packages')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers size={18} />
            </div>
            <span className="text-sm font-bold text-slate-800">{language === 'ar' ? 'الباقات التعليمية' : 'Teacher Packages'}</span>
          </div>
          <ChevronRight size={18} className={`text-slate-400 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={() => onNavigate('group-classes')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={18} />
            </div>
            <span className="text-sm font-bold text-slate-800">{language === 'ar' ? 'مركز الحصص الجماعية' : 'Group Classes Hub'}</span>
          </div>
          <ChevronRight size={18} className={`text-slate-400 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Globe size={18} />
            </div>
            <span className="text-sm font-bold text-slate-800">{language === 'ar' ? 'تغيير لغة التطبيق' : 'Change Language'}</span>
          </div>
          <span className="text-xs font-bold text-primary px-2.5 py-1 rounded-lg bg-slate-100">
            {language === 'ar' ? 'العربية' : 'English'}
          </span>
        </button>

        <button
          onClick={() => onNavigate('faq')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <HelpCircle size={18} />
            </div>
            <span className="text-sm font-bold text-slate-800">{language === 'ar' ? 'الأسئلة الشائعة' : 'FAQs'}</span>
          </div>
          <ChevronRight size={18} className={`text-slate-400 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={() => onNavigate('support')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Headphones size={18} />
            </div>
            <span className="text-sm font-bold text-slate-800">{language === 'ar' ? 'الدعم الفني' : 'Technical Support'}</span>
          </div>
          <ChevronRight size={18} className={`text-slate-400 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={() => onNavigate('about')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Info size={18} />
            </div>
            <span className="text-sm font-bold text-slate-800">{language === 'ar' ? 'عن منصة إيوان' : 'About Ewan App'}</span>
          </div>
          <ChevronRight size={18} className={`text-slate-400 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={onLogout}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-red-50 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <LogOut size={18} />
            </div>
            <span className="text-sm font-bold text-red-600">{language === 'ar' ? 'تسجيل الخروج' : 'Log Out'}</span>
          </div>
        </button>
      </div>
    </div>
  );
};

