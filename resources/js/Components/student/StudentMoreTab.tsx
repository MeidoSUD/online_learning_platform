import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  Calendar,
  FileText,
  Layers,
  User,
  Users,
  Tune,
  Sliders,
  HelpCircle,
  AlertTriangle,
  Headphones,
  Info,
  LogOut,
  ChevronRight,
  Globe,
  Video
} from 'lucide-react';
import { UserData, getStorageUrl } from '../../Services/api';

interface StudentMoreTabProps {
  user: UserData;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
}

export const StudentMoreTab: React.FC<StudentMoreTabProps> = ({ user, onNavigate, onLogout }) => {
  const { t, language, setLanguage, direction } = useLanguage();
  const photo = user?.profile?.profile_photo || user?.profile_image;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-12">
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center font-black text-xl overflow-hidden shrink-0 shadow-inner">
            {photo ? (
              <img src={getStorageUrl(photo)} alt={user.first_name} className="w-full h-full object-cover" />
            ) : (
              (user.first_name?.charAt(0) || 'U').toUpperCase()
            )}
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">{user.first_name} {user.last_name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('profile')}
          className="text-xs font-bold text-primary bg-primary-pale hover:bg-primary-pale/80 px-3.5 py-2 rounded-xl transition-colors"
        >
          {language === 'ar' ? 'الملف الشخصي' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div
          onClick={() => onNavigate('bookings')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer text-center flex flex-col items-center justify-center group"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Calendar size={22} />
          </div>
          <span className="text-xs font-bold text-slate-800">{language === 'ar' ? 'حجوزاتي' : 'My Bookings'}</span>
        </div>

        <div
          onClick={() => onNavigate('orders')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer text-center flex flex-col items-center justify-center group"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <FileText size={22} />
          </div>
          <span className="text-xs font-bold text-slate-800">{language === 'ar' ? 'طلباتي' : 'My Requests'}</span>
        </div>

        <div
          onClick={() => onNavigate('subscriptions')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer text-center flex flex-col items-center justify-center group"
        >
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Layers size={22} />
          </div>
          <span className="text-xs font-bold text-slate-800">{language === 'ar' ? 'اشتراكاتي' : 'Subscriptions'}</span>
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
            <span className="text-sm font-bold text-slate-800">{language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}</span>
          </div>
          <ChevronRight size={18} className={`text-slate-400 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={() => onNavigate('sessions')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Video size={18} />
            </div>
            <span className="text-sm font-bold text-slate-800">{language === 'ar' ? 'جلساتي' : 'My Sessions'}</span>
          </div>
          <ChevronRight size={18} className={`text-slate-400 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={() => onNavigate('group-sessions')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={18} />
            </div>
            <span className="text-sm font-bold text-slate-800">{language === 'ar' ? 'الجلسات الجماعية' : 'Group Sessions'}</span>
          </div>
          <ChevronRight size={18} className={`text-slate-400 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
        </button>

        <button
          onClick={() => onNavigate('service-preferences')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <span className="text-sm font-bold text-slate-800">{language === 'ar' ? 'تفضيلات الخدمات التعليمية' : 'Service Preferences'}</span>
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
          onClick={() => onNavigate('disputes')}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
            <span className="text-sm font-bold text-slate-800">{language === 'ar' ? 'الشكاوى والنزاعات' : 'Complaints & Disputes'}</span>
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

