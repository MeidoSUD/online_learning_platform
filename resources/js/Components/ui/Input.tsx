import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  const { direction } = useLanguage();
  
  return (
    <div className="mb-4 w-full">
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${direction === 'rtl' ? 'right-3' : 'left-3'}`}>
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`
            w-full rounded-lg border bg-white py-3 text-slate-900 shadow-sm transition-all
            focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
            disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
            ${error ? 'border-error' : 'border-slate-200'}
            ${icon ? (direction === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4') : 'px-4'}
            ${className}
          `}
        />
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
};
