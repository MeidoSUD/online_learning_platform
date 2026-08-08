
import React from 'react';
import { useLanguage } from '../Contexts/LanguageContext';
import { Button } from './ui/Button';
import { AuthResponse } from '../Services/api';

interface DashboardScreenProps {
  data: AuthResponse;
  onLogout: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ data, onLogout }) => {
  const { t, direction } = useLanguage();

  return (
    <div className="w-full max-w-3xl space-y-8 bg-white p-8 rounded-[var(--radius-md)] shadow-xl border border-[var(--border)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
        <div>
            <h2 className="text-2xl font-bold text-text">Dashboard</h2>
            <p className="text-[var(--text-muted)]">Welcome, {data.user.data.first_name}</p>
        </div>
        <Button onClick={onLogout} variant="outline" className="text-error border-error/20 hover:bg-error/5">
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-[var(--radius-md)] bg-[var(--light-bg)] border border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-2">User Role</h3>
            <span className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary font-bold text-sm">
                {data.user.role?.toUpperCase() ?? 'USER'}
            </span>
        </div>
        <div className="p-4 rounded-[var(--radius-md)] bg-[var(--light-bg)] border border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase mb-2">Contact</h3>
            <p className="text-text font-medium">{data.user.data.email}</p>
            <p className="text-text font-medium mt-1" dir="ltr">{data.user.data.phone_number}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-text">Raw API Response</h3>
        <div className="w-full overflow-hidden rounded-lg bg-slate-900 p-4" dir="ltr">
            <pre className="text-xs text-green-400 font-mono overflow-auto max-h-80">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
      </div>
    </div>
  );
};
