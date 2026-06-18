import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Direction, Translations } from '../Utils/types';
import { TRANSLATIONS } from '../Utils/constants';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  t: Translations;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [direction, setDirection] = useState<Direction>('ltr');

  useEffect(() => {
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    setDirection(dir);
    // Update HTML tag for Tailwind RTL support
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    // Switch font family
    document.body.style.fontFamily = language === 'ar' ? "'Cairo', sans-serif" : "'Inter', sans-serif";
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const value = {
    language,
    direction,
    t: TRANSLATIONS[language],
    setLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};