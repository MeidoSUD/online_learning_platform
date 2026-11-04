import React, { useState, useEffect } from 'react';
import { AuthResponse, TeacherProfile } from '../Services/api';
import { Navbar } from './Navbar';
import { OverviewTab } from './student/OverviewTab';
import { PrivateLessonsTab } from './student/PrivateLessonsTab';
import { SubjectsTab } from './student/SubjectsTab';
import { LanguageLearningTab } from './student/LanguageLearningTab';
import { StudentScheduleTab } from './student/StudentScheduleTab';
import { BookingsTab } from './student/BookingsTab';
import { DisputesTab } from './student/DisputesTab';
import { PaymentMethodsTab } from './student/PaymentMethodsTab';
import { ProfileTab } from './dashboard/ProfileTab';
import { TeacherDetailsPage } from './student/TeacherDetailsPage';
import { MyTransactions } from './student/MyTransactions';
import { MyCertificates } from './student/MyCertificates';
import { MySessionsTab } from './student/MySessionsTab';
import { SupportTab } from './dashboard/SupportTab';
import { ConsultationTab } from './student/ConsultationTab';
import { AiAssistantTab } from './dashboard/AiAssistantTab';
import { FavoritesTab } from './student/FavoritesTab';
import { StudentGroupClassesTab } from './student/StudentGroupClassesTab';
import { StudentGroupSessionsTab } from './student/StudentGroupSessionsTab';
import { StudentOrdersTab } from './student/StudentOrdersTab';
import { StudentSubscriptionsTab } from './student/StudentSubscriptionsTab';
import { StudentMoreTab } from './student/StudentMoreTab';
import { ServicePreferencesTab } from './student/ServicePreferencesTab';
import { FaqTab } from './dashboard/FaqTab';
import { AboutAppTab } from './dashboard/AboutAppTab';
import { useLanguage } from '../Contexts/LanguageContext';
import { AdsBanner } from './dashboard/AdsBanner';

interface StudentDashboardScreenProps {
  data: AuthResponse;
  onLogout: () => void;
}

export const StudentDashboardScreen: React.FC<StudentDashboardScreenProps> = ({ data, onLogout }) => {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab) return tab;
    }
    return 'overview';
  });
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | string>('');

  const { t } = useLanguage();

  useEffect(() => {
    if (typeof window !== 'undefined' && activeTab) {
      const url = new URL(window.location.href);
      if (url.searchParams.get('tab') !== activeTab) {
        url.searchParams.set('tab', activeTab);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activeTab]);

  const handleTeacherSelect = (teacher: TeacherProfile, serviceId?: number | string) => {
    setSelectedTeacher(teacher);
    const resolvedId = Number(serviceId) || Number((teacher as any)?.profile?.service) || Number((teacher as any)?.service) || 3;
    setSelectedServiceId(resolvedId);
    setActiveTab('teacher-details');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'teacher-details');
      if (teacher?.id) {
        url.searchParams.set('teacher_id', String(teacher.id));
        try {
          sessionStorage.setItem('selected_teacher_id', String(teacher.id));
          sessionStorage.setItem('selected_teacher_service_id', String(resolvedId));
        } catch (_) {}
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleNavigate = (tab: string, params?: any) => {
    if (params && 'service' in params) {
      setSelectedServiceId(params.service ? Number(params.service) : '');
    } else if (tab === 'private-lessons') {
      setSelectedServiceId('');
    }
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab user={data.user.data} onNavigate={handleNavigate} onTeacherSelect={(t, sid) => handleTeacherSelect(t, sid)} />;
      case 'private-lessons':
        return <PrivateLessonsTab initialServiceId={selectedServiceId} onTeacherSelect={(t) => handleTeacherSelect(t, selectedServiceId)} />;
      case 'courses':
        return <SubjectsTab />;
      case 'language-learning':
        return <LanguageLearningTab />;
      case 'group-classes':
        return <StudentGroupClassesTab onNavigateToSessions={() => setActiveTab('group-sessions')} />;
      case 'group-sessions':
        return <StudentGroupSessionsTab onBackToClasses={() => setActiveTab('group-classes')} />;
      case 'orders':
        return <StudentOrdersTab />;
      case 'subscriptions':
        return <StudentSubscriptionsTab />;
      case 'more':
        return <StudentMoreTab user={data.user.data} onNavigate={setActiveTab} onLogout={onLogout} />;
      case 'service-preferences':
        return <ServicePreferencesTab />;
      case 'faq':
        return <FaqTab />;
      case 'about':
        return <AboutAppTab />;
      case 'teacher-details':
        return (
          <TeacherDetailsPage
            teacher={selectedTeacher}
            serviceId={selectedServiceId}
            onBack={() => setActiveTab('private-lessons')}
            onBookingComplete={() => setActiveTab('bookings')}
          />
        );
      case 'schedule':
        return <StudentScheduleTab onViewList={() => setActiveTab('bookings')} />;
      case 'sessions':
        return <MySessionsTab user={data.user.data} onTeacherSelect={(t) => handleTeacherSelect(t)} />;
      case 'favorites':
        return <FavoritesTab />;
      case 'ai':
        return <AiAssistantTab />;
      case 'bookings':
        return <BookingsTab onViewCalendar={() => setActiveTab('schedule')} />;
      case 'consultations':
        return <ConsultationTab />;
      case 'disputes':
        return <DisputesTab />;
      case 'wallet':
        return <PaymentMethodsTab />;
      case 'transactions':
        return <MyTransactions />;
      case 'certificates':
        return <MyCertificates />;
      case 'profile':
        return <ProfileTab onNavigate={setActiveTab} />;
      case 'support':
        return <SupportTab />;
      case 'settings':
        return <ProfileTab onNavigate={setActiveTab} />;
      default:
        return <OverviewTab user={data.user.data} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--light-bg)] font-sans pb-10">
      <div className="relative">
        <Navbar
          userData={data}
          onLogout={onLogout}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdsBanner />
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
