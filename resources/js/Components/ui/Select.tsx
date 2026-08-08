import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, options, error, className = '', ...props }) => {
  const { direction } = useLanguage();

  return (
    <div className="mb-4 w-full">
      <label className="block text-sm font-medium text-navy mb-1">
        {label}
      </label>
      <div className="relative">
        <select
          {...props}
          className={`
            w-full appearance-none rounded-lg border bg-white py-3 px-4 text-[var(--text-main)] shadow-[var(--shadow-sm)] transition-all
            focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
            disabled:cursor-not-allowed disabled:bg-[var(--light-bg)] disabled:text-[var(--text-muted)]
            ${error ? 'border-error' : 'border-[var(--border)]'}
            ${className}
          `}
        >
          {/* Placeholder is now handled by the first option passed in props */}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] ${direction === 'rtl' ? 'left-3' : 'right-3'}`}>
          <ChevronDown size={20} />
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
};