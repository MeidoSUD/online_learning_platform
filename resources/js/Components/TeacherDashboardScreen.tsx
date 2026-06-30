
import React, { useState } from 'react';
import { profileService, AuthResponse } from '../Services/api';
import { Navbar } from './Navbar';
import { OverviewTab } from './dashboard/OverviewTab';
import { ScheduleTab } from './dashboard/ScheduleTab';
import { WalletTab } from './dashboard/WalletTab';
import { BankAccountsPage } from './dashboard/BankAccountsPage';
import { SubjectsTab } from './dashboard/SubjectsTab';
import { ProfileTab } from './dashboard/ProfileTab';
import { TeacherServicesTab } from './teacher/TeacherServicesTab';
import { TeacherCoursesTab } from './teacher/TeacherCoursesTab';
import { TeacherLanguagesTab } from './teacher/TeacherLanguagesTab';
import { DisputesTab } from './student/DisputesTab';
import { SettingsTab } from './dashboard/SettingsTab';
import { Bug, User, Briefcase, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../Contexts/LanguageContext';
import { useToast } from '../Contexts/ToastContext';
import { Button } from './ui/Button';
import { AdsBanner } from './dashboard/AdsBanner';

interface TeacherDashboardScreenProps {
  data: AuthResponse;
  onLogout: () => void;
}

export const TeacherDashboardScreen: React.FC<TeacherDashboardScreenProps> = ({ data, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showDebug, setShowDebug] = useState(false);
  const [isUpdatingType, setIsUpdatingType] = useState(false);
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const user = data.user.data;

  // Requirement: Teacher profile completion screen must allow selecting Individual vs Institute
  const [showCompletion, setShowCompletion] = useState(!user.teacher_type);

  const handleSelectType = async (type: 'individual' | 'institute') => {
    setIsUpdatingType(true);
    try {
      const formData = new FormData();
      formData.append('teacher_type', type);
      // We use profile update API as per requirements
      await profileService.updateProfile(formData);

      // Refresh to get updated user data
      window.location.reload();
    } catch (e) {
      console.error("Failed to update teacher type", e);
      showToast("Failed to update profile. Please try again.", 'error');
    } finally {
      setIsUpdatingType(false);
    }
  };

  // =========================================================
  // !! CRITICAL VERIFICATION RULE !!
  // ONLY check 'user.verified' (root level). 
  // Do NOT check profile.verified, profile.is_active, or services.
  // =========================================================

  const isVerifiedRaw = user.verified;
  const isVerified =
    isVerifiedRaw === true ||
    isVerifiedRaw === 1 ||
    String(isVerifiedRaw) === '1' ||
    String(isVerifiedRaw).toLowerCase() === 'true';

  if (showCompletion) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-slate-100 animate-fade-in">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
              {t.completeProfile}
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              {t.welcomeToEwan}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            {/* Individual Teacher */}
            <div
              onClick={() => !isUpdatingType && handleSelectType('individual')}
              className="group cursor-pointer relative bg-white border-2 border-slate-100 rounded-3xl p-8 hover:border-primary hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300"
            >
              <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <User size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {t.individualTeacher}
              </h3>
              <p className="text-slate-500 leading-relaxed">
                {t.individualTeacherDesc}
              </p>
              <div className="mt-6 flex items-center text-primary font-bold">
                {t.selectThisType} <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Institute / Training Center */}
            <div
              onClick={() => !isUpdatingType && handleSelectType('institute')}
              className="group cursor-pointer relative bg-white border-2 border-slate-100 rounded-3xl p-8 hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-600/10 transition-all duration-300"
            >
              <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Briefcase size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {t.trainingInstitute}
              </h3>
              <p className="text-slate-500 leading-relaxed">
                {t.trainingInstituteDesc}
              </p>
              <div className="mt-6 flex items-center text-blue-600 font-bold">
                {t.selectThisType} <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 py-4">
            <span className="animate-spin text-primary h-8 w-8 border-4 border-t-transparent rounded-full" />
            <p className="text-slate-500 font-medium">{t.updating}</p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab user={user} onNavigate={setActiveTab} />;
      case 'schedule':
        return <ScheduleTab user={user} />;
      case 'private-lessons':
        return <SubjectsTab user={user} />;
      case 'courses':
        return <TeacherCoursesTab user={user} />;
      case 'languages':
        return <TeacherLanguagesTab user={user} />;
      case 'wallet':
        return <WalletTab user={user} onNavigate={setActiveTab} />;
      case 'bank-accounts':
        return <BankAccountsPage user={user} onNavigate={setActiveTab} />;
      case 'profile':
        return <ProfileTab />;
      case 'services':
        return <TeacherServicesTab onNavigate={setActiveTab} />;
      case 'disputes':
        return <DisputesTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <OverviewTab user={user} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans pb-10">
      <Navbar
        userData={data}
        onLogout={onLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdsBanner />
        {!isVerified && (
          <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm animate-fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-amber-800">
                  {language === 'ar' ? 'الحساب غير موثق' : 'Account Not Verified'}
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    {language === 'ar'
                      ? 'يرجى اختيار خدمة واحدة ورفع الشهادة الأكاديمية المطلوبة لتفعيل حسابك والبدء في استخدام المنصة.'
                      : 'Please choose a service and upload your certificate to verify your account. You cannot manage subjects or courses until verified.'}
                  </p>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('services')}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-amber-700 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  >
                    {language === 'ar' ? 'الذهاب للخدمات' : 'Go to Services'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDebug(!showDebug)}
                    className="inline-flex items-center px-2 py-1 text-xs text-amber-600/60 hover:text-amber-800"
                  >
                    <Bug size={12} className="mr-1" /> Debug Info
                  </button>
                </div>

                {/* DEBUG BLOCK - Helps identify exactly what value is being received */}
                {showDebug && (
                  <div className="mt-4 p-3 bg-white/80 rounded border border-amber-200 text-xs font-mono text-slate-600 overflow-x-auto">
                    <p className="font-bold text-red-500 mb-1">VERIFICATION DEBUG:</p>
                    <ul className="list-disc pl-4 mb-2 space-y-1">
                      <li>Raw value (user.verified): <strong>{String(isVerifiedRaw)}</strong> (Type: {typeof isVerifiedRaw})</li>
                      <li>Calculated isVerified: <strong>{String(isVerified)}</strong></li>
                    </ul>
                    <p className="font-bold text-slate-700 mt-2">Full User Object:</p>
                    <pre>{JSON.stringify(user, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
};
