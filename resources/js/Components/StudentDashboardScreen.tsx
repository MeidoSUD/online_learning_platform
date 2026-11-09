import React, { useState, useEffect, useCallback } from 'react';
import { AuthResponse, TeacherProfile, studentService } from '../Services/api';
import { Loader2 } from 'lucide-react';
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
import { StudentOrdersTab } from './student/StudentOrdersTab';
import { StudentSubscriptionsTab } from './student/StudentSubscriptionsTab';
import { StudentMoreTab } from './student/StudentMoreTab';
import { ServicePreferencesTab } from './student/ServicePreferencesTab';
import { useLanguage } from '../Contexts/LanguageContext';
import { AdsBanner } from './dashboard/AdsBanner';

interface StudentDashboardScreenProps {
  data: AuthResponse;
  onLogout: () => void;
}

export const StudentDashboardScreen: React.FC<StudentDashboardScreenProps> = ({ data, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number>(3);
  const [loadingTeacher, setLoadingTeacher] = useState(false);

  const { t } = useLanguage();

  const updateUrl = useCallback((tab: string, teacherId?: number, serviceId?: number) => {
    const url = new URL(window.location.href);
    if (tab === 'overview') {
      url.searchParams.delete('tab');
      url.searchParams.delete('teacher_id');
      url.searchParams.delete('service_id');
    } else {
      url.searchParams.set('tab', tab);
      if (teacherId) {
        url.searchParams.set('teacher_id', String(teacherId));
      } else {
        url.searchParams.delete('teacher_id');
      }
      if (serviceId) {
        url.searchParams.set('service_id', String(serviceId));
      } else {
        url.searchParams.delete('service_id');
      }
    }
    window.history.pushState({}, '', `${url.pathname}${url.search}`);
  }, []);

  const loadTeacherDetails = useCallback(async (teacherId: number) => {
    setLoadingTeacher(true);
    try {
      const res = await studentService.getTeacherById(teacherId);
      if (res) {
        setSelectedTeacher(res);
        const primarySvc = res?.profile?.services?.[0] || res?.services?.[0];
        const sId = primarySvc?.service_id || (res?.main_service_key === 'language_learning' ? 2 : null);
        if (sId) {
          setSelectedServiceId(sId);
        }
      }
    } catch {
      setSelectedTeacher(null);
    } finally {
      setLoadingTeacher(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const teacherIdParam = params.get('teacher_id');
    const serviceIdParam = params.get('service_id');

    if (serviceIdParam) {
      const sId = parseInt(serviceIdParam, 10);
      if (!isNaN(sId) && sId > 0) setSelectedServiceId(sId);
    }

    if (tabParam === 'teacher-details' && teacherIdParam) {
      const tId = parseInt(teacherIdParam, 10);
      if (!isNaN(tId) && tId > 0) {
        setActiveTab('teacher-details');
        loadTeacherDetails(tId);
      }
    } else if (tabParam) {
      setActiveTab(tabParam);
    }

    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search);
      const currentTab = currentParams.get('tab') || 'overview';
      const currentTeacherId = currentParams.get('teacher_id');
      const currentServiceId = currentParams.get('service_id');

      if (currentServiceId) {
        const sId = parseInt(currentServiceId, 10);
        if (!isNaN(sId) && sId > 0) setSelectedServiceId(sId);
      }

      setActiveTab(currentTab);

      if (currentTab === 'teacher-details' && currentTeacherId) {
        const tId = parseInt(currentTeacherId, 10);
        if (!isNaN(tId) && tId > 0) {
          loadTeacherDetails(tId);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loadTeacherDetails]);

  const handleTeacherSelect = (teacher: any, serviceId: number) => {
    const primarySvc = teacher?.profile?.services?.[0] || teacher?.services?.[0];
    const actualServiceId = primarySvc?.service_id || (teacher?.main_service_key === 'language_learning' ? 2 : serviceId) || 3;
    setSelectedTeacher(teacher);
    setSelectedServiceId(actualServiceId);
    setActiveTab('teacher-details');
    updateUrl('teacher-details', teacher.id, actualServiceId);
  };

  const handleNavigate = (tab: string, serviceId?: number) => {
    if (serviceId) {
      setSelectedServiceId(serviceId);
    }
    setActiveTab(tab);
    updateUrl(tab, undefined, serviceId);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    updateUrl(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab user={data.user.data} onNavigate={handleNavigate} onTeacherSelect={(t, serviceId) => handleTeacherSelect(t, serviceId || 3)} />;
      case 'private-lessons':
        return <PrivateLessonsTab initialServiceId={selectedServiceId} onTeacherSelect={(t) => handleTeacherSelect(t, selectedServiceId || 3)} />;
      case 'courses':
        return <SubjectsTab />;
      case 'language-learning':
        return <LanguageLearningTab />;
      case 'teacher-details':
        if (loadingTeacher) {
          return (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="animate-spin text-primary h-10 w-10 mb-4" />
              <p className="text-[var(--text-muted)] text-sm font-medium">جاري تحميل بيانات الأستاذ...</p>
            </div>
          );
        }
        if (!selectedTeacher) {
          return <PrivateLessonsTab initialServiceId={selectedServiceId || 3} onTeacherSelect={(t) => handleTeacherSelect(t, 3)} />;
        }
        return (
          <TeacherDetailsPage
            teacher={selectedTeacher}
            serviceId={selectedServiceId}
            onBack={() => handleNavigate('overview')}
            onBookingComplete={() => handleNavigate('bookings')}
          />
        );
      case 'schedule':
        return <StudentScheduleTab onViewList={() => handleNavigate('bookings')} />;
      case 'sessions':
        return <MySessionsTab />;
      case 'favorites':
        return <FavoritesTab />;
      case 'ai':
        return <AiAssistantTab />;
      case 'orders':
        return <StudentOrdersTab />;
      case 'subscriptions':
        return <StudentSubscriptionsTab onNavigateToBooking={() => handleNavigate('private-lessons')} />;
      case 'preferences':
        return <ServicePreferencesTab onBack={() => handleNavigate('more')} />;
      case 'more':
        return <StudentMoreTab user={data.user.data} onNavigate={handleTabChange} onLogout={onLogout} />;
      case 'bookings':
        return <BookingsTab onViewCalendar={() => handleNavigate('schedule')} />;
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
        return <ProfileTab onNavigate={handleTabChange} />;
      case 'support':
        return <SupportTab />;
      case 'settings':
        return <ProfileTab onNavigate={handleTabChange} />;
      default:
        return <OverviewTab user={data.user.data} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className={`relative min-h-screen bg-[var(--light-bg)] font-sans ${activeTab === 'teacher-details' ? '' : 'pb-10'}`}>
      <div className="relative">
        {activeTab !== 'teacher-details' && (
          <Navbar
            userData={data}
            onLogout={onLogout}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
          />
        )}

        <main className={activeTab === 'teacher-details' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
          {activeTab === 'overview' && <AdsBanner />}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
