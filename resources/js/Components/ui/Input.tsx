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
      <label className="block text-sm font-bold text-navy mb-1">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className={`absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] ${direction === 'rtl' ? 'right-3' : 'left-3'}`}>
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`
            w-full rounded-lg border bg-white py-3 text-[var(--text-main)] shadow-[var(--shadow-sm)] transition-all
            focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none
            disabled:cursor-not-allowed disabled:bg-[var(--light-bg)] disabled:text-[var(--text-muted)]
            ${error ? 'border-error' : 'border-[var(--border)]'}
            ${icon ? (direction === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4') : 'px-4'}
            ${className}
          `}
        />
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
};
