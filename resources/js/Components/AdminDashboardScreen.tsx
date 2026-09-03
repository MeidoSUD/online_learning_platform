import React, { useState } from 'react';
import { AuthResponse } from '../Services/api';
import { 
  AdminSidebar, UsersTab, EducationTab, PayoutsTab, VerificationsTab, 
  BookingsTab, AdminDisputesTab, CoursesTab, AdminOverviewTab, 
  AdsTab, AdminSettingsTab, AdminServicesTab, AdminOrdersTab, AdminPercentageTab, AdminAppConfigTab, AdminSessionsTab,
  TermsTab, PackagesTab, AdminPaymentsTab, ApiAnalyticsTab, ActivityRecordsTab, SystemLogsTab, CertificatesTab, InstructionsTab, MarketingNotificationsTab, ConsultationTab
} from './admin';
import { Menu } from 'lucide-react';

import { useLanguage } from '../Contexts/LanguageContext';

interface AdminDashboardScreenProps {
  data: AuthResponse;
  onLogout: () => void;
  role?: string;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ data, onLogout, role }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(role === 'support' ? 'users' : 'overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverviewTab />;
      case 'users':
        return <UsersTab />;
      case 'services':
        return <AdminServicesTab />;
      case 'orders':
        return <AdminOrdersTab />;
      case 'consultations':
        return <ConsultationTab />;
      case 'courses':
        return <CoursesTab />;
      case 'bookings':
        return <BookingsTab />;
      case 'sessions':
        return <AdminSessionsTab />;
      case 'education':
        return <EducationTab />;
      case 'payouts':
        return <PayoutsTab />;
      case 'verifications':
        return <VerificationsTab />;
      case 'disputes':
        return <AdminDisputesTab />;
      case 'percentage':
        return <AdminPercentageTab />;
      case 'ads':
        return <AdsTab />;
      case 'terms':
        return <TermsTab />;
      case 'instructions':
        return <InstructionsTab />;
      case 'appConfig':
        return <AdminAppConfigTab />;
      case 'settings':
        return <AdminSettingsTab />;
      case 'packages':
        return <PackagesTab />;
      case 'payments':
        return <AdminPaymentsTab />;
      case 'apiAnalytics':
        return <ApiAnalyticsTab />;
      case 'activityRecords':
        return <ActivityRecordsTab />;
      case 'systemLogs':
        return <SystemLogsTab />;
      case 'certificates':
        return <CertificatesTab />;
      case 'marketingNotifications':
        return <MarketingNotificationsTab />;
      default:
        return <AdminOverviewTab />;
    }
  };

  return (
    <div className="h-screen bg-[var(--light-bg)] flex overflow-hidden font-sans">
      <AdminSidebar
        role={role}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-[var(--border)] shadow-[var(--shadow-sm)] p-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="text-navy">
            <Menu size={24} />
          </button>
          <h1 className="font-bold text-lg text-navy">{t.adminPanel}</h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
