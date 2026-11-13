import React, { useState, useEffect } from 'react';
import { authService, AuthResponse, UserData } from '../Services/api';
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
import { TeacherAbilitiesTab } from './teacher/TeacherAbilitiesTab';
import { TeacherLessonsTab } from './teacher/TeacherLessonsTab';
import { ConsultationTab } from './teacher/ConsultationTab';
import { DisputesTab } from './student/DisputesTab';
import { SupportTab } from './dashboard/SupportTab';
import { AiAssistantTab } from './dashboard/AiAssistantTab';
import { TeacherOrdersTab } from './teacher/TeacherOrdersTab';
import { TeacherPackagesTab } from './teacher/TeacherPackagesTab';
import { TeacherWithdrawalOptionsTab } from './teacher/TeacherWithdrawalOptionsTab';
import { TeacherWithdrawalCardsTab } from './teacher/TeacherWithdrawalCardsTab';
import { TeacherMoreTab } from './teacher/TeacherMoreTab';
import { TeacherMarketingTab } from './teacher/TeacherMarketingTab';
import { TeacherPublicProfileScreen } from './teacher/TeacherPublicProfileScreen';
import { ArrowRight, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../Contexts/LanguageContext';
import { AdsBanner } from './dashboard/AdsBanner';
import { getTeacherProfileCompleteness } from '../Utils/teacherProfileCompleteness';

interface TeacherDashboardScreenProps {
  data: AuthResponse;
  onLogout: () => void;
}

export const TeacherDashboardScreen: React.FC<TeacherDashboardScreenProps> = ({ data, onLogout }) => {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'sessions' || tabParam === 'my-lessons') return 'my-lessons';
      if (tabParam) return tabParam;
    }
    return 'overview';
  });
  const [freshUser, setFreshUser] = useState<UserData | null>(null);
  const { language } = useLanguage();

  const user = data.user.data as UserData;

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'sessions' || tabParam === 'my-lessons') {
        setActiveTab('my-lessons');
      } else if (tabParam) {
        setActiveTab(tabParam);
      } else {
        setActiveTab('overview');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    authService.getUserDetails()
      .then(res => {
        if (cancelled) return;
        const fresh = res.user?.data || res.data || res;
        if (fresh && fresh.id === user.id) setFreshUser(fresh);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activeTab, user.id]);

  const currentUser: UserData = freshUser || user;
  const completeness = getTeacherProfileCompleteness(currentUser);
  const isVerified = completeness.verified;

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab user={currentUser} onNavigate={setActiveTab} />;
      case 'orders':
        return <TeacherOrdersTab user={currentUser} />;
      case 'packages':
        return <TeacherPackagesTab user={currentUser} onNavigate={setActiveTab} />;
      case 'marketing':
        return <TeacherMarketingTab user={currentUser} onNavigate={setActiveTab} />;
      case 'withdrawal-options':
        return <TeacherWithdrawalOptionsTab onNavigate={setActiveTab} />;
      case 'withdrawal-cards':
        return <TeacherWithdrawalCardsTab onNavigate={setActiveTab} />;
      case 'more':
        return <TeacherMoreTab user={currentUser} onNavigate={setActiveTab} onLogout={onLogout} />;
      case 'public-profile':
        return <TeacherPublicProfileScreen user={currentUser} onBack={() => setActiveTab('more')} />;
      case 'schedule':
        return <ScheduleTab user={currentUser} />;
      case 'private-lessons':
      case 'subjects':
        return <SubjectsTab user={currentUser} onNavigate={setActiveTab} />;
      case 'courses':
        return <TeacherCoursesTab user={currentUser} />;
      case 'my-lessons':
      case 'sessions':
        return <TeacherLessonsTab user={currentUser} />;
      case 'consultations':
        return <ConsultationTab />;
      case 'languages':
        return <TeacherLanguagesTab user={currentUser} />;
      case 'abilities':
        return <TeacherAbilitiesTab user={currentUser} />;
      case 'wallet':
        return <WalletTab user={currentUser} onNavigate={setActiveTab} />;
      case 'bank-accounts':
        return <BankAccountsPage user={currentUser} onNavigate={setActiveTab} />;
      case 'profile':
        return <ProfileTab onNavigate={setActiveTab} />;
      case 'services':
        return <TeacherServicesTab onNavigate={setActiveTab} />;
      case 'support':
        return <SupportTab />;
      case 'disputes':
        return <DisputesTab />;
      case 'ai':
        return <AiAssistantTab />;
      case 'settings':
        return <ProfileTab onNavigate={setActiveTab} />;
      default:
        return <OverviewTab user={currentUser} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--light-bg)] font-sans pb-10">
      <Navbar
        userData={data}
        onLogout={onLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab !== 'overview' && <AdsBanner />}
        {activeTab !== 'overview' && completeness.missing.length > 0 && (
          <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-[var(--shadow-sm)] animate-fade-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-amber-800">
                  {language === 'ar' ? 'أكمل ملفك الشخصي' : 'Complete Your Profile'}
                </h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    {language === 'ar'
                      ? 'ملفك الشخصي غير مكتمل بعد. أكمل الخطوات التالية حتى تتمكن من تفعيل الحزم وبدء العمل:'
                      : 'Your profile is not complete yet. Complete the steps below so you can enable packages and start working:'}
                  </p>
                </div>

                <ul className="mt-3 space-y-1.5">
                  {completeness.missing.map(m => (
                    <li key={m.key} className="flex items-center justify-between gap-3 bg-white/70 rounded-lg px-3 py-2">
                      <span className="text-xs font-semibold text-amber-800">
                        {language === 'ar' ? m.textAr : m.textEn}
                      </span>
                      {m.lockedBeforeVerification && !isVerified ? (
                        <span className="text-[10px] font-semibold text-amber-500 uppercase">
                          {language === 'ar' ? 'بعد التوثيق' : 'After verification'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveTab(m.tab)}
                          className="text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md px-2 py-1 inline-flex items-center gap-1"
                        >
                          {language === 'ar' ? 'اذهب' : 'Go'}
                          {language === 'ar' ? <ArrowLeft size={11} /> : <ArrowRight size={11} />}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>

                {!isVerified && (
                  <p className="mt-3 text-[11px] text-amber-600">
                    {language === 'ar'
                      ? 'بعد إتمام الخطوات أعلاه، سيراجع فريق الإدارة حسابك للتوثيق قبل تفعيل الحزم.'
                      : 'After completing the steps above, our admin team will review your account for verification before packages can be enabled.'}
                  </p>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('services')}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-amber-700 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                  >
                    {language === 'ar' ? 'الذهاب للخدمات' : 'Go to Services'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
};
