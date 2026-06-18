import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { ChevronDown, Check } from 'lucide-react';
import { COUNTRIES } from '../../Utils/constants';

interface CountrySelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({ label, value, onChange, error }) => {
  const { direction } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry = COUNTRIES.find(c => c.label === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="mb-4 w-full" ref={dropdownRef}>
      <label className="block text-sm font-medium text-text mb-1">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full flex items-center justify-between rounded-lg border bg-white py-3 px-4 text-text shadow-sm transition-all
            focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
            ${error ? 'border-error' : 'border-slate-200'}
          `}
        >
          <span className={`flex items-center gap-2 ${!selectedCountry ? 'text-slate-400' : ''}`}>
            {selectedCountry ? (
              <>
                <span className="text-lg">{selectedCountry.flag}</span>
                <span>{selectedCountry.label}</span>
              </>
            ) : (
              label
            )}
          </span>
          <ChevronDown size={20} className="text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {COUNTRIES.map((country) => (
              <div
                key={country.code}
                onClick={() => {
                  onChange(country.label);
                  setIsOpen(false);
                }}
                className="flex cursor-pointer items-center justify-between py-2 px-4 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{country.flag}</span>
                  <span className="block truncate font-normal text-text">{country.label}</span>
                </div>
                {value === country.label && (
                  <Check size={16} className="text-primary" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
};