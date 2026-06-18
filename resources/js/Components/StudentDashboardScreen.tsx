

import React, { useState } from 'react';
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
import { SettingsTab } from './dashboard/SettingsTab';
import { useLanguage } from '../Contexts/LanguageContext';
import { AdsBanner } from './dashboard/AdsBanner';

interface StudentDashboardScreenProps {
  data: AuthResponse;
  onLogout: () => void;
}

export const StudentDashboardScreen: React.FC<StudentDashboardScreenProps> = ({ data, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number>(3); // Default to Private Lessons

  const { t } = useLanguage();

  const handleTeacherSelect = (teacher: TeacherProfile, serviceId: number) => {
    setSelectedTeacher(teacher);
    setSelectedServiceId(serviceId);
    setActiveTab('teacher-details');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab user={data.user.data} onNavigate={setActiveTab} />;
      case 'private-lessons':
        return <PrivateLessonsTab onTeacherSelect={(t) => handleTeacherSelect(t, 3)} />;
      case 'courses':
        return <SubjectsTab />;
      case 'language-learning':
        // Assuming service ID 2 for Language Learning based on context
        return <LanguageLearningTab />;
      case 'teacher-details':
        if (!selectedTeacher) return <PrivateLessonsTab onTeacherSelect={(t) => handleTeacherSelect(t, 3)} />;
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
      case 'bookings':
        return <BookingsTab onViewCalendar={() => setActiveTab('schedule')} />;
      case 'disputes':
        return <DisputesTab />;
      case 'wallet':
        return <PaymentMethodsTab />;
      case 'transactions':
        return <MyTransactions />;
      case 'certificates':
        return <MyCertificates />;
      case 'profile':
        return <ProfileTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <OverviewTab user={data.user.data} onNavigate={setActiveTab} />;
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
        {renderContent()}
      </main>
    </div>
  );
};
