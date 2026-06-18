
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
    <div className="w-full max-w-3xl space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div>
            <h2 className="text-2xl font-bold text-text">Dashboard</h2>
            <p className="text-slate-500">Welcome, {data.user.data.first_name}</p>
        </div>
        <Button onClick={onLogout} variant="outline" className="text-error border-error/20 hover:bg-error/5">
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">User Role</h3>
            <span className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary font-bold text-sm">
                {data.user.role?.toUpperCase() ?? 'USER'}
            </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">Contact</h3>
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
