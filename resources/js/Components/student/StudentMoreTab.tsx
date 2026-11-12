import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { 
  User, 
  Calendar, 
  FileText, 
  Package, 
  Tune, 
  SlidersHorizontal,
  Globe, 
  HelpCircle, 
  Gavel, 
  Headphones, 
  Info, 
  LogOut, 
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { UserData, getStorageUrl } from '../../Services/api';

interface StudentMoreTabProps {
  user: UserData;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
}

export const StudentMoreTab: React.FC<StudentMoreTabProps> = ({ user, onNavigate, onLogout }) => {
  const { language, setLanguage, direction } = useLanguage();

  const handleLogout = () => {
    const confirmed = window.confirm(
      language === 'ar' ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to log out?'
    );
    if (confirmed) {
      onLogout();
    }
  };

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'الطالب';
  const profilePhoto = user.profile?.profile_photo || (user as any).profile_image;
  const ChevronIcon = direction === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="bg-white rounded-3xl p-6 border border-[var(--border)] shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-xl flex items-center justify-center overflow-hidden shrink-0 shadow-md">
            {profilePhoto ? (
              <img src={getStorageUrl(profilePhoto)} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              (user.first_name?.charAt(0) || 'S').toUpperCase()
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-main)]">{fullName}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{user.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-pale text-primary">
              {language === 'ar' ? 'طالب معتمد' : 'Verified Student'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div
          onClick={() => onNavigate('bookings')}
          className="bg-white rounded-2xl p-4 border border-[var(--border)] shadow-sm hover:shadow-md hover:border-primary/40 transition-all text-center cursor-pointer flex flex-col items-center justify-center group"
        >
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Calendar size={22} />
          </div>
          <span className="text-xs font-bold text-[var(--text-main)] group-hover:text-primary transition-colors">
            {language === 'ar' ? 'حجوزاتي' : 'My Bookings'}
          </span>
        </div>

        <div
          onClick={() => onNavigate('orders')}
          className="bg-white rounded-2xl p-4 border border-[var(--border)] shadow-sm hover:shadow-md hover:border-primary/40 transition-all text-center cursor-pointer flex flex-col items-center justify-center group"
        >
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <FileText size={22} />
          </div>
          <span className="text-xs font-bold text-[var(--text-main)] group-hover:text-primary transition-colors">
            {language === 'ar' ? 'طلباتي' : 'My Orders'}
          </span>
        </div>

        <div
          onClick={() => onNavigate('subscriptions')}
          className="bg-white rounded-2xl p-4 border border-[var(--border)] shadow-sm hover:shadow-md hover:border-primary/40 transition-all text-center cursor-pointer flex flex-col items-center justify-center group"
        >
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Package size={22} />
          </div>
          <span className="text-xs font-bold text-[var(--text-main)] group-hover:text-primary transition-colors">
            {language === 'ar' ? 'اشتراكاتي' : 'Subscriptions'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[var(--border)] shadow-sm divide-y divide-[var(--border)] overflow-hidden">
        <div
          onClick={() => onNavigate('profile')}
          className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3.5">
            <User size={22} className="text-[#0D4A5F]" />
            <span className="text-[15px] font-medium text-[#0D4A5F]">
              {language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
            </span>
          </div>
          <ChevronIcon size={20} className="text-[#0D4A5F]/70" />
        </div>

        <div
          onClick={() => onNavigate('preferences')}
          className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3.5">
            <SlidersHorizontal size={22} className="text-[#0D4A5F]" />
            <span className="text-[15px] font-medium text-[#0D4A5F]">
              {language === 'ar' ? 'تفضيلات الخدمات التعليمية' : 'Service Preferences'}
            </span>
          </div>
          <ChevronIcon size={20} className="text-[#0D4A5F]/70" />
        </div>

        <div
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3.5">
            <Globe size={22} className="text-[#0D4A5F]" />
            <span className="text-[15px] font-medium text-[#0D4A5F]">
              {language === 'ar' ? 'لغة التطبيق' : 'Application Language'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#0D4A5F]/50">
              {language === 'ar' ? 'العربية' : 'English'}
            </span>
            <ChevronIcon size={20} className="text-[#0D4A5F]/70" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('support')}
          className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3.5">
            <HelpCircle size={22} className="text-[#0D4A5F]" />
            <span className="text-[15px] font-medium text-[#0D4A5F]">
              {language === 'ar' ? 'الأسئلة الشائعة' : 'FAQs'}
            </span>
          </div>
          <ChevronIcon size={20} className="text-[#0D4A5F]/70" />
        </div>

        <div
          onClick={() => onNavigate('disputes')}
          className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3.5">
            <Gavel size={22} className="text-[#0D4A5F]" />
            <span className="text-[15px] font-medium text-[#0D4A5F]">
              {language === 'ar' ? 'شكاواي ونزاعاتي' : 'My Complaints'}
            </span>
          </div>
          <ChevronIcon size={20} className="text-[#0D4A5F]/70" />
        </div>

        <div
          onClick={() => onNavigate('support')}
          className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3.5">
            <Headphones size={22} className="text-[#0D4A5F]" />
            <span className="text-[15px] font-medium text-[#0D4A5F]">
              {language === 'ar' ? 'الدعم الفني' : 'Technical Support'}
            </span>
          </div>
          <ChevronIcon size={20} className="text-[#0D4A5F]/70" />
        </div>

        <a
          href="/about"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 px-6 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3.5">
            <Info size={22} className="text-[#0D4A5F]" />
            <span className="text-[15px] font-medium text-[#0D4A5F]">
              {language === 'ar' ? 'عن التطبيق' : 'About App'}
            </span>
          </div>
          <ChevronIcon size={20} className="text-[#0D4A5F]/70" />
        </a>

        <div
          onClick={handleLogout}
          className="flex items-center justify-between p-4 px-6 hover:bg-red-50 cursor-pointer transition-colors text-red-600"
        >
          <div className="flex items-center gap-3.5">
            <LogOut size={22} className="text-red-600" />
            <span className="text-[15px] font-bold text-red-600">
              {language === 'ar' ? 'تسجيل الخروج' : 'Log Out'}
            </span>
          </div>
          <ChevronIcon size={20} className="text-red-400" />
        </div>
      </div>
    </div>
  );
};

